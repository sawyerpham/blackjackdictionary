import { useEffect, useLayoutEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Rank } from '../engine/blackjack-engine';

const SUITS = ['♠', '♥', '♦', '♣'] as const;
const TENS = ['10', 'J', 'Q', 'K'] as const;

/** Stable small hash so a card keeps its decorative suit/face across re-renders. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Suits and J/Q/K are decorative: the game only tracks rank, so `seed` (unique
 * per card per round) picks them. `rank` undefined renders the face-down hole card.
 */
export function PlayingCard({
  rank,
  seed = '',
  size = 'lg',
  className = '',
}: {
  rank?: Rank;
  seed?: string;
  size?: 'lg' | 'sm';
  className?: string;
}) {
  const box =
    size === 'lg'
      ? 'h-[5.5rem] w-[3.9rem] rounded-lg sm:h-28 sm:w-20'
      : 'h-12 w-[2.15rem] rounded-md';

  if (!rank) {
    return (
      <div
        aria-label="Face-down card"
        className={`${box} ${className} shrink-0 border border-white/20 bg-[var(--accent-strong)] p-1 shadow-lg shadow-black/40`}
      >
        <div className="h-full w-full rounded-[inherit] border border-white/25 bg-[repeating-linear-gradient(45deg,rgb(255_255_255/0.12)_0_2px,transparent_2px_7px)]" />
      </div>
    );
  }

  const h = hash(seed);
  const suit = SUITS[h % 4];
  const label = rank === '10' ? TENS[(h >>> 3) % 4] : rank;
  const red = suit === '♥' || suit === '♦';
  const ink = red ? 'text-rose-600' : 'text-zinc-900';

  if (size === 'sm') {
    return (
      <div
        aria-label={`${label}${suit}`}
        className={`${box} ${className} ${ink} relative shrink-0 bg-white leading-none font-semibold shadow-md shadow-black/40`}
      >
        {/* Corner index, so it stays readable when the next card overlaps the right side. */}
        <div className="absolute top-1 left-1 flex flex-col items-center">
          <span className={label === '10' ? 'text-[10px] tracking-[-0.08em]' : 'text-[12px]'}>{label}</span>
          <span className="text-[10px]">{suit}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-label={`${label}${suit}`}
      className={`${box} ${className} ${ink} relative shrink-0 bg-white font-semibold shadow-lg shadow-black/40 select-none`}
    >
      <div className="absolute top-1 left-1.5 flex flex-col items-center leading-none">
        <span className="text-sm sm:text-base">{label}</span>
        <span className="text-xs sm:text-sm">{suit}</span>
      </div>
      <span className="absolute inset-0 flex items-center justify-center text-3xl sm:text-4xl">{suit}</span>
      <div className="absolute right-1.5 bottom-1 flex rotate-180 flex-col items-center leading-none">
        <span className="text-sm sm:text-base">{label}</span>
        <span className="text-xs sm:text-sm">{suit}</span>
      </div>
    </div>
  );
}

/** OS-level Reduce Motion (Windows: Animation effects off; macOS/iOS: Reduce motion on). */
const prefersReducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/**
 * Wraps a card so it flies in from the shoe's dealing end when it mounts, and flips (edge-on, then
 * face-up) whenever `faceUp` changes, as when the dealer turns over the hole card. With `animate`
 * off it renders the card as-is. The shoe marks itself with `data-shoe`.
 *
 * Under Reduce Motion (Apple HIG): no travel or flip, the card fades in where it lands instead.
 */
export function DealtCard({ animate, faceUp = true, children }: { animate: boolean; faceUp?: boolean; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const wasFaceUp = useRef(faceUp);

  useLayoutEffect(() => {
    const el = ref.current;
    const shoe = document.querySelector('[data-shoe]');
    if (!animate || !el || !el.animate) return;
    if (prefersReducedMotion() || !shoe) {
      el.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: 'ease-out' });
      return;
    }
    const a = el.getBoundingClientRect();
    const b = shoe.getBoundingClientRect();
    const dx = b.left + b.width * 0.15 - (a.left + a.width / 2);
    const dy = b.top + b.height * 0.6 - (a.top + a.height / 2);
    el.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) rotate(-35deg) scale(0.3)`, opacity: 0.4 },
        { transform: 'none', opacity: 1 },
      ],
      { duration: 380, easing: 'cubic-bezier(0.2, 0.75, 0.25, 1)' },
    );
    // Mount only: a card is dealt once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (wasFaceUp.current === faceUp) return;
    wasFaceUp.current = faceUp;
    if (animate && ref.current?.animate) {
      ref.current.animate(
        prefersReducedMotion()
          ? [{ opacity: 0.2 }, { opacity: 1 }]
          : [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
        { duration: 260, easing: 'ease-out' },
      );
    }
  }, [faceUp, animate]);

  return (
    <div ref={ref} className="shrink-0">
      {children}
    </div>
  );
}
