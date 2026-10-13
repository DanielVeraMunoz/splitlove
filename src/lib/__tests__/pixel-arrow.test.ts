import { describe, it, expect } from '@jest/globals';
import { ARROW_HEIGHT, ARROW_PIXELS, ARROW_WIDTH, pathFor, type ArrowPart } from '../pixel-arrow';

const SYMBOL: Record<ArrowPart, string> = { head: '#', shaft: '=', feather: '/' };

function draw() {
  const grid = Array.from({ length: ARROW_HEIGHT }, () => Array<string>(ARROW_WIDTH).fill('.'));
  for (const pixel of ARROW_PIXELS) grid[pixel.y][pixel.x] = SYMBOL[pixel.part];
  return grid.map((row) => row.join(''));
}

describe('pixel arrow', () => {
  it('is drawn exactly like this (a heart-tipped arrow pointing right)', () => {
    expect(draw()).toEqual([
      '...............###....',
      '..............#####...',
      '/./...........######..',
      '././...........######.',
      '================######',
      '././...........######.',
      '/./...........######..',
      '..............#####...',
      '...............###....',
    ]);
  });

  it('keeps every pixel inside its grid and never draws two on the same spot', () => {
    const seen = new Set<string>();
    for (const { x, y } of ARROW_PIXELS) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(ARROW_WIDTH);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThan(ARROW_HEIGHT);
      expect(seen.has(`${x},${y}`)).toBe(false);
      seen.add(`${x},${y}`);
    }
  });

  it('joins the shaft to the head: no gap between them', () => {
    const shaftEnd = Math.max(...ARROW_PIXELS.filter((p) => p.part === 'shaft').map((p) => p.x));
    const shaftRow = ARROW_PIXELS.find((p) => p.part === 'shaft')!.y;
    const headStartOnShaftRow = Math.min(
      ...ARROW_PIXELS.filter((p) => p.part === 'head' && p.y === shaftRow).map((p) => p.x),
    );
    expect(headStartOnShaftRow).toBe(shaftEnd + 1);
  });

  it('builds SVG paths that cover exactly the pixels of each part', () => {
    for (const part of ['head', 'shaft', 'feather'] as const) {
      const wanted = ARROW_PIXELS.filter((p) => p.part === part).length;
      // every run is "M x y h w v1 h-w z": add up the widths
      const covered = [...pathFor(part).matchAll(/M\d+ \d+h(\d+)v1h-\d+z/g)].reduce(
        (sum, match) => sum + Number(match[1]),
        0,
      );
      expect(covered).toBe(wanted);
    }
  });
});
