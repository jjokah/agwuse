import { beforeEach, afterAll, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ actor: "missing-actor", after: vi.fn() }));
vi.mock("@/lib/auth", () => ({ requireRole: async () => ({ user: { id: mocks.actor, role: "ADMIN" } }) }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("next/server", async (original) => ({ ...(await original<typeof import("next/server")>()), after: mocks.after }));
vi.mock("@/lib/email/send", () => ({ sendAccountApprovedEmail: vi.fn() }));
vi.mock("@/lib/sanitize", () => ({ sanitizeHtml: (value: string) => value }));
import { prisma } from "@/lib/prisma";
import { approveUser, reactivateUser } from "@/lib/actions/admin-actions";
import { createPledge, cancelPledge } from "@/lib/actions/finance-actions";
import { deleteBlogPost, approveSubmission, deleteDepartment, updateLiveStreamConfig } from "@/lib/actions/content-actions";
import { createUser, resetDatabase, formData } from "./helpers";

beforeEach(async () => { await resetDatabase(); mocks.actor = "missing-actor"; mocks.after.mockClear(); });
afterAll(async () => prisma.$disconnect());
describe("sensitive mutations roll back when audit persistence fails", () => {
  it.each(["PENDING", "INACTIVE"] as const)("keeps %s accounts unchanged and sends no approval email", async (status) => {
    const user = await createUser("MEMBER");
    await prisma.user.update({ where: { id: user.id }, data: { status } });
    const result = status === "PENDING" ? await approveUser(user.id) : await reactivateUser(user.id);
    expect(result.success).toBe(false);
    expect(await prisma.user.findUniqueOrThrow({ where: { id: user.id } })).toMatchObject({ status, tokenVersion: user.tokenVersion });
    expect(mocks.after).not.toHaveBeenCalled();
  });
  it("does not create a pledge or cancel an existing pledge without an audit", async () => {
    const member = await createUser("MEMBER");
    expect((await createPledge(formData({ title: "Launch pledge", amount: "1000", startDate: "2026-10-09", memberId: member.id }))).success).toBe(false);
    expect(await prisma.pledge.count()).toBe(0);
    const pledge = await prisma.pledge.create({ data: { title: "Existing pledge", amount: 1000, startDate: new Date("2026-10-09"), memberId: member.id } });
    expect((await cancelPledge(pledge.id)).success).toBe(false);
    expect((await prisma.pledge.findUniqueOrThrow({ where: { id: pledge.id } })).status).toBe("ACTIVE");
  });
  it("retains content and does not schedule media deletion", async () => {
    const author = await createUser("ADMIN");
    const post = await prisma.blogPost.create({ data: { title: "Rollback post", slug: "rollback-post", content: "Content to keep", authorId: author.id, featuredImage: "https://store.public.blob.vercel-storage.com/blog/keep.png" } });
    expect((await deleteBlogPost(post.id)).success).toBe(false);
    expect(await prisma.blogPost.findUnique({ where: { id: post.id } })).not.toBeNull();
    expect(mocks.after).not.toHaveBeenCalled();
  });
  it("keeps moderation pending when its audit cannot be written", async () => {
    const submission = await prisma.submission.create({ data: { type: "PRAYER_REQUEST", content: "Please pray for our family" } });
    expect((await approveSubmission(submission.id)).success).toBe(false);
    expect((await prisma.submission.findUniqueOrThrow({ where: { id: submission.id } })).status).toBe("PENDING");
  });
  it("restores department assignments on failed deletion and audit", async () => {
    const department = await prisma.department.create({ data: { name: "Keep department", category: "MINISTRY" } });
    const member = await createUser("MEMBER");
    await prisma.user.update({ where: { id: member.id }, data: { departmentId: department.id } });
    expect((await deleteDepartment(department.id)).success).toBe(false);
    expect(await prisma.department.findUnique({ where: { id: department.id } })).not.toBeNull();
    expect((await prisma.user.findUniqueOrThrow({ where: { id: member.id } })).departmentId).toBe(department.id);
  });
  it("does not persist livestream settings without an audit", async () => {
    expect((await updateLiveStreamConfig(formData({ title: "Sunday worship", isLive: "on" }))).success).toBe(false);
    expect(await prisma.liveStreamConfig.count()).toBe(0);
    const actor = await createUser("ADMIN"); mocks.actor = actor.id;
    expect((await updateLiveStreamConfig(formData({ title: "Sunday worship", isLive: "on" }))).success).toBe(true);
    expect(await prisma.auditLog.count({ where: { action: "UPDATE_LIVE_STREAM_CONFIG" } })).toBe(1);
  });
});
