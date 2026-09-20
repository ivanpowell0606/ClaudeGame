// Shared "which tower is selected in the menu" state, read by GameScene
// to gate placement.

let selectedTower = null;

export function getSelectedTower() {
  return selectedTower;
}

export function setSelectedTower(type) {
  selectedTower = type;
}
