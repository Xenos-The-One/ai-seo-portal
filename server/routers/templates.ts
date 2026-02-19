import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { createTemplate, getTemplatesByUser, deleteTemplate } from "../db";

export const templatesRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    return await getTemplatesByUser(ctx.user.id);
  }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      description: z.string().optional(),
      type: z.enum(["how-to", "listicle", "case-study", "guide", "news", "custom"]),
      prompt: z.string().min(1),
      isPublic: z.number().default(0),
    }))
    .mutation(async ({ ctx, input }) => {
      const templateId = await createTemplate({
        name: input.name,
        description: input.description || null,
        type: input.type,
        prompt: input.prompt,
        createdBy: ctx.user.id,
        isPublic: input.isPublic,
      });
      return { id: templateId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteTemplate(input.id);
      return { success: true };
    }),
});
