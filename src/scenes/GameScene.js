import {
  ENEMY_PATH_TILES,
  PATH_WIDTH,
  tileToWorld,
} from '../config/grid.js';
import Turret, { TURRET_RADIUS } from '../entities/Turret.js';
import Enemy, { ENEMY_RADIUS } from '../entities/Enemy.js';
import Bullet, { BULLET_RADIUS, BULLET_DAMAGE } from '../entities/Bullet.js';
import { distanceToSegment } from '../utils/geometry.js';
import { setGameScene } from '../ui/gameSceneRef.js';

const HIT_DISTANCE = ENEMY_RADIUS + BULLET_RADIUS;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.pathPoints = ENEMY_PATH_TILES.map(tileToWorld);
    this.turrets = [];
    this.bullets = [];
    this.dragPreview = null;
    this.dragValid = false;
    this.dragPoint = null;
    this.drawPath();

    setGameScene(this);

    // Test wave: a single enemy walking the path.
    this.enemy = new Enemy(this, this.pathPoints);
  }

  // --- Drag-and-drop placement, driven by the HTML tower menu ---

  startDragPreview() {
    this.dragPreview = new Turret(this, -1000, -1000);
    this.dragPreview.alpha = 0.6;
    this.dragPreview.setVisible(false);
  }

  updateDragPreview(clientX, clientY) {
    if (!this.dragPreview) return;

    const point = this.canvasPointFromClient(clientX, clientY);
    if (!point) {
      this.dragPreview.setVisible(false);
      this.dragValid = false;
      this.dragPoint = null;
      return;
    }

    this.dragValid = !this.isOnPath(point.x, point.y) && !this.overlapsTurret(point.x, point.y);
    this.dragPoint = point;
    this.dragPreview.setVisible(true);
    this.dragPreview.setPosition(point.x, point.y);
    this.dragPreview.setValid(this.dragValid);
  }

  confirmDrop() {
    if (this.dragValid && this.dragPoint) {
      this.turrets.push(new Turret(this, this.dragPoint.x, this.dragPoint.y));
    }
    this.cancelDrag();
  }

  cancelDrag() {
    if (this.dragPreview) {
      this.dragPreview.destroy();
      this.dragPreview = null;
    }
    this.dragValid = false;
    this.dragPoint = null;
  }

  canvasPointFromClient(clientX, clientY) {
    const rect = this.game.canvas.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return null;
    }

    const scaleX = this.game.canvas.width / rect.width;
    const scaleY = this.game.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  }

  update(time, delta) {
    if (this.enemy) {
      this.enemy.update(delta);

      this.turrets.forEach((turret) => {
        const inRange = turret.trackTarget(this.enemy, this.enemy.getVelocity());
        if (inRange && turret.canFire(time)) {
          turret.markFired(time);
          const tip = turret.getBarrelTip();
          const aim = turret.aimPoint;
          const angle = Phaser.Math.Angle.Between(tip.x, tip.y, aim.x, aim.y);
          this.bullets.push(new Bullet(this, tip.x, tip.y, angle));
        }
      });
    }

    this.bullets = this.bullets.filter((bullet) => {
      bullet.update(delta);

      if (this.enemy) {
        const distance = Phaser.Math.Distance.Between(bullet.x, bullet.y, this.enemy.x, this.enemy.y);
        if (distance <= HIT_DISTANCE) {
          const killed = this.enemy.takeDamage(BULLET_DAMAGE);
          bullet.destroy();
          if (killed) {
            this.enemy.destroy();
            this.enemy = null;
          }
          return false;
        }
      }

      if (bullet.expired) {
        bullet.destroy();
        return false;
      }
      return true;
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
