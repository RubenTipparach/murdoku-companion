// A pre-built starter level — "The Crimson Conservatory" — used as the
// first-run example when localStorage is empty, and also offered from the
// Levels modal via "Load sample".
//
// Kept as a literal object (not JSON) so it's easy to read and tweak in
// place. `id` is reassigned on import so duplicates don't collide.

export const SAMPLE_LEVEL = {
  id: 'lvl_starter',
  name: 'The Crimson Conservatory',
  description:
    'A reclusive heiress is found dead among her orchids. Five guests were ' +
    'in the house tonight — each one swears they were elsewhere. Reconstruct ' +
    'who was actually where at the moment of the murder.',
  rooms: [
    {
      id: 'room_greenhouse',
      name: 'Greenhouse',
      description: 'Glass walls, humid, smells of orchids and damp soil.',
      color: '#7bc48f',
      tilePattern: 'square',
      cells: [
        [2,0],[3,0],[4,0],[5,0],
        [2,1],[3,1],[4,1],[5,1],
        [2,2],[3,2],[4,2],[5,2],
      ],
    },
    {
      id: 'room_library',
      name: 'Library',
      description: 'Floor-to-ceiling shelves; a single armchair by the window.',
      color: '#c4937b',
      tilePattern: 'wood',
      cells: [
        [0,3],[1,3],[2,3],[3,3],
        [0,4],[1,4],[2,4],[3,4],
        [0,5],[1,5],[2,5],[3,5],
      ],
    },
    {
      id: 'room_hallway',
      name: 'Hallway',
      description: 'A narrow corridor connecting the wings of the house.',
      color: '#a87bc4',
      tilePattern: 'diamond',
      cells: [[4,3],[4,4],[4,5]],
    },
    {
      id: 'room_dining',
      name: 'Dining Room',
      description: 'Dinner was cleared at half past nine. Wine glasses remain.',
      color: '#c47b7b',
      tilePattern: 'check',
      cells: [
        [5,3],[6,3],[7,3],[8,3],
        [5,4],[6,4],[7,4],[8,4],
        [5,5],[6,5],[7,5],[8,5],
      ],
    },
    {
      id: 'room_parlour',
      name: 'Parlour',
      description: 'After-dinner drinks were served here. A piano stands open.',
      color: '#7b9ed1',
      tilePattern: 'stripe-h',
      cells: [
        [2,6],[3,6],[4,6],[5,6],[6,6],
        [2,7],[3,7],[4,7],[5,7],[6,7],
        [2,8],[3,8],[4,8],[5,8],[6,8],
      ],
    },
  ],
  doorways: [
    'h:2,2', // Greenhouse ↔ Library
    'v:3,3', // Library ↔ Hallway
    'v:4,3', // Hallway ↔ Dining
    'h:4,5', // Hallway ↔ Parlour
    'h:3,5', // Library ↔ Parlour
  ],
  solution: {
    '4,1': 'char-01', // Lady Eveline Wraithmoor — found here
    '2,4': 'char-10', // Professor Crowe — researching
    '0,5': 'char-03', // Dr. Marisol Quint — reading
    '6,4': 'char-06', // Mr. Glover (the butler) — clearing
    '4,7': 'char-04', // Reverend Penn — at the piano
  },
  playerPlacement: {},
  decorations: {
    '2,0': 'plant',
    '5,0': 'plant',
    '3,2': 'table',
    '0,3': 'bookshelf',
    '1,3': 'bookshelf',
    '3,4': 'armchair',
    '1,5': 'lamp',
    '4,4': 'rug',
    '5,3': 'painting',
    '7,4': 'table',
    '8,5': 'chair',
    '7,3': 'chair',
    '2,6': 'sofa',
    '5,8': 'piano',
    '6,6': 'painting',
    '3,8': 'lamp',
    '6,8': 'plant',
  },
  createdAt: 0,
  updatedAt: 0,
};

// Build a fresh sample-level instance with a unique id and current timestamps.
export function buildSampleLevel() {
  const lvl = JSON.parse(JSON.stringify(SAMPLE_LEVEL));
  lvl.id = 'lvl_' + Math.random().toString(36).slice(2, 8);
  const now = Date.now();
  lvl.createdAt = now;
  lvl.updatedAt = now;
  return lvl;
}
