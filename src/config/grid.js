// Shared grid/tile constants. Path layouts live per-area in areas.js.

export const TILE_SIZE = 128;
export const GRID_COLS = 15;
export const GRID_ROWS = 10;

export const GAME_WIDTH = GRID_COLS * TILE_SIZE;
export const GAME_HEIGHT = GRID_ROWS * TILE_SIZE;

export const PATH_WIDTH = TILE_SIZE * 0.6;

export function tileToWorld([col, row]) {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  };
}
