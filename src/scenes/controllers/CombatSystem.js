import Bullet, { BULLET_RADIUS, BULLET_DAMAGE } from '../../entities/Bullet.js';
import { ENEMY_RADIUS } from '../../entities/Enemy.js';
import { ENEMY_REWARD } from '../../config/economy.js';

const HIT_DISTANCE = ENEMY_RADIUS + BULLET_RADIUS;

// Owns per-frame combat: turrets picking and firing at targets, and bullets
// colliding with enemies (damage, kills, cash reward).
export default class CombatSystem {
  constructor(scene) {
    this.scene = scene;
  }

  // Nearest enemy to a turret is also the one most likely in range, since
  // any farther enemy would be even less likely to be — so this alone
  // decides who a turret aims at.
  findNearestEnemy(turret) {
    let nearest = null;
    let nearestDistance = Infinity;
    this.scene.enemies.forEach((enemy) => {
      const distance = Phaser.Math.Distance.Between(turret.x, turret.y, enemy.x, enemy.y);
      if (distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    });
    return nearest;
  }

  update(time, delta) {
    const { scene } = this;

    scene.turrets.forEach((turret) => {
      if (!turret.isValid) return;

      const target = this.findNearestEnemy(turret);
      if (!target) return;

      const inRange = turret.trackTarget(target, target.getVelocity());
      if (inRange && turret.canFire(time)) {
        turret.markFired(time);
        const tip = turret.getBarrelTip();
        const aim = turret.aimPoint;
        const angle = Phaser.Math.Angle.Between(tip.x, tip.y, aim.x, aim.y);
        scene.bullets.push(new Bullet(scene, tip.x, tip.y, angle));
      }
    });

    scene.bullets = scene.bullets.filter((bullet) => {
      bullet.update(delta);

      const hitEnemy = scene.enemies.find(
        (enemy) => Phaser.Math.Distance.Between(bullet.x, bullet.y, enemy.x, enemy.y) <= HIT_DISTANCE
      );
      if (hitEnemy) {
        const killed = hitEnemy.takeDamage(BULLET_DAMAGE);
        bullet.destroy();
        if (killed) {
          hitEnemy.destroy();
          scene.enemies = scene.enemies.filter((enemy) => enemy !== hitEnemy);
          scene.cash += ENEMY_REWARD;
          scene.updateCashDisplay();
        }
        return false;
      }

      if (bullet.expired) {
        bullet.destroy();
        return false;
      }
      return true;
    });
  }
}
