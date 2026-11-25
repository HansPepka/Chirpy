import { db } from "../index.js";
import { chirps } from "../schema.js";
import {eq, asc, desc} from "drizzle-orm"

export async function createChirp(body: string, userId: string){
    const [result] = await db.insert(chirps).values({body, userId}).returning();
    return result;
}

export async function retrieveChirpsWithAuthor(authorId:string){
     const result = await db.select().from(chirps).orderBy(chirps.createdAt).where(eq(chirps.userId, authorId));
     return result;
}

export async function retrieveChirps(){
    const result = await db.select().from(chirps).orderBy(chirps.createdAt);
    return result;
}

export async function retrieveOneChirp(chirpId: string){
    const [result] = await db.select().from(chirps).where(eq(chirps.id, chirpId));
    return result;
}

// Queries to sort in ascending and descending order

export async function sortAscending() {
    const result = await db
    .select()
    .from(chirps)
    .orderBy(asc(chirps.createdAt));
    return result;
}

export async function sortDescending() {
    const result = await db
    .select()
    .from(chirps)
    .orderBy(desc(chirps.createdAt));
    return result;
}