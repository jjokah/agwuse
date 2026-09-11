import { describe, it, expect } from "vitest";
import { canChangeRole, canManageUser, ROLE_VALUES } from "@/lib/authz/roles";

describe("canChangeRole", () => {
  it("prevents self-role-change", () => {
    const result = canChangeRole(
      { id: "u1", role: "SUPER_ADMIN" },
      { id: "u1", role: "SUPER_ADMIN" },
      "ADMIN",
    );
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("own role");
  });

  it("allows SUPER_ADMIN to assign ADMIN", () => {
    const result = canChangeRole(
      { id: "u1", role: "SUPER_ADMIN" },
      { id: "u2", role: "MEMBER" },
      "ADMIN",
    );
    expect(result.allowed).toBe(true);
  });

  it("blocks ADMIN from assigning SUPER_ADMIN", () => {
    const result = canChangeRole(
      { id: "u1", role: "ADMIN" },
      { id: "u2", role: "MEMBER" },
      "SUPER_ADMIN",
    );
    expect(result.allowed).toBe(false);
  });

  it("blocks ADMIN from modifying a SUPER_ADMIN", () => {
    const result = canChangeRole(
      { id: "u1", role: "ADMIN" },
      { id: "u2", role: "SUPER_ADMIN" },
      "MEMBER",
    );
    expect(result.allowed).toBe(false);
  });

  it("blocks ADMIN from demoting another ADMIN", () => {
    const result = canChangeRole(
      { id: "u1", role: "ADMIN" },
      { id: "u2", role: "ADMIN" },
      "MEMBER",
    );
    expect(result.allowed).toBe(false);
  });

  it("allows SUPER_ADMIN to demote an ADMIN", () => {
    const result = canChangeRole(
      { id: "u1", role: "SUPER_ADMIN" },
      { id: "u2", role: "ADMIN" },
      "MEMBER",
    );
    expect(result.allowed).toBe(true);
  });
});

describe("canManageUser", () => {
  it("prevents self-management", () => {
    const result = canManageUser(
      { id: "u1", role: "SUPER_ADMIN" },
      { id: "u1", role: "SUPER_ADMIN" },
    );
    expect(result.allowed).toBe(false);
  });

  it("blocks ADMIN from managing a SUPER_ADMIN", () => {
    const result = canManageUser(
      { id: "u1", role: "ADMIN" },
      { id: "u2", role: "SUPER_ADMIN" },
    );
    expect(result.allowed).toBe(false);
  });

  it("allows SUPER_ADMIN to manage anyone", () => {
    const result = canManageUser(
      { id: "u1", role: "SUPER_ADMIN" },
      { id: "u2", role: "ADMIN" },
    );
    expect(result.allowed).toBe(true);
  });

  it("allows ADMIN to manage a MEMBER", () => {
    const result = canManageUser(
      { id: "u1", role: "ADMIN" },
      { id: "u2", role: "MEMBER" },
    );
    expect(result.allowed).toBe(true);
  });
});

describe("ROLE_VALUES", () => {
  it("lists roles in ascending privilege order", () => {
    expect(ROLE_VALUES).toEqual([
      "VISITOR",
      "MEMBER",
      "DEPT_LEAD",
      "FINANCE",
      "ADMIN",
      "SUPER_ADMIN",
    ]);
  });
});
