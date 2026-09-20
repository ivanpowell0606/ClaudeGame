// Simple placeholder enemy: a circle that walks the path at a fixed speed.

export const ENEMY_RADIUS = 12;
export const ENEMY_SPEED = 80; // pixels per second

export default class Enemy extends Phaser.GameObjects.Container {
  constructor(scene, path) {
    const start = path[0];
    super(scene, start.x, start.y);
    scene.add.existing(this);

    this.path = path;
    this.targetIndex = 1;
    this.velocity = { x: 0, y: 0 };

    const body = scene.add.circle(0, 0, ENEMY_RADIUS, 0xd1495b).setStrokeStyle(2, 0x7a1f2b);
    this.add(body);
  }

  get reachedEnd() {
    return this.targetIndex >= this.path.length;
  }

  getVelocity() {
    return this.velocity;
  }

  update(delta) {
    if (this.reachedEnd) {
      this.velocity = { x: 0, y: 0 };
      return;
    }

    const target = this.path[this.targetIndex];
    const distance = Phaser.Math.Distance.Between(this.x, this.y, target.x, target.y);
    const step = (ENEMY_SPEED * delta) / 1000;
    const angle = Phaser.Math.Angle.Between(this.x, this.y, target.x, target.y);
    this.velocity = { x: Math.cos(angle) * ENEMY_SPEED, y: Math.sin(angle) * ENEMY_SPEED };

    if (step >= distance) {
      this.setPosition(target.x, target.y);
      this.targetIndex++;
    } else {
      this.x += Math.cos(angle) * step;
      this.y += Math.sin(angle) * step;
    }
  }
}
