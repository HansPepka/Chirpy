import { db } from "../index.js";
import { NewUser, users, refreshTokens } from "../schema.js";
import {eq} from "drizzle-orm"

export async function createUser(user:{email: string, hashedPassword: string}) {
  const [result] = await db
    .insert(users)
    .values(user)
    .returning()
  return result;
}

export async function deleteAllUsers(){
  await db.delete(users);
}

export async function getUserByEmail(email: string) {
  const [result] = await db.select().from(users).where(eq(users.email, email));
  return result; // undefined if no user has that email
}

export async function saveRefreshToken(userId:string, token: string) {
  const SIXTY_DAYS_MS = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds

  const [result] = await db
    .insert(refreshTokens)
    .values({
      token: token,
      userId: userId,
      expiresAt: new Date(Date.now() + SIXTY_DAYS_MS),
      revokedAt: null,
    })
    .returning();
  return result;
}

export async function getRefreshToken(token:string) {
  const [result] = await db.select().from(refreshTokens).where(eq(refreshTokens.token, token));
  return result;
}

export async function revokeRefreshToken(token:string) {
  const [result] = await db
    .update(refreshTokens)
    .set({
      revokedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(refreshTokens.token, token))
    .returning();
  return result;
}