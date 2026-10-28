import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Condominium } from '../types/index.ts';
import { ShieldCheck, UserCheck, LogOut, Building2, ChevronDown, Layers } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenRoleModal: () => void;
  condominiums: Condominium[];
  selectedCondoId: number | 'all';
  onSelectCondo: (id: number | 'all') => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenRoleModal,
  condominiums,
  selectedCondoId,
  onSelectCondo,
}) => {
  const { user, role, signOut } = useAuth();

  const currentCondo =
    selectedCondoId === 'all'
      ? null
      : condominiums.find((c) => c.id === selectedCondoId);

  return (
    <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-slate-200 bg-white sticky top-0 z-40">
      {/* Zona 1: Wordmark limpo em texto único + Seletor de Condomínio */}
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 inline-block"></span>
          NOVA BRASIL
        </a>

        {/* Seletor de Condomínio (Multi-Condomínio) */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-xs font-medium text-slate-800 transition-colors cursor-pointer border border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <select
              value={selectedCondoId === 'all' ? 'all' : String(selectedCondoId)}
              onChange={(e) => {
                const val = e.target.value;
                onSelectCondo(val === 'all' ? 'all' : Number(val));
              }}
              className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-hidden cursor-pointer max-w-[160px] sm:max-w-[220px] truncate pr-2"
              title="Filtrar condomínio ativo"
            >
              <option value="all">🏢 Todos os Condomínios (Global)</option>
              {condominiums.map((c) => (
                <option key={c.id} value={c.id}>
                  📍 {c.name} {c.city ? `(${c.city})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Zona 2: Navegação rápida em linha */}
      <nav className="hidden xl:flex items-center gap-5 text-xs font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'dashboard' ? 'text-slate-900 font-bold underline underline-offset-4' : ''
          }`}
        >
          Visão Geral
        </button>
        {role === 'sindico' && (
          <button
            onClick={() => setActiveTab('condominios')}
            className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              activeTab === 'condominios' ? 'text-slate-900 font-bold underline underline-offset-4' : ''
            }`}
          >
            Condomínios ({condominiums.length})
          </button>
        )}
        <button
          onClick={() => setActiveTab('estrutura')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'estrutura' ? 'text-slate-900 font-bold underline underline-offset-4' : ''
          }`}
        >
          Estrutura & Unidades
        </button>
        <button
          onClick={() => setActiveTab('moradores')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'moradores' ? 'text-slate-900 font-bold underline underline-offset-4' : ''
          }`}
        >
          Moradores
        </button>
        <button
          onClick={() => setActiveTab('portaria')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'portaria' ? 'text-slate-900 font-bold underline underline-offset-4' : ''
          }`}
        >
          Portaria & Acessos
        </button>
        <button
          onClick={() => setActiveTab('veiculos')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'veiculos' ? 'text-slate-900 font-bold underline underline-offset-4' : ''
          }`}
        >
          Veículos & Vagas
        </button>
      </nav>

      {/* Zona 3: Alternador de Perfil e Desconectar */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenRoleModal}
          title="Alternar entre Síndico e Portaria"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {role === 'sindico' ? (
            <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
          ) : (
            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
          )}
          <span>{role === 'sindico' ? 'Nível Síndico' : 'Nível Portaria'}</span>
        </button>

        <button
          onClick={() => signOut()}
          className="px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          title="Encerrar sessão"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>
    </header>
  );
};
