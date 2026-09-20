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
];
