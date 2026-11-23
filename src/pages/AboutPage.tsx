import type { ReactNode } from 'react';

// Equations are native MathML, rendered by the browser (no math library).
/** Display equation; scales with the viewport instead of scrolling. */
const Eq = ({ children }: { children: ReactNode }) => (
  <math display="block" className="my-2 text-[clamp(0.7rem,3.3vw,1rem)] text-[var(--text-primary)]">
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

type Method = 'exact' | 'fixed odds';

/** One step of the flow chart. */
function Node({
  step,
  title,
  method,
  children,
  className = '',
}: {
  step?: number;
  title: string;
  method?: Method;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-[var(--line)] bg-[var(--bg-second)] p-4 ${className}`}>
      <div className="flex items-center gap-2">
        {step !== undefined && (
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-strong)] font-mono text-[11px] text-white">
            {step}
          </span>
        )}
        <h2 className="font-medium">{title}</h2>
        {method && (
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase ${
              method === 'exact'
                ? 'bg-white/[0.07] text-[var(--text-muted)]'
                : 'bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] text-[var(--accent-soft)]'
            }`}
          >
            {method}
          </span>
        )}
      </div>
      <div className="text-sm leading-relaxed text-[var(--text-muted)]">{children}</div>
    </div>
  );
}

/** Downward connector between steps. */
function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center py-1" aria-hidden>
      <div className="h-5 w-px bg-white/20" />
      {label && <span className="py-0.5 text-[11px] text-[var(--text-muted)]">{label}</span>}
      <svg width="12" height="8" viewBox="0 0 12 8" className="text-white/30">
        <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

export function AboutPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">How the math works</h1>
      <p className="mt-2 mb-8 text-[var(--text-muted)]">
        Each recommendation is the action with the highest expected value (EV), in units of the initial bet,
        computed in Python on the server.
      </p>

      <Node step={1} title="Shoe state">
        <p className="mt-1">Unseen cards as a count vector; 10, J, Q, K merged, suits ignored.</p>
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
      </Node>

      <Arrow />

      <Node step={2} title="Dealer outcomes" method="exact">
        <p className="mt-1">Recursive draw until the stand rule (H17 or S17); memoized on the state.</p>
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
        <p>Outcomes: 17–21, natural, bust.</p>
      </Node>

      <Arrow label="for each legal action" />

      <section className="rounded-2xl border border-dashed border-white/15 p-3 sm:p-4">
        <div className="mb-3 flex items-center gap-2 px-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--accent-strong)] font-mono text-[11px] text-white">
            3
          </span>
          <h2 className="font-medium">Action values</h2>
          <span className="text-xs text-[var(--text-muted)]">
            <M>{mi('d')}</M> = dealer total, bust = <M>{mo('−')}<mn>1</mn></M>
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Node title="Stand" method="exact">
            <Eq>
              {EV('stand')}
              {mo('(')}
              {mi('t')}
              {mo(')')}
              {mo('=')}
              {P(<mtext>bust</mtext>)}
              {mo('+')}
              {P(<>{mi('d')}{mo('<')}{mi('t')}</>)}
              {mo('−')}
              {P(<>{mi('d')}{mo('>')}{mi('t')}</>)}
            </Eq>
          </Node>
          <Node title="Double" method="exact">
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
          </Node>
          <Node title="Hit" method="exact" className="sm:col-span-2">
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
          </Node>
          <Node title="Split" method="fixed odds">
            <Eq>
              {EV('split')}
              {mo('=')}
              <mn>2</mn>
              {mo('·')}
              {EV('one pair card')}
            </Eq>
            <p>Odds from the current shoe, held fixed. Resplit, split-ace and DAS rules apply.</p>
          </Node>
          <Node title="Surrender" method="exact">
            <Eq>
              {EV('surrender')}
              {mo('=')}
              {mo('−')}
              <mfrac>
                <mn>1</mn>
                <mn>2</mn>
              </mfrac>
            </Eq>
          </Node>
        </div>
      </section>

      <Arrow label="Ace or ten up, dealer peeks" />

      <Node step={4} title="Peek adjustment">
        <p className="mt-1">
          With <M>{mi('p')}</M> the chance the hole card completes a natural, double, split and surrender are only
          reached after a clean peek:
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
      </Node>

      <Arrow />

      <Node step={5} title="Recommendation">
        <Eq>
          <msub>
            <mi>a</mi>
            <mo>*</mo>
          </msub>
          {mo('=')}
          <munder>
            <mi mathvariant="normal">argmax</mi>
            <mi>a</mi>
          </munder>
          {sub(<mi mathvariant="normal">EV</mi>, mi('a'))}
        </Eq>
        <p>
          Shown as the simulator's Optimal hint. The strategy chart runs the same flow with fixed odds from a full
          shoe minus the three dealt cards. Against exact split EV, fixed odds stayed within 0.02 units in testing
          with no change in the best action.
        </p>
      </Node>
    </main>
  );
}
