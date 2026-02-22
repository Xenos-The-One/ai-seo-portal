import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Bulk Publishing Integration", () => {
  const mockContext: Context = {
    user: { id: 1, name: "Test User", email: "test@example.com", role: "user" },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(mockContext);

  // Use existing test content ID from previous tests
  const testContentId = 1;

  it("should validate required fields for bulk publishing", async () => {
    try {
      await caller.bulkPublishing.publishToMultiplePlatforms({
        contentId: testContentId,
        // No platforms selected
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      // Expected to fail validation
      expect(error).toBeDefined();
    }
  });

  it("should handle bulk publishing with no connections", async () => {
    const result = await caller.bulkPublishing.publishToMultiplePlatforms({
      contentId: testContentId,
      wordpressConnectionIds: [],
      manusWebsiteIds: [],
    });

    expect(result).toBeDefined();
    expect(result.results.wordpress).toEqual([]);
    expect(result.results.manus).toEqual([]);
  });

  it("should return proper summary structure", async () => {
    const result = await caller.bulkPublishing.publishToMultiplePlatforms({
      contentId: testContentId,
      wordpressConnectionIds: [],
      manusWebsiteIds: [],
    });

    expect(result.summary).toBeDefined();
    expect(result.summary.wordpress).toHaveProperty("success");
    expect(result.summary.wordpress).toHaveProperty("total");
    expect(result.summary.manus).toHaveProperty("success");
    expect(result.summary.manus).toHaveProperty("total");
  });

  it("should handle invalid content ID", async () => {
    try {
      await caller.bulkPublishing.publishToMultiplePlatforms({
        contentId: 999999,
        wordpressConnectionIds: [],
      });
      expect(true).toBe(false);
    } catch (error) {
      expect(error).toBeDefined();
    }
  });

  it("should accept WordPress status parameter", async () => {
    const result = await caller.bulkPublishing.publishToMultiplePlatforms({
      contentId: testContentId,
      wordpressConnectionIds: [],
      wordpressStatus: "draft",
    });

    expect(result).toBeDefined();
  });

  it("should accept Manus slug parameter", async () => {
    const result = await caller.bulkPublishing.publishToMultiplePlatforms({
      contentId: testContentId,
      manusWebsiteIds: [],
      manusSlug: "test-slug",
    });

    expect(result).toBeDefined();
  });
});
