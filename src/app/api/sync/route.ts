import { NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const { coins } = await request.json();
    const PLAYER_ID = "default-player-id";

    // Ensure table exists
    await initDb();

    // Upsert using raw SQL
    await sql`
      INSERT INTO player_profiles (id, coins, club_level, shoe_level)
      VALUES (${PLAYER_ID}, ${coins}, 1, 1)
      ON CONFLICT (id) DO UPDATE
      SET coins = player_profiles.coins + EXCLUDED.coins;
    `;

    // Fetch updated profile
    const profiles = await sql`
      SELECT * FROM player_profiles WHERE id = ${PLAYER_ID}
    `;

    return NextResponse.json({ success: true, profile: profiles[0] });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json({ success: false, error: "Failed to sync state" }, { status: 500 });
  }
}
