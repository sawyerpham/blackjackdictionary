import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

function Step({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <li className="relative border-l border-[var(--line)] pb-8 pl-8 last:pb-0">
      <span className="absolute -left-3 top-0 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-third)] font-mono text-xs text-[var(--accent-soft)] ring-1 ring-[var(--line)]">
        {n}
      </span>
      <h3 className="mb-1 font-medium">{title}</h3>
      <div className="space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">{children}</div>
    </li>
  );
}

function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[0.8em] text-[var(--text-primary)]">
      {children}
    </code>
  );
}

export function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">How the math works</h1>
      <p className="mt-2 mb-10 text-[var(--text-muted)]">
        The "Optimal" hint in the simulator and every cell of the{' '}
        <Link to="/bsc" className="text-[var(--accent-soft)] hover:underline">
          strategy chart
        </Link>{' '}
        come from the same expected-value engine, written in Python and running on the server.
      </p>

      <ol>
        <Step n={1} title="Track the exact shoe">
          <p>
            The simulator knows how many of each card are left: aces, twos through nines, and ten-value cards (10, J,
            Q, K all count the same, so suits and faces are dropped). Every card dealt, yours, the dealer's and the
            NPCs', is removed.
          </p>
        </Step>
        <Step n={2} title="Work out how the dealer finishes">
          <p>
            From the dealer's upcard and the remaining cards, the engine enumerates every way the dealer can draw and
            gets the probability of ending on 17, 18, 19, 20, 21, a natural, or bust, following your table's soft-17
            rule. Draw orders that reach the same hand and shoe are cached, which turns millions of paths into
            thousands.
          </p>
        </Step>
        <Step n={3} title="Price every action">
          <p>
            <strong className="text-[var(--text-primary)]">Stand</strong> compares your total to that dealer
            distribution. <strong className="text-[var(--text-primary)]">Hit</strong> draws each possible card and
            then plays on optimally, recursively. <strong className="text-[var(--text-primary)]">Double</strong> takes
            exactly one card at twice the stake. <strong className="text-[var(--text-primary)]">Split</strong> plays
            each new hand out, including resplits up to your limit, split-ace rules and double after split.{' '}
            <strong className="text-[var(--text-primary)]">Surrender</strong> is worth −0.5.
          </p>
          <p>
            Results are in units of your bet: <Code>+0.10</Code> means you expect to win 10¢ per $1 on average.
          </p>
        </Step>
        <Step n={4} title="Account for the peek">
          <p>
            When the dealer shows an Ace or 10 and peeks, you only get to double, split or surrender if the dealer
            doesn't have blackjack. The engine conditions those extra bets on a clean peek, and still charges the
            whole bet when the dealer does have it.
          </p>
        </Step>
        <Step n={5} title="Pick the best one">
          <p>
            The action with the highest expected value is the hint. Because it uses the actual cards left rather than
            a fixed chart, it sometimes disagrees with basic strategy, and in those spots the engine is right for that
            shoe.
          </p>
        </Step>
      </ol>

      <section className="mt-12 rounded-xl border border-[var(--line)] bg-[var(--bg-second)] p-5 text-sm leading-relaxed text-[var(--text-muted)]">
        <h2 className="mb-2 font-medium text-[var(--text-primary)]">The chart uses a shortcut</h2>
        <p className="mb-2">
          Solving all 280 chart cells exactly takes minutes. For the chart, the engine removes your two cards and the
          upcard, then treats the remaining card odds as fixed. That is the standard method chart generators use: it
          takes under a second and agrees with published charts. The simulator hint always uses the exact shoe.
        </p>
        <p>
          One known simplification in the exact engine: when you split, each new hand is solved against the same
          shoe rather than the cards the other hand drew.
        </p>
      </section>
    </main>
  );
}
