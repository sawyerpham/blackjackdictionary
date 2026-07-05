import { useEffect } from 'react';
import { Route, Routes } from 'react-router-dom';
import { NavBar } from './components/NavBar';
import { HomePage } from './pages/HomePage';
import { CalculatorPage } from './pages/CalculatorPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ChallengePage } from './pages/ChallengePage';
import { GuidesPage } from './pages/GuidesPage';
import { SettingsPage } from './pages/SettingsPage';
import { THEMES, useSettingsStore } from './state/settingsStore';

function useAppliedTheme() {
  const themeKey = useSettingsStore((s) => s.settings.theme);
  useEffect(() => {
    const theme = THEMES.find((t) => t.key === themeKey) ?? THEMES[0];
    const root = document.documentElement.style;
    root.setProperty('--bg-main', theme.bgMain);
    root.setProperty('--bg-second', theme.bgSecond);
    root.setProperty('--bg-third', theme.bgThird);
    root.setProperty('--text-muted', theme.textMuted);
    root.setProperty('--text-primary', theme.textPrimary);
    root.setProperty('--accent', theme.accent);
    root.setProperty('--accent-soft', theme.accentSoft);
    root.setProperty('--accent-strong', theme.accentStrong);
  }, [themeKey]);
}

function App() {
  useAppliedTheme();

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[var(--bg-main)] text-[var(--text-primary)]">

      <NavBar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/calculator" element={<CalculatorPage />} />
        <Route path="/simulator" element={<SimulatorPage />} />
        <Route path="/daily" element={<ChallengePage />} />
        <Route path="/guides" element={<GuidesPage />} />
        <Route path="/guides/:slug" element={<GuidesPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </div>
  );
}

export default App;
