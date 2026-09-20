import { PATH_WIDTH, GAME_WIDTH, tileToWorld } from '../config/grid.js';
import Turret, { TURRET_RADIUS } from '../entities/Turret.js';
import Enemy, { ENEMY_RADIUS } from '../entities/Enemy.js';
import Bullet, { BULLET_RADIUS, BULLET_DAMAGE } from '../entities/Bullet.js';
import { distanceToSegment } from '../utils/geometry.js';
import { setGameScene } from '../ui/gameSceneRef.js';
import { openUpgradeMenu } from '../ui/upgradeMenu.js';
import { STARTING_CASH, TURRET_COST, ENEMY_REWARD } from '../config/economy.js';

const HIT_DISTANCE = ENEMY_RADIUS + BULLET_RADIUS;
const NUDGE_FACTOR = 0.25;
const CLICK_MOVE_THRESHOLD = 12;

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.area = data.area;
  }

  create() {
    document.getElementById('ui-panel').style.visibility = 'visible';

    this.pathPoints = this.area.pathTiles.map(tileToWorld);
    this.turrets = [];
    this.bullets = [];
    this.enemies = [];
    this.cash = STARTING_CASH;
    this.updateCashDisplay();
    this.waveIndex = 0;
    this.currentWave = null;
    this.waveActive = false;
    this.enemiesSpawned = 0;
    this.spawnTimer = 0;
    this.updateWaveButtonLabel();
    this.dragPreview = null;
    this.dragValid = false;
    this.dragPoint = null;
    this.nudgeActive = false;
    this.lastNudgePoint = null;
    this.pointerDownTurret = null;
    this.pointerDownPos = null;
    this.drawPath();

    setGameScene(this);

    // Require a small movement before Phaser treats a press-and-move on a
    // turret as a drag, so a plain click (below) isn't swallowed as one.
    this.input.dragDistanceThreshold = CLICK_MOVE_THRESHOLD;

    // Re-grabbing an already-placed turret (valid or stuck in an invalid
    // spot) reuses the same preview mechanic as a fresh menu drag.
    this.input.on('dragstart', (pointer, gameObject) => {
      if (!(gameObject instanceof Turret)) return;
      const index = this.turrets.indexOf(gameObject);
      if (index === -1) return;
      this.turrets.splice(index, 1);
      gameObject.alpha = 0.6;
      gameObject.showRange();
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
      const overTurret = this.turrets.find(
        (turret) => Phaser.Math.Distance.Between(pointer.x, pointer.y, turret.x, turret.y) <= TURRET_RADIUS
      );
      if (overTurret) {
        // Might be the start of a click (open the upgrade menu) or a drag
        // (handled by Phaser's own dragstart/drag/dragend above) — decided
        // on release by how far the pointer actually moved.
        this.pointerDownTurret = overTurret;
        this.pointerDownPos = { x: pointer.x, y: pointer.y };
        return;
      }
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
        turret.showRange();
        // Tint-only preview while dragging — doesn't activate the turret
        // until the pointer is released.
        const wouldBeValid = this.isSpotValid(turret.x, turret.y, turret) && this.canAfford(turret);
        turret.setValid(wouldBeValid);
      });
    });

    this.input.on('pointerup', (pointer) => {
      if (this.pointerDownTurret) {
        const moved = Phaser.Math.Distance.Between(
          pointer.x,
          pointer.y,
          this.pointerDownPos.x,
          this.pointerDownPos.y
        );
        if (moved < CLICK_MOVE_THRESHOLD && this.pointerDownTurret.isValid) {
          openUpgradeMenu(this.pointerDownTurret, GAME_WIDTH);
        }
        this.pointerDownTurret = null;
        this.pointerDownPos = null;
      }

      if (this.nudgeActive) {
        this.turrets.forEach((turret) => {
          if (turret.isValid) return;
          const finalValid = this.isSpotValid(turret.x, turret.y, turret) && this.canAfford(turret);
          turret.finalizePlacement(finalValid);
          this.chargeIfNeeded(turret);
          turret.hideRange();
        });
      }
      this.nudgeActive = false;
      this.lastNudgePoint = null;
    });
  }

  // --- Cash economy ---

  updateCashDisplay() {
    document.getElementById('cash-display').textContent = `$${this.cash}`;
  }

  // Already-paid turrets can always afford to move; a fresh one needs
  // enough cash on hand.
  canAfford(turret) {
    return turret.paid || this.cash >= TURRET_COST;
  }

  chargeIfNeeded(turret) {
    if (turret.isValid && !turret.paid) {
      this.cash -= TURRET_COST;
      turret.paid = true;
      this.updateCashDisplay();
    }
  }

  // --- Wave control, driven by the Start Wave button ---

  isWaveActive() {
    return this.waveActive;
  }

  hasMoreWaves() {
    return this.waveIndex < this.area.waves.length;
  }

  updateWaveButtonLabel() {
    const button = document.getElementById('start-wave-button');
    if (this.hasMoreWaves()) {
      button.textContent = `Start ${this.area.waves[this.waveIndex].name}`;
    } else {
      button.textContent = 'All Waves Cleared';
    }
  }

  startWave() {
    if (this.waveActive || !this.hasMoreWaves()) return;
    this.currentWave = this.area.waves[this.waveIndex];
    this.waveActive = true;
    this.enemiesSpawned = 0;
    this.spawnTimer = 0;
  }

  updateSpawning(delta) {
    if (!this.waveActive) return;
    if (this.enemiesSpawned >= this.currentWave.enemyCount) return;

    this.spawnTimer += delta;
    if (this.spawnTimer >= this.currentWave.spawnIntervalMs) {
      this.spawnTimer -= this.currentWave.spawnIntervalMs;
      this.enemies.push(new Enemy(this, this.pathPoints));
      this.enemiesSpawned++;
    }
  }

  // Nearest enemy to a turret is also the one most likely in range, since
  // any farther enemy would be even less likely to be — so this alone
  // decides who a turret aims at.
  findNearestEnemy(turret) {
    let nearest = null;
    let nearestDistance = Infinity;
    this.enemies.forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(turret.x, turret.y, enemy.x, enemy.y);
      if (distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  // --- Drag-and-drop placement, driven by the HTML tower menu ---

  startDragPreview() {
    this.dragPreview = new Turret(this, -1000, -1000);
    this.dragPreview.alpha = 0.6;
    this.dragPreview.showRange();
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
    this.dragValid = this.isSpotValid(x, y, this.dragPreview) && this.canAfford(this.dragPreview);
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
      this.chargeIfNeeded(turret);
      turret.hideRange();
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

  // The canvas is scaled (and, under ENVELOP, cropped) to cover its
  // container while keeping aspect ratio, so raw canvas-rect math no
  // longer maps correctly — the visible/interactive area is the
  // container's bounds, and Phaser's own Scale Manager knows how to
  // translate a page point into game-world coordinates for it.
  canvasPointFromClient(clientX, clientY) {
    const rect = this.game.canvas.parentElement.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return null;
    }

    return {
      x: this.scale.transformX(clientX),
      y: this.scale.transformY(clientY),
    };
  }

  update(time, delta) {
    this.updateSpawning(delta);

    this.enemies.forEach((enemy) => enemy.update(delta));
    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.reachedEnd) {
        enemy.destroy();
        return false;
      }
      return true;
    });

    this.turrets.forEach((turret) => {
      if (!turret.isValid) return;

      const target = this.findNearestEnemy(turret);
      if (!target) return;

      const inRange = turret.trackTarget(target, target.getVelocity());
      if (inRange && turret.canFire(time)) {
        turret.markFired(time);
        const tip = turret.getBarrelTip();
        const aim = turret.aimPoint;
        const angle = Phaser.Math.Angle.Between(tip.x, tip.y, aim.x, aim.y);
        this.bullets.push(new Bullet(this, tip.x, tip.y, angle));
      }
    });

    this.bullets = this.bullets.filter((bullet) => {
      bullet.update(delta);

      const hitEnemy = this.enemies.find(
        (enemy) => Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y) <= HIT_DISTANCE
      );
      if (hitEnemy) {
        const killed = hitEnemy.takeDamage(BULLET_DAMAGE);
        bullet.destroy();
        if (killed) {
          hitEnemy.destroy();
          this.enemies = this.enemies.filter((enemy) => enemy !== hitEnemy);
          this.cash += ENEMY_REWARD;
          this.updateCashDisplay();
        }
        return false;
      }

      if (bullet.expired) {
        bullet.destroy();
        return false;
      }
      return true;
    });

    if (this.waveActive && this.enemiesSpawned >= this.currentWave.enemyCount && this.enemies.length === 0) {
      this.waveActive = false;
      this.waveIndex++;
      this.updateWaveButtonLabel();
    }
  }

  drawPath() {
    const graphics = this.add.graphics();

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
  // for an embossed look) with small mortar gaps between them, keystone
  // patches smoothing the corners, light grit speckle, and a lengthwise
  // seam suggesting two rows of bricks.
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

  isSpotValid(x, y, exclude = null) {
    return !this.isOnPath(x, y) && !this.overlapsTurret(x, y, exclude);
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
