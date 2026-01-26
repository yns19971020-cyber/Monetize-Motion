import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "node:http";
import session from "express-session";
import pgSession from "connect-pg-simple";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import multer from "multer";
import path from "path";
import fs from "fs";
import { eq, desc, and, sql, ne, or, ilike } from "drizzle-orm";

import { db, pool } from "./db";
import * as schema from "@shared/schema";

const PgStore = pgSession(session);

// Multer configuration for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

// Auth middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session?.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Session middleware
  app.use(
    session({
      store: new PgStore({
        pool: pool as any,
        tableName: "session",
        createTableIfMissing: true,
      }),
      secret: process.env.SESSION_SECRET || "viralpay-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        sameSite: "lax",
      },
    })
  );

  // Serve uploads
  app.use("/uploads", (req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    next();
  }, require("express").static(path.join(process.cwd(), "uploads")));

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, username, password, displayName } = req.body;

      // Validate input
      if (!email || !username || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // Check if user exists
      const existingUser = await db.query.users.findFirst({
        where: or(
          eq(schema.users.email, email.toLowerCase()),
          eq(schema.users.username, username.toLowerCase())
        ),
      });

      if (existingUser) {
        return res.status(400).json({ message: "Email or username already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const [user] = await db.insert(schema.users).values({
        email: email.toLowerCase(),
        username: username.toLowerCase(),
        password: hashedPassword,
        displayName: displayName || username,
      }).returning();

      // Set session
      req.session.userId = user.id;

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isVerified: user.isVerified,
          isAdmin: user.isAdmin,
          totalEarnings: user.totalEarnings,
          availableBalance: user.availableBalance,
          followerCount: user.followerCount,
          followingCount: user.followingCount,
        },
        token: req.sessionID,
      });
    } catch (error: any) {
      console.error("Register error:", error);
      res.status(500).json({ message: error.message || "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await db.query.users.findFirst({
        where: eq(schema.users.email, email.toLowerCase()),
      });

      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      if (user.isBanned) {
        return res.status(403).json({ message: "Your account has been suspended" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      req.session.userId = user.id;

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isVerified: user.isVerified,
          isAdmin: user.isAdmin,
          totalEarnings: user.totalEarnings,
          availableBalance: user.availableBalance,
          followerCount: user.followerCount,
          followingCount: user.followingCount,
        },
        token: req.sessionID,
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ message: error.message || "Login failed" });
    }
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, req.session.userId!),
      });

      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
          isVerified: user.isVerified,
          isAdmin: user.isAdmin,
          totalEarnings: user.totalEarnings,
          availableBalance: user.availableBalance,
          followerCount: user.followerCount,
          followingCount: user.followingCount,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out" });
    });
  });

  // Video routes
  app.get("/api/videos/feed", async (req, res) => {
    try {
      const videos = await db.query.videos.findMany({
        where: and(
          eq(schema.videos.isPublished, true),
          eq(schema.videos.isDeleted, false)
        ),
        orderBy: [desc(schema.videos.createdAt)],
        limit: 20,
        with: {
          user: true,
        },
      });

      // Check if user has liked each video
      const userId = req.session?.userId;
      let likedVideoIds: string[] = [];
      
      if (userId) {
        const likes = await db.query.likes.findMany({
          where: eq(schema.likes.userId, userId),
        });
        likedVideoIds = likes.map(l => l.videoId);
      }

      const videosWithUser = videos.map((video: any) => ({
        ...video,
        user: {
          id: video.user.id,
          username: video.user.username,
          displayName: video.user.displayName,
          avatarUrl: video.user.avatarUrl,
          isVerified: video.user.isVerified,
        },
        isLiked: likedVideoIds.includes(video.id),
      }));

      res.json(videosWithUser);
    } catch (error: any) {
      console.error("Feed error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/videos/trending", async (req, res) => {
    try {
      const videos = await db.query.videos.findMany({
        where: and(
          eq(schema.videos.isPublished, true),
          eq(schema.videos.isDeleted, false)
        ),
        orderBy: [desc(schema.videos.viewCount), desc(schema.videos.likeCount)],
        limit: 50,
        with: {
          user: true,
        },
      });

      const videosWithUser = videos.map((video: any) => ({
        ...video,
        user: {
          id: video.user.id,
          username: video.user.username,
          displayName: video.user.displayName,
          avatarUrl: video.user.avatarUrl,
          isVerified: video.user.isVerified,
        },
      }));

      res.json(videosWithUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/videos/upload", requireAuth, upload.single("video"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No video file uploaded" });
      }

      const { caption, hashtags, duration, width, height } = req.body;
      const videoUrl = `/uploads/${req.file.filename}`;

      const hashtagArray = hashtags
        ? hashtags.split(/[,\s#]+/).filter((tag: string) => tag.trim())
        : [];

      const [video] = await db.insert(schema.videos).values({
        userId: req.session.userId!,
        videoUrl,
        caption,
        duration: parseInt(duration) || 30,
        width: parseInt(width) || 1080,
        height: parseInt(height) || 1920,
        hashtags: hashtagArray,
      }).returning();

      res.json(video);
    } catch (error: any) {
      console.error("Upload error:", error);
      res.status(500).json({ message: error.message || "Upload failed" });
    }
  });

  app.post("/api/videos/:videoId/like", requireAuth, async (req, res) => {
    try {
      const { videoId } = req.params;
      const userId = req.session.userId!;

      // Check if already liked
      const existingLike = await db.query.likes.findFirst({
        where: and(
          eq(schema.likes.userId, userId),
          eq(schema.likes.videoId, videoId)
        ),
      });

      if (existingLike) {
        // Unlike
        await db.delete(schema.likes).where(eq(schema.likes.id, existingLike.id));
        await db.update(schema.videos)
          .set({ likeCount: sql`${schema.videos.likeCount} - 1` })
          .where(eq(schema.videos.id, videoId));
        
        return res.json({ liked: false });
      }

      // Like
      await db.insert(schema.likes).values({ userId, videoId });
      await db.update(schema.videos)
        .set({ likeCount: sql`${schema.videos.likeCount} + 1` })
        .where(eq(schema.videos.id, videoId));

      // Get video owner and notify
      const video = await db.query.videos.findFirst({
        where: eq(schema.videos.id, videoId),
      });

      if (video && video.userId !== userId) {
        const liker = await db.query.users.findFirst({
          where: eq(schema.users.id, userId),
        });

        await db.insert(schema.notifications).values({
          userId: video.userId,
          type: "like",
          title: "New Like",
          message: `@${liker?.username} liked your video`,
          data: { videoId, likerId: userId },
        });
      }

      res.json({ liked: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/videos/:videoId/comments", async (req, res) => {
    try {
      const { videoId } = req.params;

      const comments = await db.query.comments.findMany({
        where: and(
          eq(schema.comments.videoId, videoId),
          eq(schema.comments.isDeleted, false)
        ),
        orderBy: [desc(schema.comments.createdAt)],
        with: {
          user: true,
        },
      });

      const commentsWithUser = comments.map((comment: any) => ({
        ...comment,
        user: {
          id: comment.user.id,
          username: comment.user.username,
          displayName: comment.user.displayName,
          avatarUrl: comment.user.avatarUrl,
        },
      }));

      res.json(commentsWithUser);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/videos/:videoId/comments", requireAuth, async (req, res) => {
    try {
      const { videoId } = req.params;
      const { content, parentId } = req.body;
      const userId = req.session.userId!;

      if (!content?.trim()) {
        return res.status(400).json({ message: "Comment cannot be empty" });
      }

      const [comment] = await db.insert(schema.comments).values({
        userId,
        videoId,
        content: content.trim(),
        parentId,
      }).returning();

      // Update video comment count
      await db.update(schema.videos)
        .set({ commentCount: sql`${schema.videos.commentCount} + 1` })
        .where(eq(schema.videos.id, videoId));

      // Notify video owner
      const video = await db.query.videos.findFirst({
        where: eq(schema.videos.id, videoId),
      });

      if (video && video.userId !== userId) {
        const commenter = await db.query.users.findFirst({
          where: eq(schema.users.id, userId),
        });

        await db.insert(schema.notifications).values({
          userId: video.userId,
          type: "comment",
          title: "New Comment",
          message: `@${commenter?.username}: "${content.substring(0, 50)}${content.length > 50 ? '...' : ''}"`,
          data: { videoId, commentId: comment.id },
        });
      }

      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });

      res.json({
        ...comment,
        user: {
          id: user!.id,
          username: user!.username,
          displayName: user!.displayName,
          avatarUrl: user!.avatarUrl,
        },
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // User routes
  app.get("/api/users/me/videos", requireAuth, async (req, res) => {
    try {
      const videos = await db.query.videos.findMany({
        where: and(
          eq(schema.videos.userId, req.session.userId!),
          eq(schema.videos.isDeleted, false)
        ),
        orderBy: [desc(schema.videos.createdAt)],
      });

      res.json(videos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/me/stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;

      const videos = await db.query.videos.findMany({
        where: eq(schema.videos.userId, userId),
      });

      const totalViews = videos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
      const adImpressions = videos.reduce((sum, v) => sum + (v.adImpressions || 0), 0);

      res.json({ totalViews, adImpressions });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/me/earnings-stats", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;

      const videos = await db.query.videos.findMany({
        where: eq(schema.videos.userId, userId),
      });

      const totalViews = videos.reduce((sum, v) => sum + (v.viewCount || 0), 0);
      const adImpressions = videos.reduce((sum, v) => sum + (v.adImpressions || 0), 0);

      res.json({
        totalViews,
        adImpressions,
        cpm: 2.50, // Example CPM rate
        revenueToday: 0,
        revenueThisWeek: 0,
        revenueThisMonth: 0,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/:userId", async (req, res) => {
    try {
      const { userId } = req.params;

      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if current user is following
      let isFollowing = false;
      if (req.session?.userId && req.session.userId !== userId) {
        const follow = await db.query.follows.findFirst({
          where: and(
            eq(schema.follows.followerId, req.session.userId),
            eq(schema.follows.followingId, userId)
          ),
        });
        isFollowing = !!follow;
      }

      res.json({
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        followerCount: user.followerCount,
        followingCount: user.followingCount,
        isFollowing,
      });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/:userId/videos", async (req, res) => {
    try {
      const { userId } = req.params;

      const videos = await db.query.videos.findMany({
        where: and(
          eq(schema.videos.userId, userId),
          eq(schema.videos.isPublished, true),
          eq(schema.videos.isDeleted, false)
        ),
        orderBy: [desc(schema.videos.createdAt)],
      });

      res.json(videos);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/users/:userId/follow", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const followerId = req.session.userId!;

      if (userId === followerId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      const existingFollow = await db.query.follows.findFirst({
        where: and(
          eq(schema.follows.followerId, followerId),
          eq(schema.follows.followingId, userId)
        ),
      });

      if (existingFollow) {
        return res.status(400).json({ message: "Already following" });
      }

      await db.insert(schema.follows).values({
        followerId,
        followingId: userId,
      });

      // Update follower counts
      await db.update(schema.users)
        .set({ followerCount: sql`${schema.users.followerCount} + 1` })
        .where(eq(schema.users.id, userId));

      await db.update(schema.users)
        .set({ followingCount: sql`${schema.users.followingCount} + 1` })
        .where(eq(schema.users.id, followerId));

      // Notify
      const follower = await db.query.users.findFirst({
        where: eq(schema.users.id, followerId),
      });

      await db.insert(schema.notifications).values({
        userId,
        type: "follow",
        title: "New Follower",
        message: `@${follower?.username} started following you`,
        data: { followerId },
      });

      res.json({ following: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/users/:userId/follow", requireAuth, async (req, res) => {
    try {
      const { userId } = req.params;
      const followerId = req.session.userId!;

      const follow = await db.query.follows.findFirst({
        where: and(
          eq(schema.follows.followerId, followerId),
          eq(schema.follows.followingId, userId)
        ),
      });

      if (!follow) {
        return res.status(400).json({ message: "Not following" });
      }

      await db.delete(schema.follows).where(eq(schema.follows.id, follow.id));

      // Update follower counts
      await db.update(schema.users)
        .set({ followerCount: sql`GREATEST(${schema.users.followerCount} - 1, 0)` })
        .where(eq(schema.users.id, userId));

      await db.update(schema.users)
        .set({ followingCount: sql`GREATEST(${schema.users.followingCount} - 1, 0)` })
        .where(eq(schema.users.id, followerId));

      res.json({ following: false });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notifications
  app.get("/api/notifications", requireAuth, async (req, res) => {
    try {
      const notifications = await db.query.notifications.findMany({
        where: eq(schema.notifications.userId, req.session.userId!),
        orderBy: [desc(schema.notifications.createdAt)],
        limit: 50,
      });

      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/notifications/read-all", requireAuth, async (req, res) => {
    try {
      await db.update(schema.notifications)
        .set({ isRead: true })
        .where(eq(schema.notifications.userId, req.session.userId!));

      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Withdrawals
  app.get("/api/withdrawals", requireAuth, async (req, res) => {
    try {
      const withdrawals = await db.query.withdrawals.findMany({
        where: eq(schema.withdrawals.userId, req.session.userId!),
        orderBy: [desc(schema.withdrawals.createdAt)],
      });

      res.json(withdrawals);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/withdrawals", requireAuth, async (req, res) => {
    try {
      const { amount, walletAddress, network } = req.body;
      const userId = req.session.userId!;

      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const availableBalance = parseFloat(user.availableBalance?.toString() || "0");
      
      if (amount > availableBalance) {
        return res.status(400).json({ message: "Insufficient balance" });
      }

      if (amount < 10) {
        return res.status(400).json({ message: "Minimum withdrawal is $10" });
      }

      // Create withdrawal request
      const [withdrawal] = await db.insert(schema.withdrawals).values({
        userId,
        amount: amount.toString(),
        walletAddress,
        network,
        status: "pending",
      }).returning();

      // Update user balance
      await db.update(schema.users)
        .set({
          availableBalance: sql`${schema.users.availableBalance} - ${amount}`,
        })
        .where(eq(schema.users.id, userId));

      // Notify user
      await db.insert(schema.notifications).values({
        userId,
        type: "withdrawal",
        title: "Withdrawal Requested",
        message: `Your withdrawal of $${amount} USDC is pending approval`,
        data: { withdrawalId: withdrawal.id },
      });

      res.json(withdrawal);
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Session type declaration
declare module "express-session" {
  interface SessionData {
    userId?: string;
  }
}
