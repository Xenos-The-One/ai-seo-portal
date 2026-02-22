import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Client Portal Authentication", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testClientId: number;
  let invitationToken: string;

  beforeAll(async () => {
    const mockContext: Context = {
      user: {
        id: 1,
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        role: "admin",
        createdAt: new Date(),
      },
    };
    caller = appRouter.createCaller(mockContext);

    // Create test client
    const client = await caller.clients.create({
      name: "Test Client for Portal",
      email: "client@test.com",
      industry: "Technology",
    });

    testClientId = client.id;
  }, 30000);

  describe("Invitation System", () => {
    it("should create client portal invitation", async () => {
      const invitation = await caller.clientPortal.createInvitation({
        clientId: testClientId,
        email: "portal-user@test.com",
        name: "Portal Test User",
        role: "client_viewer",
      });

      expect(invitation).toHaveProperty("id");
      expect(invitation).toHaveProperty("token");
      expect(invitation).toHaveProperty("email");
      expect(invitation.email).toBe("portal-user@test.com");
      
      invitationToken = invitation.token;
    });

    it("should not allow duplicate email invitations", async () => {
      await expect(
        caller.clientPortal.createInvitation({
          clientId: testClientId,
          email: "portal-user@test.com",
          name: "Duplicate User",
          role: "client_viewer",
        })
      ).rejects.toThrow("User with this email already exists");
    });

    it("should accept invitation and set password", async () => {
      const result = await caller.clientPortal.acceptInvitation({
        token: invitationToken,
        password: "SecurePassword123!",
      });

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      expect(result).toHaveProperty("userId");
    });

    it("should reject invalid invitation token", async () => {
      await expect(
        caller.clientPortal.acceptInvitation({
          token: "invalid-token-12345",
          password: "SecurePassword123!",
        })
      ).rejects.toThrow("Invalid invitation token");
    });
  });

  describe("Login System", () => {
    it("should login with correct credentials", async () => {
      const result = await caller.clientPortal.login({
        email: "portal-user@test.com",
        password: "SecurePassword123!",
      });

      expect(result).toHaveProperty("token");
      expect(result).toHaveProperty("user");
      expect(result.user.email).toBe("portal-user@test.com");
      expect(result.user.name).toBe("Portal Test User");
      expect(typeof result.token).toBe("string");
    });

    it("should reject incorrect password", async () => {
      await expect(
        caller.clientPortal.login({
          email: "portal-user@test.com",
          password: "WrongPassword123!",
        })
      ).rejects.toThrow("Invalid email or password");
    });

    it("should reject non-existent email", async () => {
      await expect(
        caller.clientPortal.login({
          email: "nonexistent@test.com",
          password: "SomePassword123!",
        })
      ).rejects.toThrow("Invalid email or password");
    });
  });

  describe("User Management", () => {
    it("should list portal users for a client", async () => {
      const users = await caller.clientPortal.listUsers({
        clientId: testClientId,
      });

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);
      expect(users[0]).toHaveProperty("email");
      expect(users[0]).toHaveProperty("name");
      expect(users[0]).toHaveProperty("role");
    });
  });
});
