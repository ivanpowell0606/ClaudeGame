// Playable areas. Each has its own path layout and an ordered list of
// waves — add more entries here as new areas are built.

import { WAVE_ONE, WAVE_TWO, WAVE_THREE, WAVE_FOUR, WAVE_FIVE } from './waves.js';

export const AREAS = [
  {
    id: 'area-1',
    name: 'Area 1',
    difficulty: 'Easy',
    pathTiles: [
      [0, 4],
      [4, 4],
      [4, 1],
      [10, 1],
      [10, 7],
      [14, 7],
    ],
    waves: [WAVE_ONE, WAVE_TWO, WAVE_THREE, WAVE_FOUR, WAVE_FIVE],
  },
  {
    id: 'area-2',
    name: 'Area 2',
    difficulty: 'Medium',
    // Starts on the left, loops around the field (crossing over itself
    // twice, like a woven loop) before cutting in and finishing near the
    // center — longer than Area 1's path.
    pathTiles: [
      [0, 4],
      [11, 4],
      [11, 7],
      [3, 7],
      [3, 2],
      [8, 2],
      [8, 5],
      [7, 5],
    ],
    waves: [WAVE_ONE, WAVE_TWO, WAVE_THREE, WAVE_FOUR, WAVE_FIVE],
  },
];
