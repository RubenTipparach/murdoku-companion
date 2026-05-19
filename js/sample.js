// The shipped sample mysteries. Each is data only — read-only by default
// (cloned for editing).
//
// CLUE AUTHORING RULES (see CLAUDE.md):
//   • Never name a room in a clue. Use furniture and relative positions.
//   • Every victim's clue ends with "alone in the room with the killer".
//   • The killer's clue never says "same room as the victim" — deduction
//     happens via furniture proximity, not direct reveal.

const CONSERVATORY = {
  id: 'lvl_sample_conservatory',
  name: 'The Crimson Conservatory',
  description:
    'Lady Wraithmoor is dead among her orchids. Five guests were in the ' +
    'house tonight, and each one swears they were elsewhere.\n\n' +
    'HOW TO PLAY\n' +
    'Drag each suspect into the cell where they actually stood at the ' +
    'moment of the murder, then mark one of them as the killer. The ' +
    'Check button unlocks once every suspect is placed and a killer is ' +
    'named.\n\n' +
    'THE PUZZLE RULES\n' +
    '• No two suspects share a row or a column. Everyone is in a unique ' +
    'row and a unique column.\n' +
    '• The victim was alone in a room with the killer. Every other ' +
    'suspect was in a different room.\n' +
    '• Clues use furniture and relative position only, never room names. ' +
    'Work out where each suspect stood, then whoever ends up in the ' +
    'victim\'s room is the killer.',
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
    '3,1': 'char-01', // Eveline (victim) — orchid table in the greenhouse
    '2,2': 'char-10', // Crowe (killer) — chair near the orchid table
    '1,3': 'char-03', // Marisol — armchair surrounded by bookshelves
    '7,4': 'char-06', // Glover — long dinner table flanked by chairs
    '4,5': 'char-15', // Yew — rug in the narrow corridor
    '5,8': 'char-04', // Penn — at the piano
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
  name: 'Midnight at the Lighthouse',
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
    '4,1': 'char-08', // Captain (victim) — at the lantern
    '3,2': 'char-19', // Imogen (killer) — at a plant near the lantern
    '1,7': 'char-13', // Ottilie — kitchen table
    '5,8': 'char-17', // Genevieve — the only bed
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
    '2,4': 'char-05', // Sable (victim) — on the sofa
    '3,2': 'char-09', // Vivienne (killer) — beside a painting + lamp
    '6,3': 'char-20', // Felix — at the piano
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
    '1,7': 'char-02', // Brand (victim) — the bed
    '2,6': 'char-16', // Silas (killer) — chair next to the dresser by the bed
    '3,4': 'char-14', // Mortimer — armchair flanked by bookshelves
    '7,2': 'char-18', // Knox — at the desk
    '8,5': 'char-12', // Hask — beside a dresser in the storage area
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
  name: "The Magistrate's Study",
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
  name: 'Ferns and Felonies',
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
  name: 'The Atelier',
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
  name: 'The Coastal Hotel',
  size: 12,
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
  name: 'The Speakeasy',
  size: 12,
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
];

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
