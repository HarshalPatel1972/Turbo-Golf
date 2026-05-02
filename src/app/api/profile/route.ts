import { NextResponse } from "next/server";
import { sql, initDb } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const PLAYER_ID = "default-player-id";
    await initDb();
    
    const profiles = await sql`SELECT * FROM player_profiles WHERE id = ${PLAYER_ID}`;
    
    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ id: PLAYER_ID, coins: 0, club_level: 1, shoe_level: 1 });
    }
    
    return NextResponse.json(profiles[0]);
  } catch (error) {
    console.error("Profile fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}
