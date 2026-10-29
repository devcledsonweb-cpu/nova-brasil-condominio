import React from 'react';
import {
  DashboardStats,
  Condominium,
  SecurityAgent,
  PatrolVehicle,
  CompanyAsset,
  MaintenanceOrder,
  OperationalLog,
} from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Building2,
  ShieldCheck,
  Bike,
  Package,
  Wrench,
  FileText,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Radio,
  UserCheck,
  Gauge,
  MapPin,
  Shield,
  Layers,
} from 'lucide-react';

interface DashboardViewProps {
  stats: DashboardStats | null;
  condominiums: Condominium[];
  agents: SecurityAgent[];
  patrolVehicles: PatrolVehicle[];
  companyAssets: CompanyAsset[];
  maintenances: MaintenanceOrder[];
  operationalLogs: OperationalLog[];
  selectedCondoId: number | 'all';
  onNavigate: (tab: string) => void;
  onRefresh: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  condominiums = [],
  agents = [],
  patrolVehicles = [],
  companyAssets = [],
  maintenances = [],
  operationalLogs = [],
  selectedCondoId = 'all',
  onNavigate,
}) => {
  const { user } = useAuth();

  const currentCondo =
    selectedCondoId === 'all'
      ? null
      : condominiums.find((c) => c.id === selectedCondoId);

  // Filtros conforme seleção global de condomínio
  const filteredAgents =
    selectedCondoId === 'all'
      ? agents
      : agents.filter((a) => a.condoId === selectedCondoId);

  const filteredVehicles =
    selectedCondoId === 'all'
      ? patrolVehicles
      : patrolVehicles.filter((v) => v.condoId === selectedCondoId);

  const filteredAssets =
    selectedCondoId === 'all'
      ? companyAssets
      : companyAssets.filter((a) => a.condoId === selectedCondoId);

  const filteredMaintenances =
    selectedCondoId === 'all'
      ? maintenances
      : maintenances.filter((m) => m.condoId === selectedCondoId);

  const filteredLogs =
    selectedCondoId === 'all'
      ? operationalLogs
      : operationalLogs.filter((l) => l.condoId === selectedCondoId);

  const agentsOnDuty = filteredAgents.filter((a) => a.status === 'em_servico').length;
  const vehiclesOnPatrol = filteredVehicles.filter((v) => v.status === 'em_ronda').length;
  const pendingMaintenances = filteredMaintenances.filter(
    (m) => m.status === 'agendada' || m.status === 'em_andamento' || m.status === 'aguardando_peca'
  ).length;

  return (
    <div className="space-y-6">
      {/* Banner Principal de Operações da Empresa */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-linear-to-r from-slate-950 via-slate-900 to-blue-950 p-6 md:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold tracking-wider uppercase text-blue-400 bg-blue-950/70 border border-blue-800/80 px-2.5 py-0.5 rounded-full">
              Empresa de Gestão Operacional & Terceirização
            </span>
            <span className="text-slate-400 font-mono">
              {currentCondo ? `Posto Ativo: ${currentCondo.name}` : `Rede com ${condominiums.length} condomínios atendidos`}
            </span>
          </div>

          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
            {currentCondo
              ? `Operação: ${currentCondo.name}`
              : 'Centro de Controle Operacional de Condomínios'}
          </h1>

          <p className="text-sm text-slate-300 leading-relaxed max-w-2xl">
            Gestão integrada da empresa: controle dos agentes de portaria nos postos, veículos de ronda motorizada,
            materiais e equipamentos da empresa alocados, e ordens de manutenção predial executadas.
          </p>

          {/* Botões Rápidos de Ação */}
          <div className="pt-3 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigate('agentes')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Agentes de Portaria</span>
            </button>

            <button
              onClick={() => onNavigate('ronda')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Bike className="w-4 h-4" />
              <span>Veículos de Ronda</span>
            </button>

            <button
              onClick={() => onNavigate('patrimonio')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Package className="w-4 h-4" />
              <span>Materiais no Posto</span>
            </button>

            <button
              onClick={() => onNavigate('manutencoes')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Wrench className="w-4 h-4" />
              <span>Manutenções & O.S.</span>
            </button>

            <button
              onClick={() => onNavigate('condominios')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>Postos / Condomínios</span>
            </button>
          </div>
        </div>

        {/* Marca d'água discreta de segurança */}
        <div className="absolute right-4 bottom-2 opacity-10 pointer-events-none hidden md:block">
          <Shield className="w-56 h-56 text-white" />
        </div>
      </div>

      {/* Grid de KPIs Operacionais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Postos Atendidos */}
        <div
          onClick={() => onNavigate('condominios')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Condomínios</span>
            <Building2 className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {stats?.totalCondos ?? condominiums.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Postos sob contrato</p>
        </div>

        {/* Agentes de Portaria */}
        <div
          onClick={() => onNavigate('agentes')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Agentes Portaria</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {filteredAgents.length}
            </span>
            <span className="text-xs font-semibold text-emerald-700">
              ({agentsOnDuty} em serviço)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Equipe nos postos</p>
        </div>

        {/* Veículos de Ronda */}
        <div
          onClick={() => onNavigate('ronda')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-amber-400 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Frota de Ronda</span>
            <Bike className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-slate-900">
              {filteredVehicles.length}
            </span>
            <span className="text-xs font-semibold text-amber-700">
              ({vehiclesOnPatrol} ativas)
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Motos e carros</p>
        </div>

        {/* Materiais da Empresa */}
        <div
          onClick={() => onNavigate('patrimonio')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Patrimônio / HTs</span>
            <Package className="w-4 h-4 text-indigo-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {filteredAssets.reduce((acc, a) => acc + (a.quantity || 1), 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Itens alocados</p>
        </div>

        {/* Manutenções em Aberto */}
        <div
          onClick={() => onNavigate('manutencoes')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-rose-400 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Manutenções</span>
            <Wrench className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-amber-700">
              {pendingMaintenances}
            </span>
            <span className="text-xs text-slate-500">abertas</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">O.S. em andamento</p>
        </div>

        {/* Ocorrências do Dia */}
        <div
          onClick={() => onNavigate('ocorrencias')}
          className="p-4 rounded-xl bg-white border border-slate-200 hover:border-blue-400 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-xs font-medium">Ocorrências / Turnos</span>
            <FileText className="w-4 h-4 text-blue-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-900">
            {filteredLogs.length}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Registros de guarita</p>
        </div>
      </div>

      {/* Grid com 2 Colunas: Status dos Postos e Rondas/Ocorrências Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna 1 & 2: Visão Geral dos Postos Atendidos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Condomínios Atendidos & Cobertura Operacional
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Status de agentes, viaturas de ronda e manutenções em cada condomínio cliente.
                </p>
              </div>
              <button
                onClick={() => onNavigate('condominios')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {condominiums.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                Nenhum condomínio cadastrado na empresa ainda.
              </div>
            ) : (
              <div className="space-y-3">
                {condominiums.slice(0, 5).map((condo) => {
                  const condoAgents = agents.filter((a) => a.condoId === condo.id);
                  const condoVehicles = patrolVehicles.filter((v) => v.condoId === condo.id);
                  const condoAssets = companyAssets.filter((a) => a.condoId === condo.id);
                  const condoMaintenances = maintenances.filter(
                    (m) => m.condoId === condo.id && m.status !== 'concluida' && m.status !== 'cancelada'
                  );

                  return (
                    <div
                      key={condo.id}
                      className="p-3.5 rounded-xl border border-slate-100 hover:border-slate-300 bg-slate-50/50 hover:bg-slate-50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-700" />
                          <h3 className="font-bold text-slate-900 text-sm">{condo.name}</h3>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {condo.contractType || 'Portaria 24h'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{condo.city ? `${condo.city} - ${condo.state}` : condo.address || 'Endereço em cadastro'}</span>
                          {condo.supervisorName && (
                            <>
                              <span>·</span>
                              <span>Supervisor: <strong>{condo.supervisorName}</strong></span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 text-xs shrink-0 flex-wrap">
                        <button
                          onClick={() => onNavigate('agentes')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-blue-400 font-medium text-slate-700 transition-colors cursor-pointer"
                        >
                          <span className="font-bold text-blue-600">{condoAgents.length}</span> Agentes
                        </button>
                        <button
                          onClick={() => onNavigate('ronda')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-amber-400 font-medium text-slate-700 transition-colors cursor-pointer"
                        >
                          <span className="font-bold text-amber-600">{condoVehicles.length}</span> Rondas
                        </button>
                        <button
                          onClick={() => onNavigate('patrimonio')}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 font-medium text-slate-700 transition-colors cursor-pointer"
                        >
                          <span className="font-bold text-indigo-600">{condoAssets.length}</span> Materiais
                        </button>
                        {condoMaintenances.length > 0 && (
                          <button
                            onClick={() => onNavigate('manutencoes')}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 font-semibold text-amber-800 transition-colors cursor-pointer"
                          >
                            {condoMaintenances.length} O.S. Aberta
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Manutenções em Destaque */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  Próximas Manutenções Programadas
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Serviços prediais e técnicos agendados pela empresa nos condomínios.
                </p>
              </div>
              <button
                onClick={() => onNavigate('manutencoes')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {filteredMaintenances.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                Nenhuma manutenção pendente no momento.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredMaintenances.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-200 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-amber-50 rounded-lg text-amber-700 shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{m.title}</h4>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          {m.condoName || 'Posto Geral'} · Técnico: {m.technicianName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        {m.scheduledDate}
                      </span>
                      <p className="text-[11px] text-amber-700 font-semibold mt-1 capitalize">
                        {m.status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Coluna 3: Feed de Rondas & Ocorrências em Tempo Real */}
        <div className="space-y-4">
          {/* Veículos em Ronda no Momento */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Bike className="w-4 h-4 text-amber-600" />
                <span>Rondas em Andamento</span>
              </h3>
              <button
                onClick={() => onNavigate('ronda')}
                className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Gerenciar Frota
              </button>
            </div>

            {filteredVehicles.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-4">Nenhum veículo cadastrado.</p>
            ) : (
              <div className="space-y-2.5">
                {filteredVehicles.slice(0, 4).map((v) => (
                  <div
                    key={v.id}
                    className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold bg-slate-900 text-white px-1.5 py-0.5 rounded text-[10px]">
                          {v.plate}
                        </span>
                        <span className="font-semibold text-slate-900">{v.model}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        {v.condoName || 'Posto Geral'} · {v.driverName ? `Rondante: ${v.driverName}` : 'Sem condutor'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {v.status === 'em_ronda' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Em Ronda
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-medium capitalize">
                          {v.status}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Últimos Registros do Livro de Ocorrências */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>Últimas Ocorrências / Turnos</span>
              </h3>
              <button
                onClick={() => onNavigate('ocorrencias')}
                className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
              >
                Abrir Livro
              </button>
            </div>

            {filteredLogs.length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-4">Nenhuma ocorrência registrada hoje.</p>
            ) : (
              <div className="space-y-3">
                {filteredLogs.slice(0, 4).map((l) => (
                  <div key={l.id} className="text-xs border-b border-slate-100 last:border-0 pb-2.5 last:pb-0">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="font-semibold text-slate-900">{l.condoName || 'Posto Geral'}</span>
                      <span className="font-mono">{l.logTime}</span>
                    </div>
                    <p className="font-semibold text-slate-800 mt-1">{l.title}</p>
                    <p className="text-slate-600 line-clamp-2 mt-0.5">{l.description}</p>
                    <p className="text-[10px] text-slate-400 mt-1">Registrado por: {l.agentName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
