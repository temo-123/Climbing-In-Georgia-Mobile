// Tiny colour helpers for tinting token colours (no colour library needed).
function rgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// '#1f93b0', .2 → 'rgba(31,147,176,0.2)'
export function alpha(hex, a) {
  const [r, g, b] = rgb(hex);
  return `rgba(${r},${g},${b},${a})`;
}

// Sass mix(#000, $c, amount): darken towards black.
export function darken(hex, amount) {
  const [r, g, b] = rgb(hex).map((c) => Math.round(c * (1 - amount)));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}

// Alpha-blend `hex` at `a` over a white background → opaque hex. RN can't
// layer two backgrounds, so table cells use the pre-blended colour.
export function tintOnWhite(hex, a) {
  const [r, g, b] = rgb(hex).map((c) => Math.round(255 - (255 - c) * a));
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
}
