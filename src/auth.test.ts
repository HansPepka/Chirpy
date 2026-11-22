import { describe, it, expect, beforeAll } from "vitest";
import { makeJWT, validateJWT, extractBearerToken } from "./auth.js";
import { BadRequestError } from "./index.js";

describe("JWT authentication", () => {
  const secret = "correctSecret1234";
  const wrongSecret = "wrongSecret1234";
  const userID = "user_1234"

  it("should successfully create a valid JWT and extract the user ID", () => {
    // 1. Create a token that lasts for 60 seconds
    const token = makeJWT(userID, 60, secret);
    
    // Ensure it actually returned a string token
    expect(typeof token).toBe("string");
    expect(token.length).toBeGreaterThan(0);

    // 2. Validate the token and make sure it returns the correct user ID
    const extractedID = validateJWT(token, secret);
    expect(extractedID).toBe(userID);
  });

  it("should reject an expired token", () => {
    // Pass a negative expiration time (-10 seconds) so the token is born already expired
    const expiredToken = makeJWT(userID, -10, secret);

    // Expect validateJWT to throw an error because the token has expired
    expect(() => {
      validateJWT(expiredToken, secret);
    }).toThrow();
  });

  it("should reject a token signed with the wrong secret", () => {
    // Create a token with the correct secret
    const token = makeJWT(userID, 60, secret);

    // Try to validate it using a completely different secret
    expect(() => {
      validateJWT(token, wrongSecret);
    }).toThrow();
  });
});

describe("extractBearerToken", () => {
  it("returns the token from a valid header", () => {
    expect(extractBearerToken("Bearer abc123")).toBe("abc123");
  });

  it("ignores extra whitespace", () => {
    expect(extractBearerToken("  Bearer   abc123  ")).toBe("abc123");
  });

  it("throws when the header is missing", () => {
    expect(() => extractBearerToken(undefined)).toThrow(BadRequestError);
  });

  it("throws when the scheme is not Bearer", () => {
    expect(() => extractBearerToken("Basic abc123")).toThrow(BadRequestError);
  });

  it("throws when the token is empty", () => {
    expect(() => extractBearerToken("Bearer ")).toThrow(BadRequestError);
  });
});