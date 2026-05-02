export interface HazardConfig {
  type: "sand" | "water" | "boost";
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
}

export interface LevelConfig {
  id: number;
  terrainWidth: number;
  terrainSegments: number;
  ballStart: { x: number; y: number };
  playerStart: { x: number; y: number };
  holePos: { x: number; y: number };
  hazards: HazardConfig[];
  terrainSeed?: number;
}

export const LEVELS: LevelConfig[] = [
  {
    id: 1,
    terrainWidth: 4000,
    terrainSegments: 40,
    ballStart: { x: 200, y: 500 },
    playerStart: { x: 150, y: 500 },
    holePos: { x: 3800, y: 0 }, // Y is relative to terrain
    hazards: [
      { type: "sand", x: 1200, y: 0, width: 300, height: 40 },
      { type: "boost", x: 2000, y: 0, width: 100, height: 10 },
      { type: "water", x: 2800, y: 800, width: 400, height: 100 }
    ]
  },
  {
    id: 2,
    terrainWidth: 5000,
    terrainSegments: 50,
    ballStart: { x: 200, y: 500 },
    playerStart: { x: 150, y: 500 },
    holePos: { x: 4800, y: 0 },
    hazards: [
      { type: "sand", x: 800, y: 0, width: 200, height: 40 },
      { type: "water", x: 1500, y: 800, width: 600, height: 100 },
      { type: "boost", x: 3000, y: 0, width: 100, height: 10 },
      { type: "sand", x: 4000, y: 0, width: 400, height: 40 }
    ]
  },
  {
    id: 3,
    terrainWidth: 6000,
    terrainSegments: 60,
    ballStart: { x: 200, y: 500 },
    playerStart: { x: 150, y: 500 },
    holePos: { x: 5800, y: 0 },
    hazards: [
      { type: "water", x: 1000, y: 800, width: 400, height: 100 },
      { type: "water", x: 2000, y: 800, width: 400, height: 100 },
      { type: "water", x: 3000, y: 800, width: 400, height: 100 },
      { type: "boost", x: 4500, y: 0, width: 100, height: 10 },
      { type: "sand", x: 5000, y: 0, width: 500, height: 40 }
    ]
  }
];
