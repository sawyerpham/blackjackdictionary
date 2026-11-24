import { useEffect, useId, useMemo, useReducer, useRef, useState } from 'react';
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
  MAX_NPCS,
  firstBaseSeats,
  PENETRATION_OPTIONS,
  handTotal,
  initialSimState,
  simulatorReducer,
  visibleShoe,
  type HandState,
  type NpcHandState,
  type SimState,
} from '../state/simulatorLogic';
import { DealtCard, PlayingCard } from '../components/PlayingCard';
import { useDealReveal } from '../state/useDealReveal';
import { Toggle } from '../components/RuleControls';
import { ReferencePanel } from '../components/ReferencePanel';
import { ProfitTracker } from '../components/ProfitTracker';
import { countDisplay, getCountingSystem } from '../engine/countingSystems';

const BALANCE_KEY = 'blackjack-balance';

/** The table survives switching tabs: the page unmounts, this doesn't. (A full reload still starts fresh.) */
let savedTable: SimState | undefined;
const PROFIT_KEY = 'blackjack-profit';
/** Rounds kept for the profit chart. */
const MAX_TRACKED_ROUNDS = 5000;

function loadProfit(): number[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(PROFIT_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

/** Net dollars a finished round won or lost, from each hand's result and (doubled) bet. */
function roundProfit(hands: HandState[], blackjackPays: number): number {
  return hands.reduce((sum, h) => {
    switch (h.outcome) {
      case 'win':
        return sum + h.bet;
      case 'blackjack':
        return sum + h.bet * blackjackPays;
      case 'lose':
        return sum - h.bet;
      case 'surrender':
        return sum - h.bet / 2;
      default:
        return sum;
    }
  }, 0);
}

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
      <p className="text-caption text-[var(--text-muted)]">{label}</p>
      <div className="tabular-nums text-[15px] font-semibold">{children}</div>
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

const STEP_BTN =
  'flex h-7 w-8 items-center justify-center rounded-[7px] bg-[var(--fill)] text-[17px] leading-none transition-colors active:bg-white/25 disabled:opacity-40';

function PlayersStat({
  count,
  disabled,
  dispatch,
}: {
  count: number;
  disabled: boolean;
  dispatch: (a: { type: 'ADJUST_NPC_COUNT'; delta: number }) => void;
}) {
  return (
    <Stat label="Players" hint="NPC seats at the table" disabled={disabled}>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          aria-label="Remove a player"
          disabled={disabled || count <= 0}
          onClick={() => dispatch({ type: 'ADJUST_NPC_COUNT', delta: -1 })}
          className={STEP_BTN}
        >
          −
        </button>
        <span className="w-4 text-center">{count}</span>
        <button
          type="button"
          aria-label="Add a player"
          disabled={disabled || count >= MAX_NPCS}
          onClick={() => dispatch({ type: 'ADJUST_NPC_COUNT', delta: 1 })}
          className={STEP_BTN}
        >
          +
        </button>
      </div>
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
  const btn = STEP_BTN;
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
      className={`rounded-full px-2.5 py-0.5 tabular-nums text-xs font-semibold ${
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

/** Point list for an SVG polygon. */
const pts = (...p: [number, number][]) => p.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

/** Shared SVG patterns: card edges (side-on), the blue card back, and a soft table shadow. */
function CardPatterns({ id, edgeAngle = 0 }: { id: string; edgeAngle?: number }) {
  return (
    <defs>
      <pattern
        id={`${id}-edges`}
        width="1.6"
        height="1.6"
        patternUnits="userSpaceOnUse"
        patternTransform={`rotate(${edgeAngle})`}
      >
        <rect width="1.6" height="1.6" fill="#d9dee7" />
        <rect width="0.55" height="1.6" fill="#8d96a6" />
      </pattern>
      <pattern id={`${id}-back`} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="3" height="3" fill="#2563eb" />
        <rect width="0.8" height="3" fill="rgb(255 255 255 / 0.28)" />
      </pattern>
      <filter id={`${id}-shadow`} x="-20%" y="-50%" width="140%" height="200%">
        <feGaussianBlur stdDeviation="2.2" />
      </filter>
    </defs>
  );
}

/**
 * Dealing shoe as a player sees it: a smoked-acrylic box, dealing end (slanted) on the left, cards
 * standing on edge inside with the front card's back showing. Dealing shortens the block from the
 * back; the red cut card keeps (1 - penetration) of a full shoe behind it, so it travels forward
 * with the block and is "out" once it reaches the front.
 */
function ShoeView({ count, full, cut }: { count: number; full: number; cut: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const frac = Math.min(1, count / full);
  const behind = 1 - cut;
  const cutOut = frac <= behind;
  // Oblique projection: depth runs up-right by (DX, DY); cards lean with the slanted front.
  const DX = 12;
  const DY = -9;
  const LEAN = 22; // horizontal run of the slant, bottom to top
  const MAX_L = 108; // block length of a full shoe
  const L = MAX_L * frac;
  const c = Math.max(0, MAX_L * (frac - behind)); // cut card's distance from the front of the block
  const by = 60; // block bottom
  const ty = 27; // block top
  const bx = 12; // block front, bottom corner
  return (
    <div
      role="img"
      aria-label={`Shoe: ${count} cards${cutOut ? ', cut card out, shuffle next hand' : ''}`}
      className="flex flex-col items-center gap-0.5"
    >
      {/* Fixed-height slot, bottom-aligned, so the shoe and tray labels line up. */}
      <div className="flex h-16 items-end sm:h-20">
      <svg viewBox="0 0 170 72" className="w-[7.5rem] sm:w-32 lg:w-40" aria-hidden data-shoe>
        <CardPatterns id={id} edgeAngle={34} />
        <ellipse cx="88" cy="66" rx="78" ry="5" fill="rgb(0 0 0 / 0.55)" filter={`url(#${id}-shadow)`} />
        {/* far wall, floor and back end, behind the cards */}
        <polygon points={pts([22, 54], [164, 54], [164, 15], [44, 15])} fill="rgb(4 9 18 / 0.85)" />
        <polygon points={pts([8, 63], [150, 63], [164, 54], [22, 54])} fill="rgb(4 9 18 / 0.9)" />
        <polygon
          points={pts([150, 63], [150, 24], [164, 15], [164, 54])}
          fill="rgb(6 12 22 / 0.95)"
          stroke="rgb(255 255 255 / 0.1)"
          strokeWidth="0.6"
        />
        {count > 0 && (
          <g>
            {/* tops of the cards */}
            <polygon
              points={pts([bx + LEAN, ty], [bx + LEAN + L, ty], [bx + LEAN + L + DX, ty + DY], [bx + LEAN + DX, ty + DY])}
              fill={`url(#${id}-edges)`}
              opacity="0.7"
            />
            {/* side of the block: card edges */}
            <polygon
              points={pts([bx, by], [bx + L, by], [bx + LEAN + L, ty], [bx + LEAN, ty])}
              fill={`url(#${id}-edges)`}
              opacity="0.9"
            />
            {/* front card: its back shows at the dealing end */}
            <polygon
              points={pts([bx, by], [bx + LEAN, ty], [bx + LEAN + DX, ty + DY], [bx + DX, by + DY])}
              fill={`url(#${id}-back)`}
              stroke="rgb(255 255 255 / 0.5)"
              strokeWidth="0.5"
            />
            {/* cut card: red plastic standing among the cards, a hair taller */}
            <polygon
              points={pts([bx + c, by], [bx + LEAN + c + 1.3, ty - 2.5], [bx + LEAN + c + 2.6, ty - 2.5], [bx + c + 1.3, by])}
              fill="rgb(220 38 38 / 0.8)"
            />
          </g>
        )}
        {/* smoked acrylic near wall and lid, see-through so the cards show */}
        <polygon
          points={pts([8, 63], [150, 63], [150, 24], [30, 24])}
          fill="rgb(120 150 190 / 0.1)"
          stroke="rgb(255 255 255 / 0.22)"
          strokeWidth="0.7"
        />
        <polygon
          points={pts([30, 24], [150, 24], [164, 15], [44, 15])}
          fill="rgb(120 150 190 / 0.07)"
          stroke="rgb(255 255 255 / 0.18)"
          strokeWidth="0.6"
        />
        {/* dealing lip */}
        <polygon
          points={pts([4, 66], [24, 66], [36, 57], [16, 57])}
          fill="rgb(10 18 32)"
          stroke="rgb(255 255 255 / 0.15)"
          strokeWidth="0.6"
        />
        <line x1="30" y1="24" x2="150" y2="24" stroke="rgb(255 255 255 / 0.35)" strokeWidth="0.8" />
      </svg>
      </div>
      <span className="tabular-nums text-xs text-white/45">Shoe {count}</span>
    </div>
  );
}

/**
 * Discard holder as a player sees it: a clear acrylic box with face-down cards stacked flat, so the
 * pile gets taller as hands are cleared. Marks up the front edge show each deck, like real holders.
 */
function DiscardTray({ count, full, decks }: { count: number; full: number; decks: number }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const H_MAX = 46; // pile height of a full shoe
  const h = H_MAX * Math.min(1, count / full);
  const DX = 14;
  const DY = -9;
  const base = 70; // pile bottom, front
  const x0 = 12;
  const x1 = 84;
  const top = base - h;
  return (
    <div role="img" aria-label={`Discards: ${count} cards`} className="flex flex-col items-center gap-0.5">
      <div className="flex h-16 items-end sm:h-20">
      <svg viewBox="0 0 112 80" className="w-[5.5rem] sm:w-28" aria-hidden>
        <CardPatterns id={id} edgeAngle={90} />
        <ellipse cx="58" cy="74" rx="50" ry="5" fill="rgb(0 0 0 / 0.55)" filter={`url(#${id}-shadow)`} />
        {/* back wall, left wall and floor, behind the pile */}
        <polygon
          points={pts([26, 62], [102, 62], [102, 12], [26, 12])}
          fill="rgb(120 150 190 / 0.05)"
          stroke="rgb(255 255 255 / 0.12)"
          strokeWidth="0.6"
        />
        <polygon
          points={pts([10, 72], [26, 62], [26, 12], [10, 22])}
          fill="rgb(120 150 190 / 0.04)"
          stroke="rgb(255 255 255 / 0.12)"
          strokeWidth="0.6"
        />
        <polygon points={pts([10, 72], [86, 72], [102, 62], [26, 62])} fill="rgb(4 9 18 / 0.7)" />
        {count > 0 && (
          <g>
            {/* right side of the pile */}
            <polygon
              points={pts([x1, top], [x1 + DX, top + DY], [x1 + DX, base + DY], [x1, base])}
              fill={`url(#${id}-edges)`}
              opacity="0.65"
            />
            {/* front of the pile: stacked card edges */}
            <rect x={x0} y={top} width={x1 - x0} height={h} fill={`url(#${id}-edges)`} opacity="0.9" />
            {/* top card, face down */}
            <polygon
              points={pts([x0, top], [x1, top], [x1 + DX, top + DY], [x0 + DX, top + DY])}
              fill={`url(#${id}-back)`}
              stroke="rgb(255 255 255 / 0.5)"
              strokeWidth="0.5"
            />
          </g>
        )}
        {/* clear front and right walls */}
        <polygon
          points={pts([10, 72], [86, 72], [86, 22], [10, 22])}
          fill="rgb(120 150 190 / 0.07)"
          stroke="rgb(255 255 255 / 0.25)"
          strokeWidth="0.7"
        />
        <polygon
          points={pts([86, 72], [102, 62], [102, 12], [86, 22])}
          fill="rgb(120 150 190 / 0.05)"
          stroke="rgb(255 255 255 / 0.2)"
          strokeWidth="0.6"
        />
        <line x1="10" y1="22" x2="86" y2="22" stroke="rgb(255 255 255 / 0.35)" strokeWidth="0.8" />
        {/* deck marks up the front edge */}
        {Array.from({ length: decks + 1 }, (_, i) => {
          const y = base - (H_MAX * i) / decks;
          return (
            <line key={i} x1="10" x2="15" y1={y} y2={y} stroke="rgb(255 255 255 / 0.4)" strokeWidth="0.6" />
          );
        })}
      </svg>
      </div>
      <span className="tabular-nums text-xs text-white/45">Discards {count}</span>
    </div>
  );
}

/** Casino felt print: rule text curved along the table's arc, dealer rule inside a band. */
function FeltPrint({ payout, hitSoft17 }: { payout: string; hitSoft17: boolean }) {
  const id = useId();
  const arc = (y: number) => `M 40 ${y} Q 300 ${y + 90} 560 ${y}`;
  return (
    <svg
      viewBox="0 0 600 150"
      aria-label={`Blackjack pays ${payout}. Dealer ${hitSoft17 ? 'hits' : 'stands on'} soft 17.`}
      className="pointer-events-none mx-auto block w-full max-w-[560px] select-none"
    >
      <defs>
        <path id={`${id}a`} d={arc(22)} />
        <path id={`${id}b`} d={arc(80)} />
      </defs>
      <text fill="rgb(255 255 255 / 0.24)" fontSize="23" fontWeight="700" letterSpacing="7">
        <textPath href={`#${id}a`} startOffset="50%" textAnchor="middle">
          BLACKJACK PAYS {payout.toUpperCase()}
        </textPath>
      </text>
      <path d={arc(56)} fill="none" stroke="rgb(255 255 255 / 0.13)" strokeWidth="1.5" />
      <path d={arc(94)} fill="none" stroke="rgb(255 255 255 / 0.13)" strokeWidth="1.5" />
      <text fill="rgb(255 255 255 / 0.19)" fontSize="13" fontWeight="600" letterSpacing="3.5">
        <textPath href={`#${id}b`} startOffset="50%" textAnchor="middle">
          {hitSoft17 ? 'DEALER MUST DRAW TO 16 AND HIT SOFT 17' : "DEALER MUST DRAW TO 16 AND STAND ON ALL 17'S"}
        </textPath>
      </text>
    </svg>
  );
}

/** Cards fanned with overlap, like they sit on a table. */
function Fan({ children }: { children: ReactNode }) {
  return <div className="flex justify-center [&>*:not(:first-child)]:-ml-8 sm:[&>*:not(:first-child)]:-ml-10">{children}</div>;
}

function PlayerHand({
  hand,
  seedPrefix,
  isActive,
  dimmed,
  shown,
  animate,
  settled,
}: {
  hand: HandState;
  seedPrefix: string;
  isActive: boolean;
  dimmed: boolean;
  /** Whether card i has been dealt on screen yet. */
  shown: (i: number) => boolean;
  animate: boolean;
  settled: boolean;
}) {
  const cards = hand.cards.filter((_, i) => shown(i));
  const outcome = settled && hand.outcome ? OUTCOME_STYLE[hand.outcome] : undefined;
  return (
    <div
      className={`flex flex-col items-center gap-2 rounded-2xl px-3 pt-3 pb-2 transition-all ${
        isActive ? 'bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] ring-1 ring-[var(--accent)]/60' : ''
      } ${dimmed ? 'opacity-55' : ''}`}
    >
      <Fan>
        {cards.map((c, i) => (
          <DealtCard key={`${seedPrefix}-${i}`} animate={animate}>
            <PlayingCard rank={c} seed={`${seedPrefix}-${i}`} />
          </DealtCard>
        ))}
      </Fan>
      <div className="flex items-center gap-1.5">
        <ValuePill cards={cards} />
        {outcome && (
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${outcome[1]}`}>{outcome[0]}</span>
        )}
      </div>
      <span className="rounded-full border border-dashed border-white/25 px-2.5 py-0.5 tabular-nums text-[11px] text-[var(--text-muted)]">
        {formatMoney(hand.bet)}
      </span>
    </div>
  );
}

function NpcSeat({
  label,
  hands,
  seedPrefix,
  shown,
  animate,
}: {
  label: string;
  hands: NpcHandState[];
  seedPrefix: string;
  /** Whether card j of hand i has been dealt on screen yet. */
  shown: (i: number, j: number) => boolean;
  animate: boolean;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1.5">
      {hands.map((hand, i) => {
        const cards = hand.cards.filter((_, j) => shown(i, j));
        if (cards.length === 0) return null;
        const { total } = handTotal(cards);
        const surrendered = hand.surrendered && cards.length === hand.cards.length;
        return (
          <div key={i} className="flex flex-col items-center gap-1">
            <div className="flex [&>*:not(:first-child)]:-ml-4">
              {cards.map((c, j) => (
                <DealtCard key={`${seedPrefix}-${i}-${j}`} animate={animate}>
                  <PlayingCard size="sm" rank={c} seed={`${seedPrefix}-${i}-${j}`} />
                </DealtCard>
              ))}
            </div>
            <span
              className={`tabular-nums text-[10px] ${surrendered || total > 21 ? 'text-rose-400' : 'text-white/60'}`}
            >
              {surrendered ? 'Surr' : total > 21 ? 'Bust' : total}
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
    if (savedTable) return savedTable;
    const stored = loadBalance();
    return initialSimState(settings.decks, stored.balance, stored.defaultBalance);
  });
  useEffect(() => {
    savedTable = state;
  }, [state]);

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
  const [profitRounds, setProfitRounds] = useState<number[]>(loadProfit);
  const recordedRoundRef = useRef(savedTable?.phase === 'round-over' ? savedTable.round : 0);
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
  // Cards are dealt on screen one at a time (Settings > Appearance); OS reduced motion turns it off.
  // Reduce Motion doesn't turn dealing off: DealtCard swaps the fly-in for a fade instead.
  const animate = settings.animations;
  const { isShown, settled } = useDealReveal(state, animate);

  const isAvailable = (action: EngineAction) =>
    settled &&
    !!activeHand &&
    legalActions.includes(action) &&
    (action !== 'split' || !(activeHand.isSplitAces && !rules.allowResplitAces));

  const countLine = useMemo(
    () => countDisplay(getCountingSystem(settings.countingSystem), state.decks, visibleShoe(state)),
    [settings.countingSystem, state],
  );

  const canAfford = state.balance >= state.currentBet;
  // Wait for the last card to land before the next deal.
  const canDeal = !playerTurn && canAfford && settled;
  const cardsLeft = state.shoe.reduce((a, b) => a + b, 0);
  const fullShoe = 52 * state.decks;
  const cardsOnTable =
    state.dealerCards.length +
    state.hands.reduce((n, h) => n + h.cards.length, 0) +
    state.npcs.reduce((n, seat) => n + seat.reduce((m, h) => m + h.cards.length, 0), 0);
  // Cards still on the felt go to the discard tray when the next hand is dealt.
  const discards = Math.max(0, fullShoe - cardsLeft - cardsOnTable);

  // Decision countdown + heat build-up. Restarts at every decision point
  // (any action replaces state.hands, so it doubles as the reset trigger).
  useEffect(() => {
    if (!realisticMode || state.phase !== 'player-turn' || !settled) {
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
  }, [realisticMode, state.phase, state.activeHandIdx, state.hands, decisionSeconds, settled]);

  // Record the hand's duration once it resolves.
  useEffect(() => {
    if (state.phase === 'player-turn') return;
    const start = handStartRef.current;
    if (start === null) return;
    handStartRef.current = null;
    const secs = (Date.now() - start) / 1000;
    setPacing((p) => ({ ...p, handCount: p.handCount + 1, handTotal: p.handTotal + secs }));
  }, [state.phase, state.hands]);

  // Record each round's net once, when it resolves (also catches rounds that end on the deal).
  useEffect(() => {
    if (state.phase !== 'round-over' || state.round === 0 || recordedRoundRef.current === state.round) return;
    recordedRoundRef.current = state.round;
    const net = roundProfit(state.hands, rules.blackjackPays);
    setProfitRounds((rs) => [...rs, net].slice(-MAX_TRACKED_ROUNDS));
  }, [state.phase, state.round, state.hands, rules.blackjackPays]);

  useEffect(() => {
    try {
      localStorage.setItem(PROFIT_KEY, JSON.stringify(profitRounds));
    } catch {
      // storage blocked: tracker just won't persist
    }
  }, [profitRounds]);

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
    if (!realisticMode || state.phase !== 'round-over' || !settled) return;
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
  }, [realisticMode, state.phase, state.hands, state.npcs, state.balance, state.currentBet, clearSeconds, rules, settled]);

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

  // The dealer deals from their left to their right, which on screen is right to left. Seat 1 (first
  // base) is the far right, then the seats toward you, you, and the rest out to the far left.
  const firstBase = firstBaseSeats(state.npcs.length);
  const seatsRightOfYou = Array.from({ length: firstBase }, (_, i) => firstBase - 1 - i); // e.g. 3, 2, 1
  const seatsLeftOfYou = Array.from({ length: state.npcs.length - firstBase }, (_, i) => state.npcs.length - 1 - i); // e.g. 5, 4
  const seatLabel = (i: number) => `Seat ${i + 1}`;
  // Too many seats + split hands for one row: give NPCs their own row above you (always the layout on phones).
  const seatUnits = state.npcs.length + state.hands.reduce((n, h) => n + 1 + h.cards.length / 2, 0);
  const crowded = seatUnits > 7;
  const r = state.round;
  const dealerShown = state.dealerCards.filter((_, i) => isShown(`d-${i}`));
  // The hole card stays face down until the dealer's turn reaches it on screen.
  const holeDown = state.dealerHoleHidden || !isShown('d-flip');

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-6 sm:px-4 sm:py-8">
      {/* Table controls */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-[12px] bg-[var(--bg-second)] p-1.5">
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
            <PlayersStat count={state.npcCount} disabled={playerTurn} dispatch={dispatch} />
          </div>
        </div>
        <div className="flex w-full items-center justify-end gap-1.5 border-t border-[var(--line)] pt-1.5 pr-1 sm:w-auto sm:border-0 sm:pt-0">
          <label className="flex min-h-11 items-center gap-2 px-2 text-[15px]">
            Realistic
            <Toggle
              label="Realistic mode"
              checked={realisticMode}
              onChange={(v) => {
                setRealisticMode(v);
                setHeat(0);
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => setReferenceOpen((o) => !o)}
            aria-expanded={referenceOpen}
            className="min-h-11 px-3 text-[15px] text-[var(--accent)] active:opacity-50"
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
        {/* Phone: own row above the dealer so a long dealer hand can't run into them. sm+: table corners. */}
        <div className="mb-4 flex items-start justify-between pt-6 sm:contents">
          <div className="sm:absolute sm:top-8 sm:left-8">
            <DiscardTray count={discards} full={fullShoe} decks={state.decks} />
          </div>
          <div className="sm:absolute sm:top-8 sm:right-8">
            <ShoeView count={cardsLeft} full={fullShoe} cut={PENETRATION_OPTIONS[state.penetrationIdx].value} />
          </div>
        </div>

        {/* Dealer */}
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] tracking-[0.2em] text-white/40 uppercase">Dealer</span>
            <ValuePill cards={dealerShown} hideHole={holeDown} />
          </div>
          <div className="flex min-h-[5.5rem] items-center sm:min-h-28">
            {dealerShown.length === 0 ? (
              <div className="h-[5.5rem] w-[3.9rem] rounded-lg border border-dashed border-white/15 sm:h-28 sm:w-20" />
            ) : (
              <Fan>
                {dealerShown.map((c, i) => (
                  <DealtCard key={`${r}-d-${i}`} animate={animate} faceUp={!(i === 1 && holeDown)}>
                    <PlayingCard rank={i === 1 && holeDown ? undefined : c} seed={`${r}-d-${i}`} />
                  </DealtCard>
                ))}
              </Fan>
            )}
          </div>
        </div>

        <div className="my-4 text-center sm:my-6">
          <FeltPrint
            payout={settings.blackjackPayout === 1.5 ? '3 to 2' : settings.blackjackPayout === 1.2 ? '6 to 5' : '1 to 1'}
            hitSoft17={settings.hitSoft17}
          />
          <p
            aria-live="polite"
            className={`mx-auto mt-1 h-6 text-sm font-medium transition-opacity ${settled && state.message ? 'text-white/85' : 'opacity-0'}`}
          >
            {settled && state.message}
          </p>
        </div>

        {/* Seats: NPCs split around you, like a real arc */}
        {/* Phone: NPCs get their own row above you (player block is order-last + full width). */}
        <div
          className={`flex flex-wrap items-end justify-center gap-x-3 gap-y-5 sm:gap-x-6 ${crowded ? '' : 'sm:flex-nowrap'}`}
        >
          {seatsLeftOfYou.map((i) => (
            <NpcSeat
              key={i}
              label={seatLabel(i)}
              hands={state.npcs[i]}
              seedPrefix={`${r}-n${i}`}
              shown={(h, j) => isShown(`n${i}-${h}-${j}`)}
              animate={animate}
            />
          ))}
          <div
            className={`order-last flex w-full flex-row-reverse flex-wrap items-end justify-center gap-1 sm:gap-3 ${
              crowded ? '' : 'sm:order-none sm:w-auto'
            }`}
          >
            {state.hands.length === 0 ? (
              <div className="flex flex-col items-center gap-2 pb-1">
                <div className="h-[5.5rem] w-[3.9rem] rounded-lg border border-dashed border-white/15 sm:h-28 sm:w-20" />
                <span className="rounded-full border border-dashed border-white/25 px-2.5 py-0.5 tabular-nums text-[11px] text-[var(--text-muted)]">
                  {formatMoney(state.currentBet)}
                </span>
              </div>
            ) : (
              state.hands.map((hand, i) => (
                <PlayerHand
                  key={i}
                  hand={hand}
                  seedPrefix={`${r}-p${i}`}
                  isActive={playerTurn && settled && i === state.activeHandIdx}
                  dimmed={playerTurn && state.hands.length > 1 && i !== state.activeHandIdx}
                  shown={(j) => isShown(`p${i}-${j}`)}
                  animate={animate}
                  settled={settled}
                />
              ))
            )}
          </div>
          {seatsRightOfYou.map((i) => (
            <NpcSeat
              key={i}
              label={seatLabel(i)}
              hands={state.npcs[i]}
              seedPrefix={`${r}-n${i}`}
              shown={(h, j) => isShown(`n${i}-${h}-${j}`)}
              animate={animate}
            />
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
            {playerTurn ? (settled && evaluation ? ACTION_LABELS[evaluation.best] : '…') : '—'}
          </span>
        </button>
        <span className="tabular-nums text-xs text-[var(--text-muted)]">{countLine}</span>
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
              className={`group flex min-h-11 min-w-[5.5rem] items-center justify-center gap-2 rounded-xl px-4 text-[17px] font-semibold transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-30 ${
                action === 'hit' || action === 'stand'
                  ? 'bg-[var(--accent)] text-white hover:brightness-110'
                  : 'bg-[var(--fill)] text-[var(--accent)] hover:brightness-125'
              }`}
            >
              {ACTION_LABELS[action]}
              <kbd className="hidden rounded border border-white/20 px-1 tabular-nums text-[10px] opacity-60 sm:inline">
                {ACTION_KEY_LABEL[action]}
              </kbd>
            </button>
          ))
        ) : (
          <button
            type="button"
            disabled={!canDeal}
            onClick={handleDeal}
            className="flex min-h-[50px] min-w-[14rem] items-center justify-center gap-2 rounded-[14px] bg-[var(--accent)] px-6 text-[17px] font-semibold text-white transition-all hover:brightness-110 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {state.phase === 'round-over' ? 'Deal next hand' : 'Deal'}
            <kbd className="hidden rounded border border-white/25 px-1 tabular-nums text-[10px] opacity-70 sm:inline">
              Space
            </kbd>
          </button>
        )}
      </div>
      {!canAfford && !playerTurn && (
        <p className="mt-2 text-center text-xs text-rose-400">Not enough balance for this bet. Lower it or reset.</p>
      )}

      {/* Realistic mode */}
      {realisticMode && (
        <section className="mt-6 rounded-[12px] bg-[var(--bg-second)] p-4">
          <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2">
            {playerTurn ? (
              <Meter
                label="Decision"
                pct={decisionSeconds > 0 ? Math.min(100, (decisionRemaining / decisionSeconds) * 100) : 0}
                color={decisionRemaining <= 0 ? 'bg-rose-500' : 'bg-[var(--accent)]'}
                trailing={<span className="w-10 tabular-nums text-xs">{decisionRemaining.toFixed(1)}s</span>}
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
          <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[10px] bg-[var(--line)] sm:grid-cols-5">
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
                <dt className="text-caption text-[var(--text-muted)]">{label}</dt>
                <dd className="mt-0.5 tabular-nums text-lg font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <ProfitTracker
        rounds={profitRounds}
        onReset={() => {
          recordedRoundRef.current = state.round;
          setProfitRounds([]);
        }}
      />

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
