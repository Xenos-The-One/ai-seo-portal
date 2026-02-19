import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-round3",
    email: "test@example.com",
    name: "Test User",
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

describe("Analytics Router", () => {
  it("getAllMetrics returns an array", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analytics.getAllMetrics();
    expect(Array.isArray(result)).toBe(true);
  });

  it("getMetrics returns an array for a content id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.analytics.getMetrics({ contentId: 999 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Quality Score Router", () => {
  it("getScore returns null for non-existent content", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.qualityScore.getScore({ contentId: 999 });
    expect(result == null).toBe(true);
  });
});

describe("Collaboration Router", () => {
  it("getRevisions returns an array for a content id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.collaboration.getRevisions({ contentId: 999 });
    expect(Array.isArray(result)).toBe(true);
  });

  it("getComments returns an array for a content id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.collaboration.getComments({ contentId: 999 });
    expect(Array.isArray(result)).toBe(true);
  });
});
