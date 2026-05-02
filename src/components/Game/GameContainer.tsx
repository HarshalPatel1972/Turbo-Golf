"use client";

import { useEffect, useRef, useState } from "react";
import Phaser from "phaser";
import GameScene from "./scenes/GameScene";

export default function GameContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then(res => res.json())
      .then(data => setProfile(data))
      .catch(err => console.error("Failed to load profile", err));
  }, []);

  useEffect(() => {
    if (!containerRef.current || !profile) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      physics: {
        default: "matter",
        matter: {
          gravity: { x: 0, y: 1.5 },
          debug: false,
        },
      },
      scene: [GameScene],
      backgroundColor: "#000000",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      pixelArt: false,
      antialias: true,
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    // Pass profile data to scene when it's ready
    game.scene.start("GameScene", { profile });

    const handleResize = () => {
      if (gameRef.current) {
        gameRef.current.scale.resize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [profile]);

  if (!profile) {
    return (
      <div className="w-full h-screen bg-black flex items-center justify-center">
        <div className="text-white text-4xl font-black italic animate-pulse">LOADING PROFILE...</div>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full h-screen bg-black"
      id="phaser-game-container"
    />
  );
}
