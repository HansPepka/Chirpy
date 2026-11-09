import { db } from "../index.js";
import { NewUser, users } from "../schema.js";
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