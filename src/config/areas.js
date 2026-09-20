// Playable areas. Each has its own path layout and wave — add more entries
// here as new areas are built.

import { WAVE_ONE } from './waves.js';

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
    wave: WAVE_ONE,
  },
];
