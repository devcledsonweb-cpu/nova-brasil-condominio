import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LayoutDashboard,
  Shield,
  Car,
  FileWarning,
  CalendarDays,
  Users,
  Building2,
  Megaphone,
  UserCog,
  CheckCircle2,
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
  pendingDeliveriesCount = 0,
  openIncidentsCount = 0,
  onOpenRoleModal,
}) => {
  const { role, user } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Painel Geral',
      icon: LayoutDashboard,
      description: 'Métricas e visão executiva',
    },
    {
      id: 'portaria',
      label: 'Portaria & Acesso',
      icon: Shield,
      badge: pendingDeliveriesCount > 0 ? `${pendingDeliveriesCount} enc.` : undefined,
      description: 'Visitantes e encomendas',
    },
    {
      id: 'veiculos',
      label: 'Veículos & Vagas',
      icon: Car,
      description: 'Busca rápida de garagens',
    },
    {
      id: 'ocorrencias',
      label: 'Livro de Ocorrências',
      icon: FileWarning,
      badge: openIncidentsCount > 0 ? `${openIncidentsCount} abertas` : undefined,
      description: 'Registro de infrações',
    },
    {
      id: 'reservas',
      label: 'Áreas Comuns & Reservas',
      icon: CalendarDays,
      description: 'Churrasqueira, salão e quadra',
    },
    {
      id: 'moradores',
      label: 'Moradores',
      icon: Users,
      description: 'Proprietários e inquilinos',
    },
    {
      id: 'estrutura',
      label: 'Estrutura & Unidades',
      icon: Building2,
      description: 'Blocos e apartamentos',
    },
    {
      id: 'comunicados',
      label: 'Mural & Enquetes',
      icon: Megaphone,
      description: 'Avisos oficiais e votações',
    },
  ];

  return (
    <aside className="w-64 border-r border-slate-200 bg-slate-50/50 flex flex-col justify-between shrink-0 min-h-[calc(100vh-53px)]">
      <div className="p-4 space-y-6">
        {/* Card do Perfil Ativo */}
        <div className="p-3 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">{user?.name}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                {role === 'sindico' ? 'Nível Síndico (Total)' : 'Nível Portaria (Operação)'}
              </p>
            </div>
            <button
              onClick={onOpenRoleModal}
              title="Trocar nível de acesso"
              className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
            >
              <UserCog className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Banco PostgreSQL Ativo
            </span>
            <button
              onClick={onOpenRoleModal}
              className="text-slate-700 hover:underline cursor-pointer font-medium"
            >
              Alterar
            </button>
          </div>
        </div>

        {/* Itens de Navegação */}
        <div>
          <p className="px-2 mb-2 text-[11px] font-semibold text-slate-400 tracking-wider">
            MÓDULOS DO SISTEMA
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium rounded-md transition-colors text-left cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-white/20 text-white'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Rodapé da Barra Lateral */}
      <div className="p-4 border-t border-slate-200 text-xs text-slate-500">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-700">NOVA BRASIL v1.0</span>
          <span className="font-mono text-[10px]">Cloud SQL</span>
        </div>
        <p className="text-[11px] text-slate-400 mt-1">Gestão Integrada de Condomínios</p>
      </div>
    </aside>
  );
};
