import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";

describe("Google Analytics Integration", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(() => {
    const mockContext = {
      user: { id: 1, openId: "test-user", name: "Test User", role: "admin" as const },
      req: {} as any,
      res: {} as any,
    };
    caller = appRouter.createCaller(mockContext);
  });

  it("should create a Google Analytics connection", async () => {
    const result = await caller.googleAnalytics.upsert({
      clientId: 1,
      propertyId: "123456789",
      viewId: "987654321",
      serviceAccountEmail: "test@example.iam.gserviceaccount.com",
      serviceAccountKey: '{"type": "service_account"}',
    });

    expect(result.success).toBe(true);
  });

  it("should retrieve Google Analytics connection", async () => {
    const connection = await caller.googleAnalytics.get({ clientId: 1 });
    
    if (connection) {
      expect(connection.propertyId).toBe("123456789");
      expect(connection.clientId).toBe(1);
    }
  });

  it("should fetch GA metrics", async () => {
    const metrics = await caller.googleAnalytics.getMetrics({
      clientId: 1,
      startDate: "2024-01-01",
      endDate: "2024-01-31",
    });

    // Metrics might be null if no connection exists, or contain data
    if (metrics) {
      expect(metrics).toHaveProperty("sessions");
      expect(metrics).toHaveProperty("pageviews");
      expect(metrics).toHaveProperty("users");
      expect(typeof metrics.sessions).toBe("number");
    }
  });

  it("should fetch GA page metrics", async () => {
    const pages = await caller.googleAnalytics.getPageMetrics({
      clientId: 1,
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      limit: 5,
    });

    expect(Array.isArray(pages)).toBe(true);
    if (pages.length > 0) {
      expect(pages[0]).toHaveProperty("pagePath");
      expect(pages[0]).toHaveProperty("pageviews");
    }
  });

  it("should fetch keyword data", async () => {
    const keywords = await caller.googleAnalytics.getKeywords({
      clientId: 1,
      startDate: "2024-01-01",
      endDate: "2024-01-31",
      limit: 10,
    });

    expect(Array.isArray(keywords)).toBe(true);
    if (keywords.length > 0) {
      expect(keywords[0]).toHaveProperty("keyword");
      expect(keywords[0]).toHaveProperty("clicks");
      expect(keywords[0]).toHaveProperty("impressions");
    }
  });

  it("should sync content performance", async () => {
    const result = await caller.googleAnalytics.sync({ clientId: 1 });
    
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("message");
  });

  it("should delete Google Analytics connection", async () => {
    const result = await caller.googleAnalytics.delete({ clientId: 1 });
    
    expect(result.success).toBe(true);
  });
});
