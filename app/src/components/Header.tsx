interface HeaderProps {
  isDark: boolean;
  onToggleDark: () => void;
}

export function Header({ isDark, onToggleDark }: HeaderProps) {
  return (
    <header className="bg-river-dark text-white px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] flex items-center justify-between sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-2">
        <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="15" fill="#0891B2" stroke="#22D3EE" strokeWidth="1.5" />
          <path d="M6 18c3-3 5-1 8-4s5-1 8-4" stroke="white" strokeWidth="2" strokeLinecap="round" />
          <path d="M6 22c3-3 5-1 8-4s5-1 8-4" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6" />
          <circle cx="22" cy="8" r="4" fill="#FDE68A" opacity="0.9" />
        </svg>
        <div>
          <h1 className="text-lg font-bold font-[family-name:var(--font-heading)] leading-tight">River Rat</h1>
          <p className="text-[10px] text-river-light opacity-80 leading-tight">Parker Dam Flow Tracker</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-river-light opacity-70">Times in PT</span>
        <button
          onClick={onToggleDark}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          title={isDark ? 'Light mode' : 'Dark mode'}
        >
          {isDark ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
