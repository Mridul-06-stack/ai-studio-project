import React from 'react';

export type ActiveTab = 'prep' | 'workbench' | 'report' | 'history';

interface TopBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onPrimaryAction: () => void;
  primaryActionLabel: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onPrimaryAction,
  primaryActionLabel,
}) => {
  const navItems: { id: ActiveTab; label: string }[] = [
    { id: 'prep', label: 'Prep Studio' },
    { id: 'workbench', label: 'Live Workbench' },
    { id: 'report', label: 'Evaluation Report' },
    { id: 'history', label: 'Session History' },
  ];

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-4 bg-[#0B0F17] border-b border-slate-800/80">
      {/* Zone 1: Single text element wordmark */}
      <a
        href="#prep"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('prep');
        }}
        className="font-display text-lg font-bold tracking-tight text-slate-50 whitespace-nowrap shrink-0"
      >
        MIAA
      </a>

      {/* Zone 2: 4 clean single-line text navigation links */}
      <nav className="flex items-center gap-6 text-sm font-medium overflow-x-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`py-1 transition-colors whitespace-nowrap shrink-0 border-b-2 ${
                isActive
                  ? 'text-slate-50 border-indigo-500'
                  : 'text-slate-400 border-transparent hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1 primary action */}
      <div className="flex items-center shrink-0">
        <button
          type="button"
          onClick={onPrimaryAction}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {primaryActionLabel}
        </button>
      </div>
    </header>
  );
};
