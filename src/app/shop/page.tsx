import { sql, initDb } from "@/lib/db";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

async function getProfile() {
  const PLAYER_ID = "default-player-id";
  await initDb();
  
  const profiles = await sql`SELECT * FROM player_profiles WHERE id = ${PLAYER_ID}`;
  
  if (profiles.length === 0) {
    await sql`INSERT INTO player_profiles (id, coins, club_level, shoe_level) VALUES (${PLAYER_ID}, 0, 1, 1)`;
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
      await sql`
        UPDATE player_profiles 
        SET coins = coins - ${cost}, club_level = club_level + 1
        WHERE id = ${PLAYER_ID}
      `;
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
      await sql`
        UPDATE player_profiles 
        SET coins = coins - ${cost}, shoe_level = shoe_level + 1
        WHERE id = ${PLAYER_ID}
      `;
      revalidatePath("/shop");
    }
  }

  const clubUpgradeCost = profile.club_level * 100;
  const shoeUpgradeCost = profile.shoe_level * 100;

  return (
    <div className="min-h-screen bg-black text-white p-8 md:p-24 flex flex-col items-center">
      <header className="w-full max-w-4xl flex justify-between items-end border-b-8 border-white pb-8 mb-16">
        <div>
          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter">
            UPGRADE <span className="text-neon-orange">SHOP</span>
          </h1>
        </div>
        <div className="text-right">
          <p className="text-sm font-black uppercase mb-1">Current Balance</p>
          <p className="text-4xl md:text-6xl font-black text-neon-green bg-white px-4 py-1 text-black">
            {profile.coins} <span className="text-2xl ml-1">C</span>
          </p>
        </div>
      </header>

      <main className="grid grid-cols-1 md:grid-cols-2 gap-12 w-full max-w-4xl">
        <div className="border-brutalist p-8 flex flex-col justify-between h-full bg-zinc-900">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-4xl font-black uppercase italic">TURBO CLUB</h2>
              <span className="bg-neon-green text-black px-3 py-1 font-black text-xl">LVL {profile.club_level}</span>
            </div>
            <p className="text-sm font-bold uppercase mb-8 leading-relaxed">
              Increases maximum launch power and reduces energy loss on impact.
            </p>
          </div>
          
          <form action={upgradeClub}>
            <button 
              disabled={profile.coins < clubUpgradeCost}
              className={`w-full btn-brutalist ${profile.coins < clubUpgradeCost ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
            >
              {profile.coins < clubUpgradeCost ? 'NOT ENOUGH COINS' : `UPGRADE (${clubUpgradeCost} C)`}
            </button>
          </form>
        </div>

        <div className="border-brutalist p-8 flex flex-col justify-between h-full bg-zinc-900">
          <div>
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-4xl font-black uppercase italic">SPEED SHOES</h2>
              <span className="bg-neon-orange text-white px-3 py-1 font-black text-xl">LVL {profile.shoe_level}</span>
            </div>
            <p className="text-sm font-bold uppercase mb-8 leading-relaxed">
              Increases movement speed and stamina regeneration rate.
            </p>
          </div>

          <form action={upgradeShoes}>
            <button 
              disabled={profile.coins < shoeUpgradeCost}
              className={`w-full btn-brutalist ${profile.coins < shoeUpgradeCost ? 'opacity-50 cursor-not-allowed grayscale' : ''}`}
            >
              {profile.coins < shoeUpgradeCost ? 'NOT ENOUGH COINS' : `UPGRADE (${shoeUpgradeCost} C)`}
            </button>
          </form>
        </div>
      </main>

      <footer className="mt-24">
        <Link href="/play" className="text-2xl font-black uppercase italic border-b-4 border-white hover:text-neon-green hover:border-neon-green transition-all">
          BACK TO THE COURSE &rarr;
        </Link>
      </footer>
    </div>
  );
}
