import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/simulator', label: 'Simulator' },
  { to: '/bsc', label: 'BSC' },
  { to: '/guides', label: 'Guides' },
  { to: '/settings', label: 'Settings' },
  { to: '/about', label: 'About' },
];

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm transition-colors ${
    isActive
      ? 'bg-white/[0.08] text-[var(--text-primary)]'
      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
  }`;

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--bg-main)]/80 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-4 py-3 sm:flex-row sm:justify-between">
        <NavLink to="/" className="flex items-center gap-2 text-[15px] font-semibold tracking-tight">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[var(--accent)] text-xs text-white">
            ♠
          </span>
          Blackjack Dictionary
        </NavLink>
        <div className="flex flex-wrap justify-center gap-1">
          {LINKS.map((l) => (
            <NavLink key={l.to} to={l.to} className={linkClass}>
              {l.label}
            </NavLink>
          ))}
        </div>
      </nav>
    </header>
  );
}
