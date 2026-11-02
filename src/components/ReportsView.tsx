import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  FileDown,
  Building2,
  Calendar,
  FileText,
  Wrench,
  CalendarDays,
  Package,
  Bike,
  ShieldCheck,
  CheckCircle2,
  Download,
  Printer,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
} from 'lucide-react';
import {
  Condominium,
  OperationalLog,
  MaintenanceOrder,
  ShiftCoverage,
  CompanyAsset,
  PatrolVehicle,
  SecurityAgent,
} from '../types/index.ts';
import {
  exportOperationalLogsPDF,
  exportMaintenancesPDF,
  exportShiftScalePDF,
  exportAssetsPDF,
  exportPatrolVehiclesPDF,
} from '../utils/pdfExport.ts';

interface ReportsViewProps {
  condominiums: Condominium[];
  logs: OperationalLog[];
  maintenances: MaintenanceOrder[];
  coverages: ShiftCoverage[];
  assets: CompanyAsset[];
  vehicles: PatrolVehicle[];
  agents: SecurityAgent[];
  selectedCondoId: number | 'all';
  onSelectCondo?: (id: number | 'all') => void;
  onNavigateToTab?: (tab: string) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  condominiums,
  logs,
  maintenances,
  coverages,
  assets,
  vehicles,
  agents,
  selectedCondoId,
  onSelectCondo,
  onNavigateToTab,
}) => {
  const { user, role } = useAuth();
  const [periodFilter, setPeriodFilter] = useState<'all' | '7d' | '30d' | 'month'>('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const selectedCondo = condominiums.find((c) => c.id === selectedCondoId);
  const condoNameLabel = selectedCondo ? selectedCondo.name : 'Todos os Condomínios e Postos';

  // Filtros aplicados aos dados
  const filteredLogs = logs.filter((l) => (selectedCondoId === 'all' ? true : l.condoId === selectedCondoId));
  const filteredMaintenances = maintenances.filter((m) =>
    selectedCondoId === 'all' ? true : m.condoId === selectedCondoId
  );
  const filteredCoverages = coverages.filter((c) =>
    selectedCondoId === 'all' ? true : c.condoId === selectedCondoId
  );
  const filteredAssets = assets.filter((a) => (selectedCondoId === 'all' ? true : a.condoId === selectedCondoId));
  const filteredVehicles = vehicles.filter((v) =>
    selectedCondoId === 'all' ? true : v.condoId === selectedCondoId
  );

  const metaInfo = {
    condoName: condoNameLabel,
    generatedBy: user?.name || 'Gestor Operacional',
    roleLabel:
      role === 'sindico' || role === 'admin'
        ? 'Gestor Geral da Empresa'
        : role === 'supervisor'
        ? 'Supervisor de Área'
        : 'Agente de Portaria',
  };

  const triggerDownload = (id: string, action: () => void) => {
    setDownloadingId(id);
    setTimeout(() => {
      try {
        action();
      } catch (err) {
        console.error('Erro ao gerar relatório em PDF:', err);
      } finally {
        setDownloadingId(null);
      }
    }, 250);
  };

  // Exportar todos os relatórios em lote
  const handleExportAll = () => {
    setDownloadingId('all_bundle');
    setTimeout(() => {
      try {
        exportOperationalLogsPDF(filteredLogs, metaInfo);
        setTimeout(() => exportMaintenancesPDF(filteredMaintenances, metaInfo), 500);
        setTimeout(() => exportShiftScalePDF(filteredCoverages, agents, metaInfo), 1000);
        setTimeout(() => exportAssetsPDF(filteredAssets, metaInfo), 1500);
      } finally {
        setDownloadingId(null);
      }
    }, 200);
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal da Central de Relatórios */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-linear-to-r from-slate-950 via-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-md">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold tracking-wider uppercase text-blue-400 bg-blue-950/70 border border-blue-800/80 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs flex items-center gap-1.5">
              <FileDown className="w-3.5 h-3.5" />
              Central de Exportação de Documentos
            </span>
            <span className="text-slate-400 font-mono text-[11px] sm:text-xs">
              Formato Oficial PDF para Download
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
            Central de Relatórios & Documentos
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            Gere e exporte relatórios consolidados em formato PDF de todas as operações nos condomínios:
            livro de ocorrências com conferência de passagem de turno, manutenções prediais, escalas 12x36
            com coberturas de faltas, controle de materiais em cautela e rondas motorizadas.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              onClick={handleExportAll}
              disabled={downloadingId !== null}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>{downloadingId === 'all_bundle' ? 'Gerando Pacote...' : 'Exportar Pacote Operacional Completo'}</span>
            </button>
            <span className="text-[11px] text-slate-400">
              Posto selecionado: <strong className="text-white">{condoNameLabel}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Barra de Filtro de Condomínio e Período */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Posto:</span>
            {onSelectCondo && (
              <select
                value={selectedCondoId === 'all' ? 'all' : String(selectedCondoId)}
                onChange={(e) => {
                  const val = e.target.value;
                  onSelectCondo(val === 'all' ? 'all' : Number(val));
                }}
                className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-hidden cursor-pointer"
              >
                <option value="all">🏢 Todos os Condomínios (Consolidado)</option>
                {condominiums.map((c) => (
                  <option key={c.id} value={c.id}>
                    📍 {c.name} {c.city ? `(${c.city})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-lg">
          <button
            onClick={() => setPeriodFilter('all')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
              periodFilter === 'all'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Histórico Total
          </button>
          <button
            onClick={() => setPeriodFilter('month')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
              periodFilter === 'month'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Mês Vigente
          </button>
          <button
            onClick={() => setPeriodFilter('7d')}
            className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
              periodFilter === '7d'
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs font-bold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Últimos 7 dias
          </button>
        </div>
      </div>

      {/* Métricas Rápidas dos Documentos Disponíveis */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Ocorrências & Turnos</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{filteredLogs.length}</p>
          <p className="text-[10px] text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1 font-semibold">
            <CheckCircle2 className="w-3 h-3" />
            Com aceite de turno
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Ordens de Serviço (O.S.)</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{filteredMaintenances.length}</p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1 font-semibold">
            <Wrench className="w-3 h-3" />
            Manutenções Prediais
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Controle de Escala 12x36</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{filteredCoverages.length}</p>
          <p className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-1 flex items-center gap-1 font-semibold">
            <CalendarDays className="w-3 h-3" />
            Faltas & Coberturas
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Itens de Patrimônio</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{filteredAssets.length}</p>
          <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1 font-semibold">
            <Package className="w-3 h-3" />
            Rádios HT & Bastões
          </p>
        </div>
      </div>

      {/* Grid de Cards de Download de PDF */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. Livro de Ocorrências & Turno */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-600 transition-all">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Livro de Ocorrências & Passagens de Turno
                  </h3>
                  <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                    Operação de Portaria & Segurança
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {filteredLogs.length} reg.
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Relatório operacional oficial contendo a descrição das passagens de turno, confirmação de aceite
              do agente entrante (com conferência de rádios, chaves e claviculário), ocorrências por gravidade e providências adotadas.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Passagens de Turno Aceitas:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {filteredLogs.filter((l) => l.incomingAgentAccepted).length}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Aguardando Aceite:</span>
                <span className="font-bold text-amber-600 dark:text-amber-400">
                  {filteredLogs.filter((l) => l.logType === 'passagem_turno' && !l.incomingAgentAccepted).length}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('ocorrencias')}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Ver módulo</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() =>
                triggerDownload('logs', () => exportOperationalLogsPDF(filteredLogs, metaInfo))
              }
              disabled={downloadingId !== null}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 ml-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingId === 'logs' ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>
          </div>
        </div>

        {/* 2. Ordens de Serviço & Manutenções */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-all">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Dossiê de Manutenções & Ordens de Serviço
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Facilities & Manutenção Predial
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {filteredMaintenances.length} O.S.
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Relatório de intervenções preventivas e corretivas executadas nos portões, CFTV, interfonia, geradores
              e iluminação. Inclui discriminação de técnicos, custos e peças aplicadas.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Manutenções Concluídas:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {filteredMaintenances.filter((m) => m.status === 'concluida').length}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Preventivas vs Corretivas:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {filteredMaintenances.filter((m) => m.maintenanceType === 'preventiva').length} /{' '}
                  {filteredMaintenances.filter((m) => m.maintenanceType === 'corretiva').length}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('manutencoes')}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Ver módulo</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() =>
                triggerDownload('maintenances', () =>
                  exportMaintenancesPDF(filteredMaintenances, metaInfo)
                )
              }
              disabled={downloadingId !== null}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 ml-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingId === 'maintenances' ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>
          </div>
        </div>

        {/* 3. Escala 12x36 & Faltas e Coberturas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-indigo-400 dark:hover:border-indigo-600 transition-all">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Escala 12x36 & Faltas / Coberturas
                  </h3>
                  <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Controle de Efetivo & Plantão
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {filteredCoverages.length} reg.
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Relatório para controle de faltas, atestados médicos com CID, folgas e alocações de folguistas/substitutos
              nos postos de portaria e ronda, comprovando cobertura integral do condomínio.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Postos com Cobertura Concluída:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {filteredCoverages.filter((c) => c.coverageStatus === 'coberto').length}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Postos Descobertos / Pendentes:</span>
                <span className="font-bold text-rose-600 dark:text-rose-400">
                  {filteredCoverages.filter((c) => c.coverageStatus === 'descoberto').length}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('escalas')}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Ver módulo</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() =>
                triggerDownload('scales', () => exportShiftScalePDF(filteredCoverages, agents, metaInfo))
              }
              disabled={downloadingId !== null}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 ml-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingId === 'scales' ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>
          </div>
        </div>

        {/* 4. Inventário de Materiais & Cautelas */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-600 transition-all">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Inventário de Materiais & Cautelas
                  </h3>
                  <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Controle de Patrimônio no Posto
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {filteredAssets.length} itens
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Relatório de conferência de bens da empresa alocados na portaria: rádios comunicadores HT,
              bastões eletrônicos de ronda, maletas de ferramentas e termo de cautela do agente responsável.
            </p>

            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-700/60 text-[11px] space-y-1">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Materiais com Cautela Ativa:</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">
                  {filteredAssets.filter((a) => a.inUseWithAgentName).length}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Disponíveis na Guarita:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {filteredAssets.filter((a) => !a.inUseWithAgentName).length}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('patrimonio')}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Ver módulo</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => triggerDownload('assets', () => exportAssetsPDF(filteredAssets, metaInfo))}
              disabled={downloadingId !== null}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 ml-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingId === 'assets' ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>
          </div>
        </div>

        {/* 5. Boletim de Frotas de Ronda & Checklists */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-600 transition-all md:col-span-2">
          <div className="space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Bike className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                    Boletim de Frotas de Ronda & Checklists Operacionais
                  </h3>
                  <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Vigilância Motorizada & Viaturas
                  </span>
                </div>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                {filteredVehicles.length} veículos
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Demonstrativo das motocicletas e viaturas de ronda alocadas no posto: odômetro de assunção/devolução de serviço,
              nível de combustível, condutor responsável no plantão e checklist de integridade mecânica.
            </p>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            {onNavigateToTab && (
              <button
                onClick={() => onNavigateToTab('ronda')}
                className="text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
              >
                <span>Ver módulo</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
            <button
              onClick={() => triggerDownload('vehicles', () => exportPatrolVehiclesPDF(filteredVehicles, metaInfo))}
              disabled={downloadingId !== null}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50 ml-auto"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloadingId === 'vehicles' ? 'Gerando...' : 'Baixar PDF'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Nota de Autenticidade dos Documentos */}
      <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
        <Info className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Os relatórios exportados em formato PDF possuem valor comprobatório de prestação de serviços perante síndicos,
          administradoras de condomínios e auditorias trabalhistas. Incluem numeração sequencial de páginas,
          data/hora de geração e carimbo de identificação do emissor registrado.
        </p>
      </div>
    </div>
  );
};
