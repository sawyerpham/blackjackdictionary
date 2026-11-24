import type { ReactNode } from 'react';

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="relative border-l border-[var(--line)] pb-8 pl-8 last:pb-0">
      <span className="absolute top-0 -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-third)] text-xs text-[var(--accent-soft)] tabular-nums ring-1 ring-[var(--line)]">
        {n}
      </span>
      <h2 className="mb-2 font-medium">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-[var(--text-muted)]">{children}</div>
    </section>
  );
}

// Equations are native MathML, rendered by the browser (no math library).
/** Display equation; scales with the viewport instead of scrolling, so the widest one still fits a phone. */
const Eq = ({ children }: { children: ReactNode }) => (
  <math display="block" className="py-1 text-[clamp(0.74rem,3.5vw,1.05rem)] text-[var(--text-primary)]">
    {children}
  </math>
);
/** Inline math. */
const M = ({ children }: { children: ReactNode }) => (
  <math className="text-[1.05em] text-[var(--text-primary)]">{children}</math>
);

const mi = (x: string) => <mi>{x}</mi>;
const mn = (x: string) => <mn>{x}</mn>;
// Brackets don't stretch to the height of a neighbouring ∑, and sit tight against their contents.
const mo = (x: string) =>
  '(){}'.includes(x) ? (
    <mo stretchy="false" lspace="0" rspace="0">
      {x}
    </mo>
  ) : (
    <mo>{x}</mo>
  );
const sub = (base: ReactNode, s: ReactNode) => (
  <msub>
    {base}
    {s}
  </msub>
);
const paren = (...xs: ReactNode[]) => (
  <mrow>
    {mo('(')}
    {xs}
    {mo(')')}
  </mrow>
);
const EV = (name?: string) =>
  name ? sub(<mi mathvariant="normal">EV</mi>, <mtext>{name}</mtext>) : <mi mathvariant="normal">EV</mi>;
/** P_n(x): probability under shoe n. */
const Pn = (arg: ReactNode) => (
  <mrow>
    {sub(mi('P'), mi('n'))}
    {paren(arg)}
  </mrow>
);
const sumI = (
  <munder>
    <mo>∑</mo>
    <mi>i</mi>
  </munder>
);
/** (h, n) */
const hn = paren(mi('h'), mo(','), mi('n'));
/** (h + i, n − e_i): one card of rank i moves from the shoe to the hand. */
const next = paren(mi('h'), mo('+'), mi('i'), mo(','), mi('n'), mo('−'), sub(mi('e'), mi('i')));

export function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <h1 className="text-large-title">How the math works</h1>
      <p className="mt-2 mb-10 text-[var(--text-muted)]">
        Each recommendation is the action with the highest expected value (EV), in units of the initial bet.
      </p>

      <Section n={1} title="State">
        <p>
          The shoe is a count vector <M>{mi('n')}</M> of unseen cards by rank, with 10, J, Q and K merged.
        </p>
        <Eq>
          {Pn(mi('i'))}
          {mo('=')}
          <mfrac>
            {sub(mi('n'), mi('i'))}
            <mrow>
              <munder>
                <mo>∑</mo>
                <mi>j</mi>
              </munder>
              {sub(mi('n'), mi('j'))}
            </mrow>
          </mfrac>
        </Eq>
        <p>
          A hand is <M>{mi('h')}{mo('=')}{paren(mi('t'), mo(','), mi('s'))}</M>: total <M>{mi('t')}</M> with aces as
          1, and a soft flag <M>{mi('s')}</M> when an ace can count 11 without busting. So soft 17 and hard 17 are
          different states. Drawing rank <M>{mi('i')}</M> moves to <M>{next}</M>.
        </p>
      </Section>

      <Section n={2} title="Dealer outcomes">
        <p>The dealer draws until the stand rule (H17 or S17) is met:</p>
        <Eq>
          {mi('D')}
          {hn}
          {mo('=')}
          {sumI}
          {Pn(mi('i'))}
          {mi('D')}
          {next}
        </Eq>
        <p>
          Outcomes: 17–21, bust, natural. A dealer natural beats every player total except a player natural. Results
          are memoized on <M>{hn}</M>.
        </p>
      </Section>

      <Section n={3} title="Action values">
        <p>
          Each draw depletes the shoe. With <M>{mi('d')}</M> drawn from{' '}
          <M>{mi('D')}{hn}</M>, scoring a bust as <M>{mi('d')}{mo('=')}{mn('0')}</M> and a natural as{' '}
          <M>{mi('d')}{mo('=')}{mn('22')}</M>:
        </p>
        <Eq>
          {EV('stand')}
          {hn}
          {mo('=')}
          {Pn(<>{mi('d')}{mo('<')}{mi('t')}</>)}
          {mo('−')}
          {Pn(<>{mi('d')}{mo('>')}{mi('t')}</>)}
        </Eq>
        <Eq>
          {EV()}
          {hn}
          {mo('=')}
          <mi mathvariant="normal">max</mi>
          {mo('{')}
          {EV('stand')}
          {mo(',')}
          {EV('hit')}
          {mo('}')}
          {hn}
        </Eq>
        <Eq>
          {EV('hit')}
          {hn}
          {mo('=')}
          {sumI}
          {Pn(mi('i'))}
          {EV()}
          {next}
        </Eq>
        <Eq>
          {EV('double')}
          {hn}
          {mo('=')}
          {mn('2')}
          {sumI}
          {Pn(mi('i'))}
          {EV('stand')}
          {next}
        </Eq>
        <Eq>
          {EV('late surrender')}
          {mo('=')}
          {mo('−')}
          <mfrac>
            {mn('1')}
            {mn('2')}
          </mfrac>
        </Eq>
        <p>
          A bust is <M>{mo('−')}{mn('1')}</M>. Split values two hands, each starting from one pair card, with
          resplits, split-ace rules and double after split. A player natural pays <M>{mi('b')}</M> (1.5 at 3:2) and
          pushes a dealer natural (probability <M>{mi('p')}</M>):
        </p>
        <Eq>
          {EV('natural')}
          {mo('=')}
          {paren(mn('1'), mo('−'), mi('p'))}
          {mi('b')}
        </Eq>
      </Section>

      <Section n={4} title="Dealer peek">
        <p>
          With an Ace or ten up and a peek, a natural ends the hand before any decision, with probability{' '}
          <M>{mi('p')}</M>. Every action is therefore taken after a clean peek:
        </p>
        <Eq>
          {sub(<mi mathvariant="normal">EV</mi>, mi('a'))}
          {mo('=')}
          {mo('−')}
          {mi('p')}
          {mo('+')}
          {paren(mn('1'), mo('−'), mi('p'))}
          <msubsup>
            <mi mathvariant="normal">EV</mi>
            <mi>a</mi>
            <mtext>clean</mtext>
          </msubsup>
        </Eq>
        <p>
          The <M>{mo('−')}{mi('p')}</M> term is the same for every action, so it never changes the pick. For the clean
          case, <M>{mi('D')}</M> draws the hole card with the natural-completing rank removed; the player's own draws
          aren't re-weighted for that knowledge, a slight approximation with Ace and ten upcards. Without a peek, a
          dealer natural also takes doubled and split bets.
        </p>
      </Section>

      <Section n={5} title="Approximations">
        <p>
          Stand, hit and double are exact over the shoe. Split and the strategy chart use fixed odds:{' '}
          <M>{sub(mi('P'), mi('n'))}</M> from the current shoe (for the chart, a full shoe minus the three dealt cards)
          held constant. Split hands are evaluated independently from the same shoe. Against exact split EV, the
          difference stayed below 0.02 units with no change in the best action.
        </p>
      </Section>
    </main>
  );
}
