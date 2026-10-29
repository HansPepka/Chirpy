import { db } from "../index.js";
import { NewUser, users } from "../schema.js";

export async function createUser(email: string) {
  const [result] = await db
    .insert(users)
    .values({ email })
    .returning();
  return result;
}

export async function deleteAllUsers(){
  await db.delete(users);
}