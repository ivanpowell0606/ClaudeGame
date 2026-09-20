import { getSelectedTower, setSelectedTower } from './selection.js';

const TOWER_BUTTONS = [{ id: 'turret-button', type: 'turret' }];

export function initMenu() {
  TOWER_BUTTONS.forEach(({ id, type }) => {
    const button = document.getElementById(id);
    button.addEventListener('click', () => {
      const isSelected = getSelectedTower() === type;
      setSelectedTower(isSelected ? null : type);
      button.classList.toggle('selected', !isSelected);
    });
  });
}
