/**
 * Constant declarations
 */

export {
  Viewport,
  Constants,
  Block,
  TetroShapes,
  TetroColorMap,
  TetroStartPosMap,
  JLTSZWallKickData,
  IWallKickData,
  OWallKickData,
  PieceWallKickMap,
  DifficultyMap,
  moveKeys,
  otherKeys,
  keyToActionMap,
};

import {
  ShapeLetters,
  ColorMapping,
  ShapeMapping,
  WallKickData,
  WallKickMap,
  DifficultyAndTick,
  MoveKey,
  Key,
} from "./type";

import { Move } from "./state";

// Canvas and preview height and width
const Viewport = {
  CANVAS_WIDTH: 200,
  CANVAS_HEIGHT: 400,
  PREVIEW_WIDTH: 160,
  PREVIEW_HEIGHT: 80,
} as const;

// Other constants
const Constants = {
  TICK_RATE_MS: 500,
  GRID_WIDTH: 10,
  GRID_HEIGHT: 20,
} as const;

// Block height and width
const Block = {
  WIDTH: Viewport.CANVAS_WIDTH / Constants.GRID_WIDTH,
  HEIGHT: Viewport.CANVAS_HEIGHT / Constants.GRID_HEIGHT,
};

// All the tetrominoes shapes
const TetroShapes: ReadonlyArray<ShapeLetters> = [
  "I",
  "T",
  "J",
  "L",
  "O",
  "S",
  "Z",
];

// Map each color to the corresponding tetro shape
const TetroColorMap: ColorMapping = {
  I: "cyan",
  T: "purple",
  J: "blue",
  L: "orange",
  O: "yellow",
  S: "lime",
  Z: "red",
};

// Map each tetro shape to corresponding location and their rotation position
const TetroStartPosMap: ShapeMapping = {
  I: [
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
    ], //Initial position
    [
      { x: 1, y: -1 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
      { x: 1, y: 2 },
    ], //First rotation
    [
      { x: 2, y: 1 },
      { x: 1, y: 1 },
      { x: 0, y: 1 },
      { x: -1, y: 1 },
    ], //Second rotation
    [
      { x: 0, y: 2 },
      { x: 0, y: 1 },
      { x: 0, y: 0 },
      { x: 0, y: -1 },
    ], //Third rotation
  ],
  T: [
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: -1 },
      { x: 1, y: 0 },
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ],
    [
      { x: 0, y: 1 },
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: -1 },
    ],
  ],
  S: [
    [
      { x: -1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: -1 },
      { x: 1, y: -1 },
    ],
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 1, y: 1 },
    ],
    [
      { x: 1, y: 0 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 1 },
    ],
    [
      { x: 0, y: 1 },
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: -1, y: -1 },
    ],
  ],
  Z: [
    [
      { x: -1, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: -1 },
      { x: 1, y: 0 },
    ],
    [
      { x: 1, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ],
    [
      { x: 1, y: 1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
    ],
    [
      { x: -1, y: 1 },
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 0, y: -1 },
    ],
  ],
  O: [
    [
      { x: 0, y: -1 },
      { x: 0, y: 0 },
      { x: 1, y: -1 },
      { x: 1, y: 0 },
    ],
  ],
  J: [
    [
      { x: -1, y: -1 },
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ],
    [
      { x: 1, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 1 },
    ],
    [
      { x: 1, y: 1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 0 },
    ],
    [
      { x: -1, y: 1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ],
  ],
  L: [
    [
      { x: 1, y: -1 },
      { x: 0, y: 0 },
      { x: -1, y: 0 },
      { x: 1, y: 0 },
    ],
    [
      { x: 1, y: 1 },
      { x: 0, y: 0 },
      { x: 0, y: -1 },
      { x: 0, y: 1 },
    ],
    [
      { x: -1, y: 1 },
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: -1, y: 0 },
    ],
    [
      { x: -1, y: -1 },
      { x: 0, y: 0 },
      { x: 0, y: 1 },
      { x: 0, y: -1 },
    ],
  ],
};

// Wall Kick Data for J, L, T, S, Z blocks
const JLTSZWallKickData: WallKickData = [
  [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: -1 },
    { x: 0, y: 2 },
    { x: -1, y: 2 },
  ], // Rotation 3 >> 0
  [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: -1, y: 1 },
    { x: 0, y: -2 },
    { x: -1, y: -2 },
  ], // Rotation 0 >> 1
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: -1 },
    { x: 0, y: 2 },
    { x: 1, y: 2 },
  ], // Rotation 1 >> 2
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 0, y: -2 },
    { x: 1, y: -2 },
  ], // Rotation 2 >> 3
];

// Wall kick data for I block
const IWallKickData: WallKickData = [
  [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: -2 },
    { x: -2, y: 1 },
  ], // Rotation 0 >> 3
  [
    { x: 0, y: 0 },
    { x: -2, y: 0 },
    { x: 1, y: 0 },
    { x: -2, y: -1 },
    { x: 1, y: 2 },
  ], // Rotation 0 >> 1
  [
    { x: 0, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 2 },
    { x: 2, y: -1 },
  ], // Rotation 1 >> 2
  [
    { x: 0, y: 0 },
    { x: 2, y: 0 },
    { x: -1, y: 0 },
    { x: 2, y: 1 },
    { x: -1, y: -2 },
  ], // Rotation 2 >> 3
];

// Wall kick data for O block
const OWallKickData: WallKickData = [[{ x: 0, y: 0 }]];

// Wall kick data map for all blocks
const PieceWallKickMap: WallKickMap = {
  I: IWallKickData,
  J: JLTSZWallKickData,
  L: JLTSZWallKickData,
  O: OWallKickData,
  S: JLTSZWallKickData,
  T: JLTSZWallKickData,
  Z: JLTSZWallKickData,
};

// Map each difficulty to the tick rate
const DifficultyMap: DifficultyAndTick = {
  0: 48,
  1: 43,
  2: 38,
  3: 33,
  4: 28,
  5: 23,
  6: 18,
  7: 13,
  8: 8,
  9: 6,
  10: 5,
  11: 5,
  12: 5,
  13: 4,
  14: 4,
  15: 4,
  16: 3,
  17: 3,
  18: 3,
  19: 2,
  20: 2,
  21: 2,
  22: 2,
  23: 2,
  24: 2,
  25: 2,
  26: 2,
  27: 2,
  28: 2,
  29: 1,
};

// All the movement keys
const moveKeys: ReadonlyArray<MoveKey> = [
  "ArrowLeft",
  "ArrowRight",
  "ArrowDown",
];

// All the other keys
const otherKeys: ReadonlyArray<Key> = ["ArrowUp", "KeyC", "Space"];

const keyToActionMap = {
  ArrowLeft: new Move("x", -Block.WIDTH),
  ArrowRight: new Move("x", Block.WIDTH),
  ArrowDown: new Move("y", Block.HEIGHT),
};
