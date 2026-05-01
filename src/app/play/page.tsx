"use client";

import dynamic from "next/dynamic";
import Link from "next/link";

const GameContainer = dynamic(() => import("@/components/Game/GameContainer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-black">
      <div className="text-4xl font-black uppercase text-white animate-pulse">
        LOADING ENGINE...
      </div>
    </div>
  ),
});


export default function PlayPage() {
  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* HUD / Overlay */}
      <div className="absolute top-4 left-4 z-20 pointer-events-none">
        <div className="bg-white text-black px-4 py-2 font-black uppercase italic text-xl border-4 border-neon-green shadow-brutalist-green">
          TURBO GOLF <span className="text-sm ml-2">v0.1.0</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <Link 
          href="/" 
          className="bg-black text-white px-4 py-2 font-black uppercase border-4 border-white hover:bg-white hover:text-black transition-colors"
        >
          QUIT
        </Link>
      </div>

      <GameContainer />

      <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
        <div className="bg-black text-neon-orange px-2 py-1 text-xs font-black uppercase border-2 border-neon-orange">
          STABLE_BUILD_01 // PHYSICS_ENABLED
        </div>
      </div>
    </div>
  );
}
