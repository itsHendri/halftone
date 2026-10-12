import { cn } from 'cn';
import type { LucideIcon } from 'lucide-react';

type Palette = 'chart' | 'mono' | 'primary';

type Props = {
  /** Any string: the same seed always draws the same art. */
  seed: string;
  /** Width / height. Default 1 (square). */
  ratio?: number;
  /** Which token family to draw in. Default `chart`. */
  palette?: Palette;
  /** Optional glyph centred over the art. */
  icon?: LucideIcon;
  className?: string;
};

/** 32-bit string hash: stable across platforms and reloads. The native kit uses the same one, so a seed draws the same art in both. */
function hash(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Small, fast, seedable PRNG. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Shape =
  | { kind: 'circle'; cx: number; cy: number; r: number; fill: number; opacity: number }
  | { kind: 'rect'; x: number; y: number; w: number; h: number; rx: number; fill: number; opacity: number }
  | { kind: 'arc'; d: string; fill: number; opacity: number };

function shapesFor(seed: string): Shape[] {
  const rand = mulberry32(hash(seed));
  const count = 5 + Math.floor(rand() * 3);
  const out: Shape[] = [];
  for (let i = 0; i < count; i++) {
    const fill = Math.floor(rand() * 5);
    const opacity = 0.12 + rand() * 0.22;
    const pick = rand();
    if (pick < 0.45) {
      out.push({ kind: 'circle', cx: rand() * 100, cy: rand() * 100, r: 14 + rand() * 30, fill, opacity });
    } else if (pick < 0.8) {
      const w = 22 + rand() * 46;
      const h = 22 + rand() * 46;
      out.push({ kind: 'rect', x: rand() * (100 - w), y: rand() * (100 - h), w, h, rx: 4 + rand() * 14, fill, opacity });
    } else {
      const cx = rand() * 100;
      const cy = rand() * 100;
      const r = 20 + rand() * 34;
      out.push({ kind: 'arc', d: `M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy} Z`, fill, opacity });
    }
  }
  return out;
}

const FILLS: Record<Palette, string[]> = {
  chart: ['fill-chart-1', 'fill-chart-2', 'fill-chart-3', 'fill-chart-4', 'fill-chart-5'],
  mono: ['fill-muted-foreground', 'fill-border', 'fill-muted-foreground', 'fill-border', 'fill-muted-foreground'],
  primary: ['fill-primary', 'fill-primary', 'fill-ring', 'fill-primary', 'fill-ring'],
};

/**
 * Deterministic abstract SVG art from a seed: stand-in imagery that never 404s.
 *
 * Drawn from theme colours, so it follows light/dark and re-brands with the tokens. Use it wherever a prototype
 * needs a picture it does not have: product shots, covers, avatars, the art on a PromoCard.
 */
export function Placeholder({ seed, ratio = 1, palette = 'chart', icon: Icon, className }: Props) {
  const fills = FILLS[palette];
  return (
    <div aria-hidden className={cn('bg-muted relative flex w-full items-center justify-center overflow-hidden rounded-lg', className)} style={{ aspectRatio: ratio }}>
      <svg className="absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        {shapesFor(seed).map((s, i) =>
          s.kind === 'circle' ? (
            <circle key={i} cx={s.cx} cy={s.cy} r={s.r} className={fills[s.fill]} opacity={s.opacity} />
          ) : s.kind === 'rect' ? (
            <rect key={i} x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} className={fills[s.fill]} opacity={s.opacity} />
          ) : (
            <path key={i} d={s.d} className={fills[s.fill]} opacity={s.opacity} />
          )
        )}
      </svg>
      {Icon ? <Icon className="text-muted-foreground relative size-7" /> : null}
    </div>
  );
}
