import { describe, it, expect } from "vitest";
import { signToken, verifyToken, hasPermission } from "../src/lib/auth";

describe("Authentication & RBAC Permissions", () => {
  it("correctly signs and verifies JWT session tokens", () => {
    const payload = {
      userId: "test-user-123",
      email: "ahmed.employee@ceem.edu",
      role: "EMPLOYEE",
      name: "Ahmed Farooqui",
      officeId: "clt-office-id",
    };

    const token = signToken(payload);
    expect(typeof token).toBe("string");

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
    expect(decoded?.role).toBe("EMPLOYEE");
  });

  it("enforces SUPER_ADMIN master permissions", () => {
    expect(hasPermission("SUPER_ADMIN", ["ADMIN", "HR"])).toBe(true);
    expect(hasPermission("SUPER_ADMIN", ["OFFICE_MANAGER"])).toBe(true);
  });

  it("restricts regular EMPLOYEE from administrative routes", () => {
    expect(hasPermission("EMPLOYEE", ["SUPER_ADMIN", "ADMIN", "HR"])).toBe(false);
    expect(hasPermission("EMPLOYEE", ["SUPER_ADMIN"])).toBe(false);
  });

  it("permits HR role to manage employees and leaves", () => {
    expect(hasPermission("HR", ["ADMIN", "HR"])).toBe(true);
    expect(hasPermission("HR", ["SUPER_ADMIN"])).toBe(false);
  });

  it("allows OFFICE_MANAGER role for office scoped actions", () => {
    expect(
      hasPermission("OFFICE_MANAGER", ["SUPER_ADMIN", "ADMIN", "HR", "OFFICE_MANAGER"])
    ).toBe(true);
  });
});
