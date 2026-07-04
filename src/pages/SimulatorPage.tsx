import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, ReactNode } from 'react';
import { evaluate, type Action as EngineAction, type Evaluation } from '../engine/blackjack-engine';
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
            className="w-32 rounded bg-[var(--bg-second)] text-center text-indigo-300 outline-none ring-1 ring-emerald-500"
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
            className="w-24 rounded bg-[var(--bg-second)] text-center text-yellow-500 outline-none ring-1 ring-emerald-500"
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
      className={`rounded-lg bg-[var(--bg-third)] p-6 ${isActive ? 'ring-2 ring-emerald-500' : ''}`}
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
            isActive &&
            evaluation && (
              <button
                type="button"
                onClick={onToggleRevealed}
                className="text-sm text-emerald-400"
              >
                Optimal:{' '}
                <span className={`transition-all ${revealed ? '' : 'blur-sm'}`}>
                  {ACTION_LABELS[evaluation.best]}
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

  const evaluation: Evaluation | undefined = useMemo(() => {
    if (!activeHand || !dealerUp) return undefined;
    return evaluate(activeHand.cards, dealerUp, visibleShoe(state), rules, activeHand.splitsSoFar);
  }, [activeHand, dealerUp, state, rules]);

  const countLine = useMemo(
    () => countDisplay(getCountingSystem(settings.countingSystem), state.decks, visibleShoe(state)),
    [settings.countingSystem, state],
  );

  const dealerValue = state.dealerHoleHidden
    ? handTotal([state.dealerCards[0]]).total
    : handTotal(state.dealerCards).total;

  const canDeal = state.phase !== 'player-turn' && state.balance >= state.currentBet;

  const handleAction = (action: EngineAction) => {
    if (!activeHand) return;
    if (action === 'split' && activeHand.isSplitAces && !rules.allowResplitAces) return;
    dispatch({ type: action.toUpperCase() as 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT' | 'SURRENDER', rules });
  };

  return (
    <div className="container mx-auto flex-1 px-4 py-12 ">
      <div className="mx-auto max-w-4xl">
        <section className="rounded-lg bg-[var(--bg-second)] p-8">
          <h1 className="mb-6 text-3xl font-bold text-emerald-500">Blackjack Simulator</h1>

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
            <h3 className="mb-4 text-xl font-semibold text-emerald-400">Dealer</h3>
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
            <h3 className="mb-4 text-xl font-semibold text-emerald-400">Your Hands</h3>
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

          {state.phase === 'player-turn' && activeHand && evaluation && (
            <div className="flex flex-wrap justify-center gap-3">
              {ACTION_ORDER.map((action) => {
                const available =
                  evaluation.ev[action] !== undefined &&
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
                        : 'bg-emerald-600 hover:bg-emerald-500'
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
                onClick={() => dispatch({ type: 'DEAL', rules })}
                className="rounded-lg bg-emerald-600 px-6 py-3 font-medium text-[var(--text-primary)] transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Deal Cards
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
