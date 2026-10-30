import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useTheme } from '../context/ThemeContext.tsx';
import { Condominium } from '../types/index.ts';
import {
  ShieldCheck,
  LogOut,
  Building2,
  Bike,
  Package,
  Wrench,
  FileText,
  KeyRound,
  Sun,
  Moon,
  Menu,
  X,
  LayoutDashboard,
  CheckCircle2,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenRoleModal: () => void;
  condominiums: Condominium[];
  selectedCondoId: number | 'all';
  onSelectCondo: (id: number | 'all') => void;
  isMobileMenuOpen?: boolean;
  setIsMobileMenuOpen?: (open: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenRoleModal,
  condominiums,
  selectedCondoId,
  onSelectCondo,
  isMobileMenuOpen: externalIsMobileMenuOpen,
  setIsMobileMenuOpen: externalSetIsMobileMenuOpen,
}) => {
  const { user, role, signOut } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);

  const isMenuOpen = externalIsMobileMenuOpen !== undefined ? externalIsMobileMenuOpen : internalMenuOpen;
  const setMenuOpen = externalSetIsMobileMenuOpen !== undefined ? externalSetIsMobileMenuOpen : setInternalMenuOpen;

  const navItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'condominios', label: `Postos (${condominiums.length})`, icon: Building2 },
    { id: 'agentes', label: 'Agentes de Portaria', icon: ShieldCheck },
    { id: 'ronda', label: 'Veículos de Ronda', icon: Bike },
    { id: 'patrimonio', label: 'Materiais no Posto', icon: Package },
    { id: 'manutencoes', label: 'Manutenções', icon: Wrench },
    { id: 'ocorrencias', label: 'Livro de Turnos', icon: FileText },
    ...(role === 'sindico' || role === 'admin'
      ? [{ id: 'usuarios', label: 'Gestão de Usuários', icon: KeyRound }]
      : []),
  ];

  return (
    <>
      <header className="flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2.5 sm:py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-40 transition-colors">
        {/* Brand & Condominium Filter */}
        <div className="flex items-center gap-2 sm:gap-5 min-w-0">
          {/* Botão Hamburger Mobile */}
          <button
            onClick={() => setMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 -ml-1 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Alternar menu de navegação"
          >
            {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <a
            href="#dashboard"
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('dashboard');
              setMenuOpen(false);
            }}
            className="text-sm sm:text-base md:text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 flex items-center gap-2"
          >
            <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
              NB
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-white leading-none block">NOVA BRASIL</span>
              <span className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 font-medium tracking-tight hidden xs:block">
                Operações & Facilities
              </span>
            </div>
          </a>

          {/* Global / Assigned Condominium Selector */}
          {(() => {
            const isSuperUser = role === 'sindico' || role === 'admin';
            const userAssignedIds: number[] = Array.isArray(user?.condoIds) && user.condoIds.length > 0
              ? user.condoIds
              : (user?.condoId ? [user.condoId] : []);

            const accessibleCondos = isSuperUser || userAssignedIds.length === 0
              ? condominiums
              : condominiums.filter((c) => userAssignedIds.includes(c.id));

            return (
              <div className="relative flex items-center min-w-0">
                <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 rounded-lg text-xs font-medium text-slate-800 dark:text-slate-200 transition-colors cursor-pointer border border-slate-200 dark:border-slate-700/80">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <select
                    value={selectedCondoId === 'all' ? 'all' : String(selectedCondoId)}
                    onChange={(e) => {
                      const val = e.target.value;
                      onSelectCondo(val === 'all' ? 'all' : Number(val));
                    }}
                    className="bg-transparent text-[11px] sm:text-xs font-semibold text-slate-900 dark:text-slate-100 focus:outline-hidden cursor-pointer max-w-[110px] xs:max-w-[150px] sm:max-w-[220px] md:max-w-[260px] truncate pr-1"
                    title="Filtrar posto / condomínio atendido"
                  >
                    {isSuperUser ? (
                      <option value="all" className="dark:bg-slate-900 dark:text-slate-100">
                        🏢 Todos os Postos (Visão da Empresa)
                      </option>
                    ) : accessibleCondos.length > 1 ? (
                      <option value="all" className="dark:bg-slate-900 dark:text-slate-100">
                        🏢 Meus Postos Atribuídos ({accessibleCondos.length})
                      </option>
                    ) : null}

                    {accessibleCondos.map((c) => (
                      <option key={c.id} value={c.id} className="dark:bg-slate-900 dark:text-slate-100">
                        📍 {c.name} {c.city ? `(${c.city})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Quick Nav Links (Desktop) */}
        <nav className="hidden xl:flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-300">
          {navItems.slice(0, 6).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === item.id
                  ? 'text-blue-600 dark:text-blue-400 font-bold underline underline-offset-4'
                  : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Right Actions: Dark Mode, Role Modal & SignOut */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Dark Mode Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? 'Ativar modo claro' : 'Ativar modo noturno'}
            className="p-2 text-slate-500 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Alternar tema claro e escuro"
          >
            {isDark ? (
              <Sun className="w-4 h-4 text-amber-400 animate-in fade-in" />
            ) : (
              <Moon className="w-4 h-4 text-slate-600 animate-in fade-in" />
            )}
          </button>

          {/* Role switcher (desktop) */}
          <button
            onClick={onOpenRoleModal}
            title="Alternar perfil de acesso"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer min-h-[36px]"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>
              {role === 'sindico' || role === 'admin'
                ? 'Gestão da Empresa'
                : role === 'supervisor'
                ? 'Gestor do Condomínio'
                : 'Agente de Portaria'}
            </span>
          </button>

          {/* Sair */}
          <button
            onClick={() => signOut()}
            title="Encerrar sessão"
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-h-[40px] min-w-[40px] flex items-center justify-center"
            aria-label="Encerrar sessão"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation Overlay */}
      {isMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setMenuOpen(false)}
          />

          {/* Drawer content */}
          <div className="relative w-4/5 max-w-xs bg-white dark:bg-slate-900 h-full shadow-2xl p-4 flex flex-col justify-between overflow-y-auto border-r border-slate-200 dark:border-slate-800">
            <div className="space-y-4">
              {/* Header do Drawer */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
                    NB
                  </div>
                  <div>
                    <p className="font-extrabold text-sm text-slate-900 dark:text-white">NOVA BRASIL</p>
                    <p className="text-[10px] text-slate-400">Operações Condominiais</p>
                  </div>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Informações do usuário logado */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700/80">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{user?.name}</p>
                <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
                  {role === 'sindico' || role === 'admin'
                    ? 'Gestor Geral da Empresa'
                    : role === 'supervisor'
                    ? 'Gestor do Condomínio'
                    : 'Agente de Portaria'}
                </p>
                <div className="mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    PostgreSQL Ativo
                  </span>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onOpenRoleModal();
                    }}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold"
                  >
                    Alterar Perfil
                  </button>
                </div>
              </div>

              {/* Tema no mobile */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  {isDark ? <Moon className="w-4 h-4 text-blue-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  Modo Noturno
                </span>
                <button
                  onClick={toggleTheme}
                  className={`w-11 h-6 flex items-center rounded-full p-1 cursor-pointer transition-colors ${
                    isDark ? 'bg-blue-600 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="bg-white w-4 h-4 rounded-full shadow-md" />
                </button>
              </div>

              {/* Navegação completa */}
              <div className="space-y-1 pt-1">
                <p className="px-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase mb-1">
                  Módulos Operacionais
                </p>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors cursor-pointer min-h-[44px] ${
                        isActive
                          ? 'bg-blue-600 text-white font-semibold shadow-xs'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}`} />
                      <span className="text-xs truncate">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout no rodapé do drawer */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut();
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
