import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  walletAddress: text("wallet_address"),
  walletNetwork: text("wallet_network"),
  isAdmin: boolean("is_admin").default(false),
  isVerified: boolean("is_verified").default(false),
  isBanned: boolean("is_banned").default(false),
  totalEarnings: decimal("total_earnings", { precision: 18, scale: 8 }).default("0"),
  availableBalance: decimal("available_balance", { precision: 18, scale: 8 }).default("0"),
  withdrawnAmount: decimal("withdrawn_amount", { precision: 18, scale: 8 }).default("0"),
  followerCount: integer("follower_count").default(0),
  followingCount: integer("following_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Videos table
export const videos = pgTable("videos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  title: text("title"),
  caption: text("caption"),
  videoUrl: text("video_url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  duration: integer("duration").notNull(),
  width: integer("width"),
  height: integer("height"),
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
  shareCount: integer("share_count").default(0),
  adImpressions: integer("ad_impressions").default(0),
  adRevenue: decimal("ad_revenue", { precision: 18, scale: 8 }).default("0"),
  isPublished: boolean("is_published").default(true),
  isDeleted: boolean("is_deleted").default(false),
  isFlagged: boolean("is_flagged").default(false),
  hashtags: jsonb("hashtags").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Likes table
export const likes = pgTable("likes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Comments table
export const comments = pgTable("comments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  parentId: varchar("parent_id"),
  content: text("content").notNull(),
  likeCount: integer("like_count").default(0),
  isDeleted: boolean("is_deleted").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Follows table
export const follows = pgTable("follows", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  followerId: varchar("follower_id").notNull().references(() => users.id),
  followingId: varchar("following_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Withdrawals table
export const withdrawals = pgTable("withdrawals", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: decimal("amount", { precision: 18, scale: 8 }).notNull(),
  walletAddress: text("wallet_address").notNull(),
  network: text("network").notNull(),
  status: text("status").notNull().default("pending"),
  txHash: text("tx_hash"),
  adminNotes: text("admin_notes"),
  processedAt: timestamp("processed_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: text("type").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  data: jsonb("data"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Video views table
export const videoViews = pgTable("video_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  videoId: varchar("video_id").notNull().references(() => videos.id),
  userId: varchar("user_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  watchDuration: integer("watch_duration"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  videos: many(videos),
  likes: many(likes),
  comments: many(comments),
  notifications: many(notifications),
  withdrawals: many(withdrawals),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  user: one(users, {
    fields: [videos.userId],
    references: [users.id],
  }),
  likes: many(likes),
  comments: many(comments),
  views: many(videoViews),
}));

export const likesRelations = relations(likes, ({ one }) => ({
  user: one(users, {
    fields: [likes.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [likes.videoId],
    references: [videos.id],
  }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  user: one(users, {
    fields: [comments.userId],
    references: [users.id],
  }),
  video: one(videos, {
    fields: [comments.videoId],
    references: [videos.id],
  }),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const withdrawalsRelations = relations(withdrawals, ({ one }) => ({
  user: one(users, {
    fields: [withdrawals.userId],
    references: [users.id],
  }),
}));

export const videoViewsRelations = relations(videoViews, ({ one }) => ({
  video: one(videos, {
    fields: [videoViews.videoId],
    references: [videos.id],
  }),
}));

// Schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  displayName: true,
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30),
  password: z.string().min(6),
  displayName: z.string().optional(),
});

export const insertVideoSchema = createInsertSchema(videos).pick({
  title: true,
  caption: true,
  videoUrl: true,
  thumbnailUrl: true,
  duration: true,
  width: true,
  height: true,
  hashtags: true,
});

export const insertCommentSchema = createInsertSchema(comments).pick({
  content: true,
  parentId: true,
});

export const withdrawalRequestSchema = z.object({
  amount: z.number().positive(),
  walletAddress: z.string().min(10),
  network: z.enum(["BEP20", "ERC20"]),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Video = typeof videos.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type Like = typeof likes.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Follow = typeof follows.$inferSelect;
export type Withdrawal = typeof withdrawals.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type VideoView = typeof videoViews.$inferSelect;

// Extended types with relations
export type VideoWithUser = Video & {
  user: Pick<User, "id" | "username" | "displayName" | "avatarUrl" | "isVerified">;
  isLiked?: boolean;
};

export type CommentWithUser = Comment & {
  user: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
};
