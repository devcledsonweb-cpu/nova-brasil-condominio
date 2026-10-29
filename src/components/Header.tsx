import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Condominium } from '../types/index.ts';
import {
  ShieldCheck,
  UserCheck,
  LogOut,
  Building2,
  Bike,
  Package,
  Wrench,
  FileText,
  UserCog,
} from 'lucide-react';

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

  return (
    <header className="flex items-center justify-between gap-4 px-4 sm:px-6 py-3 border-b border-slate-200 bg-white sticky top-0 z-40">
      {/* Brand & Condominium Filter */}
      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('dashboard');
          }}
          className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2.5"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
            NB
          </div>
          <div>
            <span className="font-extrabold text-slate-900 leading-none block">NOVA BRASIL</span>
            <span className="text-[10px] text-slate-400 font-medium tracking-tight block">
              Operações & Facilities Condominiais
            </span>
          </div>
        </a>

        {/* Global Condominium / Posto Selector */}
        <div className="relative flex items-center">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200/80 rounded-lg text-xs font-medium text-slate-800 transition-colors cursor-pointer border border-slate-200">
            <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <select
              value={selectedCondoId === 'all' ? 'all' : String(selectedCondoId)}
              onChange={(e) => {
                const val = e.target.value;
                onSelectCondo(val === 'all' ? 'all' : Number(val));
              }}
              className="bg-transparent text-xs font-semibold text-slate-900 focus:outline-hidden cursor-pointer max-w-[170px] sm:max-w-[240px] truncate pr-2"
              title="Filtrar posto / condomínio atendido"
            >
              <option value="all">🏢 Todos os Postos (Visão da Empresa)</option>
              {condominiums.map((c) => (
                <option key={c.id} value={c.id}>
                  📍 {c.name} {c.city ? `(${c.city})` : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Quick Nav Links */}
      <nav className="hidden xl:flex items-center gap-5 text-xs font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'dashboard' ? 'text-blue-600 font-bold underline underline-offset-4' : ''
          }`}
        >
          Painel Geral
        </button>
        <button
          onClick={() => setActiveTab('condominios')}
          className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'condominios' ? 'text-blue-600 font-bold underline underline-offset-4' : ''
          }`}
        >
          Postos ({condominiums.length})
        </button>
        <button
          onClick={() => setActiveTab('agentes')}
          className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'agentes' ? 'text-blue-600 font-bold underline underline-offset-4' : ''
          }`}
        >
          Agentes de Portaria
        </button>
        <button
          onClick={() => setActiveTab('ronda')}
          className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'ronda' ? 'text-blue-600 font-bold underline underline-offset-4' : ''
          }`}
        >
          Veículos de Ronda
        </button>
        <button
          onClick={() => setActiveTab('patrimonio')}
          className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'patrimonio' ? 'text-blue-600 font-bold underline underline-offset-4' : ''
          }`}
        >
          Materiais no Posto
        </button>
        <button
          onClick={() => setActiveTab('manutencoes')}
          className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'manutencoes' ? 'text-blue-600 font-bold underline underline-offset-4' : ''
          }`}
        >
          Manutenções
        </button>
        <button
          onClick={() => setActiveTab('ocorrencias')}
          className={`hover:text-blue-600 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'ocorrencias' ? 'text-blue-600 font-bold underline underline-offset-4' : ''
          }`}
        >
          Livro de Turnos
        </button>
      </nav>

      {/* User Actions */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenRoleModal}
          title="Alternar perfil de acesso"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
          <span>{role === 'sindico' ? 'Gestão da Empresa' : 'Supervisão / Posto'}</span>
        </button>

        <button
          onClick={() => signOut()}
          title="Encerrar sessão"
          className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
