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
      cells: [[0,5],[1,5],[2,5],[0,6],[1,6],[2,6],[0,7],[1,7],[2,7]] },
    { id: 'r4', name: 'Hall', description: 'A patterned runner, a clock, a wall mirror.',
      color: '#a87bc4', tilePattern: 'herringbone',
      cells: [
        [3,5],[4,5],[5,5],[6,5],[7,5],[8,5],
        [3,6],[4,6],[5,6],[6,6],[7,6],[8,6],
        [3,7],[4,7],[5,7],[6,7],[7,7],[8,7],
      ] },
    { id: 'r5', name: 'Kitchen', description: 'A small worktable, a dresser, a stove.',
      color: '#c4a87b', tilePattern: 'square',
      cells: [[9,5],[10,5],[11,5],[9,6],[10,6],[11,6],[9,7],[10,7],[11,7]] },
    { id: 'r6', name: 'Garden', description: 'A single potted plant.',
      color: '#7bc48f', tilePattern: 'square',
      cells: [
        [0,9],[1,9],[2,9],[3,9],[4,9],[5,9],
        [0,10],[1,10],[2,10],[3,10],[4,10],[5,10],
        [0,11],[1,11],[2,11],[3,11],[4,11],[5,11],
      ] },
    { id: 'r7', name: 'Drawing Room', description: 'A piano, a sofa, a fireplace.',
      color: '#7b9ed1', tilePattern: 'parquet',
      cells: [
        [6,9],[7,9],[8,9],[9,9],[10,9],[11,9],
        [6,10],[7,10],[8,10],[9,10],[10,10],[11,10],
        [6,11],[7,11],[8,11],[9,11],[10,11],[11,11],
      ] },
  ],
  doorways: ['v:5,2','v:2,5','v:8,5','v:5,11'],
  victim: 'char-08',
  killerSolution: 'char-18',
  solution: {
    '1,6': 'char-08', // Captain (victim) in the only bed
    '2,5': 'char-18', // Knox (killer) at a chair above the dresser
    '0,0': 'char-01', // Eveline in the only armchair
    '10,2': 'char-06', // Glover at the long table flanked by chairs
    '9,7': 'char-13', // Bramwell at a small table beside a dresser
    '3,11': 'char-15', // Yew at the only potted plant in the building
    '8,9': 'char-17', // Genevieve at the only piano
  },
  decorations: {
    '0,0': 'armchair',
    '1,1': 'painting',
    '2,3': 'table',
    '8,0': 'gramophone',
    '9,2': 'chair',
    '10,2': 'table',
    '11,2': 'chair',
    '1,6': 'bed',
    '2,5': 'chair',
    '2,6': 'dresser',
    '0,7': 'mirror',
    '5,6': 'clock',
    '6,5': 'rug',
    '7,7': 'mirror',
    '9,7': 'table',
    '10,7': 'dresser',
    '11,5': 'safe',
    '3,11': 'plant',
    '0,9': 'bookshelf',
    '1,10': 'rug',
    '8,9': 'piano',
    '10,11': 'sofa',
    '11,9': 'bookshelf',
    '8,11': 'fireplace',
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
      'Glover was at a long table, flanked left and right by chairs.',
    'char-13':
      'Bramwell was at a small table, with a dresser directly to her right.',
    'char-15':
      'Yew was tending the only potted plant in the building.',
    'char-17':
      'Genevieve was at the keys of the only piano in the building.',
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
        [0,9],[1,9],[2,9],[3,9],
        [0,10],[1,10],[2,10],[3,10],
        [0,11],[1,11],[2,11],[3,11],
      ] },
    { id: 'r7', name: 'Vault', description: 'Lined with shelves and a heavy door.',
      color: '#9c7bc4', tilePattern: 'marble',
      cells: [
        [8,9],[9,9],[10,9],[11,9],
        [8,10],[9,10],[10,10],[11,10],
        [8,11],[9,11],[10,11],[11,11],
      ] },
  ],
  doorways: ['h:3,2','v:2,5','v:8,5'],
  victim: 'char-04',
  killerSolution: 'char-12',
  solution: {
    '1,10': 'char-04', // Penn (victim) at the piano
    '3,11': 'char-12', // Hask (killer) at a chair with painting to his left
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
    '1,10': 'piano',
    '2,11': 'painting',
    '3,11': 'chair',
    '0,11': 'lamp',
    '8,9': 'dresser',
    '11,11': 'plant',
    '10,10': 'mirror',
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
  size: 9,
  description:
    'On the eve of the Sigil Moon the coven gathered for council. Their ' +
    'high witch did not come to bear witness, the others found her cold ' +
    'at her scrying table. Six remained in the keep tonight.',
  // Six rooms tile the keep in two clusters that share walls. Shapes
  // are T, L, hollow-O, square, donut and short-L; every interior
  // edge is the boundary of two rooms, no waste cells between them.
  rooms: [
    { id: 'r1', name: 'Scrying Chamber', description: 'A T of black flagstone around the scrying table.',
      color: '#7b5db5', tilePattern: 'flagstone',
      cells: [[3,0],[4,0],[5,0],[3,1],[4,1],[5,1],[3,2],[4,2],[5,2],[4,3]] },
    { id: 'r2', name: 'Hearthroom', description: 'A long L of soot-dark cobble, hung with charm bundles.',
      color: '#c97b5d', tilePattern: 'cobble',
      cells: [[0,0],[1,0],[2,0],[0,1],[0,2],[0,3],[0,4]] },
    { id: 'r3', name: 'Reliquary', description: 'A hollow square of niched stone, lined with reliquaries of antler and ash.',
      color: '#5da8c4', tilePattern: 'brick',
      cells: [[6,0],[7,0],[8,0],[6,1],[7,1],[8,1],[6,2],[7,2],[8,2],[6,3],[8,3]] },
    { id: 'r4', name: 'Mandrake Garden', description: 'A square of black soil, mandrakes in every cell of the ring.',
      color: '#7bc48f', tilePattern: 'check',
      cells: [[0,5],[1,5],[2,5],[0,6],[1,6],[2,6],[0,7],[1,7],[2,7]] },
    { id: 'r5', name: 'Bone Sanctum', description: 'A donut-shaped chapel of antler and ash on a rush-strewn floor.',
      color: '#d1c084', tilePattern: 'rushes',
      cells: [[4,4],[5,4],[6,4],[4,5],[6,5],[4,6],[5,6],[6,6]] },
    { id: 'r6', name: 'Wellhouse', description: 'A short L of flagstone sheltering the moonwater spring.',
      color: '#7b9ed1', tilePattern: 'flagstone',
      cells: [[7,5],[8,5],[7,6],[8,6],[7,7]] },
  ],
  doorways: [],
  victim: 'char-05',
  killerSolution: 'char-04',
  solution: {
    '4,1': 'char-05', // Sable, victim, directly above the scrying table
    '3,2': 'char-04', // Penn, killer, in the only armchair in the chamber
    '0,0': 'char-13', // Bramwell, in an armchair above the only hearth
    '8,3': 'char-10', // Crowe, below a bookshelf of bestiaries
    '1,6': 'char-15', // Yew, on a rug ringed by mandrakes
    '5,4': 'char-08', // Ardent, on a sofa in the donut chapel
    '7,5': 'char-16', // Roe, on a rug with the only clock to his right
  },
  decorations: {
    // Scrying Chamber, T-shape: scrying table dead centre, Penn in
    // the only armchair to its left, Sable on the empty cell above.
    '3,0': 'bookshelf',
    '4,0': 'rug',
    '5,0': 'mirror',
    '3,1': 'rug',
    '5,1': 'lamp',
    '3,2': 'armchair',
    '4,2': 'table',
    '4,3': 'rug',
    // Hearthroom, L-shape: armchair above the only hearth, with rug
    // and bookcase and dresser further along.
    '0,0': 'armchair',
    '1,0': 'bookshelf',
    '2,0': 'dresser',
    '0,1': 'fireplace',
    '0,2': 'rug',
    '0,3': 'dresser',
    // Reliquary, hollow square: bookshelves on every wall save one,
    // with a banner and a chest among the relics.
    '6,0': 'chest',
    '7,0': 'banner',
    '8,0': 'chest',
    '6,1': 'dresser',
    '7,1': 'bookshelf',
    '8,1': 'brazier',
    '6,2': 'bookshelf',
    '7,2': 'bookshelf',
    '8,2': 'bookshelf',
    '6,3': 'cauldron',
    '8,3': 'armchair',
    // Mandrake Garden, 3x3: mandrakes in every cell save the central
    // rug. Yew stands flanked on all four orthogonal sides by plants.
    '0,5': 'plant',
    '1,5': 'plant',
    '2,5': 'plant',
    '0,6': 'plant',
    '1,6': 'rug',
    '2,6': 'plant',
    '0,7': 'plant',
    '1,7': 'plant',
    '2,7': 'plant',
    // Bone Sanctum, donut-O: only sofa in the keep, flanked by a
    // bookshelf and a chest. The hole in the middle is the antler
    // altar, not a room cell.
    '4,4': 'bookshelf',
    '5,4': 'sofa',
    '6,4': 'chest',
    '4,5': 'anvil',
    '6,5': 'bookshelf',
    '4,6': 'bookshelf',
    '5,6': 'banner',
    '6,6': 'bookshelf',
    // Wellhouse, short L: rug under the moonwater stone, the keep's
    // only standing clock to its right, ferns on the other cells.
    '7,5': 'rug',
    '8,5': 'clock',
    '7,6': 'plant',
    '8,6': 'chair',
    '7,7': 'plant',
  },
  clues: {
    'char-05':
      'Madame Sable was slumped directly above the only scrying table in ' +
      'the keep. She was alone in the room with the killer.',
    'char-04':
      'Reverend Penn was curled in an armchair, with a tall scrying ' +
      'table directly to his right and a rug directly above him.',
    'char-13':
      'Ottilie Bramwell was curled in an armchair, directly above the ' +
      'only hearth in the keep.',
    'char-10':
      'Professor Crowe was reading from an armchair, directly below a ' +
      'tall bookshelf of mouldering bestiaries.',
    'char-15':
      'Constance Yew stood on a rug, flanked on all four sides by ' +
      'potted mandrakes.',
    'char-08':
      'Captain Ardent had thrown himself across the only sofa in the ' +
      'keep, with a tall bookshelf directly to his left and an iron-' +
      'bound chest directly to his right.',
    'char-16':
      'Silas Roe stood on a rug, with the only standing clock in the ' +
      'keep directly to his right and a potted fern directly below.',
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
  // Five rooms tile a packed 11x7 grid in two bands. The Reading Hall
  // is a hollow rectangle across the top; the lower band tiles into
  // Western Stacks, Cartographers Round, and Saltwater Garden, all
  // donuts so each room has an open interior reading-pit that renders
  // as outside-the-room. The Scribes Loft anchors the upper-left
  // corner and shares its right wall with Reading Hall.
  rooms: [
    { id: 'r2', name: 'Scribes Loft', description: 'A donut of slanted desks under a clerestory.',
      color: '#c4a87b', tilePattern: 'parquet',
      cells: [[0,0],[1,0],[2,0],[0,1],[2,1],[0,2],[1,2],[2,2]] },
    { id: 'r1', name: 'Reading Hall', description: 'A hollow ribbon of reading desks running the length of the upper hall.',
      color: '#a87bc4', tilePattern: 'flagstone',
      cells: [[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0],[3,1],[10,1],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2]] },
    { id: 'r3', name: 'Western Stacks', description: 'A square of floor-to-ceiling shelves around a reading pit.',
      color: '#7b9ed1', tilePattern: 'brick',
      cells: [[0,3],[1,3],[2,3],[3,3],[0,4],[3,4],[0,5],[3,5],[0,6],[1,6],[2,6],[3,6]] },
    { id: 'r5', name: 'Cartographers Round', description: 'A square chartroom around a great open chart-pit.',
      color: '#c4937b', tilePattern: 'cobble',
      cells: [[4,3],[5,3],[6,3],[7,3],[4,4],[7,4],[4,5],[7,5],[4,6],[5,6],[6,6],[7,6]] },
    { id: 'r6', name: 'Saltwater Garden', description: 'A walled garden around a saltwater pool, ferns in every cell.',
      color: '#7bc48f', tilePattern: 'rushes',
      cells: [[8,3],[9,3],[10,3],[8,4],[10,4],[8,5],[10,5],[8,6],[9,6],[10,6]] },
  ],
  doorways: [],
  victim: 'char-17',
  killerSolution: 'char-14',
  solution: {
    '5,0': 'char-17', // Pell, victim, slumped on a rug between two desks
    '7,2': 'char-14', // Finch, killer, in an armchair flanked by desks
    '0,1': 'char-11', // Voss on a rug between bookshelves in the scribes loft
    '1,3': 'char-03', // Quint on a rug flanked by bookshelves in the western stacks
    '4,4': 'char-09', // Marchand in an armchair under a tall bookshelf
    '8,5': 'char-15', // Yew on a rug among the saltwater ferns
  },
  decorations: {
    // Scribes Loft, donut: bookshelves on the corners, a writing desk,
    // a chest, Voss on a rug between two bookshelves.
    '0,0': 'bookshelf',
    '1,0': 'table',
    '2,0': 'bookshelf',
    '0,1': 'rug',
    '2,1': 'chest',
    '0,2': 'dresser',
    '1,2': 'mirror',
    '2,2': 'bookshelf',
    // Reading Hall, hollow ribbon: desks in a long row with Pell's rug
    // wedged between two, an armchair for Finch at one of the inside
    // bookends. Brazier and banners along the back wall.
    '3,0': 'banner',
    '4,0': 'table',
    '5,0': 'rug',
    '6,0': 'table',
    '7,0': 'banner',
    '8,0': 'table',
    '9,0': 'banner',
    '10,0': 'table',
    '3,1': 'banner',
    '10,1': 'banner',
    '3,2': 'chair',
    '4,2': 'table',
    '5,2': 'chair',
    '6,2': 'table',
    '7,2': 'armchair',
    '8,2': 'table',
    '9,2': 'chair',
    '10,2': 'brazier',
    // Western Stacks, donut: bookshelves on every outer cell save
    // Quint's rug.
    '0,3': 'bookshelf',
    '1,3': 'rug',
    '2,3': 'bookshelf',
    '3,3': 'bookshelf',
    '0,4': 'bookshelf',
    '3,4': 'bookshelf',
    '0,5': 'bookshelf',
    '3,5': 'bookshelf',
    '0,6': 'bookshelf',
    '1,6': 'bookshelf',
    '2,6': 'bookshelf',
    '3,6': 'bookshelf',
    // Cartographers Round, donut: chart tables on the top wall, an
    // armchair under a bookshelf for Marchand, a cauldron of ink.
    '4,3': 'bookshelf',
    '5,3': 'table',
    '6,3': 'table',
    '7,3': 'bookshelf',
    '4,4': 'armchair',
    '7,4': 'cauldron',
    '4,5': 'chest',
    '7,5': 'table',
    '4,6': 'bookshelf',
    '5,6': 'dresser',
    '6,6': 'dresser',
    '7,6': 'bookshelf',
    // Saltwater Garden, donut: ferns in nearly every cell, a single
    // rug Yew stands on, a low chair on the wall opposite.
    '8,3': 'plant',
    '9,3': 'plant',
    '10,3': 'plant',
    '8,4': 'plant',
    '10,4': 'chair',
    '8,5': 'rug',
    '10,5': 'plant',
    '8,6': 'plant',
    '9,6': 'plant',
    '10,6': 'plant',
  },
  clues: {
    'char-17':
      'Dame Pell was slumped on a rug, flanked left and right by ' +
      'writing desks. She was alone in the room with the killer.',
    'char-14':
      'Mortimer Finch was curled in an armchair, flanked left and ' +
      'right by writing desks, with a heavy brazier directly to his ' +
      'right.',
    'char-11':
      'Sister Voss was curled on a rug, with a writing desk directly ' +
      'above her and a heavy dresser directly below.',
    'char-03':
      'Dr. Quint stood on a rug, flanked left and right by tall ' +
      'bookshelves.',
    'char-09':
      'Vivienne Marchand was curled in an armchair, directly below a ' +
      'tall bookshelf.',
    'char-15':
      'Constance Yew stood on a rug, flanked above and below by ' +
      'potted ferns.',
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
  // Seven rooms tile a 9x11 packed grid: Banner Hall as the full top
  // row, three rooms (West Battlement, War Room, East Battlement) on
  // rows 1-4, three more (Solar, Postern, Iron Armoury) on rows 5-8.
  // Every boundary between two rooms is a shared wall, no gap cells
  // between them. Donut interiors (the four open "courtyards") render
  // as outside / unreachable.
  rooms: [
    { id: 'r2', name: 'Banner Hall', description: 'A long ribbon along the front wall, hung with captains banners.',
      color: '#7b9ed1', tilePattern: 'brick',
      cells: [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],[9,0],[10,0]] },
    { id: 'r4', name: 'West Battlement', description: 'A square watch-block with an open courtyard at its heart.',
      color: '#a87bc4', tilePattern: 'flagstone',
      cells: [[0,1],[1,1],[2,1],[3,1],[0,2],[3,2],[0,3],[3,3],[0,4],[1,4],[2,4],[3,4]] },
    { id: 'r1', name: 'War Room', description: 'A solid square strategy chamber with the great war table at its centre.',
      color: '#c47b7b', tilePattern: 'cobble',
      cells: [[4,1],[5,1],[6,1],[4,2],[5,2],[6,2],[4,3],[5,3],[6,3],[4,4],[5,4],[6,4]] },
    { id: 'r3', name: 'East Battlement', description: 'Mirror to the west, a watch-block with an open courtyard at its heart.',
      color: '#a87bc4', tilePattern: 'flagstone',
      cells: [[7,1],[8,1],[9,1],[10,1],[7,2],[10,2],[7,3],[10,3],[7,4],[8,4],[9,4],[10,4]] },
    { id: 'r6', name: 'Solar', description: 'A square private quarters with an open hearth-pit at its centre.',
      color: '#c4937b', tilePattern: 'rushes',
      cells: [[0,5],[1,5],[2,5],[3,5],[0,6],[3,6],[0,7],[3,7],[0,8],[1,8],[2,8],[3,8]] },
    { id: 'r7', name: 'Postern', description: 'A solid square of paved passage from the postern gate.',
      color: '#7bc48f', tilePattern: 'cobble',
      cells: [[4,5],[5,5],[6,5],[4,6],[5,6],[6,6],[4,7],[5,7],[6,7],[4,8],[5,8],[6,8]] },
    { id: 'r5', name: 'Iron Armoury', description: 'A square smithy of standing weapons and a long workbench, anvil dead centre.',
      color: '#c4a87b', tilePattern: 'cobble',
      cells: [[7,5],[8,5],[9,5],[10,5],[7,6],[10,6],[7,7],[10,7],[7,8],[8,8],[9,8],[10,8]] },
  ],
  doorways: [],
  victim: 'char-12',
  killerSolution: 'char-18',
  solution: {
    '4,1': 'char-12', // Hask, victim, directly left of the war table
    '6,3': 'char-18', // Knox, killer, in a chair across the chamber from him
    '2,0': 'char-19', // Imogen in the only armchair on the banner ribbon
    '0,2': 'char-06', // Glover on a rug on the west battlement
    '7,4': 'char-08', // Ardent stood at a chair on the east battlement
    '1,5': 'char-07', // Beatrice on a rug in the solar
    '5,6': 'char-20', // Felix slung across the only sofa in the citadel
    '9,8': 'char-16', // Silas on a rug in the armoury
  },
  decorations: {
    // Banner Hall, ribbon along the top wall. Painted banners, a
    // long line of chairs, the captains armchair near the start.
    '0,0': 'banner',
    '1,0': 'chair',
    '2,0': 'armchair',
    '3,0': 'chair',
    '4,0': 'banner',
    '5,0': 'chair',
    '6,0': 'banner',
    '7,0': 'chair',
    '8,0': 'banner',
    '9,0': 'chair',
    '10,0': 'banner',
    // West Battlement, donut: chairs, a bookshelf, a standing clock,
    // a chest, and the only rug on this side. Glover on the rug.
    '0,1': 'bookshelf',
    '1,1': 'chair',
    '2,1': 'chest',
    '3,1': 'bookshelf',
    '0,2': 'rug',
    '3,2': 'clock',
    '0,3': 'chair',
    '3,3': 'chair',
    '0,4': 'bookshelf',
    '1,4': 'bed',
    '2,4': 'dresser',
    '3,4': 'bookshelf',
    // War Room, 3x4 solid: war table at [5,2], chairs flanking, a
    // rug below the table, a brazier in one corner. Hask stands
    // directly left of the war table. Knox sits in a chair across.
    '4,1': 'rug',
    '5,1': 'table',
    '6,1': 'chair',
    '4,2': 'chair',
    '5,2': 'rug',
    '6,2': 'banner',
    '4,3': 'rug',
    '5,3': 'brazier',
    '6,3': 'chair',
    '4,4': 'chair',
    '5,4': 'chair',
    '6,4': 'cauldron',
    // East Battlement, donut: mirror of the west. Bookshelves on the
    // outer wall, a clock, a chest. Ardent stands at the chair on
    // the bottom edge.
    '7,1': 'bookshelf',
    '8,1': 'chest',
    '9,1': 'chair',
    '10,1': 'bookshelf',
    '7,2': 'chair',
    '10,2': 'clock',
    '7,3': 'bookshelf',
    '10,3': 'chair',
    '7,4': 'chair',
    '8,4': 'dresser',
    '9,4': 'bed',
    '10,4': 'bookshelf',
    // Solar, donut: hearth at the top of the open courtyard, the
    // only bed in the citadel, an armchair, a rug for Beatrice.
    '0,5': 'fireplace',
    '1,5': 'rug',
    '2,5': 'dresser',
    '3,5': 'bookshelf',
    '0,6': 'chair',
    '3,6': 'bed',
    '0,7': 'dresser',
    '3,7': 'mirror',
    '0,8': 'chest',
    '1,8': 'chair',
    '2,8': 'dresser',
    '3,8': 'armchair',
    // Postern, 3x4 solid: rugs and ferns, the only sofa, a couple
    // of banners along the passage walls.
    '4,5': 'plant',
    '5,5': 'banner',
    '6,5': 'plant',
    '4,6': 'rug',
    '5,6': 'sofa',
    '6,6': 'rug',
    '4,7': 'plant',
    '5,7': 'rug',
    '6,7': 'plant',
    '4,8': 'banner',
    '5,8': 'plant',
    '6,8': 'banner',
    // Iron Armoury, donut: the only anvil in the citadel, dresser
    // and chest, bookshelves of weapon-treatises, Silas at the rug.
    '7,5': 'bookshelf',
    '8,5': 'anvil',
    '9,5': 'dresser',
    '10,5': 'bookshelf',
    '7,6': 'chair',
    '10,6': 'chest',
    '7,7': 'chair',
    '10,7': 'chair',
    '7,8': 'bookshelf',
    '8,8': 'dresser',
    '9,8': 'rug',
    '10,8': 'bookshelf',
  },
  clues: {
    'char-12':
      'Colonel Hask was slumped on a rug directly to the left of the ' +
      'only war table in the citadel. He was alone in the room with ' +
      'the killer.',
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
      'Beatrice Halloran stood on a rug, with a smouldering hearth ' +
      'directly to her left and a dresser directly to her right.',
    'char-20':
      'Felix Drummond was thrown across the only sofa in the citadel, ' +
      'with a rug directly to his left and a rug directly to his right.',
    'char-16':
      'Silas Roe stood on a rug, directly above a heavy dresser and ' +
      'directly to the right of a chair.',
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
