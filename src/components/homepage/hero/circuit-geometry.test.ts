import { describe, expect, it } from "vitest";
import { BOARD, pointAt, TRACES, type Point } from "./circuit-geometry";

type Segment = [Point, Point];

function segments(points: Point[]): Segment[] {
  return points.slice(1).map((p, i) => [points[i]!, p]);
}

/** Axis-aligned segment intersection (traces are Manhattan routed). */
function intersects([a1, a2]: Segment, [b1, b2]: Segment): boolean {
  const aH = a1.y === a2.y;
  const bH = b1.y === b2.y;
  const between = (v: number, p: number, q: number) => v > Math.min(p, q) + 1e-6 && v < Math.max(p, q) - 1e-6;
  if (aH === bH) return false; // parallel segments in this layout never overlap
  const [h, v] = aH ? [[a1, a2], [b1, b2]] : [[b1, b2], [a1, a2]];
  return between(v[0]!.x, h[0]!.x, h[1]!.x) && between(h[0]!.y, v[0]!.y, v[1]!.y);
}

describe("circuit geometry", () => {
  it("routes 20 traces inside the board", () => {
    expect(TRACES).toHaveLength(20);
    for (const t of TRACES) {
      for (const p of t.points) {
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(BOARD.width);
        expect(p.y).toBeGreaterThanOrEqual(0);
        expect(p.y).toBeLessThanOrEqual(BOARD.height);
      }
    }
  });

  it("never crosses traces", () => {
    for (let i = 0; i < TRACES.length; i++) {
      for (let j = i + 1; j < TRACES.length; j++) {
        for (const s1 of segments(TRACES[i]!.points)) {
          for (const s2 of segments(TRACES[j]!.points)) {
            expect(intersects(s1, s2), `${TRACES[i]!.id} × ${TRACES[j]!.id}`).toBe(false);
          }
        }
      }
    }
  });

  it("interpolates along a trace", () => {
    const t = TRACES[0]!;
    expect(pointAt(t, 0)).toEqual(t.points[0]);
    const end = pointAt(t, t.length + 5);
    expect(end.x).toBeCloseTo(t.points.at(-1)!.x);
    expect(end.y).toBeCloseTo(t.points.at(-1)!.y);
  });
});
