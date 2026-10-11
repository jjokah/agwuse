import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ after: vi.fn(), del: vi.fn(), count: vi.fn(), userUpdate: vi.fn(), contentUpdate: vi.fn() }));
vi.mock("@vercel/blob", () => ({ del: mocks.del }));
vi.mock("@/lib/auth", () => ({ requireAuth: async () => ({ user: { id: "member" } }), requireRole: async () => ({ user: { id: "admin" } }) }));
vi.mock("next/server", () => ({ after: mocks.after }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn(), revalidateTag: vi.fn() }));
vi.mock("@/lib/sanitize", () => ({ sanitizeHtml: (text: string) => text }));
vi.mock("@/lib/prisma", () => ({ prisma: {
  user: { findUnique: async () => ({ image: "https://store.public.blob.vercel-storage.com/avatars/member-old.png", profilePhoto: null }), update: mocks.userUpdate, count: mocks.count },
  blogPost: { findUnique: async () => ({ id: "post", slug: "post", featuredImage: "https://store.public.blob.vercel-storage.com/blog/old.png" }), update: mocks.contentUpdate, count: mocks.count },
  event: { findUnique: async () => ({ id: "event", imageUrl: "https://store.public.blob.vercel-storage.com/events/old.png" }), update: mocks.contentUpdate, count: mocks.count },
  sermon: { findUnique: async () => ({ id: "sermon", audioUrl: "https://store.public.blob.vercel-storage.com/sermons/old.mp3" }), update: mocks.contentUpdate, count: mocks.count },
  galleryImage: { count: mocks.count }, auditLog: { create: vi.fn() },
  $transaction: async (fn: (tx: unknown) => unknown) => fn({ blogPost: { update: mocks.contentUpdate }, event: { update: mocks.contentUpdate }, sermon: { update: mocks.contentUpdate }, auditLog: { create: vi.fn() } }),
} }));
import { updateProfile } from "@/lib/actions/user-actions";
import { updateBlogPost, updateEvent, updateSermon } from "@/lib/actions/content-actions";
import { deleteOwnedBlobs } from "@/lib/uploads/cleanup";
const form = (values: Record<string, string>) => { const data = new FormData(); Object.entries(values).forEach(([key, value]) => data.set(key, value)); return data; };
beforeEach(() => { vi.clearAllMocks(); mocks.count.mockResolvedValue(0); mocks.del.mockResolvedValue(undefined); vi.stubEnv("BLOB_READ_WRITE_TOKEN", "test-only"); });
afterEach(() => vi.unstubAllEnvs());
describe("asset cleanup after persistence", () => {
  it("never schedules avatar deletion when profile persistence fails", async () => {
    mocks.userUpdate.mockRejectedValue(new Error("Database unavailable"));
    expect((await updateProfile(form({ firstName: "Test", lastName: "Member", phone: "", address: "", occupation: "", dateOfBirth: "", image: "" }))).success).toBe(false);
    expect(mocks.after).not.toHaveBeenCalled();
  });
  it.each([
    [updateBlogPost, "post", { title: "Post title", content: "A complete post body", type: "BLOG", featuredImage: "" }],
    [updateEvent, "event", { title: "Event title", type: "SERVICE", startDate: "2026-10-08T12:00", imageUrl: "" }],
    [updateSermon, "sermon", { title: "Sermon title", speaker: "Pastor", date: "2026-10-08", audioUrl: "" }],
  ] as const)("never schedules content cleanup on failed mutation", async (update, id, values) => {
    mocks.contentUpdate.mockRejectedValue(new Error("Database unavailable"));
    expect((await update(id, form(values))).success).toBe(false);
    expect(mocks.after).not.toHaveBeenCalled();
  });
  it("retains shared assets and deletes only unreferenced URLs", async () => {
    const shared = "https://store.public.blob.vercel-storage.com/blog/shared.png";
    mocks.count.mockResolvedValueOnce(1);
    expect(await deleteOwnedBlobs([shared])).toEqual({ deleted: 0, errors: 0 });
    expect(mocks.del).not.toHaveBeenCalled();
    const unused = "https://store.public.blob.vercel-storage.com/blog/unused.png";
    expect(await deleteOwnedBlobs([unused, unused])).toEqual({ deleted: 1, errors: 0 });
    expect(mocks.del).toHaveBeenCalledWith([unused], { token: "test-only" });
  });
  it("schedules cleanup only after a successful committed sermon update", async () => {
    mocks.contentUpdate.mockResolvedValue({ id: "sermon" });
    const result = await updateSermon("sermon", form({ title: "Sermon title", speaker: "Pastor", date: "2026-10-09", audioUrl: "" }));
    expect(result.success).toBe(true);
    expect(mocks.after).toHaveBeenCalledOnce();
    expect(mocks.contentUpdate.mock.invocationCallOrder[0]).toBeLessThan(mocks.after.mock.invocationCallOrder[0]);
    expect(mocks.del).not.toHaveBeenCalled();
    await mocks.after.mock.calls[0][0]();
    expect(mocks.del).toHaveBeenCalledWith(["https://store.public.blob.vercel-storage.com/sermons/old.mp3"], { token: "test-only" });
  });
  it("does not delete anything when reference checking fails", async () => {
    mocks.count.mockRejectedValueOnce(new Error("Database unavailable"));
    expect((await deleteOwnedBlobs(["https://store.public.blob.vercel-storage.com/blog/asset.png"])).errors).toBe(1);
    expect(mocks.del).not.toHaveBeenCalled();
  });
});
