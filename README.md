# Tower Defense

Built with [Phaser 3](https://phaser.io) (vendored locally in `vendor/`, no build step, no install required).

## Running

Serve the directory with any static file server and open `index.html`, e.g.:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Structure

- `index.html` — loads Phaser and boots the game.
- `src/main.js` — Phaser game config and scene registration.
- `src/scenes/GameScene.js` — the main scene (grid + enemy path rendering).
- `src/config/grid.js` — grid size, tile size, and enemy path waypoints.
- `vendor/phaser.min.js` — vendored Phaser library.

## Current foundation

- Configurable grid (`GRID_COLS` / `GRID_ROWS` / `TILE_SIZE`).
- Enemy path defined as a list of tile waypoints, rendered on the grid.

Not yet implemented: enemies, towers, projectiles, waves, economy/UI.
