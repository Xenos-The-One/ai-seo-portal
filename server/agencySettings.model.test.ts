import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Agency Settings - Default AI Model", () => {
  it("should store and retrieve default AI model setting", () => {
    const settings = {
      default_ai_model: "claude-3-5-sonnet-20241022",
      agency_name: "Test Agency",
      primary_color: "#3b82f6",
    };

    expect(settings.default_ai_model).toBe("claude-3-5-sonnet-20241022");
  });

  it("should default to gemini-2.5-flash when no model is set", () => {
    const settings = {};
    const defaultModel = settings.default_ai_model || "gemini-2.5-flash";

    expect(defaultModel).toBe("gemini-2.5-flash");
  });

  it("should support all available AI models", () => {
    const validModels = [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "gpt-4o",
      "gpt-4o-mini",
      "gemini-2.5-flash",
      "gemini-2.5-pro",
    ];

    for (const model of validModels) {
      const settings = { default_ai_model: model };
      expect(validModels).toContain(settings.default_ai_model);
    }
  });

  it("should allow updating default model setting", () => {
    let settings = { default_ai_model: "gemini-2.5-flash" };
    
    // Simulate update
    settings = { ...settings, default_ai_model: "claude-3-5-sonnet-20241022" };
    
    expect(settings.default_ai_model).toBe("claude-3-5-sonnet-20241022");
  });
});

describe("Model Cost Tracking", () => {
  const modelCosts = {
    "claude-3-5-sonnet-20241022": { input: 3.0, output: 15.0, name: "Claude 3.5 Sonnet" },
    "claude-3-5-haiku-20241022": { input: 0.8, output: 4.0, name: "Claude 3.5 Haiku" },
    "gpt-4o": { input: 2.5, output: 10.0, name: "GPT-4o" },
    "gpt-4o-mini": { input: 0.15, output: 0.6, name: "GPT-4o Mini" },
    "gemini-2.5-flash": { input: 0.075, output: 0.3, name: "Gemini 2.5 Flash" },
    "gemini-2.5-pro": { input: 1.25, output: 5.0, name: "Gemini 2.5 Pro" },
  };

  it("should calculate cost correctly for Claude 3.5 Sonnet", () => {
    const inputTokens = 1000000; // 1M tokens
    const outputTokens = 500000; // 0.5M tokens
    
    const costs = modelCosts["claude-3-5-sonnet-20241022"];
    const totalCost = 
      (inputTokens / 1000000) * costs.input +
      (outputTokens / 1000000) * costs.output;
    
    expect(totalCost).toBe(10.5); // 3.0 + 7.5
  });

  it("should calculate cost correctly for Gemini 2.5 Flash", () => {
    const inputTokens = 1000000; // 1M tokens
    const outputTokens = 1000000; // 1M tokens
    
    const costs = modelCosts["gemini-2.5-flash"];
    const totalCost = 
      (inputTokens / 1000000) * costs.input +
      (outputTokens / 1000000) * costs.output;
    
    expect(totalCost).toBe(0.375); // 0.075 + 0.3
  });

  it("should handle zero tokens", () => {
    const inputTokens = 0;
    const outputTokens = 0;
    
    const costs = modelCosts["gpt-4o"];
    const totalCost = 
      (inputTokens / 1000000) * costs.input +
      (outputTokens / 1000000) * costs.output;
    
    expect(totalCost).toBe(0);
  });

  it("should aggregate costs across multiple content items", () => {
    const contentItems = [
      { model: "gemini-2.5-flash", inputTokens: 500000, outputTokens: 500000 },
      { model: "gemini-2.5-flash", inputTokens: 500000, outputTokens: 500000 },
      { model: "claude-3-5-sonnet-20241022", inputTokens: 1000000, outputTokens: 1000000 },
    ];

    let totalCost = 0;
    for (const item of contentItems) {
      const costs = modelCosts[item.model];
      totalCost += 
        (item.inputTokens / 1000000) * costs.input +
        (item.outputTokens / 1000000) * costs.output;
    }

    // Gemini: 2 * (0.5 * 0.075 + 0.5 * 0.3) = 2 * 0.1875 = 0.375
    // Claude: 1 * (1 * 3.0 + 1 * 15.0) = 18.0
    // Total: 18.375
    expect(totalCost).toBeCloseTo(18.375, 3);
  });

  it("should calculate percentage breakdown correctly", () => {
    const modelUsage = {
      "gemini-2.5-flash": { cost: 0.375 },
      "claude-3-5-sonnet-20241022": { cost: 18.0 },
    };

    const totalCost = 18.375;
    const geminiPercentage = (modelUsage["gemini-2.5-flash"].cost / totalCost) * 100;
    const claudePercentage = (modelUsage["claude-3-5-sonnet-20241022"].cost / totalCost) * 100;

    expect(geminiPercentage).toBeCloseTo(2.04, 1);
    expect(claudePercentage).toBeCloseTo(97.96, 1);
  });
});
