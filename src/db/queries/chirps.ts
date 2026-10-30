import { db } from "../index.js";
import { chirps } from "../schema.js";
import {eq} from "drizzle-orm"

export async function createChirp(body: string, userId: string){
    const [result] = await db.insert(chirps).values({body, userId}).returning();
    return result;
}

export async function retrieveChirps(){
     return await db.select().from(chirps).orderBy(chirps.createdAt);
}

export async function retrieveOneChirp(chirpId: string){
    const [result] = await db.select().from(chirps).where(eq(chirps.id, chirpId));
    return result;
}