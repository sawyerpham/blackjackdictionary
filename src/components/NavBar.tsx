import { NavLink } from 'react-router-dom';

const LINKS = [
  { to: '/simulator', label: 'Simulator' },
  { to: '/bsc', label: 'BSC' },
  { to: '/guides', label: 'Guides' },
  { to: '/settings', label: 'Settings' },
  { to: '/about', label: 'About' },
];

// Apple-style bar: translucent material, label vs secondary-label for the current page, 44 pt targets.
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center px-2.5 text-[15px] transition-colors ${
    isActive ? 'font-semibold text-[var(--text-primary)]' : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
  }`;

export function NavBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-[rgb(22_22_24/0.72)] backdrop-blur-xl backdrop-saturate-150">
      <nav className="mx-auto flex max-w-6xl flex-col items-center px-4 sm:flex-row sm:justify-between">
        <NavLink to="/" className="text-headline flex min-h-11 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[7px] bg-[var(--accent)] text-sm text-white">
            ♠
          </span>
          Blackjack Dictionary
        </NavLink>
        <div className="flex flex-wrap justify-center">
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
