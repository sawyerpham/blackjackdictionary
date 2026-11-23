import { Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { HomePage } from './pages/HomePage';
import { CalculatorPage } from './pages/CalculatorPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ChallengePage } from './pages/ChallengePage';
import { GuidesPage } from './pages/GuidesPage';
import { SettingsPage } from './pages/SettingsPage';
import { AboutPage } from './pages/AboutPage';
import { BscPage } from './pages/BscPage';

function App() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[var(--bg-main)] text-[var(--text-primary)]">
      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/simulator" element={<SimulatorPage />} />
        <Route path="/bsc" element={<BscPage />} />
        <Route path="/daily" element={<ChallengePage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/guides/:slug" element={<GuidesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Routes>
    </div>
  );
}

export default App;
