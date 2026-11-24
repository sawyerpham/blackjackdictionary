import { Link } from 'react-router-dom';

const EDGE_STATS = [
  { value: '~0.5%', label: 'avg house edge with basic strategy and flat bets' },
  { value: '+0.5–1.5%', label: 'player edge counting a well-chosen game' },
];

const FEATURES = [
  {
    tag: 'Simulator',
    title: 'Full-rules simulator',
    blurb:
      'Every rule is customizable, decks, H17/S17, DAS, resplits, surrender, payouts.',
    to: '/simulator',
  },
  {
    tag: 'Engine',
    title: 'Optimal-play feedback',
    blurb:
      'An engine that reveals the best play whenever you ask. Calculated using probability theory and card counting.',
    to: '/simulator',
  },
  {
    tag: 'Counting',
    title: 'Six counting systems',
    blurb:
      'Hi-Lo, KO, Hi-Opt 2, Omega 2, Zen, and Wong Halves, with live running/true count tracking every card dealt at the table.',
    to: '/guides',
  },
  {
    tag: 'Realistic mode',
    title: 'Casino pacing',
    blurb:
      'Realistic mode auto-deals the next hand, runs a decision timer, builds a heat bar when you stall, and tracks your speed with pacing stats.',
    to: '/simulator',
  },
  {
    tag: 'NPCs',
    title: 'NPC players',
    blurb:
      'Seat up to five basic-strategy players beside you to push more cards through the shoe to test your skill at keeping the count.',
    to: '/simulator',
  },
  {
    tag: 'Guides',
    title: 'Guides + reference panel',
    blurb:
      'Nine guides from beginner to blacklisted at every casino, plus quick-access reference panel with the strategy chart and count values.',
    to: '/guides',
  },
];

const ROUTE_STEPS = [
  { n: '1', label: 'Learn the game', to: '/guides/blackjack-overview' },
  { n: '2', label: 'Learn basic strategy', to: '/bsc' },
  { n: '3', label: 'Count cards', to: '/guides/card-counting-overview' },
];

const Chevron = () => (
  <svg viewBox="0 0 8 14" className="h-3.5 w-2 shrink-0" aria-hidden>
    <path d="M1 1l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export function HomePage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12 sm:py-20">
      <div className="space-y-16 sm:space-y-20">
        {/* Hero */}
        <section>
          <h1 className="mb-4 max-w-3xl text-[40px] leading-[1.05] font-bold tracking-[-0.03em] sm:text-[56px]">
            Blackjack simulation and strategy.
          </h1>
          <p className="mb-8 max-w-2xl text-[19px] leading-snug text-[var(--text-muted)] sm:text-[21px]">
            A clean, ad-free, full-rules simulator, a strategy chart for any table, and counting guides from Hi-Lo to
            Wong Halves.
          </p>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <Link
              to="/simulator"
              className="flex min-h-11 items-center rounded-full bg-[var(--accent)] px-6 text-[17px] text-white transition hover:brightness-110"
            >
              Open Simulator
            </Link>
            <Link to="/guides" className="flex min-h-11 items-center gap-1.5 text-[17px] text-[var(--accent)] hover:underline">
              Browse Guides
              <Chevron />
            </Link>
          </div>
          <dl className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {EDGE_STATS.map((stat) => (
              <div key={stat.label} className="rounded-[18px] bg-[var(--bg-second)] p-5">
                <dd className="text-[34px] leading-tight font-semibold tracking-[-0.02em] tabular-nums">{stat.value}</dd>
                <dt className="text-footnote mt-1 text-[var(--text-muted)]">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* Features */}
        <section>
          <h2 className="text-title-2 mb-5 sm:text-[28px]">Features</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Link
                key={feature.tag}
                to={feature.to}
                className="flex flex-col rounded-[18px] bg-[var(--bg-second)] p-5 transition-colors hover:bg-[var(--bg-third)]"
              >
                <p className="text-caption mb-1.5 text-[var(--text-muted)]">{feature.tag}</p>
                <h3 className="text-headline mb-1.5">{feature.title}</h3>
                <p className="flex-1 text-[15px] leading-relaxed text-[var(--text-muted)]">{feature.blurb}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Start-here route */}
        <section>
          <h2 className="text-title-2 mb-5 sm:text-[28px]">New? Start here</h2>
          <div className="overflow-hidden rounded-[10px] bg-[var(--bg-second)]">
            {ROUTE_STEPS.map((step) => (
              <Link
                key={step.n}
                to={step.to}
                className="block pl-4 transition-colors active:bg-white/[0.08] [&+&>span]:border-t [&+&>span]:border-[var(--line)]"
              >
                <span className="flex min-h-11 items-center gap-3 py-2.5 pr-4 text-[17px]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[15px] font-semibold text-white tabular-nums">
                    {step.n}
                  </span>
                  <span className="flex-1">{step.label}</span>
                  <span className="text-[rgb(235_235_245/0.3)]">
                    <Chevron />
                  </span>
                </span>
              </Link>
            ))}
          </div>
          <p className="text-footnote mt-3 px-4 text-[var(--text-muted)]">
            Then open the{' '}
            <Link to="/simulator" className="text-[var(--accent)] hover:underline">
              simulator
            </Link>{' '}
            and drill it with the count running.
          </p>
        </section>
      </div>
    </main>
  );
}
