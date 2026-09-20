import { GAME_WIDTH } from '../config/grid.js';
import { AREAS } from '../config/areas.js';

const CARD_WIDTH = 340;
const CARD_HEIGHT = 220;
const CARD_GAP = 48;

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    document.getElementById('ui-panel').style.visibility = 'hidden';

    this.add
      .text(GAME_WIDTH / 2, 220, 'TOWER DEFENSE', {
        fontFamily: 'sans-serif',
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#eeeeee',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 300, 'Select an Area', {
        fontFamily: 'sans-serif',
        fontSize: '28px',
        color: '#888888',
      })
      .setOrigin(0.5);

    const totalWidth = AREAS.length * CARD_WIDTH + (AREAS.length - 1) * CARD_GAP;
    const startX = GAME_WIDTH / 2 - totalWidth / 2 + CARD_WIDTH / 2;
    const cardY = 520;

    AREAS.forEach((area, index) => {
      this.createAreaCard(area, startX + index * (CARD_WIDTH + CARD_GAP), cardY);
    });
  }

  createAreaCard(area, x, y) {
    const container = this.add.container(x, y);

    const bg = this.add
      .rectangle(0, 0, CARD_WIDTH, CARD_HEIGHT, 0x2c2f36)
      .setStrokeStyle(4, 0x444444);
    const name = this.add
      .text(0, -50, area.name, {
        fontFamily: 'sans-serif',
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#eeeeee',
      })
      .setOrigin(0.5);
    const difficulty = this.add
      .text(0, 10, area.difficulty, {
        fontFamily: 'sans-serif',
        fontSize: '20px',
        color: '#9c5f3f',
      })
      .setOrigin(0.5);
    const playHint = this.add
      .text(0, 75, 'Click to Play', {
        fontFamily: 'sans-serif',
        fontSize: '16px',
        color: '#666666',
      })
      .setOrigin(0.5);

    container.add([bg, name, difficulty, playHint]);
    container.setInteractive(
      new Phaser.Geom.Rectangle(-CARD_WIDTH / 2, -CARD_HEIGHT / 2, CARD_WIDTH, CARD_HEIGHT),
      Phaser.Geom.Rectangle.Contains
    );
    container.input.cursor = 'pointer';

    container.on('pointerover', () => bg.setStrokeStyle(4, 0x8892a6));
    container.on('pointerout', () => bg.setStrokeStyle(4, 0x444444));
    container.on('pointerdown', () => {
      this.scene.start('GameScene', { area });
    });

    return container;
  }
}
