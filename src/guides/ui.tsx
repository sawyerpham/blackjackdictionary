import type { ReactNode } from 'react';

/** Shared typography for guide articles so every guide reads the same. */

export function GuideH2({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2
      id={id}
      className="mb-3 mt-10 scroll-mt-6 border-b border-white/10 pb-2 text-2xl font-semibold text-[var(--text-primary)] first:mt-0"
    >
      {children}
    </h2>
  );
}

export function GuideH3({ children }: { children: ReactNode }) {
  return <h3 className="mb-2 mt-6 text-lg font-semibold text-[var(--accent-soft)]">{children}</h3>;
}

export function GuideP({ children }: { children: ReactNode }) {
  return <p className="mb-4 leading-relaxed text-[var(--text-primary)]">{children}</p>;
}

export function GuideUl({ children }: { children: ReactNode }) {
  return (
    <ul className="mb-4 list-disc space-y-2 pl-6 leading-relaxed text-[var(--text-primary)]">
      {children}
    </ul>
  );
}

export function GuideOl({ children }: { children: ReactNode }) {
  return (
    <ol className="mb-4 list-decimal space-y-2 pl-6 leading-relaxed text-[var(--text-primary)]">
      {children}
    </ol>
  );
}

export function GuideNote({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 rounded-lg border-l-4 border-[var(--accent)] bg-[var(--bg-third)] p-4 text-sm leading-relaxed text-[var(--text-primary)]">
      {children}
    </p>
  );
}

export function GuideFormula({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 rounded-lg bg-[var(--bg-third)] p-4 text-center font-mono text-sm text-[var(--accent-soft)]">
      {children}
    </p>
  );
}

export type TagTone = 'plus' | 'zero' | 'minus';

const TAG_TONE_STYLE: Record<TagTone, string> = {
  plus: 'bg-emerald-600 text-white',
  zero: 'bg-[var(--bg-third)] text-[var(--text-primary)]',
  minus: 'bg-red-500 text-white',
};

/** Card-tag table for counting systems, colored like the basic strategy chart cells. */
export function TagValuesTable({ rows }: { rows: { cards: string; value: string; tone: TagTone }[] }) {
  return (
    <div className="mb-4 overflow-x-auto">
      <table className="w-full min-w-[20rem] border-separate border-spacing-0.5 text-center text-sm font-semibold">
        <thead>
          <tr>
            <th className="rounded bg-[var(--bg-third)] p-2 text-[var(--text-primary)]">Cards</th>
            <th className="w-24 rounded bg-[var(--bg-third)] p-2 text-[var(--text-primary)]">Value</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.cards}>
              <td className="rounded bg-[var(--bg-second)] p-2 text-[var(--text-primary)]">{r.cards}</td>
              <td className={`rounded p-2 ${TAG_TONE_STYLE[r.tone]}`}>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
