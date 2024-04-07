/**
 * State processing
 */

import {
  RNG,
  boundaryX,
  boundaryY,
  hasBlocksAround,
  hasBoundaryAround,
  lineClearCheck,
  createBlock,
  collisionDetection,
} from "./util";
import { State, Action, Tetro, Cell } from "./type";
import {
  Viewport,
  Block,
  TetroColorMap,
  TetroShapes,
  TetroStartPosMap,
  PieceWallKickMap,
} from "./constants";
export { initialState, Move, Tick, Hold, Drop, Collision, Rotate };

// initialSeed set to the hash of the current time
const initialSeed = RNG.hash(new Date().getTime());

// generate the initial state for the game
const initialState: State = {
  blocks: [],
  blockCount: 0,
  lineClears: 0,
  level: 0,
  points: 0,
  highscore: 0,
  clearedBlocks: [],
  gameEnd: false,
  seed: initialSeed,
  canHoldAgain: true,
  changeInLevel: false,
} as const;

/**
 * Move class that move the tetrominoes in x or y direction
 */
class Move implements Action {
  constructor(
    public readonly direction: "x" | "y",
    public readonly offset: number
  ) {}
  /**
   * move the block in a certain direction by an offset and check if it is bounded
   * by any blocks or boundary
   * @param s current state
   * @returns modified state
   */
  perform(s: State): State {
    if (!s.currentBlock) return s;
    const updatedCells =
      this.direction === "x"
        ? boundaryX(s.currentBlock.cells, s, this.offset)
        : boundaryY(s.currentBlock.cells, s, this.offset);

    return {
      ...s,
      currentBlock: {
        ...s.currentBlock,
        cells: updatedCells,
        originBlock: updatedCells[1],
      },
    };
  }
}

/**
 * Class Tick that handles the checking of line clear, creation of block and next block,
 * updating ghost block location,
 */
class Tick implements Action {
  constructor(public readonly time: number) {}
  /**
   * performs line checking, creation and spawning of block and next block, and
   * updating ghost block location
   * @param s current state
   * @returns new modified state
   */
  perform(s: State): State {
    // check line chear
    const state = lineClearCheck(s);

    // create new block or get existing block
    const block =
      !state.currentBlock || state.currentBlock.collided
        ? Tick.createTetrominoes(
            Viewport.CANVAS_WIDTH / 2 - Block.WIDTH,
            Block.HEIGHT,
            state.blockCount,
            state.seed,
            false,
            state
          )
        : state.currentBlock;

    // get all the minimum y location for the current block
    const ghostBlockYLocation = block.cells.map(({ x, y }) => {
      const topYForBlock =
        state.blocks.reduce(
          (acc, { x: xVal, y: yVal }) =>
            x === xVal && yVal < acc && yVal > y ? yVal : acc,
          400
        ) - Block.HEIGHT;

      return topYForBlock;
    });

    // get the minimum Y location out of all the Y locations
    const getMinY = Math.min(...ghostBlockYLocation);

    // get the block index which holds the minimum Y location
    const getIndexOfLocation = ghostBlockYLocation.reduce(
      (acc: ReadonlyArray<number>, val: number, index: number) =>
        val === getMinY ? [...acc, index] : acc,
      []
    );

    // get the lower block based on the index calculated
    const yValueIndex = getIndexOfLocation.reduce(
      (acc, val) =>
        acc[1] > block.cells[val].y ? acc : [val, block.cells[val].y],
      [0, 0]
    );

    // calculate the y offset using the minimum Y value and the lower block y value
    const yOffset = getMinY - block.cells[yValueIndex[0]].y;

    const ghostTetroBlockCount = state.ghostBlock
      ? state.ghostBlock.blockStartCount
      : state.blockCount + 4;

    // create the ghost tetro block
    const ghostTetro = Tick.createTetrominoes(
      0,
      0,
      ghostTetroBlockCount,
      block.seed,
      true,
      state
    );
    // map the each of the ghost blocks with the offsetY value
    const mapGhostTetro = (
      cells: ReadonlyArray<Cell>,
      block: Tetro,
      offset: number
    ): ReadonlyArray<Cell> => {
      return cells.map((cell, index) => ({
        ...cell,
        x: block.cells[index].x,
        y: block.cells[index].y + offset,
        color: "grey",
      }));
    };
    // create cells for ghost block
    const ghostCells = mapGhostTetro(ghostTetro.cells, block, yOffset);

    // create ghost block
    const ghostBlock = {
      ...ghostTetro,
      cells:
        hasBlocksAround(ghostCells, s, 0, "x") ||
        hasBoundaryAround(ghostCells, s, 0, "y")
          ? mapGhostTetro(ghostCells, block, yOffset - Block.HEIGHT) // if colliding then move cells up
          : ghostCells,
    };

    // check if the current spawning block is spawning on other blocks, if yes then game over
    const isBlockSpawningOnOtherBlocks =
      block.cells.filter(
        ({ x, y }) =>
          state.blocks.filter(
            ({ x: xVal, y: yVal }) => x === xVal && y === yVal
          ).length > 0
      ).length > 0;

    // create preview block
    const nextTetroBlockCount = state.ghostBlock
      ? state.blockCount + 4
      : state.blockCount + 8;
    const nextBlock =
      !state.nextBlock || state.currentBlock!.collided
        ? Tick.createTetrominoes(
            Viewport.PREVIEW_WIDTH / 2,
            Viewport.PREVIEW_HEIGHT / 2,
            nextTetroBlockCount,
            RNG.hash(state.seed),
            true,
            state
          )
        : state.nextBlock;

    // update blockCount
    const blockCount =
      !state.currentBlock || state.currentBlock.collided
        ? state.ghostBlock
          ? state.blockCount + 4
          : state.blockCount + 8
        : state.blockCount;

    return {
      ...state,
      currentBlock: block,
      nextBlock,
      ghostBlock,
      blockCount,
      gameEnd: isBlockSpawningOnOtherBlocks,
    };
  }

  /**
   * create the tetrominoes with the given arguments
   * @param x
   * @param y
   * @param blockCount
   * @param seed
   * @param isPreview
   * @param state
   * @returns a tetromino with all the values
   */
  static createTetrominoes(
    x: number,
    y: number,
    blockCount: number,
    seed: number,
    isPreview: boolean,
    state: State
  ): Tetro {
    // scale the seed and get tetro information
    const randomNumber = RNG.scale(seed);
    const chosenShape = TetroShapes[randomNumber];

    const shapeMap = TetroStartPosMap[chosenShape][0];
    const tetroColor = TetroColorMap[chosenShape];
    const startPosX = x;

    //check if any of the blocks is occupying the spawning block position
    const checkValidBlockSpawn =
      shapeMap.filter(({ x, y }) => {
        const posX = startPosX + x * Block.WIDTH;
        const posY = Block.HEIGHT + y * Block.HEIGHT;
        // check if no blocks occupying block spawn position
        return (
          state.blocks.filter(
            ({ x: otherX, y: otherY }) => posX === otherX && posY === otherY
          ).length === 0
        );
      }).length === 4;

    const startPosY = checkValidBlockSpawn || isPreview ? y : 0;

    // based on tetro map create the block shape
    const tetro = shapeMap.map(({ x, y }, index) =>
      createBlock(
        startPosX + x * Block.WIDTH,
        startPosY + y * Block.HEIGHT,
        "block " + (blockCount + index),
        tetroColor
      )
    );

    // get the origin block
    const [findPivot] = tetro.filter(
      ({ x, y }) => x == startPosX && y == startPosY
    );

    return {
      cells: tetro,
      originBlock: findPivot,
      collided: false,
      rotation: 0,
      shape: chosenShape,
      seed,
      blockStartCount: blockCount,
    };
  }
}

// checks block collision and change state
class Collision implements Action {
  perform(s: State): State {
    return collisionDetection(s);
  }
}

// performs all the rotation logic and returns a new state with the rotated block
class Rotate implements Action {
  /**
   * Calculate the rotation and apply wall kick if necessary then return a new
   * state with rotated block
   * @param s
   * @returns
   */
  perform(s: State) {
    if (!s.currentBlock) return s;

    // get the next rotation count, reset value to 0 if necessary
    const currentRotation =
      (s.currentBlock.rotation + 1) %
      TetroStartPosMap[s.currentBlock.shape].length;

    const getRotationMap =
      TetroStartPosMap[s.currentBlock.shape][currentRotation];

    const centralRotationBlock = s.currentBlock.originBlock;

    const getPreviousRotationBlock =
      TetroStartPosMap[s.currentBlock.shape][s.currentBlock.rotation];

    // get the offset value relative to the origin block
    const relativeToOriginXOffset = 0 - getPreviousRotationBlock[1].x;
    const relativeToOriginYOffset = 0 - getPreviousRotationBlock[1].y;

    // based on mapping, generate the position for rotated blocks
    const blockAfterRotation = s.currentBlock.cells.map(
      ({ id, color }, index) => {
        const blockRotation = getRotationMap[index];
        const newPosX =
          centralRotationBlock.x +
          (blockRotation.x + relativeToOriginXOffset) * Block.WIDTH;
        const newPosY =
          centralRotationBlock.y +
          (blockRotation.y + relativeToOriginYOffset) * Block.HEIGHT;

        return createBlock(newPosX, newPosY, id, color);
      }
    );

    // check if any blocks are colliding with something
    const checkAllCollision = (cells: ReadonlyArray<Cell>): boolean => {
      return (
        hasBlocksAround(cells, s, 0, "x") ||
        hasBoundaryAround(cells, s, 0, "x") ||
        hasBoundaryAround(cells, s, 0, "y")
      );
    };

    const rotatedBlockHasCollision = checkAllCollision(blockAfterRotation);
    // if no collision then allow rotation
    if (!rotatedBlockHasCollision) {
      return {
        ...s,
        currentBlock: {
          ...s.currentBlock,
          rotation: currentRotation,
          cells: blockAfterRotation,
          originBlock: blockAfterRotation[1],
        },
      };
    }

    // if collision occur then check all wall kick tests
    const allWallKickPossibility = PieceWallKickMap[s.currentBlock.shape][
      currentRotation
    ].filter(({ x, y }) => {
      const newOffsetBlock = blockAfterRotation.map((cell) => ({
        ...cell,
        x: cell.x + x * Block.WIDTH,
        y: cell.y + -y * Block.HEIGHT,
      }));
      return !checkAllCollision(newOffsetBlock);
    });

    // if no wall kick possibility then dont rotate
    if (allWallKickPossibility.length === 0) return s;

    const getFirstPossibleWallKick = allWallKickPossibility[0];

    // get first wall kick possibility then map the rotated block with the wall kick x and y offset
    const blockAfterWallKick = blockAfterRotation.map((cell) => ({
      ...cell,
      x: cell.x + getFirstPossibleWallKick.x * Block.WIDTH,
      y: cell.y + -getFirstPossibleWallKick.y * Block.HEIGHT,
    }));

    return {
      ...s,
      currentBlock: {
        ...s.currentBlock,
        rotation: currentRotation,
        cells: blockAfterWallKick,
        originBlock: blockAfterWallKick[1],
      },
    };
  }
}

// perform hold to hold blocks and generate a new block or get previous held block
class Hold implements Action {
  perform(s: State): State {
    if (!s.currentBlock || s.currentBlock.collided || !s.canHoldAgain) return s;

    /**
     * if held block is empty, set current block to next block
     * else set current block to held block
     */

    const currentBlock = s.heldBlock
      ? Tick.createTetrominoes(
          Viewport.CANVAS_WIDTH / 2 - Block.WIDTH,
          Block.HEIGHT,
          s.heldBlock.blockStartCount,
          s.heldBlock.seed,
          false,
          s
        )
      : Tick.createTetrominoes(
          Viewport.CANVAS_WIDTH / 2 - Block.WIDTH,
          Block.HEIGHT,
          s.nextBlock!.blockStartCount,
          s.nextBlock!.seed,
          false,
          s
        );
    // if held block is empty, then create a new next block
    const nextBlock = s.heldBlock
      ? s.nextBlock
      : Tick.createTetrominoes(
          Viewport.PREVIEW_WIDTH / 2,
          Viewport.PREVIEW_HEIGHT / 2,
          s.blockCount + 4,
          RNG.hash(RNG.hash(s.seed)),
          true,
          s
        );

    // generate a held block with the current block info
    const heldBlock = Tick.createTetrominoes(
      Viewport.PREVIEW_WIDTH / 2,
      Viewport.PREVIEW_HEIGHT / 2,
      s.currentBlock.blockStartCount,
      s.currentBlock.seed,
      true,
      s
    );

    return {
      ...s,
      currentBlock,
      nextBlock,
      heldBlock,
      blockCount: s.heldBlock ? s.blockCount : s.blockCount + 4,
      seed: s.heldBlock ? s.seed : RNG.hash(s.seed),
      canHoldAgain: false,
    };
  }
}

// perform an instant drop on the current block to the location of the ghost block
class Drop implements Action {
  /**
   * Instantly drops the current block to the location of the ghost block and set the
   * collided boolean to true and add current block to the blocks array
   * @param s
   * @returns
   */
  perform(s: State): State {
    if (!s.currentBlock || s.currentBlock.collided) return s;
    // set current block x and y to ghost block x and y
    const droppedCell = s.currentBlock.cells.map((cell, index) => ({
      ...cell,
      x: s.ghostBlock!.cells[index].x,
      y: s.ghostBlock!.cells[index].y,
    }));

    return {
      ...s,
      currentBlock: {
        ...s.currentBlock,
        cells: droppedCell,
        collided: true,
      },
      canHoldAgain: true,
      blocks: [...s.blocks, ...droppedCell],
      seed: RNG.hash(s.seed),
    };
  }
}
