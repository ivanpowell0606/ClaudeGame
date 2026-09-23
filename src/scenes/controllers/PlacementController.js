import { PATH_WIDTH, GAME_WIDTH } from '../../config/grid.js';
import Turret, { TURRET_RADIUS } from '../../entities/Turret.js';
import { distanceToSegment } from '../../utils/geometry.js';
import { openUpgradeMenu } from '../../ui/upgradeMenu.js';

const TOWER_CLASSES = { turret: Turret };
const NUDGE_FACTOR = 0.25;
const CLICK_MOVE_THRESHOLD = 12;

// Owns turret placement: dragging a fresh one in from the sidebar,
// re-grabbing/nudging a stuck (invalid) one, and telling drag from a click
// that should open the upgrade menu instead. Reads/writes the scene's
// shared `turrets` array and calls back into it for cost checks.
export default class PlacementController {
  constructor(scene) {
    this.scene = scene;
    this.dragPreview = null;
    this.dragValid = false;
    this.dragPoint = null;
    this.nudgeActive = false;
    this.lastNudgePoint = null;
    this.pointerDownTurret = null;
    this.pointerDownPos = null;

    this.bindInput();
  }

  bindInput() {
    const { scene } = this;

    // Require a small movement before Phaser treats a press-and-move on a
    // turret as a drag, so a plain click (below) isn't swallowed as one.
    scene.input.dragDistanceThreshold = CLICK_MOVE_THRESHOLD;

    // Re-grabbing a turret reuses the same preview mechanic as a fresh menu
    // drag. Only unpaid/invalid (stuck) turrets are draggable at all — a
    // successfully paid/valid one disables its own interactivity in
    // Turret.finalizePlacement, so this only ever fires for the former.
    scene.input.on('dragstart', (pointer, gameObject) => {
      if (!(gameObject instanceof Turret)) return;
      const index = scene.turrets.indexOf(gameObject);
      if (index === -1) return;
      scene.turrets.splice(index, 1);
      gameObject.alpha = 0.6;
      gameObject.showRange();
      this.dragPreview = gameObject;
      this.applyDragPreviewAt(pointer.x, pointer.y);
    });

    scene.input.on('drag', (pointer, gameObject) => {
      if (this.dragPreview !== gameObject) return;
      this.applyDragPreviewAt(pointer.x, pointer.y);
    });

    scene.input.on('dragend', (pointer, gameObject) => {
      if (this.dragPreview !== gameObject) return;
      this.confirmDrop();
    });

    // Dragging on empty canvas nudges any turret currently stuck in an
    // invalid spot, in case it's awkward to grab directly.
    scene.input.on('pointerdown', (pointer) => {
      if (this.dragPreview) return;
      const overTurret = scene.turrets.find(
        (turret) => Phaser.Math.Distance.Between(pointer.x, pointer.y, turret.x, turret.y) <= TURRET_RADIUS
      );
      if (overTurret) {
        // Might be the start of a click (open the upgrade menu) or a drag
        // (handled by Phaser's own dragstart/drag/dragend above) — decided
        // on release by how far the pointer actually moved.
        this.pointerDownTurret = overTurret;
        this.pointerDownPos = { x: pointer.x, y: pointer.y };
        return;
      }
      if (!scene.turrets.some((turret) => !turret.isValid)) return;

      this.nudgeActive = true;
      this.lastNudgePoint = { x: pointer.x, y: pointer.y };
    });

    scene.input.on('pointermove', (pointer) => {
      if (!this.nudgeActive) return;

      const dx = (pointer.x - this.lastNudgePoint.x) * NUDGE_FACTOR;
      const dy = (pointer.y - this.lastNudgePoint.y) * NUDGE_FACTOR;
      this.lastNudgePoint = { x: pointer.x, y: pointer.y };

      scene.turrets.forEach((turret) => {
        if (turret.isValid) return;
        turret.setPosition(turret.x + dx, turret.y + dy);
        turret.showRange();
        // Tint-only preview while dragging — doesn't activate the turret
        // until the pointer is released.
        const wouldBeValid = this.isSpotValid(turret.x, turret.y, turret) && scene.canAfford(turret);
        turret.setValid(wouldBeValid);
      });
    });

    scene.input.on('pointerup', (pointer) => {
      if (this.pointerDownTurret) {
        const moved = Phaser.Math.Distance.Between(
          pointer.x,
          pointer.y,
          this.pointerDownPos.x,
          this.pointerDownPos.y
        );
        if (moved < CLICK_MOVE_THRESHOLD && this.pointerDownTurret.isValid) {
          openUpgradeMenu(this.pointerDownTurret, GAME_WIDTH);
        }
        this.pointerDownTurret = null;
        this.pointerDownPos = null;
      }

      if (this.nudgeActive) {
        scene.turrets.forEach((turret) => {
          if (turret.isValid) return;
          const finalValid = this.isSpotValid(turret.x, turret.y, turret) && scene.canAfford(turret);
          turret.finalizePlacement(finalValid);
          scene.chargeIfNeeded(turret);
          turret.hideRange();
        });
      }
      this.nudgeActive = false;
      this.lastNudgePoint = null;
    });
  }

  // --- Drag-and-drop placement, driven by the HTML tower menu ---

  startDragPreview(type) {
    const TowerClass = TOWER_CLASSES[type] || Turret;
    this.dragPreview = new TowerClass(this.scene, -1000, -1000);
    this.dragPreview.alpha = 0.6;
    this.dragPreview.showRange();
    this.dragPreview.setVisible(false);
  }

  updateDragPreview(clientX, clientY) {
    if (!this.dragPreview) return;

    const point = this.canvasPointFromClient(clientX, clientY);
    if (!point) {
      this.dragPreview.setVisible(false);
      this.dragValid = false;
      this.dragPoint = null;
      return;
    }

    this.applyDragPreviewAt(point.x, point.y);
  }

  applyDragPreviewAt(x, y) {
    this.dragValid = this.isSpotValid(x, y, this.dragPreview) && this.scene.canAfford(this.dragPreview);
    this.dragPoint = { x, y };
    this.dragPreview.setVisible(true);
    this.dragPreview.setPosition(x, y);
    this.dragPreview.setValid(this.dragValid);
  }

  // Places the dragged turret wherever it's released, valid or not — an
  // invalid drop leaves it there (tinted red) instead of vanishing, so it
  // can be picked back up and repositioned.
  confirmDrop() {
    if (this.dragPreview && this.dragPoint) {
      const turret = this.dragPreview;
      turret.alpha = 1;
      turret.finalizePlacement(this.dragValid);
      this.scene.chargeIfNeeded(turret);
      turret.hideRange();
      this.scene.turrets.push(turret);
      this.dragPreview = null;
    }
    this.cancelDrag();
  }

  cancelDrag() {
    if (this.dragPreview) {
      this.dragPreview.destroy();
      this.dragPreview = null;
    }
    this.dragValid = false;
    this.dragPoint = null;
  }

  // The canvas is scaled (and, under ENVELOP, cropped) to cover its
  // container while keeping aspect ratio, so raw canvas-rect math doesn't
  // map correctly — the visible/interactive area is the container's
  // bounds, and Phaser's own Scale Manager knows how to translate a page
  // point into game-world coordinates for it.
  canvasPointFromClient(clientX, clientY) {
    const rect = this.scene.game.canvas.parentElement.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return null;
    }

    return {
      x: this.scene.scale.transformX(clientX),
      y: this.scene.scale.transformY(clientY),
    };
  }

  isSpotValid(x, y, exclude = null) {
    return !this.isOnPath(x, y) && !this.overlapsTurret(x, y, exclude);
  }

  isOnPath(x, y) {
    const threshold = PATH_WIDTH / 2 + TURRET_RADIUS;
    const pathPoints = this.scene.pathPoints;
    for (let i = 0; i < pathPoints.length - 1; i++) {
      const distance = distanceToSegment({ x, y }, pathPoints[i], pathPoints[i + 1]);
      if (distance < threshold) return true;
    }
    return false;
  }

  overlapsTurret(x, y, exclude = null) {
    const threshold = TURRET_RADIUS * 2;
    return this.scene.turrets.some(
      (turret) => turret !== exclude && Phaser.Math.Distance.Between(x, y, turret.x, turret.y) < threshold
    );
  }
}
