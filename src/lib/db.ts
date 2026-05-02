import { neon } from "@neondatabase/serverless";

const dbUrl = process.env.DATABASE_URL;

export const sql = dbUrl ? neon(dbUrl) : async (...args: any[]) => {
  console.warn("DATABASE_URL is not set. Database operations will be bypassed.");
  return [];
};

/**
 * Ensures the PlayerProfile table exists.
 */
export async function initDb() {
  if (!dbUrl) return;
  try {
    await (sql as any)`
      CREATE TABLE IF NOT EXISTS player_profiles (
        id TEXT PRIMARY KEY,
        coins INTEGER DEFAULT 0,
        club_level INTEGER DEFAULT 1,
        shoe_level INTEGER DEFAULT 1
      );
    `;
  } catch (e) {
    console.error("Failed to initialize DB:", e);
  }
}
