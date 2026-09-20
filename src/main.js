import { GAME_WIDTH, GAME_HEIGHT } from './config/grid.js';
import GameScene from './scenes/GameScene.js';
import { initMenu } from './ui/menu.js';
import { initUpgradeMenu } from './ui/upgradeMenu.js';

initMenu();
initUpgradeMenu();

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1e1e1e',
  parent: 'game-container',
  scene: [GameScene],
};

new Phaser.Game(config);
