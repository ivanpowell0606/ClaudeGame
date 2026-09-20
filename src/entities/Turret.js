// Turret with a rotating gun (head + barrel) on a static base.
// Tracking only for now — no shooting.

export const TURRET_RADIUS = 22;

export default class Turret extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    const base = scene.add.circle(0, 0, TURRET_RADIUS, 0x555b66).setStrokeStyle(3, 0x2c2f36);

    const turretHead = scene.add.circle(0, 0, 14, 0x8892a6).setStrokeStyle(2, 0x2c2f36);
    const barrel = scene.add.rectangle(18, 0, 26, 8, 0x8892a6).setStrokeStyle(2, 0x2c2f36);

    this.gun = scene.add.container(0, 0, [barrel, turretHead]);

    this.add([base, this.gun]);
  }

  trackTarget(target) {
    this.gun.rotation = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
  }
}
