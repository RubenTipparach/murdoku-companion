// The shipped sample mysteries. Each is data only — read-only by default
// (cloned for editing). Picked from the start menu. Clues use relational
// language (furniture, other suspects) and never name a room directly.

const CONSERVATORY = {
  id: 'lvl_sample_conservatory',
  name: 'The Crimson Conservatory',
  description:
    'Lady Wraithmoor is dead among her orchids. Five guests were in the ' +
    'house tonight — each one swears they were elsewhere. The clues ' +
    'reference furniture and other suspects, never rooms. Find each ' +
    'person\'s exact cell.',
  rooms: [
    { id: 'r1', name: 'Greenhouse', description: 'Glass walls, humid, smells of orchids and damp soil.',
      color: '#7bc48f', tilePattern: 'square',
      cells: [[2,0],[3,0],[4,0],[5,0],[2,1],[3,1],[4,1],[5,1],[2,2],[3,2],[4,2],[5,2]] },
    { id: 'r2', name: 'Library', description: 'Floor-to-ceiling shelves; a single armchair by the window.',
      color: '#c4937b', tilePattern: 'wood',
      cells: [[0,3],[1,3],[2,3],[3,3],[0,4],[1,4],[2,4],[3,4],[0,5],[1,5],[2,5],[3,5]] },
    { id: 'r3', name: 'Hallway', description: 'A narrow corridor connecting the wings of the house.',
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
  solution: {
    '3,2': 'char-01', // Eveline
    '1,3': 'char-10', // Crowe
    '1,5': 'char-03', // Marisol
    '7,4': 'char-06', // Glover
    '5,8': 'char-04', // Penn
    '6,8': 'char-15', // Yew
  },
  decorations: {
    '2,0': 'plant', '5,0': 'plant', '3,2': 'table',
    '1,3': 'bookshelf', '3,4': 'armchair', '1,5': 'lamp',
    '4,4': 'rug',
    '5,3': 'painting', '7,3': 'chair', '7,4': 'table', '8,5': 'chair',
    '2,6': 'sofa', '6,6': 'painting', '3,8': 'lamp', '5,8': 'piano', '6,8': 'plant',
  },
  clues: {
    'char-01': 'Lady Wraithmoor was found slumped at a table among potted orchids — the only table in the house surrounded by plants.',
    'char-03': 'Dr. Quint was reading by lamplight, in a room walled with books. She and Professor Crowe were on opposite sides of the same room.',
    'char-04': 'The reverend was at the keys of a piano when the lights went out.',
    'char-06': 'The butler stood at the wine table, flanked on either side by dining chairs — the only table set for dinner.',
    'char-10': 'Professor Crowe was at a bookshelf, journal open. Dr. Quint was across the room from him.',
    'char-15': 'The gardener was tending a potted plant. She shared a room with the reverend at the piano.',
  },
};

const LIGHTHOUSE = {
  id: 'lvl_sample_lighthouse',
  name: 'Midnight at the Lighthouse',
  description:
    'The keeper of Black Cape Light is dead — found at the lantern, the bulb still warm. ' +
    'Three others were on the rock tonight. Place each one where they actually stood.',
  rooms: [
    { id: 'r1', name: 'Lantern Room', description: 'The very top of the tower. Wind, sea, and one enormous bulb.',
      color: '#c4a87b', tilePattern: 'dots',
      cells: [[3,0],[4,0],[5,0],[3,1],[4,1],[5,1],[3,2],[4,2],[5,2]] },
    { id: 'r2', name: 'Stairwell', description: 'A spiral of iron treads with a single landing.',
      color: '#a87bc4', tilePattern: 'diamond',
      cells: [[3,3],[4,3],[3,4],[4,4],[3,5],[4,5]] },
    { id: 'r3', name: 'Kitchen', description: 'A small galley with a kettle still on the stove.',
      color: '#c47b7b', tilePattern: 'check',
      cells: [[1,6],[2,6],[3,6],[1,7],[2,7],[3,7],[1,8],[2,8],[3,8]] },
    { id: 'r4', name: 'Quarters', description: 'A single bunk and a chest of drawers, neat as a uniform.',
      color: '#7b9ed1', tilePattern: 'wood',
      cells: [[4,6],[5,6],[6,6],[4,7],[5,7],[6,7],[4,8],[5,8],[6,8]] },
  ],
  doorways: ['h:3,2','h:4,2','h:3,5','h:4,5'],
  solution: {
    '4,1': 'char-08', // Captain Ardent — victim, at the lamp
    '1,7': 'char-13', // Ottilie — at the kitchen table
    '5,8': 'char-17', // Genevieve — at the bed
    '4,4': 'char-19', // Imogen — on the stairs (rug cell)
  },
  decorations: {
    '4,1': 'lamp', '3,0': 'plant',
    '4,4': 'rug',
    '1,7': 'table', '2,6': 'chair', '3,8': 'plant',
    '5,8': 'bed', '6,7': 'dresser', '4,6': 'lamp',
  },
  clues: {
    'char-08': 'The captain was at the lantern itself, the bulb still warm to the touch.',
    'char-13': 'Drinking tea at a kitchen table — the only table on the rock.',
    'char-17': 'Found asleep in the bed — the only bed in the building.',
    'char-19': 'On the spiral stairs, photographing — in the only room with no furniture but a rug.',
  },
};

const TEA_AND_TREACHERY = {
  id: 'lvl_sample_tea',
  name: 'Tea and Treachery',
  description:
    'A medium dies mid-séance. Two guests sat with her. The house is small ' +
    'and the clues are short — a gentle first case.',
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
  solution: {
    '2,4': 'char-05', // Sable — victim on the sofa
    '6,3': 'char-09', // Vivienne — at the piano
    '4,7': 'char-20', // Felix — among the plants
  },
  decorations: {
    '2,4': 'sofa', '3,2': 'painting', '1,3': 'lamp',
    '6,3': 'piano', '7,4': 'armchair', '5,2': 'painting',
    '2,5': 'plant', '4,7': 'plant', '6,7': 'plant', '3,6': 'rug',
  },
  clues: {
    'char-05': 'Madame Sable was on a sofa where she\'d been pouring tea.',
    'char-09': 'At the keys of the only piano in the house.',
    'char-20': 'Standing among potted plants — none of which were inside either sitting room.',
  },
};

const BOOKSELLERS_LOFT = {
  id: 'lvl_sample_loft',
  name: "The Bookseller's Loft",
  description:
    'A reclusive bookseller is dead in his own shop. Five suspects were in ' +
    'the building. The shop is cramped: clues lean on furniture and on who ' +
    'shared a room with whom.',
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
  solution: {
    '2,3': 'char-14', // Mortimer — at the armchair in the shop
    '7,2': 'char-18', // Knox the locksmith — at the desk
    '7,5': 'char-12', // Hask — among the crates
    '1,7': 'char-02', // Inspector Brand — at the bed (victim)
    '5,6': 'char-16', // Silas — at the kitchen table
  },
  decorations: {
    '2,3': 'armchair', '1,2': 'bookshelf', '3,2': 'bookshelf', '4,4': 'bookshelf', '0,4': 'lamp',
    '7,2': 'table', '8,3': 'painting',
    '7,5': 'dresser', '6,4': 'rug',
    '1,7': 'bed', '0,6': 'dresser',
    '5,6': 'table', '4,7': 'chair', '6,7': 'plant',
  },
  clues: {
    'char-02': 'The bookseller was found in the only bed in the building.',
    'char-14': 'Mortimer was in the armchair, surrounded by shelves of books.',
    'char-18': 'Knox sat at the desk — the only desk in the building.',
    'char-12': 'Hask was beside a dresser in the storage area, away from the rest.',
    'char-16': 'Silas was at a small table, in the same wing as the loft bedroom.',
  },
};

const RAW = [CONSERVATORY, LIGHTHOUSE, TEA_AND_TREACHERY, BOOKSELLERS_LOFT];

// Shipped catalog: each entry has metadata (used to build the start-menu
// cards) plus a builder that produces a fresh, uniquely-identified copy.
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
    lvl.isSample = true;          // read-only flag — Clone makes it editable
    lvl.sampleKey = s.id;         // breadcrumb back to the catalog entry
    lvl.playerPlacement = {};
    return lvl;
  },
}));

// Build a fresh copy of a sample by its catalog key. Defaults to the first
// shipped sample so existing call sites that don't pass a key still work.
export function buildSampleLevel(key) {
  const entry = SAMPLES.find((s) => s.key === key) || SAMPLES[0];
  return entry.build();
}
