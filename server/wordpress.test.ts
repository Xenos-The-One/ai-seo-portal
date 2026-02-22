import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb, upsertUser } from "./db";
import { users, clients, content, wordpressConnections, wordpressPublishHistory } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("WordPress Integration", () => {
  let testUserId: number;
  let testClientId: number;
  let testContentId: number;
  let testConnectionId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    await upsertUser({
      openId: "test-wordpress-user",
      name: "WordPress Test User",
      email: "wordpress@test.com",
    });

    const [user] = await db.select().from(users).where(eq(users.openId, "test-wordpress-user"));
    testUserId = user.id;

    // Create test client
    const [client] = await db.insert(clients).values({
      name: "WordPress Test Client",
      email: "client@test.com",
      createdBy: testUserId,
    });
    testClientId = client.insertId;

    // Create test content
    const [contentRecord] = await db.insert(content).values({
      clientId: testClientId,
      createdBy: testUserId,
      title: "Test WordPress Post",
      topic: "WordPress Publishing Test",
      content: "This is a test post for WordPress publishing integration.",
      status: "approved",
    });
    testContentId = contentRecord.insertId;
  });

  const createCaller = () => {
    return appRouter.createCaller({
      user: { id: testUserId, openId: "test-wordpress-user", name: "WordPress Test User" },
      req: {} as any,
      res: {} as any,
    });
  };

  it("should add a WordPress connection", async () => {
    const caller = createCaller();

    const result = await caller.wordpress.addConnection({
      clientId: testClientId,
      siteName: "Test WordPress Site",
      siteUrl: "https://example.com",
      username: "testuser",
      applicationPassword: "test-password-1234",
      defaultStatus: "draft",
    });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("number");
    testConnectionId = result.id;
  });

  it("should get WordPress connections for a client", async () => {
    const caller = createCaller();

    const connections = await caller.wordpress.getConnections({
      clientId: testClientId,
    });

    expect(Array.isArray(connections)).toBe(true);
    expect(connections.length).toBeGreaterThan(0);
    expect(connections[0]).toHaveProperty("siteName");
    expect(connections[0]).toHaveProperty("siteUrl");
    expect(connections[0].siteName).toBe("Test WordPress Site");
  });

  it("should update a WordPress connection", async () => {
    const caller = createCaller();

    const result = await caller.wordpress.updateConnection({
      id: testConnectionId,
      siteName: "Updated WordPress Site",
      defaultStatus: "publish",
    });

    expect(result.success).toBe(true);

    // Verify update
    const connections = await caller.wordpress.getConnections({
      clientId: testClientId,
    });
    const updated = connections.find((c) => c.id === testConnectionId);
    expect(updated?.siteName).toBe("Updated WordPress Site");
    expect(updated?.defaultStatus).toBe("publish");
  });

  it("should handle test connection (will fail with fake credentials)", async () => {
    const caller = createCaller();

    const result = await caller.wordpress.testConnection({
      siteUrl: "https://example.com",
      username: "testuser",
      applicationPassword: "fake-password",
    });

    // Should return a result (success or failure)
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("message");
    expect(typeof result.success).toBe("boolean");
  });

  it("should handle publish to WordPress (will fail with fake credentials)", async () => {
    const caller = createCaller();

    const result = await caller.wordpress.publishToWordPress({
      contentId: testContentId,
      connectionId: testConnectionId,
      publishStatus: "draft",
    });

    // Should return a result (success or failure)
    expect(result).toHaveProperty("success");
    expect(result).toHaveProperty("message");
    
    // With fake credentials, it should fail
    expect(result.success).toBe(false);
  });

  it("should get publish history for content", async () => {
    const caller = createCaller();

    const history = await caller.wordpress.getPublishHistory({
      contentId: testContentId,
    });

    expect(Array.isArray(history)).toBe(true);
    // Should have at least one failed attempt from previous test
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]).toHaveProperty("success");
    expect(history[0]).toHaveProperty("publishStatus");
  });

  it("should delete a WordPress connection", async () => {
    const caller = createCaller();

    const result = await caller.wordpress.deleteConnection({
      id: testConnectionId,
    });

    expect(result.success).toBe(true);

    // Verify deletion
    const connections = await caller.wordpress.getConnections({
      clientId: testClientId,
    });
    const deleted = connections.find((c) => c.id === testConnectionId);
    expect(deleted).toBeUndefined();
  });

  it("should validate required fields when adding connection", async () => {
    const caller = createCaller();

    await expect(
      caller.wordpress.addConnection({
        clientId: testClientId,
        siteName: "",
        siteUrl: "https://example.com",
        username: "testuser",
        applicationPassword: "password",
        defaultStatus: "draft",
      })
    ).rejects.toThrow();
  });

  it("should validate URL format when adding connection", async () => {
    const caller = createCaller();

    await expect(
      caller.wordpress.addConnection({
        clientId: testClientId,
        siteName: "Test Site",
        siteUrl: "not-a-valid-url",
        username: "testuser",
        applicationPassword: "password",
        defaultStatus: "draft",
      })
    ).rejects.toThrow();
  });
});
