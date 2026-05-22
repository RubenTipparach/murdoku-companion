// User-uploaded portraits, furniture, and carpet patterns.
//
// Custom assets live in localStorage as data URLs (PNG/JPG/GIF). They are
// merged into the runtime character roster and furniture palette after the
// built-in manifests have loaded, so authored levels can reference them by
// id exactly like shipped assets.
//
// Asset kinds:
//   portrait  - a suspect portrait. Max 128x128 pixels.
//   furniture - a small sprite, drawn as a centred decoration like the
//               shipped chair / table / piano sprites.
//   carpet    - a full-cell floor covering, drawn underneath any furniture
//               or portrait. Useful for patterned rugs and bespoke tiles.
//
// All three kinds share the same dimension cap (128x128) so the UI can
// validate uniformly and so users can't blow out their localStorage quota
// with one giant upload.

const LS_KEY = 'murdoku.customAssets';
const MAX_DIM = 128;
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

function emptyStore() {
  return { portraits: [], furniture: [], carpets: [] };
}

function readStore() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    const store = emptyStore();
    if (Array.isArray(parsed.portraits)) store.portraits = parsed.portraits;
    if (Array.isArray(parsed.furniture)) store.furniture = parsed.furniture;
    if (Array.isArray(parsed.carpets))   store.carpets   = parsed.carpets;
    return store;
  } catch {
    return emptyStore();
  }
}

function writeStore(store) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(store));
    return true;
  } catch (err) {
    console.warn('Failed to persist custom assets:', err);
    return false;
  }
}

let store = emptyStore();

export function loadCustomAssets() {
  store = readStore();
  return store;
}

export function getCustomPortraits() { return store.portraits.slice(); }
export function getCustomFurniture() { return store.furniture.slice(); }
export function getCustomCarpets()   { return store.carpets.slice(); }

// Merged list of all user furniture entries (regular + carpets). Carpets
// carry a `cover: true` flag so the grid renderer knows to lay them flat
// across the cell instead of as a small centred sprite.
export function getCustomDecor() {
  return [
    ...store.furniture.map((f) => ({ ...f, cover: false })),
    ...store.carpets.map((c)   => ({ ...c, cover: true })),
  ];
}

function makeId(prefix) {
  return prefix + '_' + Math.random().toString(36).slice(2, 8);
}

// Read a File into a data URL, then verify its decoded pixel dimensions
// don't exceed MAX_DIM in either axis. Resolves to { dataUrl, width,
// height } or rejects with an Error whose message is safe to show.
function readImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('No file selected.'));
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return reject(new Error('Only PNG, JPEG, GIF, or WebP images are supported.'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected file.'));
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const img = new Image();
      img.onerror = () => reject(new Error('That file does not appear to be a valid image.'));
      img.onload = () => {
        if (img.naturalWidth > MAX_DIM || img.naturalHeight > MAX_DIM) {
          reject(new Error(
            `Image is ${img.naturalWidth}x${img.naturalHeight}. The maximum size is ${MAX_DIM}x${MAX_DIM} pixels.`,
          ));
          return;
        }
        resolve({ dataUrl, width: img.naturalWidth, height: img.naturalHeight });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

export async function addPortrait({ file, name, description }) {
  const { dataUrl } = await readImageFile(file);
  const entry = {
    id: makeId('user-p'),
    name: (name || '').trim() || 'Unnamed suspect',
    description: (description || '').trim(),
    portrait: dataUrl,
    custom: true,
  };
  store.portraits.push(entry);
  if (!writeStore(store)) {
    store.portraits.pop();
    throw new Error('Could not save. localStorage may be full, try removing some assets first.');
  }
  return entry;
}

export async function addFurniture({ file, name }) {
  const { dataUrl } = await readImageFile(file);
  const entry = {
    id: makeId('user-f'),
    name: (name || '').trim() || 'Custom furniture',
    sprite: dataUrl,
    custom: true,
  };
  store.furniture.push(entry);
  if (!writeStore(store)) {
    store.furniture.pop();
    throw new Error('Could not save. localStorage may be full, try removing some assets first.');
  }
  return entry;
}

export async function addCarpet({ file, name }) {
  const { dataUrl } = await readImageFile(file);
  const entry = {
    id: makeId('user-c'),
    name: (name || '').trim() || 'Custom carpet',
    sprite: dataUrl,
    custom: true,
  };
  store.carpets.push(entry);
  if (!writeStore(store)) {
    store.carpets.pop();
    throw new Error('Could not save. localStorage may be full, try removing some assets first.');
  }
  return entry;
}

export function removeCustomAsset(kind, id) {
  const key = kind === 'portrait' ? 'portraits'
    : kind === 'furniture' ? 'furniture'
    : kind === 'carpet' ? 'carpets'
    : null;
  if (!key) return false;
  const before = store[key].length;
  store[key] = store[key].filter((a) => a.id !== id);
  if (store[key].length === before) return false;
  writeStore(store);
  return true;
}

// ---------- Modal rendering ----------

function makeRow({ id, name, src, kind, onRemove }) {
  const li = document.createElement('li');
  li.className = 'asset-row';

  const img = document.createElement('img');
  img.src = src;
  img.alt = name;
  img.className = kind === 'carpet' ? 'asset-thumb carpet' : 'asset-thumb';
  li.appendChild(img);

  const meta = document.createElement('div');
  meta.className = 'asset-meta';
  const title = document.createElement('strong');
  title.textContent = name;
  meta.appendChild(title);
  const sub = document.createElement('span');
  sub.className = 'hint';
  sub.textContent = id;
  meta.appendChild(sub);
  li.appendChild(meta);

  const del = document.createElement('button');
  del.className = 'icon danger';
  del.textContent = '×';
  del.title = 'Remove this asset';
  del.addEventListener('click', () => {
    if (confirm(`Remove "${name}"?`)) onRemove();
  });
  li.appendChild(del);

  return li;
}

function setError(el, msg) {
  el.textContent = msg || '';
  el.classList.toggle('hidden', !msg);
}

// Render the three lists + the three upload forms inside the modal body.
// `onChange` is called after every add/remove so the host page can rebuild
// the roster and re-render the grid.
export function renderCustomAssetsModal(container, { onChange }) {
  container.innerHTML = '';

  const intro = document.createElement('p');
  intro.className = 'hint';
  intro.textContent =
    'Upload your own art. Max 128x128 pixels per image. PNG keeps pixel art crisp; transparent backgrounds work best for portraits and furniture. Stored locally in this browser.';
  container.appendChild(intro);

  const sections = [
    {
      kind: 'portrait',
      title: 'Suspect portraits',
      list: store.portraits,
      srcKey: 'portrait',
      hasDescription: true,
      onAdd: (payload) => addPortrait(payload),
    },
    {
      kind: 'furniture',
      title: 'Furniture',
      list: store.furniture,
      srcKey: 'sprite',
      hasDescription: false,
      onAdd: (payload) => addFurniture(payload),
    },
    {
      kind: 'carpet',
      title: 'Carpet patterns',
      list: store.carpets,
      srcKey: 'sprite',
      hasDescription: false,
      onAdd: (payload) => addCarpet(payload),
    },
  ];

  for (const sec of sections) {
    const block = document.createElement('section');
    block.className = 'asset-section';

    const h = document.createElement('h3');
    h.textContent = sec.title;
    block.appendChild(h);

    // Existing items.
    const ul = document.createElement('ul');
    ul.className = 'asset-list';
    if (!sec.list.length) {
      const empty = document.createElement('p');
      empty.className = 'hint';
      empty.textContent = 'None yet.';
      block.appendChild(empty);
    } else {
      for (const item of sec.list) {
        ul.appendChild(makeRow({
          id: item.id,
          name: item.name,
          src: item[sec.srcKey],
          kind: sec.kind,
          onRemove: () => {
            removeCustomAsset(sec.kind, item.id);
            if (onChange) onChange();
            renderCustomAssetsModal(container, { onChange });
          },
        }));
      }
      block.appendChild(ul);
    }

    // Upload form.
    const form = document.createElement('div');
    form.className = 'asset-form';

    const nameLabel = document.createElement('label');
    nameLabel.textContent = 'Name';
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = sec.kind === 'portrait' ? 'e.g. Mrs Hawthorne'
      : sec.kind === 'furniture' ? 'e.g. Lectern'
      : 'e.g. Persian rug';
    nameLabel.appendChild(nameInput);
    form.appendChild(nameLabel);

    let descInput = null;
    if (sec.hasDescription) {
      const descLabel = document.createElement('label');
      descLabel.textContent = 'Description';
      descInput = document.createElement('textarea');
      descInput.rows = 2;
      descInput.placeholder = 'A short flavour line, shown on the suspect card.';
      descLabel.appendChild(descInput);
      form.appendChild(descLabel);
    }

    const fileLabel = document.createElement('label');
    fileLabel.textContent = 'Image (max 128x128)';
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = ACCEPTED_TYPES.join(',');
    fileLabel.appendChild(fileInput);
    form.appendChild(fileLabel);

    const err = document.createElement('p');
    err.className = 'asset-error hidden';
    form.appendChild(err);

    const submit = document.createElement('button');
    submit.textContent = 'Upload';
    submit.addEventListener('click', async () => {
      setError(err, '');
      const file = fileInput.files && fileInput.files[0];
      if (!file) {
        setError(err, 'Pick an image file first.');
        return;
      }
      try {
        await sec.onAdd({
          file,
          name: nameInput.value,
          description: descInput ? descInput.value : '',
        });
        if (onChange) onChange();
        renderCustomAssetsModal(container, { onChange });
      } catch (e) {
        setError(err, e.message || String(e));
      }
    });
    form.appendChild(submit);

    block.appendChild(form);
    container.appendChild(block);
  }
}
