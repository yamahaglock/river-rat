import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { useDarkMode } from './hooks/useDarkMode';

export default function App() {
  const { isDark, toggle } = useDarkMode();

  return (
    <>
      <Header isDark={isDark} onToggleDark={toggle} />
      <main className="flex-1">
        <Dashboard />
      </main>
    </>
  );
}
