// Load the character roster from the generated manifest.

import { state } from './state.js';

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

export function renderRoster(container, { mode }) {
  container.innerHTML = '';
  for (const char of state.characters) {
    const btn = document.createElement('button');
    btn.className = 'char-tile';
    btn.dataset.charId = char.id;
    btn.draggable = true;
    btn.title = `${char.name}\n${char.description}`;
    btn.innerHTML = `<img src="${char.portrait}" alt="${char.name}" draggable="false" />`;
    if (state.selectedCharacterId === char.id) btn.classList.add('active');
    container.appendChild(btn);
  }
}
