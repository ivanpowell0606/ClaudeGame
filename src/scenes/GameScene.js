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
const NUDGE_FACTOR = 0.25;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.pathPoints = ENEMY_PATH_TILES.map(tileToWorld);
    this.turrets = [];
    this.bullets = [];
    this.enemy = null;
    this.waveActive = false;
    this.dragPreview = null;
    this.dragValid = false;
    this.dragPoint = null;
    this.nudgeActive = false;
    this.lastNudgePoint = null;
    this.drawPath();

    setGameScene(this);

    // Re-grabbing an already-placed turret (valid or stuck in an invalid
    // spot) reuses the same preview mechanic as a fresh menu drag.
    this.input.on('dragstart', (pointer, gameObject) => {
      if (!(gameObject instanceof Turret)) return;
      const index = this.turrets.indexOf(gameObject);
      if (index === -1) return;
      this.turrets.splice(index, 1);
      gameObject.alpha = 0.6;
      this.dragPreview = gameObject;
      this.applyDragPreviewAt(pointer.x, pointer.y);
    });

    this.input.on('drag', (pointer, gameObject) => {
      if (this.dragPreview !== gameObject) return;
      this.applyDragPreviewAt(pointer.x, pointer.y);
    });

    this.input.on('dragend', (pointer, gameObject) => {
      if (this.dragPreview !== gameObject) return;
      this.confirmDrop();
    });

    // Dragging on empty canvas nudges any turret currently stuck in an
    // invalid spot, in case it's awkward to grab directly.
    this.input.on('pointerdown', (pointer) => {
      if (this.dragPreview) return;
      const overTurret = this.turrets.some(
        (turret) => Phaser.Math.Distance.Between(pointer.x, pointer.y, turret.x, turret.y) <= TURRET_RADIUS
      );
      if (overTurret) return;
      if (!this.turrets.some((turret) => !turret.isValid)) return;

      this.nudgeActive = true;
      this.lastNudgePoint = { x: pointer.x, y: pointer.y };
    });

    this.input.on('pointermove', (pointer) => {
      if (!this.nudgeActive) return;

      const dx = (pointer.x - this.lastNudgePoint.x) * NUDGE_FACTOR;
      const dy = (pointer.y - this.lastNudgePoint.y) * NUDGE_FACTOR;
      this.lastNudgePoint = { x: pointer.x, y: pointer.y };

      this.turrets.forEach((turret) => {
        if (turret.isValid) return;
        turret.setPosition(turret.x + dx, turret.y + dy);
        // Tint-only preview while dragging — doesn't activate the turret
        // until the pointer is released.
        const wouldBeValid = !this.isOnPath(turret.x, turret.y) && !this.overlapsTurret(turret.x, turret.y, turret);
        turret.setValid(wouldBeValid);
      });
    });

    this.input.on('pointerup', () => {
      if (this.nudgeActive) {
        this.turrets.forEach((turret) => {
          if (turret.isValid) return;
          const finalValid = !this.isOnPath(turret.x, turret.y) && !this.overlapsTurret(turret.x, turret.y, turret);
          turret.finalizePlacement(finalValid);
        });
      }
      this.nudgeActive = false;
      this.lastNudgePoint = null;
    });
  }

  // --- Wave control, driven by the Start Wave button ---

  isWaveActive() {
    return this.waveActive;
  }

  startWave() {
    if (this.waveActive) return;
    this.waveActive = true;
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

    this.applyDragPreviewAt(point.x, point.y);
  }

  applyDragPreviewAt(x, y) {
    this.dragValid = !this.isOnPath(x, y) && !this.overlapsTurret(x, y, this.dragPreview);
    this.dragPoint = { x, y };
    this.dragPreview.setVisible(true);
    this.dragPreview.setPosition(x, y);
    this.dragPreview.setValid(this.dragValid);
  }

  // Places the dragged turret wherever it's released, valid or not — an
  // invalid drop leaves it there (tinted red) instead of vanishing, so it
  // can be picked back up and repositioned.
  confirmDrop() {
    if (this.dragPreview && this.dragPoint) {
      const turret = this.dragPreview;
      turret.alpha = 1;
      turret.finalizePlacement(this.dragValid);
      this.turrets.push(turret);
      this.dragPreview = null;
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

      if (this.enemy.reachedEnd) {
        this.enemy.destroy();
        this.enemy = null;
        this.waveActive = false;
      }
    }

    if (this.enemy) {
      this.turrets.forEach((turret) => {
        if (!turret.isValid) return;

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
            this.waveActive = false;
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

  overlapsTurret(x, y, exclude = null) {
    const threshold = TURRET_RADIUS * 2;
    return this.turrets.some(
      (turret) =>
        turret !== exclude && Phaser.Math.Distance.Between(x, y, turret.x, turret.y) < threshold
    );
  }
}
