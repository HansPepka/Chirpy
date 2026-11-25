import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import type {JwtPayload} from "jsonwebtoken";
import { BadRequestError, NotFoundError, UnauthorizedError, ForbiddenError } from "./index.js";
import type {Request} from "express"
import crypto from "crypto";

export async function hashPassword(password: string): Promise<string>{
    return argon2.hash(password);
}

export async function checkPasswordHash(password: string, hash: string): Promise<boolean>{
    try{
        return argon2.verify(hash, password);
    }catch(err){
        return false;
    }
}

// Function to make a JWT
export function makeJWT(userID: string, expiresIn: number, secret: string):string {
    const iat = Math.floor(Date.now() / 1000);
    const exp = iat + expiresIn;

    type payload = Pick<JwtPayload, "iss" | "sub" | "iat" | "exp">;

    const tokenPayload: payload = {
    iss: "chirpy",
    sub: userID,
    iat: iat,
    exp: exp,
    };
    //type payload = Pick<JwtPayload, "Chirpy" | "userID" | "iat" | "exp">;
    return jwt.sign(tokenPayload, secret);
}

// Function to validate a JWT
export function validateJWT(tokenString: string, secret: string):string{
    try{
        const decoded = jwt.verify(tokenString, secret) as JwtPayload;

        // Ensure the subject (sub) exists and is a string
        if (!decoded || typeof decoded.sub !== "string") {
            throw new Error("Token payload missing valid subject (sub)");
        }
        return decoded.sub; 
    } catch (error){
        // Throw a suitable error if validation fails
        throw new Error(`Invalid or expired token: ${(error as Error).message}`);
    }
}

// Function to extract a bearer token from an HTTP header (authorization)
export function extractBearerToken(authorization: string | undefined): string {
  // No header at all
  if (!authorization) {
    throw new BadRequestError("Malformed authorization header");
  }

  const parts = authorization.trim().split(/\s+/);

  // Must be exactly two parts, and the first must be "Bearer"
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new BadRequestError("Malformed authorization header");
  }

  return parts[1];
}

// Function to get a Bearer token from the authorization header
export function getBearerToken(req: Request): string{
    const authHeader = req.get("Authorization");

    if(!authHeader){
        throw new UnauthorizedError("Missing authorization header");
    }

    return extractBearerToken(authHeader);

}

// Function to generate a random 256-bit hex-encoded string :
export function makeRefreshToken():string{
    let data = crypto.randomBytes(32).toString("hex");
    return data;
}

// To get extract an API key from a "Authorization" header

export function getAPIKey(req: Request):string{
    const authHeader = req.get("Authorization");
    if(!authHeader){
        throw new UnauthorizedError("Missing authorization header");
    }

    const parts = authHeader.trim().split(/\s+/);

    // Must be exactly two parts, and the first must be "ApiKey"
    if (parts.length !== 2 || parts[0] !== "ApiKey") {
        throw new BadRequestError("Malformed authorization header");
    }

    return parts[1];
}

