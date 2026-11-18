import type { CourseIllustration as Motif } from "@/shared/types/domain";
import { cn } from "@/lib/utils/cn";

/**
 * Line-art course visual, chosen by the course's `illustration` field (admin-selected).
 * Strokes use currentColor; nodes marked `data-node` can be animated by parents.
 */
export function CourseIllustration({ motif, className }: { motif: Motif; className?: string }) {
  return (
    <svg
      viewBox="0 0 240 160"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-auto w-full", className)}
    >
      {MOTIFS[motif]}
    </svg>
  );
}

const MOTIFS: Record<Motif, React.ReactNode> = {
  network: (
    <g>
      {/* gateway + sensor nodes with signal arcs */}
      <rect x="100" y="62" width="40" height="36" rx="6" />
      <path d="M112 74h16M112 80h16M112 86h10" />
      {[
        [36, 30],
        [204, 30],
        [30, 124],
        [210, 124],
        [120, 18],
      ].map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <circle data-node cx={x} cy={y} r="7" />
          <path d={`M${x} ${y}L120 80`} strokeDasharray="3 5" opacity="0.55" />
        </g>
      ))}
      <path d="M150 52a26 26 0 0 1 0 56M158 42a40 40 0 0 1 0 76" opacity="0.5" />
      <path d="M90 52a26 26 0 0 0 0 56M82 42a40 40 0 0 0 0 76" opacity="0.5" />
    </g>
  ),
  board: (
    <g>
      {/* dev board: header rows, MCU, USB, LED */}
      <path d="M40 30h150l12 12v88H40z" />
      <rect x="26" y="52" width="20" height="26" rx="2" />
      <rect x="96" y="66" width="50" height="36" rx="3" />
      {Array.from({ length: 12 }, (_, i) => (
        <rect key={`t${i}`} x={64 + i * 10} y="38" width="5" height="6" rx="1" />
      ))}
      {Array.from({ length: 10 }, (_, i) => (
        <rect key={`b${i}`} x={74 + i * 10} y="118" width="5" height="6" rx="1" />
      ))}
      <path d="M96 76h-14M96 84h-22M96 92h-14M146 76h16M146 84h26M146 92h16" />
      <circle data-node cx="176" cy="56" r="4" />
      <circle cx="60" cy="104" r="7" />
    </g>
  ),
  chip: (
    <g>
      <rect x="84" y="44" width="72" height="72" rx="6" />
      <rect x="100" y="60" width="40" height="40" rx="3" opacity="0.6" />
      {Array.from({ length: 6 }, (_, i) => {
        const o = 52 + i * 11;
        return (
          <g key={i}>
            <path d={`M${o + 40} 44v-14M${o + 40} 116v14`} />
            <path d={`M84 ${o}h-14M156 ${o}h14`} />
          </g>
        );
      })}
      <circle data-node cx="96" cy="56" r="3" />
    </g>
  ),
  wave: (
    <g>
      <path d="M20 130h200M20 30v100" opacity="0.4" />
      {Array.from({ length: 9 }, (_, i) => (
        <path key={i} d={`M${20 + i * 25} 128v4`} opacity="0.4" />
      ))}
      <path d="M20 80c14 0 14-40 28-40s14 80 28 80 14-80 28-80 14 80 28 80 14-80 28-80 14 80 28 80 14-40 24-40" />
      <circle data-node cx="104" cy="40" r="4" />
    </g>
  ),
  robot: (
    <g>
      <rect x="80" y="46" width="80" height="58" rx="10" />
      <circle data-node cx="104" cy="74" r="7" />
      <circle cx="136" cy="74" r="7" />
      <path d="M108 92h24M120 46V28" />
      <circle cx="120" cy="24" r="4" />
      <path d="M80 70H62v26M160 70h18v26M98 104v22M142 104v22M88 126h20M132 126h20" />
    </g>
  ),
};
