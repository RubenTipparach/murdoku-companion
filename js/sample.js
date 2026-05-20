// The shipped sample mysteries. Each is data only, read-only by default
// (cloned for editing).
//
// CLUE AUTHORING RULES (see CLAUDE.md):
//   • Never name a room in a clue. Use furniture and relative positions.
//   • Every victim's clue ends with "alone in the room with the killer".
//   • The killer's clue never says "same room as the victim", deduction
//     happens via furniture proximity, not direct reveal.

const CONSERVATORY = {
  id: 'lvl_sample_conservatory',
  code: 'm1',
  name: 'The Crimson Conservatory',
  difficulty: 'easy',
  description:
    'Lady Wraithmoor is dead among her orchids. Five guests were in the ' +
    'house tonight, and each one swears they were elsewhere.',
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
    '3,1': 'char-01', // Eveline (victim), orchid table in the greenhouse
    '2,2': 'char-10', // Crowe (killer), chair near the orchid table
    '1,3': 'char-03', // Marisol, armchair surrounded by bookshelves
    '7,4': 'char-06', // Glover, long dinner table flanked by chairs
    '4,5': 'char-15', // Yew, rug in the narrow corridor
    '5,8': 'char-04', // Penn, at the piano
  },
  decorations: {
    '2,0': 'plant', '5,0': 'plant',
    '3,1': 'table',
    '2,2': 'chair',
    '1,3': 'armchair', '0,3': 'bookshelf', '0,5': 'bookshelf',
    '4,5': 'rug',
    '5,3': 'painting', '6,4': 'chair', '7,4': 'table', '8,4': 'chair',
    '2,6': 'sofa', '6,6': 'painting', '3,8': 'lamp', '5,8': 'piano', '6,8': 'plant',
  },
  clues: {
    'char-01':
      'Lady Wraithmoor was found slumped at a table surrounded by potted ' +
      'orchids. She was alone in the room with the killer.',
    'char-03':
      'Dr. Quint was reading in an armchair, flanked by tall bookshelves.',
    'char-04':
      'The reverend was at the keys of the only piano in the house.',
    'char-06':
      'The butler stood at a long table, flanked immediately left and ' +
      'right by tall chairs.',
    'char-10':
      'Professor Crowe was at a chair diagonally adjacent to the orchid table.',
    'char-15':
      'The gardener stood on a rug in a narrow corridor between two ' +
      'larger rooms.',
  },
};

const LIGHTHOUSE = {
  id: 'lvl_sample_lighthouse',
  code: 'm2',
  name: 'Midnight at the Lighthouse',
  difficulty: 'easy',
  description:
    'The keeper of Black Cape Light is dead. Three others were on the ' +
    'rock tonight. Place each one and name the killer.',
  rooms: [
    { id: 'r1', name: 'Top of the Tower', description: 'Wind, sea, and one enormous bulb.',
      color: '#c4a87b', tilePattern: 'dots',
      cells: [[3,0],[4,0],[5,0],[3,1],[4,1],[5,1],[3,2],[4,2],[5,2]] },
    { id: 'r2', name: 'Stairwell', description: 'A spiral of iron treads with a single landing.',
      color: '#a87bc4', tilePattern: 'diamond',
      cells: [[3,3],[4,3],[3,4],[4,4],[3,5],[4,5]] },
    { id: 'r3', name: 'Galley', description: 'A small kettle on the stove and a kitchen table.',
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
    '4,1': 'char-08', // Captain (victim), at the lantern
    '3,2': 'char-19', // Imogen (killer), at a plant near the lantern
    '1,7': 'char-13', // Ottilie, kitchen table
    '5,8': 'char-17', // Genevieve, the only bed
  },
  decorations: {
    '4,1': 'lamp',
    '3,2': 'plant',
    '4,4': 'rug',
    '1,7': 'table', '2,6': 'chair', '3,8': 'plant',
    '5,8': 'bed', '6,7': 'dresser', '4,6': 'lamp',
  },
  clues: {
    'char-08':
      'The captain was at the lantern itself, the bulb still warm. ' +
      'He was alone in the room with the killer.',
    'char-13':
      'Ottilie was at a small table, the only table on the rock.',
    'char-17':
      'Genevieve was found in the only bed in the building.',
    'char-19':
      'Imogen was beside a potted plant, diagonally adjacent to the lantern.',
  },
};

const TEA_AND_TREACHERY = {
  id: 'lvl_sample_tea',
  code: 'm3',
  name: 'Tea and Treachery',
  difficulty: 'easy',
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
    '2,4': 'char-05', // Sable (victim), on the sofa
    '3,2': 'char-09', // Vivienne (killer), beside a painting + lamp
    '6,3': 'char-20', // Felix, at the piano
  },
  decorations: {
    '2,4': 'sofa', '3,2': 'painting', '1,3': 'lamp', '2,2': 'lamp',
    '6,3': 'piano', '7,4': 'armchair', '5,2': 'painting',
    '2,5': 'plant', '4,7': 'plant', '6,7': 'plant', '3,6': 'rug',
  },
  clues: {
    'char-05':
      'Madame Sable was on the sofa where she had been pouring tea. ' +
      'She was alone in the room with the killer.',
    'char-09':
      'Vivienne was standing at a painting, with a lamp directly to her left.',
    'char-20':
      'Felix was at the keys of the only piano in the house.',
  },
};

const BOOKSELLERS_LOFT = {
  id: 'lvl_sample_loft',
  code: 'm4',
  name: "The Bookseller's Loft",
  difficulty: 'easy',
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
    '1,7': 'char-02', // Brand (victim), the bed
    '2,6': 'char-16', // Silas (killer), chair next to the dresser by the bed
    '3,4': 'char-14', // Mortimer, armchair flanked by bookshelves
    '7,2': 'char-18', // Knox, at the desk
    '8,5': 'char-12', // Hask, beside a dresser in the storage area
  },
  decorations: {
    '1,7': 'bed', '1,6': 'dresser', '2,6': 'chair',
    '3,4': 'armchair', '1,2': 'bookshelf', '3,2': 'bookshelf', '4,4': 'bookshelf', '0,4': 'lamp',
    '7,2': 'table', '8,3': 'painting',
    '8,5': 'dresser', '7,4': 'rug',
    '4,7': 'table', '5,6': 'chair', '6,7': 'plant',
  },
  clues: {
    'char-02':
      'The bookseller was found in the only bed in the building. He was ' +
      'alone in the room with the killer.',
    'char-12':
      'Hask was beside a dresser.',
    'char-14':
      'Mortimer was in the only armchair in the building.',
    'char-16':
      'Silas was on a chair directly to the right of a dresser.',
    'char-18':
      'Knox sat at the only desk in the building.',
  },
};

// ---------- Additional shipped cases ----------

const MAGISTRATES_STUDY = {
  id: 'lvl_sample_magistrate',
  code: 'm5',
  name: "The Magistrate's Study",
  difficulty: 'easy',
  description:
    'Colonel Hask, a retired magistrate, is dead in his own house. Four ' +
    'guests were under the roof tonight. Place them, then name the one ' +
    'who shared the room with the body.',
  rooms: [
    { id: 'r1', name: 'Drawing Room', description: 'A fireplace, a gramophone, deep armchairs.',
      color: '#c47b7b', tilePattern: 'stripe-h',
      cells: [[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]] },
    { id: 'r2', name: 'Kitchen', description: 'A long counter and a single dresser.',
      color: '#c4a87b', tilePattern: 'check',
      cells: [[4,0],[5,0],[6,0],[4,1],[5,1],[6,1],[4,2],[5,2],[6,2]] },
    { id: 'r3', name: 'Hall', description: 'A patterned runner, a wall mirror, a standing clock.',
      color: '#a87bc4', tilePattern: 'diamond',
      cells: [[2,3],[3,3],[4,3],[5,3],[6,3],[2,4],[3,4],[4,4],[5,4],[6,4],[2,5],[3,5],[4,5],[5,5],[6,5]] },
    { id: 'r4', name: 'Library', description: 'Two bookshelves, a single reading lamp.',
      color: '#c4937b', tilePattern: 'wood',
      cells: [[0,6],[1,6],[2,6],[0,7],[1,7],[2,7],[0,8],[1,8],[2,8]] },
    { id: 'r5', name: 'Conservatory', description: 'Sunlit, full of plants.',
      color: '#7bc48f', tilePattern: 'square',
      cells: [[5,6],[6,6],[7,6],[5,7],[6,7],[7,7],[5,8],[6,8],[7,8]] },
  ],
  doorways: ['h:2,2','h:4,2','h:2,5','h:5,5'],
  victim: 'char-12',
  killerSolution: 'char-07',
  solution: {
    '1,0': 'char-12', // Hask (victim) at his armchair
    '2,2': 'char-07', // Halloran (killer) at the table under the gramophone
    '3,4': 'char-02', // Brand on the patterned rug
    '5,1': 'char-11', // Voss at the kitchen chair
    '0,6': 'char-14', // Finch at the bookshelf, with another below him
  },
  decorations: {
    '1,0': 'armchair',
    '0,1': 'fireplace',
    '2,1': 'gramophone',
    '2,2': 'table',
    '4,1': 'table',
    '5,1': 'chair',
    '6,2': 'dresser',
    '2,3': 'mirror',
    '3,4': 'rug',
    '4,5': 'clock',
    '0,6': 'bookshelf',
    '0,7': 'bookshelf',
    '2,6': 'lamp',
    '5,6': 'plant',
    '6,7': 'table',
    '7,8': 'plant',
  },
  clues: {
    'char-12':
      'Colonel Hask was in his armchair, beside a fireplace. He was alone ' +
      'in the room with the killer.',
    'char-07':
      'Mrs Halloran stood at a table, with a gramophone directly above her.',
    'char-02':
      'Inspector Brand stood on a patterned rug, with a wall mirror ' +
      'diagonally above and to his left, and a tall standing clock ' +
      'diagonally below and to his right.',
    'char-11':
      'Sister Voss sat at the only chair in the building.',
    'char-14':
      'Mortimer was at a bookshelf, with another bookshelf directly below him.',
  },
};

const FERNS_AND_FELONIES = {
  id: 'lvl_sample_ferns',
  code: 'm6',
  name: 'Ferns and Felonies',
  difficulty: 'easy',
  description:
    'A botanist is found dead among her own potted plants. Three guests ' +
    'were visiting tonight.',
  rooms: [
    { id: 'r1', name: 'Conservatory', description: 'Two rows of potted ferns and one solitary chair.',
      color: '#7bc48f', tilePattern: 'square',
      cells: [[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1],[0,2],[1,2],[2,2],[3,2],[0,3],[1,3],[2,3],[3,3]] },
    { id: 'r2', name: 'Kitchen', description: 'A small breakfast table.',
      color: '#c4a87b', tilePattern: 'check',
      cells: [[5,0],[6,0],[7,0],[8,0],[5,1],[6,1],[7,1],[8,1],[5,2],[6,2],[7,2],[8,2],[5,3],[6,3],[7,3],[8,3]] },
    { id: 'r3', name: 'Hall', description: 'A single mirror, dim.',
      color: '#a87bc4', tilePattern: 'diamond',
      cells: [[4,1],[4,2],[4,3],[4,4],[4,5],[4,6],[4,7]] },
    { id: 'r4', name: 'Parlour', description: 'A worn sofa beside a tall floor lamp.',
      color: '#7b9ed1', tilePattern: 'stripe-h',
      cells: [[0,5],[1,5],[2,5],[3,5],[0,6],[1,6],[2,6],[3,6],[0,7],[1,7],[2,7],[3,7],[0,8],[1,8],[2,8],[3,8]] },
    { id: 'r5', name: 'Workshop', description: 'A typewriter on a side table; a heavy iron safe.',
      color: '#c47b7b', tilePattern: 'brick',
      cells: [[5,5],[6,5],[7,5],[8,5],[5,6],[6,6],[7,6],[8,6],[5,7],[6,7],[7,7],[8,7],[5,8],[6,8],[7,8],[8,8]] },
  ],
  doorways: ['v:3,1','v:4,1','v:3,5','v:4,5'],
  victim: 'char-15',
  killerSolution: 'char-04',
  solution: {
    '1,0': 'char-15', // Yew (victim) tending the plant
    '3,3': 'char-04', // Penn (killer) in the only chair
    '7,1': 'char-13', // Bramwell at the kitchen table
    '2,8': 'char-19', // Sarsfield on the sofa
  },
  decorations: {
    '0,0': 'plant',
    '1,0': 'plant',
    '3,3': 'chair',
    '7,1': 'table',
    '8,1': 'dresser',
    '2,8': 'sofa',
    '1,7': 'lamp',
    '7,5': 'typewriter',
    '8,8': 'safe',
    '5,5': 'rug',
    '4,4': 'mirror',
  },
  clues: {
    'char-15':
      'Yew was tending a potted plant, with another potted plant directly ' +
      'to her left. She was alone in the room with the killer.',
    'char-04':
      'Penn was sitting in the only chair in the house.',
    'char-13':
      'Bramwell was at a table, with a dresser directly to her right.',
    'char-19':
      'Sarsfield was on the only sofa, with a floor lamp diagonally above ' +
      'and to her left.',
  },
};

const ATELIER = {
  id: 'lvl_sample_atelier',
  code: 'm7',
  name: 'The Atelier',
  difficulty: 'easy',
  description:
    'A society photographer is dead in his studio. Four guests were in ' +
    'the building. Paintings cover every wall, so use the rule of unique ' +
    'rows and columns to tell one painting from another.',
  rooms: [
    { id: 'r1', name: 'Studio', description: 'Three hanging paintings, one tall mirror.',
      color: '#c4937b', tilePattern: 'parquet',
      cells: [[0,0],[1,0],[2,0],[3,0],[0,1],[1,1],[2,1],[3,1],[0,2],[1,2],[2,2],[3,2],[0,3],[1,3],[2,3],[3,3]] },
    { id: 'r2', name: 'Gallery', description: 'A row of paintings on each wall.',
      color: '#a87bc4', tilePattern: 'marble',
      cells: [[5,0],[6,0],[7,0],[8,0],[5,1],[6,1],[7,1],[8,1],[5,2],[6,2],[7,2],[8,2],[5,3],[6,3],[7,3],[8,3]] },
    { id: 'r3', name: 'Corridor', description: 'A long carpet runner.',
      color: '#7b89c4', tilePattern: 'herringbone',
      cells: [[2,4],[3,4],[4,4],[5,4],[6,4],[2,5],[3,5],[4,5],[5,5],[6,5]] },
    { id: 'r4', name: 'Darkroom', description: 'A typewriter on the desk; chemical smell.',
      color: '#7bc48f', tilePattern: 'wood',
      cells: [[0,6],[1,6],[2,6],[0,7],[1,7],[2,7],[0,8],[1,8],[2,8]] },
    { id: 'r5', name: 'Office', description: 'A small safe and a dresser in the corner.',
      color: '#c47b7b', tilePattern: 'check',
      cells: [[6,6],[7,6],[8,6],[6,7],[7,7],[8,7],[6,8],[7,8],[8,8]] },
  ],
  doorways: ['h:2,3','h:6,3','h:2,5','h:6,5'],
  victim: 'char-20',
  killerSolution: 'char-17',
  solution: {
    '1,0': 'char-20', // Felix (victim) at his table
    '3,2': 'char-17', // Genevieve (killer) at a painting
    '6,1': 'char-09', // Vivienne at a painting with another to her right
    '8,7': 'char-16', // Silas on a chair next to the safe
    '0,8': 'char-05', // Octavia at the typewriter
  },
  decorations: {
    '0,0': 'painting',
    '1,0': 'table',
    '0,2': 'painting',
    '3,2': 'painting',
    '2,2': 'mirror',
    '6,1': 'painting',
    '7,1': 'painting',
    '5,3': 'painting',
    '4,4': 'rug',
    '3,5': 'lamp',
    '0,8': 'typewriter',
    '1,7': 'table',
    '7,7': 'safe',
    '8,7': 'chair',
    '8,8': 'dresser',
  },
  clues: {
    'char-20':
      'Felix was at a table, with a painting directly to his left. He was ' +
      'alone in the room with the killer.',
    'char-17':
      'Genevieve was at a painting, with a tall mirror directly to her left.',
    'char-09':
      'Vivienne was at a painting, with another painting directly to her right.',
    'char-16':
      'Silas sat on the only chair, with a safe directly to his left.',
    'char-05':
      'Octavia was at the only typewriter in the building.',
  },
};

const COASTAL_HOTEL = {
  id: 'lvl_sample_hotel',
  code: 'm8',
  name: 'The Coastal Hotel',
  size: 12,
  difficulty: 'easy',
  description:
    'Captain Ardent is dead in his hotel suite. Six other guests were ' +
    'staying tonight. A larger case across twelve rooms and twelve rows.',
  // Three bands tiled into a 12x10 footprint with no gap rows. Each
  // room shares walls with its neighbours, the whole house is one
  // connected blob.
  rooms: [
    { id: 'r1', name: 'Lobby', description: 'A wide foyer with a single armchair near the door.',
      color: '#c4937b', tilePattern: 'marble',
      cells: [
        [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],
        [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],
        [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],
        [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],
      ] },
    { id: 'r2', name: 'Dining Room', description: 'A long banquet table and a corner gramophone.',
      color: '#c47b7b', tilePattern: 'check',
      cells: [
        [6,0],[7,0],[8,0],[9,0],[10,0],[11,0],
        [6,1],[7,1],[8,1],[9,1],[10,1],[11,1],
        [6,2],[7,2],[8,2],[9,2],[10,2],[11,2],
        [6,3],[7,3],[8,3],[9,3],[10,3],[11,3],
      ] },
    { id: 'r3', name: 'Suite', description: 'A four-poster bed and a single dresser.',
      color: '#9c7bc4', tilePattern: 'stripe-v',
      cells: [[0,4],[1,4],[2,4],[0,5],[1,5],[2,5],[0,6],[1,6],[2,6]] },
    { id: 'r4', name: 'Hall', description: 'A patterned runner, a clock, a wall mirror.',
      color: '#a87bc4', tilePattern: 'herringbone',
      cells: [
        [3,4],[4,4],[5,4],[6,4],[7,4],[8,4],
        [3,5],[4,5],[5,5],[6,5],[7,5],[8,5],
        [3,6],[4,6],[5,6],[6,6],[7,6],[8,6],
      ] },
    { id: 'r5', name: 'Kitchen', description: 'A small worktable, a dresser, a stove.',
      color: '#c4a87b', tilePattern: 'square',
      cells: [[9,4],[10,4],[11,4],[9,5],[10,5],[11,5],[9,6],[10,6],[11,6]] },
    { id: 'r6', name: 'Garden', description: 'A single potted plant.',
      color: '#7bc48f', tilePattern: 'square',
      cells: [
        [0,7],[1,7],[2,7],[3,7],[4,7],[5,7],
        [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
        [0,9],[1,9],[2,9],[3,9],[4,9],[5,9],
        [0,10],[1,10],[2,10],[3,10],[4,10],[5,10],
        [0,11],[1,11],[2,11],[3,11],[4,11],[5,11],
      ] },
    { id: 'r7', name: 'Drawing Room', description: 'A piano, a sofa, a fireplace.',
      color: '#7b9ed1', tilePattern: 'parquet',
      cells: [
        [6,7],[7,7],[8,7],[9,7],[10,7],[11,7],
        [6,8],[7,8],[8,8],[9,8],[10,8],[11,8],
        [6,9],[7,9],[8,9],[9,9],[10,9],[11,9],
        [6,10],[7,10],[8,10],[9,10],[10,10],[11,10],
        [6,11],[7,11],[8,11],[9,11],[10,11],[11,11],
      ] },
  ],
  doorways: [
    'v:5,2','v:2,5','v:8,5','v:5,8',           // intra-band doors
    'h:1,3','h:4,3','h:10,3',                  // band 1 / band 2 doors
    'h:1,6','h:4,6','h:10,6',                  // band 2 / band 3 doors
  ],
  victim: 'char-08',
  killerSolution: 'char-18',
  solution: {
    '1,5': 'char-08', // Captain (victim) in the only bed
    '2,4': 'char-18', // Knox (killer) in the chair above the dresser
    '0,0': 'char-01', // Eveline in the only armchair
    '9,2': 'char-06', // Glover at the chair left of the long banquet table
    '10,6': 'char-13', // Bramwell at the chair between a small table and a dresser
    '4,9': 'char-15', // Yew on a rug, the only potted plant to her left
    '7,7': 'char-17', // Genevieve at the chair right beside the only piano
  },
  decorations: {
    '0,0': 'armchair',
    '1,1': 'painting',
    '2,3': 'table',
    '8,0': 'gramophone',
    '9,2': 'chair',
    '10,2': 'table',
    '11,2': 'chair',
    '1,5': 'bed',
    '2,4': 'chair',
    '2,5': 'dresser',
    '0,6': 'mirror',
    '5,5': 'clock',
    '6,4': 'rug',
    '7,6': 'mirror',
    '9,6': 'table',
    '10,6': 'chair',
    '11,6': 'dresser',
    '11,4': 'safe',
    '3,9': 'plant',
    '4,9': 'rug',
    '0,7': 'bookshelf',
    '1,8': 'rug',
    '7,7': 'chair',
    '8,7': 'piano',
    '10,9': 'sofa',
    '11,7': 'bookshelf',
    '8,9': 'fireplace',
  },
  clues: {
    'char-08':
      'Captain Ardent was found in the only bed in the building. He was ' +
      'alone in the room with the killer.',
    'char-18':
      'Knox sat at a chair, with a dresser directly below him.',
    'char-01':
      'Eveline sat in the only armchair in the building.',
    'char-06':
      'Glover sat at a chair, with the only long banquet table in the ' +
      'building directly to his right.',
    'char-13':
      'Bramwell sat at a chair, with a small table directly to her left ' +
      'and a heavy dresser directly to her right.',
    'char-15':
      'Yew stood on a rug, with the only potted plant in the building ' +
      'directly to her left.',
    'char-17':
      'Genevieve sat at a chair, with the only piano in the building ' +
      'directly to her right.',
  },
};

const SPEAKEASY = {
  id: 'lvl_sample_speakeasy',
  code: 'm9',
  name: 'The Speakeasy',
  size: 12,
  difficulty: 'easy',
  description:
    'Reverend Penn is dead on the stage of the back-room speakeasy. ' +
    'Five others were in the establishment.',
  rooms: [
    { id: 'r1', name: 'Lobby', description: 'A single armchair near the entry.',
      color: '#c4937b', tilePattern: 'wood',
      cells: [
        [0,0],[1,0],[2,0],[3,0],
        [0,1],[1,1],[2,1],[3,1],
        [0,2],[1,2],[2,2],[3,2],
      ] },
    { id: 'r2', name: 'Dance Floor', description: 'A gramophone in the corner.',
      color: '#a87bc4', tilePattern: 'herringbone',
      cells: [
        [8,0],[9,0],[10,0],[11,0],
        [8,1],[9,1],[10,1],[11,1],
        [8,2],[9,2],[10,2],[11,2],
      ] },
    { id: 'r3', name: 'Hallway', description: 'A patterned rug and a clock.',
      color: '#7b89c4', tilePattern: 'diamond',
      cells: [
        [3,3],[4,3],[5,3],[6,3],[7,3],[8,3],
        [3,4],[4,4],[5,4],[6,4],[7,4],[8,4],
        [3,5],[4,5],[5,5],[6,5],[7,5],[8,5],
        [3,6],[4,6],[5,6],[6,6],[7,6],[8,6],
        [3,7],[4,7],[5,7],[6,7],[7,7],[8,7],
      ] },
    { id: 'r4', name: 'Bar', description: 'A long wooden counter, the only table in the place.',
      color: '#c47b7b', tilePattern: 'brick',
      cells: [[0,5],[1,5],[2,5],[0,6],[1,6],[2,6],[0,7],[1,7],[2,7]] },
    { id: 'r5', name: 'Office', description: 'A safe and a typewriter.',
      color: '#c4a87b', tilePattern: 'square',
      cells: [[9,5],[10,5],[11,5],[9,6],[10,6],[11,6],[9,7],[10,7],[11,7]] },
    { id: 'r6', name: 'Stage', description: 'A piano on a small platform.',
      color: '#7b9ed1', tilePattern: 'parquet',
      cells: [
        [0,8],[1,8],[2,8],[3,8],
        [0,9],[1,9],[2,9],[3,9],
        [0,10],[1,10],[2,10],[3,10],
      ] },
    { id: 'r7', name: 'Vault', description: 'Lined with shelves and a heavy door.',
      color: '#9c7bc4', tilePattern: 'marble',
      cells: [
        [8,8],[9,8],[10,8],[11,8],
        [8,9],[9,9],[10,9],[11,9],
        [8,10],[9,10],[10,10],[11,10],
      ] },
  ],
  // Stage and Vault now share walls with the Bar / Hallway / Office
  // cluster directly above; no more isolated bands.
  doorways: ['h:3,2','v:2,5','v:8,5','h:1,7','h:3,7','h:8,7','h:10,7'],
  victim: 'char-04',
  killerSolution: 'char-12',
  solution: {
    '1,9': 'char-04', // Penn (victim) at the piano
    '3,10': 'char-12', // Hask (killer) at a chair with painting to his left
    '2,6': 'char-09', // Vivienne at the only table
    '10,5': 'char-16', // Silas at the only safe
    '0,0': 'char-18', // Knox in the only armchair
    '9,2': 'char-19', // Imogen at the only gramophone
  },
  decorations: {
    '0,0': 'armchair',
    '3,0': 'painting',
    '9,2': 'gramophone',
    '10,0': 'mirror',
    '5,5': 'rug',
    '6,4': 'clock',
    '2,6': 'table',
    '0,6': 'lamp',
    '1,5': 'bookshelf',
    '10,5': 'safe',
    '11,7': 'typewriter',
    '9,6': 'chair',
    '1,9': 'piano',
    '2,10': 'painting',
    '3,10': 'chair',
    '0,10': 'lamp',
    '8,8': 'dresser',
    '11,10': 'plant',
    '10,9': 'mirror',
  },
  clues: {
    'char-04':
      'Reverend Penn was at the keys of a piano. He was alone in the room ' +
      'with the killer.',
    'char-12':
      'Hask sat at a chair, with a hanging painting directly to his left.',
    'char-09':
      'Vivienne sat at the only table in the building.',
    'char-16':
      'Silas was at the only safe in the building.',
    'char-18':
      'Knox sat in the only armchair in the building.',
    'char-19':
      'Imogen was at the only gramophone in the building.',
  },
};

// ----- Medium tier: fantasy-themed houses with non-rectangular rooms -----
// These three are deliberately harder than the easy roster: bigger casts,
// duplicate furniture forcing row / column deduction, L / T / plus / S
// shaped rooms. The fantasy flavour lives in the names and clues, the
// portraits and furniture art are reused from the easy set.

const WITCHSTONE_SANCTUM = {
  id: 'lvl_sample_witchstone',
  code: 'm10',
  name: 'The Witchstone Sanctum',
  difficulty: 'medium',
  size: 11,
  description:
    'On the eve of the Sigil Moon the coven gathered for council. Their ' +
    'high witch did not come to bear witness, the others found her cold ' +
    'at her scrying table. Six remained in the keep tonight.',
  // House outline is a T: the Scrying Chamber stem sticks up out of
  // the bar (rows 4-9 cols 0-10) at cols 3-7 rows 0-3. The corners
  // cols 0-2 / cols 8-10 of rows 0-3 are outside the keep. Six rooms
  // partition the T; the Bone Sanctum is the big central room of
  // the bar and the only one that touches all five neighbours.
  rooms: [
    { id: 'r1', name: 'Scrying Chamber', description: 'A flagstone hall around the scrying table, the keeps tall stem.',
      color: '#7b5db5', tilePattern: 'flagstone',
      cells: [
        [3,0],[4,0],[5,0],[6,0],[7,0],
        [3,1],[4,1],[5,1],[6,1],[7,1],
        [3,2],[4,2],[5,2],[6,2],[7,2],
        [3,3],[4,3],[5,3],[6,3],[7,3],
      ] },
    { id: 'r2', name: 'Hearthroom', description: 'A square of soot-dark cobble around the only hearth.',
      color: '#c97b5d', tilePattern: 'cobble',
      cells: [
        [0,4],[1,4],[2,4],
        [0,5],[1,5],[2,5],
        [0,6],[1,6],[2,6],
      ] },
    { id: 'r3', name: 'Reliquary', description: 'A square of niched brick, lined with relics of antler and ash.',
      color: '#5da8c4', tilePattern: 'brick',
      cells: [
        [8,4],[9,4],[10,4],
        [8,5],[9,5],[10,5],
        [8,6],[9,6],[10,6],
      ] },
    { id: 'r5', name: 'Bone Sanctum', description: 'A long chapel of antler and ash on a rush-strewn floor.',
      color: '#d1c084', tilePattern: 'rushes',
      cells: [
        [3,4],[4,4],[5,4],[6,4],[7,4],
        [3,5],[4,5],[5,5],[6,5],[7,5],
        [3,6],[4,6],[5,6],[6,6],[7,6],
        [3,7],[4,7],[5,7],[6,7],[7,7],
        [3,8],[4,8],[5,8],[6,8],[7,8],
        [3,9],[4,9],[5,9],[6,9],[7,9],
      ] },
    { id: 'r4', name: 'Mandrake Garden', description: 'A square of black soil, mandrakes in every cell save the rug.',
      color: '#7bc48f', tilePattern: 'check',
      cells: [
        [0,7],[1,7],[2,7],
        [0,8],[1,8],[2,8],
        [0,9],[1,9],[2,9],
      ] },
    { id: 'r6', name: 'Wellhouse', description: 'A flagstone hall sheltering the moonwater spring.',
      color: '#7b9ed1', tilePattern: 'flagstone',
      cells: [
        [8,7],[9,7],[10,7],
        [8,8],[9,8],[10,8],
        [8,9],[9,9],[10,9],
      ] },
  ],
  doorways: ['h:5,3','v:2,5','v:7,5','h:1,6','h:9,6','v:2,8','v:7,8'],
  victim: 'char-05',
  killerSolution: 'char-04',
  solution: {
    '5,1': 'char-05', // Sable, victim, rug directly above the scrying table
    '4,2': 'char-04', // Penn, killer, armchair, scrying table to his right
    '0,4': 'char-13', // Bramwell, armchair, only hearth to her right
    '10,5': 'char-10', // Crowe, armchair, directly below a tall bookshelf
    '1,8': 'char-15', // Yew, rug, flanked on all four sides by mandrakes
    '6,7': 'char-08', // Ardent, armchair, banner directly above him
    '9,9': 'char-16', // Roe, rug, only standing clock directly to his right
  },
  decorations: {
    // Every clue anchor in this level repeats at least once. Each
    // suspect's clue matches two cells on its own; only the row +
    // column uniqueness rule plus the killer-alone-with-victim rule
    // narrow them to one.
    // Scrying Chamber: rug+table for Sable, armchair+table-right for
    // Penn, plus a bookshelf decoy for Crowe.
    '5,0': 'banner',
    '5,1': 'rug',
    '4,2': 'armchair', '5,2': 'table',
    '3,3': 'bookshelf',
    // Hearthroom: armchair+hearth-right candidate for Bramwell.
    '0,4': 'armchair', '1,4': 'fireplace', '2,4': 'bookshelf',
    // Reliquary: banner+armchair-below decoy for Ardent, clock decoy
    // for Roe, and the Crowe-canonical armchair+bookshelf-above pair.
    '9,4': 'banner',   '10,4': 'bookshelf',
    '8,5': 'clock',    '9,5': 'armchair',  '10,5': 'armchair',
    // Mandrake Garden: plants line every cell except two rugs. Yew at
    // [1,8] is the canonical match; [2,9] is the rug+plant-above
    // decoy.
    '0,7': 'plant',    '1,7': 'plant',     '2,7': 'plant',
    '0,8': 'plant',    '1,8': 'rug',       '2,8': 'plant',
    '0,9': 'plant',    '1,9': 'plant',     '2,9': 'rug',
    // Bone Sanctum: holds the duplicates that mirror the other rooms.
    // Decoy armchair-below-bookshelf at [3,4]/[3,3]. Decoy rug-above-
    // table at [4,7]/[4,8]. Decoy armchair-table-right at [3,8]/[4,8].
    // Decoy armchair-hearth-right at [7,8]/[8,8] (hearth in
    // Wellhouse). Roe decoy rug at [7,5] with clock at [8,5].
    '3,4': 'armchair', '5,4': 'sofa',
    '4,5': 'anvil',    '7,5': 'rug',
    '6,6': 'banner',
    '4,7': 'rug',                          '6,7': 'armchair',
    '3,8': 'armchair', '4,8': 'table',     '7,8': 'armchair',
    // Wellhouse: a 2nd hearth (the decoy partner for [7,8]), Roe on
    // the canonical rug with a clock directly to his right.
    '8,8': 'fireplace',
    '9,9': 'rug',      '10,9': 'clock',
  },
  clues: {
    'char-05':
      'Madame Sable was slumped on a rug, directly above a heavy ' +
      'table. She was alone in the room with the killer.',
    'char-04':
      'Reverend Penn was curled in an armchair, with a heavy table ' +
      'directly to his right.',
    'char-13':
      'Ottilie Bramwell was curled in an armchair, with a hearth ' +
      'directly to her right.',
    'char-10':
      'Professor Crowe was reading from an armchair, directly below a ' +
      'tall bookshelf.',
    'char-15':
      'Constance Yew stood on a rug, with a potted mandrake directly ' +
      'above her.',
    'char-08':
      'Captain Ardent was curled in an armchair, with a banner directly ' +
      'above him.',
    'char-16':
      'Silas Roe stood on a rug, with a standing clock directly to his ' +
      'right.',
  },
};

const SUNKEN_LIBRARY = {
  id: 'lvl_sample_sunken_library',
  code: 'm11',
  name: 'The Sunken Library',
  difficulty: 'medium',
  size: 11,
  description:
    'Beneath the seacliff the Lorewarden kept his stacks. He was found ' +
    'cold at his reading desk, ink still pooling on a half-finished page. ' +
    'Five of his scholars remained inside the library tonight.',
  // House outline is an L: the upper bar spans cols 0-10 rows 0-5
  // (the main library hall), and the lower stem spans only cols 0-5
  // rows 6-9 (the saltwater garden tucked under the western half).
  // The bottom-right corner cols 6-10 rows 6-9 is outside the library
  // wall, looking out over the sea.
  rooms: [
    { id: 'r2', name: 'Scribes Loft', description: 'A square of slanted desks under a clerestory.',
      color: '#c4a87b', tilePattern: 'parquet',
      cells: [
        [0,0],[1,0],[2,0],
        [0,1],[1,1],[2,1],
        [0,2],[1,2],[2,2],
      ] },
    { id: 'r1', name: 'Reading Hall', description: 'A long central hall of reading desks, the Lorewardens own.',
      color: '#a87bc4', tilePattern: 'flagstone',
      cells: [
        [3,0],[4,0],[5,0],[6,0],[7,0],
        [3,1],[4,1],[5,1],[6,1],[7,1],
        [3,2],[4,2],[5,2],[6,2],[7,2],
        [3,3],[4,3],[5,3],[6,3],[7,3],
        [3,4],[4,4],[5,4],[6,4],[7,4],
        [3,5],[4,5],[5,5],[6,5],[7,5],
      ] },
    { id: 'r3', name: 'Western Stacks', description: 'A tall hall of floor-to-ceiling shelves.',
      color: '#7b9ed1', tilePattern: 'brick',
      cells: [
        [0,3],[1,3],[2,3],
        [0,4],[1,4],[2,4],
        [0,5],[1,5],[2,5],
      ] },
    { id: 'r5', name: 'Cartographers Round', description: 'A chartroom of tables, chests and a cauldron of ink.',
      color: '#c4937b', tilePattern: 'cobble',
      cells: [
        [8,0],[9,0],[10,0],
        [8,1],[9,1],[10,1],
        [8,2],[9,2],[10,2],
        [8,3],[9,3],[10,3],
        [8,4],[9,4],[10,4],
        [8,5],[9,5],[10,5],
      ] },
    { id: 'r6', name: 'Saltwater Garden', description: 'A walled garden tucked under the library, ferns in every cell.',
      color: '#7bc48f', tilePattern: 'rushes',
      cells: [
        [0,6],[1,6],[2,6],[3,6],[4,6],[5,6],
        [0,7],[1,7],[2,7],[3,7],[4,7],[5,7],
        [0,8],[1,8],[2,8],[3,8],[4,8],[5,8],
        [0,9],[1,9],[2,9],[3,9],[4,9],[5,9],
      ] },
  ],
  doorways: ['h:1,2','v:2,4','v:7,2','h:4,5','h:1,5'],
  victim: 'char-17',
  killerSolution: 'char-14',
  solution: {
    '5,1': 'char-17', // Pell, victim, rug between two writing desks
    '4,3': 'char-14', // Finch, killer, armchair, brazier directly to his right
    '0,0': 'char-11', // Voss curled on a rug in the loft
    '1,5': 'char-03', // Quint on a rug, flanked left + right by bookshelves
    '9,2': 'char-09', // Marchand in an armchair, writing desk above
    '3,7': 'char-15', // Yew on a rug, potted ferns above + below
  },
  decorations: {
    // Every clue anchor here repeats at least once. Each suspect's
    // clue text matches two cells on its own; only unique-row /
    // unique-column + killer-alone-with-victim narrows them to one.
    // Scribes Loft: Voss canonical rug+table-right+dresser-below at
    // [0,0]. Duplicate at [2,1] (rug + table at [3,1] + dresser at
    // [2,2]) is killed by the row conflict with Pell.
    '0,0': 'rug',      '1,0': 'table',     '2,1': 'rug',
    '0,1': 'dresser',
    '0,2': 'bookshelf','2,2': 'dresser',
    // Reading Hall: Pell canonical [5,1] flanked by tables. Duplicate
    // flanked-rug at [5,5]. The table at [3,1] is the right-hand half
    // of the Voss decoy. Finch canonical [4,3] with a brazier right.
    '3,0': 'banner',   '5,0': 'mirror',    '7,0': 'banner',
    '3,1': 'table',    '4,1': 'table',     '5,1': 'rug',       '6,1': 'table',
    '4,3': 'armchair', '5,3': 'brazier',
    '4,5': 'table',    '5,5': 'rug',       '6,5': 'table',
    // Western Stacks: Quint canonical at [1,5] flanked by bookshelves
    // [0,5] / [2,5]. Position deliberately on row 5 so Quint's row
    // conflicts with the Pell duplicate at [5,5] and forces Pell to
    // [5,1].
    '0,4': 'bookshelf','2,4': 'bookshelf',
    '0,5': 'bookshelf','1,5': 'rug',       '2,5': 'bookshelf',
    // Cartographers Round: duplicate Quint rug between bookshelves at
    // [9,4]. Marchand canonical [9,2]/[9,1]; the duplicate armchair-
    // table-above at [7,2]/[7,1] is in Reading and killed by
    // killer-alone.
    '7,1': 'table',    '7,2': 'armchair',  '9,1': 'table',
    '9,2': 'armchair',
    '8,4': 'bookshelf','9,4': 'rug',       '10,4': 'bookshelf',
    '10,5': 'bookshelf',
    // Saltwater Garden: duplicate Yew rug+ferns config at [1,7]; the
    // [5,8] brazier + [4,8] armchair are the Finch decoy (killed by
    // killer-alone since Pell is in Reading).
    '0,6': 'plant',    '1,6': 'plant',
    '3,6': 'plant',    '5,6': 'plant',
    '1,7': 'rug',      '3,7': 'rug',       '5,7': 'sofa',
    '1,8': 'plant',    '3,8': 'plant',     '4,8': 'armchair',  '5,8': 'brazier',
    '0,9': 'plant',    '5,9': 'plant',
  },
  clues: {
    'char-17':
      'Dame Pell was slumped on a rug, flanked left and right by ' +
      'writing desks. She was alone in the room with the killer.',
    'char-14':
      'Mortimer Finch was curled in an armchair, with a tall brazier ' +
      'directly to his right.',
    'char-11':
      'Sister Voss was curled on a rug, with a writing desk directly ' +
      'to her right and a heavy dresser directly below.',
    'char-03':
      'Dr. Quint stood on a rug, flanked left and right by tall ' +
      'bookshelves.',
    'char-09':
      'Vivienne Marchand was curled in an armchair, with a chart table ' +
      'directly above her.',
    'char-15':
      'Constance Yew stood on a rug, with potted ferns directly above ' +
      'and below her.',
  },
};

const IRON_CITADEL = {
  id: 'lvl_sample_iron_citadel',
  code: 'm12',
  name: 'The Iron Citadel',
  difficulty: 'medium',
  size: 11,
  description:
    'In the high citadel the Marshal kept his war. He was found at dawn ' +
    'slumped across his war table, with seven of his banner captains ' +
    'still within the walls.',
  // House outline is a plus / cross: the citadel has a top arm
  // (Banner Hall, cols 2-8 rows 0-3), a wide bar across the middle
  // (cols 0-10 rows 4-7) holding West Battlement / War Room / East
  // Battlement, and a bottom arm (cols 2-8 rows 8-10) split into
  // Solar / Postern / Iron Armoury. The four corners of the bbox are
  // outside the keep.
  rooms: [
    { id: 'r2', name: 'Banner Hall', description: 'The captains hall hanging over the front gate.',
      color: '#7b9ed1', tilePattern: 'brick',
      cells: [
        [2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],
        [2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],
        [2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],
        [2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],
      ] },
    { id: 'r4', name: 'West Battlement', description: 'A flagstone watch-block on the western flank.',
      color: '#a87bc4', tilePattern: 'flagstone',
      cells: [
        [0,4],[1,4],[2,4],[3,4],
        [0,5],[1,5],[2,5],[3,5],
        [0,6],[1,6],[2,6],[3,6],
        [0,7],[1,7],[2,7],[3,7],
      ] },
    { id: 'r1', name: 'War Room', description: 'A strategy chamber with the great war table at its centre.',
      color: '#c47b7b', tilePattern: 'cobble',
      cells: [
        [4,4],[5,4],[6,4],
        [4,5],[5,5],[6,5],
        [4,6],[5,6],[6,6],
        [4,7],[5,7],[6,7],
      ] },
    { id: 'r3', name: 'East Battlement', description: 'Mirror to the west, the eastern flagstone watch-block.',
      color: '#a87bc4', tilePattern: 'flagstone',
      cells: [
        [7,4],[8,4],[9,4],[10,4],
        [7,5],[8,5],[9,5],[10,5],
        [7,6],[8,6],[9,6],[10,6],
        [7,7],[8,7],[9,7],[10,7],
      ] },
    { id: 'r6', name: 'Solar', description: 'The Marshals own retreat under the southwest spur.',
      color: '#c4937b', tilePattern: 'rushes',
      cells: [
        [2,8],[3,8],
        [2,9],[3,9],
        [2,10],[3,10],
      ] },
    { id: 'r7', name: 'Postern', description: 'A paved passage from the postern gate, the central spur of the keep.',
      color: '#7bc48f', tilePattern: 'cobble',
      cells: [
        [4,8],[5,8],[6,8],
        [4,9],[5,9],[6,9],
        [4,10],[5,10],[6,10],
      ] },
    { id: 'r5', name: 'Iron Armoury', description: 'The smithy under the southeast spur, anvil and chest.',
      color: '#c4a87b', tilePattern: 'cobble',
      cells: [
        [7,8],[8,8],
        [7,9],[8,9],
        [7,10],[8,10],
      ] },
  ],
  doorways: ['h:5,3','v:3,5','v:6,5','h:3,7','h:5,7','h:6,7'],
  victim: 'char-12',
  killerSolution: 'char-18',
  solution: {
    '4,4': 'char-12', // Hask, victim, directly left of the war table
    '6,5': 'char-18', // Knox, killer, in a chair, brazier left + cauldron below
    '3,1': 'char-19', // Imogen, armchair flanked left + right by chairs
    '1,6': 'char-06', // Glover on a rug, bookshelf above, chair below
    '8,7': 'char-08', // Ardent at a chair, bookshelf above + dresser right
    '2,8': 'char-07', // Beatrice on a rug with the only hearth below
    '5,9': 'char-20', // Felix on the only sofa, ferns flanking left + right + above
    '7,10': 'char-16', // Silas on a rug with the only anvil directly above
  },
  decorations: {
    // Every clue anchor here repeats at least once. Each suspect's
    // clue matches two cells on its own; the player narrows them to
    // a single assignment via row + column uniqueness and the
    // killer-alone-with-victim rule.
    // Banner Hall: Imogen canonical armchair-between-chairs at [3,1].
    // Duplicate armchair-between-chairs at [5,3]. Hask decoy rug +
    // table-right at [7,3] / [8,3] (killed off by killer-alone, since
    // the victim must share the killer's room).
    '5,0': 'banner',   '7,0': 'banner',
    '2,1': 'chair',    '3,1': 'armchair',  '4,1': 'chair',
    '5,2': 'rug',
    '4,3': 'chair',    '5,3': 'armchair',  '6,3': 'chair',
    '7,3': 'rug',      '8,3': 'table',
    // West Battlement: Glover canonical rug + bookshelf-above + chair-
    // below at [1,6]. Knox decoy chair + brazier-left + cauldron-below
    // at [3,5] (killed by the col-pinch between Felix and Silas).
    // Ardent decoy chair + bookshelf-above + dresser-right also at
    // [3,5], with bookshelf at [3,4] and dresser at [4,5] (War Room).
    '0,4': 'bookshelf','3,4': 'bookshelf',
    '1,5': 'bookshelf','2,5': 'brazier',   '3,5': 'chair',
    '1,6': 'rug',                          '3,6': 'cauldron',
    '1,7': 'chair',    '2,7': 'dresser',
    // War Room: Hask canonical rug + war-table-right at [4,4] / [5,4].
    // Dresser at [4,5] is the right-hand half of the Ardent decoy
    // at [3,5]. Knox canonical chair + brazier-left + cauldron-below
    // at [6,5].
    '4,4': 'rug',      '5,4': 'table',     '4,5': 'dresser',
    '5,5': 'brazier',  '6,5': 'chair',
    '6,6': 'cauldron',
    // East Battlement: Ardent canonical chair + bookshelf-above +
    // dresser-right at [8,7]. Glover decoy rug + bookshelf-above +
    // chair-below at [9,5]. Silas decoy rug + anvil-above at [10,6]
    // (killed by the chain via Glover row + Knox row).
    '7,4': 'bookshelf','9,4': 'bookshelf','10,4': 'bookshelf',
    '8,5': 'banner',                       '10,5': 'anvil',
    '8,6': 'bookshelf','9,5': 'rug',       '10,6': 'rug',
    '8,7': 'chair',    '9,6': 'chair',     '9,7': 'dresser',
    // Solar: Beatrice canonical rug + hearth-below at [2,8] / [2,9].
    '2,8': 'rug',
    '2,9': 'fireplace',
    '3,10': 'mirror',
    // Postern: Felix canonical sofa at [5,9]. Beatrice decoy rug +
    // hearth-below at [4,7] / [4,8] (the rug sits in the War Room and
    // is killed by killer-alone).
    '4,7': 'rug',      '4,8': 'fireplace',
    '5,8': 'plant',
    '4,9': 'plant',    '5,9': 'sofa',      '6,9': 'plant',
    // Iron Armoury: Silas canonical rug + anvil-above at [7,10] /
    // [7,9]. Duplicate sofa at [8,8] is the Felix decoy, killed by
    // the row conflict with Beatrice on row 8.
    '7,9': 'anvil',    '8,8': 'sofa',
    '7,10': 'rug',
  },
  clues: {
    'char-12':
      'Colonel Hask was slumped on a rug, directly to the left of a ' +
      'heavy war table. He was alone in the room with the killer.',
    'char-18':
      'Bartholomew Knox sat at a chair, with a tall brazier directly ' +
      'to his left and a heavy cauldron directly below him.',
    'char-19':
      'Imogen Sarsfield was curled in an armchair, flanked left and ' +
      'right by stiff-backed chairs.',
    'char-06':
      'The butler stood on a rug, with a bookshelf directly above him ' +
      'and a chair directly below.',
    'char-08':
      'Captain Ardent stood at a chair, directly below a bookshelf and ' +
      'directly to the left of a heavy dresser.',
    'char-07':
      'Beatrice Halloran stood on a rug, with a hearth directly below ' +
      'her.',
    'char-20':
      'Felix Drummond was thrown across a sofa, flanked left, right, ' +
      'and above by potted ferns.',
    'char-16':
      'Silas Roe stood on a rug, with an anvil directly above him.',
  },
};

// m13: T-shape grove. Top bar (cols 0-10 rows 0-5) is the main
// grove and ancestor halls; the southern stem (cols 3-7 rows 6-9)
// is the moss crypt where the dead druid was found.
const DRUIDS_GROVE = {
  id: 'lvl_sample_druids_grove',
  code: 'm13',
  name: 'The Druids Grove',
  difficulty: 'medium',
  size: 11,
  description:
    'The high druid was found cold beside the altar of the grove. ' +
    'Five others kept the long vigil tonight.',
  rooms: [
    { id: 'r1', name: 'Western Glade', description: 'A glade of potted ferns lining the western wall.',
      color: '#7bc48f', tilePattern: 'rushes',
      cells: [
        [0,0],[1,0],[2,0],
        [0,1],[1,1],[2,1],
        [0,2],[1,2],[2,2],
        [0,3],[1,3],[2,3],
        [0,4],[1,4],[2,4],
        [0,5],[1,5],[2,5],
      ] },
    { id: 'r2', name: 'Upper Grove', description: 'The novices hall, banners and stone benches.',
      color: '#c4a87b', tilePattern: 'flagstone',
      cells: [
        [3,0],[4,0],[5,0],[6,0],[7,0],
        [3,1],[4,1],[5,1],[6,1],[7,1],
        [3,2],[4,2],[5,2],[6,2],[7,2],
      ] },
    { id: 'r3', name: 'Lower Grove', description: 'The altar chamber, where the high druid lay.',
      color: '#7b5db5', tilePattern: 'cobble',
      cells: [
        [3,3],[4,3],[5,3],[6,3],[7,3],
        [3,4],[4,4],[5,4],[6,4],[7,4],
        [3,5],[4,5],[5,5],[6,5],[7,5],
      ] },
    { id: 'r4', name: 'Eastern Glade', description: 'A glade of potted ferns lining the eastern wall.',
      color: '#7bc48f', tilePattern: 'rushes',
      cells: [
        [8,0],[9,0],[10,0],
        [8,1],[9,1],[10,1],
        [8,2],[9,2],[10,2],
        [8,3],[9,3],[10,3],
        [8,4],[9,4],[10,4],
        [8,5],[9,5],[10,5],
      ] },
    { id: 'r5', name: 'Mossy Crypt', description: 'The southern stem of the grove, a moss-walled crypt.',
      color: '#5da8c4', tilePattern: 'brick',
      cells: [
        [3,6],[4,6],[5,6],[6,6],[7,6],
        [3,7],[4,7],[5,7],[6,7],[7,7],
        [3,8],[4,8],[5,8],[6,8],[7,8],
        [3,9],[4,9],[5,9],[6,9],[7,9],
      ] },
  ],
  doorways: ['v:2,2','v:7,2','h:5,2','v:2,4','v:7,4','h:5,5'],
  victim: 'char-01',
  killerSolution: 'char-10',
  solution: {
    '5,4': 'char-01', // Wraithmoor, victim, rug below the altar
    '4,5': 'char-10', // Crowe, killer, armchair flanked by cauldron and brazier
    '1,1': 'char-15', // Yew on a rug, ferns on all four sides
    '9,2': 'char-04', // Penn thrown across the only sofa in the grove
    '6,0': 'char-11', // Voss in an armchair, banner directly to her left
    '3,8': 'char-14', // Finch on a rug, chest above, dresser below
  },
  decorations: {
    // Every clue anchor here repeats at least once. Each suspect's
    // clue text matches two cells on its own; only unique-row /
    // unique-column + killer-alone-with-victim narrows them to one.
    // Western Glade: Yew canonical rug + plant-above at [1,1] / [1,0].
    '1,0': 'plant',
    '1,1': 'rug',
    '0,4': 'bookshelf',
    // Upper Grove: Voss canonical armchair + banner-left at [6,0].
    // Duplicate cauldron + armchair + brazier (Crowe decoy) at
    // [3,2] / [4,2] / [5,2], killed off by killer-alone since Crowe
    // must share the victim's room. Duplicate sofa (Penn decoy) at
    // [4,1], killed by row + col conflicts with Yew and Crowe.
    '5,0': 'banner',   '6,0': 'armchair',
    '4,1': 'sofa',
    '3,2': 'cauldron', '4,2': 'armchair',  '5,2': 'brazier',
    // Lower Grove: Wraithmoor canonical rug + stone-altar above at
    // [5,4] / [5,3]. Crowe canonical armchair + cauldron-left +
    // brazier-right at [4,5]. Voss decoy armchair + banner-left at
    // [7,4] / [6,4], killed by killer-alone (Voss can't share the
    // killer's room).
    '5,3': 'table',
    '5,4': 'rug',      '6,4': 'banner',    '7,4': 'armchair',
    '3,5': 'cauldron', '4,5': 'armchair',  '5,5': 'brazier',
    // Eastern Glade: Penn canonical sofa at [9,2]. Yew decoy rug +
    // plant-above at [9,4] / [9,3], killed by the row conflict with
    // Wraithmoor on row 4.
    '8,1': 'plant',    '9,3': 'plant',
    '9,2': 'sofa',     '9,4': 'rug',
    '10,3': 'plant',
    '8,4': 'bookshelf',
    // Mossy Crypt: Finch canonical rug + chest-above + dresser-below
    // at [3,8]. Wraithmoor decoy rug + table-above at [4,9] / [4,8],
    // killed by killer-alone since Wraithmoor must share Crowe's
    // room (Lower Grove). Finch decoy rug + chest + dresser at
    // [6,7] / [6,6] / [6,8], killed by col conflict with Voss on
    // col 6.
    '4,8': 'table',    '6,6': 'chest',
    '3,7': 'chest',    '6,7': 'rug',
    '3,8': 'rug',      '4,9': 'rug',       '6,8': 'dresser',
    '3,9': 'dresser',  '7,9': 'mirror',
  },
  clues: {
    'char-01':
      'Lady Wraithmoor was slumped on a rug, directly below a stone ' +
      'altar. She was alone in the room with the killer.',
    'char-10':
      'Professor Crowe was curled in an armchair, with a cauldron ' +
      'directly to his left and a brazier directly to his right.',
    'char-15':
      'Constance Yew stood on a rug, with a potted fern directly above ' +
      'her.',
    'char-04':
      'Reverend Penn was thrown across a sofa.',
    'char-11':
      'Sister Voss was curled in an armchair, with a banner directly ' +
      'to her left.',
    'char-14':
      'Mortimer Finch stood on a rug, with an iron-bound chest directly ' +
      'above him and a heavy dresser directly below.',
  },
};

// m14: inverted U / upside-down-U. Top bar is the Reliquary Hall
// across cols 0-10 rows 0-3; the two descending arms are the
// Western Stem (cols 0-3 rows 4-6) and the Eastern Gallery (cols
// 7-10 rows 4-6). The middle (cols 4-6 rows 4-6) is the open
// inner-courtyard, outside the crypt.
const CRYPT_OF_THE_FORSWORN = {
  id: 'lvl_sample_crypt_forsworn',
  code: 'm14',
  name: 'The Crypt of the Forsworn',
  difficulty: 'medium',
  size: 11,
  description:
    'In the crypt of the Forsworn the last keeper was found dead at ' +
    'his reliquary. Four others kept the long vigil tonight.',
  rooms: [
    { id: 'r1', name: 'Reliquary Hall', description: 'The keepers altar hall, a long flagstone bar across the top of the crypt.',
      color: '#7b5db5', tilePattern: 'flagstone',
      cells: [
        [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],
        [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],
        [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],
        [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],
      ] },
    { id: 'r2', name: 'Western Stem', description: 'A descending side vault of forbidden bestiaries.',
      color: '#5da8c4', tilePattern: 'brick',
      cells: [
        [0,4],[1,4],[2,4],[3,4],
        [0,5],[1,5],[2,5],[3,5],
        [0,6],[1,6],[2,6],[3,6],
        [0,7],[1,7],[2,7],[3,7],
        [0,8],[1,8],[2,8],[3,8],
      ] },
    { id: 'r3', name: 'Eastern Gallery', description: 'The upper eastern gallery of niches.',
      color: '#c4937b', tilePattern: 'cobble',
      cells: [
        [7,4],[8,4],[9,4],[10,4],
        [7,5],[8,5],[9,5],[10,5],
        [7,6],[8,6],[9,6],[10,6],
      ] },
    { id: 'r4', name: 'Lower Gallery', description: 'The deeper eastern gallery, anvil and forge.',
      color: '#a87bc4', tilePattern: 'brick',
      cells: [
        [7,7],[8,7],[9,7],[10,7],
        [7,8],[8,8],[9,8],[10,8],
      ] },
  ],
  doorways: ['h:1,3','h:9,3','h:8,6'],
  victim: 'char-17',
  killerSolution: 'char-12',
  solution: {
    '3,1': 'char-17', // Pell, victim, rug below the only reliquary table
    '5,2': 'char-12', // Hask, killer, armchair, brazier left, cauldron right
    '1,5': 'char-13', // Bramwell on a rug, flanked by bookshelves
    '9,4': 'char-15', // Yew on a rug, anvil above
    '8,8': 'char-10', // Crowe on the only sofa in the crypt
  },
  decorations: {
    // Every clue anchor here repeats at least once. Each suspect's
    // clue text matches two cells on its own; only unique-row /
    // unique-column + killer-alone-with-victim narrows them to one.
    // Reliquary Hall: Pell canonical rug + table-above at [3,1] /
    // [3,0]. Duplicate at [9,1] / [9,0] - killed by col conflict
    // with Yew on col 9.
    '0,0': 'banner',   '3,0': 'table',     '7,0': 'banner',   '9,0': 'table',
    '3,1': 'rug',      '9,1': 'rug',
    '4,2': 'brazier',  '5,2': 'armchair',  '6,2': 'cauldron',
    '10,0': 'mirror',
    '5,3': 'chest',
    // Western Stem: Bramwell canonical rug + bookshelves-LR at [1,5].
    // Yew decoy rug + anvil-left at [3,8] / [2,8] - killed by chain
    // conflict via Crowe (row 8) and Pell (col 3).
    '0,5': 'bookshelf','1,5': 'rug',       '2,5': 'bookshelf',
    '3,4': 'chest',
    '1,8': 'banner',   '2,8': 'anvil',     '3,8': 'rug',
    // Upper Eastern Gallery: Yew canonical rug + anvil-left at [9,4].
    // Hask decoy armchair + brazier-left + cauldron-right at [8,5],
    // killed by killer-alone since the victim is in Reliquary.
    '8,4': 'anvil',    '9,4': 'rug',
    '7,5': 'brazier',  '8,5': 'armchair',  '9,5': 'cauldron',
    '10,5': 'plant',
    // Lower Gallery: Crowe canonical sofa at [8,8]. Bramwell decoy
    // rug + bookshelves-LR at [8,7] / [7,7] / [9,7] - killed by col
    // conflict with Crowe on col 8. Crowe decoy sofa at [9,8] -
    // killed by col conflict with Yew on col 9.
    '7,7': 'bookshelf','8,7': 'rug',       '9,7': 'bookshelf',
    '8,8': 'sofa',     '9,8': 'sofa',
    '10,8': 'plant',
  },
  clues: {
    'char-17':
      'Dame Pell was slumped on a rug, directly below a reliquary ' +
      'table. She was alone in the room with the killer.',
    'char-12':
      'Colonel Hask was curled in an armchair, with a tall brazier ' +
      'directly to his left and a heavy cauldron directly to his right.',
    'char-13':
      'Ottilie Bramwell stood on a rug, flanked left and right by ' +
      'tall bookshelves.',
    'char-15':
      'Constance Yew stood on a rug, with an anvil directly to her ' +
      'left.',
    'char-10':
      'Professor Crowe was thrown across a sofa.',
  },
};

// m15: L-shape. Top bar (cols 0-10 rows 0-5) holds the Smithy +
// Apprentice Hall + Mead Cellar; the southern Forgehearth stem
// (cols 0-3 rows 6-9) tucks under the western half.
const SMITHLORDS_HALL = {
  id: 'lvl_sample_smithlord_hall',
  code: 'm15',
  name: "The Smithlord's Hall",
  difficulty: 'medium',
  size: 11,
  description:
    "The Smithlord was found dead beside his anvil. Four of his " +
    "apprentices remained in the hall tonight.",
  rooms: [
    { id: 'r1', name: 'Smithy', description: 'The Smithlords own forge, the anvil at its heart.',
      color: '#c4a87b', tilePattern: 'cobble',
      cells: [
        [0,0],[1,0],[2,0],[3,0],
        [0,1],[1,1],[2,1],[3,1],
        [0,2],[1,2],[2,2],[3,2],
        [0,3],[1,3],[2,3],[3,3],
        [0,4],[1,4],[2,4],[3,4],
        [0,5],[1,5],[2,5],[3,5],
      ] },
    { id: 'r2', name: 'Apprentice Hall', description: 'A long hall of workbenches and bedrolls.',
      color: '#c4937b', tilePattern: 'rushes',
      cells: [
        [4,0],[5,0],[6,0],
        [4,1],[5,1],[6,1],
        [4,2],[5,2],[6,2],
        [4,3],[5,3],[6,3],
        [4,4],[5,4],[6,4],
        [4,5],[5,5],[6,5],
      ] },
    { id: 'r3', name: 'Mead Cellar', description: 'A long cellar of barrels and sideboards.',
      color: '#7b9ed1', tilePattern: 'flagstone',
      cells: [
        [7,0],[8,0],[9,0],[10,0],
        [7,1],[8,1],[9,1],[10,1],
        [7,2],[8,2],[9,2],[10,2],
        [7,3],[8,3],[9,3],[10,3],
        [7,4],[8,4],[9,4],[10,4],
        [7,5],[8,5],[9,5],[10,5],
      ] },
    { id: 'r4', name: 'Forgehearth', description: 'A descending stem to the back-forge, hot and cramped.',
      color: '#a87bc4', tilePattern: 'brick',
      cells: [
        [0,6],[1,6],[2,6],[3,6],
        [0,7],[1,7],[2,7],[3,7],
        [0,8],[1,8],[2,8],[3,8],
        [0,9],[1,9],[2,9],[3,9],
      ] },
  ],
  doorways: ['v:3,2','v:6,2','h:1,5'],
  victim: 'char-12',
  killerSolution: 'char-18',
  solution: {
    '1,2': 'char-12', // Hask (Smithlord), victim, rug below the only anvil
    '2,4': 'char-18', // Knox, killer, armchair, brazier directly above
    '5,1': 'char-09', // Marchand in the only armchair in the apprentice hall
    '9,3': 'char-20', // Felix on the only sofa in the mead cellar
    '3,7': 'char-07', // Beatrice on a rug, only hearth directly to her left
  },
  decorations: {
    // Every clue anchor here repeats at least once (Hask aside - the
    // Smithy is a tight 4-wide room, so the Smithlord's slumped
    // position resolves uniquely). Each other suspect's clue text
    // matches two cells on its own; only unique-row / unique-column
    // + killer-alone-with-victim narrows them to one.
    // Smithy: Hask canonical rug + anvil-above at [1,2] / [1,1].
    // Knox canonical armchair + brazier-above at [2,4] / [2,3].
    // Marchand decoy chair at [3,4] is the left flank of Marchand's
    // alt armchair across the wall in Apprentice Hall.
    '1,0': 'banner',
    '1,1': 'anvil',    '3,1': 'bookshelf',
    '1,2': 'rug',
    '2,3': 'brazier',  '3,4': 'chair',
    '2,4': 'armchair',
    '0,5': 'chest',
    // Apprentice Hall: Marchand canonical armchair + chairs-LR at
    // [5,1] / [4,1] / [6,1]. Duplicate armchair + chairs-LR at
    // [4,4] / [3,4] / [5,4] - killed by row conflict with Knox on
    // row 4.
    '4,1': 'chair',    '5,1': 'armchair',  '6,1': 'chair',
    '4,4': 'armchair', '5,4': 'chair',     '6,4': 'bed',
    // Mead Cellar: Felix canonical sofa at [9,3]. Knox decoy
    // armchair + brazier-above at [9,5] / [9,4] - killed by
    // killer-alone (the victim Hask is in the Smithy).
    '7,1': 'dresser',  '10,1': 'mirror',
    '9,3': 'sofa',     '9,4': 'brazier',   '9,5': 'armchair',
    '8,5': 'banner',
    // Forgehearth: Beatrice canonical rug + hearth-left at [3,7] /
    // [2,7]. Duplicate at [1,8] / [0,8] - killed by col conflict
    // with Hask on col 1. Felix decoy sofa at [3,9] - killed by
    // col conflict with Beatrice on col 3.
    '0,8': 'fireplace','1,8': 'rug',
    '2,7': 'fireplace','3,7': 'rug',
    '3,8': 'chest',    '3,9': 'sofa',
    '1,9': 'mirror',
  },
  clues: {
    'char-12':
      'Hask the Smithlord was slumped on a rug, directly below an ' +
      'anvil. He was alone in the room with the killer.',
    'char-18':
      'Bartholomew Knox was curled in an armchair, with a tall brazier ' +
      'directly above him.',
    'char-09':
      'Vivienne Marchand was curled in an armchair, flanked left and ' +
      'right by stiff-backed chairs.',
    'char-20':
      'Felix Drummond was thrown across a sofa.',
    'char-07':
      'Beatrice Halloran stood on a rug, with a hearth directly to her ' +
      'left.',
  },
};

// m16: U-shape. Wide top bar (rows 0-3 cols 0-10), two long
// descending towers (cols 0-2 and cols 8-10 rows 4-10). The middle
// of the lower half (cols 3-7 rows 4-10) is the open courtyard.
const SKYBRIDGE_KEEP = {
  id: 'lvl_sample_skybridge_keep',
  code: 'm16',
  name: 'The Skybridge Keep',
  difficulty: 'medium',
  size: 11,
  description:
    'High above the cloud, the Watch-Captain was found dead in the ' +
    'great hall. Five of his archers remained on the keep tonight.',
  rooms: [
    { id: 'r1', name: 'Great Hall', description: 'A long bar of banners and benches across the top of the keep.',
      color: '#7b9ed1', tilePattern: 'flagstone',
      cells: [
        [0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],
        [0,1],[1,1],[2,1],[3,1],[4,1],[5,1],[6,1],[7,1],[8,1],[9,1],[10,1],
        [0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],
        [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],
      ] },
    { id: 'r2', name: 'Upper West Tower', description: 'The upper western descending arm, weapon-rack and watch.',
      color: '#a87bc4', tilePattern: 'brick',
      cells: [
        [0,4],[1,4],[2,4],
        [0,5],[1,5],[2,5],
        [0,6],[1,6],[2,6],
      ] },
    { id: 'r3', name: 'Lower West Tower', description: 'The lower western tower, anvil and forge.',
      color: '#c4a87b', tilePattern: 'cobble',
      cells: [
        [0,7],[1,7],[2,7],
        [0,8],[1,8],[2,8],
        [0,9],[1,9],[2,9],
        [0,10],[1,10],[2,10],
      ] },
    { id: 'r4', name: 'Upper East Tower', description: 'The upper eastern descending arm.',
      color: '#a87bc4', tilePattern: 'brick',
      cells: [
        [8,4],[9,4],[10,4],
        [8,5],[9,5],[10,5],
        [8,6],[9,6],[10,6],
      ] },
    { id: 'r5', name: 'Lower East Tower', description: 'The lower eastern tower, mirror to the lower west.',
      color: '#c4a87b', tilePattern: 'cobble',
      cells: [
        [8,7],[9,7],[10,7],
        [8,8],[9,8],[10,8],
        [8,9],[9,9],[10,9],
        [8,10],[9,10],[10,10],
      ] },
  ],
  doorways: ['h:1,3','h:9,3','h:1,6','h:9,6'],
  victim: 'char-08',
  killerSolution: 'char-06',
  solution: {
    '5,1': 'char-08', // Ardent, victim, rug below the war banner
    '4,2': 'char-06', // Glover, killer, armchair, banner directly above
    '1,5': 'char-19', // Imogen on a rug, flanked by bookshelves
    '9,6': 'char-13', // Bramwell in the only armchair on the east, brazier right
    '0,8': 'char-15', // Yew on the only rug at the bottom of the west tower
    '10,9': 'char-16', // Roe on a rug, only anvil directly to his left
  },
  decorations: {
    // Every clue anchor here repeats at least once. Each suspect's
    // clue text matches two cells on its own; only unique-row /
    // unique-column + killer-alone-with-victim narrows them to one.
    // Great Hall: Ardent canonical rug + banner-above at [5,1] /
    // [5,0]. Duplicate at [1,1] / [1,0] - killed by col conflict
    // with Imogen on col 1. Glover canonical armchair + banner-above
    // at [4,2] / [4,1]. Duplicate at [3,1] / [3,0] - killed by row
    // conflict with Ardent on row 1. Yew decoy rug + banner-right at
    // [9,2] / [10,2] - killed by killer-alone (Yew can't share the
    // killer's room).
    '1,0': 'banner',   '3,0': 'banner',    '5,0': 'banner',
    '1,1': 'rug',      '3,1': 'armchair',
    '4,1': 'banner',   '5,1': 'rug',
    '4,2': 'armchair', '9,2': 'rug',       '10,2': 'banner',
    // Upper West Tower: Imogen canonical rug + bookshelves-LR at
    // [1,5] / [0,5] / [2,5].
    '0,5': 'bookshelf','1,5': 'rug',       '2,5': 'bookshelf',
    '1,4': 'chest',
    // Lower West Tower: Yew canonical rug + banner-right at [0,8] /
    // [1,8]. Roe decoy rug + anvil-left at [1,9] / [0,9] - killed by
    // col conflict with Imogen on col 1.
    '0,7': 'dresser',
    '0,8': 'rug',      '1,8': 'banner',
    '0,9': 'anvil',    '1,9': 'rug',
    // Upper East Tower: Bramwell canonical armchair + brazier-right
    // at [9,6] / [10,6]. Imogen decoy rug + bookshelves-LR at [9,5]
    // / [8,5] / [10,5] - killed via the chain that forces Bramwell
    // off col 9 into [8,8], which then collides on row 8 with Yew.
    '8,5': 'bookshelf','9,5': 'rug',       '10,5': 'bookshelf',
    '9,4': 'chest',
    '9,6': 'armchair', '10,6': 'brazier',
    // Lower East Tower: Roe canonical rug + anvil-left at [10,9] /
    // [9,9]. Bramwell decoy armchair + brazier-right at [8,8] / [9,8]
    // - killed by row conflict with Yew on row 8.
    '8,7': 'bookshelf','8,8': 'armchair',  '9,8': 'brazier',
    '9,9': 'anvil',    '10,9': 'rug',
    '9,10': 'mirror',
  },
  clues: {
    'char-08':
      'Captain Ardent was slumped on a rug, directly below a ' +
      'war-banner stitched with the keeps sigil. He was alone in the ' +
      'room with the killer.',
    'char-06':
      'The butler was curled in an armchair, with a banner directly ' +
      'above him.',
    'char-19':
      'Imogen Sarsfield stood on a rug, flanked left and right by ' +
      'tall bookshelves.',
    'char-13':
      'Ottilie Bramwell was curled in an armchair, with a brazier ' +
      'directly to her right.',
    'char-15':
      'Constance Yew stood on a rug, with a banner directly to her ' +
      'right.',
    'char-16':
      'Silas Roe stood on a rug, with an anvil directly to his left.',
  },
};

const RAW = [
  CONSERVATORY,
  LIGHTHOUSE,
  TEA_AND_TREACHERY,
  BOOKSELLERS_LOFT,
  MAGISTRATES_STUDY,
  FERNS_AND_FELONIES,
  ATELIER,
  COASTAL_HOTEL,
  SPEAKEASY,
  WITCHSTONE_SANCTUM,
  SUNKEN_LIBRARY,
  IRON_CITADEL,
  DRUIDS_GROVE,
  CRYPT_OF_THE_FORSWORN,
  SMITHLORDS_HALL,
  SKYBRIDGE_KEEP,
];

export const SAMPLES = RAW.map((s) => ({
  key: s.id,
  code: s.code,
  name: s.name,
  description: s.description,
  difficulty: s.difficulty || null,
  build: () => {
    const lvl = JSON.parse(JSON.stringify(s));
    lvl.id = 'lvl_' + Math.random().toString(36).slice(2, 8);
    const now = Date.now();
    lvl.createdAt = now;
    lvl.updatedAt = now;
    lvl.isSample = true;
    lvl.sampleKey = s.id;
    // The raw sample carries the server-side mN code on the SAMPLES
    // manifest, but the runtime level instance must not, lvl.code is
    // the marker that distinguishes custom-shared puzzles from
    // everything else in main.js.
    delete lvl.code;
    lvl.playerPlacement = {};
    lvl.playerKiller = null;
    return lvl;
  },
}));

export function buildSampleLevel(key) {
  const entry = SAMPLES.find((s) => s.key === key) || SAMPLES[0];
  return entry.build();
}
