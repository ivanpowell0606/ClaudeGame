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

    const rangeCircle = scene.add
      .circle(0, 0, TURRET_RANGE, 0x8892a6, 0)
      .setStrokeStyle(1, 0x8892a6, 0.4);

    const base = scene.add.circle(0, 0, TURRET_RADIUS, 0x555b66).setStrokeStyle(3, 0x2c2f36);

    const turretHead = scene.add.circle(0, 0, 14, 0x8892a6).setStrokeStyle(2, 0x2c2f36);
    const barrel = scene.add.rectangle(18, 0, 26, 8, 0x8892a6).setStrokeStyle(2, 0x2c2f36);

    this.gun = scene.add.container(0, 0, [barrel, turretHead]);

    this.add([rangeCircle, base, this.gun]);
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
