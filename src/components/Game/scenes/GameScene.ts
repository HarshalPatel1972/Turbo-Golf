import Phaser from "phaser";

enum GameState {
  AIMING,
  RUNNING,
  LEVEL_COMPLETE
}

export default class GameScene extends Phaser.Scene {
  // Game Objects
  private ball!: Phaser.Physics.Matter.Sprite;
  private player!: Phaser.Physics.Matter.Sprite;
  private trajectoryLine!: Phaser.GameObjects.Graphics;
  private staminaBar!: Phaser.GameObjects.Graphics;
  private staminaContainer!: Phaser.GameObjects.Container;
  private coinText!: Phaser.GameObjects.Text;

  // State
  private currentState: GameState = GameState.AIMING;
  private stamina = 100;
  private maxStamina = 100;
  private isExhausted = false;
  private cameraTarget: Phaser.GameObjects.GameObject | null = null;
  private sessionCoins = 0;

  // Aiming logic
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private maxDragDistance = 150;
  private launchForceMultiplier = 0.05;

  // Movement constants
  private moveSpeed = 4;
  private exhaustedSpeed = 1.5;
  private jumpForce = 8;
  private staminaDepletionRate = 0.5;
  private staminaRegenRate = 0.2;

  // Collision Categories
  private catGround!: number;
  private catBall!: number;
  private catPlayer!: number;
  private catSensor!: number;

  // Input
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    A: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
  };

  constructor() {
    super("GameScene");
  }

  create() {
    const { width, height } = this.scale;

    // 0. Collision Categories
    this.catGround = this.matter.world.nextCategory();
    this.catBall = this.matter.world.nextCategory();
    this.catPlayer = this.matter.world.nextCategory();
    this.catSensor = this.matter.world.nextCategory();

    // 1. Terrain Generation
    this.createTerrain(width, height);

    // 2. Golf Ball
    this.createBall(200, height - 300);

    // 3. Player Character
    this.createPlayer(150, height - 300);

    // 4. Hole & Coins
    this.createLevelAssets(height);

    // 5. UI: Stamina Bar & Coin Counter
    this.createUI();

    // 6. Trajectory Graphics
    this.trajectoryLine = this.add.graphics();

    // 7. Input System
    this.setupInput();

    // 8. Camera Setup
    this.setupCamera(height);

    // 9. Collision Events
    this.setupCollisionEvents();

    // Initial state setup
    this.setGameState(GameState.AIMING);
  }

  private setupInput() {
    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup", this.onPointerUp, this);

    if (this.input.keyboard) {
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys("A,D,SPACE") as any;
    }
  }

  private setupCamera(height: number) {
    this.cameras.main.setBounds(0, -1000, 4000, height + 1000);
    this.cameras.main.setLerp(0.1, 0.1);
  }

  private setupCollisionEvents() {
    this.matter.world.on("collisionstart", (event: Phaser.Physics.Matter.Events.CollisionStartEvent) => {
      event.pairs.forEach(pair => {
        const { bodyA, bodyB } = pair;
        
        // Player collects Coin
        if ((bodyA.label === "player" && bodyB.label === "coin") || (bodyA.label === "coin" && bodyB.label === "player")) {
          const coinBody = bodyA.label === "coin" ? bodyA : bodyB;
          const coinSprite = coinBody.gameObject as Phaser.GameObjects.GameObject;
          if (coinSprite && coinSprite.active) {
            this.collectCoin(coinSprite);
          }
        }

        // Ball enters Hole
        if ((bodyA.label === "ball" && bodyB.label === "hole") || (bodyA.label === "hole" && bodyB.label === "ball")) {
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
      this.cameras.main.zoomTo(1.2, 1000, "Power2");
    } else if (state === GameState.RUNNING) {
      this.cameras.main.startFollow(this.ball, true, 0.1, 0.1);
      this.cameraTarget = this.ball;
      this.cameras.main.zoomTo(1.0, 1000, "Power2");
    } else if (state === GameState.LEVEL_COMPLETE) {
      this.cameras.main.stopFollow();
      this.cameras.main.zoomTo(0.8, 2000, "Power2");
    }
  }

  private createUI() {
    // Stamina
    this.staminaContainer = this.add.container(40, 80).setScrollFactor(0);
    
    const bg = this.add.graphics();
    bg.fillStyle(0x000000, 0.8);
    bg.fillRect(0, 0, 200, 30);
    bg.lineStyle(4, 0xffffff, 1);
    bg.strokeRect(0, 0, 200, 30);
    
    this.staminaBar = this.add.graphics();
    
    const label = this.add.text(0, -25, "STAMINA", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "16px",
      fontStyle: "900",
      color: "#ffffff"
    });

    this.staminaContainer.add([bg, this.staminaBar, label]);

    // Coins
    this.coinText = this.add.text(40, 130, "COINS: 0", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "24px",
      fontStyle: "900",
      color: "#39ff14",
      stroke: "#000000",
      strokeThickness: 6
    }).setScrollFactor(0);
  }

  private createLevelAssets(height: number) {
    // Spawn Coins
    for (let i = 0; i < 10; i++) {
      const x = 500 + i * 350;
      const y = height - 300 - Math.random() * 200;
      
      const coin = this.matter.add.sprite(x, y, "", undefined, {
        isSensor: true,
        label: "coin",
        collisionFilter: {
          category: this.catSensor,
          mask: this.catPlayer
        }
      });

      const graphics = this.add.graphics();
      graphics.fillStyle(0x39ff14, 1);
      graphics.fillCircle(0, 0, 10);
      graphics.lineStyle(2, 0xffffff, 1);
      graphics.strokeCircle(0, 0, 10);
      graphics.generateTexture(`coin-tex-${i}`, 22, 22);
      graphics.destroy();

      coin.setTexture(`coin-tex-${i}`);
    }

    // Spawn Hole at the end
    const holeX = 3800;
    const holeY = height - 120;
    const hole = this.matter.add.rectangle(holeX, holeY, 60, 20, {
      isStatic: true,
      isSensor: true,
      label: "hole",
      collisionFilter: {
        category: this.catSensor,
        mask: this.catBall
      }
    });

    this.add.rectangle(holeX, holeY + 10, 80, 40, 0xff5f1f).setStrokeStyle(4, 0xffffff);
    this.add.text(holeX, holeY - 60, "GOAL", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "20px",
      fontStyle: "900",
      color: "#ffffff"
    }).setOrigin(0.5);
  }

  private collectCoin(coin: Phaser.GameObjects.GameObject) {
    const x = (coin as any).x;
    const y = (coin as any).y;
    
    coin.destroy();
    this.sessionCoins += 10;
    this.coinText.setText(`COINS: ${this.sessionCoins}`);

    // Snappy UI tween
    const plusText = this.add.text(x, y, "+10", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "24px",
      fontStyle: "900",
      color: "#39ff14"
    }).setOrigin(0.5);

    this.tweens.add({
      targets: plusText,
      y: y - 100,
      alpha: 0,
      duration: 800,
      ease: "Power2",
      onComplete: () => plusText.destroy()
    });
  }

  private async completeLevel() {
    if (this.currentState === GameState.LEVEL_COMPLETE) return;

    this.setGameState(GameState.LEVEL_COMPLETE);

    const winText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, "LEVEL COMPLETE", {
      fontFamily: "Inter, Arial, sans-serif",
      fontSize: "84px",
      fontStyle: "900",
      color: "#ffffff",
      stroke: "#000000",
      strokeThickness: 12
    }).setOrigin(0.5).setScrollFactor(0);

    // Sync state
    try {
      await fetch("/api/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coins: this.sessionCoins })
      });
      console.log("State synced successfully");
    } catch (error) {
      console.error("Failed to sync state", error);
    }

    // Redirect to shop after delay
    this.time.delayedCall(3000, () => {
      window.location.href = "/shop";
    });
  }

  private createTerrain(width: number, height: number) {
    const terrainWidth = 4000;
    const segments = 40;
    const segmentWidth = terrainWidth / segments;
    const vertices: { x: number; y: number }[] = [];

    vertices.push({ x: 0, y: height });
    for (let i = 0; i <= segments; i++) {
      const x = i * segmentWidth;
      const y = height - 100 - Math.sin(i * 0.5) * 80 - Math.cos(i * 0.2) * 40;
      vertices.push({ x, y });
    }
    vertices.push({ x: terrainWidth, y: height });

    for (let i = 1; i < vertices.length - 2; i++) {
      const p1 = vertices[i];
      const p2 = vertices[i + 1];
      const centerX = (p1.x + p2.x) / 2;
      const centerY = (p1.y + p2.y) / 2;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      this.matter.add.rectangle(centerX, centerY, distance, 20, {
        isStatic: true,
        angle: angle,
        friction: 0.1,
        restitution: 0.2,
        collisionFilter: { category: this.catGround }
      });
    }

    const visualVertices = [...vertices, { x: terrainWidth, y: height + 500 }, { x: 0, y: height + 500 }];
    this.add.polygon(0, 0, visualVertices, 0x000000)
      .setOrigin(0)
      .setStrokeStyle(6, 0xffffff);

    this.matter.world.setBounds(0, -2000, terrainWidth, height + 2000);
  }

  private createBall(x: number, y: number) {
    this.ball = this.matter.add.sprite(x, y, "ball-tex", undefined, {
      shape: { type: "circle", radius: 12 },
      restitution: 0.6,
      friction: 0.05,
      frictionAir: 0.01,
      label: "ball",
      collisionFilter: {
        category: this.catBall,
        mask: this.catGround | this.catSensor
      }
    });
  }

  private createPlayer(x: number, y: number) {
    this.player = this.matter.add.sprite(x, y, "player-tex", undefined, {
      shape: { type: "rectangle", width: 30, height: 60 },
      friction: 0.1,
      restitution: 0,
      label: "player",
      collisionFilter: {
        category: this.catPlayer,
        mask: this.catGround | this.catSensor
      }
    });

    this.player.setFixedRotation();
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (this.currentState !== GameState.AIMING) return;

    const dist = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.ball.x, this.ball.y);
    if (dist < 60) {
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
    const distance = Math.min(Phaser.Math.Distance.Between(0, 0, dx, dy), this.maxDragDistance);
    const angle = Math.atan2(dy, dx);

    const targetX = this.ball.x - Math.cos(angle) * distance;
    const targetY = this.ball.y - Math.sin(angle) * distance;

    this.trajectoryLine.lineStyle(6, 0x39ff14, 1);
    this.trajectoryLine.lineBetween(this.ball.x, this.ball.y, targetX, targetY);
    this.trajectoryLine.fillStyle(0x39ff14, 1);
    this.trajectoryLine.fillCircle(targetX, targetY, 8);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.trajectoryLine.clear();

    const dx = pointer.worldX - this.dragStartX;
    const dy = pointer.worldY - this.dragStartY;
    const distance = Math.min(Phaser.Math.Distance.Between(0, 0, dx, dy), this.maxDragDistance);
    const angle = Math.atan2(dy, dx);

    const forceX = -Math.cos(angle) * distance * this.launchForceMultiplier;
    const forceY = -Math.sin(angle) * distance * this.launchForceMultiplier;

    this.ball.applyForce(new Phaser.Math.Vector2(forceX, forceY));

    // Switch to RUNNING state
    this.setGameState(GameState.RUNNING);
  }

  update() {
    this.handlePlayerMovement();
    this.updateStamina();
    this.updateCameraLogic();
    this.checkBallReach();
  }

  private handlePlayerMovement() {
    if (this.currentState !== GameState.RUNNING) {
      this.player.setVelocityX(0);
      return;
    }

    let isMoving = false;
    const currentSpeed = this.isExhausted ? this.exhaustedSpeed : this.moveSpeed;

    if (this.keys.A.isDown || this.cursors.left.isDown) {
      this.player.setVelocityX(-currentSpeed);
      isMoving = true;
    } else if (this.keys.D.isDown || this.cursors.right.isDown) {
      this.player.setVelocityX(currentSpeed);
      isMoving = true;
    } else {
      this.player.setVelocityX(0);
    }

    const isGrounded = Math.abs(this.player.body!.velocity.y) < 0.1;
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) && isGrounded && !this.isExhausted) {
      this.player.setVelocityY(-this.jumpForce);
    }

    if (isMoving && !this.isExhausted) {
      this.stamina = Math.max(0, this.stamina - this.staminaDepletionRate);
    } else if (!isMoving) {
      this.stamina = Math.min(this.maxStamina, this.stamina + this.staminaRegenRate);
    }

    if (this.stamina <= 0) {
      this.isExhausted = true;
    } else if (this.stamina >= 20) {
      this.isExhausted = false;
    }
  }

  private updateStamina() {
    this.staminaBar.clear();
    const color = this.isExhausted ? 0xff5f1f : 0x39ff14;
    this.staminaBar.fillStyle(color, 1);
    this.staminaBar.fillRect(4, 4, (this.stamina / this.maxStamina) * 192, 22);
  }

  private updateCameraLogic() {
    if (this.currentState === GameState.RUNNING) {
      const ballVel = this.ball.body!.velocity;
      const ballSpeed = Math.sqrt(ballVel.x * ballVel.x + ballVel.y * ballVel.y);

      if (ballSpeed < 0.2) {
        if (this.cameraTarget !== this.player) {
          this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
          this.cameraTarget = this.player;
        }
      } else {
        if (this.cameraTarget !== this.ball) {
          this.cameras.main.startFollow(this.ball, true, 0.1, 0.1);
          this.cameraTarget = this.ball;
        }
      }
    }
  }

  private checkBallReach() {
    if (this.currentState !== GameState.RUNNING) return;

    const ballVel = this.ball.body!.velocity;
    const ballSpeed = Math.sqrt(ballVel.x * ballVel.x + ballVel.y * ballVel.y);

    if (ballSpeed < 0.5) {
      const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, this.ball.x, this.ball.y);
      if (dist < 40) {
        this.setGameState(GameState.AIMING);
      }
    }
  }
}
