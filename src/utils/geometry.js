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
