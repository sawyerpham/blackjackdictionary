import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent as ReactKeyboardEvent, ReactNode } from 'react';
import {
  availableActions,
  type Action as EngineAction,
  type Evaluation,
  type Rank,
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
  type NpcHandState,
} from '../state/simulatorLogic';
import { PlayingCard } from '../components/PlayingCard';
import { ReferencePanel } from '../components/ReferencePanel';
import { rulesSummary } from '../components/RuleControls';
import { countDisplay, getCountingSystem } from '../engine/countingSystems';

const BALANCE_KEY = 'blackjack-balance';

interface StoredBalance {
  balance: number;
  defaultBalance: number;
}

function loadBalance(): StoredBalance {
  try {
    const parsed = JSON.parse(localStorage.getItem(BALANCE_KEY) ?? 'null');
    if (typeof parsed?.balance === 'number' && typeof parsed?.defaultBalance === 'number') return parsed;
  } catch {
    // fall through to default
  }
  return { balance: DEFAULT_BALANCE, defaultBalance: DEFAULT_BALANCE };
}

const ACTION_ORDER: EngineAction[] = ['hit', 'stand', 'double', 'split', 'surrender'];
const ACTION_LABELS: Record<EngineAction, string> = {
  stand: 'Stand',
  hit: 'Hit',
  double: 'Double',
  split: 'Split',
  surrender: 'Surrender',
};
/** Keyboard shortcuts; Space / Enter deals. */
const ACTION_KEYS: Record<string, EngineAction> = { h: 'hit', s: 'stand', d: 'double', p: 'split', r: 'surrender' };
const ACTION_KEY_LABEL: Record<EngineAction, string> = { hit: 'H', stand: 'S', double: 'D', split: 'P', surrender: 'R' };

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

const EMPTY_PACING: PacingStats = { decisionCount: 0, decisionTotal: 0, slowDecisions: 0, handCount: 0, handTotal: 0 };

function formatSeconds(total: number, count: number): string {
  return count > 0 ? `${(total / count).toFixed(1)}s` : '—';
}

function Meter({ label, pct, color, trailing }: { label: string; pct: number; color: string; trailing?: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-[var(--text-muted)]">{label}</span>
      <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
        <div className={`h-full rounded-full transition-[width] ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {trailing}
    </div>
  );
}

/** Local edit-buffer for a value that supports "double-click to type a number".
 *  Commits on Enter AND on blur (mobile keyboards confirm via blur); Escape cancels. */
function useEditableNumber(onCommit: (value: number) => void) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const startEdit = (current: number) => {
    setText(String(Math.round(current)));
    setEditing(true);
  };
  const commit = () => {
    const n = Number(text);
    if (text !== '' && Number.isFinite(n)) onCommit(n);
    setEditing(false);
  };
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setText(e.target.value.replace(/[^0-9]/g, ''));
  const handleKeyDown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') commit();
    else if (e.key === 'Escape') setEditing(false);
  };
  return { editing, text, startEdit, commit, handleChange, handleKeyDown };
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

const NUM_INPUT =
  'w-24 rounded bg-[var(--bg-main)] text-center text-[var(--text-primary)] outline-none ring-1 ring-[var(--accent)]';

function Stat({
  label,
  hint,
  children,
  onClick,
  onDoubleClick,
  disabled,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
  onClick?: () => void;
  onDoubleClick?: () => void;
  disabled?: boolean;
}) {
  const interactive = !!onClick && !disabled;
  return (
    <div
      role={interactive ? 'button' : undefined}
      tabIndex={interactive ? 0 : undefined}
      title={hint}
      onClick={interactive ? onClick : undefined}
      onDoubleClick={disabled ? undefined : onDoubleClick}
      onKeyDown={interactive ? (e) => e.key === 'Enter' && onClick?.() : undefined}
      className={`min-w-0 rounded-lg px-3 py-2 ${
        interactive ? 'cursor-pointer transition-colors hover:bg-white/[0.05]' : ''
      } ${disabled ? 'opacity-50' : ''}`}
    >
      <p className="text-[11px] tracking-wide text-[var(--text-muted)] uppercase">{label}</p>
      <div className="font-mono text-[15px] font-semibold tabular-nums">{children}</div>
    </div>
  );
}

function BalanceStat({
  balance,
  disabled,
  dispatch,
}: {
  balance: number;
  disabled: boolean;
  dispatch: (a: { type: 'SET_BALANCE'; value: number } | { type: 'RESET_BALANCE' }) => void;
}) {
  const edit = useEditableNumber((n) => dispatch({ type: 'SET_BALANCE', value: n }));
  const clicks = useClickVsDoubleClick(
    () => dispatch({ type: 'RESET_BALANCE' }),
    () => edit.startEdit(balance),
  );
  return (
    <Stat
      label="Balance"
      hint="Click to reset · double-click to edit"
      disabled={disabled}
      onClick={edit.editing ? undefined : clicks.handleClick}
      onDoubleClick={edit.editing ? undefined : clicks.handleDoubleClick}
    >
      {edit.editing ? (
        <input
          autoFocus
          inputMode="numeric"
          value={edit.text}
          onChange={edit.handleChange}
          onKeyDown={edit.handleKeyDown}
          onBlur={edit.commit}
          onFocus={(e) => e.currentTarget.select()}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          className={NUM_INPUT}
        />
      ) : (
        formatMoney(balance)
      )}
    </Stat>
  );
}

function BetStat({
  bet,
  disabled,
  dispatch,
}: {
  bet: number;
  disabled: boolean;
  dispatch: (a: { type: 'SET_BET'; value: number } | { type: 'ADJUST_BET'; delta: number }) => void;
}) {
  const edit = useEditableNumber((n) => dispatch({ type: 'SET_BET', value: n }));
  const btn =
    'flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-sm transition-colors hover:bg-white/20 disabled:opacity-40';
  return (
    <Stat label="Bet" hint="Double-click the amount to type one" disabled={disabled}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Lower bet"
          disabled={disabled}
          onClick={() => dispatch({ type: 'ADJUST_BET', delta: -BET_STEP })}
          className={btn}
        >
          −
        </button>
        {edit.editing ? (
          <input
            autoFocus
            inputMode="numeric"
            value={edit.text}
            onChange={edit.handleChange}
            onKeyDown={edit.handleKeyDown}
            onBlur={edit.commit}
            onFocus={(e) => e.currentTarget.select()}
            className={NUM_INPUT}
          />
        ) : (
          <span onDoubleClick={disabled ? undefined : () => edit.startEdit(bet)} className="cursor-text">
            {formatMoney(bet)}
          </span>
        )}
        <button
          type="button"
          aria-label="Raise bet"
          disabled={disabled}
          onClick={() => dispatch({ type: 'ADJUST_BET', delta: BET_STEP })}
          className={btn}
        >
          +
        </button>
      </div>
    </Stat>
  );
}

function ValuePill({ cards, hideHole }: { cards: Rank[]; hideHole?: boolean }) {
  if (cards.length === 0) return null;
  const { total, soft } = handTotal(hideHole ? [cards[0]] : cards);
  const bust = total > 21;
  return (
    <span
      className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-semibold tabular-nums ${
        bust ? 'bg-rose-500/90 text-white' : 'bg-black/50 text-white ring-1 ring-white/15'
      }`}
    >
      {bust ? `Bust ${total}` : soft && total < 21 ? `Soft ${total}` : total}
    </span>
  );
}

const OUTCOME_STYLE: Record<NonNullable<HandState['outcome']>, [string, string]> = {
  win: ['Win', 'bg-emerald-500 text-white'],
  blackjack: ['Blackjack', 'bg-amber-400 text-zinc-900'],
  push: ['Push', 'bg-zinc-500 text-white'],
  lose: ['Lose', 'bg-rose-500 text-white'],
  surrender: ['Surrender', 'bg-zinc-600 text-white'],
};

/** Cards fanned with overlap, like they sit on a table. */
function Fan({ children }: { children: ReactNode }) {
  return <div className="flex justify-center [&>*:not(:first-child)]:-ml-8 sm:[&>*:not(:first-child)]:-ml-10">{children}</div>;
}

function PlayerHand({
  hand,
  seedPrefix,
  isActive,
  dimmed,
}: {
  hand: HandState;
  seedPrefix: string;
  isActive: boolean;
  dimmed: boolean;
}) {
  const outcome = hand.outcome ? OUTCOME_STYLE[hand.outcome] : undefined;
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-2xl px-3 pt-3 pb-2 transition-all ${
        isActive ? 'bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] ring-1 ring-[var(--accent)]/60' : ''
      } ${dimmed ? 'opacity-55' : ''}`}
    >
      <Fan>
        {hand.cards.map((c, i) => (
          <PlayingCard key={i} rank={c} seed={`${seedPrefix}-${i}`} />
        ))}
      </Fan>
      <div className="flex items-center gap-1.5">
        <ValuePill cards={hand.cards} />
        {outcome && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${outcome[1]}`}>{outcome[0]}</span>
        )}
      </div>
      <span className="rounded-full border border-dashed border-white/25 px-2.5 py-0.5 font-mono text-[11px] text-[var(--text-muted)]">
        {formatMoney(hand.bet)}
      </span>
    </div>
  );
}

function NpcSeat({ label, hands, seedPrefix }: { label: string; hands: NpcHandState[]; seedPrefix: string }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      {hands.map((hand, i) => {
        const { total } = handTotal(hand.cards);
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="flex [&>*:not(:first-child)]:-ml-4">
              {hand.cards.map((c, j) => (
                <PlayingCard key={j} size="sm" rank={c} seed={`${seedPrefix}-${i}-${j}`} />
              ))}
            </div>
            <span
              className={`font-mono text-[10px] ${hand.surrendered || total > 21 ? 'text-rose-400' : 'text-white/60'}`}
            >
              {hand.surrendered ? 'Surr' : total > 21 ? 'Bust' : total}
            </span>
          </div>
        );
      })}
      <span className="text-[10px] tracking-wider text-white/40 uppercase">{label}</span>
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
    try {
      localStorage.setItem(
        BALANCE_KEY,
        JSON.stringify({ balance: state.balance, defaultBalance: state.defaultBalance }),
      );
    } catch {
      // storage blocked: balance just won't persist
    }
  }, [state.balance, state.defaultBalance]);

  useEffect(() => {
    if (state.phase !== 'player-turn' && state.decks !== settings.decks) {
      dispatch({ type: 'SET_DECKS', decks: settings.decks });
    }
  }, [settings.decks, state.phase, state.decks]);

  const playerTurn = state.phase === 'player-turn';
  const activeHand = playerTurn ? state.hands[state.activeHandIdx] : undefined;
  const dealerUp = state.dealerCards[0];

  // The "Optimal" line fills in whenever the backend's EV calculation lands.
  const [evaluation, setEvaluation] = useState<Evaluation | undefined>(undefined);
  useEffect(() => {
    setEvaluation(undefined);
    if (!activeHand || !dealerUp || state.phase !== 'player-turn') return;
    // EV math runs in the Python backend (backend/engine.py).
    const ctrl = new AbortController();
    fetch('/api/evaluate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        player: activeHand.cards,
        dealerUp,
        shoe: visibleShoe(state),
        rules,
        splitsAlreadyTaken: activeHand.splitsSoFar,
      }),
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : undefined))
      .then(setEvaluation)
      .catch(() => {}); // aborted or offline: the hint just stays "…"
    return () => ctrl.abort();
  }, [activeHand, dealerUp, state, rules]);

  // Cheap legality (no EV math) so the action buttons never wait on the backend.
  const legalActions = activeHand ? availableActions(activeHand.cards, rules, activeHand.splitsSoFar) : [];
  const isAvailable = (action: EngineAction) =>
    !!activeHand &&
    legalActions.includes(action) &&
    (action !== 'split' || !(activeHand.isSplitAces && !rules.allowResplitAces));

  const countLine = useMemo(
    () => countDisplay(getCountingSystem(settings.countingSystem), state.decks, visibleShoe(state)),
    [settings.countingSystem, state],
  );

  const canDeal = !playerTurn && state.balance >= state.currentBet;
  const cardsLeft = state.shoe.reduce((a, b) => a + b, 0);

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
    if (!canDeal) return;
    if (realisticMode) {
      setHeat(0);
      handStartRef.current = Date.now();
    }
    dispatch({ type: 'DEAL', rules });
  };

  // Auto-deal the next hand after the clearing pause. The pause scales with
  // the hands the dealer has to sweep: the user's hand(s), every NPC hand, and splits.
  useEffect(() => {
    if (!realisticMode || state.phase !== 'round-over') return;
    if (state.balance < state.currentBet) return;
    const tableHands = state.hands.length + state.npcs.reduce((n, seat) => n + seat.length, 0);
    const effectiveClear = clearSeconds * Math.max(1, tableHands);
    const deadline = Date.now() + effectiveClear * 1000;
    setAutoDealRemaining(effectiveClear);
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
  }, [realisticMode, state.phase, state.hands, state.npcs, state.balance, state.currentBet, clearSeconds, rules]);

  const handleAction = (action: EngineAction) => {
    if (!isAvailable(action)) return;
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

  // Keyboard: H/S/D/P/R to act, Space or Enter to deal.
  const keyHandler = useRef<(e: KeyboardEvent) => void>(() => {});
  keyHandler.current = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement;
    if (e.ctrlKey || e.metaKey || e.altKey || referenceOpen || t.closest('input, textarea, select')) return;
    const action = ACTION_KEYS[e.key.toLowerCase()];
    if (action && playerTurn) {
      e.preventDefault();
      handleAction(action);
    } else if ((e.key === ' ' || e.key === 'Enter') && !playerTurn && !t.closest('button, [role="button"]')) {
      e.preventDefault();
      handleDeal();
    }
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => keyHandler.current(e);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const npcLeft = state.npcs.slice(Math.ceil(state.npcs.length / 2));
  const npcRight = state.npcs.slice(0, Math.ceil(state.npcs.length / 2));
  const seatLabel = (i: number) => `Seat ${i + 1}`;
  const r = state.round;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-6 sm:px-4 sm:py-8">
      {/* Table controls */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--bg-second)] p-1.5">
        <div className="flex w-full flex-wrap sm:w-auto">
          <div className="grid w-full grid-cols-2 sm:flex sm:w-auto">
            <BalanceStat balance={state.balance} disabled={playerTurn} dispatch={dispatch} />
            <BetStat bet={state.currentBet} disabled={playerTurn} dispatch={dispatch} />
          </div>
          <div className="grid w-full grid-cols-3 sm:flex sm:w-auto">
            <Stat
              label="Shoe"
              hint="Click to shuffle"
              disabled={playerTurn}
              onClick={() => dispatch({ type: 'FORCE_SHUFFLE' })}
            >
              {cardsLeft}
            </Stat>
            <Stat
              label="Cut"
              hint="Deck penetration · click to cycle"
              disabled={playerTurn}
              onClick={() => dispatch({ type: 'CYCLE_PENETRATION' })}
            >
              {PENETRATION_OPTIONS[state.penetrationIdx].label}
            </Stat>
            <Stat
              label="Players"
              hint="NPC seats · click to cycle"
              disabled={playerTurn}
              onClick={() => dispatch({ type: 'CYCLE_NPC_COUNT' })}
            >
              {state.npcCount}
            </Stat>
          </div>
        </div>
        <div className="flex w-full items-center justify-end gap-1.5 border-t border-[var(--line)] pt-1.5 pr-1 sm:w-auto sm:border-0 sm:pt-0">
          <button
            type="button"
            role="switch"
            aria-checked={realisticMode}
            onClick={() => {
              setRealisticMode((m) => !m);
              setHeat(0);
            }}
            className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
              realisticMode
                ? 'bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] text-[var(--accent-soft)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            Realistic
          </button>
          <button
            type="button"
            onClick={() => setReferenceOpen((o) => !o)}
            aria-expanded={referenceOpen}
            className="rounded-md border border-[var(--line)] px-3 py-1.5 text-sm hover:border-white/20"
          >
            Reference
          </button>
        </div>
      </div>

      {/* The table */}
      <section
        aria-label="Blackjack table"
        className="relative overflow-hidden rounded-t-[2rem] rounded-b-[45%_30%] border border-white/[0.07] bg-[radial-gradient(ellipse_at_50%_0%,#16263f_0%,#0e1828_55%,#0a111d_100%)] px-3 pt-5 pb-10 shadow-[inset_0_1px_0_rgb(255_255_255/0.06),0_30px_60px_-30px_rgb(0_0_0/0.8)] sm:px-8 sm:pt-7 sm:pb-14"
      >
        {/* Dealer */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] tracking-[0.2em] text-white/40 uppercase">Dealer</span>
            <ValuePill cards={state.dealerCards} hideHole={state.dealerHoleHidden} />
          </div>
          <div className="flex min-h-[5.5rem] items-center sm:min-h-28">
            {state.dealerCards.length === 0 ? (
              <div className="h-[5.5rem] w-[3.9rem] rounded-lg border border-dashed border-white/15 sm:h-28 sm:w-20" />
            ) : (
              <Fan>
                {state.dealerCards.map((c, i) => (
                  <PlayingCard
                    key={i}
                    rank={state.dealerHoleHidden && i === 1 ? undefined : c}
                    seed={`${r}-d-${i}`}
                  />
                ))}
              </Fan>
            )}
          </div>
        </div>

        {/* Felt print */}
        <div className="pointer-events-none my-5 text-center select-none sm:my-7">
          <p className="text-[11px] font-semibold tracking-[0.35em] text-white/[0.18] uppercase sm:text-xs">
            Blackjack pays {settings.blackjackPayout === 1.5 ? '3 to 2' : settings.blackjackPayout === 1.2 ? '6 to 5' : '1 to 1'}
          </p>
          <p className="mt-1 text-[10px] tracking-[0.25em] text-white/[0.13] uppercase sm:text-[11px]">
            {rulesSummary(settings)}
          </p>
          <p
            aria-live="polite"
            className={`mx-auto mt-4 h-6 text-sm font-medium transition-opacity ${state.message ? 'text-white/85' : 'opacity-0'}`}
          >
            {state.message}
          </p>
        </div>

        {/* Seats: NPCs split around you, like a real arc */}
        {/* Phone: NPCs get their own row above you (player block is order-last + full width). */}
        <div className="flex flex-wrap items-end justify-center gap-x-3 gap-y-5 sm:flex-nowrap sm:gap-6">
          {npcLeft.map((seat, k) => {
            const i = Math.ceil(state.npcs.length / 2) + k;
            return <NpcSeat key={i} label={seatLabel(i)} hands={seat} seedPrefix={`${r}-n${i}`} />;
          })}
          <div className="order-last flex w-full flex-wrap items-end justify-center gap-1 sm:order-none sm:w-auto sm:gap-3">
            {state.hands.length === 0 ? (
              <div className="flex flex-col items-center gap-2 pb-1">
                <div className="h-[5.5rem] w-[3.9rem] rounded-lg border border-dashed border-white/15 sm:h-28 sm:w-20" />
                <span className="rounded-full border border-dashed border-white/25 px-2.5 py-0.5 font-mono text-[11px] text-[var(--text-muted)]">
                  {formatMoney(state.currentBet)}
                </span>
              </div>
            ) : (
              state.hands.map((hand, i) => (
                <PlayerHand
                  key={i}
                  hand={hand}
                  seedPrefix={`${r}-p${i}`}
                  isActive={playerTurn && i === state.activeHandIdx}
                  dimmed={playerTurn && state.hands.length > 1 && i !== state.activeHandIdx}
                />
              ))
            )}
          </div>
          {npcRight.map((seat, i) => (
            <NpcSeat key={i} label={seatLabel(i)} hands={seat} seedPrefix={`${r}-n${i}`} />
          ))}
        </div>
      </section>

      {/* Hint + count */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-sm">
        <button
          type="button"
          disabled={!playerTurn}
          onClick={() => setOptimalRevealed((v) => !v)}
          className="rounded-md px-2 py-1 text-[var(--text-muted)] transition-colors hover:text-[var(--text-primary)] disabled:opacity-40"
          title="Click to show or hide"
        >
          Optimal:{' '}
          <span className={`font-medium text-[var(--accent-soft)] transition-all ${optimalRevealed ? '' : 'blur-sm'}`}>
            {playerTurn ? (evaluation ? ACTION_LABELS[evaluation.best] : '…') : '—'}
          </span>
        </button>
        <span className="font-mono text-xs text-[var(--text-muted)]">{countLine}</span>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        {playerTurn ? (
          ACTION_ORDER.map((action) => (
            <button
              key={action}
              type="button"
              disabled={!isAvailable(action)}
              onClick={() => handleAction(action)}
              className={`group flex min-w-[5.5rem] items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30 ${
                action === 'hit' || action === 'stand'
                  ? 'bg-[var(--accent-strong)] text-white hover:bg-[var(--accent)]'
                  : 'border border-[var(--line)] bg-[var(--bg-second)] hover:border-white/20'
              }`}
            >
              {ACTION_LABELS[action]}
              <kbd className="hidden rounded border border-white/20 px-1 font-mono text-[10px] opacity-60 sm:inline">
                {ACTION_KEY_LABEL[action]}
              </kbd>
            </button>
          ))
        ) : (
          <button
            type="button"
            disabled={!canDeal}
            onClick={handleDeal}
            className="flex min-w-[12rem] items-center justify-center gap-2 rounded-xl bg-[var(--accent-strong)] px-6 py-3 font-medium text-white transition-all hover:bg-[var(--accent)] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state.phase === 'round-over' ? 'Deal next hand' : 'Deal'}
            <kbd className="hidden rounded border border-white/25 px-1 font-mono text-[10px] opacity-70 sm:inline">
              Space
            </kbd>
          </button>
        )}
      </div>
      {!canDeal && !playerTurn && (
        <p className="mt-2 text-center text-xs text-rose-400">Not enough balance for this bet. Lower it or reset.</p>
      )}

      {/* Realistic mode */}
      {realisticMode && (
        <section className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--bg-second)] p-4">
          <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            {playerTurn ? (
              <Meter
                label="Decision"
                pct={decisionSeconds > 0 ? Math.min(100, (decisionRemaining / decisionSeconds) * 100) : 0}
                color={decisionRemaining <= 0 ? 'bg-rose-500' : 'bg-[var(--accent)]'}
                trailing={<span className="w-10 font-mono text-xs tabular-nums">{decisionRemaining.toFixed(1)}s</span>}
              />
            ) : (
              canDeal &&
              state.phase === 'round-over' && (
                <span className="text-xs text-[var(--text-muted)]">Next hand in {autoDealRemaining.toFixed(1)}s</span>
              )
            )}
            <Meter
              label="Heat"
              pct={heat}
              color={heat < 40 ? 'bg-emerald-500' : heat < 75 ? 'bg-amber-400' : 'bg-rose-500'}
            />
          </div>
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg bg-[var(--line)] sm:grid-cols-5">
            {[
              ['Avg decision', formatSeconds(pacing.decisionTotal, pacing.decisionCount)],
              ['Slow decisions', pacing.decisionCount > 0 ? String(pacing.slowDecisions) : '—'],
              ['Avg hand', formatSeconds(pacing.handTotal, pacing.handCount)],
              ['Hands played', pacing.handCount > 0 ? String(pacing.handCount) : '—'],
              [
                'Hands / hour',
                pacing.handCount > 0
                  ? String(
                      Math.round(3600 / (pacing.handTotal / pacing.handCount + clearSeconds * (1 + state.npcCount))),
                    )
                  : '—',
              ],
            ].map(([label, value]) => (
              <div key={label} className="bg-[var(--bg-second)] p-3">
                <dt className="text-[11px] tracking-wide text-[var(--text-muted)] uppercase">{label}</dt>
                <dd className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <ReferencePanel
        open={referenceOpen}
        onClose={() => setReferenceOpen(false)}
        systemKey={settings.countingSystem}
        decks={state.decks}
        rules={rules}
      />
    </main>
  );
}
