import { Link } from 'react-router-dom';

const EDGE_STATS = [
  { value: '~0.5%', label: 'avg house edge with basic strategy and flat bets' },
  { value: '+0.5–1.5%', label: 'player edge counting a well-chosen game' },
];

const FEATURES = [
  {
    tag: 'simulator',
    title: 'Full-rules simulator',
    blurb:
      'Every rule is customizable, decks, H17/S17, DAS, resplits, surrender, payouts.',
    to: '/simulator',
  },
  {
    tag: 'engine',
    title: 'Optimal-play feedback',
    blurb:
      'An engine that reveals the best play whenever you ask. Calculated using probability theory and card counting.',
    to: '/simulator',
  },
  {
    tag: 'counting',
    title: 'Six counting systems',
    blurb:
      'Hi-Lo, KO, Hi-Opt 2, Omega 2, Zen, and Wong Halves, with live running/true count tracking every card dealt at the table.',
    to: '/guides',
  },
  {
    tag: 'realistic',
    title: 'Casino pacing',
    blurb:
      'Realistic mode auto-deals the next hand, runs a decision timer, builds a heat bar when you stall, and tracks your speed with pacing stats.',
    to: '/simulator',
  },
  {
    tag: 'npcs',
    title: 'NPC players',
    blurb:
      'Seat up to five basic-strategy players beside you to push more cards through the shoe to test your skill at keeping the count.',
    to: '/simulator',
  },
  {
    tag: 'guides',
    title: 'Guides + reference panel',
    blurb:
      'Nine guides from beginner to blacklisted at every casino, plus quick-access reference panel with the strategy chart and count values.',
    to: '/guides',
  },
];

const ROUTE_STEPS = [
  { n: '1', label: 'Learn the game', to: '/guides/blackjack-overview' },
  { n: '2', label: 'Learn basic strategy', to: '/guides/basic-strategy-chart' },
  { n: '3', label: 'Count cards', to: '/guides/card-counting-overview' },
];

export function HomePage() {
  return (
    <div className="container mx-auto flex-1 px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-4xl space-y-12 sm:space-y-16">  
        {/* Hero */}
        <section>
          <h1 className="mb-3 max-w-3xl text-3xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl">
            <span className="text-[var(--accent)]">Blackjack simulation and strategy</span>
          </h1>
          <p className="mb-6 max-w-2xl text-sm text-[var(--text-muted)] sm:text-lg">
            A clean, snappy, ad-free, full-rules simulator, the strategy chart, and a counting guide library from Hi-Lo to Wong
            Halves.
          </p>
          <div className="mb-8 flex flex-wrap gap-3">
            <Link
              to="/simulator"
              className="border border-[var(--accent-strong)] bg-[var(--accent-strong)] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent)] sm:text-base"
            >
              Open Simulator
            </Link>
            <Link
              to="/guides"
              className="border border-white/20 px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)] sm:text-base"
            >
              Browse Guides
            </Link>
          </div>
          <dl className="grid grid-cols-2 gap-px border border-white/10 bg-white/10">
            {EDGE_STATS.map((stat) => (
              <div key={stat.label} className="bg-[var(--bg-second)] p-3 sm:p-4">
                <dd className="mb-1 font-mono text-lg font-bold text-[var(--accent)] sm:text-2xl">
                  {stat.value}
                </dd>
                <dt className="text-xs leading-snug text-[var(--text-muted)] sm:text-sm">
                  {stat.label}
                </dt>
              </div>
            ))}
          </dl>
        </section>

        {/* Features */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">Features</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <Link
                key={feature.tag}
                to={feature.to}
                className="group flex flex-col border border-white/10 bg-[var(--bg-second)] p-5 transition-colors hover:border-[var(--accent)]"
              >
                <p className="mb-2 font-mono text-xs text-[var(--accent)]">&gt; {feature.tag}</p>
                <h3 className="mb-2 font-semibold text-[var(--text-primary)]">{feature.title}</h3>
                <p className="flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
                  {feature.blurb}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Start-here route */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">
            New? Take this route
          </h2>
          <div className="divide-y divide-white/10 border border-white/10">
            {ROUTE_STEPS.map((step) => (
              <Link
                key={step.n}
                to={step.to}
                className="group flex items-center justify-between bg-[var(--bg-second)] px-4 py-2.5 text-sm transition-colors hover:text-[var(--accent)] sm:text-base"
              >
                <span>
                  <span className="mr-2 font-mono text-xs text-[var(--accent)] sm:text-sm">
                    [{step.n}/3]
                  </span>
                  {step.label}
                </span>
                <span className="inline-block font-mono text-[var(--accent)] transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            ))}
          </div>
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Then open the{' '}
            <Link to="/simulator" className="text-[var(--accent)] hover:underline">
              simulator
            </Link>{' '}
            and drill it with the count running.
          </p>
        </section>
      </div>
    </div>
  );
}
