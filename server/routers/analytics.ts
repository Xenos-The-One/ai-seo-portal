import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { recordAnalytics, getContentAnalytics, updateAnalytics } from "../db";

export const analyticsRouter = router({
  recordMetrics: protectedProcedure
    .input(z.object({
      contentId: z.number(),
      views: z.number().default(0),
      clicks: z.number().default(0),
      shares: z.number().default(0),
      engagementRate: z.number().default(0),
      avgTimeOnPage: z.number().default(0),
      conversions: z.number().default(0),
    }))
    .mutation(async ({ input }) => {
      const analyticsId = await recordAnalytics({
        contentId: input.contentId,
        views: input.views,
        clicks: input.clicks,
        shares: input.shares,
        engagementRate: input.engagementRate,
        avgTimeOnPage: input.avgTimeOnPage,
        conversions: input.conversions,
      });
      return { id: analyticsId };
    }),

  getMetrics: protectedProcedure
    .input(z.object({ contentId: z.number() }))
    .query(async ({ input }) => {
      return await getContentAnalytics(input.contentId);
    }),

  updateMetrics: protectedProcedure
    .input(z.object({
      contentId: z.number(),
      views: z.number().optional(),
      clicks: z.number().optional(),
      shares: z.number().optional(),
      engagementRate: z.number().optional(),
      avgTimeOnPage: z.number().optional(),
      conversions: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { contentId, ...updates } = input;
      const updateData: any = {};
      if (updates.views !== undefined) updateData.views = updates.views;
      if (updates.clicks !== undefined) updateData.clicks = updates.clicks;
      if (updates.shares !== undefined) updateData.shares = updates.shares;
      if (updates.engagementRate !== undefined) updateData.engagementRate = updates.engagementRate;
      if (updates.avgTimeOnPage !== undefined) updateData.avgTimeOnPage = updates.avgTimeOnPage;
      if (updates.conversions !== undefined) updateData.conversions = updates.conversions;
      
      await updateAnalytics(contentId, updateData);
      return { success: true };
    }),

  // Get all analytics across all content for overview
  getAllMetrics: protectedProcedure.query(async () => {
    const { getDb } = await import("../db");
    const db = await getDb();
    if (!db) return [];
    const { contentAnalytics } = await import("../../drizzle/schema");
    return await db.select().from(contentAnalytics).orderBy(contentAnalytics.recordedAt);
  }),
});
