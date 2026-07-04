import type { Rank } from '../engine/blackjack-engine';

export function PlayingCard({ rank }: { rank?: Rank }) {
  if (!rank) {
    return (
      <div className="flex h-24 w-16 select-none items-center justify-center rounded-lg border-2 border-dashed border-gray-500 bg-gray-600">
        <span className="text-base font-bold text-gray-400">?</span>
      </div>
    );
  }

  return (
    <div className="flex h-24 w-16 select-none items-center justify-center rounded-lg bg-gray-100 shadow-md">
      <span className="text-2xl font-bold text-gray-900">{rank}</span>
    </div>
  );
}
