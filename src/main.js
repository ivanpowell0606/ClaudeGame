import { GAME_WIDTH, GAME_HEIGHT } from './config/grid.js';
import MenuScene from './scenes/MenuScene.js';
import GameScene from './scenes/GameScene.js';
import { initMenu } from './ui/menu.js';
import { initUpgradeMenu } from './ui/upgradeMenu.js';

initMenu();
initUpgradeMenu();

const config = {
  type: Phaser.AUTO,
  backgroundColor: '#1e1e1e',
  parent: 'game-container',
  render: {
    antialias: true,
  },
  scale: {
    mode: Phaser.Scale.ENVELOP,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [MenuScene, GameScene],
};

new Phaser.Game(config);
