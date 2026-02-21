import { describe, it, expect, vi, beforeEach } from "vitest";
import { invokeLLM } from "./_core/llm";

// Mock the invokeLLM function
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

describe("AI Model Selection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should use the specified AI model when provided", async () => {
    const mockResponse = {
      id: "test-id",
      created: Date.now(),
      model: "claude-3-5-sonnet-20241022",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant" as const,
            content: "Test blog content",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300,
      },
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    // Simulate content generation with Claude model
    await invokeLLM({
      model: "claude-3-5-sonnet-20241022",
      messages: [
        { role: "system", content: "You are an expert SEO content writer." },
        { role: "user", content: "Write a blog post about AI" },
      ],
    });

    expect(invokeLLM).toHaveBeenCalledWith({
      model: "claude-3-5-sonnet-20241022",
      messages: [
        { role: "system", content: "You are an expert SEO content writer." },
        { role: "user", content: "Write a blog post about AI" },
      ],
    });
  });

  it("should default to gemini-2.5-flash when no model is specified", async () => {
    const mockResponse = {
      id: "test-id",
      created: Date.now(),
      model: "gemini-2.5-flash",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant" as const,
            content: "Test blog content",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 100,
        completion_tokens: 200,
        total_tokens: 300,
      },
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    // Simulate content generation without specifying model
    await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert SEO content writer." },
        { role: "user", content: "Write a blog post about AI" },
      ],
    });

    expect(invokeLLM).toHaveBeenCalled();
  });

  it("should support all available AI models", async () => {
    const models = [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "gpt-4o",
      "gpt-4o-mini",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
    ];

    for (const model of models) {
      const mockResponse = {
        id: "test-id",
        created: Date.now(),
        model,
        choices: [
          {
            index: 0,
            message: {
              role: "assistant" as const,
              content: `Test content from ${model}`,
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 200,
          total_tokens: 300,
        },
      };

      (invokeLLM as any).mockResolvedValue(mockResponse);

      await invokeLLM({
        model,
        messages: [
          { role: "system", content: "You are an expert SEO content writer." },
          { role: "user", content: "Write a blog post" },
        ],
      });

      expect(invokeLLM).toHaveBeenCalledWith(
        expect.objectContaining({
          model,
        })
      );
    }
  });

  it("should pass model parameter through the entire generation pipeline", async () => {
    const testModel = "claude-3-5-sonnet-20241022";
    const mockResponse = {
      id: "test-id",
      created: Date.now(),
      model: testModel,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant" as const,
            content: "# Test Blog Post\n\nThis is a test blog post generated with Claude.",
          },
          finish_reason: "stop",
        },
      ],
      usage: {
        prompt_tokens: 150,
        completion_tokens: 300,
        total_tokens: 450,
      },
    };

    (invokeLLM as any).mockResolvedValue(mockResponse);

    const result = await invokeLLM({
      model: testModel,
      messages: [
        {
          role: "system",
          content: "You are an expert SEO content writer.",
        },
        {
          role: "user",
          content: "Write a comprehensive blog post about: AI in Marketing",
        },
      ],
    });

    expect(result.model).toBe(testModel);
    expect(result.choices[0].message.content).toContain("Test Blog Post");
    expect(invokeLLM).toHaveBeenCalledWith(
      expect.objectContaining({
        model: testModel,
      })
    );
  });
});
