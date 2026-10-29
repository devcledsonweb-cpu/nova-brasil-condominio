import React from 'react';
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  Bike,
  Menu,
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenMobileMenu: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenMobileMenu,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'Painel', icon: LayoutDashboard },
    { id: 'condominios', label: 'Postos', icon: Building2 },
    { id: 'agentes', label: 'Agentes', icon: ShieldCheck },
    { id: 'ronda', label: 'Rondas', icon: Bike },
  ];

  return (
    <nav
      aria-label="Navegação móvel inferior"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-lg px-2 py-1.5 flex items-center justify-around"
    >
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all cursor-pointer min-h-[48px] ${
              isActive
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 font-medium'
            }`}
          >
            <div
              className={`p-1 rounded-lg transition-transform ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-950/60 scale-110 text-blue-600 dark:text-blue-400'
                  : ''
              }`}
            >
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 leading-none">
              {tab.label}
            </span>
          </button>
        );
      })}

      {/* Botão Mais / Menu completo */}
      <button
        onClick={onOpenMobileMenu}
        className="flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-all cursor-pointer min-h-[48px]"
      >
        <div className="p-1 rounded-lg">
          <Menu className="w-5 h-5" />
        </div>
        <span className="text-[10px] tracking-tight mt-0.5 leading-none">
          Mais
        </span>
      </button>
    </nav>
  );
};
