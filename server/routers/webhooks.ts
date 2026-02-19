import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import {
  createWebhookConfig,
  getAllWebhooks,
  getWebhooksByClient,
  getWebhookById,
  updateWebhookConfig,
  deleteWebhookConfig,
  createPublishLog,
  getPublishLogs,
  updatePublishLog,
  getContentById,
} from "../db";

export const webhooksRouter = router({
  // List all webhook configs for current user
  list: protectedProcedure.query(async ({ ctx }) => {
    return getAllWebhooks(ctx.user.id);
  }),

  // List webhooks for a specific client
  listByClient: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ input }) => {
      return getWebhooksByClient(input.clientId);
    }),

  // Create a new webhook config
  create: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      name: z.string().min(1),
      platform: z.enum(["wordpress", "ghost", "webflow", "custom"]),
      endpointUrl: z.string().url(),
      apiKey: z.string().optional(),
      authHeader: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const id = await createWebhookConfig({
        ...input,
        createdBy: ctx.user.id,
      });
      return { id };
    }),

  // Update a webhook config
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().optional(),
      endpointUrl: z.string().url().optional(),
      apiKey: z.string().optional(),
      authHeader: z.string().optional(),
      isActive: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const { id, ...updates } = input;
      await updateWebhookConfig(id, updates);
      return { success: true };
    }),

  // Delete a webhook config
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteWebhookConfig(input.id);
      return { success: true };
    }),

  // Publish content to a webhook endpoint
  publish: protectedProcedure
    .input(z.object({
      contentId: z.number(),
      webhookId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const { contentId, webhookId } = input;

      // Get content and webhook details
      const contentData = await getContentById(contentId);
      if (!contentData) throw new Error("Content not found");

      const webhook = await getWebhookById(webhookId);
      if (!webhook) throw new Error("Webhook not found");

      // Create a publish log entry
      const logId = await createPublishLog({
        contentId,
        webhookId,
        status: "pending",
      });

      try {
        const axios = (await import("axios")).default;

        // Build the payload based on platform
        let payload: any = {};
        let headers: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (webhook.apiKey) {
          headers["Authorization"] = `Bearer ${webhook.apiKey}`;
        }
        if (webhook.authHeader) {
          // Support custom auth header format like "Basic xxx" or "Token xxx"
          headers["Authorization"] = webhook.authHeader;
        }

        switch (webhook.platform) {
          case "wordpress":
            payload = {
              title: contentData.title,
              content: contentData.content,
              status: "draft",
              featured_media: contentData.imageUrl || undefined,
            };
            break;
          case "ghost":
            payload = {
              posts: [{
                title: contentData.title,
                html: contentData.content,
                status: "draft",
                feature_image: contentData.imageUrl || undefined,
              }],
            };
            break;
          case "webflow":
            payload = {
              fields: {
                name: contentData.title,
                "post-body": contentData.content,
                slug: contentData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
              },
            };
            break;
          case "custom":
          default:
            payload = {
              title: contentData.title,
              content: contentData.content,
              imageUrl: contentData.imageUrl,
              topic: contentData.topic,
              status: contentData.status,
              publishedAt: new Date().toISOString(),
            };
            break;
        }

        const response = await axios.post(webhook.endpointUrl, payload, {
          headers,
          timeout: 30000,
        });

        // Update log with success
        await updatePublishLog(logId, {
          status: "success",
          responseCode: response.status,
          responseBody: JSON.stringify(response.data).substring(0, 5000),
        });

        // Update webhook last published date
        await updateWebhookConfig(webhookId, { lastPublishedAt: new Date() });

        return { success: true, logId, responseCode: response.status };
      } catch (error: any) {
        // Update log with failure
        await updatePublishLog(logId, {
          status: "failed",
          responseCode: error.response?.status || 0,
          responseBody: JSON.stringify(error.message).substring(0, 5000),
        });

        return {
          success: false,
          logId,
          error: error.message,
          responseCode: error.response?.status || 0,
        };
      }
    }),

  // Get publish logs for a content item
  getLogs: protectedProcedure
    .input(z.object({ contentId: z.number() }))
    .query(async ({ input }) => {
      return getPublishLogs(input.contentId);
    }),
});
