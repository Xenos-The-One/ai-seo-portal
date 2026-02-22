import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Design Standards Integration", () => {
  const mockContext: Context = {
    user: { id: 1, name: "Test User", email: "test@example.com", role: "user" },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(mockContext);

  it("should initialize default Takeoff design standard", async () => {
    const result = await caller.designStandards.initializeDefault();
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.message).toContain("initialized");
  });

  it("should get all design standards", async () => {
    const standards = await caller.designStandards.getAll();
    expect(Array.isArray(standards)).toBe(true);
    expect(standards.length).toBeGreaterThan(0);
  });

  it("should get default design standard", async () => {
    const defaultStandard = await caller.designStandards.getDefault();
    expect(defaultStandard).toBeDefined();
    expect(defaultStandard?.isDefault).toBe(1);
    expect(defaultStandard?.name).toBe("Takeoff Premium Design");
  });

  it("should create a custom design standard", async () => {
    const result = await caller.designStandards.create({
      name: "Custom Design",
      description: "A custom design standard",
      designPrompt: "Custom design guidelines here",
      colorScheme: "light",
      designStyle: "minimal",
    });
    expect(result.success).toBe(true);
    expect(result.id).toBeDefined();
  });

  it("should get design standard by ID", async () => {
    const standards = await caller.designStandards.getAll();
    const firstStandard = standards[0];
    
    const standard = await caller.designStandards.getById({ id: firstStandard.id });
    expect(standard).toBeDefined();
    expect(standard?.id).toBe(firstStandard.id);
  });

  it("should update a design standard", async () => {
    const standards = await caller.designStandards.getAll();
    const standardToUpdate = standards.find(s => s.name === "Custom Design");
    
    if (standardToUpdate) {
      const result = await caller.designStandards.update({
        id: standardToUpdate.id,
        description: "Updated description",
      });
      expect(result.success).toBe(true);
    }
  });

  it("should delete (soft delete) a design standard", async () => {
    const standards = await caller.designStandards.getAll();
    const standardToDelete = standards.find(s => s.name === "Custom Design");
    
    if (standardToDelete) {
      const result = await caller.designStandards.delete({ id: standardToDelete.id });
      expect(result.success).toBe(true);
    }
  });

  it("should prevent initializing default twice", async () => {
    const result = await caller.designStandards.initializeDefault();
    expect(result.success).toBe(false);
    expect(result.message).toContain("already exists");
  });

  it("should validate Takeoff design prompt content", async () => {
    const defaultStandard = await caller.designStandards.getDefault();
    expect(defaultStandard?.designPrompt).toContain("motion-driven");
    expect(defaultStandard?.designPrompt).toContain("CORE PRINCIPLES");
    expect(defaultStandard?.designPrompt).toContain("MARQUEE CAROUSEL");
    expect(defaultStandard?.referenceUrl).toContain("takeoffdigitalsolutions.com");
  });
});
