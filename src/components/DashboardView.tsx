import React from 'react';
import { DashboardStats, Announcement, Delivery, AccessLog, Condominium } from '../types/index.ts';
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
  Layers,
  MapPin,
  Clock,
  CheckCircle,
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  announcements: Announcement[];
  pendingDeliveries: Delivery[];
  activeVisitors: AccessLog[];
  condominiums?: Condominium[];
  selectedCondoId?: number | 'all';
  onNavigate: (tab: string) => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  announcements,
  pendingDeliveries,
  activeVisitors,
  condominiums = [],
  selectedCondoId = 'all',
  onNavigate,
}) => {
  const { role } = useAuth();

  const currentCondo =
    selectedCondoId === 'all'
      ? null
      : condominiums.find((c) => c.id === selectedCondoId);

  return (
    <div className="space-y-6">
      {/* Banner de Boas-vindas com Estilo Arquitetônico Limpo */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 p-6 text-white shadow-xs">
        <div className="relative z-10 max-w-2xl space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <span className="font-semibold text-white">
              {currentCondo ? currentCondo.name : 'NOVA BRASIL — Gestão Multi-Condomínio'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{currentCondo?.city ? `${currentCondo.city}, ${currentCondo.state}` : 'Visão Corporativa Global'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-400">
              {role === 'sindico' ? 'Gestão Síndico' : 'Operação Portaria'}
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {role === 'sindico'
              ? currentCondo
                ? `Painel de Controle: ${currentCondo.name}`
                : 'Centro de Controle e Gestão Multi-Condomínio'
              : 'Estação Operacional da Portaria'}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            {role === 'sindico'
              ? currentCondo
                ? 'Monitore blocos, unidades, moradores, veículos, portaria e reservas deste condomínio.'
                : 'Gerencie múltiplos condomínios simultaneamente, alterne entre eles a qualquer momento ou cadastre novos empreendimentos.'
              : 'Gerencie o fluxo de visitantes, prestadores de serviços, recepção de encomendas e identificação veicular.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {role === 'sindico' && (
              <button
                onClick={() => onNavigate('condominios')}
                className="px-4 py-2 text-xs font-semibold bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Building2 className="w-3.5 h-3.5" />
                Gerenciar Condomínios ({condominiums.length})
              </button>
            )}
            <button
              onClick={() => onNavigate('portaria')}
              className="px-4 py-2 text-xs font-medium border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5" />
              Controle de Portaria
            </button>
            <button
              onClick={() => onNavigate('estrutura')}
              className="px-4 py-2 text-xs font-medium border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-white rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              Estrutura & Unidades
            </button>
          </div>
        </div>

        {/* Fundo geométrico arquitetônico */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-10 pointer-events-none flex items-center justify-center pr-6">
          <Building2 className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Grid de Métricas Principais (Tabular Figures) */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {selectedCondoId === 'all' && (
          <div
            onClick={() => onNavigate('condominios')}
            className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
          >
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium">Condomínios</span>
              <Building2 className="w-4 h-4 text-slate-900" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {stats?.totalCondos ?? condominiums.length}
              </span>
              <span className="text-xs text-slate-500">sob gestão</span>
            </div>
          </div>
        )}

        <div
          onClick={() => onNavigate('estrutura')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Unidades & Blocos</span>
            <Layers className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
              {stats?.totalUnits ?? 0}
            </span>
            <span className="text-xs text-slate-500">aptos em {stats?.totalBlocks ?? 0} blocos</span>
          </div>
        </div>

        <div
          onClick={() => onNavigate('moradores')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-slate-300 transition-all cursor-pointer shadow-xs"
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-medium">Moradores Ativos</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-emerald-700">
              {stats?.totalResidents ?? 0}
            </span>
            <span className="text-xs text-slate-500">cadastrados</span>
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

      {/* Grid Secundário: Encomendas e Acessos Recentes */}
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
                      {d.condoName && selectedCondoId === 'all' && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                          {d.condoName}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {d.carrier} • Cód: {d.trackingCode || 'Sem rastreio'} • Local: {d.location}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    Aguardando
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Painel 2: Visitantes e Prestadores no momento */}
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-slate-700" />
              <h2 className="text-sm font-semibold text-slate-900">Acessos Ativos no Condomínio</h2>
            </div>
            <button
              onClick={() => onNavigate('portaria')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
            >
              Portaria ({activeVisitors.length})
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {activeVisitors.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">Nenhum visitante ativo registrado no momento.</p>
            ) : (
              activeVisitors.slice(0, 4).map((v) => (
                <div key={v.id} className="py-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-900">{v.name}</span>
                      <span className="text-xs text-slate-500">· Destino: {v.blockName} {v.unitNumber}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {v.visitorType === 'prestador' ? `Empresa: ${v.company || 'Autônomo'}` : 'Visitante'} • Doc: {v.document}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-800 border border-blue-200">
                    No interior
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Painel 3: Mural de Avisos e Comunicados Oficiais */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900">Mural de Comunicados Oficiais</h2>
          <button
            onClick={() => onNavigate('comunicados')}
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
          >
            Ver mural completo
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {announcements.slice(0, 3).map((a) => (
            <div key={a.id} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    a.priority === 'urgente'
                      ? 'bg-rose-100 text-rose-800'
                      : a.priority === 'importante'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {a.priority}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(a.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-900 line-clamp-1">{a.title}</h3>
              <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{a.content}</p>
            </div>
          ))}

          {announcements.length === 0 && (
            <p className="col-span-full text-xs text-slate-400 py-4 text-center">
              Nenhum comunicado oficial publicado no momento.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
