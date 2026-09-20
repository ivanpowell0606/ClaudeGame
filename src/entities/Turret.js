// Turret with a rotating gun (head + barrel) on a static base.
// Tracks and fires at the enemy while it's within range, leading the
// shot to compensate for bullet travel time.

import { BULLET_SPEED } from './Bullet.js';
import { calculateInterceptPoint } from '../utils/geometry.js';

export const TURRET_RADIUS = 22;
export const TURRET_RANGE = 160;
export const FIRE_RATE = 500; // ms between shots
const BARREL_LENGTH = 26;
const BARREL_WIDTH = 9;
const BARREL_X = BARREL_LENGTH / 2 + 5;
const BARREL_TIP_OFFSET = BARREL_X + BARREL_LENGTH / 2;
const HEAD_RADIUS = 14;

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

    // Ground shadow for a bit of lift off the field.
    const shadow = scene.add.ellipse(3, 5, TURRET_RADIUS * 2.1, TURRET_RADIUS * 1.3, 0x000000, 0.35);

    // Base plate: dark rim, shaded disc, soft highlight, rivets.
    this.base = scene.add.circle(0, 0, TURRET_RADIUS, 0x4b515c).setStrokeStyle(3, 0x22252b);
    const baseInner = scene.add.circle(0, 0, TURRET_RADIUS - 6, 0x5c6472, 0.9);
    const baseHighlight = scene.add.circle(-6, -7, TURRET_RADIUS - 13, 0xffffff, 0.08);

    const bolts = [];
    const boltRadius = TURRET_RADIUS - 4;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i;
      bolts.push(
        scene.add.circle(Math.cos(angle) * boltRadius, Math.sin(angle) * boltRadius, 2, 0x24262c)
      );
    }

    // Turret head with a specular highlight.
    this.turretHead = scene.add.circle(0, 0, HEAD_RADIUS, 0x8892a6).setStrokeStyle(2, 0x2c2f36);
    const headHighlight = scene.add.circle(-4, -5, 5, 0xffffff, 0.35);

    // Barrel: lighter top edge for a cylindrical look, dark muzzle cap.
    this.barrel = scene.add
      .rectangle(BARREL_X, 0, BARREL_LENGTH, BARREL_WIDTH, 0x8892a6)
      .setStrokeStyle(2, 0x2c2f36);
    const barrelShine = scene.add.rectangle(BARREL_X, -BARREL_WIDTH / 4, BARREL_LENGTH - 4, 2, 0xffffff, 0.25);
    const muzzle = scene.add
      .rectangle(BARREL_TIP_OFFSET, 0, 4, BARREL_WIDTH + 2, 0x2c2f36)
      .setStrokeStyle(1, 0x1a1c20);

    this.gun = scene.add.container(0, 0, [this.barrel, barrelShine, muzzle, this.turretHead, headHighlight]);

    this.add([this.rangeCircle, shadow, this.base, baseInner, baseHighlight, ...bolts, this.gun]);

    this.setInteractive(new Phaser.Geom.Circle(0, 0, TURRET_RADIUS), Phaser.Geom.Circle.Contains);
    scene.input.setDraggable(this);
  }

  // Tints the turret red (invalid) or its normal colors (valid). Used while
  // dragging a placement preview.
  setValid(isValid) {
    const accent = isValid ? 0x8892a6 : 0xd1495b;
    this.base.setFillStyle(isValid ? 0x4b515c : 0x6e2f36);
    this.turretHead.setFillStyle(accent);
    this.barrel.setFillStyle(accent);
    this.rangeCircle.setStrokeStyle(1, accent, isValid ? 0.4 : 0.6);
  }

  // Called once on release (drag/drop or nudge end), never mid-drag, so a
  // turret only goes active — and only locks in place — once the player
  // actually lets go of it.
  finalizePlacement(isValid) {
    this.isValid = isValid;
    this.setValid(isValid);
    if (isValid) {
      this.disableInteractive();
    }
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
