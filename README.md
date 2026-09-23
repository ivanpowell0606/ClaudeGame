# Tower Defense

Built with [Phaser 3](https://phaser.io) (vendored locally in `vendor/`, no build step, no install required).

## Running

Serve the directory with any static file server and open `index.html`, e.g.:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Structure

- `index.html` — loads Phaser, the sidebar/upgrade-drawer/result-overlay DOM, and boots the game.
- `src/main.js` — Phaser game config and scene registration (`MenuScene`, `GameScene`).
- `src/scenes/MenuScene.js` — area-select title screen.
- `src/scenes/GameScene.js` — the main scene: path rendering, turret placement, combat, waves, economy, HP.
- `src/entities/` — `Turret`, `Enemy`, `Bullet` (Phaser Containers).
- `src/config/` — `grid.js` (tile/grid constants), `areas.js` (path + wave list per area), `waves.js`, `economy.js` (cash/HP tuning).
- `src/ui/` — DOM-side glue: the tower/wave sidebar (`menu.js`), the upgrade drawer, the result overlay, and `gameSceneRef.js` (lets that DOM code reach the active scene).
- `src/utils/geometry.js` — point/segment math and the bullet-lead calculation.
- `vendor/phaser.min.js` — vendored Phaser library.

## Current state

- One area (`Area 1`), five sequential waves of increasing size/spawn rate.
- Drag-and-drop turret placement from the sidebar: live range/validity preview, red tint when the spot is blocked or unaffordable, turrets that land invalid stay put and can be re-grabbed or nudged into a valid spot later.
- Turrets lead-target the nearest enemy and fire once in range; locked (validly placed) turrets can no longer be moved.
- Cash economy: starting cash, a cost per turret, and a reward per kill.
- Base HP: every enemy that reaches the end of the path costs HP; hitting 0 ends the run.
- Win/lose flow: a result overlay (Replay Area / Area Select) on either a full area clear or HP reaching 0.
- Clicking a placed turret opens an upgrade drawer — currently empty, ready for real upgrades.

## Known gaps

- No upgrades actually exist yet (the drawer is a placeholder).
- No way to sell or otherwise remove a placed turret.
- Only one tower type (turret) and one area.
- No persistence — progress resets on reload.

## Adding more

- **Another wave**: add an entry to `src/config/waves.js` and append it to an area's `waves` array in `areas.js`.
- **Another area**: add an entry to the `AREAS` array in `areas.js` with its own `pathTiles` and `waves`; it appears automatically as a card on the menu.
- **Another tower type**: give it a class similar to `Turret`, then add it to `TOWER_CLASSES` in `GameScene.js` and to the sidebar in `index.html`/`menu.js`.
