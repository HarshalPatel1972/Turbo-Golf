import Phaser from "phaser";

enum GameState {
  AIMING,
  RUNNING
}

export default class GameScene extends Phaser.Scene {
  // Game Objects
  private ball!: Phaser.Physics.Matter.Sprite;
  private player!: Phaser.Physics.Matter.Sprite;
  private trajectoryLine!: Phaser.GameObjects.Graphics;
  private staminaBar!: Phaser.GameObjects.Graphics;
  private staminaContainer!: Phaser.GameObjects.Container;

  // State
  private currentState: GameState = GameState.AIMING;
  private stamina = 100;
  private maxStamina = 100;
  private isExhausted = false;
  private cameraTarget: Phaser.GameObjects.GameObject | null = null;

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

    // 1. Terrain Generation
    this.createTerrain(width, height);

    // 2. Golf Ball
    this.createBall(200, height - 300);

    // 3. Player Character
    this.createPlayer(150, height - 300);

    // 4. UI: Stamina Bar
    this.createUI();

    // 5. Trajectory Graphics
    this.trajectoryLine = this.add.graphics();

    // 6. Input System
    this.setupInput();

    // 7. Camera Setup
    this.setupCamera(height);

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

  private setGameState(state: GameState) {
    this.currentState = state;

    if (state === GameState.AIMING) {
      this.cameras.main.startFollow(this.ball, true, 0.1, 0.1);
      this.cameraTarget = this.ball;
      this.cameras.main.zoomTo(1.2, 1000, "Power2");
    } else {
      this.cameras.main.startFollow(this.ball, true, 0.1, 0.1);
      this.cameraTarget = this.ball;
      this.cameras.main.zoomTo(1.0, 1000, "Power2");
    }
  }

  private createUI() {
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
        mask: this.catGround // Only collide with ground
      }
    });
  }

  private createPlayer(x: number, y: number) {
    // Player is a rectangle/capsule
    this.player = this.matter.add.sprite(x, y, "", undefined, {
      shape: { type: "rectangle", width: 30, height: 60 },
      friction: 0.1,
      restitution: 0,
      label: "player",
      collisionFilter: {
        category: this.catPlayer,
        mask: this.catGround // Only collide with ground
      }
    });

    this.player.setFixedRotation();

    // Player visual
    const playerGraphics = this.add.graphics();
    playerGraphics.fillStyle(0xffffff, 1);
    playerGraphics.fillRect(-15, -30, 30, 60);
    playerGraphics.lineStyle(4, 0x000000, 1);
    playerGraphics.strokeRect(-15, -30, 30, 60);
    playerGraphics.generateTexture("player-tex", 34, 64);
    playerGraphics.destroy();

    this.player.setTexture("player-tex");
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

    // Jump
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
        // Ball stopped, follow player
        if (this.cameraTarget !== this.player) {
          this.cameras.main.startFollow(this.player, true, 0.05, 0.05);
          this.cameraTarget = this.player;
        }
      } else {
        // Ball moving, follow ball
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
