import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { 
  getClientsByUser, 
  createClient, 
  updateClient, 
  deleteClient,
  getClientById,
  getContentWithClient,
  getContentById,
  createContent,
  updateContent,
  deleteContent
} from "./db";
import { invokeLLM } from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import { bulkRouter } from "./routers/bulk";
import { templatesRouter } from "./routers/templates";
import { collaborationRouter } from "./routers/collaboration";
import { analyticsRouter } from "./routers/analytics";
import { repurposingRouter } from "./routers/repurposing";
import { qualityScoreRouter } from "./routers/qualityScore";
import { webhooksRouter } from "./routers/webhooks";
import { briefsRouter } from "./routers/briefs";
import { notificationsRouter } from "./routers/notifications";
import { seoAuditRouter } from "./routers/seoAudit";
import { agencySettingsRouter } from "./routers/agencySettings";
import { recurringPlansRouter } from "./routers/recurringPlans";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Client management
  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getClientsByUser(ctx.user.id);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getClientById(input.id);
      }),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email().optional(),
        company: z.string().optional(),
        notes: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        businessName: z.string().optional(),
        businessType: z.string().optional(),
        industry: z.string().optional(),
        businessPhone: z.string().optional(),
        businessEmail: z.string().email().optional().or(z.literal("")),
        businessWebsite: z.string().optional(),
        businessAddress: z.string().optional(),
        websiteUrl: z.string().optional(),
        websitePlatform: z.string().optional(),
        websiteLoginUrl: z.string().optional(),
        websiteUsername: z.string().optional(),
        websitePassword: z.string().optional(),
        websiteNotes: z.string().optional(),
        socialFacebook: z.string().optional(),
        socialInstagram: z.string().optional(),
        socialLinkedin: z.string().optional(),
        socialTwitter: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const clientId = await createClient({
          ...input,
          createdBy: ctx.user.id,
        });
        return { id: clientId };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        email: z.string().email().optional().or(z.literal("")),
        company: z.string().optional(),
        notes: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zipCode: z.string().optional(),
        country: z.string().optional(),
        businessName: z.string().optional(),
        businessType: z.string().optional(),
        industry: z.string().optional(),
        businessPhone: z.string().optional(),
        businessEmail: z.string().email().optional().or(z.literal("")),
        businessWebsite: z.string().optional(),
        businessAddress: z.string().optional(),
        websiteUrl: z.string().optional(),
        websitePlatform: z.string().optional(),
        websiteLoginUrl: z.string().optional(),
        websiteUsername: z.string().optional(),
        websitePassword: z.string().optional(),
        websiteNotes: z.string().optional(),
        socialFacebook: z.string().optional(),
        socialInstagram: z.string().optional(),
        socialLinkedin: z.string().optional(),
        socialTwitter: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { id, ...updates } = input;
        await updateClient(id, updates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteClient(input.id);
        return { success: true };
      }),
  }),

  // Content management and generation
  content: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return getContentWithClient(ctx.user.id);
    }),
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return getContentById(input.id);
      }),
    listByClient: protectedProcedure
      .input(z.object({ clientId: z.number() }))
      .query(async ({ ctx, input }) => {
        const allContent = await getContentWithClient(ctx.user.id);
        return allContent.filter((item) => item.content.clientId === input.clientId).map((item) => item.content);
      }),
    generate: protectedProcedure
      .input(z.object({
        clientId: z.number(),
        topic: z.string().min(1),
        customPrompt: z.string().optional(),
        shouldGenerateImage: z.boolean().default(true),
        enableWebResearch: z.boolean().default(true),
      }))
      .mutation(async ({ ctx, input }) => {
        const { clientId, topic, customPrompt, shouldGenerateImage, enableWebResearch } = input;
        
        // Initialize tracking variables
        let inputTokens = 0;
        let outputTokens = 0;
        let urlsFetched = 0;
        let urlsFailed = 0;
        let webSearches = 0;
        let researchContext = "";

        // Perform web research if enabled
        if (enableWebResearch) {
          try {
            // Use axios to call the omni_search API for web research
            const axios = (await import("axios")).default;
            const searchResponse = await axios.post(
              `${process.env.BUILT_IN_FORGE_API_URL}/omni_search`,
              {
                query: topic,
                search_type: "info",
                max_results: 5,
              },
              {
                headers: {
                  Authorization: `Bearer ${process.env.BUILT_IN_FORGE_API_KEY}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (searchResponse.data?.results) {
              webSearches = 1;
              const results = searchResponse.data.results;
              
              // Fetch content from URLs
              for (const result of results.slice(0, 3)) {
                try {
                  const urlResponse = await axios.get(result.url, { timeout: 5000 });
                  urlsFetched++;
                  researchContext += `\n\nSource: ${result.title}\n${result.snippet || ""}\n`;
                } catch {
                  urlsFailed++;
                }
              }
            }
          } catch (error) {
            console.error("Web research failed:", error);
          }
        }

        // Generate blog content with AI
        const systemPrompt = customPrompt || "You are an expert SEO content writer. Create engaging, well-structured blog posts that are informative and optimized for search engines.";
        const userPrompt = `Write a comprehensive blog post about: ${topic}${researchContext ? `\n\nUse this research context:\n${researchContext}` : ""}`;

        const llmResponse = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        });

        const messageContent = llmResponse.choices[0]?.message?.content;
        const generatedContent = typeof messageContent === 'string' ? messageContent : "";
        inputTokens = llmResponse.usage?.prompt_tokens || 0;
        outputTokens = llmResponse.usage?.completion_tokens || 0;

        // Extract title from content (first line or generate one)
        const lines = generatedContent.split("\n").filter(l => l.trim());
        const title = lines[0]?.replace(/^#\s*/, "").substring(0, 500) || topic;

        // Generate featured image if requested
        let imageUrl = "";
        let imagePrompt = "";
        if (shouldGenerateImage) {
          try {
            imagePrompt = `Professional blog header image for: ${topic}`;
            const imageResult = await generateImage({ prompt: imagePrompt });
            imageUrl = imageResult.url || "";
          } catch (error) {
            console.error("Image generation failed:", error);
          }
        }

        // Save content to database
        const contentId = await createContent({
          clientId,
          createdBy: ctx.user.id,
          title,
          topic,
          content: generatedContent,
          imageUrl,
          imagePrompt,
          status: "draft",
          progress: 75,
          aiModel: "gpt-4o",
          customPrompt: customPrompt || null,
          inputTokens,
          outputTokens,
          totalTokens: inputTokens + outputTokens,
          urlsFetched,
          urlsFailed,
          webSearches,
        });

        return { id: contentId, title, content: generatedContent, imageUrl };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        content: z.string().optional(),
        status: z.enum(["draft", "in_progress", "approved"]).optional(),
        progress: z.number().min(0).max(100).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        
        // Check if status is changing to approved
        if (updates.status === "approved") {
          const contentData = await getContentById(id);
          if (contentData && contentData.status !== "approved") {
            // Send approval notification to owner
            try {
              const { notifyOwner } = await import("./_core/notification");
              const contentPreview = contentData.content
                ? contentData.content.replace(/[#*\[\]()_`>-]/g, "").substring(0, 500)
                : "No content preview available";
              
              await notifyOwner({
                title: `Content Approved: ${contentData.title}`,
                content: `The blog post "${contentData.title}" has been approved by ${ctx.user.name || ctx.user.email || "a team member"}.\n\nTopic: ${contentData.topic || "N/A"}\n\nPreview:\n${contentPreview}...\n\nYou can now publish this content to the client's CMS via the Publishing page.`,
              });
            } catch (e) {
              console.error("Failed to send approval notification:", e);
            }
          }
        }
        
        await updateContent(id, updates);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        await deleteContent(input.id);
        return { success: true };
      }),
    exportHtml: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const content = await getContentById(input.id);
        if (!content) throw new Error("Content not found");
        return {
          title: content.title,
          content: content.content,
          imageUrl: content.imageUrl,
          topic: content.topic,
          status: content.status,
          aiModel: content.aiModel,
          createdAt: content.createdAt,
        };
      }),
    schedule: protectedProcedure
      .input(z.object({
        contentId: z.number(),
        scheduledPublishDate: z.date(),
      }))
      .mutation(async ({ input }) => {
        await updateContent(input.contentId, {
          scheduledPublishDate: input.scheduledPublishDate,
          isScheduled: 1,
        });
        return { success: true };
      }),
  }),

  bulk: bulkRouter,
  templates: templatesRouter,
  collaboration: collaborationRouter,
  analytics: analyticsRouter,
  repurposing: repurposingRouter,
  qualityScore: qualityScoreRouter,
  webhooks: webhooksRouter,
  briefs: briefsRouter,
  notifications: notificationsRouter,
  seoAudit: seoAuditRouter,
  agencySettings: agencySettingsRouter,
  recurringPlans: recurringPlansRouter,

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
