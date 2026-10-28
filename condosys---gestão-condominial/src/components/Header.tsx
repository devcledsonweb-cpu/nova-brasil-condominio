import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { ShieldCheck, UserCheck, LogIn, LogOut } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenRoleModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onOpenRoleModal }) => {
  const { user, role, firebaseUser, signInWithGoogle, signOut } = useAuth();

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-200 bg-white sticky top-0 z-40">
      {/* Zona 1: Wordmark limpo em texto único */}
      <a
        href="#dashboard"
        onClick={(e) => {
          e.preventDefault();
          setActiveTab('dashboard');
        }}
        className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 flex items-center gap-2"
      >
        <span className="w-2.5 h-2.5 rounded-sm bg-slate-900 inline-block"></span>
        NOVA BRASIL
      </a>

      {/* Zona 2: 4 a 5 links de navegação concisos em linha única */}
      <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-600">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'dashboard' ? 'text-slate-900 font-semibold underline underline-offset-4' : ''
          }`}
        >
          Visão Geral
        </button>
        <button
          onClick={() => setActiveTab('portaria')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'portaria' ? 'text-slate-900 font-semibold underline underline-offset-4' : ''
          }`}
        >
          Portaria & Acessos
        </button>
        <button
          onClick={() => setActiveTab('veiculos')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'veiculos' ? 'text-slate-900 font-semibold underline underline-offset-4' : ''
          }`}
        >
          Veículos & Vagas
        </button>
        <button
          onClick={() => setActiveTab('ocorrencias')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'ocorrencias' ? 'text-slate-900 font-semibold underline underline-offset-4' : ''
          }`}
        >
          Livro de Ocorrências
        </button>
        <button
          onClick={() => setActiveTab('reservas')}
          className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeTab === 'reservas' ? 'text-slate-900 font-semibold underline underline-offset-4' : ''
          }`}
        >
          Reservas
        </button>
      </nav>

      {/* Zona 3: Ação primária (Alternador de Perfil / Acesso Administrativo e Desconectar) */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenRoleModal}
          title="Alternar entre Síndico e Portaria"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {role === 'sindico' ? (
            <ShieldCheck className="w-3.5 h-3.5 text-slate-900" />
          ) : (
            <UserCheck className="w-3.5 h-3.5 text-slate-600" />
          )}
          <span>{role === 'sindico' ? 'Acesso: Síndico' : 'Acesso: Portaria'}</span>
        </button>

        <button
          onClick={() => signOut()}
          className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          title="Encerrar sessão"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sair</span>
        </button>
      </div>
    </header>
  );
};
