import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Publishing Analytics Integration", () => {
  const mockContext: Context = {
    user: { id: 1, name: "Test User", email: "test@example.com", role: "user" },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(mockContext);

  it("should get overall publishing statistics", async () => {
    const stats = await caller.publishingAnalytics.getOverallStats();
    
    expect(stats).toBeDefined();
    expect(stats.wordpress).toHaveProperty("total");
    expect(stats.wordpress).toHaveProperty("successful");
    expect(stats.wordpress).toHaveProperty("failed");
    expect(stats.wordpress).toHaveProperty("successRate");
    
    expect(stats.manus).toHaveProperty("total");
    expect(stats.manus).toHaveProperty("successful");
    expect(stats.manus).toHaveProperty("failed");
    expect(stats.manus).toHaveProperty("successRate");
    
    expect(stats.combined).toHaveProperty("total");
    expect(stats.combined).toHaveProperty("successful");
    expect(stats.combined).toHaveProperty("failed");
  });

  it("should calculate success rates correctly", async () => {
    const stats = await caller.publishingAnalytics.getOverallStats();
    
    if (stats.wordpress.total > 0) {
      const expectedRate = (stats.wordpress.successful / stats.wordpress.total) * 100;
      expect(stats.wordpress.successRate).toBeCloseTo(expectedRate, 1);
    }
    
    if (stats.manus.total > 0) {
      const expectedRate = (stats.manus.successful / stats.manus.total) * 100;
      expect(stats.manus.successRate).toBeCloseTo(expectedRate, 1);
    }
  });

  it("should get content publish history", async () => {
    const history = await caller.publishingAnalytics.getContentPublishHistory({ contentId: 1 });
    
    expect(Array.isArray(history)).toBe(true);
    
    if (history.length > 0) {
      const entry = history[0];
      expect(entry).toHaveProperty("platform");
      expect(entry).toHaveProperty("siteName");
      expect(entry).toHaveProperty("success");
      expect(entry).toHaveProperty("publishedAt");
    }
  });

  it("should get top published content", async () => {
    const topContent = await caller.publishingAnalytics.getTopPublishedContent({ limit: 10 });
    
    expect(Array.isArray(topContent)).toBe(true);
    expect(topContent.length).toBeLessThanOrEqual(10);
    
    if (topContent.length > 0) {
      const item = topContent[0];
      expect(item).toHaveProperty("contentId");
      expect(item).toHaveProperty("title");
      expect(item).toHaveProperty("wpPublishCount");
      expect(item).toHaveProperty("manusPublishCount");
      expect(item).toHaveProperty("totalPublishes");
    }
  });

  it("should sort top content by total publishes", async () => {
    const topContent = await caller.publishingAnalytics.getTopPublishedContent({ limit: 10 });
    
    if (topContent.length > 1) {
      for (let i = 0; i < topContent.length - 1; i++) {
        expect(topContent[i].totalPublishes).toBeGreaterThanOrEqual(topContent[i + 1].totalPublishes);
      }
    }
  });

  it("should get recent publishing activity", async () => {
    const activity = await caller.publishingAnalytics.getRecentActivity({ limit: 20 });
    
    expect(Array.isArray(activity)).toBe(true);
    expect(activity.length).toBeLessThanOrEqual(20);
    
    if (activity.length > 0) {
      const item = activity[0];
      expect(item).toHaveProperty("platform");
      expect(item).toHaveProperty("contentTitle");
      expect(item).toHaveProperty("siteName");
      expect(item).toHaveProperty("success");
      expect(item).toHaveProperty("publishedAt");
    }
  });

  it("should sort recent activity by date descending", async () => {
    const activity = await caller.publishingAnalytics.getRecentActivity({ limit: 20 });
    
    if (activity.length > 1) {
      for (let i = 0; i < activity.length - 1; i++) {
        const date1 = new Date(activity[i].publishedAt).getTime();
        const date2 = new Date(activity[i + 1].publishedAt).getTime();
        expect(date1).toBeGreaterThanOrEqual(date2);
      }
    }
  });

  it("should get publishing trends", async () => {
    const trends = await caller.publishingAnalytics.getPublishingTrends();
    
    expect(trends).toBeDefined();
    expect(trends).toHaveProperty("wordpress");
    expect(trends).toHaveProperty("manus");
    expect(Array.isArray(trends.wordpress)).toBe(true);
    expect(Array.isArray(trends.manus)).toBe(true);
  });

  it("should include date and count in trends", async () => {
    const trends = await caller.publishingAnalytics.getPublishingTrends();
    
    if (trends.wordpress.length > 0) {
      const entry = trends.wordpress[0];
      expect(entry).toHaveProperty("date");
      expect(entry).toHaveProperty("count");
      expect(entry).toHaveProperty("successful");
    }
  });

  it("should respect limit parameter for top content", async () => {
    const topContent5 = await caller.publishingAnalytics.getTopPublishedContent({ limit: 5 });
    expect(topContent5.length).toBeLessThanOrEqual(5);
    
    const topContent3 = await caller.publishingAnalytics.getTopPublishedContent({ limit: 3 });
    expect(topContent3.length).toBeLessThanOrEqual(3);
  });

  it("should respect limit parameter for recent activity", async () => {
    const activity10 = await caller.publishingAnalytics.getRecentActivity({ limit: 10 });
    expect(activity10.length).toBeLessThanOrEqual(10);
    
    const activity5 = await caller.publishingAnalytics.getRecentActivity({ limit: 5 });
    expect(activity5.length).toBeLessThanOrEqual(5);
  });
});
