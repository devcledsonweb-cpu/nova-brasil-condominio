import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Building2,
  ShieldCheck,
  Bike,
  Package,
  Wrench,
  FileText,
  KeyRound,
  CalendarDays,
  FileDown,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingDeliveriesCount?: number;
  openIncidentsCount?: number;
  pendingHandoverCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  pendingHandoverCount = 0,
}) => {
  const { role, user } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Painel Geral',
      icon: LayoutDashboard,
      description: 'Métricas e visão da empresa',
    },
    {
      id: 'condominios',
      label: 'Postos / Condomínios',
      icon: Building2,
      description: 'Condomínios clientes atendidos',
    },
    {
      id: 'agentes',
      label: 'Agentes de Portaria',
      icon: ShieldCheck,
      description: 'Equipe nos condomínios',
    },
    {
      id: 'escalas',
      label: 'Escala 12x36 & Faltas',
      icon: CalendarDays,
      description: 'Faltas, coberturas e folgas',
    },
    {
      id: 'ronda',
      label: 'Veículos de Ronda',
      icon: Bike,
      description: 'Motos e carros de ronda',
    },
    {
      id: 'patrimonio',
      label: 'Materiais & Patrimônio',
      icon: Package,
      description: 'Inventário da empresa no posto',
    },
    {
      id: 'manutencoes',
      label: 'Manutenções & O.S.',
      icon: Wrench,
      description: 'Manutenções prediais executadas',
    },
    {
      id: 'ocorrencias',
      label: 'Ocorrências & Turno',
      icon: FileText,
      description: 'Livro de ocorrências e guarita',
    },
    {
      id: 'relatorios',
      label: 'Central de PDFs',
      icon: FileDown,
      description: 'Download de relatórios oficiais',
    },
    ...(role === 'sindico' || role === 'admin'
      ? [
          {
            id: 'usuarios',
            label: 'Gestão de Usuários',
            icon: KeyRound,
            description: 'Controle de acessos e supervisores',
          },
        ]
      : []),
  ];

  return (
    <aside className="hidden md:flex w-64 border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/60 flex-col justify-between shrink-0 min-h-[calc(100vh-53px)] transition-colors">
      <div className="p-4 space-y-6">
        {/* Card do Perfil Ativo (Sem opção de troca dentro do painel) */}
        <div className="p-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                role === 'sindico' || role === 'admin'
                  ? 'bg-blue-600'
                  : role === 'supervisor'
                  ? 'bg-indigo-600'
                  : 'bg-emerald-600'
              }`}
            >
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'NB'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                {user?.name || 'Usuário Conectado'}
              </p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold truncate">
                {role === 'sindico' || role === 'admin'
                  ? 'Gestor da Empresa'
                  : role === 'supervisor'
                  ? 'Supervisor de Área'
                  : 'Agente de Portaria'}
              </p>
            </div>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Sessão Ativa
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
              Autenticado
            </span>
          </div>
        </div>

        {/* Itens de Navegação */}
        <div>
          <p className="px-2 mb-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            Módulos Operacionais
          </p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2 rounded-lg text-left transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white font-semibold shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 mt-0.5 shrink-0 ${
                      isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs truncate">{item.label}</span>
                      {item.id === 'ocorrencias' && pendingHandoverCount > 0 && (
                        <span className="text-[10px] font-black px-1.5 py-0.2 rounded-full bg-amber-500 text-white animate-pulse shrink-0">
                          {pendingHandoverCount}
                        </span>
                      )}
                    </div>
                    <p
                      className={`text-[10px] truncate ${
                        isActive ? 'text-blue-100' : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer da Sidebar */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-center">
        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
          NOVA BRASIL Operações v2.0
        </p>
        <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">
          Facilities, Segurança & Gestão
        </p>
      </div>
    </aside>
  );
};
