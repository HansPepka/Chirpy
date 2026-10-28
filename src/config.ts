import type { MigrationConfig } from "drizzle-orm/migrator";
process.loadEnvFile("./.env");

function envOrThrow(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Environment variable ${key} is not set`);
  }
  return value;
}

function envNumberOrThrow(key: string): number {
  const value = Number(envOrThrow(key));
  if (Number.isNaN(value)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return value;
}


type APIConfig = {
  fileserverHits: number;
  port: number;
  platform: string
};

type DBConfig = {
  dbURL: string;
  migrationsFolder: string;
};

type Config = {
  api: APIConfig;
  db: DBConfig;
};

export const config: Config = {
  api: {
    fileserverHits: 0,
    port: envNumberOrThrow("PORT"),
    platform: envOrThrow("PLATFORM")
  },
  db: {
    dbURL: envOrThrow("DB_URL"),
    migrationsFolder: "./src/db",
  }
};

export const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db",
};
