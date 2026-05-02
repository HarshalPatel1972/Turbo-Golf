import Link from "next/link";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-sky-400">
      {/* Cartoon Sky Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40"
        style={{ backgroundImage: 'url("/assets/sky.png")' }}
      />
      
      {/* Decorative Mountains */}
      <div 
        className="absolute bottom-0 w-full h-[400px] bg-repeat-x bg-bottom opacity-60"
        style={{ backgroundImage: 'url("/assets/mountains.png")', backgroundSize: '1200px' }}
      />

      <main className="relative z-10 flex flex-col items-center">
        <header className="mb-12 animate-bounce-slow">
          <h1 className="text-8xl md:text-[10rem] font-black text-white italic tracking-tighter drop-shadow-[0_10px_0_rgba(0,0,0,1)] text-center">
            TURBO <br />
            <span className="text-game-yellow">GOLF</span>
          </h1>
          <p className="bg-black text-white px-6 py-2 text-2xl font-black uppercase italic -rotate-2 inline-block mx-auto transform translate-x-12">
            The Spiritual Successor
          </p>
        </header>

        <div className="flex flex-col gap-6 w-full max-w-md">
          <Link href="/play" className="btn-game btn-primary text-center">
            START ROUND
          </Link>
          <Link href="/shop" className="btn-game btn-secondary text-center">
            UPGRADE SHOP
          </Link>
        </div>

        <footer className="mt-24 text-black font-black uppercase text-xl bg-white/80 px-4 py-1 rounded-full border-2 border-black">
          &copy; 2026 TURBO GOLF / CLASSIC EDITION
        </footer>
      </main>
    </div>
  );
}
