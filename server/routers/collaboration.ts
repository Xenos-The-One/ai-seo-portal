import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { addComment, getContentComments, updateCommentStatus, createRevision, getContentRevisions } from "../db";

export const collaborationRouter = router({
  // Comments
  addComment: protectedProcedure
    .input(z.object({
      contentId: z.number(),
      comment: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const commentId = await addComment({
        contentId: input.contentId,
        userId: ctx.user.id,
        comment: input.comment,
        status: "pending",
      });
      return { id: commentId };
    }),

  getComments: protectedProcedure
    .input(z.object({ contentId: z.number() }))
    .query(async ({ input }) => {
      return await getContentComments(input.contentId);
    }),

  resolveComment: protectedProcedure
    .input(z.object({ commentId: z.number() }))
    .mutation(async ({ input }) => {
      await updateCommentStatus(input.commentId, 1); // 1 = resolved
      return { success: true };
    }),

  // Revisions
  createRevision: protectedProcedure
    .input(z.object({
      contentId: z.number(),
      title: z.string().optional(),
      content: z.string().optional(),
      changeDescription: z.string(),
      revisionNumber: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const revisionId = await createRevision({
        contentId: input.contentId,
        userId: ctx.user.id,
        title: input.title || null,
        content: input.content || null,
        changeDescription: input.changeDescription,
        revisionNumber: input.revisionNumber,
      });
      return { id: revisionId };
    }),

  getRevisions: protectedProcedure
    .input(z.object({ contentId: z.number() }))
    .query(async ({ input }) => {
      return await getContentRevisions(input.contentId);
    }),
});
