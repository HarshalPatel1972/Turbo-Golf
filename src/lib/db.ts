import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

export const sql = neon(process.env.DATABASE_URL);

/**
 * Ensures the PlayerProfile table exists.
 * Run this during app initialization or in API routes.
 */
export async function initDb() {
  await sql`
    CREATE TABLE IF NOT EXISTS player_profiles (
      id TEXT PRIMARY KEY,
      coins INTEGER DEFAULT 0,
      club_level INTEGER DEFAULT 1,
      shoe_level INTEGER DEFAULT 1
    );
  `;
}
