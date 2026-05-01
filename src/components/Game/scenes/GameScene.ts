import Phaser from "phaser";

export default class GameScene extends Phaser.Scene {
  private ball!: Phaser.Physics.Matter.Sprite;
  private trajectoryLine!: Phaser.GameObjects.Graphics;
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private maxDragDistance = 150;
  private launchForceMultiplier = 0.05;

  constructor() {
    super("GameScene");
  }

  create() {
    const { width, height } = this.scale;

    // 1. Terrain Generation
    this.createTerrain(width, height);

    // 2. Golf Ball
    this.createBall(200, height - 200);

    // 3. Trajectory Graphics
    this.trajectoryLine = this.add.graphics();

    // 4. Input System
    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup", this.onPointerUp, this);

    // 5. Camera Setup
    this.cameras.main.startFollow(this.ball, true, 0.1, 0.1);
    this.cameras.main.setZoom(1);
    this.cameras.main.setBounds(0, 0, 4000, height); // Extend terrain bounds
  }

  private createTerrain(width: number, height: number) {
    // Generate a sloped, hilly terrain
    const terrainWidth = 4000;
    const segments = 40;
    const segmentWidth = terrainWidth / segments;
    const vertices: { x: number; y: number }[] = [];

    // Starting point
    vertices.push({ x: 0, y: height });

    for (let i = 0; i <= segments; i++) {
      const x = i * segmentWidth;
      // Use sine waves and random offsets for hills
      const y = height - 100 - Math.sin(i * 0.5) * 80 - Math.cos(i * 0.2) * 40;
      vertices.push({ x, y });
    }

    // Closing the polygon
    vertices.push({ x: terrainWidth, y: height });

    // Create the Matter body as a series of rectangles for physics
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
        label: "ground"
      });
    }

    // Single Polygon for Visual
    const visualVertices = [...vertices, { x: terrainWidth, y: height + 500 }, { x: 0, y: height + 500 }];
    this.add.polygon(0, 0, visualVertices, 0x000000)
      .setOrigin(0)
      .setStrokeStyle(6, 0xffffff);

    // Update world bounds
    this.matter.world.setBounds(0, -1000, terrainWidth, height + 1000);
  }


  private createBall(x: number, y: number) {
    // Create a circular physics body for the ball
    this.ball = this.matter.add.sprite(x, y, "", undefined, {
      shape: { type: "circle", radius: 12 },
      restitution: 0.6,
      friction: 0.05,
      frictionAir: 0.01,
      label: "ball"
    });

    // Simple visual for the ball
    const ballGraphics = this.add.graphics();
    ballGraphics.fillStyle(0xffffff, 1);
    ballGraphics.fillCircle(0, 0, 12);
    ballGraphics.lineStyle(2, 0x000000, 1);
    ballGraphics.strokeCircle(0, 0, 12);
    
    // Convert graphics to texture
    ballGraphics.generateTexture("ball-tex", 26, 26);
    ballGraphics.destroy();

    this.ball.setTexture("ball-tex");
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    // Check if clicking near the ball
    const dist = Phaser.Math.Distance.Between(pointer.worldX, pointer.worldY, this.ball.x, this.ball.y);
    if (dist < 50) {
      this.isDragging = true;
      this.dragStartX = pointer.worldX;
      this.dragStartY = pointer.worldY;
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.isDragging) return;

    this.trajectoryLine.clear();

    const dx = pointer.worldX - this.dragStartX;
    const dy = pointer.worldY - this.dragStartY;
    const distance = Math.min(Phaser.Math.Distance.Between(0, 0, dx, dy), this.maxDragDistance);
    const angle = Math.atan2(dy, dx);

    // Calculate end point of trajectory (opposite of drag)
    const targetX = this.ball.x - Math.cos(angle) * distance;
    const targetY = this.ball.y - Math.sin(angle) * distance;

    // Draw trajectory line
    this.trajectoryLine.lineStyle(4, 0x39ff14, 1); // Neon Green
    this.trajectoryLine.lineBetween(this.ball.x, this.ball.y, targetX, targetY);
    
    // Draw power indicator (circle at end)
    this.trajectoryLine.fillStyle(0x39ff14, 1);
    this.trajectoryLine.fillCircle(targetX, targetY, 6);
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.trajectoryLine.clear();

    const dx = pointer.worldX - this.dragStartX;
    const dy = pointer.worldY - this.dragStartY;
    const distance = Math.min(Phaser.Math.Distance.Between(0, 0, dx, dy), this.maxDragDistance);
    const angle = Math.atan2(dy, dx);

    // Apply force in the opposite direction of the drag
    const forceX = -Math.cos(angle) * distance * this.launchForceMultiplier;
    const forceY = -Math.sin(angle) * distance * this.launchForceMultiplier;

    this.ball.applyForce(new Phaser.Math.Vector2(forceX, forceY));
  }

  update() {
    // Add text object for state if needed
    const { width, height } = this.scale;
  }
}
