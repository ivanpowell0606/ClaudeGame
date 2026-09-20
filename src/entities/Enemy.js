// Simple placeholder enemy: a circle that walks the path at a fixed speed.

export const ENEMY_RADIUS = 24;
export const ENEMY_SPEED = 160; // pixels per second
export const ENEMY_MAX_HEALTH = 22;

const HEALTH_BAR_WIDTH = 60;
const HEALTH_BAR_HEIGHT = 10;
const HEALTH_BAR_OFFSET_Y = -(ENEMY_RADIUS + 20);

export default class Enemy extends Phaser.GameObjects.Container {
  constructor(scene, path) {
    const start = path[0];
    super(scene, start.x, start.y);
    scene.add.existing(this);

    this.path = path;
    this.targetIndex = 1;
    this.velocity = { x: 0, y: 0 };
    this.health = ENEMY_MAX_HEALTH;

    const body = scene.add.circle(0, 0, ENEMY_RADIUS, 0xd1495b).setStrokeStyle(4, 0x7a1f2b);

    const barX = -HEALTH_BAR_WIDTH / 2;
    const healthBarBg = scene.add
      .rectangle(barX, HEALTH_BAR_OFFSET_Y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, 0x2c2f36)
      .setOrigin(0, 0.5);
    this.healthBarFill = scene.add
      .rectangle(barX, HEALTH_BAR_OFFSET_Y, HEALTH_BAR_WIDTH, HEALTH_BAR_HEIGHT, 0x4caf50)
      .setOrigin(0, 0.5);

    this.add([body, healthBarBg, this.healthBarFill]);
  }

  get reachedEnd() {
    return this.targetIndex >= this.path.length;
  }

  get isDead() {
    return this.health <= 0;
  }

  getVelocity() {
    return this.velocity;
  }

  // Applies damage and updates the health bar. Returns true if this killed it.
  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.healthBarFill.scaleX = this.health / ENEMY_MAX_HEALTH;
    return this.isDead;
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
