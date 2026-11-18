/**
 * Deterministic PCB layout shared by the SVG hero art and the 3D scene, so the fallback
 * and the WebGL version are the same composition.
 *
 * Coordinate space: a 24 × 18 unit board, origin top-left, y down. A central MCU has
 * five pins per side; each pin's trace fans out with a single bend so traces never
 * cross: outer pins turn first and spread further (classic BGA fan-out).
 */

export const BOARD = { width: 24, height: 18 } as const;

export interface Point {
  x: number;
  y: number;
}

export interface Trace {
  id: string;
  points: Point[];
  /** Total polyline length, used for pulse timing and dash animation. */
  length: number;
  side: "left" | "right" | "top" | "bottom";
}

export interface Component {
  id: string;
  kind: "mcu" | "chip" | "crystal" | "resistor" | "header";
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
}

const CENTER = { x: 12, y: 9 };
const CHIP_HALF = 3;
const PIN_OFFSETS = [-2, -1, 0, 1, 2];
/** Left/right traces stay inside the band below where top/bottom traces turn, so quadrants never cross. */
const SIDE_SPREAD = 0.4;
/** Top/bottom traces fan wider horizontally for a fuller composition. */
const TOP_BOTTOM_FAN = 2;
const EDGE_MARGIN = { x: 1.4, y: 1.3 };

function polylineLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1]!;
    const b = points[i]!;
    total += Math.hypot(b.x - a.x, b.y - a.y);
  }
  return total;
}

function fanOut(side: Trace["side"]): Trace[] {
  return PIN_OFFSETS.map((k) => {
    const firstRun = 0.9 + (2 - Math.abs(k)) * 0.75;
    const shifted = k * (1 + SIDE_SPREAD);
    let points: Point[];
    switch (side) {
      case "left": {
        const x0 = CENTER.x - CHIP_HALF;
        const y0 = CENTER.y + k;
        points = [
          { x: x0, y: y0 },
          { x: x0 - firstRun, y: y0 },
          { x: x0 - firstRun, y: CENTER.y + shifted },
          { x: EDGE_MARGIN.x, y: CENTER.y + shifted },
        ];
        break;
      }
      case "right": {
        const x0 = CENTER.x + CHIP_HALF;
        const y0 = CENTER.y + k;
        points = [
          { x: x0, y: y0 },
          { x: x0 + firstRun, y: y0 },
          { x: x0 + firstRun, y: CENTER.y + shifted },
          { x: BOARD.width - EDGE_MARGIN.x, y: CENTER.y + shifted },
        ];
        break;
      }
      case "top": {
        const x0 = CENTER.x + k;
        const y0 = CENTER.y - CHIP_HALF;
        points = [
          { x: x0, y: y0 },
          { x: x0, y: y0 - firstRun * 0.6 },
          { x: CENTER.x + shifted * TOP_BOTTOM_FAN, y: y0 - firstRun * 0.6 },
          { x: CENTER.x + shifted * TOP_BOTTOM_FAN, y: EDGE_MARGIN.y },
        ];
        break;
      }
      case "bottom": {
        const x0 = CENTER.x + k;
        const y0 = CENTER.y + CHIP_HALF;
        points = [
          { x: x0, y: y0 },
          { x: x0, y: y0 + firstRun * 0.6 },
          { x: CENTER.x + shifted * TOP_BOTTOM_FAN, y: y0 + firstRun * 0.6 },
          { x: CENTER.x + shifted * TOP_BOTTOM_FAN, y: BOARD.height - EDGE_MARGIN.y },
        ];
        break;
      }
    }
    // Drop zero-length segments (the centre pin runs straight).
    points = points.filter((p, i) => i === 0 || p.x !== points[i - 1]!.x || p.y !== points[i - 1]!.y);
    return { id: `${side}${k + 2}`, side, points, length: polylineLength(points) };
  });
}

export const TRACES: Trace[] = (["left", "right", "top", "bottom"] as const).flatMap(fanOut);

export const COMPONENTS: Component[] = [
  { id: "U1", kind: "mcu", x: CENTER.x - CHIP_HALF, y: CENTER.y - CHIP_HALF, w: CHIP_HALF * 2, h: CHIP_HALF * 2, label: "U1 · MCU" },
  { id: "U2", kind: "chip", x: 1.6, y: 14.2, w: 3.2, h: 2.2, label: "U2" },
  { id: "U3", kind: "chip", x: 19.4, y: 1.4, w: 3, h: 2, label: "U3" },
  { id: "Y1", kind: "crystal", x: 19.0, y: 13.4, w: 2.4, h: 1.1, label: "Y1" },
  { id: "R1", kind: "resistor", x: 4.2, y: 1.6, w: 1.8, h: 0.7, label: "R1" },
  { id: "R2", kind: "resistor", x: 6.8, y: 1.6, w: 1.8, h: 0.7, label: "R2" },
  { id: "J1", kind: "header", x: 20.6, y: 15.4, w: 2.4, h: 1, label: "J1" },
];

/** End pads (vias) at the outer end of every trace. */
export const PADS: Point[] = TRACES.map((t) => t.points[t.points.length - 1]!);

/** Point at distance `d` along a trace (clamped). */
export function pointAt(trace: Trace, d: number): Point {
  let remaining = Math.max(0, Math.min(d, trace.length));
  for (let i = 1; i < trace.points.length; i++) {
    const a = trace.points[i - 1]!;
    const b = trace.points[i]!;
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (remaining <= seg) {
      const t = seg === 0 ? 0 : remaining / seg;
      return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
    }
    remaining -= seg;
  }
  return trace.points[trace.points.length - 1]!;
}

export function toSvgPath(points: Point[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(" ");
}
