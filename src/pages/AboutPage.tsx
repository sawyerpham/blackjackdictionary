import type { ReactNode } from 'react';

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section className="relative border-l border-[var(--line)] pb-8 pl-8 last:pb-0">
      <span className="absolute top-0 -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--bg-third)] tabular-nums text-xs text-[var(--accent-soft)] ring-1 ring-[var(--line)]">
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
  <math display="block" className="py-1 text-[clamp(0.78rem,3.7vw,1.05rem)] text-[var(--text-primary)]">
    {children}
  </math>
);
/** Inline math. */
const M = ({ children }: { children: ReactNode }) => (
  <math className="text-[1.05em] text-[var(--text-primary)]">{children}</math>
);

const mi = (x: string) => <mi>{x}</mi>;
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
const EV = (name?: string) => (name ? sub(<mi mathvariant="normal">EV</mi>, <mtext>{name}</mtext>) : <mi mathvariant="normal">EV</mi>);
const P = (arg: ReactNode) => (
  <mrow>
    <mi>P</mi>
    {mo('(')}
    {arg}
    {mo(')')}
  </mrow>
);
const sumI = (
  <munder>
    <mo>∑</mo>
    <mi>i</mi>
  </munder>
);
const hPlusI = (
  <mrow>
    {mo('(')}
    {mi('h')}
    {mo('+')}
    {mi('i')}
    {mo(')')}
  </mrow>
);

export function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:py-12">
      <h1 className="text-large-title">How the math works</h1>
      <p className="mt-2 mb-10 text-[var(--text-muted)]">
        Each recommendation is the action with the highest expected value (EV), in units of the initial bet. The
        engine runs in Python on the server.
      </p>

      <Section n={1} title="Shoe state">
        <p>
          The unseen cards form a count vector{' '}
          <M>
            {mi('n')}
            {mo('=')}
            {mo('(')}
            {sub(mi('n'), <mi mathvariant="normal">A</mi>)}
            {mo(',')}
            {sub(mi('n'), <mn>2</mn>)}
            {mo(',')}
            {mo('…')}
            {mo(',')}
            {sub(mi('n'), <mn>9</mn>)}
            {mo(',')}
            {sub(mi('n'), <mi mathvariant="normal">T</mi>)}
            {mo(')')}
          </M>
          , with 10, J, Q and K merged into <M>{<mi mathvariant="normal">T</mi>}</M>. Suits are ignored. The
          probability of drawing rank <M>{mi('i')}</M> is:
        </p>
        <Eq>
          {P(mi('i'))}
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
      </Section>

      <Section n={2} title="Dealer outcome distribution">
        <p>The dealer's final total is resolved recursively until the stand rule (H17 or S17) is met:</p>
        <Eq>
          {mi('D')}
          {mo('(')}
          {mi('h')}
          {mo(',')}
          {mi('n')}
          {mo(')')}
          {mo('=')}
          {sumI}
          {P(mi('i'))}
          {mi('D')}
          {mo('(')}
          {mi('h')}
          {mo('+')}
          {mi('i')}
          {mo(',')}
          {mi('n')}
          {mo('−')}
          {sub(mi('e'), mi('i'))}
          {mo(')')}
        </Eq>
        <p>
          Outcomes: 17–21, natural, bust. Results are memoized on{' '}
          <M>
            {mo('(')}
            {mi('h')}
            {mo(',')}
            {mi('n')}
            {mo(')')}
          </M>
          , since different draw orders reach identical states.
        </p>
      </Section>

      <Section n={3} title="Action values">
        <p>
          With <M>{mi('d')}</M> the dealer's final total:
        </p>
        <Eq>
          {EV('stand')}
          {mo('(')}
          {mi('t')}
          {mo(')')}
          {mo('=')}
          {P(<mtext>bust</mtext>)}
          {mo('+')}
          {P(
            <>
              {mi('d')}
              {mo('<')}
              {mi('t')}
            </>,
          )}
          {mo('−')}
          {P(
            <>
              {mi('d')}
              {mo('>')}
              {mi('t')}
            </>,
          )}
        </Eq>
        <Eq>
          {EV('hit')}
          {mo('(')}
          {mi('h')}
          {mo(')')}
          {mo('=')}
          {sumI}
          {P(mi('i'))}
          <mi mathvariant="normal">max</mi>
          {mo('{')}
          {EV('stand')}
          {hPlusI}
          {mo(',')}
          {EV('hit')}
          {hPlusI}
          {mo('}')}
        </Eq>
        <Eq>
          {EV('double')}
          {mo('(')}
          {mi('h')}
          {mo(')')}
          {mo('=')}
          <mn>2</mn>
          {sumI}
          {P(mi('i'))}
          {EV('stand')}
          {hPlusI}
        </Eq>
        <Eq>
          {EV('surrender')}
          {mo('=')}
          {mo('−')}
          <mfrac>
            <mn>1</mn>
            <mn>2</mn>
          </mfrac>
        </Eq>
        <p>
          A bust is worth{' '}
          <M>
            {mo('−')}
            <mn>1</mn>
          </M>
          . Split values two hands, each starting from one pair card, with resplits, split-ace and double-after-split
          rules applied.
        </p>
      </Section>

      <Section n={4} title="Dealer peek">
        <p>
          With an Ace or ten-value upcard and a peek, let <M>{mi('p')}</M> be the probability that the hole card
          completes a natural. Double, split and surrender are only reachable after a clean peek:
        </p>
        <Eq>
          {EV()}
          {mo('=')}
          {mo('−')}
          {mi('p')}
          {mo('+')}
          {mo('(')}
          <mn>1</mn>
          {mo('−')}
          {mi('p')}
          {mo(')')}
          {EV('no natural')}
        </Eq>
      </Section>

      <Section n={5} title="Approximations">
        <p>
          Stand, hit and double are exact: the shoe depletes with every simulated draw. Split and the strategy chart
          use fixed odds, taking <M>{P(mi('i'))}</M> from the current shoe (for the chart: a full shoe minus the
          three dealt cards) and holding it constant. Split hands are evaluated independently from the same shoe. In
          tests against exact split EV, the difference stayed below 0.02 units and the best action never changed.
        </p>
      </Section>
    </main>
  );
}
