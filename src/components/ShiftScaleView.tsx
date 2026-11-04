import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  CalendarDays,
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  Clock,
  UserCheck,
  UserX,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  X,
  ShieldCheck,
  Download,
  Users,
  Zap,
  FileText,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Eye,
} from 'lucide-react';
import {
  ShiftCoverage,
  Condominium,
  SecurityAgent,
  ServiceStation,
} from '../types/index.ts';
import { exportShiftScalePDF } from '../utils/pdfExport.ts';
import { WhatsAppButton } from './WhatsAppButton.tsx';

interface ShiftScaleViewProps {
  coverages: ShiftCoverage[];
  condominiums: Condominium[];
  agents: SecurityAgent[];
  selectedCondoId: number | 'all';
  onAddCoverage: (coverage: Omit<ShiftCoverage, 'id' | 'createdAt'>) => Promise<boolean>;
  onUpdateCoverage: (id: number, patch: Partial<ShiftCoverage>) => Promise<boolean>;
  onDeleteCoverage: (id: number) => Promise<boolean>;
  onSelectCondo?: (id: number | 'all') => void;
}

export const ShiftScaleView: React.FC<ShiftScaleViewProps> = ({
  coverages,
  condominiums,
  agents,
  selectedCondoId,
  onAddCoverage,
  onUpdateCoverage,
  onDeleteCoverage,
  onSelectCondo,
}) => {
  const { user, role } = useAuth();
  const isManager = role === 'sindico' || role === 'admin' || role === 'supervisor';

  const [activeShiftFilter, setActiveShiftFilter] = useState<'12x36_dia' | '12x36_noite'>('12x36_dia');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'calendario' | 'postos' | 'ocorrencias'>('calendario');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedCalendarDay, setSelectedCalendarDay] = useState<Date | null>(null);

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleCurrentMonth = () => {
    setCurrentMonth(new Date());
  };

  const formatBRDate = (d: Date): string => {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const normalizeDateStr = (dateStr?: string): string => {
    if (!dateStr) return '';
    if (dateStr.includes('/')) return dateStr;
    if (dateStr.includes('-')) {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
      }
    }
    return dateStr;
  };

  const [selectedRecordToCover, setSelectedRecordToCover] = useState<ShiftCoverage | null>(null);

  // Form State: Registro de Falta / Afastamento
  const [condoId, setCondoId] = useState<number | ''>(
    selectedCondoId !== 'all' ? selectedCondoId : (condominiums[0]?.id || '')
  );
  const [stationName, setStationName] = useState('Portaria Principal (Social)');
  const [scheduledAgentName, setScheduledAgentName] = useState('');
  const [scheduledAgentId, setScheduledAgentId] = useState<number | ''>('');
  const [date, setDate] = useState(new Date().toLocaleDateString('pt-BR'));
  const [shiftType, setShiftType] = useState<ShiftCoverage['shiftType']>('12x36_dia');
  const [absenceType, setAbsenceType] = useState<ShiftCoverage['absenceType']>('falta_injustificada');
  const [absenceReason, setAbsenceReason] = useState('');
  const [medicalLeaveDays, setMedicalLeaveDays] = useState<number>(1);
  const [cidCode, setCidCode] = useState('');
  const [immediateCoverage, setImmediateCoverage] = useState(false);
  const [coveringAgentName, setCoveringAgentName] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State: Alocação de Cobertura
  const [assignCoveringAgentName, setAssignCoveringAgentName] = useState('');
  const [coverNotes, setCoverNotes] = useState('');

  const selectedCondo = condominiums.find((c) => c.id === selectedCondoId);

  // Filtragem dos registros
  const filteredCoverages = coverages.filter((c) => {
    if (selectedCondoId !== 'all' && c.condoId !== selectedCondoId) return false;
    if (statusFilter !== 'all' && c.coverageStatus !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchAgent = c.scheduledAgentName.toLowerCase().includes(term);
      const matchCover = c.coveringAgentName?.toLowerCase().includes(term);
      const matchStation = c.stationName.toLowerCase().includes(term);
      const matchCondo = c.condoName?.toLowerCase().includes(term);
      return matchAgent || matchCover || matchStation || matchCondo;
    }
    return true;
  });

  // Identificar postos que atualmente estão descobertos
  const uncoveredList = coverages.filter((c) => c.coverageStatus === 'descoberto');

  const openAddModal = () => {
    const defaultCondoId = selectedCondoId !== 'all' ? selectedCondoId : (condominiums[0]?.id || '');
    setCondoId(defaultCondoId);
    setStationName('Portaria Principal (Social)');
    const defaultAgent = agents.find((a) => (defaultCondoId ? a.condoId === defaultCondoId : true)) || agents[0];
    setScheduledAgentName(defaultAgent?.name || '');
    setScheduledAgentId(defaultAgent?.id || '');
    setDate(new Date().toLocaleDateString('pt-BR'));
    setShiftType('12x36_dia');
    setAbsenceType('falta_injustificada');
    setAbsenceReason('');
    setMedicalLeaveDays(1);
    setCidCode('');
    setImmediateCoverage(false);
    setCoveringAgentName('');
    setNotes('');
    setErrorMessage('');
    setIsAddModalOpen(true);
  };

  const openCoverModal = (record: ShiftCoverage) => {
    setSelectedRecordToCover(record);
    // Sugere o primeiro folguista ou agente disponível que não seja o faltante
    const potentialFolguistas = agents.filter((a) => a.id !== record.scheduledAgentId);
    setAssignCoveringAgentName(potentialFolguistas[0]?.name || 'Folguista Operacional da Base');
    setCoverNotes('Escalado para cobrir posto e garantir continuidade operacional 12x36.');
    setErrorMessage('');
    setIsCoverModalOpen(true);
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!condoId) {
      setErrorMessage('Selecione o condomínio.');
      return;
    }
    if (!scheduledAgentName.trim()) {
      setErrorMessage('Selecione o agente titular escalado.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const cObj = condominiums.find((c) => c.id === Number(condoId));
      const payload: Omit<ShiftCoverage, 'id' | 'createdAt'> = {
        condoId: Number(condoId),
        condoName: cObj?.name || 'Posto Geral',
        stationName: stationName.trim(),
        date: date.trim(),
        shiftType,
        scheduledAgentId: scheduledAgentId ? Number(scheduledAgentId) : undefined,
        scheduledAgentName: scheduledAgentName.trim(),
        absenceType,
        absenceReason: absenceReason.trim() || undefined,
        medicalLeaveDays: absenceType === 'atestado_medico' ? medicalLeaveDays : undefined,
        cidCode: absenceType === 'atestado_medico' && cidCode ? cidCode.trim() : undefined,
        coverageStatus: immediateCoverage && coveringAgentName.trim() ? 'coberto' : 'descoberto',
        coveringAgentName: immediateCoverage && coveringAgentName.trim() ? coveringAgentName.trim() : null,
        notes: notes.trim() || undefined,
        assignedBy: user?.name || 'Gestor Operacional',
      };

      const success = await onAddCoverage(payload);
      if (success) {
        setIsAddModalOpen(false);
      } else {
        setErrorMessage('Erro ao registrar ocorrência de escala. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCoverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRecordToCover) return;
    if (!assignCoveringAgentName.trim()) {
      setErrorMessage('Informe o nome do agente folguista / substituto.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const success = await onUpdateCoverage(selectedRecordToCover.id, {
        coverageStatus: 'coberto',
        coveringAgentName: assignCoveringAgentName.trim(),
        notes: coverNotes.trim()
          ? `${selectedRecordToCover.notes ? selectedRecordToCover.notes + ' | ' : ''}Cobertura: ${coverNotes.trim()}`
          : selectedRecordToCover.notes,
      });

      if (success) {
        setIsCoverModalOpen(false);
        setSelectedRecordToCover(null);
      } else {
        setErrorMessage('Erro ao atualizar cobertura do posto.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar substituição.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportPDF = () => {
    exportShiftScalePDF(filteredCoverages, agents, {
      condoName: selectedCondo ? selectedCondo.name : 'Todos os Condomínios e Postos',
      generatedBy: user?.name || 'Gestor Operacional',
      roleLabel:
        role === 'sindico' || role === 'admin'
          ? 'Gestor Geral da Empresa'
          : role === 'supervisor'
          ? 'Supervisor de Área'
          : 'Agente de Portaria',
    });
  };

  // Coleta os postos de serviço ativos dos condomínios selecionados
  const relevantCondos = selectedCondoId === 'all'
    ? condominiums
    : condominiums.filter((c) => c.id === selectedCondoId);

  const allStations = relevantCondos.flatMap((c) =>
    (c.serviceStations || []).map((s) => ({
      ...s,
      condoName: c.name,
    }))
  );

  return (
    <div className="space-y-6">
      {/* Alerta Crítico se houver postos descobertos */}
      {uncoveredList.length > 0 && (
        <div className="p-4 bg-rose-500/10 border-2 border-rose-500/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-200 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-extrabold text-sm sm:text-base flex items-center gap-2">
                <span>ALERTA DE SEGURANÇA: {uncoveredList.length} Posto(s) Descoberto(s)</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </p>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                {uncoveredList.map((u) => `${u.stationName} (${u.condoName || 'Posto'})`).join(' • ')} — Agente faltante sem substituto designado.
              </p>
            </div>
          </div>
          {isManager && (
            <button
              onClick={() => openCoverModal(uncoveredList[0])}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-4 h-4" />
              <span>Escalar Cobertura Imediata</span>
            </button>
          )}
        </div>
      )}

      {/* Header do Módulo */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Escala 12x36 · Faltas & Coberturas
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestão de efetivo, atestados médicos, coberturas por folguista e monitoramento de postos 24h
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleExportPDF}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            title="Download da escala oficial em PDF"
          >
            <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Exportar PDF</span>
          </button>

          {isManager && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Falta / Atestado</span>
            </button>
          )}
        </div>
      </div>

      {/* Seletor de Modo: Calendário Dinâmico | Postos de Serviço | Histórico de Faltas */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-800 w-full sm:w-auto self-start">
        <button
          onClick={() => setViewMode('calendario')}
          className={`flex-1 sm:flex-none py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            viewMode === 'calendario'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Calendário Mensal Dinâmico</span>
        </button>

        <button
          onClick={() => setViewMode('postos')}
          className={`flex-1 sm:flex-none py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            viewMode === 'postos'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Painel dos Postos (Guarnições)</span>
        </button>

        <button
          onClick={() => setViewMode('ocorrencias')}
          className={`flex-1 sm:flex-none py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
            viewMode === 'ocorrencias'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Registro de Faltas & Coberturas ({filteredCoverages.length})</span>
        </button>
      </div>

      {/* MODO 1: CALENDÁRIO MENSAL DINÂMICO DE ESCALAS */}
      {viewMode === 'calendario' && (() => {
        const monthNames = [
          'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];
        const weekdayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const weekdayShorts = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

        const currentYear = currentMonth.getFullYear();
        const currentMonthIdx = currentMonth.getMonth();
        const currentMonthLabel = `${monthNames[currentMonthIdx]} de ${currentYear}`;

        const daysInCurrentMonth = new Date(currentYear, currentMonthIdx + 1, 0).getDate();
        const firstWeekday = new Date(currentYear, currentMonthIdx, 1).getDay();
        const daysInPrevMonth = new Date(currentYear, currentMonthIdx, 0).getDate();

        const leadingDays = [];
        for (let i = firstWeekday - 1; i >= 0; i--) {
          leadingDays.push({
            day: daysInPrevMonth - i,
            isCurrentMonth: false,
            date: new Date(currentYear, currentMonthIdx - 1, daysInPrevMonth - i),
          });
        }

        const monthDays = [];
        for (let d = 1; d <= daysInCurrentMonth; d++) {
          monthDays.push({
            day: d,
            isCurrentMonth: true,
            date: new Date(currentYear, currentMonthIdx, d),
          });
        }

        const totalCells = leadingDays.length + monthDays.length;
        const trailingCount = (7 - (totalCells % 7)) % 7;
        const trailingDays = [];
        for (let d = 1; d <= trailingCount; d++) {
          trailingDays.push({
            day: d,
            isCurrentMonth: false,
            date: new Date(currentYear, currentMonthIdx + 1, d),
          });
        }

        const calendarCells = [...leadingDays, ...monthDays, ...trailingDays];

        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-6 shadow-2xs space-y-4">
            {/* Controles do Calendário: Navegação e Estatísticas do Mês */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-xl p-1 border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Mês anterior"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCurrentMonth}
                    className="px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-white dark:hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Hoje
                  </button>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors cursor-pointer"
                    title="Próximo mês"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white capitalize">
                  {currentMonthLabel}
                </h2>
              </div>

              {/* Legendas Rápidas */}
              <div className="flex items-center gap-3 flex-wrap text-xs">
                <span className="flex items-center gap-1.5 font-medium text-slate-600 dark:text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  Guarnecido
                </span>
                <span className="flex items-center gap-1.5 font-medium text-amber-600 dark:text-amber-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                  Coberto (Substituto)
                </span>
                <span className="flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                  Descoberto
                </span>
                <span className="flex items-center gap-1.5 font-medium text-indigo-600 dark:text-indigo-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  Postos Ativos: {allStations.length}
                </span>
              </div>
            </div>

            {/* Cabeçalho dos Dias da Semana */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center text-xs font-bold text-slate-500 dark:text-slate-400">
              {weekdayShorts.map((w, idx) => (
                <div
                  key={w}
                  className={`py-2 rounded-lg ${
                    idx === 0 || idx === 6
                      ? 'bg-slate-50/70 dark:bg-slate-800/40 text-indigo-600 dark:text-indigo-400'
                      : 'bg-slate-50/40 dark:bg-slate-800/20'
                  }`}
                >
                  <span className="hidden sm:inline">{weekdayNames[idx]}</span>
                  <span className="sm:hidden">{w}</span>
                </div>
              ))}
            </div>

            {/* Grade dos Dias do Mês */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarCells.map((cell, idx) => {
                const cellDateStr = formatBRDate(cell.date);
                const isToday = cell.date.toDateString() === new Date().toDateString();

                // Busca ocorrências / faltas nesta data específica
                const dayAbsences = coverages.filter((c) => {
                  const normalized = normalizeDateStr(c.date);
                  const matchDate = normalized === cellDateStr;
                  const matchCondo = selectedCondoId === 'all' || c.condoId === selectedCondoId;
                  return matchDate && matchCondo;
                });

                const uncoveredCount = dayAbsences.filter((c) => c.coverageStatus === 'descoberto').length;
                const coveredCount = dayAbsences.filter((c) => c.coverageStatus === 'coberto').length;
                const totalStations = allStations.length;

                return (
                  <div
                    key={`${cellDateStr}-${idx}`}
                    onClick={() => setSelectedCalendarDay(cell.date)}
                    className={`min-h-[92px] sm:min-h-[115px] p-2 sm:p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between group ${
                      !cell.isCurrentMonth
                        ? 'opacity-40 bg-slate-50/40 dark:bg-slate-900/40 border-slate-100 dark:border-slate-800/40'
                        : isToday
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-500 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                        : uncoveredCount > 0
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60 hover:border-rose-400'
                        : coveredCount > 0
                        ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-300 dark:border-amber-900/60 hover:border-amber-400'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 hover:border-indigo-400 dark:hover:border-indigo-600'
                    }`}
                  >
                    {/* Topo da Célula: Número do Dia + Indicador de Hoje */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-black w-6 h-6 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${
                          isToday
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {cell.day}
                      </span>

                      {isToday && (
                        <span className="hidden sm:inline-block text-[9px] font-extrabold uppercase bg-indigo-600 text-white px-1.5 py-0.5 rounded-md">
                          Hoje
                        </span>
                      )}
                    </div>

                    {/* Indicadores Visuais da Escala no Dia */}
                    <div className="space-y-1 my-1">
                      {uncoveredCount > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-extrabold text-white bg-rose-600 px-1.5 py-0.5 rounded-md shadow-xs animate-pulse">
                          <AlertTriangle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{uncoveredCount} Descoberto{uncoveredCount > 1 ? 's' : ''}</span>
                        </div>
                      )}

                      {coveredCount > 0 && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/80 px-1.5 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                          <UserCheck className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="truncate">{coveredCount} Coberto{coveredCount > 1 ? 's' : ''}</span>
                        </div>
                      )}

                      {uncoveredCount === 0 && coveredCount === 0 && totalStations > 0 && cell.isCurrentMonth && (
                        <div className="hidden sm:flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded-md">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                          <span className="truncate">{totalStations} Guarnecidos</span>
                        </div>
                      )}
                    </div>

                    {/* Rodapé da Célula com Postos 12x36 */}
                    <div className="text-[9px] text-slate-400 dark:text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="flex items-center gap-0.5 text-slate-600 dark:text-slate-400 font-semibold">
                        ☀️ 12x36
                      </span>
                      <span className="group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors font-bold text-[10px]">
                        Ver →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* MODO 2: VISÃO DOS POSTOS DE SERVIÇO */}
      {viewMode === 'postos' && (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Status Operacional dos Postos de Serviço (Escala 12x36)</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {allStations.length} postos cadastrados nos condomínios atendidos
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveShiftFilter('12x36_dia')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                activeShiftFilter === '12x36_dia'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              ☀️ Diurno (06h - 18h)
            </button>
            <button
              onClick={() => setActiveShiftFilter('12x36_noite')}
              className={`px-3 py-1.5 text-xs rounded-lg font-semibold transition-all cursor-pointer ${
                activeShiftFilter === '12x36_noite'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              🌙 Noturno (18h - 06h)
            </button>
          </div>
        </div>

        {allStations.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-4">Nenhum posto de serviço localizado.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allStations.map((station) => {
              // Verifica se há alguma falta ativa para este posto
              const activeAbsence = coverages.find(
                (c) => c.stationName === station.name && c.shiftType === activeShiftFilter
              );

              const isDescoberto = activeAbsence && activeAbsence.coverageStatus === 'descoberto';
              const isCoberto = activeAbsence && activeAbsence.coverageStatus === 'coberto';

              return (
                <div
                  key={station.id}
                  className={`p-3.5 rounded-xl border transition-all ${
                    isDescoberto
                      ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800/80 shadow-xs'
                      : isCoberto
                      ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800/80'
                      : 'bg-slate-50/80 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-bold text-xs text-slate-900 dark:text-white truncate">
                      {station.name}
                    </p>
                    {isDescoberto ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-500 text-white animate-pulse shrink-0">
                        DESCOBERTO
                      </span>
                    ) : isCoberto ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500 text-white shrink-0">
                        COBERTO (SUBSTITUTO)
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 shrink-0">
                        GUARNECIDO
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    📍 {station.condoName}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
                    <div className="min-w-0 pr-1">
                      <p className="text-[10px] text-slate-400">Plantonista:</p>
                      {(() => {
                        const displayName = isCoberto
                          ? `Substituto: ${activeAbsence.coveringAgentName}`
                          : (station.assignedAgentName || 'Agente da Escala 12x36');
                        const rawName = isCoberto ? activeAbsence.coveringAgentName : station.assignedAgentName;
                        const matchedAgent = agents.find((a) => a.name === rawName);
                        return (
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 truncate text-[11px]">
                              {displayName}
                            </p>
                            {matchedAgent?.phone && (
                              <WhatsAppButton
                                phone={matchedAgent.phone}
                                name={matchedAgent.name}
                                badgeOnly
                                className="shrink-0"
                              />
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {isDescoberto && isManager && (
                      <button
                        onClick={() => openCoverModal(activeAbsence)}
                        className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg shrink-0 cursor-pointer"
                      >
                        Escalar
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      )}

      {/* MODO 3: TABELA DE OCORRÊNCIAS DE ESCALA (Faltas, Atestados, Folgas) */}
      {(viewMode === 'postos' || viewMode === 'ocorrencias') && (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xs overflow-hidden">
        {/* Barra de Filtros */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar agente, posto ou folguista..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="descoberto">⚠️ Descoberto (Pendente)</option>
              <option value="coberto">✅ Coberto com Sucesso</option>
            </select>
          </div>
        </div>

        {/* Tabela */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Data / Turno</th>
                <th className="py-3 px-4">Posto / Condomínio</th>
                <th className="py-3 px-4">Agente Titular</th>
                <th className="py-3 px-4">Tipo da Ocorrência</th>
                <th className="py-3 px-4">Status & Cobertura</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCoverages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum registro de falta ou cobertura encontrado.
                  </td>
                </tr>
              ) : (
                filteredCoverages.map((item) => {
                  const absenceLabel = {
                    falta_injustificada: 'Falta Injustificada',
                    atestado_medico: 'Atestado Médico',
                    folga_programada: 'Folga Programada',
                    licenca: 'Licença / Afastamento',
                    troca_plantao: 'Troca de Plantão',
                  }[item.absenceType] || item.absenceType;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">{item.date}</p>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {item.shiftType === '12x36_dia' ? '☀️ 12x36 Diurno (06h às 18h)' : '🌙 12x36 Noturno (18h às 06h)'}
                        </p>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-slate-900 dark:text-white">{item.stationName}</p>
                        <p className="text-[10px] text-slate-400">{item.condoName || 'Posto Geral'}</p>
                      </td>

                      <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">
                        {(() => {
                          const schedAgent = agents.find(
                            (a) => a.name === item.scheduledAgentName || a.id === item.scheduledAgentId
                          );
                          return (
                            <div className="flex items-center gap-1.5">
                              <span>{item.scheduledAgentName}</span>
                              {schedAgent?.phone && (
                                <WhatsAppButton
                                  phone={schedAgent.phone}
                                  name={item.scheduledAgentName}
                                  badgeOnly
                                  customMessage={`Olá ${item.scheduledAgentName}, contato da NOVA BRASIL a respeito de sua escala de serviço.`}
                                />
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          item.absenceType === 'falta_injustificada'
                            ? 'bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300'
                            : item.absenceType === 'atestado_medico'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                            : 'bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300'
                        }`}>
                          {absenceLabel}
                        </span>
                        {item.cidCode && (
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            CID: {item.cidCode} ({item.medicalLeaveDays} dia{item.medicalLeaveDays! > 1 ? 's' : ''})
                          </span>
                        )}
                        {item.absenceReason && (
                          <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{item.absenceReason}</p>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {item.coverageStatus === 'coberto' ? (
                          <div className="space-y-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" />
                              Coberto por:
                            </span>
                            {(() => {
                              const covAgent = agents.find((a) => a.name === item.coveringAgentName);
                              return (
                                <div className="flex items-center gap-1.5">
                                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                                    {item.coveringAgentName}
                                  </p>
                                  {covAgent?.phone && (
                                    <WhatsAppButton
                                      phone={covAgent.phone}
                                      name={item.coveringAgentName}
                                      badgeOnly
                                      customMessage={`Olá ${item.coveringAgentName}, contato da NOVA BRASIL a respeito da cobertura de posto.`}
                                    />
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                            <AlertCircle className="w-3 h-3" />
                            Posto Descoberto
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {item.coverageStatus === 'descoberto' && isManager && (
                            <button
                              onClick={() => openCoverModal(item)}
                              className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-[11px] transition-colors cursor-pointer"
                              title="Escalar substituto"
                            >
                              Escalar
                            </button>
                          )}

                          {isManager && (
                            <button
                              onClick={() => onDeleteCoverage(item.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                              title="Excluir registro"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* Modal Interativo: Escala Detalhada do Dia Selecionado no Calendário */}
      {selectedCalendarDay && (() => {
        const dayStr = formatBRDate(selectedCalendarDay);
        const dayName = selectedCalendarDay.toLocaleDateString('pt-BR', { weekday: 'long' });
        const dayAbsences = coverages.filter((c) => {
          const matchDate = normalizeDateStr(c.date) === dayStr;
          const matchCondo = selectedCondoId === 'all' || c.condoId === selectedCondoId;
          return matchDate && matchCondo;
        });

        const openAddForThisDay = () => {
          setDate(dayStr);
          setSelectedCalendarDay(null);
          setIsAddModalOpen(true);
        };

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-900 dark:text-white text-base sm:text-lg capitalize">
                      Escala do Dia: {dayName}, {dayStr}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Guarnições, escalas 12x36 e coberturas ativas
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedCalendarDay(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Botão de Ação Rápida para este dia */}
              <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  Deseja lançar falta, atestado ou troca para esta data?
                </span>
                {isManager && (
                  <button
                    onClick={openAddForThisDay}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lançar Ocorrência em {dayStr}</span>
                  </button>
                )}
              </div>

              {/* Ocorrências / Faltas cadastradas no dia */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  <span>Ocorrências de Escala no Dia ({dayAbsences.length})</span>
                </h4>

                {dayAbsences.length === 0 ? (
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Nenhuma ausência ou falta registrada. Todos os postos estão guarnecidos normalmente.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {dayAbsences.map((ab) => (
                      <div
                        key={ab.id}
                        className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                          ab.coverageStatus === 'descoberto'
                            ? 'bg-rose-50/80 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                            : 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-900 dark:text-white">
                              {ab.stationName} ({ab.condoName || 'Posto'})
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                              {ab.shiftType === '12x36_dia' ? '☀️ Diurno' : '🌙 Noturno'}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                                ab.coverageStatus === 'descoberto'
                                  ? 'bg-rose-600 text-white'
                                  : 'bg-emerald-600 text-white'
                              }`}
                            >
                              {ab.coverageStatus === 'descoberto' ? 'DESCOBERTO' : 'COBERTO'}
                            </span>
                          </div>
                          <p className="text-slate-600 dark:text-slate-400">
                            Ausência: <strong>{ab.scheduledAgentName}</strong> ({ab.absenceType.replace('_', ' ')})
                            {ab.absenceReason && ` — "${ab.absenceReason}"`}
                          </p>
                          {ab.coverageStatus === 'coberto' && ab.coveringAgentName && (
                            <p className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Substituto escalado: {ab.coveringAgentName}
                            </p>
                          )}
                        </div>

                        {ab.coverageStatus === 'descoberto' && isManager && (
                          <button
                            onClick={() => {
                              setSelectedCalendarDay(null);
                              openCoverModal(ab);
                            }}
                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shrink-0 cursor-pointer shadow-xs"
                          >
                            Escalar Cobertura
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Guarnições e Postos Operacionais da Escala */}
              <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>Guarnições dos Postos de Serviço</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {allStations.map((st) => {
                    const matchedAbsence = dayAbsences.find((a) => a.stationName === st.name);
                    const isCovered = matchedAbsence && matchedAbsence.coverageStatus === 'coberto';
                    const isUncovered = matchedAbsence && matchedAbsence.coverageStatus === 'descoberto';

                    return (
                      <div
                        key={st.id}
                        className={`p-3 rounded-xl border text-xs ${
                          isUncovered
                            ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-800'
                            : isCovered
                            ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                            : 'bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <strong className="text-slate-900 dark:text-white truncate">{st.name}</strong>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                              isUncovered
                                ? 'bg-rose-500 text-white'
                                : isCovered
                                ? 'bg-amber-500 text-white'
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                            }`}
                          >
                            {isUncovered ? 'DESCOBERTO' : isCovered ? 'SUBSTITUTO' : 'GUARNECIDO'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          📍 {st.condoName}
                        </p>
                        <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1.5 pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                          Agente em Serviço:{' '}
                          <strong>
                            {isCovered
                              ? `${matchedAbsence.coveringAgentName} (Substituto)`
                              : (st.assignedAgentName || 'Escala 12x36 Regular')}
                          </strong>
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedCalendarDay(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Fechar Visualização
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal: Registrar Falta / Atestado */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <UserX className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Registrar Falta / Afastamento (12x36)
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Condomínio / Posto Atendido *
                </label>
                <select
                  value={condoId}
                  onChange={(e) => setCondoId(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                >
                  {condominiums.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Posto de Serviço *
                  </label>
                  <input
                    type="text"
                    value={stationName}
                    onChange={(e) => setStationName(e.target.value)}
                    placeholder="Ex: Portaria Social, Ronda..."
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Agente Titular Ausente *
                  </label>
                  <select
                    value={scheduledAgentName}
                    onChange={(e) => {
                      const selected = agents.find((a) => a.name === e.target.value);
                      setScheduledAgentName(e.target.value);
                      setScheduledAgentId(selected?.id || '');
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">Selecione o agente...</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.name}>
                        {ag.name} ({ag.badgeNumber})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data do Plantão *
                  </label>
                  <input
                    type="text"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Turno da Escala 12x36 *
                  </label>
                  <select
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="12x36_dia">☀️ 12x36 Diurno (06h às 18h)</option>
                    <option value="12x36_noite">🌙 12x36 Noturno (18h às 06h)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tipo da Ocorrência *
                </label>
                <select
                  value={absenceType}
                  onChange={(e) => setAbsenceType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="falta_injustificada">Falta Injustificada (Sem prévio aviso)</option>
                  <option value="atestado_medico">Atestado Médico / Licença Saúde</option>
                  <option value="folga_programada">Folga Programada / Compensatória</option>
                  <option value="licenca">Licença Regulamentar (Maternidade, Paternidade, Luto)</option>
                  <option value="troca_plantao">Troca de Plantão / Permuta</option>
                </select>
              </div>

              {absenceType === 'atestado_medico' && (
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-xl grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-amber-900 dark:text-amber-200 mb-1">
                      Código CID (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: J06.9, M54.5"
                      value={cidCode}
                      onChange={(e) => setCidCode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-amber-900 dark:text-amber-200 mb-1">
                      Dias de Repouso
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={medicalLeaveDays}
                      onChange={(e) => setMedicalLeaveDays(Number(e.target.value))}
                      className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-amber-300 dark:border-amber-700 rounded-lg text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Motivo / Observações da Ausência
                </label>
                <textarea
                  rows={2}
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  placeholder="Relato recebido da supervisão ou do próprio agente..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Se já quiser designar substituto imediatamente */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800 dark:text-slate-200">
                  <input
                    type="checkbox"
                    checked={immediateCoverage}
                    onChange={(e) => setImmediateCoverage(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                  <span>Já designar folguista/substituto para cobertura agora</span>
                </label>

                {immediateCoverage && (
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/60 rounded-xl">
                    <label className="block font-semibold text-indigo-900 dark:text-indigo-200 mb-1">
                      Agente Substituto / Folguista
                    </label>
                    <select
                      value={coveringAgentName}
                      onChange={(e) => setCoveringAgentName(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 rounded-xl text-slate-900 dark:text-white"
                    >
                      <option value="">Selecione o folguista...</option>
                      {agents
                        .filter((a) => a.name !== scheduledAgentName)
                        .map((ag) => (
                          <option key={ag.id} value={ag.name}>
                            {ag.name} ({ag.badgeNumber}) - {ag.shift}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Confirmar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Escalar Cobertura / Substituto */}
      {isCoverModalOpen && selectedRecordToCover && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Designar Cobertura de Plantão
                </h3>
              </div>
              <button
                onClick={() => setIsCoverModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs space-y-1">
              <p className="font-bold text-rose-900 dark:text-rose-200">
                Posto: {selectedRecordToCover.stationName} ({selectedRecordToCover.condoName || 'Posto'})
              </p>
              <p className="text-slate-600 dark:text-slate-300">
                Data: {selectedRecordToCover.date} • {selectedRecordToCover.shiftType === '12x36_dia' ? 'Diurno' : 'Noturno'}
              </p>
              <p className="text-rose-700 dark:text-rose-300 font-semibold">
                Ausência de: {selectedRecordToCover.scheduledAgentName} ({selectedRecordToCover.absenceType})
              </p>
            </div>

            {errorMessage && (
              <div className="mt-3 p-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCoverSubmit} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Agente Substituto / Folguista *
                </label>
                <select
                  value={assignCoveringAgentName}
                  onChange={(e) => setAssignCoveringAgentName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                >
                  <option value="">Selecione o substituto da equipe...</option>
                  {agents
                    .filter((a) => a.id !== selectedRecordToCover.scheduledAgentId)
                    .map((ag) => (
                      <option key={ag.id} value={ag.name}>
                        {ag.name} ({ag.badgeNumber}) - {ag.shift}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações da Escalação
                </label>
                <textarea
                  rows={2}
                  value={coverNotes}
                  onChange={(e) => setCoverNotes(e.target.value)}
                  placeholder="Ex: Agente folguista acionado, diária confirmada..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCoverModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Confirmar Cobertura'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
