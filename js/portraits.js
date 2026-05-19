// Load the character roster from the generated manifest.

import { state } from './state.js';
import { badge as iconBadge } from './icons.js';

export async function loadCharacters() {
  try {
    const res = await fetch('./assets/portraits/manifest.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('manifest http ' + res.status);
    const data = await res.json();
    state.characters = Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('Failed to load character manifest:', err);
    state.characters = [];
  }
}

// Render the suspect roster. Pass `filterIds` to scope the roster down to
// only the characters used by the active level — Play mode uses this so the
// player doesn't see twenty distractors when the case has six suspects.
export function renderRoster(container, { filterIds = null, level = null } = {}) {
  container.innerHTML = '';
  const list = filterIds
    ? state.characters.filter((c) => filterIds.includes(c.id))
    : state.characters;
  if (!list.length) {
    const empty = document.createElement('p');
    empty.className = 'hint';
    empty.textContent = 'No suspects to place yet.';
    container.appendChild(empty);
    return;
  }
  const victim = level && level.victim;
  const killer = level && (state.mode === 'play' ? level.playerKiller : level.killerSolution);
  for (const char of list) {
    const btn = document.createElement('button');
    btn.className = 'char-tile';
    btn.dataset.charId = char.id;
    btn.draggable = true;
    btn.title = `${char.name}\n${char.description}`;
    btn.innerHTML = `<img src="${char.portrait}" alt="${char.name}" draggable="false" />`;
    if (state.selectedCharacterId === char.id) btn.classList.add('active');
    // Same victim / killer badges as the grid — inline SVG so they render
    // identically on every device.
    if (char.id === victim || char.id === killer) {
      const badge = document.createElement('span');
      badge.className = 'tile-badge';
      badge.innerHTML = iconBadge({ victim: char.id === victim, killer: char.id === killer });
      btn.appendChild(badge);
    }
    container.appendChild(btn);
  }
}
