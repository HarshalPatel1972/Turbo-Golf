"use client";

import { useEffect, useRef } from "react";
import Phaser from "phaser";

export default function GameContainer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: containerRef.current,
      width: "100%",
      height: "100%",
      physics: {
        default: "matter",
        matter: {
          gravity: { x: 0, y: 1 },
          debug: true,
        },
      },
      scene: {
        preload: preload,
        create: create,
        update: update,
      },
      backgroundColor: "#1a1a1a",
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    const game = new Phaser.Game(config);
    gameRef.current = game;

    function preload(this: Phaser.Scene) {
      // Future preloads
    }

    function create(this: Phaser.Scene) {
      const { width, height } = this.scale;
      
      this.add.text(width / 2, height / 2, "Engine Initialized: Awaiting Phase 2", {
        fontSize: "32px",
        fontFamily: "Inter, Arial, sans-serif",
        color: "#ffffff",
        fontStyle: "bold",
      }).setOrigin(0.5);

      // Matter.js sanity check: add a falling box
      this.matter.add.rectangle(width / 2, 100, 50, 50, {
        chamfer: { radius: 5 },
      });
      
      // Ground
      this.matter.add.rectangle(width / 2, height - 20, width, 40, { isStatic: true });
    }

    function update(this: Phaser.Scene) {
      // Game loop
    }

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-screen bg-black border-8 border-white"
      id="phaser-game-container"
    />
  );
}
