import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Clients table - stores information about agency clients
 */
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }),
  company: varchar("company", { length: 255 }),
  notes: text("notes"),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

/**
 * Content table - stores AI-generated blog posts and their metadata
 */
export const content = mysqlTable("content", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().references(() => clients.id, { onDelete: "cascade" }),
  createdBy: int("createdBy").notNull().references(() => users.id),
  
  // Content fields
  title: varchar("title", { length: 500 }).notNull(),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  imagePrompt: text("imagePrompt"),
  
  // Status and workflow
  status: mysqlEnum("status", ["draft", "in_progress", "approved"]).default("draft").notNull(),
  progress: int("progress").default(0).notNull(), // 0-100
  
  // AI model and customization
  aiModel: varchar("aiModel", { length: 100 }).default("gpt-4o").notNull(),
  customPrompt: text("customPrompt"),
  
  // Token usage tracking
  inputTokens: int("inputTokens").default(0).notNull(),
  outputTokens: int("outputTokens").default(0).notNull(),
  totalTokens: int("totalTokens").default(0).notNull(),
  
  // Research statistics
  urlsFetched: int("urlsFetched").default(0).notNull(),
  urlsFailed: int("urlsFailed").default(0).notNull(),
  webSearches: int("webSearches").default(0).notNull(),
  
  // Scheduling
  scheduledPublishDate: timestamp("scheduledPublishDate"),
  isScheduled: int("isScheduled").default(0).notNull(), // 0 = false, 1 = true
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Content = typeof content.$inferSelect;
export type InsertContent = typeof content.$inferInsert;
/**
 * Content Templates table - stores reusable templates for different content types
 */
export const contentTemplates = mysqlTable("contentTemplates", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["how-to", "listicle", "case-study", "guide", "news", "custom"]).notNull(),
  prompt: text("prompt").notNull(),
  structure: text("structure"),
  createdBy: int("createdBy").notNull().references(() => users.id),
  isPublic: int("isPublic").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentTemplate = typeof contentTemplates.$inferSelect;
export type InsertContentTemplate = typeof contentTemplates.$inferInsert;


/**
 * Content Comments table - stores team feedback and comments on content
 */
export const contentComments = mysqlTable("contentComments", {
  id: int("id").autoincrement().primaryKey(),
  contentId: int("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id),
  comment: text("comment").notNull(),
  status: mysqlEnum("status", ["pending", "resolved"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentComment = typeof contentComments.$inferSelect;
export type InsertContentComment = typeof contentComments.$inferInsert;

/**
 * Content Revisions table - tracks revision history of content
 */
export const contentRevisions = mysqlTable("contentRevisions", {
  id: int("id").autoincrement().primaryKey(),
  contentId: int("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id),
  title: varchar("title", { length: 500 }),
  content: text("content"),
  changeDescription: text("changeDescription"),
  revisionNumber: int("revisionNumber").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContentRevision = typeof contentRevisions.$inferSelect;
export type InsertContentRevision = typeof contentRevisions.$inferInsert;

/**
 * Content Analytics table - stores performance metrics for published content
 */
export const contentAnalytics = mysqlTable("contentAnalytics", {
  id: int("id").autoincrement().primaryKey(),
  contentId: int("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
  views: int("views").default(0).notNull(),
  clicks: int("clicks").default(0).notNull(),
  shares: int("shares").default(0).notNull(),
  engagementRate: int("engagementRate").default(0).notNull(),
  avgTimeOnPage: int("avgTimeOnPage").default(0).notNull(),
  conversions: int("conversions").default(0).notNull(),
  recordedAt: timestamp("recordedAt").defaultNow().notNull(),
});

export type ContentAnalytic = typeof contentAnalytics.$inferSelect;
export type InsertContentAnalytic = typeof contentAnalytics.$inferInsert;

/**
 * Content Repurposed table - stores repurposed versions of content
 */
export const contentRepurposed = mysqlTable("contentRepurposed", {
  id: int("id").autoincrement().primaryKey(),
  contentId: int("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
  format: mysqlEnum("format", ["social-snippet", "email-summary", "short-form", "infographic-script", "video-script"]).notNull(),
  content: text("content").notNull(),
  platform: varchar("platform", { length: 100 }),
  createdBy: int("createdBy").notNull().references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentRepurposed = typeof contentRepurposed.$inferSelect;
export type InsertContentRepurposed = typeof contentRepurposed.$inferInsert;


/**
 * Content Quality Scores table - stores automated quality analysis results
 */
export const contentQualityScores = mysqlTable("contentQualityScores", {
  id: int("id").autoincrement().primaryKey(),
  contentId: int("contentId").notNull().references(() => content.id, { onDelete: "cascade" }),
  overallScore: int("overallScore").default(0).notNull(),
  readabilityScore: int("readabilityScore").default(0).notNull(),
  seoScore: int("seoScore").default(0).notNull(),
  toneScore: int("toneScore").default(0).notNull(),
  engagementScore: int("engagementScore").default(0).notNull(),
  readabilityDetails: text("readabilityDetails"),
  seoDetails: text("seoDetails"),
  toneDetails: text("toneDetails"),
  engagementDetails: text("engagementDetails"),
  suggestions: text("suggestions"),
  analyzedAt: timestamp("analyzedAt").defaultNow().notNull(),
});

export type ContentQualityScore = typeof contentQualityScores.$inferSelect;
export type InsertContentQualityScore = typeof contentQualityScores.$inferInsert;
