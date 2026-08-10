/**
 * Generates a base64 SVG data-URI placeholder image.
 * This keeps all images inside MongoDB as base64 strings (no file storage),
 * while still rendering a distinct, colorful placeholder for each product.
 */
const PALETTE = [
  ['#6366f1', '#8b5cf6'],
  ['#f43f5e', '#fb923c'],
  ['#10b981', '#34d399'],
  ['#0ea5e9', '#22d3ee'],
  ['#f59e0b', '#fbbf24'],
  ['#8b5cf6', '#d946ef'],
];

export function svgDataUri(
  label: string,
  accent = 0,
  size = 600,
): string {
  const [c1, c2] = PALETTE[accent % PALETTE.length];
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" fill="url(#g)"/>
  <rect x="0" y="0" width="${size}" height="${size}" fill="none" stroke="#ffffff22" stroke-width="2"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.3}" fill="#ffffff22"/>
  <circle cx="${size / 2}" cy="${size / 2}" r="${size * 0.15}" fill="#00000022"/>
  <text x="${size / 2}" y="${size * 0.62}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
        font-size="${size * 0.055}" font-weight="600" fill="#ffffff">${label}</text>
  <text x="${size / 2}" y="${size * 0.7}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif"
        font-size="${size * 0.035}" fill="#ffffffcc">3D Printed</text>
</svg>`;

  const encoded = Buffer.from(svg.trim()).toString('base64');
  return `data:image/svg+xml;base64,${encoded}`;
}
