// Turret with a rotating gun (head + barrel) on a static base.
// Tracks and fires at the enemy while it's within range, leading the
// shot to compensate for bullet travel time.

import { BULLET_SPEED } from './Bullet.js';
import { calculateInterceptPoint } from '../utils/geometry.js';

export const TURRET_RADIUS = 22;
export const TURRET_RANGE = 160;
export const FIRE_RATE = 500; // ms between shots
const BARREL_TIP_OFFSET = 31;

export default class Turret extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    this.lastFiredAt = -Infinity;
    this.aimPoint = null;
    this.isValid = true;

    this.rangeCircle = scene.add
      .circle(0, 0, TURRET_RANGE, 0x8892a6, 0)
      .setStrokeStyle(1, 0x8892a6, 0.4);

    this.base = scene.add.circle(0, 0, TURRET_RADIUS, 0x555b66).setStrokeStyle(3, 0x2c2f36);

    this.turretHead = scene.add.circle(0, 0, 14, 0x8892a6).setStrokeStyle(2, 0x2c2f36);
    this.barrel = scene.add.rectangle(18, 0, 26, 8, 0x8892a6).setStrokeStyle(2, 0x2c2f36);

    this.gun = scene.add.container(0, 0, [this.barrel, this.turretHead]);

    this.add([this.rangeCircle, this.base, this.gun]);

    this.setInteractive(new Phaser.Geom.Circle(0, 0, TURRET_RADIUS), Phaser.Geom.Circle.Contains);
    scene.input.setDraggable(this);
  }

  // Tints the turret red (invalid) or its normal colors (valid). Used while
  // dragging a placement preview.
  setValid(isValid) {
    const accent = isValid ? 0x8892a6 : 0xd1495b;
    this.base.setFillStyle(isValid ? 0x555b66 : 0x6e2f36);
    this.turretHead.setFillStyle(accent);
    this.barrel.setFillStyle(accent);
    this.rangeCircle.setStrokeStyle(1, accent, isValid ? 0.4 : 0.6);
  }

  // Rotates toward the predicted intercept point if the target is in range.
  // Returns whether it's in range.
  trackTarget(target, targetVelocity) {
    const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    const inRange = distance <= TURRET_RANGE;

    if (inRange) {
      this.aimPoint =
        calculateInterceptPoint(this, target, targetVelocity, BULLET_SPEED) || target;
      this.gun.rotation = Phaser.Math.Angle.Between(this.x, this.y, this.aimPoint.x, this.aimPoint.y);
    }

    return inRange;
  }

  canFire(time) {
    return time - this.lastFiredAt >= FIRE_RATE;
  }

  markFired(time) {
    this.lastFiredAt = time;
  }

  getBarrelTip() {
    const tip = new Phaser.Math.Vector2(BARREL_TIP_OFFSET, 0).rotate(this.gun.rotation);
    return { x: this.x + tip.x, y: this.y + tip.y };
  }
}
