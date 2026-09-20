import { GAME_WIDTH, GAME_HEIGHT } from './config/grid.js';
import GameScene from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#1e1e1e',
  parent: document.body,
  scene: [GameScene],
};

new Phaser.Game(config);
