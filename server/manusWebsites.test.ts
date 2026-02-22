import { describe, it, expect, beforeAll, vi } from "vitest";
import { appRouter } from "./routers";
import { getDb, upsertUser } from "./db";
import { users, clients, content, manusWebsites, manusPublishHistory } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import * as manusWebdev from "./_core/manusWebdev";

// Mock the Manus webdev API calls
vi.mock("./_core/manusWebdev", () => ({
  createManusWebProject: vi.fn().mockResolvedValue({
    projectId: "test-project-123",
    versionId: "test-version-456",
    name: "test-website",
    title: "Test Website",
    url: "https://test.manus.space",
    status: "active",
  }),
  getManusWebProject: vi.fn().mockResolvedValue({
    projectId: "test-project-123",
    versionId: "test-version-789",
    name: "test-website",
    title: "Test Website",
    url: "https://test.manus.space",
    status: "active",
  }),
  publishToManusWebsite: vi.fn().mockResolvedValue({
    success: true,
    url: "https://test.manus.space/blog/test-post",
    message: "Content published successfully",
  }),
}));

describe("Manus Website Integration", () => {
  let testUserId: number;
  let testClientId: number;
  let testContentId: number;
  let testWebsiteId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    await upsertUser({
      openId: "test-manus-user",
      name: "Manus Test User",
      email: "manus@test.com",
    });

    const [user] = await db.select().from(users).where(eq(users.openId, "test-manus-user"));
    testUserId = user.id;

    // Create test client
    const [client] = await db.insert(clients).values({
      name: "Manus Test Client",
      email: "client@test.com",
      createdBy: testUserId,
    });
    testClientId = client.insertId;

    // Create test content
    const [contentRecord] = await db.insert(content).values({
      clientId: testClientId,
      createdBy: testUserId,
      title: "Test Manus Post",
      topic: "Manus Website Test",
      content: "This is a test post for Manus website publishing integration.",
      status: "approved",
    });
    testContentId = contentRecord.insertId;
  });

  const createCaller = () => {
    return appRouter.createCaller({
      user: { id: testUserId, openId: "test-manus-user", name: "Manus Test User" },
      req: {} as any,
      res: {} as any,
    });
  };

  it("should create a Manus website", async () => {
    const caller = createCaller();

    const result = await caller.manusWebsites.createWebsite({
      clientId: testClientId,
      projectName: "test-client-blog",
      projectTitle: "Test Client Blog",
      projectDescription: "A test blog for the client",
      template: "web-static",
    });

    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("projectId");
    expect(result).toHaveProperty("url");
    
    testWebsiteId = result.id!;

    // Verify the mock was called
    expect(manusWebdev.createManusWebProject).toHaveBeenCalledWith({
      name: "test-client-blog",
      title: "Test Client Blog",
      description: "A test blog for the client",
      template: "web-static",
      features: undefined,
    });
  });

  it("should get Manus websites for a client", async () => {
    const caller = createCaller();

    const websites = await caller.manusWebsites.getWebsites({
      clientId: testClientId,
    });

    expect(Array.isArray(websites)).toBe(true);
    expect(websites.length).toBeGreaterThan(0);
    expect(websites[0]).toHaveProperty("projectName");
    expect(websites[0]).toHaveProperty("projectTitle");
    expect(websites[0]).toHaveProperty("projectId");
    expect(websites[0].projectName).toBe("test-client-blog");
  });

  it("should update a Manus website", async () => {
    const caller = createCaller();

    const result = await caller.manusWebsites.updateWebsite({
      id: testWebsiteId,
      projectTitle: "Updated Test Blog",
      customDomain: "blog.testclient.com",
    });

    expect(result.success).toBe(true);

    // Verify update
    const websites = await caller.manusWebsites.getWebsites({
      clientId: testClientId,
    });
    const updated = websites.find((w) => w.id === testWebsiteId);
    expect(updated?.projectTitle).toBe("Updated Test Blog");
    expect(updated?.customDomain).toBe("blog.testclient.com");
  });

  it("should refresh website status from Manus API", async () => {
    const caller = createCaller();

    const result = await caller.manusWebsites.refreshWebsite({
      id: testWebsiteId,
    });

    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
    expect(result).toHaveProperty("projectInfo");

    // Verify the mock was called
    expect(manusWebdev.getManusWebProject).toHaveBeenCalled();
  });

  it("should publish content to Manus website", async () => {
    const caller = createCaller();

    const result = await caller.manusWebsites.publishToManus({
      contentId: testContentId,
      websiteId: testWebsiteId,
      slug: "test-post",
    });

    expect(result).toHaveProperty("success");
    expect(result.success).toBe(true);
    expect(result).toHaveProperty("message");

    // Verify the mock was called
    expect(manusWebdev.publishToManusWebsite).toHaveBeenCalledWith({
      projectId: "test-project-123",
      title: "Test Manus Post",
      content: "This is a test post for Manus website publishing integration.",
      slug: "test-post",
    });
  });

  it("should get publish history for content", async () => {
    const caller = createCaller();

    const history = await caller.manusWebsites.getPublishHistory({
      contentId: testContentId,
    });

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]).toHaveProperty("success");
    expect(history[0]).toHaveProperty("websiteId");
    expect(history[0]).toHaveProperty("projectTitle");
    expect(history[0].success).toBe(1);
  });

  it("should archive a Manus website", async () => {
    const caller = createCaller();

    const result = await caller.manusWebsites.deleteWebsite({
      id: testWebsiteId,
    });

    expect(result.success).toBe(true);

    // Verify soft delete
    const websites = await caller.manusWebsites.getWebsites({
      clientId: testClientId,
    });
    const archived = websites.find((w) => w.id === testWebsiteId);
    expect(archived?.isActive).toBe(0);
    expect(archived?.status).toBe("archived");
  });

  it("should validate required fields when creating website", async () => {
    const caller = createCaller();

    await expect(
      caller.manusWebsites.createWebsite({
        clientId: testClientId,
        projectName: "",
        projectTitle: "Test",
        template: "web-static",
      })
    ).rejects.toThrow();
  });

  it("should handle API errors gracefully", async () => {
    const caller = createCaller();

    // Mock API failure
    vi.mocked(manusWebdev.createManusWebProject).mockRejectedValueOnce(
      new Error("API connection failed")
    );

    const result = await caller.manusWebsites.createWebsite({
      clientId: testClientId,
      projectName: "error-test",
      projectTitle: "Error Test",
      template: "web-static",
    });

    expect(result.success).toBe(false);
    expect(result).toHaveProperty("message");
    expect(result.message).toContain("API connection failed");
  });
});
