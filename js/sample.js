// The shipped sample mysteries. Each is data only — read-only by default
// (cloned for editing). All four follow these rules:
//   • Every suspect (including the victim 🪦) stands on a UNIQUE row and
//     a UNIQUE column. Nobody shares a row or column with anybody.
//   • The killer 🔪 is in the same room as the victim — alone with them.
//     All other suspects are in different rooms.

const CONSERVATORY = {
  id: 'lvl_sample_conservatory',
  name: 'The Crimson Conservatory',
  description:
    'Lady Wraithmoor is dead among her orchids. Five guests were in the ' +
    'house tonight — each one swears they were elsewhere.\n\n' +
    'HOW TO PLAY\n' +
    'Drag each suspect into the cell where they actually stood at the ' +
    'moment of the murder, then mark one of them 🔪 as the killer. The ' +
    'Check button unlocks once every suspect is placed and a killer is ' +
    'named.\n\n' +
    'THE PUZZLE RULES\n' +
    '• No two suspects share a row or a column. Everyone is in a unique ' +
    'row and a unique column.\n' +
    '• The killer was alone in the room with the victim 🪦. Every other ' +
    'suspect was in a different room.\n' +
    '• Clues use relative language — "at the orchid table", "in the same ' +
    'room as Yew", "to the left of the piano". Figure out where each ' +
    'person stood, then identify the one in the room with Lady ' +
    'Wraithmoor: that\'s your killer.',
  rooms: [
    { id: 'r1', name: 'Greenhouse', description: 'Glass walls, humid, smells of orchids.',
      color: '#7bc48f', tilePattern: 'square',
      cells: [[2,0],[3,0],[4,0],[5,0],[2,1],[3,1],[4,1],[5,1],[2,2],[3,2],[4,2],[5,2]] },
    { id: 'r2', name: 'Library', description: 'Floor-to-ceiling shelves; a single armchair by the window.',
      color: '#c4937b', tilePattern: 'wood',
      cells: [[0,3],[1,3],[2,3],[3,3],[0,4],[1,4],[2,4],[3,4],[0,5],[1,5],[2,5],[3,5]] },
    { id: 'r3', name: 'Hallway', description: 'A narrow corridor connecting the wings.',
      color: '#a87bc4', tilePattern: 'diamond',
      cells: [[4,3],[4,4],[4,5]] },
    { id: 'r4', name: 'Dining Room', description: 'Dinner was cleared at half past nine. Wine glasses remain.',
      color: '#c47b7b', tilePattern: 'check',
      cells: [[5,3],[6,3],[7,3],[8,3],[5,4],[6,4],[7,4],[8,4],[5,5],[6,5],[7,5],[8,5]] },
    { id: 'r5', name: 'Parlour', description: 'After-dinner drinks were served here. A piano stands open.',
      color: '#7b9ed1', tilePattern: 'stripe-h',
      cells: [[2,6],[3,6],[4,6],[5,6],[6,6],[2,7],[3,7],[4,7],[5,7],[6,7],[2,8],[3,8],[4,8],[5,8],[6,8]] },
  ],
  doorways: ['h:2,2','v:3,3','v:4,3','h:4,5','h:3,5'],
  victim: 'char-01',
  killerSolution: 'char-10',
  solution: {
    '3,1': 'char-01', // Eveline (victim) — at the orchid table in the greenhouse
    '2,2': 'char-10', // Crowe (killer) — chair in the greenhouse with the victim
    '1,3': 'char-03', // Marisol — armchair in the library
    '7,4': 'char-06', // Glover — at the dining table
    '4,5': 'char-15', // Yew — on the hallway rug
    '5,8': 'char-04', // Penn — at the piano in the parlour
  },
  decorations: {
    '2,0': 'plant', '5,0': 'plant',
    '3,1': 'table',           // Eveline's orchid table
    '2,2': 'chair',           // Crowe's chair
    '1,3': 'armchair',        // Marisol's armchair
    '4,5': 'rug',             // Yew on the hallway rug
    '5,3': 'painting', '6,4': 'chair', '7,4': 'table', '8,4': 'chair', // Dining
    '2,6': 'sofa', '6,6': 'painting', '3,8': 'lamp', '5,8': 'piano', '6,8': 'plant',
  },
  clues: {
    'char-01': 'Lady Wraithmoor was found slumped at a table among potted orchids.',
    'char-03': 'Dr. Quint was in the armchair in the library.',
    'char-04': 'The reverend was at the keys of a piano.',
    'char-06': 'The butler stood at the dining table — flanked left and right by chairs.',
    'char-10': 'Professor Crowe was at a chair in the same room as Lady Wraithmoor.',
    'char-15': 'The gardener stood on the rug in the narrow corridor between rooms.',
  },
};

const LIGHTHOUSE = {
  id: 'lvl_sample_lighthouse',
  name: 'Midnight at the Lighthouse',
  description:
    'The keeper of Black Cape Light is dead — found at the lantern. ' +
    'Three others were on the rock tonight. Place each one and mark the ' +
    'killer (the one who was alone in the room with the captain).',
  rooms: [
    { id: 'r1', name: 'Lantern Room', description: 'Wind, sea, and one enormous bulb.',
      color: '#c4a87b', tilePattern: 'dots',
      cells: [[3,0],[4,0],[5,0],[3,1],[4,1],[5,1],[3,2],[4,2],[5,2]] },
    { id: 'r2', name: 'Stairwell', description: 'A spiral of iron treads with a single landing.',
      color: '#a87bc4', tilePattern: 'diamond',
      cells: [[3,3],[4,3],[3,4],[4,4],[3,5],[4,5]] },
    { id: 'r3', name: 'Kitchen', description: 'A small galley with a kettle still on the stove.',
      color: '#c47b7b', tilePattern: 'check',
      cells: [[1,6],[2,6],[3,6],[1,7],[2,7],[3,7],[1,8],[2,8],[3,8]] },
    { id: 'r4', name: 'Quarters', description: 'A single bunk and a chest of drawers.',
      color: '#7b9ed1', tilePattern: 'wood',
      cells: [[4,6],[5,6],[6,6],[4,7],[5,7],[6,7],[4,8],[5,8],[6,8]] },
  ],
  doorways: ['h:3,2','h:4,2','h:3,5','h:4,5'],
  victim: 'char-08',
  killerSolution: 'char-19',
  solution: {
    '4,1': 'char-08', // Captain (victim) — at the lantern
    '3,2': 'char-19', // Imogen (killer) — in the same room as the captain, at a plant
    '1,7': 'char-13', // Ottilie — kitchen table
    '5,8': 'char-17', // Genevieve — the only bed
  },
  decorations: {
    '4,1': 'lamp',                // Captain at the lantern
    '3,2': 'plant',               // Imogen at a plant
    '4,4': 'rug',                 // empty stairwell
    '1,7': 'table', '2,6': 'chair', '3,8': 'plant',
    '5,8': 'bed', '6,7': 'dresser', '4,6': 'lamp',
  },
  clues: {
    'char-08': 'The captain was at the lantern itself.',
    'char-13': 'Drinking tea at the kitchen table — the only table on the rock.',
    'char-17': 'Found asleep in the only bed in the building.',
    'char-19': 'Photographing a potted plant — in the same room as the captain.',
  },
};

const TEA_AND_TREACHERY = {
  id: 'lvl_sample_tea',
  name: 'Tea and Treachery',
  description:
    'A medium dies mid-séance. Two guests were in the house. A gentle ' +
    'first case for learning the rules.',
  rooms: [
    { id: 'r1', name: 'Parlour', description: 'Heavy curtains drawn against the afternoon.',
      color: '#c47bb1', tilePattern: 'stripe-h',
      cells: [[1,2],[2,2],[3,2],[1,3],[2,3],[3,3],[1,4],[2,4],[3,4]] },
    { id: 'r2', name: 'Drawing Room', description: 'A grand piano dominates the room.',
      color: '#7b9ed1', tilePattern: 'wood',
      cells: [[5,2],[6,2],[7,2],[5,3],[6,3],[7,3],[5,4],[6,4],[7,4]] },
    { id: 'r3', name: 'Garden', description: 'A long terrace of potted ferns and rose-trees.',
      color: '#7bc48f', tilePattern: 'check',
      cells: [[2,5],[3,5],[4,5],[5,5],[6,5],[2,6],[3,6],[4,6],[5,6],[6,6],[2,7],[3,7],[4,7],[5,7],[6,7]] },
  ],
  doorways: ['h:2,4','h:5,4','h:3,4'],
  victim: 'char-05',
  killerSolution: 'char-09',
  solution: {
    '2,4': 'char-05', // Sable (victim) — sofa in the parlour
    '3,2': 'char-09', // Vivienne (killer) — same room (parlour), at a lamp
    '6,3': 'char-20', // Felix — at the piano in the drawing room
  },
  decorations: {
    '2,4': 'sofa', '3,2': 'lamp', '1,3': 'painting',
    '6,3': 'piano', '7,4': 'armchair', '5,2': 'painting',
    '2,5': 'plant', '4,7': 'plant', '6,7': 'plant', '3,6': 'rug',
  },
  clues: {
    'char-05': 'Madame Sable was on the sofa where she had been pouring tea.',
    'char-09': 'Vivienne was at a lamp — in the same room as the medium.',
    'char-20': 'Felix was at the keys of the only piano in the house.',
  },
};

const BOOKSELLERS_LOFT = {
  id: 'lvl_sample_loft',
  name: "The Bookseller's Loft",
  description:
    'A reclusive bookseller is dead in his own shop. Five suspects were ' +
    'in the building tonight.',
  rooms: [
    { id: 'r1', name: 'Shop Floor', description: 'Rows of shelves, an armchair for browsing.',
      color: '#c4937b', tilePattern: 'wood',
      cells: [[0,2],[1,2],[2,2],[3,2],[4,2],[0,3],[1,3],[2,3],[3,3],[4,3],[0,4],[1,4],[2,4],[3,4],[4,4]] },
    { id: 'r2', name: 'Office', description: 'A small desk and the safe.',
      color: '#7b89c4', tilePattern: 'square',
      cells: [[6,2],[7,2],[8,2],[6,3],[7,3],[8,3]] },
    { id: 'r3', name: 'Stockroom', description: 'Crates of unsold inventory.',
      color: '#a3c47b', tilePattern: 'diamond',
      cells: [[6,4],[7,4],[8,4],[6,5],[7,5],[8,5]] },
    { id: 'r4', name: 'Loft Bedroom', description: 'The bookseller lived above his shop.',
      color: '#9c7bc4', tilePattern: 'stripe-v',
      cells: [[0,6],[1,6],[2,6],[0,7],[1,7],[2,7]] },
    { id: 'r5', name: 'Kitchenette', description: 'A galley kitchen, kettle still warm.',
      color: '#c47b7b', tilePattern: 'check',
      cells: [[4,6],[5,6],[6,6],[4,7],[5,7],[6,7]] },
  ],
  doorways: ['v:4,3','h:0,5','h:4,5','h:5,5'],
  victim: 'char-02',
  killerSolution: 'char-16',
  solution: {
    '1,7': 'char-02', // Brand (victim) — in the bed
    '2,6': 'char-16', // Silas (killer) — same room (loft), on a chair
    '3,4': 'char-14', // Mortimer — armchair on the shop floor
    '7,2': 'char-18', // Knox — at the desk in the office
    '8,5': 'char-12', // Hask — dresser in the stockroom
  },
  decorations: {
    '1,7': 'bed', '0,6': 'dresser', '2,6': 'chair',
    '3,4': 'armchair', '1,2': 'bookshelf', '3,2': 'bookshelf', '4,4': 'bookshelf', '0,4': 'lamp',
    '7,2': 'table', '8,3': 'painting',
    '8,5': 'dresser', '7,4': 'rug',
    '4,7': 'table', '5,6': 'chair', '6,7': 'plant',
  },
  clues: {
    'char-02': 'The bookseller was found in the only bed in the building.',
    'char-12': 'Hask was beside a dresser in the storage area — not the one in the bedroom.',
    'char-14': 'Mortimer was in the armchair on the shop floor, surrounded by bookshelves.',
    'char-16': 'Silas was on a chair in the same room as the victim.',
    'char-18': 'Knox sat at the only desk in the building.',
  },
};

const RAW = [CONSERVATORY, LIGHTHOUSE, TEA_AND_TREACHERY, BOOKSELLERS_LOFT];

export const SAMPLES = RAW.map((s) => ({
  key: s.id,
  name: s.name,
  description: s.description,
  build: () => {
    const lvl = JSON.parse(JSON.stringify(s));
    lvl.id = 'lvl_' + Math.random().toString(36).slice(2, 8);
    const now = Date.now();
    lvl.createdAt = now;
    lvl.updatedAt = now;
    lvl.isSample = true;
    lvl.sampleKey = s.id;
    lvl.playerPlacement = {};
    lvl.playerKiller = null;
    return lvl;
  },
}));

export function buildSampleLevel(key) {
  const entry = SAMPLES.find((s) => s.key === key) || SAMPLES[0];
  return entry.build();
}
