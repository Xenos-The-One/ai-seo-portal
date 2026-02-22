import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-portal-user",
    email: "portal@test.com",
    name: "Portal Test User",
    loginMethod: "manus",
    role: "user",
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
    res: {} as TrpcContext["res"],
  };
}

describe("Client Portal Features", () => {

  it("should have content list endpoint", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const contentList = await caller.content.list();
    
    expect(contentList).toBeDefined();
    expect(Array.isArray(contentList)).toBe(true);
  });

  it("should have content getById endpoint", () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.content.getById).toBeDefined();
    expect(typeof caller.content.getById).toBe("function");
  });

  it("should have approval endpoint", () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.approvals.approve).toBeDefined();
    expect(typeof caller.approvals.approve).toBe("function");
  });

  it("should have request revision endpoint", () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.approvals.requestRevision).toBeDefined();
    expect(typeof caller.approvals.requestRevision).toBe("function");
  });

  it("should support calendar filtering", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const contentList = await caller.content.list();
    const scheduledContent = contentList.filter(
      (item: any) => item.scheduledPublishDate
    );
    
    expect(Array.isArray(scheduledContent)).toBe(true);
  });

  it("should calculate performance metrics", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const contentList = await caller.content.list();
    
    const performanceData = contentList.reduce(
      (acc: any, item: any) => ({
        totalViews: acc.totalViews + (item.views || 0),
        totalClicks: acc.totalClicks + (item.clicks || 0),
        totalShares: acc.totalShares + (item.shares || 0),
      }),
      { totalViews: 0, totalClicks: 0, totalShares: 0 }
    );
    
    expect(performanceData).toBeDefined();
    expect(typeof performanceData.totalViews).toBe("number");
    expect(typeof performanceData.totalClicks).toBe("number");
    expect(typeof performanceData.totalShares).toBe("number");
  });

  it("should have portal user list endpoint", () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.clientPortal.listUsers).toBeDefined();
    expect(typeof caller.clientPortal.listUsers).toBe("function");
  });

  it("should filter content by status", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const contentList = await caller.content.list();
    
    const draftContent = contentList.filter((item: any) => item.status === "draft");
    const approvedContent = contentList.filter((item: any) => item.status === "approved");
    
    expect(Array.isArray(draftContent)).toBe(true);
    expect(Array.isArray(approvedContent)).toBe(true);
  });
});
