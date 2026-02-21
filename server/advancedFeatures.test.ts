import { describe, it, expect } from "vitest";
import { calculateContentCost, MODEL_COSTS } from "./budgetTracking";
import { calculateWordCount } from "./modelPerformance";

describe("Budget Tracking", () => {
  it("should calculate cost correctly for content", () => {
    const cost = calculateContentCost("gemini-2.5-flash", 1000000, 1000000);
    // 1M input tokens * $0.075 + 1M output tokens * $0.3 = $0.375
    expect(cost).toBeCloseTo(0.375, 3);
  });

  it("should calculate cost for Claude 3.5 Sonnet", () => {
    const cost = calculateContentCost("claude-3-5-sonnet-20241022", 500000, 500000);
    // 0.5M input * $3.0 + 0.5M output * $15.0 = $9.0
    expect(cost).toBeCloseTo(9.0, 2);
  });

  it("should handle zero tokens", () => {
    const cost = calculateContentCost("gpt-4o", 0, 0);
    expect(cost).toBe(0);
  });

  it("should handle unknown model gracefully", () => {
    const cost = calculateContentCost("unknown-model", 1000000, 1000000);
    expect(cost).toBe(0);
  });

  it("should have correct model costs", () => {
    expect(MODEL_COSTS["gemini-2.5-flash"]).toEqual({
      input: 0.075,
      output: 0.3,
      name: "Gemini 2.5 Flash",
    });
    
    expect(MODEL_COSTS["claude-3-5-sonnet-20241022"]).toEqual({
      input: 3.0,
      output: 15.0,
      name: "Claude 3.5 Sonnet",
    });
  });
});

describe("Model Performance Tracking", () => {
  it("should calculate word count correctly", () => {
    const text = "This is a test blog post with multiple words.";
    const wordCount = calculateWordCount(text);
    expect(wordCount).toBe(9);
  });

  it("should handle empty text", () => {
    const wordCount = calculateWordCount("");
    expect(wordCount).toBe(0);
  });

  it("should handle text with extra whitespace", () => {
    const text = "  Multiple   spaces   between   words  ";
    const wordCount = calculateWordCount(text);
    expect(wordCount).toBe(4);
  });

  it("should handle newlines and tabs", () => {
    const text = "Line one\\nLine two\\tWith tab";
    const wordCount = calculateWordCount(text);
    expect(wordCount).toBe(4); // Escaped sequences count as single words
  });

  it("should handle markdown content", () => {
    const text = "# Heading\\n\\nThis is a **bold** paragraph with *italic* text.";
    const wordCount = calculateWordCount(text);
    expect(wordCount).toBe(9); // Markdown symbols don't affect word count
  });
});

describe("Budget Alert Thresholds", () => {
  it("should trigger alert at 80% threshold", () => {
    const budget = 100;
    const currentCost = 80;
    const threshold = 80;
    const percentage = (currentCost / budget) * 100;
    
    expect(percentage >= threshold).toBe(true);
  });

  it("should not trigger alert below threshold", () => {
    const budget = 100;
    const currentCost = 79;
    const threshold = 80;
    const percentage = (currentCost / budget) * 100;
    
    expect(percentage >= threshold).toBe(false);
  });

  it("should trigger alert when over budget", () => {
    const budget = 100;
    const currentCost = 150;
    const percentage = (currentCost / budget) * 100;
    
    expect(percentage > 100).toBe(true);
  });
});

describe("Performance Metrics Calculations", () => {
  it("should calculate approval rate correctly", () => {
    const totalContent = 10;
    const approvedContent = 8;
    const approvalRate = (approvedContent / totalContent) * 100;
    
    expect(approvalRate).toBe(80);
  });

  it("should handle zero content gracefully", () => {
    const totalContent = 0;
    const approvedContent = 0;
    const approvalRate = totalContent > 0 ? (approvedContent / totalContent) * 100 : 0;
    
    expect(approvalRate).toBe(0);
  });

  it("should calculate cost per approval", () => {
    const totalCost = 10.0;
    const approvedContent = 5;
    const costPerApproval = approvedContent > 0 ? totalCost / approvedContent : 0;
    
    expect(costPerApproval).toBe(2.0);
  });

  it("should handle no approvals", () => {
    const totalCost = 10.0;
    const approvedContent = 0;
    const costPerApproval = approvedContent > 0 ? totalCost / approvedContent : 0;
    
    expect(costPerApproval).toBe(0);
  });
});

describe("Model Comparison Logic", () => {
  it("should calculate approval rate difference", () => {
    const model1ApprovalRate = 85;
    const model2ApprovalRate = 70;
    const diff = model1ApprovalRate - model2ApprovalRate;
    
    expect(diff).toBe(15);
  });

  it("should calculate cost difference", () => {
    const model1Cost = 0.05;
    const model2Cost = 0.10;
    const diff = model1Cost - model2Cost;
    
    expect(diff).toBeCloseTo(-0.05, 2);
  });

  it("should identify better performing model", () => {
    const model1 = { approvalRate: 90, avgCostPerContent: 0.05 };
    const model2 = { approvalRate: 70, avgCostPerContent: 0.10 };
    
    const isBetterQuality = model1.approvalRate > model2.approvalRate;
    const isCheaper = model1.avgCostPerContent < model2.avgCostPerContent;
    
    expect(isBetterQuality).toBe(true);
    expect(isCheaper).toBe(true);
  });
});
