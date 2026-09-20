// Grid + path definitions. Tile coordinates are [col, row].
// Extend this as levels are added.

export const TILE_SIZE = 64;
export const GRID_COLS = 15;
export const GRID_ROWS = 10;

export const GAME_WIDTH = GRID_COLS * TILE_SIZE;
export const GAME_HEIGHT = GRID_ROWS * TILE_SIZE;

export const PATH_WIDTH = TILE_SIZE * 0.6;

// Path enemies walk along, as a sequence of tile coordinates.
export const ENEMY_PATH_TILES = [
  [0, 4],
  [4, 4],
  [4, 1],
  [10, 1],
  [10, 7],
  [14, 7],
];

export function tileToWorld([col, row]) {
  return {
    x: col * TILE_SIZE + TILE_SIZE / 2,
    y: row * TILE_SIZE + TILE_SIZE / 2,
  };
}
