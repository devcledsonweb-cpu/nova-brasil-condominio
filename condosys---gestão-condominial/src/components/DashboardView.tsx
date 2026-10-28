import React from 'react';
import { DashboardStats, Announcement, Delivery, AccessLog } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Building2,
  Users,
  Car,
  Package,
  UserCheck,
  FileWarning,
  CalendarCheck,
  ArrowRight,
  Shield,
  PlusCircle,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  announcements: Announcement[];
  pendingDeliveries: Delivery[];
  activeVisitors: AccessLog[];
  onNavigate: (tab: string) => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  announcements,
  pendingDeliveries,
  activeVisitors,
  onNavigate,
  onRefresh,
}) => {
  const { role } = useAuth();

  return (
    <div className="space-y-6">
      {/* Banner de Boas-vindas com Estilo Arquitetônico Limpo */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            <span>Condomínio Residencial NOVA BRASIL</span>
            <span aria-hidden="true">·</span>
            <span>Painel Administrativo</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-400">
              {role === 'sindico' ? 'Gestão Síndico' : 'Operação Portaria'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {role === 'sindico' ? 'Centro de Controle e Gestão Condominial' : 'Estação Operacional da Portaria'}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            {role === 'sindico'
              ? 'Acompanhe a ocupação predial, aprovação de ocorrências, reservas de lazer e comunicados aos moradores em tempo real.'
              : 'Gerencie o fluxo de visitantes, prestadores de serviços, recepção de encomendas e identificação veicular.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('portaria')}
              className="px-4 py-2 text-xs font-semibold bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              Controle de Portaria
            </button>
            <button
              onClick={() => onNavigate('veiculos')}
              className="px-4 py-2 text-xs font-medium border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Car className="w-3.5 h-3.5" />
              Buscar Veículo / Vaga
            </button>
          </div>
        </div>

        {/* Fundo sutil geométrico arquitetônico */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center pr-6">
          <Building2 className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Grid de Métricas Principais (Tabular Figures) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div
          onClick={() => onNavigate('estrutura')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Unidades & Blocos</span>
            <Building2 className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {stats?.totalUnits ?? 0}
            </span>
            <span className="text-xs text-slate-500">aptos em {stats?.totalBlocks ?? 0} blocos</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('portaria')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Encomendas na Portaria</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-amber-700">
              {stats?.pendingDeliveries ?? 0}
            </span>
            <span className="text-xs text-slate-500">aguardando retirada</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('portaria')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Visitantes no Condomínio</span>
            <UserCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-blue-700">
              {stats?.activeVisitors ?? 0}
            </span>
            <span className="text-xs text-slate-500">acessos ativos agora</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('ocorrencias')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Ocorrências Abertas</span>
            <FileWarning className="w-4 h-4 text-rose-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-rose-700">
              {stats?.openIncidents ?? 0}
            </span>
            <span className="text-xs text-slate-500">requerem atenção</span>
          </div>
        </div>
      </div>

      {/* Grid Secundário: Ocorrências / Encomendas / Acessos Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Painel 1: Encomendas aguardando retirada */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">Encomendas Aguardando Retirada</h2>
            </div>
            <button
              onClick={() => onNavigate('portaria')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              Ver todas ({pendingDeliveries.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {pendingDeliveries.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Nenhuma encomenda pendente no momento.</p>
            ) : (
              pendingDeliveries.slice(0, 4).map((d) => (
                <div key={d.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{d.recipientName}</span>
                      <span className="text-xs text-slate-500">· {d.blockName} Apto {d.unitNumber}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Transportadora: {d.carrier}</span>
                      <span>·</span>
                      <span className="font-mono">{d.location}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                    Aguardando
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Painel 2: Visitantes e Prestadores Ativos */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">Visitantes / Prestadores no Condomínio</h2>
            </div>
            <button
              onClick={() => onNavigate('portaria')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              Ver controle ({activeVisitors.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {activeVisitors.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Nenhum visitante externo ativo no momento.</p>
            ) : (
              activeVisitors.slice(0, 4).map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{v.name}</span>
                      <span className="text-xs text-slate-500">
                        ({v.visitorType === 'prestador' ? `Prestador: ${v.company || 'Autônomo'}` : 'Visitante'})
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span>Destino: {v.blockName} Apto {v.unitNumber}</span>
                      <span>·</span>
                      <span>Doc: {v.document}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
                    No Local
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Painel 3: Comunicados Fixados e Avisos do Mural */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-700" />
            <h2 className="text-sm font-semibold text-slate-900">Comunicados Oficiais Recentes</h2>
          </div>
          <button
            onClick={() => onNavigate('comunicados')}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            Acessar Mural & Votações
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {announcements.slice(0, 2).map((a) => (
            <div key={a.id} className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-start justify-between">
                <span className="text-xs font-semibold text-slate-900 line-clamp-1">{a.title}</span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded uppercase font-mono ${
                    a.priority === 'urgente'
                      ? 'bg-rose-100 text-rose-800'
                      : a.priority === 'importante'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {a.priority}
                </span>
              </div>
              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{a.content}</p>
              <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-200/60">
                <span>Por: {a.author}</span>
                {a.pinned && <span className="font-medium text-slate-700">★ Fixado no topo</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
