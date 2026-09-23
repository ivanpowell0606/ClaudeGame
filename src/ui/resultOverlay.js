// Victory/defeat modal shown once a run ends, with Replay / Area Select.

import { getGameScene } from './gameSceneRef.js';

let backdrop;
let panel;
let title;
let message;
let replayButton;
let menuButton;

export function initResultOverlay() {
  backdrop = document.getElementById('result-backdrop');
  panel = document.getElementById('result-panel');
  title = document.getElementById('result-title');
  message = document.getElementById('result-message');
  replayButton = document.getElementById('result-replay-button');
  menuButton = document.getElementById('result-menu-button');

  replayButton.addEventListener('click', () => {
    hideResultOverlay();
    getGameScene()?.replayArea();
  });

  menuButton.addEventListener('click', () => {
    hideResultOverlay();
    getGameScene()?.returnToMenu();
  });
}

export function showResultOverlay({ victory, titleText, messageText }) {
  title.textContent = titleText;
  message.textContent = messageText;
  panel.classList.toggle('victory', victory);
  panel.classList.toggle('defeat', !victory);
  backdrop.classList.add('open');
}

export function hideResultOverlay() {
  backdrop.classList.remove('open');
}
