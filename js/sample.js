// A pre-built starter level — "The Crimson Conservatory" — offered from
// the start menu. Six suspects (including the victim), one solution cell
// each, and a relational clue per suspect that references furniture and
// other suspects but never names rooms directly.

export const SAMPLE_LEVEL = {
  id: 'lvl_starter',
  name: 'The Crimson Conservatory',
  description:
    'Lady Wraithmoor is dead among her orchids. Five guests were in the ' +
    'house tonight, and every one of them swears they were elsewhere. The ' +
    'clues below place each person beside a piece of furniture, or in the ' +
    'same room as someone else. Drag each suspect to the cell where they ' +
    'actually stood at the moment of the murder.',
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
  // One placement per suspect; each clue below pins to exactly one cell
  // when combined with the room layout and the other clues.
  solution: {
    '3,2': 'char-01', // Eveline — at the orchid table in the greenhouse
    '1,3': 'char-10', // Crowe — at the bookshelf
    '1,5': 'char-03', // Marisol — at the lamp, opposite Crowe
    '7,4': 'char-06', // Glover — at the wine table in the dining room
    '5,8': 'char-04', // Penn — at the piano
    '6,8': 'char-15', // Yew — at the potted plant in the parlour
  },
  playerPlacement: {},
  decorations: {
    // Greenhouse: plants flanking a single table.
    '2,0': 'plant',
    '5,0': 'plant',
    '3,2': 'table',
    // Library: one bookshelf so "at the bookshelf" is unambiguous, plus
    // an armchair and a lamp on opposite sides of the room.
    '1,3': 'bookshelf',
    '3,4': 'armchair',
    '1,5': 'lamp',
    // Hallway: a rug, nothing else.
    '4,4': 'rug',
    // Dining: a table flanked by chairs, a painting on the wall side.
    '5,3': 'painting',
    '7,3': 'chair',
    '7,4': 'table',
    '8,5': 'chair',
    // Parlour: sofa, piano, painting, lamp, and one potted plant.
    '2,6': 'sofa',
    '6,6': 'painting',
    '3,8': 'lamp',
    '5,8': 'piano',
    '6,8': 'plant',
  },
  clues: {
    'char-01':
      'Lady Wraithmoor was found slumped at a table among the potted ' +
      'orchids — the only table in the house surrounded by plants.',
    'char-03':
      'Dr. Quint was reading by lamplight, in a room walled with books. ' +
      'She and Professor Crowe were on opposite sides of the same room.',
    'char-04':
      'The reverend was at the keys of a piano when the lights went out.',
    'char-06':
      'The butler stood at the wine table, flanked on either side by ' +
      'dining chairs — the only table set for dinner.',
    'char-10':
      'Professor Crowe was at a bookshelf, journal open. Dr. Quint was ' +
      'across the room from him.',
    'char-15':
      'The gardener was tending a potted plant. She shared the room with ' +
      'the reverend at the piano.',
  },
  createdAt: 0,
  updatedAt: 0,
};

// Which six characters appear in the sample. Used by the play UI to scope
// the visible roster down from all 20 to just the suspects in this case.
export const SAMPLE_SUSPECTS = ['char-01', 'char-03', 'char-04', 'char-06', 'char-10', 'char-15'];

export function buildSampleLevel() {
  const lvl = JSON.parse(JSON.stringify(SAMPLE_LEVEL));
  lvl.id = 'lvl_' + Math.random().toString(36).slice(2, 8);
  const now = Date.now();
  lvl.createdAt = now;
  lvl.updatedAt = now;
  return lvl;
}
