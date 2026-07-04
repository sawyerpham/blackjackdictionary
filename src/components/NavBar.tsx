import { NavLink } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `transition-colors ${isActive ? 'text-emerald-500' : 'text-[var(--text-primary)] hover:text-emerald-500'}`;

export function NavBar() {
  return (
    <header className="bg-[var(--bg-second)] shadow-md">
      <nav className="container mx-auto flex items-center justify-between px-4 py-4">
        <NavLink to="/" className="text-2xl font-bold text-emerald-500">
          Blackjack Dictionary
        </NavLink>
        <div className="flex gap-6">
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
          <NavLink to="/about" className={linkClass}>
            About
          </NavLink>
        </div>
      </nav>
    </header>
  );
}
