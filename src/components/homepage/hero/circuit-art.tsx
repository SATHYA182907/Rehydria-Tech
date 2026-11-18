import { cn } from "@/lib/utils/cn";
import { BOARD, COMPONENTS, PADS, TRACES, toSvgPath, type Component } from "./circuit-geometry";

/**
 * Server-rendered PCB illustration: the hero's default visual and the fallback for
 * mobile, reduced motion and devices without WebGL. Current "pulses" travel from the MCU
 * along traces using CSS stroke-dash animation (no JavaScript).
 */

const PULSE_EVERY = 2; // animate every second trace to keep it calm

function Pins({ c }: { c: Component }) {
  if (c.kind !== "mcu" && c.kind !== "chip") return null;
  const per = c.kind === "mcu" ? 5 : 3;
  const step = (c.kind === "mcu" ? c.w : c.w - 0.6) / (per + 1);
  const pins: { x: number; y: number; w: number; h: number }[] = [];
  for (let i = 1; i <= per; i++) {
    const offset = (c.kind === "mcu" ? 0 : 0.3) + step * i;
    pins.push({ x: c.x + offset - 0.12, y: c.y - 0.35, w: 0.24, h: 0.35 });
    pins.push({ x: c.x + offset - 0.12, y: c.y + c.h, w: 0.24, h: 0.35 });
    if (c.kind === "mcu") {
      pins.push({ x: c.x - 0.35, y: c.y + offset - 0.12, w: 0.35, h: 0.24 });
      pins.push({ x: c.x + c.w, y: c.y + offset - 0.12, w: 0.35, h: 0.24 });
    }
  }
  return (
    <g className="fill-mint/80">
      {pins.map((p, i) => (
        <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h} rx={0.04} />
      ))}
    </g>
  );
}

function Part({ c }: { c: Component }) {
  const radius = c.kind === "resistor" || c.kind === "crystal" ? 0.35 : 0.18;
  return (
    <g>
      <Pins c={c} />
      <rect
        x={c.x}
        y={c.y}
        width={c.w}
        height={c.h}
        rx={radius}
        className={c.kind === "mcu" ? "fill-[#0b241d] stroke-mint/40" : "fill-[#0b241d] stroke-mint/25"}
        strokeWidth={0.06}
      />
      {c.kind === "mcu" && (
        <>
          <circle cx={c.x + 0.6} cy={c.y + 0.6} r={0.18} className="fill-mint/50" />
          <text x={c.x + c.w / 2} y={c.y + c.h / 2 + 0.2} textAnchor="middle" className="fill-mint font-mono" fontSize={0.62} letterSpacing={0.08}>
            REHYDRIA
          </text>
          <text x={c.x + c.w / 2} y={c.y + c.h / 2 + 1.05} textAnchor="middle" className="fill-mint/50 font-mono" fontSize={0.38}>
            RHT-MCU · 32
          </text>
        </>
      )}
      {c.label && c.kind !== "mcu" && (
        <text x={c.x} y={c.y - 0.45} className="fill-mint/45 font-mono" fontSize={0.42}>
          {c.label}
        </text>
      )}
    </g>
  );
}

export function CircuitArt({ className, animated = true }: { className?: string; animated?: boolean }) {
  return (
    <svg
      viewBox={`-0.5 -0.5 ${BOARD.width + 1} ${BOARD.height + 1}`}
      className={cn("h-auto w-full", className)}
      role="img"
      aria-label="Illustration of a printed circuit board with a microcontroller and copper traces"
    >
      <defs>
        <pattern id="pcb-dots" width="1" height="1" patternUnits="userSpaceOnUse">
          <circle cx="0.5" cy="0.5" r="0.04" className="fill-mint/15" />
        </pattern>
        <linearGradient id="pcb-board" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1d4c40" />
          <stop offset="1" stopColor="#0f2e26" />
        </linearGradient>
      </defs>

      {/* Board with chamfered corners */}
      <path
        d={`M1 0 H${BOARD.width - 1} L${BOARD.width} 1 V${BOARD.height - 1} L${BOARD.width - 1} ${BOARD.height} H1 L0 ${BOARD.height - 1} V1 Z`}
        fill="url(#pcb-board)"
      />
      <path
        d={`M1 0 H${BOARD.width - 1} L${BOARD.width} 1 V${BOARD.height - 1} L${BOARD.width - 1} ${BOARD.height} H1 L0 ${BOARD.height - 1} V1 Z`}
        fill="url(#pcb-dots)"
        className="stroke-mint/20"
        strokeWidth={0.05}
      />
      {/* Mounting holes */}
      {[
        [1.1, 1.1],
        [BOARD.width - 1.1, 1.1],
        [1.1, BOARD.height - 1.1],
        [BOARD.width - 1.1, BOARD.height - 1.1],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r={0.38} className="fill-canvas/10 stroke-mint/30" strokeWidth={0.06} />
      ))}

      {/* Copper traces */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {TRACES.map((t) => (
          <path key={t.id} d={toSvgPath(t.points)} className="stroke-moss" strokeWidth={0.16} />
        ))}
      </g>

      {/* Current pulses */}
      {animated && (
        <g fill="none" strokeLinecap="round" className="circuit-pulses">
          {TRACES.filter((_, i) => i % PULSE_EVERY === 0).map((t, i) => (
            <path
              key={t.id}
              d={toSvgPath(t.points)}
              className="trace-pulse stroke-mint"
              strokeWidth={0.22}
              style={{
                strokeDasharray: `1.4 ${t.length + 4}`,
                ["--from" as string]: 1.4,
                ["--to" as string]: -t.length,
                animationDelay: `${(i * 0.37) % 3}s`,
                animationDuration: `${2.4 + (i % 3) * 0.5}s`,
              }}
            />
          ))}
        </g>
      )}

      {/* Pads */}
      {PADS.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={0.34} className="fill-[#c9a45c]" />
          <circle cx={p.x} cy={p.y} r={0.13} className="fill-[#0f2e26]" />
        </g>
      ))}

      {COMPONENTS.map((c) => (
        <Part key={c.id} c={c} />
      ))}
    </svg>
  );
}
