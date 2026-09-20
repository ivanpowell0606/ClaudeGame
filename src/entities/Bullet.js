// Simple straight-line projectile.

export const BULLET_SPEED = 640; // pixels per second
export const BULLET_RADIUS = 8;
export const BULLET_LIFETIME = 1000; // ms before despawning
export const BULLET_DAMAGE = 5;

export default class Bullet extends Phaser.GameObjects.Container {
  constructor(scene, x, y, angle) {
    super(scene, x, y);
    scene.add.existing(this);

    this.velocityX = Math.cos(angle) * BULLET_SPEED;
    this.velocityY = Math.sin(angle) * BULLET_SPEED;
    this.age = 0;

    const body = scene.add.circle(0, 0, BULLET_RADIUS, 0xf2c14e);
    this.add(body);
  }

  get expired() {
    return this.age >= BULLET_LIFETIME;
  }

  update(delta) {
    this.x += (this.velocityX * delta) / 1000;
    this.y += (this.velocityY * delta) / 1000;
    this.age += delta;
  }
}
