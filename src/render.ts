/** Rendering (side effects) */

export {
  show,
  hide,
  createSvgElement,
  render,
  gameover,
  clearBlocks,
  svg,
  preview,
  holdView,
};

import { State, Cell } from "./type";
import { Viewport } from "./constants";

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGGraphicsElement) => {
  elem.setAttribute("visibility", "visible");
  elem.parentNode!.appendChild(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGGraphicsElement) =>
  elem.setAttribute("visibility", "hidden");

/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
  namespace: string | null,
  name: string,
  props: Record<string, string> = {}
) => {
  const elem = document.createElementNS(namespace, name) as SVGElement;
  Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
  return elem;
};

const svg = document.querySelector("#svgCanvas") as SVGGraphicsElement &
  HTMLElement;
const preview = document.querySelector("#svgPreview") as SVGGraphicsElement &
  HTMLElement;
const gameover = document.querySelector("#gameOver") as SVGGraphicsElement &
  HTMLElement;
const container = document.querySelector("#main") as HTMLElement;
const holdView = document.querySelector("#svgHold") as SVGGraphicsElement &
  HTMLElement;
svg.setAttribute("height", `${Viewport.CANVAS_HEIGHT}`);
svg.setAttribute("width", `${Viewport.CANVAS_WIDTH}`);
preview.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
preview.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);
holdView.setAttribute("height", `${Viewport.PREVIEW_HEIGHT}`);
holdView.setAttribute("width", `${Viewport.PREVIEW_WIDTH}`);

// Text fields
const lineText = document.querySelector("#lineText") as HTMLElement;
const levelText = document.querySelector("#levelText") as HTMLElement;
const scoreText = document.querySelector("#scoreText") as HTMLElement;
const highScoreText = document.querySelector("#highScoreText") as HTMLElement;

/**
 * Renders the current state to the canvas.
 *
 * In MVC terms, this updates the View using the Model.
 *
 * @param s Current state
 */
const render = (s: State) => {
  if (!s.currentBlock) return;
  const updateCubeView = (rootSVG: HTMLElement) => (block: Cell) => {
    function createCubeView() {
      const cube = createSvgElement(rootSVG.namespaceURI, "rect", {
        height: `${block.height}`,
        width: `${block.width}`,
        x: String(block.x),
        y: String(block.y),
        style: `fill: ${block.color}`,
      });
      rootSVG.appendChild(cube);
      cube.setAttribute("id", block.id);

      return cube;
    }
    const cube = document.getElementById(block.id) || createCubeView();

    cube.setAttribute("x", String(block.x));
    cube.setAttribute("y", String(block.y));
  };

  const deleteBlocksElem = (
    block: Cell,
    svg: SVGGraphicsElement & HTMLElement
  ) => {
    const blockElem = document.getElementById(block.id);
    if (blockElem?.parentNode === svg) svg.removeChild(blockElem);
  };

  s.currentBlock.cells.forEach((cell) => {
    deleteBlocksElem(cell, preview);
    deleteBlocksElem(cell, holdView);
  });

  s.heldBlock?.cells.forEach((cell) => deleteBlocksElem(cell, svg));
  s.ghostBlock?.cells.forEach(updateCubeView(svg));
  s.currentBlock.cells.forEach(updateCubeView(svg));

  s.nextBlock!.cells.forEach(updateCubeView(preview));
  s.heldBlock?.cells.forEach(updateCubeView(holdView));

  s.blocks.forEach(updateCubeView(svg));

  clearBlocks(s.clearedBlocks, svg);

  levelText.innerHTML = String(s.level);
  scoreText.innerHTML = String(s.points);
  highScoreText.innerHTML = String(s.highscore);
  lineText.innerHTML = String(s.lineClears);
};

function clearBlocks(
  cells: ReadonlyArray<Cell> | undefined,
  rootSVG: SVGGraphicsElement & HTMLElement
) {
  if (!cells) return;
  cells
    .map((o) => document.getElementById(o.id))
    .filter((elem) => elem)
    .forEach((elem) => {
      try {
        rootSVG.removeChild(elem!);
      } catch (error) {}
    });
}
