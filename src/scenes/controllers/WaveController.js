import Enemy from '../../entities/Enemy.js';
import { showResultOverlay } from '../../ui/resultOverlay.js';

// Owns wave progression for the scene's area: spawning enemies for the
// current wave, moving/leaking them, detecting a clear, and ending the run
// (victory or defeat) once there's nothing left to play.
export default class WaveController {
  constructor(scene) {
    this.scene = scene;
    this.area = scene.area;

    this.waveIndex = 0;
    this.currentWave = null;
    this.waveActive = false;
    this.enemiesSpawned = 0;
    this.spawnTimer = 0;
    this.finished = false;
    this.victory = false;

    this.updateWaveButtonLabel();
  }

  hasMoreWaves() {
    return this.waveIndex < this.area.waves.length;
  }

  updateWaveButtonLabel() {
    const button = document.getElementById('start-wave-button');
    if (this.finished) {
      button.textContent = this.victory ? 'Area Cleared' : 'Game Over';
      button.disabled = true;
    } else if (this.hasMoreWaves()) {
      button.textContent = `Start ${this.area.waves[this.waveIndex].name}`;
      button.disabled = this.waveActive;
    } else {
      button.textContent = 'All Waves Cleared';
      button.disabled = true;
    }
  }

  startWave() {
    if (this.finished || this.waveActive || !this.hasMoreWaves()) return;
    this.currentWave = this.area.waves[this.waveIndex];
    this.waveActive = true;
    this.enemiesSpawned = 0;
    this.spawnTimer = 0;
    this.updateWaveButtonLabel();
  }

  // Ends the run once, either in defeat (ran out of HP) or victory (cleared
  // the area's last wave), and shows the results overlay.
  endRun(victory) {
    if (this.finished) return;
    this.finished = true;
    this.victory = victory;
    this.waveActive = false;
    this.updateWaveButtonLabel();

    showResultOverlay({
      victory,
      titleText: victory ? 'Area Cleared!' : 'Game Over',
      messageText: victory
        ? `You cleared all ${this.area.waves.length} waves with ${Math.max(0, this.scene.hp)} HP left.`
        : `Your base fell on ${this.currentWave.name}.`,
    });
  }

  updateSpawning(delta) {
    if (!this.waveActive) return;
    if (this.enemiesSpawned >= this.currentWave.enemyCount) return;

    this.spawnTimer += delta;
    if (this.spawnTimer >= this.currentWave.spawnIntervalMs) {
      this.spawnTimer -= this.currentWave.spawnIntervalMs;
      this.scene.enemies.push(new Enemy(this.scene, this.scene.pathPoints));
      this.enemiesSpawned++;
    }
  }

  updateEnemies(delta) {
    const { scene } = this;
    scene.enemies.forEach((enemy) => enemy.update(delta));
    scene.enemies = scene.enemies.filter((enemy) => {
      if (enemy.reachedEnd) {
        enemy.destroy();
        scene.takeLeakDamage();
        return false;
      }
      return true;
    });
  }

  checkWaveComplete() {
    if (this.waveActive && this.enemiesSpawned >= this.currentWave.enemyCount && this.scene.enemies.length === 0) {
      this.waveActive = false;
      this.waveIndex++;
      if (this.hasMoreWaves()) {
        this.updateWaveButtonLabel();
      } else {
        this.endRun(true);
      }
    }
  }

  update(delta) {
    this.updateSpawning(delta);
    this.updateEnemies(delta);
    this.checkWaveComplete();
  }
}
