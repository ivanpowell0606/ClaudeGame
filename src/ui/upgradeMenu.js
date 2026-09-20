// Turret upgrade drawer. No upgrades exist yet — this just opens/closes
// the panel on the correct side, ready to hold real upgrade options later.

let backdrop;
let panel;
let subtitle;
let closeButton;
let currentTurret = null;

export function initUpgradeMenu() {
  backdrop = document.getElementById('upgrade-backdrop');
  panel = document.getElementById('upgrade-panel');
  subtitle = document.getElementById('upgrade-subtitle');
  closeButton = document.getElementById('upgrade-close-button');

  closeButton.addEventListener('click', closeUpgradeMenu);
  backdrop.addEventListener('click', closeUpgradeMenu);
}

// `turret` is placed in a canvas whose logical width is `canvasWidth`. If
// it sits in the left half, the menu opens on the right side of the
// screen (and vice versa) so it doesn't cover the turret itself.
export function openUpgradeMenu(turret, canvasWidth) {
  if (currentTurret && currentTurret !== turret) {
    currentTurret.hideRange();
  }
  currentTurret = turret;
  turret.showRange();

  const side = turret.x < canvasWidth / 2 ? 'right' : 'left';
  panel.classList.remove('side-left', 'side-right');
  panel.classList.add(side === 'left' ? 'side-left' : 'side-right');

  subtitle.textContent = `Turret at (${Math.round(turret.x)}, ${Math.round(turret.y)})`;

  panel.classList.add('open');
  backdrop.classList.add('open');
}

export function closeUpgradeMenu() {
  if (currentTurret) {
    currentTurret.hideRange();
  }
  currentTurret = null;
  panel.classList.remove('open');
  backdrop.classList.remove('open');
}

export function getUpgradeMenuTurret() {
  return currentTurret;
}
