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
  UserCog,
  CheckCircle2,
  KeyRound,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  pendingDeliveriesCount?: number;
  openIncidentsCount?: number;
  onOpenRoleModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenRoleModal,
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
        {/* Card do Perfil Ativo */}
        <div className="p-3 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-2xs">
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-1">
              <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[140px]">{user?.name}</p>
              <p className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5 truncate">
                {role === 'sindico' || role === 'admin' ? 'Gestor da Empresa' : 'Supervisor de Operações'}
              </p>
            </div>
            <button
              onClick={onOpenRoleModal}
              title="Trocar nível de acesso"
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <UserCog className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              PostgreSQL Conectado
            </span>
            <button
              onClick={onOpenRoleModal}
              className="text-slate-700 dark:text-slate-300 hover:underline cursor-pointer font-medium"
            >
              Trocar
            </button>
          </div>
        </div>

        {/* Itens de Navegação */}
        <div>
          <p className="px-2 mb-2 text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider uppercase">
            Módulos da Empresa
          </p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
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
                    <div className="flex items-center justify-between">
                      <span className="text-xs truncate">{item.label}</span>
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
          Facilities, Segurança & Manutenção
        </p>
      </div>
    </aside>
  );
};
