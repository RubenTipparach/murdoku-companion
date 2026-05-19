// Bootstrap & top-level coordination.

import {
  state,
  emptyLevel,
  activeLevel,
  rebuildCellCache,
  placeCharacterAt,
  cloneActiveLevel,
} from './state.js';
import { loadLevels, saveLevels, loadActiveId, saveActiveId } from './storage.js';
import { renderGrid } from './grid.js';
import { loadCharacters, renderRoster } from './portraits.js';
import { loadFurniture, normalizeLevel, rollAllRooms } from './decor.js';
import { SAMPLES, buildSampleLevel } from './sample.js';
import {
  selectTool,
  createRoom,
  handleCellClickEdit,
  renderRoomList,
  renderRoomListReadonly,
} from './editor.js';
import {
  handleCellClickPlay,
  checkSolution,
  highlightCells,
  clearPlayBoard,
} from './play.js';

// ---------- DOM refs ----------

const $ = (sel) => document.querySelector(sel);
const gridEl       = $('#grid');
const statusEl     = $('#status');
const nameInput    = $('#level-name');
const editTools    = $('#edit-tools');
const playTools    = $('#play-tools');
const roomList     = $('#room-list');
const roomListPlay = $('#room-list-play');
const roster       = $('#char-roster');
const rosterPlay   = $('#char-roster-play');
const clueEditorEl = $('#clue-editor');
const selectedClue = $('#selected-clue');
const modeEditBtn  = $('#mode-edit');
const modePlayBtn  = $('#mode-play');
const startModal   = $('#start-modal');
const startSamples = $('#start-samples');
const levelsModal  = $('#levels-modal');
const levelsListEl = $('#levels-list');
const winToast     = $('#win-toast');
const winDetail    = $('#win-detail');
const importFile   = $('#import-file');
const levelSelect  = $('#level-select');
const sampleBanner = $('#sample-banner');
const metaTextarea = $('#level-description');
const metaReadonly = $('#meta-readonly');
const metaHeading  = $('#meta-heading');

// ---------- Mode / tool switching ----------

function setMode(mode) {
  state.mode = mode;
  modeEditBtn.classList.toggle('active', mode === 'edit');
  modePlayBtn.classList.toggle('active', mode === 'play');
  editTools.classList.toggle('hidden', mode !== 'edit');
  playTools.classList.toggle('hidden', mode !== 'play');
  // Reset transient selection between modes.
  state.selectedCharacterId = null;
  rerender();
}

function setStatus(msg) {
  statusEl.textContent = msg;
}

// ---------- Render ----------

function rerender() {
  // FLIP: snapshot portrait positions before the DOM is rebuilt so we can
  // animate any suspect that moved to a new cell.
  const oldPositions = new Map();
  for (const p of gridEl.querySelectorAll('.portrait[data-char-id]')) {
    oldPositions.set(p.dataset.charId, p.getBoundingClientRect());
  }

  rebuildCellCache();
  renderGrid(gridEl);
  const lvl = activeLevel();
  const isSample = !!(lvl && lvl.isSample);
  if (state.mode === 'edit') {
    renderRoomList(roomList);
    renderRoster(roster, {});
    renderClueEditor(clueEditorEl);
  } else {
    renderRoomListReadonly(roomListPlay);
    // In play mode only show suspects who actually appear in the level's
    // solution — no point cluttering the roster with people the case never
    // names. Derived live so it picks up edits.
    const suspectIds = lvl ? [...new Set(Object.values(lvl.solution))] : [];
    renderRoster(rosterPlay, { filterIds: suspectIds });
    renderSelectedClue(selectedClue);
  }
  nameInput.value = lvl ? lvl.name : '';
  metaTextarea.value = lvl ? lvl.description : '';

  // Lock metadata fields in play mode AND on sample levels in any mode so
  // a player can't accidentally rename / re-describe the case, and a
  // sample stays pristine until cloned.
  const lockMetadata = state.mode === 'play' || isSample;
  nameInput.readOnly = lockMetadata;
  // In play mode swap the description textarea for a read-only paragraph
  // so it's visibly not editable. In edit mode show the textarea (locked
  // via readOnly if this is a sample).
  if (state.mode === 'play') {
    metaTextarea.classList.add('hidden');
    metaReadonly.classList.remove('hidden');
    metaReadonly.textContent = (lvl && lvl.description) || '(No description.)';
    metaHeading.textContent = 'Case file';
  } else {
    metaTextarea.classList.remove('hidden');
    metaReadonly.classList.add('hidden');
    metaTextarea.readOnly = isSample;
    metaHeading.textContent = 'Level description';
  }

  // Sample banner sits above the grid in edit mode only.
  sampleBanner.classList.toggle('hidden', !(isSample && state.mode === 'edit'));
  // Lock the edit sidebar interactions when on a sample.
  editTools.classList.toggle('locked', isSample);

  renderLevelSelect();
  updateStatus();

  // FLIP "play" step: for each portrait that existed before, translate it
  // back to its old position with no transition, then drop the transform
  // so the CSS transition slides it to the new spot.
  requestAnimationFrame(() => {
    for (const p of gridEl.querySelectorAll('.portrait[data-char-id]')) {
      const oldRect = oldPositions.get(p.dataset.charId);
      if (!oldRect) continue;
      const newRect = p.getBoundingClientRect();
      const dx = oldRect.left - newRect.left;
      const dy = oldRect.top - newRect.top;
      if (dx === 0 && dy === 0) continue;
      p.style.transition = 'none';
      p.style.transform = `translate(${dx}px, ${dy}px)`;
      // Force reflow so the browser registers the displaced start state.
      p.getBoundingClientRect();
      p.style.transition = '';
      p.style.transform = '';
    }
  });
}

// ---------- Clue rendering ----------

function renderClueEditor(container) {
  container.innerHTML = '';
  const lvl = activeLevel();
  if (!lvl) return;
  const placedIds = [...new Set(Object.values(lvl.solution))];
  if (!placedIds.length) {
    const empty = document.createElement('p');
    empty.className = 'hint';
    empty.textContent = 'No suspects placed in the solution yet.';
    container.appendChild(empty);
    return;
  }
  for (const charId of placedIds) {
    const char = state.characters.find((c) => c.id === charId);
    if (!char) continue;
    const row = document.createElement('div');
    row.className = 'clue-row';
    row.innerHTML = `
      <img src="${char.portrait}" alt="${char.name}" />
      <div class="clue-body">
        <strong>${escapeHtml(char.name)}</strong>
        <p class="char-desc">${escapeHtml(char.description || '')}</p>
        <textarea rows="2" placeholder="e.g. Was at the piano in the same room as Yew."></textarea>
      </div>
    `;
    const ta = row.querySelector('textarea');
    ta.value = lvl.clues[charId] || '';
    ta.addEventListener('input', () => {
      lvl.clues[charId] = ta.value;
      lvl.updatedAt = Date.now();
    });
    container.appendChild(row);
  }
}

// Play mode: render a clue bubble for the currently-selected suspect.
// Renders nothing (hidden) when no suspect is selected, or when the level
// doesn't have a clue for them.
function renderSelectedClue(container) {
  const lvl = activeLevel();
  const charId = state.selectedCharacterId;
  if (!lvl || !charId) {
    container.classList.add('hidden');
    container.innerHTML = '';
    return;
  }
  const char = state.characters.find((c) => c.id === charId);
  if (!char) {
    container.classList.add('hidden');
    return;
  }
  const clueText = lvl.clues[charId] || '(No clue has been written for this suspect.)';
  container.classList.remove('hidden');
  container.innerHTML = `
    <img src="${char.portrait}" alt="${char.name}" />
    <div class="clue-body">
      <strong>${escapeHtml(char.name)}</strong>
      <p class="char-desc">${escapeHtml(char.description || '')}</p>
      <p class="clue-text">${escapeHtml(clueText)}</p>
    </div>
  `;
}

// Repopulate the topbar level-select dropdown to mirror state.levels.
function renderLevelSelect() {
  levelSelect.innerHTML = '';
  for (const lvl of state.levels) {
    const opt = document.createElement('option');
    opt.value = lvl.id;
    opt.textContent = (lvl.isSample ? '🔒 ' : '') + (lvl.name || '(untitled)');
    if (lvl.id === state.activeId) opt.selected = true;
    levelSelect.appendChild(opt);
  }
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function updateStatus() {
  const lvl = activeLevel();
  if (!lvl) { setStatus('No level loaded.'); return; }
  if (state.mode === 'edit') {
    const tool = state.tool;
    const roomCount = lvl.rooms.length;
    const solCount = Object.keys(lvl.solution).length;
    setStatus(`Edit · tool: ${tool} · rooms: ${roomCount} · solution cells: ${solCount}`);
  } else {
    const placed = Object.keys(lvl.playerPlacement).length;
    const sol = Object.keys(lvl.solution).length;
    setStatus(`Play · placed ${placed} / ${sol} suspects`);
  }
}

// ---------- Grid click delegation ----------

function onGridClick(ev) {
  const target = ev.target;
  let cellEl = target.closest('.cell');
  if (!cellEl) return;
  const x = +cellEl.dataset.x;
  const y = +cellEl.dataset.y;

  if (state.mode === 'edit') {
    // Doorway tool: clicks come in on .edge-pick overlays.
    if (target.classList.contains('edge-pick')) {
      handleCellClickEdit(x, y, target.dataset.side);
    } else {
      handleCellClickEdit(x, y, null);
    }
  } else {
    handleCellClickPlay(x, y);
  }
  rerender();
}

function onGridDrag(ev) {
  // Right-click or shift+drag could erase; we'll only support paint-drag while
  // a primary button is held in paint/erase tool.
  if (!(ev.buttons & 1)) return;
  if (state.mode !== 'edit') return;
  if (state.tool !== 'paint' && state.tool !== 'erase') return;
  const cellEl = ev.target.closest('.cell');
  if (!cellEl) return;
  const x = +cellEl.dataset.x;
  const y = +cellEl.dataset.y;
  handleCellClickEdit(x, y, null);
  rerender();
}

// ---------- Roster click delegation ----------

function onRosterClick(ev) {
  const tile = ev.target.closest('.char-tile');
  if (!tile) return;
  const id = tile.dataset.charId;
  state.selectedCharacterId = state.selectedCharacterId === id ? null : id;
  rerender();
}

// ---------- Drag and drop ----------

function onRosterDragStart(ev) {
  const tile = ev.target.closest('.char-tile');
  if (!tile) return;
  const id = tile.dataset.charId;
  if (!id) return;
  // Firefox requires setData to actually start the drag.
  ev.dataTransfer.setData('text/x-murdoku-character', id);
  ev.dataTransfer.setData('text/plain', id);
  ev.dataTransfer.effectAllowed = 'copy';
}

function onGridDragOver(ev) {
  const cellEl = ev.target.closest('.cell');
  if (!cellEl) return;
  // Only accept drops over in-room cells.
  if (!cellEl.classList.contains('in-room')) return;
  ev.preventDefault();
  ev.dataTransfer.dropEffect = 'copy';
  if (!cellEl.classList.contains('drag-over')) cellEl.classList.add('drag-over');
}

function onGridDragLeave(ev) {
  const cellEl = ev.target.closest('.cell');
  if (cellEl) cellEl.classList.remove('drag-over');
}

function onGridDrop(ev) {
  const cellEl = ev.target.closest('.cell');
  if (!cellEl) return;
  ev.preventDefault();
  cellEl.classList.remove('drag-over');
  const charId =
    ev.dataTransfer.getData('text/x-murdoku-character') ||
    ev.dataTransfer.getData('text/plain');
  if (!charId) return;
  const x = +cellEl.dataset.x;
  const y = +cellEl.dataset.y;
  if (placeCharacterAt(x, y, charId)) rerender();
}

// ---------- Persistence ----------

function persist() {
  saveLevels(state.levels);
  saveActiveId(state.activeId);
}

function ensureAtLeastOneLevel({ seedSample = false } = {}) {
  if (!state.levels.length) {
    const lvl = seedSample ? buildSampleLevel() : emptyLevel();
    state.levels.push(lvl);
    state.activeId = lvl.id;
    return;
  }
  if (!state.activeId || !state.levels.find((l) => l.id === state.activeId)) {
    state.activeId = state.levels[0].id;
  }
}

// Load a fresh copy of the named sample (or the default if no key supplied).
// The new copy gets a unique id and is marked isSample so the editor locks it
// until the player clones.
function loadSampleAsNewLevel(sampleKey) {
  const lvl = buildSampleLevel(sampleKey);
  state.levels.push(lvl);
  state.activeId = lvl.id;
  state.selectedRoomId = null;
}

// Populate the start-menu sample cards from SAMPLES.
function renderStartSamples() {
  startSamples.innerHTML = '';
  for (const s of SAMPLES) {
    const card = document.createElement('button');
    card.className = 'start-card';
    card.dataset.action = 'play-sample';
    card.dataset.sampleKey = s.key;
    card.innerHTML = `
      <h3>🔍 ${escapeHtml(s.name)}</h3>
      <p>${escapeHtml(s.description)}</p>
    `;
    startSamples.appendChild(card);
  }
}

// ---------- Levels modal ----------

function renderLevelsList() {
  levelsListEl.innerHTML = '';
  for (const lvl of state.levels) {
    const li = document.createElement('li');
    if (lvl.id === state.activeId) li.classList.add('active');

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = lvl.name || '(untitled)';
    li.appendChild(title);

    const meta = document.createElement('div');
    meta.className = 'meta';
    const d = new Date(lvl.updatedAt);
    meta.textContent = `${lvl.rooms.length} rooms · ${Object.keys(lvl.solution).length} clues · ${d.toLocaleDateString()}`;
    li.appendChild(meta);

    const load = document.createElement('button');
    load.textContent = 'Load';
    load.addEventListener('click', () => {
      state.activeId = lvl.id;
      state.selectedRoomId = null;
      persist();
      rerender();
      closeLevels();
    });
    li.appendChild(load);

    const dup = document.createElement('button');
    dup.textContent = 'Duplicate';
    dup.addEventListener('click', () => {
      const copy = JSON.parse(JSON.stringify(lvl));
      copy.id = 'lvl_' + Math.random().toString(36).slice(2, 8);
      copy.name = `${lvl.name} (copy)`;
      copy.isSample = false; // duplicates are always editable
      copy.updatedAt = Date.now();
      copy.createdAt = Date.now();
      state.levels.push(copy);
      persist();
      renderLevelsList();
    });
    li.appendChild(dup);

    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.className = 'danger';
    del.addEventListener('click', () => {
      if (!confirm(`Delete "${lvl.name}"?`)) return;
      state.levels = state.levels.filter((l) => l.id !== lvl.id);
      ensureAtLeastOneLevel();
      persist();
      rerender();
      renderLevelsList();
    });
    li.appendChild(del);

    levelsListEl.appendChild(li);
  }
}

function openLevels() {
  renderLevelsList();
  levelsModal.classList.remove('hidden');
}
function closeLevels() { levelsModal.classList.add('hidden'); }

// ---------- Start menu ----------

function openStartMenu({ closable } = { closable: true }) {
  const closeBtn = $('#start-close');
  if (closeBtn) closeBtn.hidden = !closable;
  startModal.classList.remove('hidden');
}
function closeStartMenu() { startModal.classList.add('hidden'); }

function handleStartAction(action, opts = {}) {
  switch (action) {
    case 'play-sample': {
      loadSampleAsNewLevel(opts.sampleKey);
      persist();
      setMode('play');
      break;
    }
    case 'edit-mode': {
      // If we have no levels yet, create a blank one to give the author a
      // canvas to start on.
      if (!state.levels.length) {
        const lvl = emptyLevel();
        state.levels.push(lvl);
        state.activeId = lvl.id;
      }
      persist();
      setMode('edit');
      break;
    }
  }
  closeStartMenu();
  rerender();
}

// ---------- Boot ----------

async function boot() {
  state.levels = loadLevels().map(normalizeLevel);
  state.activeId = loadActiveId();
  // First-visit users hit the start menu instead of auto-loading the sample,
  // so they aren't spoiled by seeing the solution in edit mode.
  const firstVisit = state.levels.length === 0;
  if (!firstVisit) ensureAtLeastOneLevel();

  await Promise.all([loadCharacters(), loadFurniture()]);

  // Tool button delegation.
  for (const btn of document.querySelectorAll('.tool')) {
    btn.addEventListener('click', () => selectTool(btn.dataset.tool));
  }

  modeEditBtn.addEventListener('click', () => setMode('edit'));
  modePlayBtn.addEventListener('click', () => setMode('play'));

  $('#btn-new-room').addEventListener('click', () => {
    createRoom();
    rerender();
  });

  $('#btn-roll-all').addEventListener('click', () => {
    rollAllRooms();
    rerender();
  });

  // Topbar Clone (also exposed on the in-grid sample banner).
  const cloneCurrent = () => {
    const cloned = cloneActiveLevel();
    if (!cloned) return;
    persist();
    setMode('edit');
    rerender();
    flashStatus(`Cloned to "${cloned.name}".`);
  };
  $('#btn-clone').addEventListener('click', cloneCurrent);
  $('#btn-clone-banner').addEventListener('click', cloneCurrent);

  // Topbar level select.
  levelSelect.addEventListener('change', () => {
    const id = levelSelect.value;
    if (!id || id === state.activeId) return;
    state.activeId = id;
    state.selectedRoomId = null;
    persist();
    rerender();
  });

  $('#btn-save').addEventListener('click', () => {
    persist();
    flashStatus('Saved.');
  });

  $('#btn-levels').addEventListener('click', openLevels);
  for (const c of document.querySelectorAll('[data-close="levels"]')) c.addEventListener('click', closeLevels);
  levelsModal.addEventListener('click', (e) => {
    if (e.target === levelsModal) closeLevels();
  });

  // Start menu wiring.
  $('#btn-menu').addEventListener('click', () => openStartMenu({ closable: true }));
  for (const c of document.querySelectorAll('[data-close="start"]')) c.addEventListener('click', closeStartMenu);
  startModal.addEventListener('click', (e) => {
    // Backdrop click closes only when the X is visible (i.e. not on first
    // visit, where we want the user to make a real choice).
    if (e.target === startModal && !$('#start-close').hidden) closeStartMenu();
  });
  // Dynamic sample cards + the static "edit mode" card.
  renderStartSamples();
  startModal.addEventListener('click', (e) => {
    const card = e.target.closest('.start-card');
    if (!card) return;
    handleStartAction(card.dataset.action, { sampleKey: card.dataset.sampleKey });
  });

  $('#btn-new-level').addEventListener('click', () => {
    const lvl = emptyLevel();
    state.levels.push(lvl);
    state.activeId = lvl.id;
    state.selectedRoomId = null;
    persist();
    rerender();
    renderLevelsList();
  });

  $('#btn-load-sample').addEventListener('click', () => {
    loadSampleAsNewLevel();
    persist();
    rerender();
    renderLevelsList();
  });

  $('#btn-export').addEventListener('click', () => {
    const lvl = activeLevel();
    if (!lvl) return;
    const blob = new Blob([JSON.stringify(lvl, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(lvl.name || 'level').replace(/[^a-z0-9-_]+/gi, '_')}.murdoku.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  $('#btn-import').addEventListener('click', () => importFile.click());
  importFile.addEventListener('change', async () => {
    const file = importFile.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const lvl = normalizeLevel(JSON.parse(text));
      if (!lvl || !lvl.id || !Array.isArray(lvl.rooms)) throw new Error('not a level');
      // If id collides, regenerate.
      if (state.levels.some((l) => l.id === lvl.id)) {
        lvl.id = 'lvl_' + Math.random().toString(36).slice(2, 8);
      }
      lvl.updatedAt = Date.now();
      state.levels.push(lvl);
      state.activeId = lvl.id;
      persist();
      rerender();
      flashStatus(`Imported "${lvl.name || lvl.id}".`);
    } catch (err) {
      alert('Could not import that file: ' + err.message);
    }
    importFile.value = '';
  });

  $('#btn-check').addEventListener('click', () => {
    const result = checkSolution();
    if (!result) return;
    if (result.win) {
      winDetail.textContent = activeLevel().name ? `You solved "${activeLevel().name}".` : 'You solved this case.';
      winToast.classList.remove('hidden', 'bad');
      highlightCells([]);
      // Mark all solution cells as correct.
      for (const cellEl of document.querySelectorAll('.cell')) {
        const k = `${cellEl.dataset.x},${cellEl.dataset.y}`;
        if (activeLevel().solution[k]) cellEl.classList.add('correct');
      }
    } else {
      winDetail.textContent =
        result.wrong.length === 0
          ? 'No solution has been set for this level yet.'
          : `${result.wrong.length} cell(s) are off. Keep at it.`;
      winToast.classList.remove('hidden');
      winToast.classList.add('bad');
      highlightCells(result.wrong);
    }
  });
  for (const c of document.querySelectorAll('[data-close="toast"]')) {
    c.addEventListener('click', () => {
      winToast.classList.add('hidden');
      highlightCells([]);
    });
  }

  $('#btn-reset-play').addEventListener('click', () => {
    clearPlayBoard();
    persist();
    rerender();
  });

  nameInput.addEventListener('input', () => {
    const lvl = activeLevel();
    if (!lvl) return;
    lvl.name = nameInput.value;
    lvl.updatedAt = Date.now();
  });
  metaTextarea.addEventListener('input', () => {
    const lvl = activeLevel();
    if (!lvl) return;
    lvl.description = metaTextarea.value;
    lvl.updatedAt = Date.now();
  });

  // Grid event delegation.
  gridEl.addEventListener('click', onGridClick);
  gridEl.addEventListener('mousemove', onGridDrag);
  gridEl.addEventListener('dragover', onGridDragOver);
  gridEl.addEventListener('dragleave', onGridDragLeave);
  gridEl.addEventListener('drop', onGridDrop);

  // Roster event delegation (for both edit and play roster containers).
  roster.addEventListener('click', onRosterClick);
  rosterPlay.addEventListener('click', onRosterClick);
  roster.addEventListener('dragstart', onRosterDragStart);
  rosterPlay.addEventListener('dragstart', onRosterDragStart);

  // Inter-module re-render trigger.
  document.addEventListener('murdoku:rerender', rerender);

  // Auto-save every 4s if something changed.
  let lastSerialized = '';
  setInterval(() => {
    const cur = JSON.stringify(state.levels);
    if (cur !== lastSerialized) {
      lastSerialized = cur;
      persist();
    }
  }, 4000);

  // First-visit users see the start menu (not closable — they must pick).
  // Returning users land in edit mode on their last-active level.
  if (firstVisit) {
    setMode('edit'); // initial paint will be hidden behind the modal
    openStartMenu({ closable: false });
  } else {
    setMode('edit');
  }
}

let flashTimer = null;
function flashStatus(msg) {
  setStatus(msg);
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(updateStatus, 1500);
}

boot();
