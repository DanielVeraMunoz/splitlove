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

// One SVG path per part: every pixel is a 1 x 1 square. Neighbouring pixels of a row are
// merged into one run, so the path stays small.
export function pathFor(part: ArrowPart): string {
  const rows = new Map<number, number[]>();
  for (const pixel of ARROW_PIXELS) {
    if (pixel.part !== part) continue;
    const xs = rows.get(pixel.y) ?? [];
    xs.push(pixel.x);
    rows.set(pixel.y, xs);
  }

  let d = '';
  for (const [y, xs] of rows) {
    xs.sort((a, b) => a - b);
    let runStart = xs[0];
    let previous = xs[0];
    // a run ends when the next x is not right next to the previous one
    for (const x of [...xs.slice(1), Infinity]) {
      if (x !== previous + 1) {
        const width = previous - runStart + 1;
        d += `M${runStart} ${y}h${width}v1h-${width}z`;
        runStart = x;
      }
      previous = x;
    }
  }
  return d;
}
