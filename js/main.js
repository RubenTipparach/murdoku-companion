// Bootstrap & top-level coordination.

import {
  state,
  emptyLevel,
  activeLevel,
  rebuildCellCache,
  placeCharacterAt,
  cloneActiveLevel,
} from './state.js';
import {
  loadLevels, saveLevels, loadActiveId, saveActiveId,
  loadCompletedSamples, saveCompletedSamples,
} from './storage.js';
import { renderGrid } from './grid.js';
import { loadCharacters, renderRoster } from './portraits.js';
import { loadFurniture, normalizeLevel, rollAllRooms } from './decor.js';
import { SAMPLES, buildSampleLevel } from './sample.js';
import { victimIcon, killerIcon } from './icons.js';
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
    renderRoster(roster, { level: lvl });
    renderClueEditor(clueEditorEl);
  } else {
    renderRoomListReadonly(roomListPlay);
    // In play mode only show suspects who actually appear in the level's
    // solution, no point cluttering the roster with people the case never
    // names. Derived live so it picks up edits.
    const suspectIds = lvl ? [...new Set(Object.values(lvl.solution))] : [];
    renderRoster(rosterPlay, { filterIds: suspectIds, level: lvl });
    renderSelectedClue(selectedClue);
    updateCheckGate();
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

// Play mode: render a floating clue bubble pointed at the currently-
// selected suspect tile. Hidden when no suspect is selected.
function renderSelectedClue(container) {
  const lvl = activeLevel();
  const charId = state.selectedCharacterId;
  if (!lvl || !charId || state.mode !== 'play') {
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
  const isVictim = lvl.victim === charId;
  const isKiller = lvl.playerKiller === charId;
  // Killer marking is the player's accusation. The victim cannot also be
  // the killer (they died), so we hide the button on the victim row.
  const killerBtn = isVictim
    ? ''
    : `<button class="kill-btn ${isKiller ? 'on' : ''}" data-kill="1">${killerIcon()} <span>${isKiller ? 'Unmark killer' : 'Mark as killer'}</span></button>`;
  const inlineBadge = isVictim
    ? `<span class="inline-badge">${victimIcon()}</span> `
    : isKiller
      ? `<span class="inline-badge">${killerIcon()}</span> `
      : '';
  container.classList.remove('hidden');
  container.innerHTML = `
    <img src="${char.portrait}" alt="${char.name}" />
    <div class="clue-body">
      <strong>${inlineBadge}${escapeHtml(char.name)}</strong>
      <p class="char-desc">${escapeHtml(char.description || '')}</p>
      <p class="clue-text">${escapeHtml(clueText)}</p>
      ${killerBtn}
    </div>
  `;
  const killBtn = container.querySelector('[data-kill]');
  if (killBtn) {
    killBtn.addEventListener('click', () => {
      lvl.playerKiller = isKiller ? null : charId;
      lvl.updatedAt = Date.now();
      persist();
      rerender();
    });
  }
  requestAnimationFrame(() => positionSelectedClue(charId));
}

// Gate the Check button: disabled until every solution cell has a
// player-placement AND a killer has been marked. Tooltip explains why.
function updateCheckGate() {
  const btn = $('#btn-check');
  if (!btn) return;
  const lvl = activeLevel();
  if (!lvl || state.mode !== 'play') {
    btn.disabled = true;
    btn.title = '';
    return;
  }
  const solutionCount = Object.keys(lvl.solution).length;
  const placedCount = Object.keys(lvl.playerPlacement).length;
  const placedAll = solutionCount > 0 && placedCount >= solutionCount;
  const killerNamed = !!lvl.playerKiller;
  const ready = placedAll && killerNamed;
  btn.disabled = !ready;
  btn.title = ready
    ? 'Submit your accusation.'
    : !placedAll
      ? `Place every suspect first (${placedCount}/${solutionCount} placed).`
      : 'Mark one suspect as the killer 🔪 first.';
}

// Anchor the clue bubble below the selected suspect tile, clamped to the
// viewport, with the bubble's arrow pointing at the tile's center.
function positionSelectedClue(charId) {
  const container = selectedClue;
  if (container.classList.contains('hidden')) return;
  const tile = document.querySelector(
    `#char-roster-play .char-tile[data-char-id="${charId}"]`,
  );
  if (!tile) return;
  const rect = tile.getBoundingClientRect();
  const bubbleWidth = Math.min(container.offsetWidth || 320, 360);
  const tileCenter = rect.left + rect.width / 2;
  const margin = 8;
  let left = tileCenter - bubbleWidth / 2;
  if (left < margin) left = margin;
  if (left + bubbleWidth > window.innerWidth - margin) {
    left = window.innerWidth - bubbleWidth - margin;
  }
  container.style.top = (rect.bottom + 10) + 'px';
  container.style.left = left + 'px';
  // Place the bubble's arrow so it points at the tile's actual center.
  const arrowOffset = Math.max(
    12,
    Math.min(bubbleWidth - 26, tileCenter - left - 7),
  );
  container.style.setProperty('--arrow-x', arrowOffset + 'px');
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

// Populate the start-menu sample cards from SAMPLES, plus a Continue card
// when there's an active level to resume.
function renderStartSamples() {
  startSamples.innerHTML = '';
  for (const s of SAMPLES) {
    const done = state.completedSamples.has(s.key);
    const card = document.createElement('button');
    card.className = 'start-card' + (done ? ' completed' : '');
    card.dataset.action = 'play-sample';
    card.dataset.sampleKey = s.key;
    const icon = done ? '✅' : '🔍';
    card.innerHTML = `
      <h3>${icon} ${escapeHtml(s.name)}</h3>
      <p>${escapeHtml(s.description)}</p>
    `;
    startSamples.appendChild(card);
  }
  renderStartContinue();
}

function renderStartContinue() {
  const continueEl = $('#start-continue');
  const headingEl = $('#start-continue-heading');
  continueEl.innerHTML = '';
  const lvl = state.levels.find((l) => l.id === state.activeId) || state.levels[0];
  if (!lvl) {
    continueEl.classList.add('hidden');
    headingEl.classList.add('hidden');
    return;
  }
  continueEl.classList.remove('hidden');
  headingEl.classList.remove('hidden');
  const card = document.createElement('button');
  const done =
    (lvl.sampleKey && state.completedSamples.has(lvl.sampleKey)) || !!lvl.completed;
  card.className = 'start-card' + (done ? ' completed' : '');
  card.dataset.action = 'continue';
  card.dataset.continueId = lvl.id;
  const subtitle = lvl.isSample
    ? 'Sample, resumes in Play mode.'
    : 'Your last-edited level, resumes in Edit mode.';
  const icon = done ? '✅' : '↻';
  card.innerHTML = `
    <h3>${icon} ${escapeHtml(lvl.name || 'Untitled level')}</h3>
    <p>${escapeHtml(subtitle)}</p>
  `;
  continueEl.appendChild(card);
}

// ---------- Levels modal ----------

function renderLevelsList() {
  levelsListEl.innerHTML = '';
  for (const lvl of state.levels) {
    const li = document.createElement('li');
    if (lvl.id === state.activeId) li.classList.add('active');

    const title = document.createElement('div');
    title.className = 'title';
    const done =
      (lvl.sampleKey && state.completedSamples.has(lvl.sampleKey)) || !!lvl.completed;
    title.textContent = (done ? '✅ ' : '') + (lvl.name || '(untitled)');
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

function openStartMenu() {
  // The menu is the page when it's up. There is no X, the user picks
  // one of the cards to leave. Refresh the dynamic cards every time so
  // the Continue card matches current state.
  renderStartSamples();
  startModal.classList.remove('hidden');
  document.body.classList.add('menu-active');
}
function closeStartMenu() {
  startModal.classList.add('hidden');
  document.body.classList.remove('menu-active');
}

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
    case 'continue': {
      // Resume the saved level under its current id. Default mode: play
      // for samples (case file feel), edit for everything else.
      const id = opts.continueId;
      const lvl = state.levels.find((l) => l.id === id);
      if (!lvl) break;
      state.activeId = id;
      persist();
      setMode(lvl.isSample ? 'play' : 'edit');
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
  state.completedSamples = new Set(loadCompletedSamples());
  // We *never* auto-load a level on boot. The start menu is always the
  // first thing the user sees, even on returning visits. If there's a
  // previously-active level it's reachable via the menu's Continue card.
  const hasLevels = state.levels.length > 0;
  // Clear activeId so nothing renders behind the modal, the menu is the
  // whole UI until the user picks something.
  if (!hasLevels) state.activeId = null;

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

  // Topbar room-name toggle. Pure view setting, does not modify the level.
  $('#btn-toggle-names').addEventListener('click', () => {
    state.showRoomNames = !state.showRoomNames;
    $('#btn-toggle-names').classList.toggle('active', state.showRoomNames);
    rerender();
  });

  // Topbar fade-guests toggle, drops the opacity of placed portraits so
  // the player can read the tile and furniture under them.
  $('#btn-toggle-guests').addEventListener('click', () => {
    state.transparentGuests = !state.transparentGuests;
    $('#btn-toggle-guests').classList.toggle('active', state.transparentGuests);
    document.body.classList.toggle('guests-transparent', state.transparentGuests);
  });

  // Row/col X-ray, overlays an X on every cell in the row or column of
  // each placed suspect. Cells where two suspects share a row or column
  // get a red X (rule violation).
  $('#btn-toggle-rowcol').addEventListener('click', () => {
    state.showRowColMarks = !state.showRowColMarks;
    $('#btn-toggle-rowcol').classList.toggle('active', state.showRowColMarks);
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

  // Start menu wiring. There is no close affordance, the user picks a
  // card to leave. The topbar Menu button reopens the menu mid-session.
  $('#btn-menu').addEventListener('click', () => openStartMenu());

  // Help modal, accessible from both the start menu footer and the topbar.
  const helpModal = $('#help-modal');
  const openHelp = () => helpModal.classList.remove('hidden');
  const closeHelp = () => helpModal.classList.add('hidden');
  $('#btn-help').addEventListener('click', openHelp);
  $('#btn-help-topbar').addEventListener('click', openHelp);
  for (const c of document.querySelectorAll('[data-close="help"]')) c.addEventListener('click', closeHelp);
  helpModal.addEventListener('click', (e) => { if (e.target === helpModal) closeHelp(); });

  // Reset all data, wipes every saved level and progress flag. Confirmed
  // twice because there is no undo.
  $('#btn-reset-all').addEventListener('click', () => {
    if (!confirm('This will erase every saved level, all progress, and any in-flight clues you have written. Continue?')) return;
    if (!confirm('Last chance, this cannot be undone. Reset everything?')) return;
    try {
      localStorage.removeItem('murdoku.levels');
      localStorage.removeItem('murdoku.activeId');
      localStorage.removeItem('murdoku.completedSamples');
    } catch {}
    // Reload to start clean, boot() will run again with empty state.
    location.reload();
  });
  renderStartSamples();
  startModal.addEventListener('click', (e) => {
    const card = e.target.closest('.start-card');
    if (!card) return;
    handleStartAction(card.dataset.action, {
      sampleKey: card.dataset.sampleKey,
      continueId: card.dataset.continueId,
    });
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
      const lvl = activeLevel();
      // Record completion. Sample levels go into a per-install Set keyed
      // by sampleKey so the green check stays on the menu even after the
      // user loads a fresh copy of the same sample. Custom levels just
      // get a sticky boolean on the level itself.
      if (lvl) {
        if (lvl.sampleKey) {
          state.completedSamples.add(lvl.sampleKey);
          saveCompletedSamples([...state.completedSamples]);
        }
        lvl.completed = true;
        lvl.updatedAt = Date.now();
        persist();
      }
      winDetail.textContent = lvl && lvl.name ? `You solved "${lvl.name}".` : 'You solved this case.';
      winToast.classList.remove('hidden', 'bad');
      // Outline only the cells the player actually placed, all correct on a win.
      highlightCells({ correct: result.correct, wrong: [] });
    } else {
      let msg;
      const hasWrong = result.wrong.length > 0;
      const hasMissing = result.missingCount > 0;
      if (hasWrong && result.killerWrong) {
        msg = `${result.wrong.length} placement(s) wrong, and the killer is wrong too.`;
      } else if (hasWrong) {
        msg = `${result.wrong.length} placement(s) wrong. Green ✓ red ✕ outlines show which.`;
      } else if (hasMissing && result.killerWrong) {
        msg = `Still ${result.missingCount} suspect(s) left to place, and the killer is wrong.`;
      } else if (hasMissing) {
        msg = `Place the remaining ${result.missingCount} suspect(s) first.`;
      } else if (result.killerWrong) {
        msg = 'Everyone is in the right cell, but the killer is wrong. Look again at who shared a room with the victim.';
      } else {
        msg = 'No solution has been set for this level yet.';
      }
      winDetail.textContent = msg;
      winToast.classList.remove('hidden');
      winToast.classList.add('bad');
      // Outline only placed cells: green if right, red if wrong. NEVER
      // outline cells the player hasn't placed on, they're not feedback.
      highlightCells({ correct: result.correct, wrong: result.wrong });
    }
  });
  for (const c of document.querySelectorAll('[data-close="toast"]')) {
    c.addEventListener('click', () => {
      winToast.classList.add('hidden');
      highlightCells({});
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

  // Reposition the clue bubble when the page scrolls or resizes so it
  // stays pinned to its tile.
  const reposition = () => {
    if (state.mode === 'play' && state.selectedCharacterId) {
      positionSelectedClue(state.selectedCharacterId);
    }
  };
  window.addEventListener('scroll', reposition, { passive: true });
  window.addEventListener('resize', reposition);

  // Auto-save every 4s if something changed.
  let lastSerialized = '';
  setInterval(() => {
    const cur = JSON.stringify(state.levels);
    if (cur !== lastSerialized) {
      lastSerialized = cur;
      persist();
    }
  }, 4000);

  // The start menu is the entire UI on boot. We deliberately do NOT
  // render the game yet, the user must pick a level first.
  openStartMenu();

  // Mobile browsers aggressively restore the page from the back-forward
  // cache (bfcache) when the user returns to the tab. boot() does NOT run
  // again in that case, script state is restored as-is, so the start
  // screen would not reappear. Re-open it on every bfcache restore so
  // the menu really is the first thing every visit.
  window.addEventListener('pageshow', (ev) => {
    if (ev.persisted) {
      openStartMenu();
    }
  });
}

let flashTimer = null;
function flashStatus(msg) {
  setStatus(msg);
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(updateStatus, 1500);
}

boot();
