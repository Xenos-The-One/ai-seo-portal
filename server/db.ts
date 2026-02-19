import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, clients, InsertClient, content, InsertContent, contentTemplates, InsertContentTemplate, contentComments, contentRevisions, contentAnalytics, contentRepurposed } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Client management queries
export async function createClient(client: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(clients).values(client);
  return result[0].insertId;
}

export async function getClientsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).where(eq(clients.createdBy, userId));
}

export async function getClientById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(clients).where(eq(clients.id, id)).limit(1);
  return result[0];
}

export async function updateClient(id: number, updates: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(clients).set({ ...updates, updatedAt: new Date() }).where(eq(clients.id, id));
}

export async function deleteClient(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(clients).where(eq(clients.id, id));
}

// Content management queries
export async function createContent(contentData: InsertContent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(content).values(contentData);
  return result[0].insertId;
}

export async function getContentByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(content).where(eq(content.createdBy, userId)).orderBy(content.createdAt);
}

export async function getContentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(content).where(eq(content.id, id)).limit(1);
  return result[0];
}

export async function updateContent(id: number, updates: Partial<InsertContent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(content).set({ ...updates, updatedAt: new Date() }).where(eq(content.id, id));
}

export async function deleteContent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(content).where(eq(content.id, id));
}

export async function getContentByClient(clientId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(content).where(eq(content.clientId, clientId)).orderBy(content.createdAt);
}

export async function getContentWithClient(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      content: content,
      client: clients,
    })
    .from(content)
    .leftJoin(clients, eq(content.clientId, clients.id))
    .where(eq(content.createdBy, userId))
    .orderBy(content.createdAt);
}


// Template functions
export async function createTemplate(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentTemplates).values(data);
  return result[0];
}

export async function getTemplatesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentTemplates)
    .where(eq(contentTemplates.createdBy, userId))
    .orderBy(contentTemplates.createdAt);
}

export async function getPublicTemplates() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentTemplates)
    .where(eq(contentTemplates.isPublic, 1))
    .orderBy(contentTemplates.createdAt);
}

export async function getTemplateById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(contentTemplates)
    .where(eq(contentTemplates.id, id))
    .limit(1);
  return result[0] || null;
}

export async function updateTemplate(id: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contentTemplates).set(updates).where(eq(contentTemplates.id, id));
}

export async function deleteTemplate(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contentTemplates).where(eq(contentTemplates.id, id));
}


// Collaboration functions
export async function addComment(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentComments).values(data);
  return result[0];
}

export async function getContentComments(contentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentComments)
    .where(eq(contentComments.contentId, contentId))
    .orderBy(contentComments.createdAt);
}

export async function updateCommentStatus(id: number, status: "pending" | "resolved") {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contentComments).set({ status }).where(eq(contentComments.id, id));
}

export async function createRevision(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentRevisions).values(data);
  return result[0];
}

export async function getContentRevisions(contentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentRevisions)
    .where(eq(contentRevisions.contentId, contentId))
    .orderBy(contentRevisions.revisionNumber);
}

// Analytics functions
export async function recordAnalytics(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentAnalytics).values(data);
  return result[0];
}

export async function getContentAnalytics(contentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentAnalytics)
    .where(eq(contentAnalytics.contentId, contentId))
    .orderBy(contentAnalytics.recordedAt);
}

export async function updateAnalytics(contentId: number, updates: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(contentAnalytics).set(updates).where(eq(contentAnalytics.contentId, contentId));
}

// Repurposing functions
export async function createRepurposedContent(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(contentRepurposed).values(data);
  return result[0];
}

export async function getRepurposedContent(contentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(contentRepurposed)
    .where(eq(contentRepurposed.contentId, contentId))
    .orderBy(contentRepurposed.createdAt);
}

export async function deleteRepurposedContent(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(contentRepurposed).where(eq(contentRepurposed.id, id));
}
