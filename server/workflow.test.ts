import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Approval Workflow and Performance Tracking", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testContentId: number;

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
      name: "Test Client",
      email: "client@test.com",
      industry: "Technology",
    });

    // Create test content
    const content = await caller.content.generate({
      clientId: client.id,
      topic: "Test Content for Approval",
      customPrompt: "Write a short test article",
      enableWebResearch: false,
      shouldGenerateImage: false,
      aiModel: "gemini-2.5-flash",
    });

    testContentId = content.id;
  }, 30000); // 30 second timeout for content generation

  describe("Approval Workflow", () => {
    it("should request approval for content", async () => {
      const result = await caller.approvals.requestApproval({
        contentId: testContentId,
      });

      expect(result.success).toBe(true);
    });

    it("should get pending approvals", async () => {
      const pending = await caller.approvals.getPendingApprovals();
      
      expect(Array.isArray(pending)).toBe(true);
      expect(pending.length).toBeGreaterThan(0);
      expect(pending.some(c => c.id === testContentId)).toBe(true);
    });

    it("should get approval stats", async () => {
      const stats = await caller.approvals.getStats();

      expect(stats).toHaveProperty("pending");
      expect(stats).toHaveProperty("approved");
      expect(stats).toHaveProperty("revisionRequested");
      expect(typeof stats.pending).toBe("number");
    });

    it("should approve content", async () => {
      const result = await caller.approvals.approve({
        contentId: testContentId,
      });

      expect(result.success).toBe(true);
    });

    it("should add comment to content", async () => {
      const result = await caller.approvals.addComment({
        contentId: testContentId,
        comment: "This looks great!",
      });

      expect(result).toHaveProperty("id");
      expect(typeof result.id).toBe("number");
    });
  });

  describe("Performance Tracking", () => {
    it("should track content view", async () => {
      const result = await caller.performance.trackView({
        contentId: testContentId,
      });

      expect(result.success).toBe(true);
    });

    it("should track content click", async () => {
      const result = await caller.performance.trackClick({
        contentId: testContentId,
      });

      expect(result.success).toBe(true);
    });

    it("should get content performance", async () => {
      const performance = await caller.performance.getContentPerformance({
        contentId: testContentId,
      });

      expect(performance).toHaveProperty("views");
      expect(performance).toHaveProperty("clicks");
      expect(performance).toHaveProperty("shares");
      expect(performance.views).toBeGreaterThanOrEqual(1);
    });

    it("should get performance summary", async () => {
      const summary = await caller.performance.getSummary();

      expect(summary).toHaveProperty("totalViews");
      expect(summary).toHaveProperty("totalClicks");
      expect(summary).toHaveProperty("totalShares");
      expect(summary).toHaveProperty("contentCount");
      expect(typeof summary.totalViews).toBe("number");
    });

    it("should get top performing content", async () => {
      const topContent = await caller.performance.getTopPerforming({
        limit: 5,
      });

      expect(Array.isArray(topContent)).toBe(true);
    });

    it("should get performance trends", async () => {
      const trends = await caller.performance.getTrends({
        days: 30,
      });

      expect(Array.isArray(trends)).toBe(true);
    });
  });
});
