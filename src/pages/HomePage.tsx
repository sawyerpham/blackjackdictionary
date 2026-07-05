import { Link } from 'react-router-dom';
import { GUIDES } from '../guides/registry';

const START_HERE = [
  {
    step: '1',
    title: 'Learn the game',
    blurb: 'How blackjack works, the house edge, and betting it right.',
    to: '/guides/blackjack-overview',
    linkLabel: 'Overview of blackjack',
  },
  {
    step: '2',
    title: 'Learn basic strategy',
    blurb: 'One correct play for every hand, get these automatic.',
    to: '/guides/basic-strategy-chart',
    linkLabel: 'Basic strategy chart',
  },
  {
    step: '3',
    title: 'Count cards',
    blurb: 'Start tracking and turn the edge to your side.',
    to: '/guides/card-counting-overview',
    linkLabel: 'Intro to card counting',
  },
];

/** Guide library grouped by difficulty; slugs resolve against the registry. */
const LIBRARY_TIERS = [
  {
    label: 'Fundamentals',
    slugs: ['blackjack-overview', 'basic-strategy-chart', 'card-counting-overview'],
  },
  {
    label: 'Level 1 systems',
    slugs: ['hi-lo-illustrious-18', 'ko'],
  },
  {
    label: 'Level 2 systems',
    slugs: ['hi-opt-2', 'omega-2', 'zen'],
  },
  {
    label: 'Level 3',
    slugs: ['wong-halves'],
  },
];

const HERO_STATS = [
  { value: '~0.5%', label: 'house edge with basic strategy and flat bets' },
  { value: '+0.5-1.5%', label: 'player edge counting a well-chosen game' },
];

function GuideCard({ slug }: { slug: string }) {
  const guide = GUIDES.find((g) => g.slug === slug);
  if (!guide) return null;
  return (
    <Link
      to={`/guides/${guide.slug}`}
      className="border border-white/10 bg-[var(--bg-second)] p-5 transition-colors hover:border-[var(--accent)]"
    >
      <h4 className="mb-1 font-semibold text-[var(--accent)]">{guide.title}</h4>
      <p className="text-sm leading-relaxed text-[var(--text-muted)]">{guide.description}</p>
    </Link>
  );
}

export function HomePage() {
  return (
    <div className="container mx-auto flex-1 px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-5xl space-y-16 sm:space-y-20">
        {/* Hero */}
        <section>
          <h1 className="mb-4 max-w-3xl text-4xl font-bold leading-tight text-[var(--text-primary)] sm:text-5xl">
            Play blackjack with the <span className="text-[var(--accent)]">math</span> on your
            side.
          </h1>
          <p className="mb-8 max-w-2xl text-lg text-[var(--text-muted)]">
            From basic strategy to card counting, all in one: a full-rules simulator, the strategy
            chart, and a counting library that goes from Hi-Lo to Wong Halves.
          </p>
          <div className="mb-12 flex flex-wrap gap-4">
            <Link
              to="/simulator"
              className="border border-[var(--accent-strong)] bg-[var(--accent-strong)] px-6 py-3 font-medium text-white transition-colors hover:bg-[var(--accent)]"
            >
              Open Simulator
            </Link>
            <Link
              to="/guides/blackjack-overview"
              className="border border-white/20 px-6 py-3 font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              New to blackjack? Open the guide
            </Link>
          </div>
          <dl className="grid grid-cols-1 gap-px border border-white/10 bg-white/10 sm:grid-cols-2">
            {HERO_STATS.map((stat) => (
              <div key={stat.label} className="bg-[var(--bg-second)] p-4">
                <dd className="mb-1 font-mono text-2xl font-bold text-[var(--accent)]">
                  {stat.value}
                </dd>
                <dt className="text-sm text-[var(--text-muted)]">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </section>

        {/* Start-here route */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">
            New? Take this route
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {START_HERE.map((step) => (
              <Link
                key={step.step}
                to={step.to}
                className="group flex flex-col border border-white/10 bg-[var(--bg-second)] p-6 transition-colors hover:border-[var(--accent)]"
              >
                <p className="mb-3 font-mono text-sm text-[var(--accent)]">[{step.step}/3]</p>
                <h3 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
                  {step.title}
                </h3>
                <p className="mb-4 flex-1 text-sm leading-relaxed text-[var(--text-muted)]">
                  {step.blurb}
                </p>
                <p className="font-mono text-sm text-[var(--accent)]">
                  <span className="inline-block transition-transform group-hover:translate-x-1">
                    →
                  </span>{' '}
                  {step.linkLabel}
                </p>
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

        {/* Guide library, grouped by difficulty */}
        <section>
          <h2 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">The guide library</h2>
          <div className="space-y-8">
            {LIBRARY_TIERS.map((tier) => (
              <div key={tier.label}>
                <h3 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">
                  {tier.label}
                </h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {tier.slugs.map((slug) => (
                    <GuideCard key={slug} slug={slug} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
