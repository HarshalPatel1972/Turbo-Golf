import Phaser from "phaser";
import { LEVELS, LevelConfig, HazardConfig } from "../levels";

enum GameState {
  AIMING,
  RUNNING,
  LEVEL_COMPLETE
}

export default class GameScene extends Phaser.Scene {
  // Assets
  private ball!: Phaser.Physics.Matter.Sprite;
  private player!: Phaser.Physics.Matter.Sprite;
  private aiBall!: Phaser.Physics.Matter.Sprite;
  private aiPlayer!: Phaser.Physics.Matter.Sprite;
  
  private trajectoryLine!: Phaser.GameObjects.Graphics;
  private staminaBar!: Phaser.GameObjects.Graphics;
  private staminaContainer!: Phaser.GameObjects.Container;
  private coinText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;

  // Backgrounds
  private skyBg!: Phaser.GameObjects.TileSprite;
  private mountainsBg!: Phaser.GameObjects.TileSprite;

  // State
  private currentLevelIndex = 0;
  private currentState: GameState = GameState.AIMING;
  private aiState: GameState = GameState.AIMING;
  private stamina = 100;
  private maxStamina = 100;
  private isExhausted = false;
  private cameraTarget: Phaser.GameObjects.GameObject | null = null;
  private sessionCoins = 0;
  private clubLevel = 1;
  private shoeLevel = 1;

  // Aiming
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private maxDragDistance = 150;
  private launchForceMultiplier = 0.05;

  // Hazards & Reset
  private lastBallPos: { x: number; y: number } = { x: 0, y: 0 };
  private inSand = false;

  // Collision Categories
  private catGround!: number;
  private catBall!: number;
  private catPlayer!: number;
  private catSensor!: number;
  private catAI!: number;

  constructor() {
    super("GameScene");
  }

  init(data: { profile: any; levelIndex?: number }) {
    this.clubLevel = data.profile?.club_level || 1;
    this.shoeLevel = data.profile?.shoe_level || 1;
    this.currentLevelIndex = data.levelIndex || 0;

    this.maxDragDistance = 180 + (this.clubLevel - 1) * 25;
    this.maxStamina = 100 + (this.shoeLevel - 1) * 20;
    this.stamina = this.maxStamina;
  }

  preload() {
    // Assets
    this.load.image("sky", "/assets/sky.png");
    this.load.image("mountains", "/assets/mountains.png");
    this.load.image("grass", "/assets/grass.png");
    this.load.image("dirt", "/assets/dirt.png");
    this.load.image("player_sprite", "/assets/player.png");
    this.load.image("ai_sprite", "/assets/ai.png");
    this.load.image("coin", "/assets/coin.png");
    
    // Audio
    this.load.audio("thwack", "https://labs.phaser.io/assets/audio/SoundEffects/p-chi.mp3");
    this.load.audio("ding", "https://labs.phaser.io/assets/audio/SoundEffects/ping.mp3");
    this.load.audio("win", "https://labs.phaser.io/assets/audio/SoundEffects/reward.mp3");

    // Graphics textures
    const graphics = this.add.graphics();
    graphics.fillStyle(0xffffff, 1).fillCircle(13, 13, 12).lineStyle(2, 0x000000, 1).strokeCircle(13, 13, 12).generateTexture("ball-tex", 26, 26);
    graphics.clear().fillStyle(0xff0000, 1).fillCircle(13, 13, 12).lineStyle(2, 0x000000, 1).strokeCircle(13, 13, 12).generateTexture("ai-ball-tex", 26, 26);
    graphics.destroy();
  }

  create() {
    const { width, height } = this.scale;
    const config = LEVELS[this.currentLevelIndex];

    // 0. Categories
    this.catGround = this.matter.world.nextCategory();
    this.catBall = this.matter.world.nextCategory();
    this.catPlayer = this.matter.world.nextCategory();
    this.catSensor = this.matter.world.nextCategory();
    this.catAI = this.matter.world.nextCategory();

    // 1. Backgrounds
    this.skyBg = this.add.tileSprite(0, 0, width, height, "sky").setOrigin(0).setScrollFactor(0);
    this.mountainsBg = this.add.tileSprite(0, height - 600, config.terrainWidth, 600, "mountains").setOrigin(0, 0).setScrollFactor(0.2);

    // 2. Level & Terrain
    this.createLayeredTerrain(config, height);

    // 3. Entities
    this.createCartoonEntities(config);

    // 4. UI
    this.createCartoonUI(config);

    // 5. Systems
    this.trajectoryLine = this.add.graphics();
    this.setupInput();
    this.setupCamera(config, height);
    this.setupCollisionEvents();

    this.setGameState(GameState.AIMING);
    this.aiState = GameState.AIMING;
    this.lastBallPos = { ...config.ballStart };
  }

  private createLayeredTerrain(config: LevelConfig, height: number) {
    const segments = config.terrainSegments;
    const segmentWidth = config.terrainWidth / segments;
    const points: { x: number; y: number }[] = [];

    // Generate terrain points
    for (let i = 0; i <= segments; i++) {
      const x = i * segmentWidth;
      const y = height - 150 - Math.sin(i * 0.4) * 60 - Math.cos(i * 0.15) * 30;
      points.push({ x, y });
    }

    // Create Matter bodies for terrain
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i+1];
      const centerX = (p1.x + p2.x) / 2;
      const centerY = (p1.y + p2.y) / 2;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      this.matter.add.rectangle(centerX, centerY, distance, 40, {
        isStatic: true,
        angle: angle,
        label: "ground",
        collisionFilter: { category: this.catGround }
      });
      
      // Visuals: Grass Top & Dirt Underlayer
      this.add.tileSprite(centerX, centerY, distance, 40, "grass").setAngle(Phaser.Math.RadToDeg(angle));
      
      // Fill below with dirt (simplified polygon for efficiency)
      const fill = this.add.polygon(0, 0, [
        p1.x, p1.y + 20,
        p2.x, p2.y + 20,
        p2.x, height + 1000,
        p1.x, height + 1000
      ], 0x000000, 0).setOrigin(0);
      
      // Instead of colored polygon, we'll use a large tileSprite for the whole underworld
    }

    // Large dirt background under the whole level
    this.add.tileSprite(config.terrainWidth/2, height + 400, config.terrainWidth, 1000, "dirt").setScrollFactor(1);

    // Hazards (Visual Fix)
    config.hazards.forEach(hazard => {
      const hY = height - 150 + (hazard.y || 0);
      this.matter.add.rectangle(hazard.x, hY, hazard.width, hazard.height, {
        isStatic: true,
        isSensor: hazard.type === "water",
        label: hazard.type,
        collisionFilter: { category: this.catSensor }
      });

      let color = 0xedc9af; // Sand
      if (hazard.type === "water") color = 0x00aaff;
      if (hazard.type === "boost") color = 0x39ff14;

      this.add.rectangle(hazard.x, hY, hazard.width, hazard.height, color, 0.8)
        .setStrokeStyle(4, 0x000000);
    });

    // Hole
    const holeY = height - 170;
    this.matter.add.rectangle(config.holePos.x, holeY, 60, 20, { isStatic: true, isSensor: true, label: "hole" });
    this.add.rectangle(config.holePos.x, holeY + 10, 80, 40, 0xff0000).setStrokeStyle(4, 0xffffff);
    this.add.text(config.holePos.x, holeY - 100, "FLAG", { fontSize: "24px", fontStyle: "900", color: "#ffffff", stroke: "#000", strokeThickness: 4 }).setOrigin(0.5);
  }

  private createCartoonEntities(config: LevelConfig) {
    // Ball
    this.ball = this.matter.add.sprite(config.ballStart.x, config.ballStart.y, "ball-tex", undefined, {
      shape: { type: "circle", radius: 12 },
      restitution: 0.6, friction: 0.05, label: "ball",
      collisionFilter: { category: this.catBall, mask: this.catGround | this.catSensor }
    });

    // Player (Using Sprite)
    this.player = this.matter.add.sprite(config.playerStart.x, config.playerStart.y, "player_sprite", undefined, {
      shape: { type: "rectangle", width: 40, height: 80 },
      label: "player",
      collisionFilter: { category: this.catPlayer, mask: this.catGround | this.catSensor }
    });
    this.player.setFixedRotation().setScale(0.8);

    // AI
    this.aiBall = this.matter.add.sprite(config.ballStart.x + 30, config.ballStart.y, "ai-ball-tex", undefined, {
      shape: { type: "circle", radius: 12 },
      restitution: 0.6, friction: 0.05, label: "ai-ball",
      collisionFilter: { category: this.catAI, mask: this.catGround | this.catSensor }
    });

    this.aiPlayer = this.matter.add.sprite(config.playerStart.x - 60, config.playerStart.y, "ai_sprite", undefined, {
      shape: { type: "rectangle", width: 40, height: 80 },
      label: "ai-player",
      collisionFilter: { category: this.catAI, mask: this.catGround | this.catSensor }
    });
    this.aiPlayer.setFixedRotation().setScale(0.8);

    // Add coin sprites to the world
    for (let i = 1; i <= 10; i++) {
      const cx = 500 + i * 300;
      const cy = 300 + Math.sin(i) * 100;
      this.matter.add.sprite(cx, cy, "coin", undefined, {
        isStatic: true, isSensor: true, label: "coin"
      }).setScale(0.5);
    }
  }

  private shots = 0;
  private par = 5;

  private createCartoonUI(config: LevelConfig) {
    const { width } = this.scale;
    
    // Bubbly HUD Background
    const hudBg = this.add.graphics()
      .fillStyle(0xffffff, 0.9)
      .fillRoundedRect(20, 20, 320, 140, 20)
      .lineStyle(6, 0x000000, 1)
      .strokeRoundedRect(20, 20, 320, 140, 20)
      .setScrollFactor(0);

    this.coinText = this.add.text(40, 40, "COINS: 0", { 
      fontFamily: "Segoe UI, sans-serif", fontSize: "28px", fontStyle: "900", color: "#FF9800", stroke: "#000", strokeThickness: 6 
    }).setScrollFactor(0);

    this.levelText = this.add.text(40, 85, `COURSE: ${config.id}`, { 
      fontFamily: "Segoe UI, sans-serif", fontSize: "18px", fontStyle: "900", color: "#333" 
    }).setScrollFactor(0);

    // Par/Shots Panel (Bottom Right)
    const scorePanel = this.add.graphics()
      .fillStyle(0x000000, 0.8)
      .fillRoundedRect(width - 220, this.scale.height - 120, 200, 100, 15)
      .lineStyle(4, 0xffffff, 1)
      .strokeRoundedRect(width - 220, this.scale.height - 120, 200, 100, 15)
      .setScrollFactor(0);
    
    this.add.text(width - 200, this.scale.height - 100, "PAR: 5", { 
      fontFamily: "Segoe UI, sans-serif", fontSize: "24px", fontStyle: "900", color: "#ffffff" 
    }).setScrollFactor(0);
    
    this.add.text(width - 200, this.scale.height - 60, "SHOTS: 0", { 
      fontFamily: "Segoe UI, sans-serif", fontSize: "24px", fontStyle: "900", color: "#FFEB3B" 
    }).setScrollFactor(0).setName("shot-counter");

    // Wind Indicator (Top Center)
    const windBox = this.add.graphics()
      .fillStyle(0xffffff, 0.9)
      .fillRoundedRect(width / 2 - 60, 20, 120, 40, 10)
      .lineStyle(3, 0x000000, 1)
      .strokeRoundedRect(width / 2 - 60, 20, 120, 40, 10)
      .setScrollFactor(0);
    
    this.add.text(width / 2, 40, "💨 5 MPH", { 
      fontFamily: "Segoe UI, sans-serif", fontSize: "18px", fontStyle: "900", color: "#333" 
    }).setOrigin(0.5).setScrollFactor(0);

    // Stamina (Top Right)
    this.staminaContainer = this.add.container(width - 240, 40).setScrollFactor(0);
    const sBg = this.add.graphics().fillStyle(0x000000, 0.2).fillRoundedRect(0, 0, 200, 30, 15).lineStyle(4, 0x000000, 1).strokeRoundedRect(0, 0, 200, 30, 15);
    this.staminaBar = this.add.graphics();
    this.staminaContainer.add([sBg, this.staminaBar]);
  }

  private setupInput() {
    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup", this.onPointerUp, this);
    if (this.input.keyboard) {
      this.keys = this.input.keyboard.addKeys("A,D,SPACE") as any;
      this.cursors = this.input.keyboard.createCursorKeys();
    }
  }

  private setupCamera(config: LevelConfig, height: number) {
    this.cameras.main.setBounds(0, -1000, config.terrainWidth, height + 1000);
    this.cameras.main.setBackgroundColor("#87CEEB");
    this.cameras.main.setLerp(0.1, 0.1);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (this.currentState !== GameState.AIMING) return;
    if (Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.ball.x, this.ball.y) < 80) {
      this.isDragging = true;
      this.dragStartX = pointer.worldX;
      this.dragStartY = pointer.worldY;
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.isDragging || this.currentState !== GameState.AIMING) return;
    this.trajectoryLine.clear();
    const dx = pointer.worldX - this.dragStartX;
    const dy = pointer.worldY - this.dragStartY;
    const dist = Math.min(Phaser.Math.Distance.Between(0, 0, dx, dy), this.maxDragDistance);
    const angle = Math.atan2(dy, dx);

    // Draw dotted trajectory
    this.trajectoryLine.lineStyle(4, 0xffffff, 1);
    for (let i = 0; i < 20; i++) {
      const tx = this.ball.x - Math.cos(angle) * (dist * i / 10);
      const ty = this.ball.y - Math.sin(angle) * (dist * i / 10);
      if (i % 2 === 0) this.trajectoryLine.fillCircle(tx, ty, 4);
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.trajectoryLine.clear();
    const dx = pointer.worldX - this.dragStartX;
    const dy = pointer.worldY - this.dragStartY;
    const dist = Math.min(Phaser.Math.Distance.Between(0, 0, dx, dy), this.maxDragDistance);
    const angle = Math.atan2(dy, dx);
    
    this.ball.applyForce(new Phaser.Math.Vector2(-Math.cos(angle) * dist * 0.04, -Math.sin(angle) * dist * 0.04));
    this.sound.play("thwack");
    this.shots++;
    const shotText = this.children.getByName("shot-counter") as Phaser.GameObjects.Text;
    if (shotText) shotText.setText(`SHOTS: ${this.shots}`);
    this.setGameState(GameState.RUNNING);
  }

  update() {
    this.handlePlayerMovement();
    this.handleAI();
    this.updateStaminaUI();
    this.updateCameraLogic();
    this.checkBallReach();
    
    // Parallax logic
    this.skyBg.setTilePosition(this.cameras.main.scrollX * 0.1);
    this.mountainsBg.setTilePosition(this.cameras.main.scrollX * 0.2);
  }

  private handlePlayerMovement() {
    if (this.currentState !== GameState.RUNNING) {
      this.player.setVelocityX(0);
      return;
    }

    const moveSpeed = this.isExhausted ? 2 : 5;
    if (this.keys.A.isDown || this.cursors.left.isDown) {
      this.player.setVelocityX(-moveSpeed);
      this.stamina = Math.max(0, this.stamina - 0.4);
    } else if (this.keys.D.isDown || this.cursors.right.isDown) {
      this.player.setVelocityX(moveSpeed);
      this.stamina = Math.max(0, this.stamina - 0.4);
    } else {
      this.player.setVelocityX(0);
      this.stamina = Math.min(this.maxStamina, this.stamina + 0.2);
    }

    if (this.stamina <= 0) this.isExhausted = true;
    else if (this.stamina > 20) this.isExhausted = false;

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) && Math.abs(this.player.body!.velocity.y) < 0.1) {
      this.player.setVelocityY(-10);
    }
  }

  private handleAI() {
    // Simple AI follows ball and hole
    const config = LEVELS[this.currentLevelIndex];
    if (this.aiState === GameState.AIMING) {
      if (Math.abs(this.aiBall.body!.velocity.x) < 0.1) {
        this.aiBall.applyForce(new Phaser.Math.Vector2(0.05 + Math.random()*0.05, -0.1));
        this.aiState = GameState.RUNNING;
      }
    } else {
      const distToBall = this.aiBall.x - this.aiPlayer.x;
      if (Math.abs(distToBall) > 50) {
        this.aiPlayer.setVelocityX(Math.sign(distToBall) * 4);
      } else if (Math.abs(this.aiBall.body!.velocity.x) < 0.2) {
        this.aiState = GameState.AIMING;
      }
    }
  }

  private updateStaminaUI() {
    this.staminaBar.clear()
      .fillStyle(this.isExhausted ? 0xFF5252 : 0x4CAF50, 1)
      .fillRoundedRect(5, 5, (this.stamina / this.maxStamina) * 190, 20, 10);
  }

  private updateCameraLogic() {
    if (this.currentState === GameState.RUNNING) {
      const ballVel = this.ball.body!.velocity;
      const speed = Math.sqrt(ballVel.x**2 + ballVel.y**2);
      if (speed > 1) {
        if (this.cameraTarget !== this.ball) {
          this.cameras.main.startFollow(this.ball, true, 0.1, 0.1);
          this.cameraTarget = this.ball;
        }
      } else {
        if (this.cameraTarget !== this.player) {
          this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
          this.cameraTarget = this.player;
        }
      }
    }
  }

  private checkBallReach() {
    if (this.currentState !== GameState.RUNNING) return;
    if (Math.abs(this.ball.body!.velocity.x) < 0.5) {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, this.ball.x, this.ball.y) < 50) {
        this.setGameState(GameState.AIMING);
      }
    }
  }

  private setupCollisionEvents() {
    this.matter.world.on("collisionstart", (event: any) => {
      event.pairs.forEach((pair: any) => {
        const labels = [pair.bodyA.label, pair.bodyB.label];
        if (labels.includes("player") && labels.includes("coin")) {
          const coin = pair.bodyA.label === "coin" ? pair.bodyA.gameObject : pair.bodyB.gameObject;
          if (coin) {
            coin.destroy();
            this.sessionCoins += 10;
            this.coinText.setText(`COINS: ${this.sessionCoins}`);
            this.sound.play("ding");
          }
        }
        if (labels.includes("ball") && labels.includes("hole")) {
          this.completeLevel();
        }
      });
    });
  }

  private setGameState(state: GameState) {
    this.currentState = state;
    if (state === GameState.AIMING) {
      this.cameras.main.startFollow(this.ball, true, 0.1, 0.1);
      this.cameraTarget = this.ball;
    }
  }

  private async completeLevel() {
    if (this.currentState === GameState.LEVEL_COMPLETE) return;
    this.currentState = GameState.LEVEL_COMPLETE;
    this.sound.play("win");
    
    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, "GOAL!", { 
      fontFamily: "Outfit, Arial", fontSize: "120px", fontStyle: "900", color: "#FFEB3B", stroke: "#000", strokeThickness: 15 
    }).setOrigin(0.5).setScrollFactor(0);

    await fetch("/api/sync", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ coins: this.sessionCoins }) });

    this.time.delayedCall(3000, () => {
      const nextLevel = (this.currentLevelIndex + 1) % LEVELS.length;
      this.scene.restart({ profile: { club_level: this.clubLevel, shoe_level: this.shoeLevel }, levelIndex: nextLevel });
    });
  }

  // Input types helper
  private keys!: { A: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key; SPACE: Phaser.Input.Keyboard.Key; };
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
}
