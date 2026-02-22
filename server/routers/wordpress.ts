import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { wordpressConnections, wordpressPublishHistory, content } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * WordPress Router - handles WordPress site connections and publishing
 */
export const wordpressRouter = router({
  // Get all WordPress connections for a client
  getConnections: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      return db
        .select()
        .from(wordpressConnections)
        .where(eq(wordpressConnections.clientId, input.clientId))
        .orderBy(desc(wordpressConnections.createdAt));
    }),

  // Add a new WordPress connection
  addConnection: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      siteName: z.string().min(1),
      siteUrl: z.string().url(),
      username: z.string().min(1),
      applicationPassword: z.string().min(1),
      defaultStatus: z.enum(["draft", "publish", "pending"]).default("draft"),
      defaultAuthorId: z.number().optional(),
      defaultCategoryId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const [connection] = await db.insert(wordpressConnections).values({
        ...input,
        createdBy: ctx.user.id,
      });
      return { id: connection.insertId };
    }),

  // Update a WordPress connection
  updateConnection: protectedProcedure
    .input(z.object({
      id: z.number(),
      siteName: z.string().min(1).optional(),
      siteUrl: z.string().url().optional(),
      username: z.string().min(1).optional(),
      applicationPassword: z.string().min(1).optional(),
      defaultStatus: z.enum(["draft", "publish", "pending"]).optional(),
      defaultAuthorId: z.number().optional(),
      defaultCategoryId: z.number().optional(),
      isActive: z.number().min(0).max(1).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      const { id, ...updates } = input;
      await db
        .update(wordpressConnections)
        .set(updates)
        .where(eq(wordpressConnections.id, id));
      return { success: true };
    }),

  // Delete a WordPress connection
  deleteConnection: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      await db
        .delete(wordpressConnections)
        .where(eq(wordpressConnections.id, input.id));
      return { success: true };
    }),

  // Test WordPress connection
  testConnection: protectedProcedure
    .input(z.object({
      siteUrl: z.string().url(),
      username: z.string().min(1),
      applicationPassword: z.string().min(1),
    }))
    .mutation(async ({ input }) => {
      try {
        // Create Basic Auth header
        const authHeader = Buffer.from(`${input.username}:${input.applicationPassword}`).toString('base64');
        
        // Test connection by fetching current user
        const response = await fetch(`${input.siteUrl}/wp-json/wp/v2/users/me`, {
          headers: {
            'Authorization': `Basic ${authHeader}`,
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`WordPress API error: ${response.status} - ${errorText}`);
        }

        const userData = await response.json();
        return {
          success: true,
          message: `Connected successfully as ${userData.name}`,
          userId: userData.id,
        };
      } catch (error) {
        return {
          success: false,
          message: error instanceof Error ? error.message : 'Connection failed',
        };
      }
    }),

  // Publish content to WordPress
  publishToWordPress: protectedProcedure
    .input(z.object({
      contentId: z.number(),
      connectionId: z.number(),
      publishStatus: z.enum(["draft", "publish", "pending"]).default("draft"),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) throw new Error('Database not available');

        // Get content
        const [contentData] = await db
          .select()
          .from(content)
          .where(eq(content.id, input.contentId));

        if (!contentData) {
          throw new Error('Content not found');
        }

        // Get WordPress connection
        const [connection] = await db
          .select()
          .from(wordpressConnections)
          .where(eq(wordpressConnections.id, input.connectionId));

        if (!connection) {
          throw new Error('WordPress connection not found');
        }

        // Create Basic Auth header
        const authHeader = Buffer.from(`${connection.username}:${connection.applicationPassword}`).toString('base64');

        // Prepare post data
        const postData = {
          title: contentData.title,
          content: contentData.content,
          status: input.publishStatus,
          author: connection.defaultAuthorId || undefined,
          categories: connection.defaultCategoryId ? [connection.defaultCategoryId] : undefined,
        };

        // Publish to WordPress
        const response = await fetch(`${connection.siteUrl}/wp-json/wp/v2/posts`, {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${authHeader}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`WordPress API error: ${response.status} - ${errorText}`);
        }

        const wpPost = await response.json();

        const db2 = await getDb();
        if (!db2) throw new Error('Database not available');

        // Record publish history
        await db2.insert(wordpressPublishHistory).values({
          contentId: input.contentId,
          connectionId: input.connectionId,
          wordpressPostId: wpPost.id,
          wordpressPostUrl: wpPost.link,
          publishStatus: input.publishStatus,
          success: 1,
          publishedBy: ctx.user.id,
        });

        // Update connection last published timestamp
        await db2
          .update(wordpressConnections)
          .set({ lastPublishedAt: new Date() })
          .where(eq(wordpressConnections.id, input.connectionId));

        return {
          success: true,
          postId: wpPost.id,
          postUrl: wpPost.link,
          message: `Published successfully as ${input.publishStatus}`,
        };
      } catch (error) {
        const db3 = await getDb();
        if (db3) {
          // Record failed publish attempt
          await db3.insert(wordpressPublishHistory).values({
            contentId: input.contentId,
            connectionId: input.connectionId,
            wordpressPostId: 0,
            publishStatus: input.publishStatus,
            success: 0,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            publishedBy: ctx.user.id,
          });
        }

        return {
          success: false,
          message: error instanceof Error ? error.message : 'Publishing failed',
        };
      }
    }),

  // Get publish history for content
  getPublishHistory: protectedProcedure
    .input(z.object({ contentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database not available');
      return db
        .select({
          id: wordpressPublishHistory.id,
          connectionId: wordpressPublishHistory.connectionId,
          wordpressPostId: wordpressPublishHistory.wordpressPostId,
          wordpressPostUrl: wordpressPublishHistory.wordpressPostUrl,
          publishStatus: wordpressPublishHistory.publishStatus,
          success: wordpressPublishHistory.success,
          errorMessage: wordpressPublishHistory.errorMessage,
          publishedAt: wordpressPublishHistory.publishedAt,
          siteName: wordpressConnections.siteName,
          siteUrl: wordpressConnections.siteUrl,
        })
        .from(wordpressPublishHistory)
        .leftJoin(
          wordpressConnections,
          eq(wordpressPublishHistory.connectionId, wordpressConnections.id)
        )
        .where(eq(wordpressPublishHistory.contentId, input.contentId))
        .orderBy(desc(wordpressPublishHistory.publishedAt));
    }),
});
