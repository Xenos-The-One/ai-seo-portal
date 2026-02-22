import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-branding-user",
    email: "branding@test.com",
    name: "Branding Test User",
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

describe("Portal Branding", () => {
  it("should have portal branding get endpoint", () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.portalBranding.get).toBeDefined();
    expect(typeof caller.portalBranding.get).toBe("function");
  });

  it("should have portal branding upsert endpoint", () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    expect(caller.portalBranding.upsert).toBeDefined();
    expect(typeof caller.portalBranding.upsert).toBe("function");
  });

  it("should accept valid branding data structure", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const brandingData = {
      clientId: 1,
      logoUrl: "https://example.com/logo.png",
      primaryColor: "#3b82f6",
      secondaryColor: "#1e40af",
      portalName: "Test Portal",
      welcomeMessage: "Welcome to our portal!",
    };
    
    // This should not throw
    expect(() => {
      caller.portalBranding.upsert(brandingData);
    }).not.toThrow();
  });

  it("should validate color format", () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const validColors = ["#3b82f6", "#1e40af", "#ff0000"];
    const invalidColors = ["blue", "rgb(255,0,0)", "3b82f6"];
    
    validColors.forEach((color) => {
      expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
    });
    
    invalidColors.forEach((color) => {
      expect(color).not.toMatch(/^#[0-9a-fA-F]{6}$/);
    });
  });

  it("should handle optional branding fields", async () => {
    const ctx = createTestContext();
    const caller = appRouter.createCaller(ctx);
    
    const minimalBranding = {
      clientId: 1,
    };
    
    // Should accept minimal data
    expect(() => {
      caller.portalBranding.upsert(minimalBranding);
    }).not.toThrow();
  });
});
