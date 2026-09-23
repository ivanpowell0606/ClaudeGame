import { tileToWorld } from '../config/grid.js';
import { setGameScene } from '../ui/gameSceneRef.js';
import { closeUpgradeMenu } from '../ui/upgradeMenu.js';
import { STARTING_CASH, TURRET_COST, STARTING_HP, LEAK_DAMAGE } from '../config/economy.js';
import PathRenderer from './controllers/PathRenderer.js';
import PlacementController from './controllers/PlacementController.js';
import WaveController from './controllers/WaveController.js';
import CombatSystem from './controllers/CombatSystem.js';

// Orchestrates the area: owns the shared state (turrets/bullets/enemies,
// cash, HP) and delegates behavior to focused controllers — PathRenderer
// (drawing), PlacementController (drag/nudge/click-to-open-upgrades),
// WaveController (spawning/progression/win-lose), and CombatSystem
// (targeting/firing/collision).
export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.area = data.area;
  }

  create() {
    document.getElementById('ui-panel').style.visibility = 'visible';

    this.pathPoints = this.area.pathTiles.map(tileToWorld);
    this.turrets = [];
    this.bullets = [];
    this.enemies = [];

    this.cash = STARTING_CASH;
    this.updateCashDisplay();
    this.hp = STARTING_HP;
    this.updateHpDisplay();

    new PathRenderer(this, this.pathPoints).draw();

    this.placement = new PlacementController(this);
    this.waves = new WaveController(this);
    this.combat = new CombatSystem(this);

    setGameScene(this);
    this.events.once('shutdown', () => {
      setGameScene(null);
      closeUpgradeMenu();
    });
  }

  update(time, delta) {
    this.waves.update(delta);
    this.combat.update(time, delta);
  }

  // --- Cash economy (shared by placement cost + combat reward) ---

  updateCashDisplay() {
    document.getElementById('cash-display').textContent = `$${this.cash}`;
  }

  // Already-paid turrets can always afford to move; a fresh one needs
  // enough cash on hand.
  canAfford(turret) {
    return turret.paid || this.cash >= TURRET_COST;
  }

  chargeIfNeeded(turret) {
    if (turret.isValid && !turret.paid) {
      this.cash -= TURRET_COST;
      turret.paid = true;
      this.updateCashDisplay();
    }
  }

  // --- Base HP: every leaked enemy costs HP; 0 ends the run ---

  updateHpDisplay() {
    document.getElementById('hp-display').textContent = `${Math.max(0, this.hp)} HP`;
  }

  takeLeakDamage() {
    if (this.waves.finished) return;

    this.hp -= LEAK_DAMAGE;
    this.updateHpDisplay();
    if (this.hp <= 0) {
      this.waves.endRun(false);
    }
  }

  // --- Public API used by the HTML sidebar / upgrade drawer / result overlay ---

  startDragPreview(type) {
    this.placement.startDragPreview(type);
  }

  updateDragPreview(clientX, clientY) {
    this.placement.updateDragPreview(clientX, clientY);
  }

  confirmDrop() {
    this.placement.confirmDrop();
  }

  startWave() {
    this.waves.startWave();
  }

  replayArea() {
    this.scene.restart({ area: this.area });
  }

  returnToMenu() {
    document.getElementById('ui-panel').style.visibility = 'hidden';
    this.scene.start('MenuScene');
  }
}
