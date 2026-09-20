// Visual-only turret for now — no targeting/shooting logic yet.

export default class Turret extends Phaser.GameObjects.Container {
  constructor(scene, x, y) {
    super(scene, x, y);
    scene.add.existing(this);

    const base = scene.add.circle(0, 0, 22, 0x555b66).setStrokeStyle(3, 0x2c2f36);
    const turretHead = scene.add.circle(0, 0, 14, 0x8892a6).setStrokeStyle(2, 0x2c2f36);
    const barrel = scene.add.rectangle(18, 0, 26, 8, 0x8892a6).setStrokeStyle(2, 0x2c2f36);

    this.add([base, barrel, turretHead]);
  }
}
