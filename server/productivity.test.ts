import { describe, it, expect, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

describe("Productivity Enhancements", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let clientId: number;

  beforeEach(async () => {
    const mockContext: TrpcContext = {
      user: {
        id: 1,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        role: "user",
        loginMethod: "manus",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };
    caller = appRouter.createCaller(mockContext);

    // Create test client
    const client = await caller.clients.create({
      name: "Test Client",
      email: "client@test.com",
    });
    clientId = client.id;
  });

  describe("A/B Testing", () => {
    it("should create A/B test with two model versions", async () => {
      const test = await caller.abTests.create({
        clientId,
        topic: "AI in Healthcare",
        modelA: "gemini-2.5-flash",
        modelB: "claude-3-5-haiku-20241022",
        enableWebResearch: false,
        shouldGenerateImage: false,
      });

      expect(test.id).toBeGreaterThan(0);

      const retrieved = await caller.abTests.getById({ id: test.id });
      expect(retrieved).toBeDefined();
      expect(retrieved?.topic).toBe("AI in Healthcare");
      expect(retrieved?.modelA).toBe("gemini-2.5-flash");
      expect(retrieved?.modelB).toBe("claude-3-5-haiku-20241022");
      expect(retrieved?.contentA).toBeTruthy();
      expect(retrieved?.contentB).toBeTruthy();
    });

    it("should track performance metrics for both versions", async () => {
      const test = await caller.abTests.create({
        clientId,
        topic: "Cloud Computing Trends",
        modelA: "gemini-2.5-flash",
        modelB: "gpt-4o-mini",
        enableWebResearch: false,
        shouldGenerateImage: false,
      });

      const retrieved = await caller.abTests.getById({ id: test.id });
      expect(retrieved?.wordCountA).toBeGreaterThan(0);
      expect(retrieved?.wordCountB).toBeGreaterThan(0);
      expect(retrieved?.generationTimeMsA).toBeGreaterThan(0);
      expect(retrieved?.generationTimeMsB).toBeGreaterThan(0);
      expect(retrieved?.inputTokensA).toBeGreaterThan(0);
      expect(retrieved?.outputTokensA).toBeGreaterThan(0);
    });

    it("should set winner for A/B test", async () => {
      const test = await caller.abTests.create({
        clientId,
        topic: "Machine Learning Basics",
        modelA: "gemini-2.5-flash",
        modelB: "claude-3-5-haiku-20241022",
        enableWebResearch: false,
        shouldGenerateImage: false,
      });

      await caller.abTests.setWinner({
        id: test.id,
        winner: "A",
        notes: "Version A had better structure",
      });

      const retrieved = await caller.abTests.getById({ id: test.id });
      expect(retrieved?.winner).toBe("A");
      expect(retrieved?.notes).toBe("Version A had better structure");
    });

    it("should list all A/B tests", async () => {
      await caller.abTests.create({
        clientId,
        topic: "Test 1",
        modelA: "gemini-2.5-flash",
        modelB: "claude-3-5-haiku-20241022",
        enableWebResearch: false,
        shouldGenerateImage: false,
      });

      const tests = await caller.abTests.list();
      expect(tests.length).toBeGreaterThan(0);
      expect(tests[0].test).toBeDefined();
      expect(tests[0].client).toBeDefined();
    });

    it("should delete A/B test", async () => {
      const test = await caller.abTests.create({
        clientId,
        topic: "Test to Delete",
        modelA: "gemini-2.5-flash",
        modelB: "gpt-4o-mini",
        enableWebResearch: false,
        shouldGenerateImage: false,
      });

      await caller.abTests.delete({ id: test.id });

      const retrieved = await caller.abTests.getById({ id: test.id });
      expect(retrieved).toBeNull();
    });
  });

  describe("Content Templates", () => {
    it("should seed default templates", async () => {
      const result = await caller.templates.seedDefaults();
      expect(result.count).toBeGreaterThan(0);
      expect(result.message).toContain("Default templates added");
    });

    it("should not seed templates twice", async () => {
      await caller.templates.seedDefaults();
      const result = await caller.templates.seedDefaults();
      expect(result.count).toBe(0);
      expect(result.message).toContain("already seeded");
    });

    it("should create custom template", async () => {
      const result = await caller.templates.create({
        name: "Custom Blog Template",
        description: "My custom template",
        category: "custom",
        prompt: "Write a blog post about {{topic}}",
        structure: JSON.stringify({ sections: ["Intro", "Body", "Conclusion"] }),
        isPublic: 0,
      });

      expect(result.id).toBeGreaterThan(0);
    });

    it("should list templates", async () => {
      await caller.templates.create({
        name: "Test Template",
        category: "how-to",
        prompt: "Test prompt",
        isPublic: 0,
      });

      const templates = await caller.templates.list();
      expect(templates.length).toBeGreaterThan(0);
      expect(templates[0].name).toBeDefined();
      expect(templates[0].category).toBeDefined();
    });

    it("should delete template", async () => {
      const result = await caller.templates.create({
        name: "Template to Delete",
        category: "custom",
        prompt: "Test",
        isPublic: 0,
      });

      await caller.templates.delete({ id: result.id });

      const templates = await caller.templates.list();
      const found = templates.find(t => t.id === result.id);
      expect(found).toBeUndefined();
    });

    it("should support all template categories", async () => {
      const categories = ["product-review", "how-to", "listicle", "case-study", "comparison", "tutorial", "news", "opinion", "custom"] as const;

      for (const category of categories) {
        const result = await caller.templates.create({
          name: `${category} Template`,
          category,
          prompt: `Test prompt for ${category}`,
          isPublic: 0,
        });
        expect(result.id).toBeGreaterThan(0);
      }
    });
  });

  describe("Content Regeneration", () => {
    it("should regenerate content with different model", async () => {
      // Create initial content
      const content = await caller.content.generate({
        clientId,
        topic: "Test Topic",
        aiModel: "gemini-2.5-flash",
        shouldGenerateImage: false,
        enableWebResearch: false,
      });

      const originalContent = await caller.content.getById({ id: content.id });
      expect(originalContent?.content.aiModel).toBe("gemini-2.5-flash");

      // Regenerate with different model
      await caller.content.regenerate({
        id: content.id,
        aiModel: "gpt-4o-mini",
        enableWebResearch: false,
        shouldGenerateImage: false,
      });

      const regenerated = await caller.content.getById({ id: content.id });
      expect(regenerated?.content.aiModel).toBe("gpt-4o-mini");
      expect(regenerated?.content.content).not.toBe(originalContent?.content.content);
    });
  });
});
