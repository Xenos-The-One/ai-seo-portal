import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { invokeLLM } from "../_core/llm";
import { getContentById } from "../db";

export const seoAuditRouter = router({
  // Run a full SEO audit on content using AI
  analyze: protectedProcedure
    .input(z.object({
      contentId: z.number(),
      targetKeywords: z.array(z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const content = await getContentById(input.contentId);
      if (!content) throw new Error("Content not found");

      const contentText = content.content || "";
      const title = content.title || "";
      const topic = content.topic || "";

      // Basic text analysis (no AI needed)
      const wordCount = contentText.split(/\s+/).filter(Boolean).length;
      const sentenceCount = contentText.split(/[.!?]+/).filter(Boolean).length;
      const paragraphCount = contentText.split(/\n\n+/).filter(Boolean).length;
      const avgWordsPerSentence = sentenceCount > 0 ? Math.round(wordCount / sentenceCount) : 0;

      // Heading analysis
      const h1Matches = contentText.match(/^#\s+.+$/gm) || [];
      const h2Matches = contentText.match(/^##\s+.+$/gm) || [];
      const h3Matches = contentText.match(/^###\s+.+$/gm) || [];
      const headingCount = h1Matches.length + h2Matches.length + h3Matches.length;

      // Link analysis
      const internalLinks = (contentText.match(/\[.*?\]\(\/.*?\)/g) || []).length;
      const externalLinks = (contentText.match(/\[.*?\]\(https?:\/\/.*?\)/g) || []).length;

      // Image analysis
      const imageCount = (contentText.match(/!\[.*?\]\(.*?\)/g) || []).length;

      // Keyword analysis
      const keywords = input.targetKeywords || [topic];
      const keywordAnalysis = keywords.map(kw => {
        const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = contentText.match(regex) || [];
        const count = matches.length;
        const density = wordCount > 0 ? ((count / wordCount) * 100).toFixed(2) : "0";
        const inTitle = title.toLowerCase().includes(kw.toLowerCase());
        const inFirstParagraph = contentText.split(/\n\n/)[0]?.toLowerCase().includes(kw.toLowerCase()) || false;
        const inHeadings = [...h1Matches, ...h2Matches, ...h3Matches].some(h => h.toLowerCase().includes(kw.toLowerCase()));

        return {
          keyword: kw,
          count,
          density: parseFloat(density),
          inTitle,
          inFirstParagraph,
          inHeadings,
        };
      });

      // AI-powered deep analysis
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are an expert SEO analyst. Analyze the following blog content and provide a detailed SEO audit. Return your analysis as JSON with this exact structure:
{
  "overallScore": <number 0-100>,
  "readabilityScore": <number 0-100>,
  "seoScore": <number 0-100>,
  "contentQualityScore": <number 0-100>,
  "technicalSeoScore": <number 0-100>,
  "metaDescription": "<suggested meta description under 160 chars>",
  "suggestedTitle": "<SEO-optimized title suggestion>",
  "issues": [
    {"severity": "critical|warning|info", "category": "keyword|structure|readability|technical|content", "message": "<description>", "suggestion": "<how to fix>"}
  ],
  "strengths": ["<list of things done well>"],
  "improvements": ["<prioritized list of improvements>"]
}`
          },
          {
            role: "user",
            content: `Title: ${title}\nTopic: ${topic}\nTarget Keywords: ${keywords.join(", ")}\n\nContent:\n${contentText.substring(0, 8000)}`
          }
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "seo_audit",
            strict: true,
            schema: {
              type: "object",
              properties: {
                overallScore: { type: "number" },
                readabilityScore: { type: "number" },
                seoScore: { type: "number" },
                contentQualityScore: { type: "number" },
                technicalSeoScore: { type: "number" },
                metaDescription: { type: "string" },
                suggestedTitle: { type: "string" },
                issues: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      severity: { type: "string" },
                      category: { type: "string" },
                      message: { type: "string" },
                      suggestion: { type: "string" },
                    },
                    required: ["severity", "category", "message", "suggestion"],
                    additionalProperties: false,
                  }
                },
                strengths: { type: "array", items: { type: "string" } },
                improvements: { type: "array", items: { type: "string" } },
              },
              required: ["overallScore", "readabilityScore", "seoScore", "contentQualityScore", "technicalSeoScore", "metaDescription", "suggestedTitle", "issues", "strengths", "improvements"],
              additionalProperties: false,
            }
          }
        }
      });

      let aiAnalysis;
      try {
        aiAnalysis = JSON.parse((response.choices[0].message.content as string) || "{}");
      } catch {
        aiAnalysis = {
          overallScore: 0,
          readabilityScore: 0,
          seoScore: 0,
          contentQualityScore: 0,
          technicalSeoScore: 0,
          metaDescription: "",
          suggestedTitle: "",
          issues: [],
          strengths: [],
          improvements: [],
        };
      }

      return {
        contentId: input.contentId,
        title,
        topic,
        // Basic metrics
        metrics: {
          wordCount,
          sentenceCount,
          paragraphCount,
          avgWordsPerSentence,
          headingCount,
          h1Count: h1Matches.length,
          h2Count: h2Matches.length,
          h3Count: h3Matches.length,
          internalLinks,
          externalLinks,
          imageCount,
          readingTime: Math.ceil(wordCount / 200),
        },
        // Keyword analysis
        keywordAnalysis,
        // AI analysis
        aiAnalysis,
      };
    }),
});
