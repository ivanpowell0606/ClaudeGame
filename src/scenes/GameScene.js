import {
  ENEMY_PATH_TILES,
  PATH_WIDTH,
  tileToWorld,
} from '../config/grid.js';
import Turret, { TURRET_RADIUS } from '../entities/Turret.js';
import { distanceToSegment } from '../utils/geometry.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.pathPoints = ENEMY_PATH_TILES.map(tileToWorld);
    this.turrets = [];
    this.drawPath();

    this.input.on('pointerdown', (pointer) => {
      if (this.isOnPath(pointer.x, pointer.y)) return;
      if (this.overlapsTurret(pointer.x, pointer.y)) return;
      this.turrets.push(new Turret(this, pointer.x, pointer.y));
    });
  }

  drawPath() {
    const graphics = this.add.graphics();
    graphics.lineStyle(PATH_WIDTH, 0x4a4a2a, 1);

    graphics.beginPath();
    graphics.moveTo(this.pathPoints[0].x, this.pathPoints[0].y);
    for (let i = 1; i < this.pathPoints.length; i++) {
      graphics.lineTo(this.pathPoints[i].x, this.pathPoints[i].y);
    }
    graphics.strokePath();
  }

  isOnPath(x, y) {
    const threshold = PATH_WIDTH / 2 + TURRET_RADIUS;
    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const distance = distanceToSegment(
        { x, y },
        this.pathPoints[i],
        this.pathPoints[i + 1]
      );
      if (distance < threshold) return true;
    }
    return false;
  }

  overlapsTurret(x, y) {
    const threshold = TURRET_RADIUS * 2;
    return this.turrets.some(
      (turret) => Phaser.Math.Distance.Between(x, y, turret.x, turret.y) < threshold
    );
  }
}
