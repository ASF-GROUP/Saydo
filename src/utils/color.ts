/**
 * Convert a hex color string to rgba() with the given alpha.
 * Handles 3-char (#abc), 6-char (#aabbcc), and bare (aabbcc) formats.
 * Returns a fallback gray if the input is invalid.
 */
export function hexToRgba(hex: string, alpha: number): string {
  let h = hex.replace(/^#/, "");

  // Expand shorthand (#abc → aabbcc)
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }

  if (h.length !== 6) {
    return `rgba(128,128,128,${alpha})`;
  }

  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return `rgba(128,128,128,${alpha})`;
  }

  return `rgba(${r},${g},${b},${alpha})`;
}
