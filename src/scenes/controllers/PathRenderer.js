import { PATH_WIDTH } from '../../config/grid.js';

// Pure rendering: draws the brick-road path once. No state beyond the
// waypoints it was given.
export default class PathRenderer {
  constructor(scene, pathPoints) {
    this.scene = scene;
    this.pathPoints = pathPoints;
  }

  draw() {
    const graphics = this.scene.add.graphics();

    this.drawPathShadow(graphics);

    // Mortar edge, peeking out from behind the brick surface.
    graphics.lineStyle(PATH_WIDTH + 8, 0x3a2e28, 1);
    this.strokePathLine(graphics);

    // Warm rim catching the light at the road's edges — also shows through
    // the gaps between individual bricks below.
    graphics.lineStyle(PATH_WIDTH + 2, 0xc98f68, 0.35);
    this.strokePathLine(graphics);

    this.drawBrickSurface(graphics);
  }

  drawPathShadow(graphics) {
    graphics.lineStyle(PATH_WIDTH + 12, 0x000000, 0.3);
    graphics.beginPath();
    graphics.moveTo(this.pathPoints[0].x + 8, this.pathPoints[0].y + 10);
    for (let i = 1; i < this.pathPoints.length; i++) {
      graphics.lineTo(this.pathPoints[i].x + 8, this.pathPoints[i].y + 10);
    }
    graphics.strokePath();
  }

  strokePathLine(graphics) {
    graphics.beginPath();
    graphics.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
    for (let i = 1; i < this.pathPoints.length; i++) {
      graphics.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
    }
    graphics.strokePath();
  }

  // Individual brick fills (varied tones, each with a light/dark bevel edge
  // for an embossed look) with small mortar gaps between them, light grit
  // speckle, and a lengthwise seam suggesting two rows of bricks.
  drawBrickSurface(graphics) {
    const BRICK_LENGTH = 52;
    const BRICK_GAP = 4;
    const brickHalfWidth = PATH_WIDTH / 2 - 2;
    const shades = [0x9c5f3f, 0x8a5136, 0x976049, 0xa66a45, 0x8f5940];
    let brickIndex = 0;

    const drawBrick = (startX, startY, endX, endY, perpX, perpY) => {
      const p1 = { x: startX + perpX, y: startY + perpY };
      const p2 = { x: endX + perpX, y: endY + perpY };
      const p3 = { x: endX - perpX, y: endY - perpY };
      const p4 = { x: startX - perpX, y: startY - perpY };

      graphics.fillStyle(shades[brickIndex % shades.length], 1);
      graphics.fillPoints([p1, p2, p3, p4], true);
      brickIndex++;

      // Embossed bevel: a lit edge on one long side, a shaded edge on the
      // other, so each brick reads as slightly raised.
      graphics.lineStyle(2, 0xffffff, 0.12);
      graphics.lineBetween(p1.x, p1.y, p2.x, p2.y);
      graphics.lineStyle(2, 0x000000, 0.18);
      graphics.lineBetween(p3.x, p3.y, p4.x, p4.y);
    };

    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const a = this.pathPoints[i];
      const b = this.pathPoints[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy);
      const dirX = dx / length;
      const dirY = dy / length;
      const perpX = -dirY * brickHalfWidth;
      const perpY = dirX * brickHalfWidth;

      for (let t = 0; t < length; t += BRICK_LENGTH) {
        const segStart = t;
        const segEnd = Math.min(t + BRICK_LENGTH - BRICK_GAP, length);
        drawBrick(
          a.x + dirX * segStart,
          a.y + dirY * segStart,
          a.x + dirX * segEnd,
          a.y + dirY * segEnd,
          perpX,
          perpY
        );
      }
    }

    this.drawPathSpeckle(graphics);

    graphics.lineStyle(2, 0x5c3d2e, 0.35);
    this.strokePathLine(graphics);
  }

  // Scattered dark specks for a bit of worn grit/texture on the road.
  drawPathSpeckle(graphics) {
    const rng = new Phaser.Math.RandomDataGenerator(['brick-speckle']);

    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const a = this.pathPoints[i];
      const b = this.pathPoints[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const length = Math.hypot(dx, dy);
      const dirX = dx / length;
      const dirY = dy / length;
      const perpX = -dirY;
      const perpY = dirX;
      const speckleCount = Math.floor(length / 30);

      for (let s = 0; s < speckleCount; s++) {
        const t = rng.between(0, length);
        const offset = rng.realInRange(-(PATH_WIDTH / 2 - 6), PATH_WIDTH / 2 - 6);
        const px = a.x + dirX * t + perpX * offset;
        const py = a.y + dirY * t + perpY * offset;
        graphics.fillStyle(0x000000, 0.08);
        graphics.fillCircle(px, py, rng.between(2, 4));
      }
    }
  }
}
