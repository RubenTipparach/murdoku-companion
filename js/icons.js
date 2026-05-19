// Inline SVG glyphs for the in-game badges. Unicode emoji like 🪦 (Unicode
// 13) aren't drawn by every device's system font, so we ship our own
// shapes. Each helper returns a small <svg> string ready to drop into
// .innerHTML — sized to fit the 14×14 badge slot but scalable via CSS
// (currentColor + width 100%).

const VICTIM_SVG = `
<svg class="md-icon icon-victim" viewBox="0 0 12 12" aria-hidden="true">
  <ellipse cx="6" cy="5" rx="4" ry="3.6" fill="#f3f3f3"/>
  <rect x="4" y="7.6" width="4" height="2.8" rx="0.4" fill="#f3f3f3"/>
  <circle cx="4.3" cy="4.9" r="1" fill="#1c1330"/>
  <circle cx="7.7" cy="4.9" r="1" fill="#1c1330"/>
  <rect x="5.4" y="9" width="1.2" height="1.2" fill="#1c1330"/>
  <rect x="5.4" y="7.4" width="1.2" height="0.4" fill="#bdbdbd"/>
</svg>`;

const KILLER_SVG = `
<svg class="md-icon icon-killer" viewBox="0 0 14 14" aria-hidden="true">
  <polygon points="1,12 8.5,4.5 10,6 2.5,13.5" fill="#e5e5e5" stroke="#7a7a7a" stroke-width="0.4"/>
  <polygon points="8.5,4.5 10,6 11.5,4.5 10,3" fill="#a26b3a"/>
  <rect x="11" y="2.5" width="2" height="1.6" rx="0.3" fill="#7a4a25" transform="rotate(45 12 3.3)"/>
  <line x1="2" y1="12" x2="3.5" y2="13.5" stroke="#bd1f1f" stroke-width="0.6"/>
</svg>`;

export function victimIcon() { return VICTIM_SVG; }
export function killerIcon() { return KILLER_SVG; }

// Combined badge content for cells where both apply (rare, but safe).
export function badge({ victim = false, killer = false } = {}) {
  if (victim && killer) return VICTIM_SVG + KILLER_SVG;
  if (victim) return VICTIM_SVG;
  if (killer) return KILLER_SVG;
  return '';
}
