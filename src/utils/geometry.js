export function distanceToSegment(point, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lengthSq = dx * dx + dy * dy;

  let t = lengthSq === 0
    ? 0
    : ((point.x - a.x) * dx + (point.y - a.y) * dy) / lengthSq;
  t = Phaser.Math.Clamp(t, 0, 1);

  const closestX = a.x + t * dx;
  const closestY = a.y + t * dy;
  return Phaser.Math.Distance.Between(point.x, point.y, closestX, closestY);
}

// Predicts where a constant-velocity target will be when a projectile fired
// now from `shooter` at `projectileSpeed` would reach it. Returns null if no
// interception is possible (target is faster and moving away).
export function calculateInterceptPoint(shooter, target, targetVelocity, projectileSpeed) {
  const dx = target.x - shooter.x;
  const dy = target.y - shooter.y;
  const { x: vx, y: vy } = targetVelocity;

  const a = vx * vx + vy * vy - projectileSpeed * projectileSpeed;
  const b = 2 * (dx * vx + dy * vy);
  const c = dx * dx + dy * dy;

  let t;
  if (Math.abs(a) < 1e-6) {
    if (Math.abs(b) < 1e-6) return null;
    t = -c / b;
  } else {
    const discriminant = b * b - 4 * a * c;
    if (discriminant < 0) return null;

    const sqrtDisc = Math.sqrt(discriminant);
    const candidates = [(-b + sqrtDisc) / (2 * a), (-b - sqrtDisc) / (2 * a)].filter(
      (value) => value > 0
    );
    if (candidates.length === 0) return null;
    t = Math.min(...candidates);
  }

  if (!Number.isFinite(t) || t < 0) return null;

  return { x: target.x + vx * t, y: target.y + vy * t };
}
