import { db } from "../index.js";
import { chirps } from "../schema.js";

export async function createChirp(body: string, userId: string){
    const [result] = await db.insert(chirps).values({body, userId}).returning();
    return result;
}