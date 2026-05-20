// Bootstrap & top-level coordination.

import {
  state,
  emptyLevel,
  activeLevel,
  activeProfile,
  rebuildCellCache,
  placeCharacterAt,
  cloneActiveLevel,
} from './state.js';
import {
  loadLevels, saveLevels, loadActiveId, saveActiveId,
  loadCompletedSamples, saveCompletedSamples,
  loadProfiles, saveProfiles,
  loadActiveProfileName, saveActiveProfileName,
  generateToken,
} from './storage.js';
import {
  apiAvailable, probeServer, claimProfile,
  shareLevel, updateSharedLevel, getSharedLevel, bumpPlays,
  recordCompletion, getLeaderboard, shareUrlFor,
  getLevelCompletions, getPlayers, getPlayerProfile, getPuzzles,
  getRankings, issueDeviceCode,
} from './api.js';
import { validateLevel } from './validator.js';
import { renderGrid } from './grid.js';
import { loadCharacters, renderRoster } from './portraits.js';
import { loadFurniture, normalizeLevel, rollAllRooms } from './decor.js';
import { SAMPLES, buildSampleLevel } from './sample.js';
import { victimIcon, killerIcon, profileIcon } from './icons.js';
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
const startProfile = $('#start-profile');
const startGated   = $('#start-gated');
const startLibrary = $('#start-library');
const startAuthored = $('#start-authored');
const startFilterTabs = $('#start-filter-tabs');
const levelsModal  = $('#levels-modal');
const levelsListEl = $('#levels-list');
const winToast     = $('#win-toast');
const winDetail    = $('#win-detail');
const winLeaderboard = $('#win-leaderboard');
const winViewLeaderboard = $('#win-view-leaderboard');
const leaderboardModal = $('#leaderboard-modal');
const lbModalTitle = $('#lb-modal-title');
const lbTable = $('#lb-table');
const lbTbody = $('#lb-tbody');
const lbExtraCol = $('#lb-extra-col');
const lbLoading = $('#lb-loading');
const lbEmpty = $('#lb-empty');
const lbError = $('#lb-error');
const playersModal = $('#players-modal');
const playersModalTitle = $('#players-modal-title');
const playersList = $('#players-list');
const playersLoading = $('#players-loading');
const playersError = $('#players-error');
const playersBack = $('#players-back');
const puzzlesModal = $('#puzzles-modal');
const puzzlesList = $('#puzzles-list');
const puzzlesLoading = $('#puzzles-loading');
const puzzlesError = $('#puzzles-error');
const puzzlesHint = $('#puzzles-hint');
const shareModal   = $('#share-modal');
const shareErrors  = $('#share-errors');
const shareSuccess = $('#share-success');
const sharePending = $('#share-pending');
const shareUrlInput = $('#share-url');
const shareCopyStatus = $('#share-copy-status');
const importFile   = $('#import-file');
const levelSelect  = $('#level-select');
const sampleBanner = $('#sample-banner');
const metaTextarea = $('#level-description');
const metaReadonly = $('#meta-readonly');
const metaHeading  = $('#meta-heading');
const difficultyChip = $('#difficulty-chip');

const DIFFICULTY_LABELS = {
  // New primary tiers. Easy is the shipped on-ramp set; medium is the
  // fantasy batch with non-rectangular rooms; hard is reserved for the
  // forthcoming ability + house-modifier content.
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  // Legacy tier names still recognised so user-authored levels saved
  // before the taxonomy change keep their chip + ordering. The shipped
  // samples no longer use any of these.
  tutorial: 'Tutorial',
  gentle: 'Gentle',
  standard: 'Standard',
  tricky: 'Tricky',
  expert: 'Expert',
  fiendish: 'Fiendish',
};

// Difficulty tier rendering order in the library. Tiers not present in
// the current sample roster are silently skipped.
const DIFFICULTY_ORDER = [
  'easy', 'medium', 'hard',
  'tutorial', 'gentle', 'standard', 'tricky', 'expert', 'fiendish',
];

// Profile name rules. Mirrors the server-side regex planned for Phase 12,
// so a locally-created name is portable when the API ships.
const PROFILE_NAME_RE = /^[A-Za-z0-9_-]{3,20}$/;
const RESERVED_NAMES = new Set(['admin', 'system', 'anonymous', 'guest', 'murdoku']);

function validateProfileName(name) {
  if (!name) return 'Pick a name.';
  if (!PROFILE_NAME_RE.test(name)) return 'Use 3 to 20 letters, numbers, _ or -.';
  if (RESERVED_NAMES.has(name.toLowerCase())) return 'That name is reserved. Try another.';
  return null;
}

// ---------- Mode / tool switching ----------

function setMode(mode) {
  // Refuse to enter Edit on a shipped sample. The Edit-mode button is
  // already disabled in rerender(), this is defense in depth for any
  // code path that still tries (e.g. older saved activeId pointing at
  // a sample that booted directly into edit).
  if (mode === 'edit') {
    const lvl = activeLevel();
    if (lvl && lvl.isSample) {
      flashStatus('Clone this sample first to edit it.');
      mode = 'play';
    }
  }
  state.mode = mode;
  modeEditBtn.classList.toggle('active', mode === 'edit');
  modePlayBtn.classList.toggle('active', mode === 'play');
  editTools.classList.toggle('hidden', mode !== 'edit');
  playTools.classList.toggle('hidden', mode !== 'play');
  // Reset transient selection between modes.
  state.selectedCharacterId = null;
  // Entering play mode (re-)starts the per-session clock and mistake count.
  if (mode === 'play') startPlaySession(activeLevel());
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

  const diff = lvl && lvl.difficulty;
  if (diff && DIFFICULTY_LABELS[diff]) {
    difficultyChip.textContent = DIFFICULTY_LABELS[diff];
    difficultyChip.className = `difficulty-chip diff-${diff}`;
  } else {
    difficultyChip.className = 'difficulty-chip hidden';
    difficultyChip.textContent = '';
  }

  // Sample banner sits above the grid in edit mode only.
  sampleBanner.classList.toggle('hidden', !(isSample && state.mode === 'edit'));
  // Lock the edit sidebar interactions when on a sample.
  editTools.classList.toggle('locked', isSample);
  // The Edit-mode toggle is disabled on samples so a player can't
  // accidentally enter a locked editor (and end up confused about
  // why typing does nothing). Cloning is the only path to a
  // writable copy of a shipped puzzle.
  modeEditBtn.disabled = isSample;
  modeEditBtn.title = isSample
    ? 'This is a shipped sample. Clone it to enable editing.'
    : 'Edit this house';

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
  // The dropdown is "your levels" + custom shared puzzles. Shipped
  // samples are never editable, so we don't expose them here, the
  // player picks samples from the start menu's library instead. If
  // the current active level is a sample we still include it so the
  // dropdown has a valid selected option while the player is on it.
  for (const lvl of state.levels) {
    if (lvl.isSample && lvl.id !== state.activeId) continue;
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
    const guesses = playSession && playSession.levelId === lvl.id
      ? ` · guesses ${playSession.mistakes}`
      : '';
    setStatus(`Play · placed ${placed} / ${sol} suspects${guesses}`);
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
// until the player clones. If an instance for this sample already exists in
// state.levels (e.g. the player previously played and didn't clone), we
// reuse it and reset the play state instead of stacking another one, so
// "Your levels" / the levels modal / the dropdown never see duplicates.
function loadSampleAsNewLevel(sampleKey) {
  const existing = state.levels.find((l) => l.isSample && l.sampleKey === sampleKey);
  if (existing) {
    existing.playerPlacement = {};
    existing.playerKiller = null;
    existing.updatedAt = Date.now();
    state.activeId = existing.id;
    state.selectedRoomId = null;
    return;
  }
  const lvl = buildSampleLevel(sampleKey);
  state.levels.push(lvl);
  state.activeId = lvl.id;
  state.selectedRoomId = null;
}

// One-time cleanup, called from boot(). Older saves stacked a new
// instance every time a sample was played, so the levels modal and
// the topbar dropdown can be cluttered with phantom duplicates of
// the same shipped puzzle. Consolidate down to one instance per
// sampleKey (keeping the most recently updated, so any in-flight
// placements survive).
function dedupeSamplePlayInstances() {
  const bySample = new Map();
  const survivors = [];
  for (const lvl of state.levels) {
    if (!lvl.isSample || !lvl.sampleKey) {
      survivors.push(lvl);
      continue;
    }
    const prior = bySample.get(lvl.sampleKey);
    if (!prior || (lvl.updatedAt || 0) > (prior.updatedAt || 0)) {
      bySample.set(lvl.sampleKey, lvl);
    }
  }
  for (const lvl of bySample.values()) survivors.push(lvl);
  if (survivors.length !== state.levels.length) {
    // Keep activeId pointing at a surviving level, fall back to null
    // so boot lands on the start menu rather than a dangling id.
    const survivorIds = new Set(survivors.map((l) => l.id));
    if (state.activeId && !survivorIds.has(state.activeId)) state.activeId = null;
    state.levels = survivors;
    saveLevels(state.levels);
    saveActiveId(state.activeId);
  }
}

// Sample puzzles are SOURCE-DEFINED, not user data. The rooms,
// decorations, clues, solution, name, difficulty and grid size all
// live in js/sample.js; the runtime instance only owns the player's
// progress (where they've placed suspects, who they've accused, and
// whether they've finished). On boot we walk every cached sample
// instance and refresh its program-defined fields from SAMPLES so
// shipped-sample edits propagate even when the player has the level
// sitting in their localStorage.
function refreshSampleLevelsFromSource() {
  let dirty = false;
  for (let i = 0; i < state.levels.length; i++) {
    const lvl = state.levels[i];
    if (!lvl.isSample || !lvl.sampleKey) continue;
    const sample = SAMPLES.find((s) => s.key === lvl.sampleKey);
    if (!sample) continue;
    // Build a fresh sample-data view; carry over the runtime id and
    // the player's progress so the user doesn't lose work in flight.
    const fresh = sample.build();
    fresh.id = lvl.id;
    fresh.playerPlacement = lvl.playerPlacement || {};
    fresh.playerKiller = lvl.playerKiller || null;
    fresh.completed = !!lvl.completed;
    fresh.createdAt = lvl.createdAt || fresh.createdAt;
    fresh.updatedAt = lvl.updatedAt || fresh.updatedAt;
    state.levels[i] = normalizeLevel(fresh);
    dirty = true;
  }
  if (dirty) saveLevels(state.levels);
}

// Render the profile row at the top of the start menu. Three states:
//   1. Active profile: name chip + Switch + Sign out. Gated sections
//      below become visible.
//   2. Profiles exist on this device but none is active: sign-in
//      picker with one card per known profile, plus a + New profile
//      card. Gated sections stay hidden.
//   3. No profiles on this device (or user clicked + New profile):
//      creation form. Gated sections stay hidden.
//
// Tokens are generated client-side at creation and persisted in
// localStorage so the player can sign back in after signing out.
function renderStartProfile() {
  const active = activeProfile();
  if (active) {
    startGated.classList.remove('hidden');
    renderActiveProfileBar(active);
  } else if (state.profiles.length > 0 && state.menuView !== 'create') {
    startGated.classList.add('hidden');
    renderProfilePicker();
  } else {
    startGated.classList.add('hidden');
    renderProfileCreateForm();
  }
  // "Add new device" is only meaningful when the active profile is
  // actually claimed on the server (and so the server knows about
  // its token). Hide otherwise.
  const addBtn = $('#btn-add-device');
  if (addBtn) {
    addBtn.classList.toggle('hidden', !(active && active.claimed));
  }
}

function renderActiveProfileBar(profile) {
  // Five chip states, in priority order so a permanent failure
  // surfaces above the transient "claiming…" placeholder:
  //   claimed            green badge, no action
  //   name_taken         warn badge, no retry (the name is gone)
  //   rate_limited       warn badge + Retry (user can try again later)
  //   other claim error  warn badge + Retry
  //   server unreachable dim badge "local only", no retry
  //   pending            dim badge "claiming…", auto-resolves
  let chip = '';
  let retry = '';
  if (profile.claimed) {
    chip = '<span class="profile-claim-pending claimed">claimed</span>';
  } else if (profile.claimError === 'name_taken') {
    chip = '<span class="profile-claim-pending taken" title="Another device already claimed this name on the server.">name taken</span>';
    retry = '<button id="btn-claim-now" class="profile-retry" title="Already claimed this name on another device? Sign in with that claim code.">Claim now</button>';
  } else if (profile.claimError === 'rate_limited') {
    chip = '<span class="profile-claim-pending failed">rate limited</span>';
    retry = '<button id="btn-claim-retry" class="profile-retry" title="Try claiming this name again">Retry</button>';
  } else if (profile.claimError) {
    chip = `<span class="profile-claim-pending failed" title="Claim failed: ${escapeHtml(profile.claimError)}">claim failed</span>`;
    retry = '<button id="btn-claim-retry" class="profile-retry" title="Try claiming this name again">Retry</button>';
  } else if (state.serverReachable === false) {
    chip = '<span class="profile-claim-pending local-only">local only</span>';
  } else if (state.serverReachable === true) {
    chip = '<span class="profile-claim-pending claiming">claiming…</span>';
  } else {
    chip = '<span class="profile-claim-pending unknown">checking…</span>';
  }
  startProfile.innerHTML = `
    <div class="profile-active">
      <div class="profile-info">
        <span class="profile-icon">${profileIcon()}</span>
        <span class="profile-name">@${escapeHtml(profile.name)}</span>
        ${chip}
        ${retry}
      </div>
      <div class="profile-actions">
        <button id="btn-switch-profile" class="profile-switch" title="Sign out and pick a different profile">Switch</button>
        <button id="btn-sign-out" class="profile-signout" title="Sign out. Your profile stays on this device.">Sign out</button>
      </div>
    </div>
  `;
  startProfile.querySelector('#btn-switch-profile').addEventListener('click', () => {
    state.activeProfileName = null;
    saveActiveProfileName(null);
    state.menuView = 'main';
    renderStartMenu();
  });
  startProfile.querySelector('#btn-sign-out').addEventListener('click', () => {
    if (!confirm(`Sign out of @${profile.name}? Your profile stays on this device so you can sign back in later.`)) return;
    state.activeProfileName = null;
    saveActiveProfileName(null);
    state.menuView = 'main';
    renderStartMenu();
  });
  const retryBtn = startProfile.querySelector('#btn-claim-retry');
  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      profile.claimError = null;
      saveProfiles(state.profiles);
      renderActiveProfileBar(profile);
      runServerClaim(profile);
    });
  }
  const claimNowBtn = startProfile.querySelector('#btn-claim-now');
  if (claimNowBtn) {
    claimNowBtn.addEventListener('click', () => openClaimModal(profile));
  }
}

// Open the "Claim this name" modal: the player pastes the token from
// their already-claimed account on another device, we adopt it as our
// local token and re-run the claim. On success, the server sees the
// matching token-hash and 200s an idempotent re-claim.
function openClaimModal(profile) {
  const modal = $('#claim-modal');
  const input = $('#claim-code-input');
  const submit = $('#btn-claim-submit');
  const status = $('#claim-status');
  input.value = '';
  status.textContent = '';
  status.className = 'share-copy-status';
  modal.classList.remove('hidden');
  setTimeout(() => input.focus(), 50);
  const onSubmit = async () => {
    const code = input.value.trim();
    // Accept both legacy 43-char base64url tokens and the new 8-char
    // Crockford short codes the server now issues.
    if (!/^([A-Za-z0-9_-]{43}|[0-9a-hjkmnp-tv-z]{8})$/.test(code)) {
      status.textContent = 'That does not look like a device code. Paste the 8-character code from the other device.';
      status.style.color = 'var(--bad)';
      return;
    }
    const prevToken = profile.token;
    profile.token = code;
    profile.claimed = false;
    profile.claimError = null;
    saveProfiles(state.profiles);
    status.textContent = 'Signing in...';
    status.style.color = 'var(--ink-dim)';
    submit.disabled = true;
    await runServerClaim(profile);
    submit.disabled = false;
    if (profile.claimed) {
      status.textContent = 'Signed in. You can close this dialog.';
      status.style.color = 'var(--good)';
      setTimeout(() => closeClaimModal(), 800);
    } else {
      // Restore the previous local token so the user isn't locked out
      // by a typo.
      profile.token = prevToken;
      profile.claimError = null;
      saveProfiles(state.profiles);
      renderActiveProfileBar(profile);
      status.textContent = 'That code did not match. Double-check it on the other device.';
      status.style.color = 'var(--bad)';
    }
  };
  submit.onclick = onSubmit;
  input.onkeydown = (e) => { if (e.key === 'Enter') onSubmit(); };
}

function closeClaimModal() {
  $('#claim-modal').classList.add('hidden');
}

// Open the "Add new device" modal: mint a fresh 8-char code on the
// server and surface it once. The user types this on the second
// device's "Claim now" prompt to sign in there. The calling device's
// own token is untouched.
async function openClaimCodeModal() {
  const ap = activeProfile();
  if (!ap || !ap.token) return;
  const modal = $('#claim-code-modal');
  $('#claim-code-name').textContent = ap.name;
  const input = $('#claim-code-value');
  const status = $('#claim-code-copy-status');
  input.value = '';
  status.textContent = 'Minting a new code...';
  status.style.color = 'var(--ink-dim)';
  modal.classList.remove('hidden');
  const code = await issueDeviceCode(ap.token);
  if (!code) {
    status.textContent = 'Could not reach the server. Try again when you are online.';
    status.style.color = 'var(--bad)';
    return;
  }
  input.value = code;
  status.textContent = '';
  setTimeout(() => { input.focus(); input.select(); }, 50);
}

function closeClaimCodeModal() {
  $('#claim-code-modal').classList.add('hidden');
}

function renderProfilePicker() {
  const cards = state.profiles.map((p) => {
    const last = p.lastSeenAt
      ? new Date(p.lastSeenAt).toLocaleDateString()
      : 'never';
    const status = p.claimed ? 'claimed on server' : 'local only';
    return `
      <button class="start-card profile-pick-card" data-action="pick-profile" data-profile-name="${escapeHtml(p.name)}">
        <h3>${profileIcon()} @${escapeHtml(p.name)}</h3>
        <p>Last seen ${last} · ${status}</p>
      </button>
    `;
  }).join('');
  startProfile.innerHTML = `
    <div class="profile-picker">
      <h3>Sign in</h3>
      <p class="hint">Pick a profile to continue, or create a new one. Profiles never leave this device unless you sync them to the server.</p>
      <div class="start-cards">
        ${cards}
        <button class="start-card new-profile-card" data-action="show-create-profile">
          <h3>+ New profile</h3>
          <p>Create another profile on this device.</p>
        </button>
      </div>
    </div>
  `;
}

function renderProfileCreateForm() {
  const hasOthers = state.profiles.length > 0;
  startProfile.innerHTML = `
    <div class="profile-create">
      <h3>${hasOthers ? 'Create a new profile' : 'Pick a name to play'}</h3>
      <p class="hint">Your name will be public on shared levels and leaderboards. Don't use your real name if you'd rather stay anonymous. A 32-byte secret is generated on this device and stored next to your name so you can sign back in.</p>
      <form id="profile-create-form" autocomplete="off">
        <input id="profile-name-input" type="text" placeholder="e.g. inspector_grim" autocomplete="off" maxlength="20" spellcheck="false" />
        <button type="submit">Create profile</button>
      </form>
      ${hasOthers ? '<button id="btn-back-to-picker" class="profile-back">Back to sign-in</button>' : ''}
      <p id="profile-error" class="profile-error hidden"></p>
    </div>
  `;
  const form = startProfile.querySelector('#profile-create-form');
  const input = startProfile.querySelector('#profile-name-input');
  const errEl = startProfile.querySelector('#profile-error');
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const name = input.value.trim();
    const err = validateProfileName(name);
    if (err) {
      errEl.textContent = err;
      errEl.classList.remove('hidden');
      return;
    }
    if (state.profiles.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      errEl.textContent = 'You already have a profile with that name on this device.';
      errEl.classList.remove('hidden');
      return;
    }
    const profile = {
      name,
      token: generateToken(),
      createdAt: Date.now(),
      lastSeenAt: Date.now(),
      claimed: false,
    };
    state.profiles.push(profile);
    state.activeProfileName = profile.name;
    state.menuView = 'main';
    saveProfiles(state.profiles);
    saveActiveProfileName(profile.name);
    renderStartMenu();
    // Server claim happens in the background; UI is already responsive.
    runServerClaim(profile);
  });
  if (hasOthers) {
    startProfile.querySelector('#btn-back-to-picker').addEventListener('click', () => {
      state.menuView = 'main';
      renderStartMenu();
    });
  }
  requestAnimationFrame(() => input.focus());
}

// Attempt to claim the profile on the API. Updates `claimed` and the
// active-profile bar when the response lands; falls back to the retry
// loop on transport failure so the next reachable probe re-runs the
// claim. Name-collision surfaces to the user via alert.
async function runServerClaim(profile) {
  if (!apiAvailable()) return;
  if (activeProfile() && activeProfile().name === profile.name) {
    renderActiveProfileBar(profile);
  }
  let result;
  try {
    result = await claimProfile(profile.name, profile.token);
  } catch {
    onServerUnreachable();
    return;
  }
  if (result.status === 0) {
    // Transport-level failure (CORS, DNS, offline). Treat as unreachable.
    onServerUnreachable();
    return;
  }
  state.serverReachable = true;
  if (result.ok) {
    profile.claimed = true;
    profile.claimError = null;
    saveProfiles(state.profiles);
    // First-time claim from this device: pull any server-side
    // completions so cross-device wins flow back in.
    syncCompletionsFromServer(profile).catch(() => {});
  } else if (result.nameTaken) {
    profile.claimError = 'name_taken';
    saveProfiles(state.profiles);
  } else if (result.status === 429) {
    profile.claimError = 'rate_limited';
    saveProfiles(state.profiles);
  } else {
    profile.claimError = `server_${result.status || 'unknown'}`;
    saveProfiles(state.profiles);
  }
  renderServerBanner();
  if (activeProfile() && activeProfile().name === profile.name) {
    renderActiveProfileBar(profile);
  }
}

// Server connectivity loop. Probes the API on boot; if unreachable,
// retries every 10s until it succeeds. Once reachable, the loop stops.
// A future enhancement can re-arm the loop on a failed in-flight call
// to detect mid-session outages; for now any claim/RPC failure also
// re-arms via onServerUnreachable.
const SERVER_RETRY_MS = 10_000;
let serverRetryTimer = null;

function startServerLoop() {
  if (!apiAvailable()) {
    state.serverReachable = false;
    renderServerBanner();
    return;
  }
  attemptProbe();
}

async function attemptProbe() {
  let ok;
  try {
    ok = await probeServer();
  } catch {
    ok = false;
  }
  if (ok) onServerReachable();
  else onServerUnreachable();
}

function onServerReachable() {
  const wasReachable = state.serverReachable === true;
  state.serverReachable = true;
  if (serverRetryTimer) {
    clearTimeout(serverRetryTimer);
    serverRetryTimer = null;
  }
  renderServerBanner();
  const cur = activeProfile();
  if (cur) renderActiveProfileBar(cur);
  // Auto-claim an unclaimed signed-in profile the moment the server
  // becomes reachable. Skipped on transitions from already-reachable
  // so we don't loop on a stuck name-taken collision.
  if (!wasReachable && cur && !cur.claimed) runServerClaim(cur);
  // Pull completions from the server on every reach event for the
  // current profile. Idempotent, only merges new server-side codes
  // into local state. Cheap: one /players/:name fetch.
  if (cur && cur.claimed) syncCompletionsFromServer(cur).catch(() => {});
}

function onServerUnreachable() {
  state.serverReachable = false;
  renderServerBanner();
  const cur = activeProfile();
  if (cur) renderActiveProfileBar(cur);
  if (serverRetryTimer) clearTimeout(serverRetryTimer);
  serverRetryTimer = setTimeout(attemptProbe, SERVER_RETRY_MS);
}

// Render every dynamic section of the start menu. Cheap, called whenever
// any of profile / filter / completion state changes.
function renderStartMenu() {
  renderStartProfile();
  if (!activeProfile()) return; // gated sections stay empty + hidden
  renderStartContinue();
  renderStartFilterTabs();
  renderStartLibrary();
  renderStartAuthored();
  renderServerBanner();
}

function renderServerBanner() {
  const el = $('#server-banner');
  if (!el) return;
  if (state.serverReachable === false) {
    el.classList.remove('hidden');
    el.textContent = 'Server unreachable. Playing locally. Sharing and leaderboards are disabled until the server responds again.';
  } else {
    el.classList.add('hidden');
  }
}

function renderStartContinue() {
  const continueEl = $('#start-continue');
  const headingEl = $('#start-continue-heading');
  continueEl.innerHTML = '';
  const lvl = state.levels.find((l) => l.id === state.activeId);
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
  const chip = lvl.difficulty && DIFFICULTY_LABELS[lvl.difficulty]
    ? `<span class="difficulty-chip diff-${lvl.difficulty}">${DIFFICULTY_LABELS[lvl.difficulty]}</span>`
    : '';
  card.innerHTML = `
    <h3>${icon} ${escapeHtml(lvl.name || 'Untitled level')} ${chip}</h3>
    <p>${escapeHtml(subtitle)}</p>
  `;
  continueEl.appendChild(card);
}

function renderStartFilterTabs() {
  for (const btn of startFilterTabs.querySelectorAll('.filter-tab')) {
    btn.classList.toggle('active', btn.dataset.filter === state.menuFilter);
  }
}

// The shipped-sample library, grouped by difficulty tier with filter
// support. The "User games" filter swaps the whole section for a
// placeholder until shared-level fetching ships in Phase 13.
function renderStartLibrary() {
  startLibrary.innerHTML = '';

  if (state.menuFilter === 'usergames') {
    const shared = state.levels.filter((l) => l.isShared);
    if (!shared.length) {
      const p = document.createElement('p');
      p.className = 'empty-state';
      p.textContent = 'Levels shared by other players will appear here. Open a share link (?play=CODE) to add one.';
      startLibrary.appendChild(p);
      return;
    }
    const cards = document.createElement('div');
    cards.className = 'start-cards';
    for (const lvl of shared) {
      const card = document.createElement('button');
      card.className = 'start-card';
      card.dataset.action = 'open-authored';
      card.dataset.authoredId = lvl.id;
      const who = lvl.ownerName ? `@${escapeHtml(lvl.ownerName)}` : 'someone';
      const lbBtn = lvl.code
        ? `<button data-authored-action="leaderboard" data-authored-id="${escapeHtml(lvl.id)}" class="leaderboard-btn">🏆 Leaderboard</button>`
        : '';
      const solversBtn = lvl.code
        ? `<button data-authored-action="solvers" data-authored-id="${escapeHtml(lvl.id)}" class="leaderboard-btn">👥 Players completed</button>`
        : '';
      card.innerHTML = `
        <h3>🔗 ${escapeHtml(lvl.name || 'Shared puzzle')}</h3>
        <p>By ${who} · code <code>${escapeHtml(lvl.code || '')}</code></p>
        <div class="authored-actions">
          ${lbBtn}
          ${solversBtn}
          <button data-authored-action="clone" data-authored-id="${escapeHtml(lvl.id)}" class="clone-btn">Clone to edit</button>
        </div>
      `;
      cards.appendChild(card);
    }
    startLibrary.appendChild(cards);
    return;
  }

  const samples = SAMPLES.filter((s) => {
    if (state.menuFilter === 'new') return !state.completedSamples.has(s.key);
    if (state.menuFilter === 'finished') return state.completedSamples.has(s.key);
    return true;
  });

  const groups = new Map();
  for (const s of samples) {
    const tier = s.difficulty && DIFFICULTY_LABELS[s.difficulty] ? s.difficulty : 'standard';
    if (!groups.has(tier)) groups.set(tier, []);
    groups.get(tier).push(s);
  }

  for (const tier of DIFFICULTY_ORDER) {
    const list = groups.get(tier);
    if (!list || !list.length) continue;
    const header = document.createElement('h4');
    header.className = `start-tier-header diff-${tier}`;
    header.textContent = DIFFICULTY_LABELS[tier];
    startLibrary.appendChild(header);

    const cards = document.createElement('div');
    cards.className = 'start-cards';
    for (const s of list) {
      const done = state.completedSamples.has(s.key);
      const card = document.createElement('button');
      card.className = 'start-card' + (done ? ' completed' : '');
      card.dataset.action = 'play-sample';
      card.dataset.sampleKey = s.key;
      const icon = done ? '✅' : '🔍';
      const lbActions = s.code
        ? `<div class="authored-actions">
             <button data-sample-action="leaderboard" data-sample-key="${escapeHtml(s.key)}" class="leaderboard-btn">🏆 Leaderboard</button>
             <button data-sample-action="solvers" data-sample-key="${escapeHtml(s.key)}" class="leaderboard-btn">👥 Players completed</button>
           </div>`
        : '';
      card.innerHTML = `
        <h3>${icon} ${escapeHtml(s.name)}</h3>
        <p>${escapeHtml(s.description)}</p>
        ${lbActions}
      `;
      cards.appendChild(card);
    }
    startLibrary.appendChild(cards);
  }

  if (startLibrary.children.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = state.menuFilter === 'new'
      ? 'You have solved every shipped sample. Try authoring one of your own.'
      : state.menuFilter === 'finished'
        ? 'No solved samples yet. Pick one from the All tab.'
        : 'No samples available.';
    startLibrary.appendChild(empty);
  }
}

// ---------- Share / play-by-code / completion tracking ----------

// Per-session play stats. Reset whenever the player enters play
// mode on a level. Mistakes accumulate from failed Check clicks.
// Lost on page reload, which is fine for a POC leaderboard.
let playSession = null; // { levelId, startedAt, mistakes }

function startPlaySession(level) {
  if (!level) return;
  playSession = {
    levelId: level.id,
    startedAt: Date.now(),
    mistakes: 0,
  };
}

function bumpMistakes(n) {
  if (!playSession || !n) return;
  playSession.mistakes += n;
  // Reflect the new count in the play-screen status line so the
  // player can see their guess total live.
  updateStatus();
}

async function openShareModal(authoredId) {
  const lvl = state.levels.find((l) => l.id === authoredId);
  if (!lvl) return;
  const profile = activeProfile();
  if (!profile) {
    alert('Sign in to share a puzzle.');
    return;
  }
  // Run the same validator the server runs, so we surface errors
  // before the round trip.
  const v = validateLevel(lvl);
  shareModal.classList.remove('hidden');
  shareSuccess.classList.add('hidden');
  shareErrors.classList.add('hidden');
  sharePending.classList.add('hidden');
  shareCopyStatus.textContent = '';
  if (!v.ok) {
    shareErrors.innerHTML =
      '<strong>Fix these before sharing:</strong>' +
      `<ul>${v.errors.map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`;
    shareErrors.classList.remove('hidden');
    return;
  }
  sharePending.textContent = lvl.code ? 'Re-publishing...' : 'Publishing...';
  sharePending.classList.remove('hidden');
  const result = lvl.code
    ? await updateSharedLevel(profile.token, lvl.code, lvl)
    : await shareLevel(profile.token, lvl);
  sharePending.classList.add('hidden');
  if (result.ok) {
    if (result.code) {
      lvl.code = result.code;
      persist();
      renderStartMenu();
    }
    const url = result.url || shareUrlFor(lvl.code);
    shareUrlInput.value = url;
    shareSuccess.classList.remove('hidden');
    return;
  }
  // Server-side validator can disagree with the client (rare but possible
  // if the level was edited mid-flight). Surface those errors too.
  if (result.invalid) {
    shareErrors.innerHTML =
      '<strong>The server rejected this puzzle:</strong>' +
      `<ul>${(result.errors || []).map((e) => `<li>${escapeHtml(e)}</li>`).join('')}</ul>`;
    shareErrors.classList.remove('hidden');
    return;
  }
  if (result.forbidden) {
    shareErrors.innerHTML = '<strong>You don\'t own this puzzle on the server. Clone it to edit your own copy.</strong>';
    shareErrors.classList.remove('hidden');
    return;
  }
  shareErrors.innerHTML = `<strong>Could not publish (status ${escapeHtml(String(result.status || 0))}).</strong> Try again in a moment.`;
  shareErrors.classList.remove('hidden');
}

function closeShareModal() {
  shareModal.classList.add('hidden');
}

// Create a fresh authored copy of a shared puzzle in the player's own
// library. The new level has no `code` (re-share creates a new one)
// and no owner; the original stays untouched in the shared section.
function cloneSharedLevelToAuthored(sharedId) {
  const src = state.levels.find((l) => l.id === sharedId);
  if (!src) return;
  const copy = JSON.parse(JSON.stringify(src));
  copy.id = 'lvl_' + Math.random().toString(36).slice(2, 8);
  copy.name = `${src.name} (clone)`;
  copy.isShared = false;
  copy.code = null;
  copy.ownerId = null;
  copy.ownerName = null;
  copy.completed = false;
  copy.createdAt = Date.now();
  copy.updatedAt = Date.now();
  state.levels.push(copy);
  state.activeId = copy.id;
  persist();
  closeStartMenu();
  rerender();
  flashStatus(`Cloned "${src.name}" into your authored levels.`);
}

// Delete an authored level from the local library. If the level has
// been published to the server (lvl.code is set), the confirm prompt
// tells the player that an admin can restore the published copy
// later, the public listing on the server is untouched. Local-only
// authored levels just get a plain "are you sure" prompt.
function deleteAuthoredLevel(authoredId) {
  const lvl = state.levels.find((l) => l.id === authoredId);
  if (!lvl) return;
  const name = lvl.name || '(untitled)';
  const message = lvl.code
    ? `Delete "${name}" from this device?\n\n` +
      `This level is published on the server (code ${lvl.code}). ` +
      `The published copy stays online and an admin can retrieve it ` +
      `for you at any time. Only the local copy on this device is ` +
      `removed; you will not be able to edit or re-publish it from ` +
      `this device unless an admin restores it.`
    : `Delete "${name}"?\n\nThis cannot be undone.`;
  if (!confirm(message)) return;
  state.levels = state.levels.filter((l) => l.id !== authoredId);
  if (state.activeId === authoredId) state.activeId = null;
  persist();
  renderStartMenu();
  flashStatus(`Deleted "${name}".`);
}

// Pull a level by code from the server and merge into the local
// library. If we already have it (matching code), just activate it.
// If the active profile owns it, store it as an authored (editable)
// level; otherwise mark it isShared so the UI offers Clone-to-edit.
async function applyPlayUrlParam() {
  const url = new URL(window.location.href);
  const code = url.searchParams.get('play');
  if (!code) return;
  // Strip the param so refreshing doesn't re-add the level.
  url.searchParams.delete('play');
  history.replaceState(null, '', url.toString());

  const existing = state.levels.find((l) => l.code === code);
  if (existing) {
    state.activeId = existing.id;
    persist();
    return;
  }
  const data = await getSharedLevel(code);
  if (!data) {
    flashStatus(`Could not load shared puzzle "${code}".`);
    return;
  }
  const lvl = normalizeLevel(data.level);
  // Always regenerate id locally so we don't collide with an existing
  // entry that happens to share the original level id.
  lvl.id = 'lvl_' + Math.random().toString(36).slice(2, 8);
  lvl.code = data.code;
  lvl.ownerId = data.ownerId;
  lvl.ownerName = data.ownerName;
  lvl.name = data.name || lvl.name;
  const ap = activeProfile();
  // If the signed-in player owns this puzzle, treat it as authored so
  // they can edit + Re-publish in place.
  lvl.isShared = !(ap && data.ownerId === ap.id);
  lvl.completed = false;
  state.levels.push(lvl);
  state.activeId = lvl.id;
  persist();
  bumpPlays(code);
  flashStatus(`Loaded "${lvl.name}" from @${data.ownerName}.`);
}

// Derive a server namespace from a bare puzzle code. Sample codes are
// the short mN tokens drawn from the SAMPLES manifest; anything else
// is treated as a custom shared-puzzle code. Used when the server
// returned a code without telling us which namespace it belongs to
// (e.g. inside a player's completion history).
function inferNamespace(code) {
  if (!code) return 'custom';
  return SAMPLES.some((s) => s.code === code) ? 'sample' : 'custom';
}

// Check-Solution feedback auto-clear: the green ✓ / red ✕ outlines
// linger for 10 seconds, then fade so the board stops shouting at the
// player while they're deciding what to move. Cancelled by the toast's
// Clear button (immediate) or by a fresh Check click (rescheduled).
const CHECK_FEEDBACK_TTL_MS = 10_000;
let checkFeedbackTimer = null;
function scheduleCheckFeedbackClear() {
  cancelCheckFeedbackClear();
  checkFeedbackTimer = setTimeout(() => {
    checkFeedbackTimer = null;
    highlightCells({});
    winToast.classList.add('hidden');
    if (state.checkFeedbackRowCol) {
      state.checkFeedbackRowCol = false;
      rerender();
    }
  }, CHECK_FEEDBACK_TTL_MS);
}
function cancelCheckFeedbackClear() {
  if (checkFeedbackTimer) {
    clearTimeout(checkFeedbackTimer);
    checkFeedbackTimer = null;
  }
}

// Two-way completion sync for the active profile. PULL: any sample
// codes the server has but the local set doesn't get added so a
// cross-device win lights up the green check on this device. PUSH:
// any local sample wins the server doesn't know about are posted as
// backfill rows (no time, no mistakes) so they count toward this
// player's total-completed without polluting the per-puzzle time
// leaderboard. Best-effort, swallows errors.
async function syncCompletionsFromServer(profile) {
  if (!profile || !apiAvailable()) return;
  const data = await getPlayerProfile(profile.name);
  if (!data || !Array.isArray(data.completions)) return;

  // Pull: server → local
  const serverCodes = new Set(data.completions.map((c) => c.level_code));
  let pulled = 0;
  for (const c of data.completions) {
    const s = SAMPLES.find((x) => x.code === c.level_code);
    if (s && !state.completedSamples.has(s.key)) {
      state.completedSamples.add(s.key);
      pulled++;
    }
  }
  if (pulled > 0) {
    saveCompletedSamples([...state.completedSamples]);
    if (!startModal.classList.contains('hidden')) renderStartMenu();
  }

  // Push: local → server (backfill). Every sample the player has
  // finished locally but the server has no record of gets a one-time
  // backfill post. The server de-dupes per (profile, code) so a
  // re-sync on another device is a no-op.
  let pushed = 0;
  for (const sampleKey of state.completedSamples) {
    const s = SAMPLES.find((x) => x.key === sampleKey);
    if (!s || !s.code) continue;
    if (serverCodes.has(s.code)) continue;
    const ok = await recordCompletion(profile.token, s.code, 'sample', 0, 0, { backfill: true });
    if (ok) pushed++;
  }

  if (pulled > 0 || pushed > 0) {
    const parts = [];
    if (pulled > 0) parts.push(`pulled ${pulled}`);
    if (pushed > 0) parts.push(`backfilled ${pushed}`);
    flashStatus(`Synced completions, ${parts.join(', ')}.`);
  }
}

// Resolve a level to its server target. Custom shared puzzles carry
// their code directly; samples carry a sampleKey that we map back to
// the canonical mN code via the SAMPLES manifest. Returns null for
// authored-but-unshared levels (no leaderboard exists for those).
function levelTarget(lvl) {
  if (!lvl) return null;
  if (lvl.code) return { code: lvl.code, namespace: 'custom', name: lvl.name };
  if (lvl.sampleKey) {
    const s = SAMPLES.find((x) => x.key === lvl.sampleKey);
    if (s && s.code) return { code: s.code, namespace: 'sample', name: s.name };
  }
  return null;
}

// On a win, post the completion + show the top-of-leaderboard inline
// in the win toast. Works for both shipped samples and custom shared
// puzzles, the namespace is picked from levelTarget.
async function postCompletionAndShowLeaderboard(lvl) {
  const tgt = levelTarget(lvl);
  if (!tgt) return;
  const ap = activeProfile();
  if (!ap || !apiAvailable()) return;
  const session = playSession && playSession.levelId === lvl.id
    ? playSession
    : null;
  const durationMs = session ? Math.max(1, Date.now() - session.startedAt) : 1000;
  const mistakes = session ? session.mistakes : 0;
  await recordCompletion(ap.token, tgt.code, tgt.namespace, durationMs, mistakes);
  const entries = await getLeaderboard(tgt.code, tgt.namespace);
  if (!entries || !entries.length) return;
  const top = entries.slice(0, 5);
  const items = top
    .map((e) => {
      const mine = ap.name === e.profile_name;
      return `<li class="${mine ? 'lb-you' : ''}">
        <span>${mine ? 'You' : '@' + escapeHtml(e.profile_name)}</span>
        <span class="lb-time">${formatMs(e.best_ms)}</span>
      </li>`;
    })
    .join('');
  winLeaderboard.innerHTML = `<h4>Leaderboard for "${escapeHtml(tgt.name || tgt.code)}"</h4><ol>${items}</ol>`;
  winLeaderboard.classList.remove('hidden');
}

function formatMs(ms) {
  if (!Number.isFinite(ms)) return '';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// Format a millisecond timestamp as a short "Mon DD" string for the
// completion list. Skips the year, the list is recency-ordered so the
// year is obvious from context.
function formatWhen(ms) {
  if (!Number.isFinite(ms)) return '';
  try {
    return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

// ---------- Leaderboard / completions modal ----------

// Track the modal's current puzzle + namespace + tab so a re-fetch
// after tab switch can be done without re-passing arguments.
const lbState = { code: null, name: null, namespace: 'custom', tab: 'top' };

async function openLeaderboardModal(code, fallbackName, { initialTab = 'top', namespace = 'custom' } = {}) {
  if (!code) return;
  lbState.code = code;
  lbState.name = fallbackName || code;
  lbState.namespace = namespace === 'sample' ? 'sample' : 'custom';
  lbState.tab = initialTab === 'all' ? 'all' : 'top';
  leaderboardModal.classList.remove('hidden');
  lbModalTitle.textContent = `Leaderboard, "${fallbackName || code}"`;
  for (const tab of leaderboardModal.querySelectorAll('.lb-tab')) {
    tab.classList.toggle('active', tab.dataset.lbTab === lbState.tab);
  }
  await renderLeaderboardTab();
}

function closeLeaderboardModal() {
  leaderboardModal.classList.add('hidden');
  lbState.code = null;
}

async function renderLeaderboardTab() {
  const { code, namespace, tab } = lbState;
  if (!code) return;
  lbTable.classList.add('hidden');
  lbEmpty.classList.add('hidden');
  lbError.classList.add('hidden');
  lbLoading.classList.remove('hidden');
  lbTbody.innerHTML = '';

  if (tab === 'top') {
    lbExtraCol.textContent = '';
    const entries = await getLeaderboard(code, namespace);
    lbLoading.classList.add('hidden');
    if (entries === null) { lbError.classList.remove('hidden'); return; }
    if (!entries.length) { lbEmpty.classList.remove('hidden'); return; }
    const ap = activeProfile();
    lbTbody.innerHTML = entries
      .map((e, i) => {
        const mine = ap && ap.name === e.profile_name;
        return `<tr class="${mine ? 'lb-you' : ''}">
          <td class="num">${i + 1}</td>
          <td><button class="lb-player-btn" data-player-name="${escapeHtml(e.profile_name)}">${mine ? 'You' : '@' + escapeHtml(e.profile_name)}</button></td>
          <td class="num">${formatMs(e.best_ms)}</td>
          <td class="num">${e.best_mistakes ?? 0}</td>
          <td></td>
        </tr>`;
      })
      .join('');
    lbTable.classList.remove('hidden');
    return;
  }

  // 'all' tab: every completion, newest first.
  lbExtraCol.textContent = 'When';
  const data = await getLevelCompletions(code, namespace);
  lbLoading.classList.add('hidden');
  if (data === null) { lbError.classList.remove('hidden'); return; }
  const entries = data.entries || [];
  if (!entries.length) { lbEmpty.classList.remove('hidden'); return; }
  const ap = activeProfile();
  lbTbody.innerHTML = entries
    .map((e, i) => {
      const mine = ap && ap.name === e.profile_name;
      return `<tr class="${mine ? 'lb-you' : ''}">
        <td class="num">${i + 1}</td>
        <td><button class="lb-player-btn" data-player-name="${escapeHtml(e.profile_name)}">${mine ? 'You' : '@' + escapeHtml(e.profile_name)}</button></td>
        <td class="num">${formatMs(e.duration_ms)}</td>
        <td class="num">${e.mistakes ?? 0}</td>
        <td>${escapeHtml(formatWhen(e.completed_at))}</td>
      </tr>`;
    })
    .join('');
  lbTable.classList.remove('hidden');
}

// ---------- Players directory modal ----------

async function openPlayersModal({ initialPlayer } = {}) {
  playersModal.classList.remove('hidden');
  if (initialPlayer) {
    await renderPlayerDetail(initialPlayer);
    return;
  }
  playersModalTitle.textContent = 'Players';
  playersBack.classList.add('hidden');
  await renderPlayersDirectory();
}

function closePlayersModal() {
  playersModal.classList.add('hidden');
}

async function renderPlayersDirectory() {
  playersList.innerHTML = '';
  playersError.classList.add('hidden');
  playersLoading.classList.remove('hidden');
  const entries = await getPlayers();
  playersLoading.classList.add('hidden');
  if (entries === null) { playersError.classList.remove('hidden'); return; }
  if (!entries.length) {
    playersList.innerHTML = '<p class="lb-empty">No players yet.</p>';
    return;
  }
  const ap = activeProfile();
  playersList.innerHTML = entries
    .map((p) => {
      const mine = ap && ap.name === p.name;
      const seen = formatWhen(p.last_seen_at);
      return `<button class="player-row ${mine ? 'player-you' : ''}" data-player-name="${escapeHtml(p.name)}">
        <span>
          <strong>${mine ? 'You · ' : ''}@${escapeHtml(p.name)}</strong>
          <span class="player-meta">last seen ${escapeHtml(seen)}</span>
        </span>
        <span class="player-stats">
          ${p.completion_count} solved · ${p.authored_count} authored
        </span>
      </button>`;
    })
    .join('');
}

async function renderPlayerDetail(name) {
  playersBack.classList.remove('hidden');
  playersModalTitle.textContent = `@${name}`;
  playersList.innerHTML = '';
  playersError.classList.add('hidden');
  playersLoading.classList.remove('hidden');
  const data = await getPlayerProfile(name);
  playersLoading.classList.add('hidden');
  if (!data) { playersError.classList.remove('hidden'); return; }
  const head = document.createElement('div');
  head.className = 'player-detail-head';
  head.innerHTML = `
    <h3>@${escapeHtml(data.name)}</h3>
    <p>Joined ${escapeHtml(formatWhen(data.createdAt))} ·
       last seen ${escapeHtml(formatWhen(data.lastSeenAt))} ·
       ${data.completions.length} solve(s) ·
       ${data.authoredCount} authored
    </p>
  `;
  playersList.appendChild(head);
  if (!data.completions.length) {
    const empty = document.createElement('p');
    empty.className = 'lb-empty';
    empty.textContent = 'No solves logged yet.';
    playersList.appendChild(empty);
    return;
  }
  const table = document.createElement('table');
  table.className = 'lb-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Puzzle</th>
        <th class="num">Time</th>
        <th class="num">Mistakes</th>
        <th>When</th>
      </tr>
    </thead>
    <tbody>
      ${data.completions
        .map((c) => `<tr>
          <td><button class="lb-player-btn" data-level-code="${escapeHtml(c.level_code)}" data-level-name="${escapeHtml(c.level_name || c.level_code)}">${escapeHtml(c.level_name || c.level_code)}</button></td>
          <td class="num">${formatMs(c.duration_ms)}</td>
          <td class="num">${c.mistakes ?? 0}</td>
          <td>${escapeHtml(formatWhen(c.completed_at))}</td>
        </tr>`)
        .join('')}
    </tbody>
  `;
  playersList.appendChild(table);
}

// ---------- Global Leaderboards modal (two tabs: rankings + puzzles) ----------

const puzzlesState = { tab: 'ranked' };

async function openPuzzlesModal() {
  puzzlesState.tab = 'ranked';
  puzzlesModal.classList.remove('hidden');
  for (const t of puzzlesModal.querySelectorAll('.lb-tab')) {
    t.classList.toggle('active', t.dataset.puzzlesTab === 'ranked');
  }
  await renderPuzzlesModalTab();
}

function closePuzzlesModal() {
  puzzlesModal.classList.add('hidden');
}

async function renderPuzzlesModalTab() {
  puzzlesList.innerHTML = '';
  puzzlesError.classList.add('hidden');
  puzzlesLoading.classList.remove('hidden');

  if (puzzlesState.tab === 'ranked') {
    puzzlesHint.textContent = 'Players ranked by puzzles completed, total guesses break ties.';
    const entries = await getRankings();
    puzzlesLoading.classList.add('hidden');
    if (entries === null) { puzzlesError.classList.remove('hidden'); return; }
    if (!entries.length) {
      puzzlesList.innerHTML = '<p class="lb-empty">No solves recorded yet. Be the first.</p>';
      return;
    }
    const ap = activeProfile();
    puzzlesList.innerHTML = entries
      .map((p, i) => {
        const mine = ap && ap.name === p.name;
        return `<button class="player-row ${mine ? 'player-you' : ''}" data-player-name="${escapeHtml(p.name)}">
          <span>
            <strong>#${i + 1} ${mine ? 'You · ' : ''}@${escapeHtml(p.name)}</strong>
            <span class="player-meta">${p.total_guesses} total guess${p.total_guesses === 1 ? '' : 'es'}</span>
          </span>
          <span class="player-stats">${p.completion_count} puzzle${p.completion_count === 1 ? '' : 's'}</span>
        </button>`;
      })
      .join('');
    return;
  }

  // 'puzzles' tab
  puzzlesHint.textContent = 'Every puzzle with at least one recorded solve. Pick one to see its leaderboard.';
  const entries = await getPuzzles();
  puzzlesLoading.classList.add('hidden');
  if (entries === null) { puzzlesError.classList.remove('hidden'); return; }
  if (!entries.length) {
    puzzlesList.innerHTML = '<p class="lb-empty">No puzzles have been solved yet.</p>';
    return;
  }
  puzzlesList.innerHTML = entries
    .map((p) => {
      const ns = p.namespace === 'sample' ? 'Sample' : 'Custom';
      return `<button class="player-row" data-puzzle-code="${escapeHtml(p.code)}" data-puzzle-namespace="${escapeHtml(p.namespace)}" data-puzzle-name="${escapeHtml(p.name || p.code)}">
        <span>
          <strong>${escapeHtml(p.name || p.code)}</strong>
          <span class="player-meta">${ns} · code <code>${escapeHtml(p.code)}</code> · last solve ${escapeHtml(formatWhen(p.last_completed_at))}</span>
        </span>
        <span class="player-stats">${p.completion_count} solve${p.completion_count === 1 ? '' : 's'}</span>
      </button>`;
    })
    .join('');
}

// Self-authored levels (the "Your levels" section). Always shows a
// + New level card first.
function renderStartAuthored() {
  startAuthored.innerHTML = '';

  const newCard = document.createElement('button');
  newCard.className = 'start-card new-level-card';
  newCard.dataset.action = 'new-level';
  newCard.innerHTML = `
    <h3>+ New level</h3>
    <p>Author rooms, place suspects, write the clues.</p>
  `;
  startAuthored.appendChild(newCard);

  const authored = state.levels.filter((l) => !l.isSample && !l.isShared);
  for (const lvl of authored) {
    const card = document.createElement('button');
    card.className = 'start-card authored-card';
    card.dataset.action = 'open-authored';
    card.dataset.authoredId = lvl.id;
    const updated = new Date(lvl.updatedAt);
    const chip = lvl.difficulty && DIFFICULTY_LABELS[lvl.difficulty]
      ? `<span class="difficulty-chip diff-${lvl.difficulty}">${DIFFICULTY_LABELS[lvl.difficulty]}</span>`
      : '';
    const sharedChip = lvl.code
      ? `<span class="shared-chip" title="Published as ${escapeHtml(lvl.code)}">shared</span>`
      : '';
    const canShare = apiAvailable() && activeProfile();
    const shareBtn = canShare
      ? `<button data-authored-action="share" data-authored-id="${escapeHtml(lvl.id)}" class="share-btn">${lvl.code ? 'Re-publish' : 'Share'}</button>`
      : `<span class="share-btn-disabled" title="Sign in and connect to the server first.">Share</span>`;
    const deleteBtn = `<button data-authored-action="delete" data-authored-id="${escapeHtml(lvl.id)}" class="delete-btn">Delete</button>`;
    card.innerHTML = `
      <h3>✏ ${escapeHtml(lvl.name || 'Untitled level')} ${chip} ${sharedChip}</h3>
      <p>Last edited ${updated.toLocaleDateString()}</p>
      <div class="authored-actions">
        ${shareBtn}
        ${deleteBtn}
      </div>
    `;
    startAuthored.appendChild(card);
  }

  if (authored.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.textContent = 'No authored levels yet. Click + New level to start.';
    startAuthored.appendChild(empty);
  }
}

// ---------- Levels modal ----------

function renderLevelsList() {
  levelsListEl.innerHTML = '';
  // Shipped samples are managed from the start menu library, not
  // the levels modal, so they don't appear here. Authored levels +
  // clones + custom shared puzzles do.
  const managed = state.levels.filter((l) => !l.isSample);
  for (const lvl of managed) {
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
  // Continue, library, and authored sections match current state.
  renderStartMenu();
  startModal.classList.remove('hidden');
  document.body.classList.add('menu-active');
}
function closeStartMenu() {
  startModal.classList.add('hidden');
  // The Players / Leaderboards / per-puzzle leaderboard modals are
  // start-menu surfaces; dismiss anything still open so they don't
  // hang over the game grid once the player enters a level.
  puzzlesModal.classList.add('hidden');
  playersModal.classList.add('hidden');
  leaderboardModal.classList.add('hidden');
  document.body.classList.remove('menu-active');
}

function handleStartAction(action, opts = {}) {
  // Profile-management actions work without an active profile.
  if (action === 'pick-profile') {
    const name = opts.profileName;
    const p = state.profiles.find((pp) => pp.name === name);
    if (!p) return;
    p.lastSeenAt = Date.now();
    state.activeProfileName = p.name;
    state.menuView = 'main';
    saveProfiles(state.profiles);
    saveActiveProfileName(p.name);
    // If the chosen profile hasn't been claimed yet, attempt now.
    if (!p.claimed) runServerClaim(p);
    // Pull this profile's server-side completions so the start-menu
    // ✅ checks reflect cross-device wins right away.
    if (p.claimed && state.serverReachable) syncCompletionsFromServer(p).catch(() => {});
    renderStartMenu();
    return;
  }
  if (action === 'show-create-profile') {
    state.menuView = 'create';
    renderStartMenu();
    return;
  }
  // Every play / author action requires an active profile. The profile
  // UI lives in the same menu, so a missing profile just means we
  // don't leave; the form / picker is already in front of the user.
  if (!activeProfile()) return;
  switch (action) {
    case 'play-sample': {
      loadSampleAsNewLevel(opts.sampleKey);
      persist();
      setMode('play');
      break;
    }
    case 'new-level': {
      const lvl = emptyLevel();
      state.levels.push(lvl);
      state.activeId = lvl.id;
      state.selectedRoomId = null;
      persist();
      setMode('edit');
      break;
    }
    case 'open-authored': {
      const id = opts.authoredId;
      const lvl = state.levels.find((l) => l.id === id);
      if (!lvl) break;
      state.activeId = id;
      state.selectedRoomId = null;
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
  // Older saves stacked a fresh instance every time a shipped sample
  // was played; collapse those down so the levels modal + dropdown
  // never show phantom duplicates of the same case.
  dedupeSamplePlayInstances();
  // Shipped samples are program-defined: their rooms / decorations /
  // clues / solution all live in js/sample.js and should never be
  // served from localStorage. Refresh every cached sample-play
  // instance from the current SAMPLES manifest, preserving only the
  // player's progress (placements, killer accusation, completed flag).
  refreshSampleLevelsFromSource();
  state.profiles = loadProfiles();
  state.activeProfileName = loadActiveProfileName();
  // Verify the stored active-profile name still matches an entry.
  if (state.activeProfileName && !state.profiles.find((p) => p.name === state.activeProfileName)) {
    state.activeProfileName = null;
    saveActiveProfileName(null);
  }
  // Bump lastSeenAt on the active profile for the picker UI.
  const ap = activeProfile();
  if (ap) {
    ap.lastSeenAt = Date.now();
    saveProfiles(state.profiles);
  }
  // Kick off the server connectivity loop. Probes once on boot, then
  // retries every 10 seconds while offline so the client recovers
  // automatically when the server comes back.
  startServerLoop();
  // If we landed on a ?play=<code> URL, fetch the shared puzzle and
  // add it to the library. The handler strips the query string so a
  // refresh does not re-add the level.
  await applyPlayUrlParam();
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

  // Topbar Clone (also exposed on the in-grid sample banner). Cloning
  // a shipped sample is the only path to an editable copy, so we ask
  // for explicit confirmation before doing it, otherwise an accidental
  // tap silently spawns a level the player didn't mean to author.
  const cloneCurrent = () => {
    const src = activeLevel();
    if (!src) return;
    if (src.isSample) {
      const ok = confirm(
        `Clone "${src.name}" into your own editable copy?\n\n` +
        `The original sample stays untouched. The copy goes into Your levels.`
      );
      if (!ok) return;
    }
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

  // Share modal close + copy-link handlers.
  for (const c of document.querySelectorAll('[data-close="share"]')) c.addEventListener('click', closeShareModal);
  shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) closeShareModal();
  });
  $('#btn-copy-share').addEventListener('click', async () => {
    const url = shareUrlInput.value;
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      shareCopyStatus.textContent = 'Copied.';
    } catch {
      // Fallback for browsers that block clipboard API.
      shareUrlInput.select();
      try {
        document.execCommand('copy');
        shareCopyStatus.textContent = 'Copied.';
      } catch {
        shareCopyStatus.textContent = 'Press Ctrl-C / Cmd-C to copy.';
      }
    }
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

  // Claim-now modal close + backdrop click.
  const claimModalEl = $('#claim-modal');
  for (const c of document.querySelectorAll('[data-close="claim"]')) c.addEventListener('click', closeClaimModal);
  claimModalEl.addEventListener('click', (e) => { if (e.target === claimModalEl) closeClaimModal(); });

  // Get-claim-code modal: footer button + copy + close + backdrop.
  const claimCodeModalEl = $('#claim-code-modal');
  $('#btn-add-device').addEventListener('click', openClaimCodeModal);
  for (const c of document.querySelectorAll('[data-close="claim-code"]')) c.addEventListener('click', closeClaimCodeModal);
  claimCodeModalEl.addEventListener('click', (e) => { if (e.target === claimCodeModalEl) closeClaimCodeModal(); });
  $('#btn-copy-claim-code').addEventListener('click', async () => {
    const input = $('#claim-code-value');
    const status = $('#claim-code-copy-status');
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = 'Copied. Paste into "Claim this name" on the other device.';
    } catch {
      input.select();
      try {
        document.execCommand('copy');
        status.textContent = 'Copied. Paste into "Claim this name" on the other device.';
      } catch {
        status.textContent = 'Press Ctrl-C / Cmd-C to copy.';
      }
    }
  });

  // Leaderboard modal close + tab switching + player drill-down. The
  // table is rebuilt by renderLeaderboardTab so we don't need to listen
  // per-row, instead delegate at the modal root.
  for (const c of document.querySelectorAll('[data-close="leaderboard"]')) c.addEventListener('click', closeLeaderboardModal);
  leaderboardModal.addEventListener('click', (e) => {
    if (e.target === leaderboardModal) { closeLeaderboardModal(); return; }
    const tab = e.target.closest('.lb-tab');
    if (tab) {
      lbState.tab = tab.dataset.lbTab;
      for (const t of leaderboardModal.querySelectorAll('.lb-tab')) {
        t.classList.toggle('active', t === tab);
      }
      renderLeaderboardTab();
      return;
    }
    const playerBtn = e.target.closest('.lb-player-btn[data-player-name]');
    if (playerBtn) {
      // Cross-open: close leaderboard, jump straight into the detail
      // view so the directory list never flashes underneath.
      const name = playerBtn.dataset.playerName;
      closeLeaderboardModal();
      openPlayersModal({ initialPlayer: name });
    }
  });

  // Global Leaderboards button: opens the cross-namespace puzzles
  // directory. Rows click through into the per-puzzle leaderboard.
  $('#btn-leaderboards-global').addEventListener('click', () => openPuzzlesModal());
  for (const c of document.querySelectorAll('[data-close="puzzles"]')) c.addEventListener('click', closePuzzlesModal);
  puzzlesModal.addEventListener('click', (e) => {
    if (e.target === puzzlesModal) { closePuzzlesModal(); return; }
    const tab = e.target.closest('.lb-tab[data-puzzles-tab]');
    if (tab) {
      puzzlesState.tab = tab.dataset.puzzlesTab;
      for (const t of puzzlesModal.querySelectorAll('.lb-tab')) {
        t.classList.toggle('active', t === tab);
      }
      renderPuzzlesModalTab();
      return;
    }
    const puzzleRow = e.target.closest('.player-row[data-puzzle-code]');
    if (puzzleRow) {
      const code = puzzleRow.dataset.puzzleCode;
      const name = puzzleRow.dataset.puzzleName;
      const namespace = puzzleRow.dataset.puzzleNamespace;
      closePuzzlesModal();
      openLeaderboardModal(code, name, { namespace });
      return;
    }
    const playerRow = e.target.closest('.player-row[data-player-name]');
    if (playerRow) {
      const name = playerRow.dataset.playerName;
      closePuzzlesModal();
      openPlayersModal({ initialPlayer: name });
    }
  });

  // Players directory modal: open button, close, back, and delegated
  // clicks for player rows + level codes (when drilled into a profile).
  $('#btn-players').addEventListener('click', () => openPlayersModal());
  for (const c of document.querySelectorAll('[data-close="players"]')) c.addEventListener('click', closePlayersModal);
  playersModal.addEventListener('click', (e) => {
    if (e.target === playersModal) { closePlayersModal(); return; }
    if (e.target === playersBack) {
      playersModalTitle.textContent = 'Players';
      playersBack.classList.add('hidden');
      renderPlayersDirectory();
      return;
    }
    const row = e.target.closest('.player-row[data-player-name]');
    if (row) { renderPlayerDetail(row.dataset.playerName); return; }
    const lvlBtn = e.target.closest('.lb-player-btn[data-level-code]');
    if (lvlBtn) {
      // Cross-open: close players, open the leaderboard for that puzzle.
      const code = lvlBtn.dataset.levelCode;
      const name = lvlBtn.dataset.levelName;
      closePlayersModal();
      openLeaderboardModal(code, name, { namespace: inferNamespace(code) });
    }
  });

  // "See full leaderboard" link inside the win toast. The button is
  // revealed for any level that has a server-side target (samples or
  // shared puzzles); set by the win handler below.
  winViewLeaderboard.addEventListener('click', () => {
    const tgt = levelTarget(activeLevel());
    if (tgt) openLeaderboardModal(tgt.code, tgt.name, { namespace: tgt.namespace });
  });

  // Reset all data, wipes every saved level, the profile, and progress
  // flags. Confirmed twice because there is no undo.
  $('#btn-reset-all').addEventListener('click', () => {
    if (!confirm('This will erase every saved level, your profile, all progress, and any in-flight clues you have written. Continue?')) return;
    if (!confirm('Last chance, this cannot be undone. Reset everything?')) return;
    try {
      localStorage.removeItem('murdoku.levels');
      localStorage.removeItem('murdoku.activeId');
      localStorage.removeItem('murdoku.completedSamples');
      localStorage.removeItem('murdoku.profiles');
      localStorage.removeItem('murdoku.activeProfileName');
      localStorage.removeItem('murdoku.profile'); // legacy Phase 11 key
    } catch {}
    // Reload to start clean, boot() will run again with empty state.
    location.reload();
  });
  renderStartMenu();

  // Filter-tab clicks restrict the library view without leaving the menu.
  startFilterTabs.addEventListener('click', (ev) => {
    const tab = ev.target.closest('.filter-tab');
    if (!tab) return;
    state.menuFilter = tab.dataset.filter;
    renderStartFilterTabs();
    renderStartLibrary();
  });

  // Start-menu card delegation. Buttons inside an authored card are
  // detected first so the click doesn't bubble into the card itself.
  startModal.addEventListener('click', (e) => {
    const sampleBtn = e.target.closest('[data-sample-action]');
    if (sampleBtn) {
      e.stopPropagation();
      const s = SAMPLES.find((x) => x.key === sampleBtn.dataset.sampleKey);
      if (s && s.code) {
        const act = sampleBtn.dataset.sampleAction;
        openLeaderboardModal(s.code, s.name, {
          initialTab: act === 'solvers' ? 'all' : 'top',
          namespace: 'sample',
        });
      }
      return;
    }
    const authoredBtn = e.target.closest('[data-authored-action]');
    if (authoredBtn) {
      if (authoredBtn.disabled) return;
      const act = authoredBtn.dataset.authoredAction;
      e.stopPropagation();
      if (act === 'open') {
        handleStartAction('open-authored', { authoredId: authoredBtn.dataset.authoredId });
      } else if (act === 'share') {
        openShareModal(authoredBtn.dataset.authoredId);
      } else if (act === 'clone') {
        cloneSharedLevelToAuthored(authoredBtn.dataset.authoredId);
      } else if (act === 'leaderboard') {
        const lvl = state.levels.find((l) => l.id === authoredBtn.dataset.authoredId);
        const tgt = levelTarget(lvl);
        if (tgt) openLeaderboardModal(tgt.code, tgt.name, { namespace: tgt.namespace });
      } else if (act === 'solvers') {
        const lvl = state.levels.find((l) => l.id === authoredBtn.dataset.authoredId);
        const tgt = levelTarget(lvl);
        if (tgt) openLeaderboardModal(tgt.code, tgt.name, { initialTab: 'all', namespace: tgt.namespace });
      } else if (act === 'delete') {
        deleteAuthoredLevel(authoredBtn.dataset.authoredId);
      }
      return;
    }
    const card = e.target.closest('.start-card');
    if (!card) return;
    handleStartAction(card.dataset.action, {
      sampleKey: card.dataset.sampleKey,
      continueId: card.dataset.continueId,
      profileName: card.dataset.profileName,
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
      const baseLine = lvl && lvl.name ? `You solved "${lvl.name}".` : 'You solved this case.';
      const elapsed = playSession && lvl && playSession.levelId === lvl.id
        ? ` Time ${formatMs(Date.now() - playSession.startedAt)}, mistakes ${playSession.mistakes}.`
        : '';
      winDetail.textContent = baseLine + elapsed;
      winLeaderboard.classList.add('hidden');
      winLeaderboard.innerHTML = '';
      const tgt = levelTarget(lvl);
      winViewLeaderboard.classList.toggle('hidden', !tgt);
      winToast.classList.remove('hidden', 'bad');
      // Post completion + render leaderboard for any level with a
      // server-side target (samples or custom shared puzzles).
      if (tgt) postCompletionAndShowLeaderboard(lvl);
      // Outline only the cells the player actually placed, all correct on a win.
      highlightCells({ correct: result.correct, wrong: [] });
    } else {
      bumpMistakes(result.wrong.length || 1);
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
      winViewLeaderboard.classList.add('hidden');
      winToast.classList.remove('hidden');
      winToast.classList.add('bad');
      // Outline only placed cells: green if right, red if wrong. NEVER
      // outline cells the player hasn't placed on, they're not feedback.
      highlightCells({ correct: result.correct, wrong: result.wrong });
      // Also light up the row/col X overlay so the player can see which
      // rows + columns are already claimed. Persists until auto-clear /
      // toast close / Clear, same lifecycle as the red/green outlines.
      state.checkFeedbackRowCol = true;
      rerender();
      // Auto-clear the check feedback after 10s so a half-solved board
      // doesn't stay smeared with red Xs while the player thinks.
      scheduleCheckFeedbackClear();
    }
  });
  for (const c of document.querySelectorAll('[data-close="toast"]')) {
    c.addEventListener('click', () => {
      winToast.classList.add('hidden');
      highlightCells({});
      cancelCheckFeedbackClear();
      if (state.checkFeedbackRowCol) {
        state.checkFeedbackRowCol = false;
        rerender();
      }
    });
  }

  $('#btn-reset-play').addEventListener('click', () => {
    clearPlayBoard();
    persist();
    state.checkFeedbackRowCol = false;
    winToast.classList.add('hidden');
    highlightCells({});
    cancelCheckFeedbackClear();
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
