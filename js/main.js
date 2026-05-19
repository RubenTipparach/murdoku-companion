// Bootstrap & top-level coordination.

import {
  state,
  emptyLevel,
  activeLevel,
  rebuildCellCache,
} from './state.js';
import { loadLevels, saveLevels, loadActiveId, saveActiveId } from './storage.js';
import { renderGrid } from './grid.js';
import { loadCharacters, renderRoster } from './portraits.js';
import { loadFurniture, normalizeLevel, rollAllRooms } from './decor.js';
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
const descInput    = $('#level-description');
const editTools    = $('#edit-tools');
const playTools    = $('#play-tools');
const roomList     = $('#room-list');
const roomListPlay = $('#room-list-play');
const roster       = $('#char-roster');
const rosterPlay   = $('#char-roster-play');
const modeEditBtn  = $('#mode-edit');
const modePlayBtn  = $('#mode-play');
const levelsModal  = $('#levels-modal');
const levelsListEl = $('#levels-list');
const winToast     = $('#win-toast');
const winDetail    = $('#win-detail');
const importFile   = $('#import-file');

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
  rebuildCellCache();
  renderGrid(gridEl);
  if (state.mode === 'edit') {
    renderRoomList(roomList);
    renderRoster(roster, { mode: 'edit' });
  } else {
    renderRoomListReadonly(roomListPlay);
    renderRoster(rosterPlay, { mode: 'play' });
  }
  const lvl = activeLevel();
  nameInput.value = lvl ? lvl.name : '';
  descInput.value = lvl ? lvl.description : '';
  updateStatus();
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

// ---------- Persistence ----------

function persist() {
  saveLevels(state.levels);
  saveActiveId(state.activeId);
}

function ensureAtLeastOneLevel() {
  if (!state.levels.length) {
    const lvl = emptyLevel();
    state.levels.push(lvl);
    state.activeId = lvl.id;
    return;
  }
  if (!state.activeId || !state.levels.find((l) => l.id === state.activeId)) {
    state.activeId = state.levels[0].id;
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

// ---------- Boot ----------

async function boot() {
  state.levels = loadLevels().map(normalizeLevel);
  state.activeId = loadActiveId();
  ensureAtLeastOneLevel();

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

  $('#btn-save').addEventListener('click', () => {
    persist();
    flashStatus('Saved.');
  });

  $('#btn-levels').addEventListener('click', openLevels);
  for (const c of document.querySelectorAll('[data-close="levels"]')) c.addEventListener('click', closeLevels);
  levelsModal.addEventListener('click', (e) => {
    if (e.target === levelsModal) closeLevels();
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
  descInput.addEventListener('input', () => {
    const lvl = activeLevel();
    if (!lvl) return;
    lvl.description = descInput.value;
    lvl.updatedAt = Date.now();
  });

  // Grid event delegation.
  gridEl.addEventListener('click', onGridClick);
  gridEl.addEventListener('mousemove', onGridDrag);

  // Roster event delegation (for both edit and play roster containers).
  roster.addEventListener('click', onRosterClick);
  rosterPlay.addEventListener('click', onRosterClick);

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

  setMode('edit');
}

let flashTimer = null;
function flashStatus(msg) {
  setStatus(msg);
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(updateStatus, 1500);
}

boot();
