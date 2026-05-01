import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 md:p-24 bg-black overflow-hidden relative">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 border-8 border-white"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 border-8 border-neon-green"></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 border-4 border-neon-orange -rotate-12"></div>
      </div>

      <main className="z-10 flex flex-col items-center text-center">
        <h1 className="text-7xl md:text-9xl font-black italic tracking-tighter uppercase mb-2">
          TURBO <span className="text-neon-green">GOLF</span>
        </h1>
        <p className="text-xl md:text-2xl font-bold uppercase tracking-widest mb-12 bg-white text-black px-4 py-1">
          THE SPIRITUAL SUCCESSOR
        </p>

        <div className="relative group">
          {/* Animated Glow Effect */}
          <div className="absolute -inset-1 bg-neon-green opacity-20 group-hover:opacity-100 blur-xl transition duration-200"></div>
          
          <Link href="/play" className="btn-brutalist inline-block">
            PLAY NOW
          </Link>
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl">
          <div className="border-brutalist p-6 text-left">
            <h3 className="text-2xl font-black uppercase mb-2 text-neon-orange">HIGH SPEED</h3>
            <p className="text-sm uppercase font-bold">This isn't your grandfather's country club. Race against time.</p>
          </div>
          <div className="border-brutalist p-6 text-left">
            <h3 className="text-2xl font-black uppercase mb-2 text-neon-green">REAL PHYSICS</h3>
            <p className="text-sm uppercase font-bold">Powered by Matter.js for unpredictable, chaotic results.</p>
          </div>
          <div className="border-brutalist p-6 text-left">
            <h3 className="text-2xl font-black uppercase mb-2 text-white">BRUTALIST UI</h3>
            <p className="text-sm uppercase font-bold">Aggressive design for aggressive gameplay.</p>
          </div>
        </div>
      </main>

      <footer className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
        <div className="text-xs font-black uppercase tracking-tighter">
          PHASE 1: ENGINE_INIT_SUCCESS
        </div>
        <div className="text-xs font-black uppercase tracking-tighter">
          &copy; 2026 TURBO GOLF / ANTIGRAVITY
        </div>
      </footer>
    </div>
  );
}
