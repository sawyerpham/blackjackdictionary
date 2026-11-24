import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';

function money(n: number, signed = false): string {
  const s = `$${Math.abs(Math.round(n)).toLocaleString()}`;
  if (!signed) return n < 0 ? `-${s}` : s;
  return n > 0 ? `+${s}` : n < 0 ? `−${s}` : s;
}

const W = 600;
const H = 160;
const PAD = 8;

/** Session profit: hero number, round stats, and a cumulative-profit line with a hover crosshair.
 *  `rounds` holds each round's net result in dollars, oldest first. */
export function ProfitTracker({ rounds, onReset }: { rounds: number[]; onReset: () => void }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const cumulative: number[] = [0];
  for (const r of rounds) cumulative.push(cumulative[cumulative.length - 1] + r);
  const net = cumulative[cumulative.length - 1];
  const max = Math.max(0, ...cumulative);
  const min = Math.min(0, ...cumulative);
  const span = max - min || 1;
  const x = (i: number) => (cumulative.length > 1 ? (i / (cumulative.length - 1)) * W : 0);
  const y = (v: number) => PAD + ((max - v) / span) * (H - PAD * 2);
  const line = cumulative.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');

  const wins = rounds.filter((r) => r > 0).length;
  const losses = rounds.filter((r) => r < 0).length;
  const stats: [string, string][] = [
    ['Rounds', rounds.length ? String(rounds.length) : '—'],
    ['Won / lost', rounds.length ? `${wins} / ${losses}` : '—'],
    ['Avg / round', rounds.length ? money(net / rounds.length, true) : '—'],
    ['Best round', rounds.length ? money(Math.max(...rounds), true) : '—'],
    ['Worst round', rounds.length ? money(Math.min(...rounds), true) : '—'],
    ['Peak', rounds.length ? money(max, true) : '—'],
  ];

  const onMove = (e: PointerEvent<SVGSVGElement>) => {
    const box = svgRef.current?.getBoundingClientRect();
    if (!box || cumulative.length < 2) return;
    const i = Math.round(((e.clientX - box.left) / box.width) * (cumulative.length - 1));
    setHover(Math.max(0, Math.min(cumulative.length - 1, i)));
  };

  const hv = hover === null ? null : cumulative[hover];
  const tipLeft = hover === null ? 0 : (x(hover) / W) * 100;

  return (
    <section aria-label="Profit tracker" className="mt-6 rounded-[12px] bg-[var(--bg-second)] p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-caption text-[var(--text-muted)]">Session profit</h2>
          <p
            className={`tabular-nums text-3xl font-semibold ${
              net > 0 ? 'text-emerald-400' : net < 0 ? 'text-rose-400' : ''
            }`}
          >
            {money(net, true)}
          </p>
        </div>
        <button
          type="button"
          onClick={onReset}
          disabled={!rounds.length}
          className="min-h-11 px-2 text-[15px] text-[var(--accent)] active:opacity-50 disabled:text-[var(--text-muted)] disabled:opacity-60"
        >
          Reset tracker
        </button>
      </div>

      {rounds.length === 0 ? (
        <p className="py-10 text-center text-[15px] text-[var(--text-muted)]">
          Play a hand to start tracking profit.
        </p>
      ) : (
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex flex-col justify-between py-1 tabular-nums text-[10px] text-[var(--text-muted)]">
            <span>{money(max, true)}</span>
            <span>{money(min, true)}</span>
          </div>
          <svg
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label={`Cumulative profit over ${rounds.length} rounds, now ${money(net, true)}`}
            onPointerMove={onMove}
            onPointerLeave={() => setHover(null)}
            className="ml-14 block h-40 w-[calc(100%-3.5rem)] touch-none"
          >
            <line
              x1="0"
              x2={W}
              y1={y(0)}
              y2={y(0)}
              stroke="rgb(255 255 255 / 0.18)"
              strokeDasharray="4 4"
              vectorEffect="non-scaling-stroke"
            />
            <path d={line} fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
            {hover !== null && (
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1="0"
                y2={H}
                stroke="rgb(255 255 255 / 0.35)"
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>
          {hover !== null && hv !== null && (
            <>
              <span
                className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--accent)] ring-2 ring-[var(--bg-second)]"
                style={{ left: `calc(3.5rem + (100% - 3.5rem) * ${tipLeft / 100})`, top: `${(y(hv) / H) * 10}rem` }}
              />
              <div
                className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-md border border-[var(--line)] bg-[var(--bg-main)] px-2 py-1 text-xs whitespace-nowrap shadow-lg"
                style={{ left: `clamp(4rem, calc(3.5rem + (100% - 3.5rem) * ${tipLeft / 100}), calc(100% - 4rem))` }}
              >
                <span className="text-[var(--text-muted)]">{hover === 0 ? 'Start' : `Round ${hover}`}</span>{' '}
                <span className="tabular-nums font-semibold">{money(hv, true)}</span>
                {hover > 0 && (
                  <span className="ml-1 tabular-nums text-[var(--text-muted)]">
                    ({money(rounds[hover - 1], true)})
                  </span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <dl className="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-[10px] bg-[var(--line)] sm:grid-cols-3 lg:grid-cols-6">
        {stats.map(([label, value]) => (
          <div key={label} className="bg-[var(--bg-second)] p-3">
            <dt className="text-caption text-[var(--text-muted)]">{label}</dt>
            <dd className="mt-0.5 tabular-nums text-base font-semibold">{value}</dd>
          </div>
        ))}
      </dl>

      {rounds.length > 0 && (
        <details className="mt-3 text-sm text-[var(--text-muted)]">
          <summary className="cursor-pointer select-none hover:text-[var(--text-primary)]">View last 20 rounds as a table</summary>
          <table className="mt-2 w-full max-w-sm tabular-nums text-xs">
            <thead>
              <tr className="text-left">
                <th className="py-1 font-medium">Round</th>
                <th className="py-1 font-medium">Result</th>
                <th className="py-1 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {rounds
                .map((r, i) => [i + 1, r, cumulative[i + 1]] as const)
                .slice(-20)
                .reverse()
                .map(([n, r, c]) => (
                  <tr key={n} className="border-t border-[var(--line)] text-[var(--text-primary)]">
                    <td className="py-1">{n}</td>
                    <td className="py-1">{money(r, true)}</td>
                    <td className="py-1">{money(c, true)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </details>
      )}
    </section>
  );
}
