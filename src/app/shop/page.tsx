import { sql, initDb } from "@/lib/db";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function getProfile() {
  const PLAYER_ID = "default-player-id";
  await initDb();
  const profiles = await sql`SELECT * FROM player_profiles WHERE id = ${PLAYER_ID}`;
  
  if (!profiles || profiles.length === 0) {
    // If DB is unreachable or empty, return a default profile
    return { id: PLAYER_ID, coins: 0, club_level: 1, shoe_level: 1 };
  }
  return profiles[0];
}

export default async function ShopPage() {
  const profile: any = await getProfile();

  async function upgradeClub() {
    "use server";
    const PLAYER_ID = "default-player-id";
    const profiles = await sql`SELECT * FROM player_profiles WHERE id = ${PLAYER_ID}`;
    const p = profiles[0];
    const cost = p.club_level * 100;
    if (p && p.coins >= cost) {
      await sql`UPDATE player_profiles SET coins = coins - ${cost}, club_level = club_level + 1 WHERE id = ${PLAYER_ID}`;
      revalidatePath("/shop");
    }
  }

  async function upgradeShoes() {
    "use server";
    const PLAYER_ID = "default-player-id";
    const profiles = await sql`SELECT * FROM player_profiles WHERE id = ${PLAYER_ID}`;
    const p = profiles[0];
    const cost = p.shoe_level * 100;
    if (p && p.coins >= cost) {
      await sql`UPDATE player_profiles SET coins = coins - ${cost}, shoe_level = shoe_level + 1 WHERE id = ${PLAYER_ID}`;
      revalidatePath("/shop");
    }
  }

  const clubUpgradeCost = profile.club_level * 100;
  const shoeUpgradeCost = profile.shoe_level * 100;

  return (
    <div className="min-h-screen bg-sky-400 p-8 md:p-24 flex flex-col items-center relative overflow-hidden">
      {/* Background mountains */}
      <div 
        className="absolute bottom-0 w-full h-[300px] bg-repeat-x bg-bottom opacity-40 pointer-events-none"
        style={{ backgroundImage: 'url("/assets/mountains.png")', backgroundSize: '1000px' }}
      />

      <header className="w-full max-w-4xl glass-panel mb-16 flex flex-col md:flex-row justify-between items-center gap-8 relative z-10">
        <div>
          <h1 className="text-6xl md:text-8xl font-black text-game-blue italic text-shadow">
            PRO <span className="text-game-orange">SHOP</span>
          </h1>
        </div>
        <div className="bg-game-yellow border-4 border-black px-8 py-4 rounded-2xl transform rotate-2">
          <p className="text-sm font-black uppercase text-black">Your Balance</p>
          <p className="text-5xl font-black text-black">{profile.coins} <span className="text-2xl">C</span></p>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-4xl relative z-10">
        <div className="glass-panel hover:scale-105 transition-transform">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-black text-game-green italic">CLUBS</h2>
            <span className="bg-black text-white px-4 py-1 rounded-full font-black">LVL {profile.club_level}</span>
          </div>
          <p className="text-lg font-bold text-gray-700 mb-12">Punch the ball harder! Increases maximum shot distance.</p>
          <form action={upgradeClub}>
            <button 
              disabled={profile.coins < clubUpgradeCost}
              className={`w-full btn-game btn-primary ${profile.coins < clubUpgradeCost ? 'opacity-40 grayscale' : ''}`}
            >
              UPGRADE ({clubUpgradeCost})
            </button>
          </form>
        </div>

        <div className="glass-panel hover:scale-105 transition-transform">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-4xl font-black text-game-orange italic">SHOES</h2>
            <span className="bg-black text-white px-4 py-1 rounded-full font-black">LVL {profile.shoe_level}</span>
          </div>
          <p className="text-lg font-bold text-gray-700 mb-12">Run like the wind! Increases speed and stamina.</p>
          <form action={upgradeShoes}>
            <button 
              disabled={profile.coins < shoeUpgradeCost}
              className={`w-full btn-game btn-secondary ${profile.coins < shoeUpgradeCost ? 'opacity-40 grayscale' : ''}`}
            >
              UPGRADE ({shoeUpgradeCost})
            </button>
          </form>
        </div>
      </main>

      <footer className="mt-24 relative z-10">
        <Link href="/" className="text-2xl font-black text-white bg-black px-8 py-4 rounded-full hover:bg-game-blue transition-colors">
          &larr; BACK TO MENU
        </Link>
      </footer>
    </div>
  );
}
