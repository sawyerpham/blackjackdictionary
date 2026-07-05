import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `transition-colors ${isActive ? 'text-[var(--accent)]' : 'text-[var(--text-primary)] hover:text-[var(--accent)]'}`;

export function NavBar() {
  return (
    <header className="bg-[var(--bg-second)] shadow-md">
      <nav className="container mx-auto flex flex-col items-center gap-3 px-4 py-4 sm:flex-row sm:justify-between">
        <NavLink to="/" className="text-xl font-bold text-[var(--accent)] sm:text-2xl">
          Blackjack Dictionary
        </NavLink>
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 sm:gap-6">
          <NavLink to="/" end className={linkClass}>
            Home
          </NavLink>
          <NavLink to="/calculator" className={linkClass}>
            Calculator
          </NavLink>
          <NavLink to="/simulator" className={linkClass}>
            Simulator
          </NavLink>
          <NavLink to="/daily" className={linkClass}>
            Challenge
          </NavLink>
          <NavLink to="/guides" className={linkClass}>
            Guides
          </NavLink>
          <NavLink to="/settings" className={linkClass}>
            Settings
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
