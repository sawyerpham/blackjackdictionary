import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import {
  availableActions,
  evaluate,
  type Action as EngineAction,
  type Evaluation,
} from '../engine/blackjack-engine';
import { toEngineRules, useSettingsStore } from '../state/settingsStore';
import {
  BET_STEP,
  DEFAULT_BALANCE,
  PENETRATION_OPTIONS,
  handTotal,
  initialSimState,
  simulatorReducer,
  visibleShoe,
  type HandState,
} from '../state/simulatorLogic';
import { PlayingCard } from '../components/PlayingCard';
import { ReferencePanel } from '../components/ReferencePanel';
import { countDisplay, getCountingSystem } from '../engine/countingSystems';

const BALANCE_KEY = 'blackjack-balance';

interface StoredBalance {
  balance: number;
  defaultBalance: number;
}

function loadBalance(): StoredBalance {
  const raw = localStorage.getItem(BALANCE_KEY);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed.balance === 'number' && typeof parsed.defaultBalance === 'number') {
        return parsed;
      }
    } catch {
      // fall through to default
    }
  }
  return { balance: DEFAULT_BALANCE, defaultBalance: DEFAULT_BALANCE };
}

const ACTION_ORDER: EngineAction[] = ['stand', 'hit', 'double', 'split', 'surrender'];
const ACTION_LABELS: Record<EngineAction, string> = {
  stand: 'Stand',
  hit: 'Hit',
  double: 'Double',
  split: 'Split', 
  surrender: 'Surrender',
};

function formatMoney(n: number): string {
  return `$${Math.round(n).toLocaleString()}`;
}

/** Heat gained per 100ms tick once the decision timer has expired (~14s overtime to fill). */
const HEAT_PER_TICK = 0.7;

/** Running pacing aggregates for Realistic mode. Display-only — never feeds the game. */
interface PacingStats {
  decisionCount: number;
  decisionTotal: number;
  slowDecisions: number;
  handCount: number;
  handTotal: number;
}

const EMPTY_PACING: PacingStats = {
  decisionCount: 0,
  decisionTotal: 0,
  slowDecisions: 0,
  handCount: 0,
  handTotal: 0,
};

function formatSeconds(total: number, count: number): string {
  return count > 0 ? `${(total / count).toFixed(1)}s` : '—';
}

function DecisionTimer({ remaining, total }: { remaining: number; total: number }) {
  const pct = total > 0 ? Math.min(100, (remaining / total) * 100) : 0;
  const expired = remaining <= 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-[var(--text-muted)]">Decision</span>
      <div className="h-2 w-28 overflow-hidden rounded-full bg-black/30">
        <div
          className={`h-full rounded-full ${expired ? 'bg-red-500' : 'bg-[var(--accent)]'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span
        className={`w-10 text-right text-xs font-semibold ${
          expired ? 'text-red-400' : 'text-[var(--text-primary)]'
        }`}
      >
        {remaining.toFixed(1)}s
      </span>
    </div>
  );
}

function HeatBar({ heat }: { heat: number }) {
  const color = heat < 40 ? 'bg-emerald-500' : heat < 75 ? 'bg-amber-400' : 'bg-red-500';
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-[var(--text-muted)]">Heat</span>
      <div className="h-2 w-28 overflow-hidden rounded-full bg-black/30">
        <div
          className={`h-full rounded-full transition-[width] ${color}`}
          style={{ width: `${heat}%` }}
        />
      </div>
    </div>
  );
}

/** Local edit-buffer for a stat tile that supports "double-click to type a number". */
function useEditableNumber(onCommit: (value: number) => void) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');

  const startEdit = (current: number) => {
    setText(String(Math.round(current)));
    setEditing(true);
  };
  const cancel = () => setEditing(false);
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value.replace(/[^0-9]/g, ''));
  };
  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const n = Number(text);
      if (text !== '' && Number.isFinite(n)) onCommit(n);
      setEditing(false);
    } else if (e.key === 'Escape') {
      setEditing(false);
    }
  };

  return { editing, text, startEdit, cancel, handleChange, handleKeyDown };
}

/** Distinguishes a single click from the first half of a double-click. */
function useClickVsDoubleClick(onSingle: () => void, onDouble: () => void, delay = 220) {
  const timer = useRef<number | null>(null);
  const handleClick = () => {
    if (timer.current !== null) return;
    timer.current = window.setTimeout(() => {
      timer.current = null;
      onSingle();
    }, delay);
  };
  const handleDoubleClick = () => {
    if (timer.current !== null) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    onDouble();
  };
  return { handleClick, handleDoubleClick };
}

function StatTile({
  label,
  hint,
  value,
  valueClassName,
  onClick,
  disabled,
  children,
}: {
  label: string;
  hint: string;
  value?: string;
  valueClassName?: string;
  onClick?: () => void;
  disabled?: boolean;
  children?: ReactNode;
}) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      className={`rounded-lg bg-[var(--bg-third)] p-4 text-center ${
        disabled ? 'opacity-40' : onClick ? 'cursor-pointer transition-colors hover:brightness-125' : ''
      }`}
    >
      <p className="mb-1 text-[var(--text-muted)]">{label}</p>
      <p className="mb-1 text-xs text-[var(--text-muted)]">{hint}</p>
      <div className="text-2xl font-bold">{children ?? <span className={valueClassName}>{value}</span>}</div>
    </div>
  );
}

function BalanceTile({
  balance,
  disabled,
  dispatch,
}: {
  balance: number;
  disabled: boolean;
  dispatch: (a: { type: 'SET_BALANCE'; value: number } | { type: 'RESET_BALANCE' }) => void;
}) {
  const { editing, text, startEdit, cancel, handleChange, handleKeyDown } = useEditableNumber((n) =>
    dispatch({ type: 'SET_BALANCE', value: n }),
  );
  const { handleClick, handleDoubleClick } = useClickVsDoubleClick(
    () => dispatch({ type: 'RESET_BALANCE' }),
    () => startEdit(balance),
  );

  return (
    <div
      onClick={editing || disabled ? undefined : handleClick}
      onDoubleClick={editing || disabled ? undefined : handleDoubleClick}
      className={`rounded-lg bg-[var(--bg-third)] p-4 text-center ${
        disabled ? 'opacity-40' : editing ? '' : 'cursor-pointer transition-colors hover:brightness-125'
      }`}
    >
      <p className="mb-1 text-[var(--text-muted)]">Balance</p>
      <p className="mb-1 text-xs text-[var(--text-muted)]">{editing ? 'Enter to save' : 'Click to reset'}</p>
      <div className="text-2xl font-bold">
        {editing ? (
          <input
            autoFocus
            inputMode="numeric"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={cancel}
            onFocus={(e) => e.currentTarget.select()}
            onClick={(e) => e.stopPropagation()}
            onDoubleClick={(e) => e.stopPropagation()}
            className="w-32 rounded bg-[var(--bg-second)] text-center text-indigo-300 outline-none ring-1 ring-[var(--accent)]"
          />
        ) : (
          <span className="text-indigo-300">{formatMoney(balance)}</span>
        )}
      </div>
    </div>
  );
}

function BetTile({
  currentBet,
  disabled,
  dispatch,
}: {
  currentBet: number;
  disabled: boolean;
  dispatch: (a: { type: 'SET_BET'; value: number } | { type: 'ADJUST_BET'; delta: number }) => void;
}) {
  const { editing, text, startEdit, cancel, handleChange, handleKeyDown } = useEditableNumber((n) =>
    dispatch({ type: 'SET_BET', value: n }),
  );

  return (
    <div
      className={`rounded-lg bg-[var(--bg-third)] p-4 text-center ${disabled ? 'opacity-40' : ''}`}
    >
      <p className="mb-1 text-[var(--text-muted)]">Current Bet</p>
      <p className="mb-1 text-xs text-[var(--text-muted)]">{editing ? 'Enter to save' : 'Use +/-'}</p>
      <div className="flex items-center justify-center gap-2 text-2xl font-bold">
        <button
          type="button"
          disabled={disabled}
          onClick={() => dispatch({ type: 'ADJUST_BET', delta: -BET_STEP })}
          className="flex h-8 w-8 items-center justify-center rounded bg-gray-600 text-[var(--text-primary)] transition-colors hover:bg-gray-500"
        >
          −
        </button>
        {editing ? (
          <input
            autoFocus
            inputMode="numeric"
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={cancel}
            onFocus={(e) => e.currentTarget.select()}
            className="w-24 rounded bg-[var(--bg-second)] text-center text-yellow-500 outline-none ring-1 ring-[var(--accent)]"
          />
        ) : (
          <span
            onDoubleClick={disabled ? undefined : () => startEdit(currentBet)}
            className={`text-yellow-500 ${disabled ? '' : 'cursor-pointer'}`}
          >
            {formatMoney(currentBet)}
          </span>
        )}
        <button
          type="button"
          disabled={disabled}
          onClick={() => dispatch({ type: 'ADJUST_BET', delta: BET_STEP })}
          className="flex h-8 w-8 items-center justify-center rounded bg-gray-600 text-[var(--text-primary)] transition-colors hover:bg-gray-500"
        >
          +
        </button>
      </div>
    </div>
  );
}

function HandView({
  hand,
  isActive,
  evaluation,
  countLine,
  revealed,
  onToggleRevealed,
}: {
  hand: HandState;
  isActive: boolean;
  evaluation?: Evaluation;
  countLine: string;
  revealed: boolean;
  onToggleRevealed: () => void;
}) {
  const { total, soft } = handTotal(hand.cards);

  return (
    <div
      className={`rounded-lg bg-[var(--bg-third)] p-6 ${isActive ? 'ring-2 ring-[var(--accent)]' : ''}`}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <span className="font-medium text-[var(--text-primary)]">
          Value: {soft && total <= 21 ? `S${total}` : total} · Bet: {formatMoney(hand.bet)}
        </span>
        <div className="flex flex-col items-end gap-1">
          {hand.outcome ? (
            <span
              className={`text-sm font-bold ${
                hand.outcome === 'win' || hand.outcome === 'blackjack'
                  ? 'text-emerald-500'
                  : hand.outcome === 'push'
                    ? 'text-[var(--text-muted)]'
                    : 'text-red-500'
              }`}
            >
              {hand.outcome === 'blackjack'
                ? 'Blackjack!'
                : hand.outcome === 'lose'
                  ? 'LOSS'
                  : hand.outcome === 'win'
                    ? 'WIN'
                    : hand.outcome.charAt(0).toUpperCase() + hand.outcome.slice(1)}
            </span>
          ) : (
            isActive && (
              <button
                type="button"
                onClick={onToggleRevealed}
                className="text-sm text-[var(--accent-soft)]"
              >
                Optimal:{' '}
                <span className={`transition-all ${revealed ? '' : 'blur-sm'}`}>
                  {evaluation ? ACTION_LABELS[evaluation.best] : '…'}
                </span>
              </button>
            )
          )}
          <span className="text-sm text-[var(--text-muted)]">{countLine}</span>
        </div>
      </div>
      <div className="flex justify-center gap-4">
        {hand.cards.map((c, i) => (
          <PlayingCard key={i} rank={c} />
        ))}
      </div>
    </div>
  );
}

export function SimulatorPage() {
  const settings = useSettingsStore((s) => s.settings);
  const rules = useMemo(() => toEngineRules(settings), [settings]);

  const [state, dispatch] = useReducer(simulatorReducer, undefined, () => {
    const stored = loadBalance();
    return initialSimState(settings.decks, stored.balance, stored.defaultBalance);
  });

  // Shared across all hands so split hands inherit the current blur state.
  const [optimalRevealed, setOptimalRevealed] = useState(false);
  const [referenceOpen, setReferenceOpen] = useState(false);

  // Realistic mode: pacing pressure layered on top of the game — timers, heat,
  // and stats only. Nothing here dispatches anything but the normal DEAL.
  const [realisticMode, setRealisticMode] = useState(false);
  const [heat, setHeat] = useState(0);
  const [decisionRemaining, setDecisionRemaining] = useState(0);
  const [autoDealRemaining, setAutoDealRemaining] = useState(0);
  const [pacing, setPacing] = useState<PacingStats>(EMPTY_PACING);
  const decisionStartRef = useRef<number | null>(null);
  const handStartRef = useRef<number | null>(null);
  const decisionSeconds = settings.realisticDecisionSeconds;
  const clearSeconds = settings.realisticHandClearSeconds;

  useEffect(() => {
    localStorage.setItem(
      BALANCE_KEY,
      JSON.stringify({ balance: state.balance, defaultBalance: state.defaultBalance }),
    );
  }, [state.balance, state.defaultBalance]);

  useEffect(() => {
    if (state.phase !== 'player-turn' && state.decks !== settings.decks) {
      dispatch({ type: 'SET_DECKS', decks: settings.decks });
    }
  }, [settings.decks, state.phase, state.decks]);

  const activeHand = state.phase === 'player-turn' ? state.hands[state.activeHandIdx] : undefined;
  const dealerUp = state.dealerCards[0];

  // Computed off the render pass so dealing/acting paints immediately; the
  // "Optimal" line fills in whenever the EV calculation lands.
  const [evaluation, setEvaluation] = useState<Evaluation | undefined>(undefined);
  useEffect(() => {
    setEvaluation(undefined);
    if (!activeHand || !dealerUp || state.phase !== 'player-turn') return;
    const id = window.setTimeout(() => {
      setEvaluation(
        evaluate(activeHand.cards, dealerUp, visibleShoe(state), rules, activeHand.splitsSoFar),
      );
    }, 0);
    return () => window.clearTimeout(id);
  }, [activeHand, dealerUp, state, rules]);

  // Cheap legality (no EV math) so the action buttons never wait on evaluate().
  const legalActions = activeHand
    ? availableActions(activeHand.cards, rules, activeHand.splitsSoFar)
    : [];

  const countLine = useMemo(
    () => countDisplay(getCountingSystem(settings.countingSystem), state.decks, visibleShoe(state)),
    [settings.countingSystem, state],
  );

  const dealerValue = state.dealerHoleHidden
    ? handTotal([state.dealerCards[0]]).total
    : handTotal(state.dealerCards).total;

  const canDeal = state.phase !== 'player-turn' && state.balance >= state.currentBet;

  // Decision countdown + heat build-up. Restarts at every decision point
  // (any action replaces state.hands, so it doubles as the reset trigger).
  useEffect(() => {
    if (!realisticMode || state.phase !== 'player-turn') {
      decisionStartRef.current = null;
      return;
    }
    decisionStartRef.current = Date.now();
    setDecisionRemaining(decisionSeconds);
    const id = window.setInterval(() => {
      const start = decisionStartRef.current;
      if (start === null) return;
      const elapsed = (Date.now() - start) / 1000;
      setDecisionRemaining(Math.max(0, decisionSeconds - elapsed));
      if (elapsed > decisionSeconds) setHeat((h) => Math.min(100, h + HEAT_PER_TICK));
    }, 100);
    return () => window.clearInterval(id);
  }, [realisticMode, state.phase, state.activeHandIdx, state.hands, decisionSeconds]);

  // Record the hand's duration once it resolves.
  useEffect(() => {
    if (state.phase === 'player-turn') return;
    const start = handStartRef.current;
    if (start === null) return;
    handStartRef.current = null;
    const secs = (Date.now() - start) / 1000;
    setPacing((p) => ({ ...p, handCount: p.handCount + 1, handTotal: p.handTotal + secs }));
  }, [state.phase, state.hands]);

  const handleDeal = () => {
    if (realisticMode) {
      setHeat(0);
      handStartRef.current = Date.now();
    }
    dispatch({ type: 'DEAL', rules });
  };

  // Auto-deal the next hand after the clearing pause.
  useEffect(() => {
    if (!realisticMode || state.phase !== 'round-over') return;
    if (state.balance < state.currentBet) return;
    const deadline = Date.now() + clearSeconds * 1000;
    setAutoDealRemaining(clearSeconds);
    const id = window.setInterval(() => {
      const left = (deadline - Date.now()) / 1000;
      if (left > 0) {
        setAutoDealRemaining(left);
        return;
      }
      window.clearInterval(id);
      setHeat(0);
      handStartRef.current = Date.now();
      dispatch({ type: 'DEAL', rules });
    }, 100);
    return () => window.clearInterval(id);
  }, [realisticMode, state.phase, state.hands, state.balance, state.currentBet, clearSeconds, rules]);

  const handleAction = (action: EngineAction) => {
    if (!activeHand) return;
    if (action === 'split' && activeHand.isSplitAces && !rules.allowResplitAces) return;
    if (realisticMode && decisionStartRef.current !== null) {
      const secs = (Date.now() - decisionStartRef.current) / 1000;
      setPacing((p) => ({
        ...p,
        decisionCount: p.decisionCount + 1,
        decisionTotal: p.decisionTotal + secs,
        slowDecisions: p.slowDecisions + (secs > decisionSeconds ? 1 : 0),
      }));
    }
    dispatch({ type: action.toUpperCase() as 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT' | 'SURRENDER', rules });
  };

  return (
    <div className="container mx-auto flex-1 px-4 py-12 ">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-lg bg-[var(--bg-second)] p-8">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-bold text-[var(--accent)]">Blackjack Simulator</h1>
            <button
              type="button"
              onClick={() => setReferenceOpen((o) => !o)}
              aria-expanded={referenceOpen}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-medium text-[var(--text-primary)] transition-colors hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {referenceOpen ? 'Close Reference' : 'Reference'}
            </button>
          </div>

          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-4">
            <BalanceTile
              balance={state.balance}
              disabled={state.phase === 'player-turn'}
              dispatch={dispatch}
            />
            <BetTile currentBet={state.currentBet} disabled={state.phase === 'player-turn'} dispatch={dispatch} />
            <StatTile
              label="Deck Remaining"
              hint="Click to shuffle"
              value={String(state.shoe.reduce((a, b) => a + b, 0))}
              valueClassName="text-emerald-400"
              onClick={() => dispatch({ type: 'FORCE_SHUFFLE' })}
              disabled={state.phase === 'player-turn'}
            />
            <StatTile
              label="Shoe Depth"
              hint="Click to cycle"
              value={PENETRATION_OPTIONS[state.penetrationIdx].label}
              valueClassName="text-blue-400"
              onClick={() => dispatch({ type: 'CYCLE_PENETRATION' })}
              disabled={state.phase === 'player-turn'}
            />
          </div>

          <div className="mb-8">
            <h3 className="mb-4 text-xl font-semibold text-[var(--accent-soft)]">Dealer</h3>
            <div className="rounded-lg bg-[var(--bg-third)] p-6">
              <div className="mb-4 flex items-center gap-4">
                <span className="font-medium text-[var(--text-primary)]">
                  Value: {state.dealerCards.length ? dealerValue : 0}
                </span>
              </div>
              <div className="flex justify-center">
                <div className="flex gap-4">
                  {state.dealerCards.length === 0 && <PlayingCard />}
                  {state.dealerCards.map((c, i) => (
                    <PlayingCard key={i} rank={state.dealerHoleHidden && i === 1 ? undefined : c} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="mb-4 text-xl font-semibold text-[var(--accent-soft)]">Your Hand</h3>
            <div className="space-y-4">
              {state.hands.map((hand, i) => (
                <HandView
                  key={i}
                  hand={hand}
                  isActive={state.phase === 'player-turn' && i === state.activeHandIdx}
                  evaluation={state.phase === 'player-turn' && i === state.activeHandIdx ? evaluation : undefined}
                  countLine={countLine}
                  revealed={optimalRevealed}
                  onToggleRevealed={() => setOptimalRevealed((r) => !r)}
                />
              ))}
            </div>
          </div>

          {state.phase === 'player-turn' && activeHand && (
            <div className="flex flex-wrap justify-center gap-3">
              {ACTION_ORDER.map((action) => {
                const available =
                  legalActions.includes(action) &&
                  (action !== 'split' || !(activeHand.isSplitAces && !rules.allowResplitAces));
                return (
                  <button
                    key={action}
                    type="button"
                    disabled={!available}
                    onClick={() => handleAction(action)}
                    className={`rounded-lg px-6 py-3 font-medium text-[var(--text-primary)] transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                      action === 'surrender'
                        ? 'bg-[var(--bg-third)] hover:brightness-125'
                        : 'bg-[var(--accent-strong)] hover:bg-[var(--accent)]'
                    }`}
                  >
                    {ACTION_LABELS[action]}
                  </button>
                );
              })}
            </div>
          )}

          {state.phase !== 'player-turn' && (
            <div className="flex justify-center">
              <button
                type="button"
                disabled={!canDeal}
                onClick={handleDeal}
                className="rounded-lg bg-[var(--accent-strong)] px-6 py-3 font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Deal Cards
              </button>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <label className="flex cursor-pointer items-center gap-1.5">
              <input
                type="checkbox"
                checked={realisticMode}
                onChange={(e) => {
                  setRealisticMode(e.target.checked);
                  setHeat(0);
                }}
                className="h-3.5 w-3.5 rounded border-gray-600 bg-gray-800"
              />
              <span className="text-xs font-medium text-[var(--text-primary)]">Realistic</span>
            </label>
            {realisticMode && (
              <div className="flex flex-wrap items-center gap-5">
                {state.phase === 'player-turn' && (
                  <DecisionTimer remaining={decisionRemaining} total={decisionSeconds} />
                )}
                {state.phase === 'round-over' && canDeal && (
                  <span className="text-xs text-[var(--text-muted)]">
                    Next hand in {autoDealRemaining.toFixed(1)}s
                  </span>
                )}
                <HeatBar heat={heat} />
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-lg bg-[var(--bg-second)] p-6">
          <h2 className="mb-4 text-xl font-semibold text-[var(--accent-soft)]">Pacing</h2>
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-5">
            <div className="rounded-lg bg-[var(--bg-third)] p-4">
              <p className="mb-1 text-sm text-[var(--text-muted)]">Avg Decision</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {formatSeconds(pacing.decisionTotal, pacing.decisionCount)}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--bg-third)] p-4">
              <p className="mb-1 text-sm text-[var(--text-muted)]">Slow Decisions</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {pacing.decisionCount > 0 ? pacing.slowDecisions : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--bg-third)] p-4">
              <p className="mb-1 text-sm text-[var(--text-muted)]">Avg Hand</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {formatSeconds(pacing.handTotal, pacing.handCount)}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--bg-third)] p-4">
              <p className="mb-1 text-sm text-[var(--text-muted)]">Hands Played</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {pacing.handCount > 0 ? pacing.handCount : '—'}
              </p>
            </div>
            <div className="rounded-lg bg-[var(--bg-third)] p-4">
              <p className="mb-1 text-sm text-[var(--text-muted)]">Hands / Hour</p>
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {pacing.handCount > 0
                  ? Math.round(3600 / (pacing.handTotal / pacing.handCount + clearSeconds))
                  : '—'}
              </p>
            </div>
          </div>
        </section>
      </div>
      <ReferencePanel
        open={referenceOpen}
        onClose={() => setReferenceOpen(false)}
        systemKey={settings.countingSystem}
        decks={state.decks}
      />
    </div>
  );
}
