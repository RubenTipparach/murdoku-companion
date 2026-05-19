// Edit-mode tool handlers and the room list panel.

import {
  state,
  activeLevel,
  newRoom,
  setCellRoom,
  roomAt,
  toggleDoorway,
  deleteRoom,
  placeCharacterAt,
  key,
} from './state.js';
import { rollRoom } from './decor.js';

export function selectTool(tool) {
  state.tool = tool;
  for (const btn of document.querySelectorAll('.tool')) {
    btn.classList.toggle('active', btn.dataset.tool === tool);
  }
}

export function createRoom() {
  const lvl = activeLevel();
  if (!lvl) return null;
  const room = newRoom();
  room.name = `Room ${lvl.rooms.length + 1}`;
  lvl.rooms.push(room);
  state.selectedRoomId = room.id;
  lvl.updatedAt = Date.now();
  return room;
}

export function handleCellClickEdit(x, y, sideOpt) {
  const lvl = activeLevel();
  if (!lvl) return;

  switch (state.tool) {
    case 'paint': {
      let roomId = state.selectedRoomId;
      if (!roomId) {
        const r = createRoom();
        roomId = r.id;
      }
      setCellRoom(x, y, roomId);
      break;
    }
    case 'erase': {
      // Removing a cell from any room.
      setCellRoom(x, y, null);
      break;
    }
    case 'doorway': {
      if (!sideOpt) return; // doorway clicks only register via edge picker
      toggleDoorway(x, y, sideOpt);
      break;
    }
    case 'solution': {
      if (!roomAt(x, y)) return;
      const k = key(x, y);
      const current = lvl.solution[k];
      const sel = state.selectedCharacterId;
      if (!sel) {
        // Clicking with no selection clears the cell.
        if (current) { delete lvl.solution[k]; lvl.updatedAt = Date.now(); }
        return;
      }
      if (current === sel) {
        // Click same character on same cell to remove.
        delete lvl.solution[k];
        lvl.updatedAt = Date.now();
      } else {
        // placeCharacterAt enforces the one-cell-per-character rule.
        placeCharacterAt(x, y, sel);
      }
      break;
    }
  }
}

export function renderRoomList(container) {
  const lvl = activeLevel();
  container.innerHTML = '';
  if (!lvl) return;

  for (const room of lvl.rooms) {
    const li = document.createElement('li');
    li.dataset.roomId = room.id;
    if (state.selectedRoomId === room.id) li.classList.add('active');

    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = room.color;
    li.appendChild(sw);

    const name = document.createElement('input');
    name.className = 'name';
    name.type = 'text';
    name.value = room.name;
    name.placeholder = 'Room name';
    name.addEventListener('input', () => {
      room.name = name.value;
      lvl.updatedAt = Date.now();
      // Re-render the grid to update the floating label.
      document.dispatchEvent(new CustomEvent('murdoku:rerender'));
    });
    li.appendChild(name);

    const pick = document.createElement('button');
    pick.className = 'icon';
    pick.textContent = state.selectedRoomId === room.id ? '✓' : 'Pick';
    pick.title = 'Select room to paint with';
    pick.addEventListener('click', () => {
      state.selectedRoomId = room.id;
      document.dispatchEvent(new CustomEvent('murdoku:rerender'));
    });
    li.appendChild(pick);

    const roll = document.createElement('button');
    roll.className = 'icon';
    roll.textContent = '🎲';
    roll.title = 'Roll new tile pattern + furniture for this room';
    roll.addEventListener('click', () => {
      rollRoom(room.id);
      document.dispatchEvent(new CustomEvent('murdoku:rerender'));
    });
    li.appendChild(roll);

    const del = document.createElement('button');
    del.className = 'icon danger';
    del.textContent = '×';
    del.title = 'Delete room';
    del.addEventListener('click', () => {
      if (confirm(`Delete room "${room.name}"?`)) {
        deleteRoom(room.id);
        document.dispatchEvent(new CustomEvent('murdoku:rerender'));
      }
    });
    li.appendChild(del);

    const desc = document.createElement('textarea');
    desc.value = room.description;
    desc.placeholder = 'Room description (optional)';
    desc.addEventListener('input', () => {
      room.description = desc.value;
      lvl.updatedAt = Date.now();
    });
    li.appendChild(desc);

    container.appendChild(li);
  }
}

export function renderRoomListReadonly(container) {
  const lvl = activeLevel();
  container.innerHTML = '';
  if (!lvl) return;
  for (const room of lvl.rooms) {
    const li = document.createElement('li');
    const sw = document.createElement('span');
    sw.className = 'swatch';
    sw.style.background = room.color;
    li.appendChild(sw);
    const name = document.createElement('div');
    name.textContent = room.name + (room.description ? ` — ${room.description}` : '');
    li.appendChild(name);
    container.appendChild(li);
  }
}
