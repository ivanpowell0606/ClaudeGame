// Lets DOM-driven UI (the tower menu) reach the active GameScene without a
// tighter coupling between the two layers.

let activeScene = null;

export function setGameScene(scene) {
  activeScene = scene;
}

export function getGameScene() {
  return activeScene;
}
