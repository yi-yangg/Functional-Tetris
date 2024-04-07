/**
 * Type definitions
 */

export type {
  ShapeLetters,
  PieceStartLocation,
  PieceLocation,
  ShapeMapping,
  Color,
  ColorMapping,
  WallKickData,
  WallKickMap,
  DifficultyAndTick,
  MoveKey,
  Key,
  keyCodes,
  Cell,
  Tetro,
  State,
  Action,
  Difficulties,
};

// type for all the shape letters
type ShapeLetters = "I" | "T" | "J" | "L" | "O" | "S" | "Z";

// mappings for rotation and wall kick positions
type PieceStartLocation = Readonly<{
  x: -2 | -1 | 0 | 1 | 2;
  y: -2 | -1 | 0 | 1 | 2;
}>;

type PieceLocation = ReadonlyArray<PieceStartLocation>;

// Mapping for the tetrominoes shapes
type ShapeMapping = Readonly<{
  [key in ShapeLetters]: ReadonlyArray<PieceLocation>;
}>;

// colors for the tetrominoes
type Color = "cyan" | "blue" | "orange" | "yellow" | "red" | "lime" | "purple";

// Mapping for tetrominoes color
type ColorMapping = Readonly<{
  [key in ShapeLetters]: Color;
}>;

// Wall kick Data for all blocks
type WallKickData = ReadonlyArray<ReadonlyArray<PieceStartLocation>>;

// Map wall kick data to corresponding blocks
type WallKickMap = {
  [key in ShapeLetters]: WallKickData;
};

// Number of difficulties (0 - 29)
type Difficulties =
  | 0
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20
  | 21
  | 22
  | 23
  | 24
  | 25
  | 26
  | 27
  | 28
  | 29;

// Map difficulties to the tick speed
type DifficultyAndTick = {
  [key in Difficulties]: number;
};

// Movement key codes
type MoveKey = "ArrowLeft" | "ArrowRight" | "ArrowDown";

// Object to keep track of key codes and if it is currently being pressed
type keyCodes = { keyCode: MoveKey | Key; isPressing: boolean };

// Other user input key codes
type Key = "ArrowUp" | "KeyC" | "Space";

// Contains information of each cells in tetrominoes
type Cell = Readonly<{
  x: number;
  y: number;
  width: number;
  height: number;
  id: string;
  color: string;
}>;

// Contains information for the tetrominoes
type Tetro = Readonly<{
  cells: ReadonlyArray<Cell>;
  originBlock: Cell;
  collided: boolean;
  rotation: number;
  shape: ShapeLetters;
  seed: number;
  blockStartCount: number;
}>;

// Contains information on the state of the game
type State = Readonly<{
  currentBlock?: Tetro;
  blocks: ReadonlyArray<Cell>;
  nextBlock?: Tetro;
  heldBlock?: Tetro;
  ghostBlock?: Tetro;
  blockCount: number;
  lineClears: number;
  level: number;
  points: number;
  highscore: number;
  clearedBlocks: ReadonlyArray<Cell>;
  gameEnd: boolean;
  seed: number;
  canHoldAgain: boolean;
  changeInLevel: boolean;
}>;

/**
 * Action interface that has a perform function that
 * takes a state and generate a new state
 */
interface Action {
  perform(s: State): State;
}
