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
import { apiAvailable, probeServer, claimProfile } from './api.js';
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
const startProfile = $('#start-profile');
const startGated   = $('#start-gated');
const startLibrary = $('#start-library');
const startAuthored = $('#start-authored');
const startFilterTabs = $('#start-filter-tabs');
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
const difficultyChip = $('#difficulty-chip');

const DIFFICULTY_LABELS = {
  tutorial: 'Tutorial',
  gentle: 'Gentle',
  standard: 'Standard',
  tricky: 'Tricky',
  expert: 'Expert',
  fiendish: 'Fiendish',
};

// Difficulty tier rendering order in the library. Tiers not present in
// the current sample roster are silently skipped.
const DIFFICULTY_ORDER = ['tutorial', 'gentle', 'standard', 'tricky', 'expert', 'fiendish'];

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
}

function renderActiveProfileBar(profile) {
  let chip = '';
  if (!profile.claimed) {
    if (state.serverReachable === true) {
      chip = '<span class="profile-claim-pending claiming">claiming…</span>';
    } else if (state.serverReachable === false) {
      chip = '<span class="profile-claim-pending local-only">local only</span>';
    } else {
      chip = '<span class="profile-claim-pending unknown">checking…</span>';
    }
  } else {
    chip = '<span class="profile-claim-pending claimed">claimed</span>';
  }
  startProfile.innerHTML = `
    <div class="profile-active">
      <div class="profile-info">
        <span class="profile-icon">🪪</span>
        <span class="profile-name">@${escapeHtml(profile.name)}</span>
        ${chip}
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
}

function renderProfilePicker() {
  const cards = state.profiles.map((p) => {
    const last = p.lastSeenAt
      ? new Date(p.lastSeenAt).toLocaleDateString()
      : 'never';
    const status = p.claimed ? 'claimed on server' : 'local only';
    return `
      <button class="start-card profile-pick-card" data-action="pick-profile" data-profile-name="${escapeHtml(p.name)}">
        <h3>🪪 @${escapeHtml(p.name)}</h3>
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
    saveProfiles(state.profiles);
  } else if (result.nameTaken) {
    alert(
      `The name @${profile.name} is already claimed on the server. ` +
      `Your local progress stays under this name on this device, but ` +
      `leaderboards will not show it. Pick a different name when you ` +
      `next sign up.`
    );
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
    const p = document.createElement('p');
    p.className = 'empty-state';
    p.textContent = 'Levels shared by other players will appear here. Visit a share link to add one. Sharing ships in Phase 13.';
    startLibrary.appendChild(p);
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
      card.innerHTML = `
        <h3>${icon} ${escapeHtml(s.name)}</h3>
        <p>${escapeHtml(s.description)}</p>
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

// Self-authored levels (the "Your levels" section). Always shows a
// + New level card first; the share button is present but disabled
// until Phase 13.
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
    card.innerHTML = `
      <h3>✏ ${escapeHtml(lvl.name || 'Untitled level')} ${chip}</h3>
      <p>Last edited ${updated.toLocaleDateString()}</p>
      <div class="authored-actions">
        <span data-authored-action="share" class="share-btn-disabled" title="Sharing ships in Phase 13.">Share (soon)</span>
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
  // Continue, library, and authored sections match current state.
  renderStartMenu();
  startModal.classList.remove('hidden');
  document.body.classList.add('menu-active');
}
function closeStartMenu() {
  startModal.classList.add('hidden');
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
    const authoredBtn = e.target.closest('[data-authored-action]');
    if (authoredBtn) {
      if (authoredBtn.disabled) return;
      const act = authoredBtn.dataset.authoredAction;
      if (act === 'open') {
        handleStartAction('open-authored', { authoredId: authoredBtn.dataset.authoredId });
      }
      return;
    }
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
