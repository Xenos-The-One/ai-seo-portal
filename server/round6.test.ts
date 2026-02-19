import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createTestContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "test-user",
      email: "test@example.com",
      name: "Test User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("Agency Settings", () => {
  it("should have getAll procedure", () => {
    const caller = appRouter.createCaller(createTestContext());
    expect(caller.agencySettings.getAll).toBeDefined();
  });

  it("should have update procedure", () => {
    const caller = appRouter.createCaller(createTestContext());
    expect(caller.agencySettings.update).toBeDefined();
  });

  it("should have updateBatch procedure", () => {
    const caller = appRouter.createCaller(createTestContext());
    expect(caller.agencySettings.updateBatch).toBeDefined();
  });

  it("should have getPromptTemplates procedure", () => {
    const caller = appRouter.createCaller(createTestContext());
    expect(caller.agencySettings.getPromptTemplates).toBeDefined();
  });

  it("should have savePromptTemplate procedure", () => {
    const caller = appRouter.createCaller(createTestContext());
    expect(caller.agencySettings.savePromptTemplate).toBeDefined();
  });

  it("should have deletePromptTemplate procedure", () => {
    const caller = appRouter.createCaller(createTestContext());
    expect(caller.agencySettings.deletePromptTemplate).toBeDefined();
  });
});

describe("Content Export", () => {
  it("should have exportHtml procedure on content router", () => {
    const caller = appRouter.createCaller(createTestContext());
    expect(caller.content.exportHtml).toBeDefined();
  });
});

describe("Client Onboarding - Client Creation", () => {
  it("should have create procedure for clients", () => {
    const caller = appRouter.createCaller(createTestContext());
    expect(caller.clients.create).toBeDefined();
  });

  it("should have getById procedure for clients", () => {
    const caller = appRouter.createCaller(createTestContext());
    expect(caller.clients.getById).toBeDefined();
  });
});
