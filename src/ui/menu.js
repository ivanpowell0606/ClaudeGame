import { getGameScene } from './gameSceneRef.js';
import { TURRET_COST } from '../config/economy.js';

const DRAGGABLE_TOWERS = [{ id: 'turret-button', type: 'turret', cost: TURRET_COST }];

export function initMenu() {
  DRAGGABLE_TOWERS.forEach(({ id, type, cost }) => {
    const button = document.getElementById(id);
    button.textContent = `Turret ($${cost})`;

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      const scene = getGameScene();
      if (!scene) return;

      scene.startDragPreview(type);
      scene.updateDragPreview(event.clientX, event.clientY);

      const handleMove = (moveEvent) => {
        scene.updateDragPreview(moveEvent.clientX, moveEvent.clientY);
      };

      const handleUp = () => {
        scene.confirmDrop();
        document.removeEventListener('pointermove', handleMove);
        document.removeEventListener('pointerup', handleUp);
      };

      document.addEventListener('pointermove', handleMove);
      document.addEventListener('pointerup', handleUp);
    });
  });

  const startButton = document.getElementById('start-wave-button');
  startButton.addEventListener('click', () => {
    getGameScene()?.startWave();
  });

  setInterval(() => {
    const scene = getGameScene();
    if (!scene) return;
    startButton.disabled = scene.isWaveActive();
  }, 200);
}
