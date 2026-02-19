import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-admin-user",
    email: "admin@test.com",
    name: "Test Admin",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Round 4 Features", () => {
  describe("Webhooks Router", () => {
    it("should list webhooks (empty initially)", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.webhooks.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should require valid input for webhook creation", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      
      // Test that the router validates input
      await expect(
        caller.webhooks.create({
          clientId: 1,
          name: "Test Webhook",
          platform: "wordpress",
          endpointUrl: "not-a-url",
        })
      ).rejects.toThrow();
    });
  });

  describe("Briefs Router", () => {
    it("should list briefs (empty initially)", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.briefs.list();
      expect(Array.isArray(result)).toBe(true);
    });

    it("should return null for invalid brief token", async () => {
      const publicCtx = createPublicContext();
      const caller = appRouter.createCaller(publicCtx);
      const result = await caller.briefs.getByToken({ token: "nonexistent-token" });
      expect(result).toBeNull();
    });

    it("should reject brief submission with invalid token", async () => {
      const publicCtx = createPublicContext();
      const caller = appRouter.createCaller(publicCtx);
      await expect(
        caller.briefs.submit({
          token: "invalid-token",
          title: "Test Brief",
        })
      ).rejects.toThrow();
    });
  });

  describe("Content Router - Status Updates", () => {
    it("should list content (for client portal view)", async () => {
      const ctx = createTestContext();
      const caller = appRouter.createCaller(ctx);
      const result = await caller.content.list();
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
