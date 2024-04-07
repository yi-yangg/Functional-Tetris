/**
 * Utility functions
 */

import { Cell, State } from "./type";
import { Block, Viewport, Constants } from "./constants";

export {
  RNG,
  hasBlocksAround,
  hasBoundaryAround,
  boundaryX,
  boundaryY,
  collisionDetection,
  lineClearCheck,
  createBlock,
};

/**
 * Pseudorandomnumber generator that generates a sequence of random numbers
 * by repeatedly passing in the previous hashed value
 *
 * RNG class taken from Asteriods example
 */
abstract class RNG {
  // LCG using GCC's constants
  private static m = 0x80000000; // 2**31
  private static a = 1103515245;
  private static c = 12345;

  /**
   * Call `hash` repeatedly to generate the sequence of hashes.
   * @param seed
   * @returns a hash of the seed
   */
  public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

  /**
   * Takes hash value and scales it to the range 0 to 6 (7 possible tetrominoes)
   */
  public static scale = (hash: number) => Math.floor((hash / (RNG.m - 1)) * 7);
}

/**
 * Check for all the cells if there is any blocks overlapping on them
 * @param cells         Cells in the tetromino
 * @param s             Current State
 * @param offset        Amount to move
 * @param direction     x or y direction
 * @returns true or false
 */
const hasBlocksAround = (
  cells: ReadonlyArray<Cell>,
  s: State,
  offset: number,
  direction: "x" | "y"
): boolean => {
  return (
    // go through each cell in cells
    cells.filter(({ x, y }) => {
      // set offset for x or y based on the direction
      const xPos = direction === "x" ? x + offset : x,
        yPos = direction === "y" ? y + offset : y;

      return (
        // check for all the blocks in the current game state to check for overlapping blocks
        s.blocks.filter(
          ({ x: xVal, y: yVal }) => xPos === xVal && yPos === yVal
        ).length === 0
      );
    }).length !== cells.length
  );
};

/**
 * Similar to the hasBlocksAround function, checks if current block after offset exceeds
 * the x or y boundary
 * @param cells
 * @param s
 * @param offset
 * @param direction
 * @returns true or false
 */
const hasBoundaryAround = (
  cells: ReadonlyArray<Cell>,
  s: State,
  offset: number,
  direction: "x" | "y"
): boolean => {
  return (
    // filter each of the cells and check if they exceed the boundary or not
    cells.filter(({ x, y }) => {
      // set condition depending on direction
      const conditionCheck =
        direction === "x"
          ? x + offset > 0 - Block.WIDTH && x + offset < Viewport.CANVAS_WIDTH
          : y + offset < Viewport.CANVAS_HEIGHT;
      return conditionCheck;
    }).length !== cells.length
  );
};

/**
 * Tetromino moving in x direction check if colliding or not
 * @param cells
 * @param s
 * @param offset
 * @returns new array of cells, apply offset if no blocks or boundary beside
 */
const boundaryX = (
  cells: ReadonlyArray<Cell>,
  s: State,
  offset: number
): ReadonlyArray<Cell> => {
  if (!s.currentBlock || s.currentBlock.collided) return cells;

  // check if all the blocks are not blocked by any blocks
  const hasBlocksBeside = hasBlocksAround(cells, s, offset, "x");

  // check if any of the block has a boundary beside it
  const hasBoundaryBeside = hasBoundaryAround(cells, s, offset, "x");

  return hasBlocksBeside || hasBoundaryBeside
    ? cells
    : cells.map((cell) => ({ ...cell, x: cell.x + offset }));
};

/**
 * Tetromino moving in y direction check if colliding or not
 * @param cells
 * @param s
 * @param offset
 * @returns new array of cells, apply offset if no blocks or boundary below
 */
const boundaryY = (
  cells: ReadonlyArray<Cell>,
  s: State,
  offset: number
): ReadonlyArray<Cell> => {
  if (!s.currentBlock || s.currentBlock.collided) return cells;

  // check if any blocks in tetro is overlapping with other blocks
  const hasBlocksBelow = hasBlocksAround(cells, s, offset, "y");

  // check if any blocks in tetro is overlapping with boundary
  const hasBoundaryBelow = hasBoundaryAround(cells, s, offset, "y");

  return hasBlocksBelow || hasBoundaryBelow
    ? cells
    : cells.map((cell) => ({ ...cell, y: cell.y + offset }));
};

/**
 * Check if current block is colliding with any other blocks, only checking
 * along the y axis
 * @param s
 * @returns a new state with the collided boolean set to true and currentblock added
 *          into the blocks array
 */
const collisionDetection = (s: State): State => {
  // given 2 points check if one is on top the other
  const itemCollided = (
      [x1, y1]: [number, number],
      [x2, y2]: [number, number]
    ) => x1 === x2 && y1 === y2 - Block.HEIGHT,
    // check if current block is colliding with boundary
    blockAndBoundaryCollided =
      s.currentBlock!.cells.filter(({ x, y }) =>
        itemCollided([x, y], [x, Viewport.CANVAS_HEIGHT])
      ).length > 0,
    // check if current block is colliding with other blocks
    blockAndBlocksCollided =
      s.currentBlock!.cells.filter(({ x, y }) => {
        return (
          s.blocks.filter(({ x: xVal, y: yVal }) =>
            itemCollided([x, y], [xVal, yVal])
          ).length > 0
        );
      }).length > 0,
    // if one is true then meaning there is a collision
    collisionCondition = blockAndBoundaryCollided || blockAndBlocksCollided;

  return {
    ...s,
    currentBlock: {
      ...s.currentBlock!,
      collided: collisionCondition,
    },
    blocks: collisionCondition
      ? [...s.blocks, ...s.currentBlock!.cells] // add current block into the blocks array
      : s.blocks,
    seed: collisionCondition ? RNG.hash(s.seed) : s.seed, // rehash seed if collision
    canHoldAgain: collisionCondition ? true : s.canHoldAgain, // allow player to hold block again
  };
};

/**
 * Given the current state, check if the current block makes a line, then add blocks into
 * the clearedBlocks array if there is a line
 * @param state
 * @returns a new state with updated values if there is a line clear
 */
const lineClearCheck = (state: State): State => {
  const block = state.currentBlock;

  // if block doesn't exist and block not colliding then return original state
  if (!block?.collided) return { ...state, changeInLevel: false };

  // check each of the cell in the block if there are 10 blocks in the same y position
  const tetroBlockMakingLine = block.cells.filter(
    ({ y }) =>
      state.blocks.filter(({ y: yVal }) => yVal === y).length ===
      Constants.GRID_WIDTH
  );

  // after getting the blocks that make the lines, only take the unique y values block
  const blockMakingFullLine = tetroBlockMakingLine.reduce(
    (acc: ReadonlyArray<Cell>, cell: Cell) => {
      return acc.filter(({ y }) => y === cell.y).length > 0
        ? acc
        : [...acc, cell];
    },
    []
  );

  // Get all the blocks that make the full line
  const AllBlockInFullLine = state.blocks.filter(
    ({ y }) =>
      blockMakingFullLine.filter(({ y: yVal }) => y === yVal).length > 0
  );

  // if there is no block making full line then dont change anything to the state
  if (AllBlockInFullLine.length === 0)
    return { ...state, changeInLevel: false };

  // get all the blocks above the line clear blocks
  const blocksAbove = state.blocks
    .filter(
      ({ y }) =>
        blockMakingFullLine.filter(({ y: yval }) => y < yval).length > 0
    )
    .reduce((acc: ReadonlyArray<Cell>, block: Cell) => {
      // check if the block above is going to get cleared, if so then dont take it
      const isBlockGettingCleared =
        blockMakingFullLine.filter(({ y }) => y === block.y).length > 0;
      return isBlockGettingCleared ? [...acc] : [...acc, block];
    }, [])
    .map((block) => {
      // get the number of lines getting cleared that is below the above block
      const lineClearNoBelow = blockMakingFullLine.filter(
        ({ y }) => block.y < y
      ).length;
      return {
        ...block,
        // update y value based on the number of blocks required to go down
        y: block.y + lineClearNoBelow * Block.HEIGHT,
      };
    });

  const blocksBelow = state.blocks
    .filter(
      // get all blocks that are below line clear
      ({ y }) =>
        blockMakingFullLine.filter(({ y: yval }) => y > yval).length > 0
    )
    .reduce(
      // check if the blocks below are the blocks being cleared or if they are already in blocksAbove array
      (acc: ReadonlyArray<Cell>, block: Cell) => {
        const isBlockGettingCleared =
          blockMakingFullLine.filter(({ y }) => y === block.y).length > 0;
        const isBlockInBlocksAbove =
          blocksAbove.filter(({ id }) => block.id === id).length > 0;
        return isBlockGettingCleared || isBlockInBlocksAbove
          ? [...acc]
          : [...acc, block];
      },
      []
    );

  const noOfLinesCleared = AllBlockInFullLine.length / Constants.GRID_WIDTH;
  const points = state.points + noOfLinesCleared * 100;
  // calculate the level and check if the level is being changed
  const level = Math.floor((state.lineClears + noOfLinesCleared) / 10);
  const changeInLevel = state.level !== level;
  return {
    ...state,
    blocks: [...blocksAbove, ...blocksBelow],
    lineClears: state.lineClears + noOfLinesCleared,
    points,
    clearedBlocks: AllBlockInFullLine,
    highscore: state.highscore < points ? points : state.highscore,
    level,
    changeInLevel,
  };
};

/**
 * Create block with the given arguments
 * @param x
 * @param y
 * @param blockId
 * @param color
 * @returns a Cell for the tetromino
 */
const createBlock = (
  x: number,
  y: number,
  blockId: string,
  color: string
): Cell => ({
  x,
  y,
  width: Block.WIDTH,
  height: Block.HEIGHT,
  id: blockId,
  color,
});
