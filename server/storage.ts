import { db } from "./db"; // db.ts ෆයිල් එක මෙතනට import කරගෙන තියෙනවා
import { users, type User, type InsertUser } from "@shared/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

// CRUD methods ටික හදුන්වා දීම
export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

// MemStorage වෙනුවට අලුතින් හදන DatabaseStorage එක
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID(); 
    // අලුත් user කෙනෙක්ව කෙලින්ම database එකටම save කරනවා
    const [user] = await db
      .insert(users)
      .values({ ...insertUser, id })
      .returning();
    return user;
  }
}

// අලුත් DatabaseStorage එක මුළු ඇප් එකටම පාවිච්චි කරන්න export කරනවා
export const storage = new DatabaseStorage();
