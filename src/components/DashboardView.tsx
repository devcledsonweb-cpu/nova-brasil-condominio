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
  ArrowRight,
  MapPin,
  Shield,
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
    <div className="space-y-5 sm:space-y-6">
      {/* Banner Principal de Operações da Empresa */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 dark:border-slate-800/90 bg-linear-to-r from-slate-950 via-slate-900 to-blue-950 p-5 sm:p-7 md:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-bold tracking-wider uppercase text-blue-400 bg-blue-950/70 border border-blue-800/80 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs">
              Empresa de Gestão Operacional & Terceirização
            </span>
            <span className="text-slate-400 font-mono text-[11px] sm:text-xs">
              {currentCondo ? `Posto Ativo: ${currentCondo.name}` : `Rede com ${condominiums.length} condomínios atendidos`}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            {currentCondo
              ? `Operação: ${currentCondo.name}`
              : 'Centro de Controle Operacional de Condomínios'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Gestão integrada da empresa: controle dos agentes de portaria nos postos, veículos de ronda motorizada,
            materiais e equipamentos da empresa alocados, e ordens de manutenção predial executadas.
          </p>

          {/* Botões Rápidos de Ação */}
          <div className="pt-2 sm:pt-3 flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate('agentes')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Agentes</span>
            </button>

            <button
              onClick={() => onNavigate('ronda')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              <Bike className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Rondas</span>
            </button>

            <button
              onClick={() => onNavigate('patrimonio')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Package className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Patrimônio</span>
            </button>

            <button
              onClick={() => onNavigate('manutencoes')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Wrench className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Manutenções</span>
            </button>

            <button
              onClick={() => onNavigate('condominios')}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 sm:py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Postos</span>
            </button>
          </div>
        </div>

        {/* Marca d'água discreta de segurança */}
        <div className="absolute right-4 bottom-2 opacity-10 pointer-events-none hidden md:block">
          <Shield className="w-56 h-56 text-white" />
        </div>
      </div>

      {/* Grid de KPIs Operacionais */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        {/* Postos Atendidos */}
        <div
          onClick={() => onNavigate('condominios')}
          className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] sm:text-xs font-medium">Condomínios</span>
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {stats?.totalCondos ?? condominiums.length}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">Postos atendidos</p>
        </div>

        {/* Agentes de Portaria */}
        <div
          onClick={() => onNavigate('agentes')}
          className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] sm:text-xs font-medium">Agentes</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {filteredAgents.length}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
              ({agentsOnDuty} ativos)
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">Equipe nos postos</p>
        </div>

        {/* Veículos de Ronda */}
        <div
          onClick={() => onNavigate('ronda')}
          className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] sm:text-xs font-medium">Rondas</span>
            <Bike className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
              {filteredVehicles.length}
            </span>
            <span className="text-[10px] sm:text-xs font-semibold text-amber-600 dark:text-amber-400 truncate">
              ({vehiclesOnPatrol} ativas)
            </span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">Motos e carros</p>
        </div>

        {/* Materiais da Empresa */}
        <div
          onClick={() => onNavigate('patrimonio')}
          className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-500 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] sm:text-xs font-medium">Patrimônio</span>
            <Package className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {filteredAssets.reduce((acc, a) => acc + (a.quantity || 1), 0)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">Itens alocados</p>
        </div>

        {/* Manutenções em Aberto */}
        <div
          onClick={() => onNavigate('manutencoes')}
          className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-500 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] sm:text-xs font-medium">Manutenções</span>
            <Wrench className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-xl sm:text-2xl font-bold font-mono text-amber-600 dark:text-amber-400">
              {pendingMaintenances}
            </span>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">abertas</span>
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">O.S. em andamento</p>
        </div>

        {/* Ocorrências do Dia */}
        <div
          onClick={() => onNavigate('ocorrencias')}
          className="p-3.5 sm:p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-500 transition-all cursor-pointer shadow-xs group"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-[11px] sm:text-xs font-medium">Ocorrências</span>
            <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
            {filteredLogs.length}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">Livro de turnos</p>
        </div>
      </div>

      {/* Grid com 2 Colunas: Status dos Postos e Rondas/Ocorrências Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
        {/* Coluna 1 & 2: Visão Geral dos Postos Atendidos */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Condomínios Atendidos & Cobertura Operacional
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Status de agentes, viaturas de ronda e manutenções em cada condomínio cliente.
                </p>
              </div>
              <button
                onClick={() => onNavigate('condominios')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Todos</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {condominiums.length === 0 ? (
              <div className="p-8 text-center text-slate-500 dark:text-slate-400 text-xs">
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
                      className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Building2 className="w-4 h-4 text-slate-700 dark:text-slate-300 shrink-0" />
                          <h3 className="font-bold text-slate-900 dark:text-white text-sm truncate">{condo.name}</h3>
                          <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                            {condo.contractType || 'Portaria 24h'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5 flex-wrap">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{condo.city ? `${condo.city} - ${condo.state}` : condo.address || 'Endereço em cadastro'}</span>
                          {condo.supervisorName && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span>Supervisor: <strong>{condo.supervisorName}</strong></span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs shrink-0 flex-wrap">
                        <button
                          onClick={() => onNavigate('agentes')}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-blue-400 font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-xs"
                        >
                          <span className="font-bold text-blue-600 dark:text-blue-400">{condoAgents.length}</span> Agentes
                        </button>
                        <button
                          onClick={() => onNavigate('ronda')}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-amber-400 font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-xs"
                        >
                          <span className="font-bold text-amber-600 dark:text-amber-400">{condoVehicles.length}</span> Rondas
                        </button>
                        <button
                          onClick={() => onNavigate('patrimonio')}
                          className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer text-xs"
                        >
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{condoAssets.length}</span> Materiais
                        </button>
                        {condoMaintenances.length > 0 && (
                          <button
                            onClick={() => onNavigate('manutencoes')}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 font-semibold text-amber-800 dark:text-amber-300 transition-colors cursor-pointer text-xs"
                          >
                            {condoMaintenances.length} O.S.
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
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <div>
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  Próximas Manutenções Programadas
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Serviços prediais e técnicos agendados pela empresa nos condomínios.
                </p>
              </div>
              <button
                onClick={() => onNavigate('manutencoes')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Todas</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {filteredMaintenances.length === 0 ? (
              <div className="p-6 text-center text-slate-500 dark:text-slate-400 text-xs">
                Nenhuma manutenção pendente no momento.
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredMaintenances.slice(0, 4).map((m) => (
                  <div
                    key={m.id}
                    className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/30 hover:border-slate-200 dark:hover:border-slate-700 flex items-center justify-between text-xs gap-2"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                      <div className="p-2 bg-amber-50 dark:bg-amber-950/60 rounded-lg text-amber-700 dark:text-amber-400 shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 dark:text-white truncate">{m.title}</h4>
                        <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5 truncate">
                          {m.condoName || 'Posto Geral'} · Técnico: {m.technicianName}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="font-mono font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                        {m.scheduledDate}
                      </span>
                      <p className="text-[10px] sm:text-[11px] text-amber-700 dark:text-amber-400 font-semibold mt-1 capitalize">
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
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Bike className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Rondas em Andamento</span>
              </h3>
              <button
                onClick={() => onNavigate('ronda')}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Ver Frota
              </button>
            </div>

            {filteredVehicles.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-xs text-center py-4">Nenhum veículo cadastrado.</p>
            ) : (
              <div className="space-y-2.5">
                {filteredVehicles.slice(0, 4).map((v) => (
                  <div
                    key={v.id}
                    className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold bg-slate-900 dark:bg-slate-700 text-white px-1.5 py-0.5 rounded text-[10px]">
                          {v.plate}
                        </span>
                        <span className="font-semibold text-slate-900 dark:text-white truncate">{v.model}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                        {v.condoName || 'Posto Geral'} · {v.driverName ? `Rondante: ${v.driverName}` : 'Sem condutor'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      {v.status === 'em_ronda' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Em Ronda
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium capitalize">
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
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-xs transition-colors">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Últimas Ocorrências</span>
              </h3>
              <button
                onClick={() => onNavigate('ocorrencias')}
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
              >
                Abrir Livro
              </button>
            </div>

            {filteredLogs.length === 0 ? (
              <p className="text-slate-400 dark:text-slate-500 text-xs text-center py-4">Nenhuma ocorrência registrada hoje.</p>
            ) : (
              <div className="space-y-3">
                {filteredLogs.slice(0, 4).map((l) => (
                  <div key={l.id} className="text-xs border-b border-slate-100 dark:border-slate-800/80 last:border-0 pb-2.5 last:pb-0">
                    <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-[11px]">
                      <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[170px]">{l.condoName || 'Posto Geral'}</span>
                      <span className="font-mono">{l.logTime}</span>
                    </div>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1">{l.title}</p>
                    <p className="text-slate-600 dark:text-slate-400 line-clamp-2 mt-0.5">{l.description}</p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">Registrado por: {l.agentName}</p>
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
