// An 8-bit arrow pointing right whose head is the pixel heart of the logo. Pure data (no
// React Native), so it can be checked on its own. The left-pointing arrow is just this one
// mirrored when drawn.

export type ArrowPart = 'head' | 'shaft' | 'feather';
export type ArrowPixel = { x: number; y: number; part: ArrowPart };

// The logo heart (tip pointing down) on its 9 x 8 grid
const HEART = [
  '.##...##.',
  '####.####',
  '#########',
  '#########',
  '.#######.',
  '..#####..',
  '...###...',
  '....#....',
];

const HEART_WIDTH = 9;
// Where the head starts. The shaft runs 2 pixels further, into the heart's notch,
// so there is no gap between shaft and head.
const HEAD_OFFSET = 14;
const SHAFT_LENGTH = HEAD_OFFSET + 2;

// Turn the heart a quarter so its tip points right: (x, y) -> (y, 8 - x). It becomes 8 wide
// and 9 tall, and the notch between the two lobes ends up on the left, in line with the shaft.
const head: ArrowPixel[] = [];
HEART.forEach((row, y) => {
  [...row].forEach((cell, x) => {
    if (cell === '#') head.push({ x: HEAD_OFFSET + y, y: HEART_WIDTH - 1 - x, part: 'head' });
  });
});

const CENTER_Y = 4;
const shaft: ArrowPixel[] = Array.from({ length: SHAFT_LENGTH }, (_, x) => ({
  x,
  y: CENTER_Y,
  part: 'shaft',
}));

// Two pairs of slanted feathers at the tail
const feathers: ArrowPixel[] = [
  [0, 2], [1, 3], [2, 2], [3, 3],
  [0, 6], [1, 5], [2, 6], [3, 5],
].map(([x, y]) => ({ x, y, part: 'feather' as const }));

export const ARROW_PIXELS: ArrowPixel[] = [...shaft, ...feathers, ...head];
export const ARROW_WIDTH = HEAD_OFFSET + 8;
export const ARROW_HEIGHT = HEART_WIDTH;

// One SVG path per part: every pixel is a 1 x 1 square. Adjacent pixels of a row are merged
// into a single run so the path stays small.
export function pathFor(part: ArrowPart): string {
  const rows = new Map<number, number[]>();
  for (const p of ARROW_PIXELS) {
    if (p.part === part) rows.set(p.y, [...(rows.get(p.y) ?? []), p.x]);
  }
  let d = '';
  for (const [y, xs] of rows) {
    const sorted = [...xs].sort((a, b) => a - b);
    let start = sorted[0];
    for (let i = 1; i <= sorted.length; i++) {
      if (sorted[i] !== sorted[i - 1] + 1) {
        d += `M${start} ${y}h${sorted[i - 1] - start + 1}v1h-${sorted[i - 1] - start + 1}z`;
        start = sorted[i];
      }
    }
  }
  return d;
}
