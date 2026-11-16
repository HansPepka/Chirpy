import * as argon2 from "argon2";
import jwt from "jsonwebtoken";
import type {JwtPayload} from "jsonwebtoken";


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