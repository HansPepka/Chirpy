# Chirpy

Chirpy is a small social-network API, a bit like a minimal Twitter, built with **TypeScript**, **Express** and **PostgreSQL**. Users create an account, log in, and post short messages called **chirps** (140 characters maximum).

This project was built while following Boot.dev's course on HTTP servers in TypeScript.

---

## Features

- User accounts with securely hashed passwords
- Authentication with short-lived **JWT access tokens** (1 hour) and long-lived **refresh tokens** (60 days) that can be revoked
- Users can update their own email and password
- Create, list, read and delete chirps; only the author can delete a chirp
- Filter chirps by author and sort them by date
- Profanity filter: some banned words are replaced with `****`
- **Chirpy Red** membership upgrades through a Polka webhook
- Centralised error handling with consistent JSON error responses
- Admin endpoints for metrics and for resetting the development database

## Tech stack

| Purpose | Tool |
|---|---|
| Language | TypeScript (Node.js) |
| Web framework | Express |
| Database | PostgreSQL |
| ORM and migrations | Drizzle ORM / drizzle-kit |
| Unit tests | Vitest |

## Project structure

```
src/
├── index.ts         # Server setup, routes, handlers and error handler
├── config.ts        # Loads settings from the .env file
├── auth.ts          # Password hashing, JWTs, refresh tokens, Bearer header parsing
├── auth.test.ts     # Unit tests for the auth helpers
├── errors.ts        # Custom error classes (400, 401, 403, 404)
└── db/
    ├── schema.ts    # Table definitions: users, chirps, refresh_tokens
    ├── queries/     # Database queries
    └── ...          # Generated migration files
```

---

## Getting started

### Prerequisites

- Node.js and npm
- A running PostgreSQL server

### 1. Install the dependencies

```bash
npm install
```

### 2. Create the database

Create an empty PostgreSQL database, for example:

```sql
CREATE DATABASE chirpy;
```

### 3. Configure the environment

Create a `.env` file at the root of the project:

```
PORT=8080
PLATFORM=dev
DB_URL=postgres://USER:PASSWORD@localhost:5432/chirpy?sslmode=disable
JWT_SECRET=your-long-random-secret
```

| Variable | Purpose |
|---|---|
| `PORT` | Port the server listens on |
| `PLATFORM` | Set to `dev` to allow the `/admin/reset` endpoint |
| `DB_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret used to sign and verify access tokens |

To generate a strong secret on one line:

```bash
openssl rand -base64 64 | tr -d '\n'
```

> **Never commit `.env` to Git.** Anyone with `JWT_SECRET` can create valid tokens for any user.

### 4. Build and run the server

```bash
npm run build
```

```bash
npm start
```

The server runs at `http://localhost:8080`. **Database migrations are applied automatically when the server starts.**

### Changing the database schema

1. Edit `src/db/schema.ts`.
2. Generate a migration:

   ```bash
   npx drizzle-kit generate
   ```

3. Restart the server to apply it.

### Running the tests

```bash
npm run test
```

---

## Authentication

Chirpy uses two kinds of tokens:

| | Access token | Refresh token |
|---|---|---|
| Format | JWT (signed with HS256) | Random 64-character hex string |
| Lifetime | 1 hour | 60 days |
| Stored in the database | No (stateless) | Yes |
| Can be revoked | No, it is valid until it expires | Yes |
| Used for | Authenticated requests | Getting a new access token |

Both are sent in the `Authorization` header:

```
Authorization: Bearer <token>
```

**Typical flow:**

1. `POST /api/login` returns an access token and a refresh token.
2. Send the **access token** with every authenticated request.
3. When it expires (the server answers `401`), call `POST /api/refresh` with the **refresh token** to get a new access token.
4. To log out, call `POST /api/revoke` with the refresh token.

---

## API reference

### Overview

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/healthz` | None | Health check |
| `POST` | `/api/users` | None | Create a user |
| `PUT` | `/api/users` | Access token | Update your own email and password |
| `POST` | `/api/login` | None | Log in and get tokens |
| `POST` | `/api/refresh` | Refresh token | Get a new access token |
| `POST` | `/api/revoke` | Refresh token | Revoke a refresh token |
| `POST` | `/api/chirps` | Access token | Create a chirp |
| `GET` | `/api/chirps` | None | List chirps (filter and sort) |
| `GET` | `/api/chirps/:chirpId` | None | Get one chirp |
| `DELETE` | `/api/chirps/:chirpId` | Access token | Delete your own chirp |
| `POST` | `/api/polka/webhooks` | None | Receive Polka payment events |
| `GET` | `/admin/metrics` | None | Show file server visit count |
| `POST` | `/admin/reset` | None | Reset the dev database (dev only) |

### Users

#### `POST /api/users`

Creates a new user.

```json
{
  "email": "lane@example.com",
  "password": "04234"
}
```

**`201 Created`**

```json
{
  "id": "5a47789c-a617-444a-8a80-b50359247804",
  "email": "lane@example.com",
  "createdAt": "2026-11-23T10:00:00.000Z",
  "updatedAt": "2026-11-23T10:00:00.000Z"
}
```

#### `PUT /api/users`

Updates the email and password of the **logged-in user** (identified by the access token). Users can only change their own account.

Same body as `POST /api/users`. Returns **`200 OK`** with the updated user, or **`401`** if the token is missing or invalid.

### Authentication

#### `POST /api/login`

```json
{
  "email": "lane@example.com",
  "password": "04234"
}
```

**`200 OK`**

```json
{
  "id": "5a47789c-a617-444a-8a80-b50359247804",
  "createdAt": "2026-11-23T10:00:00.000Z",
  "updatedAt": "2026-11-23T10:00:00.000Z",
  "email": "lane@example.com",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "56aa826d22baab4b5ec2cea41a59ecbba03e542aedbb31d9b80326ac8ffcfa2a"
}
```

Wrong email or password: **`401`** with `"incorrect email or password"`. The message is the same in both cases, so it never reveals which emails are registered.

#### `POST /api/refresh`

No body. Send the **refresh token** in the `Authorization` header.

**`200 OK`**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

Returns **`401`** if the refresh token doesn't exist, has expired or has been revoked.

#### `POST /api/revoke`

No body. Send the **refresh token** in the `Authorization` header. Returns **`204 No Content`**. After this, the refresh token can no longer be used.

### Chirps

A chirp looks like this:

```json
{
  "id": "94b7e44c-3604-42e3-bef7-ebfcc3efff8f",
  "createdAt": "2026-11-23T10:05:00.000Z",
  "updatedAt": "2026-11-23T10:05:00.000Z",
  "body": "Hello, world!",
  "userId": "5a47789c-a617-444a-8a80-b50359247804"
}
```

#### `POST /api/chirps`

Requires an **access token**. The author is taken from the token, never from the request body.

```json
{
  "body": "Hello, world!"
}
```

Rules:

- Maximum **140 characters**; longer chirps get **`400`**.
- The words `kerfuffle`, `sharbert` and `fornax` are replaced with `****` (not case-sensitive).

Returns **`201 Created`** with the new chirp.

#### `GET /api/chirps`

Returns a list of chirps. Optional query parameters:

| Parameter | Values | Default | Effect |
|---|---|---|---|
| `authorId` | A user ID | (none) | Only chirps from this author |
| `sort` | `asc` or `desc` | `asc` | Sort by creation date |

Examples:

```
GET /api/chirps
GET /api/chirps?sort=desc
GET /api/chirps?authorId=5a47789c-a617-444a-8a80-b50359247804&sort=desc
```

#### `GET /api/chirps/:chirpId`

Returns one chirp, or **`404`** if it doesn't exist.

#### `DELETE /api/chirps/:chirpId`

Requires an **access token**. Only the author can delete the chirp.

| Status | Meaning |
|---|---|
| `204` | Deleted |
| `401` | Missing or invalid token |
| `403` | You are not the author |
| `404` | Chirp not found |

### Webhooks

#### `POST /api/polka/webhooks`

Called by Polka, the payment provider, when a user upgrades.

```json
{
  "event": "user.upgraded",
  "data": {
    "userId": "5a47789c-a617-444a-8a80-b50359247804"
  }
}
```

- `user.upgraded`: marks the user as a **Chirpy Red** member and returns **`204`**, or **`404`** if the user doesn't exist.
- Any other event is ignored and returns **`204`**, so Polka doesn't keep retrying it.

### Admin

| Endpoint | Description |
|---|---|
| `GET /admin/metrics` | Shows how many times the file server has been visited |
| `POST /admin/reset` | Resets the counter and deletes all users. Only works when `PLATFORM=dev` |

> The `/admin` prefix is only for organisation. It does **not** add any security by itself.

---

## Errors

All errors are returned as JSON:

```json
{
  "error": "Chirp is too long. Max length is 140"
}
```

| Status | When |
|---|---|
| `400 Bad Request` | Invalid input (missing fields, chirp too long, malformed header) |
| `401 Unauthorized` | Missing, invalid or expired token; wrong login |
| `403 Forbidden` | Authenticated, but not allowed (e.g. deleting someone else's chirp) |
| `404 Not Found` | The resource doesn't exist |
| `500 Internal Server Error` | Unexpected server error |
