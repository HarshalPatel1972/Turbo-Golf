"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";
import GameScene from "./scenes/GameScene";

export default function GameContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: window.innerWidth,
      height: window.innerHeight,
      physics: {
        default: "matter",
        matter: {
          gravity: { x: 0, y: 1.5 },
          debug: true, // Temporarily enabled for Phase 2 testing
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
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-screen bg-black"
      id="phaser-game-container"
    />
  );
}
