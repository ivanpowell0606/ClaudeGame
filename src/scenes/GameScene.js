import {
  TILE_SIZE,
  GRID_COLS,
  GRID_ROWS,
  ENEMY_PATH_TILES,
  tileToWorld,
} from '../config/grid.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.drawGrid();
    this.drawPath();
  }

  drawGrid() {
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 1);

    for (let col = 0; col <= GRID_COLS; col++) {
      const x = col * TILE_SIZE;
      graphics.lineBetween(x, 0, x, GRID_ROWS * TILE_SIZE);
    }
    for (let row = 0; row <= GRID_ROWS; row++) {
      const y = row * TILE_SIZE;
      graphics.lineBetween(0, y, GRID_COLS * TILE_SIZE, y);
    }
  }

  drawPath() {
    const graphics = this.add.graphics();
    graphics.lineStyle(TILE_SIZE * 0.6, 0x4a4a2a, 1);

    const points = ENEMY_PATH_TILES.map(tileToWorld);
    graphics.beginPath();
    graphics.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      graphics.lineTo(points[i].x, points[i].y);
    }
    graphics.strokePath();
  }
}
