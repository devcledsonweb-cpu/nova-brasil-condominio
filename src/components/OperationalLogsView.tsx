import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  Clock,
  UserCheck,
  AlertTriangle,
  CheckCircle2,
  Info,
  Trash2,
  X,
  AlertCircle,
  Shield,
  RotateCw,
  Download,
  CheckSquare,
  Square,
  Check,
  Bell,
  BellRing,
  FileEdit,
  Edit2,
  ListChecks,
} from 'lucide-react';
import {
  OperationalLog,
  Condominium,
  SecurityAgent,
  IncomingShiftChecklist,
  PostChecklistItem,
  OperationalLogChangeRequest,
} from '../types/index.ts';
import { maskDate } from '../utils/masks.ts';
import { exportOperationalLogsPDF } from '../utils/pdfExport.ts';
import { WhatsAppButton } from './WhatsAppButton.tsx';
import { PostChecklistManagementModal } from './PostChecklistManagementModal.tsx';

interface OperationalLogsViewProps {
  logs: OperationalLog[];
  condominiums: Condominium[];
  agents: SecurityAgent[];
  selectedCondoId: number | 'all';
  checklistItems?: PostChecklistItem[];
  onAddLog: (log: Omit<OperationalLog, 'id' | 'createdAt'>) => Promise<boolean>;
  onUpdateLog?: (id: number, patch: Partial<OperationalLog>) => Promise<boolean>;
  onDeleteLog: (id: number) => Promise<boolean>;
  onSaveChecklistItem?: (item: Omit<PostChecklistItem, 'id' | 'createdAt'> & { id?: string }) => Promise<boolean>;
  onDeleteChecklistItem?: (id: string) => Promise<boolean>;
  onToggleChecklistActive?: (id: string, currentActive: boolean) => Promise<boolean>;
  onResetDefaultChecklist?: () => Promise<void>;
}

export const OperationalLogsView: React.FC<OperationalLogsViewProps> = ({
  logs,
  condominiums,
  agents,
  selectedCondoId,
  checklistItems = [],
  onAddLog,
  onUpdateLog,
  onDeleteLog,
  onSaveChecklistItem,
  onDeleteChecklistItem,
  onToggleChecklistActive,
  onResetDefaultChecklist,
}) => {
  const { user, role } = useAuth();
  const isManager = role === 'sindico' || role === 'admin' || role === 'supervisor';

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Estado do Modal de Aceite pelo Agente Entrante
  const [acceptingLog, setAcceptingLog] = useState<OperationalLog | null>(null);
  const [checklist, setChecklist] = useState<IncomingShiftChecklist>({
    keysReceived: true,
    radiosOk: true,
    stationClean: true,
    patrolStickOk: true,
    noPendingIssues: true,
  });
  const [dynamicChecklistResponses, setDynamicChecklistResponses] = useState<Record<string, boolean>>({});
  const [incomingNotes, setIncomingNotes] = useState('');
  const [isAcceptingSubmitting, setIsAcceptingSubmitting] = useState(false);

  // Gestão de Itens do Checklist pelo Gestor (CRUD)
  const [isChecklistModalOpen, setIsChecklistModalOpen] = useState(false);

  // Solicitação de Alteração ou Exclusão pelo Agente
  const [requestChangeModalLog, setRequestChangeModalLog] = useState<OperationalLog | null>(null);
  const [requestType, setRequestType] = useState<'alteracao' | 'exclusao'>('alteracao');
  const [requestReason, setRequestReason] = useState('');
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);
  const [requestFeedback, setRequestFeedback] = useState('');

  // Edição Direta de Registros pelo Gestor
  const [editingLog, setEditingLog] = useState<OperationalLog | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Form State Novo Registro
  const [condoId, setCondoId] = useState<number | ''>(
    selectedCondoId !== 'all' ? selectedCondoId : (condominiums[0]?.id || '')
  );
  const [agentName, setAgentName] = useState('');
  const [designatedIncomingAgentName, setDesignatedIncomingAgentName] = useState('');
  const [designatedIncomingAgentId, setDesignatedIncomingAgentId] = useState<number | undefined>(undefined);
  const [shiftType, setShiftType] = useState<OperationalLog['shiftType']>('dia');
  const [logType, setLogType] = useState<OperationalLog['logType']>('passagem_turno');
  const [severity, setSeverity] = useState<OperationalLog['severity']>('informativa');
  const [status, setStatus] = useState<OperationalLog['status']>('resolvida');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [logDate, setLogDate] = useState(new Date().toLocaleDateString('pt-BR'));
  const [logTime, setLogTime] = useState(
    new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  );

  const handleExportPDF = () => {
    const selectedCondo = condominiums.find((c) => c.id === selectedCondoId);
    exportOperationalLogsPDF(filteredLogs, {
      condoName: selectedCondo ? selectedCondo.name : 'Todos os Condomínios e Postos',
      generatedBy: user?.name || 'Gestor Operacional',
      roleLabel: role === 'sindico' || role === 'admin' ? 'Gestor Geral da Empresa' : 'Supervisor de Posto',
    });
  };

  const openAddModal = () => {
    const targetCondoId = selectedCondoId !== 'all' ? selectedCondoId : (condominiums[0]?.id || '');
    setCondoId(targetCondoId);
    const myName = user?.name || agents[0]?.name || 'Agente de Portaria';
    setAgentName(myName);

    // Sugere o agente que irá receber o serviço (entrante)
    const otherAgent = agents.find(
      (a) => a.name.trim().toLowerCase() !== myName.trim().toLowerCase()
    );
    if (otherAgent) {
      setDesignatedIncomingAgentName(otherAgent.name);
      setDesignatedIncomingAgentId(otherAgent.id);
    } else if (agents[0]) {
      setDesignatedIncomingAgentName(agents[0].name);
      setDesignatedIncomingAgentId(agents[0].id);
    } else {
      setDesignatedIncomingAgentName('');
      setDesignatedIncomingAgentId(undefined);
    }

    setShiftType('dia');
    setLogType('passagem_turno');
    setSeverity('informativa');
    setStatus('resolvida');
    setTitle('Passagem de Turno - Sem Alterações');
    setDescription(
      'Turno transmitido no posto com todos os materiais conferidos (rádios HT, bastão de vigia e chaves da portaria no claviculário). Perímetro do condomínio em ordem.'
    );
    setActionTaken('');
    setLogDate(new Date().toLocaleDateString('pt-BR'));
    setLogTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openAcceptModal = (log: OperationalLog) => {
    setAcceptingLog(log);
    const relevantItems = checklistItems.filter(
      (item) => item.isActive && (!item.condoId || item.condoId === log.condoId)
    );
    const initialMap: Record<string, boolean> = {};
    relevantItems.forEach((it) => {
      initialMap[it.id] = false;
    });
    setDynamicChecklistResponses(initialMap);
    setChecklist({
      keysReceived: true,
      radiosOk: true,
      stationClean: true,
      patrolStickOk: true,
      noPendingIssues: true,
    });
    setIncomingNotes('');
    setIsAcceptingSubmitting(false);
  };

  const handleConfirmAcceptance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptingLog || !onUpdateLog) return;

    const relevantItems = checklistItems.filter(
      (item) => item.isActive && (!item.condoId || item.condoId === acceptingLog.condoId)
    );

    // Valida itens obrigatórios
    const missingRequired = relevantItems.filter(
      (it) => it.isRequired && !dynamicChecklistResponses[it.id]
    );

    if (missingRequired.length > 0) {
      alert(
        `Atenção: Os seguintes itens obrigatórios do posto devem ser conferidos e marcados antes de assinar:\n\n• ${missingRequired
          .map((i) => i.title)
          .join('\n• ')}`
      );
      return;
    }

    setIsAcceptingSubmitting(true);
    const nowStr = `${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date().toLocaleDateString('pt-BR')}`;

    try {
      await onUpdateLog(acceptingLog.id, {
        incomingAgentAccepted: true,
        incomingAgentName: user?.name || acceptingLog.designatedIncomingAgentName || 'Agente Entrante',
        incomingAcceptedAt: nowStr,
        incomingChecklist: checklist,
        incomingDynamicChecklist: dynamicChecklistResponses,
        incomingNotes: incomingNotes.trim() || undefined,
        status: 'resolvida',
      });
      setAcceptingLog(null);
    } catch (err) {
      console.error('Erro ao aceitar turno:', err);
    } finally {
      setIsAcceptingSubmitting(false);
    }
  };

  // --- SOLICITAÇÃO DE ALTERAÇÃO / EXCLUSÃO PELO AGENTE ---
  const handleOpenRequestModal = (log: OperationalLog) => {
    setRequestChangeModalLog(log);
    setRequestType('alteracao');
    setRequestReason('');
    setRequestFeedback('');
  };

  const handleSubmitChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestChangeModalLog || !onUpdateLog) return;
    if (!requestReason.trim()) {
      setRequestFeedback('Informe o que deseja alterar e a justificativa operacional.');
      return;
    }

    setIsRequestSubmitting(true);
    setRequestFeedback('');

    try {
      const changeReq: OperationalLogChangeRequest = {
        requestedBy: user?.name || 'Agente de Portaria',
        requestedAt: `${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date().toLocaleDateString('pt-BR')}`,
        requestType,
        reason: requestReason.trim(),
        status: 'pendente',
      };

      const success = await onUpdateLog(requestChangeModalLog.id, {
        changeRequest: changeReq,
      });

      if (success) {
        setRequestChangeModalLog(null);
      } else {
        setRequestFeedback('Erro ao enviar solicitação ao gestor. Tente novamente.');
      }
    } catch (err: any) {
      setRequestFeedback(err.message || 'Erro ao processar solicitação.');
    } finally {
      setIsRequestSubmitting(false);
    }
  };

  const handleApproveExclusion = async (log: OperationalLog) => {
    if (
      window.confirm(
        `Tem certeza que deseja autorizar a EXCLUSÃO deste registro conforme solicitação de ${log.changeRequest?.requestedBy}?`
      )
    ) {
      await onDeleteLog(log.id);
    }
  };

  const handleRejectChangeRequest = async (log: OperationalLog) => {
    if (!onUpdateLog || !log.changeRequest) return;
    const reason = window.prompt('Motivo da recusa (opcional):') || undefined;
    await onUpdateLog(log.id, {
      changeRequest: {
        ...log.changeRequest,
        status: 'rejeitada',
        reviewedBy: user?.name || 'Gestor Operacional',
        reviewedAt: new Date().toLocaleDateString('pt-BR'),
        reviewNotes: reason,
      },
    });
  };

  const handleOpenEditAsManager = (log: OperationalLog) => {
    setEditingLog(log);
    setTitle(log.title);
    setDescription(log.description);
    setActionTaken(log.actionTaken || '');
    setSeverity(log.severity);
    setStatus(log.status);
    setLogDate(log.logDate);
    setLogTime(log.logTime);
    setAgentName(log.agentName);
    setCondoId(log.condoId || '');
    setIsEditModalOpen(true);
  };

  const handleSaveEditAsManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLog || !onUpdateLog) return;
    setIsSubmitting(true);
    try {
      const patch: Partial<OperationalLog> = {
        title: title.trim(),
        description: description.trim(),
        actionTaken: actionTaken.trim() || null,
        severity,
        status,
        logDate,
        logTime,
      };

      if (editingLog.changeRequest && editingLog.changeRequest.status === 'pendente') {
        patch.changeRequest = {
          ...editingLog.changeRequest,
          status: 'aprovada',
          reviewedBy: user?.name || 'Gestor Operacional',
          reviewedAt: new Date().toLocaleDateString('pt-BR'),
        };
      }

      const success = await onUpdateLog(editingLog.id, patch);
      if (success) {
        setIsEditModalOpen(false);
        setEditingLog(null);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim()) {
      setErrorMessage('Informe o nome do agente responsável pelo registro.');
      return;
    }
    if (logType === 'passagem_turno' && !designatedIncomingAgentName.trim()) {
      setErrorMessage('Selecione quem irá receber o serviço (agente entrante).');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Informe o título do registro ou ocorrência.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Descreva o relato operacional com detalhes.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const selectedCondo = condominiums.find((c) => c.id === Number(condoId));
      const payload: Omit<OperationalLog, 'id' | 'createdAt'> = {
        condoId: condoId ? Number(condoId) : null,
        condoName: selectedCondo?.name || 'Posto Geral',
        agentName: agentName.trim(),
        shiftType,
        logType,
        severity,
        status: logType === 'passagem_turno' ? 'aberta' : status,
        title: title.trim(),
        description: description.trim(),
        actionTaken: actionTaken.trim() || null,
        logDate: logDate.trim(),
        logTime: logTime.trim(),
        designatedIncomingAgentName: logType === 'passagem_turno' ? designatedIncomingAgentName.trim() : null,
        designatedIncomingAgentId: logType === 'passagem_turno' ? (designatedIncomingAgentId || null) : null,
        incomingAgentAccepted: false,
      };

      const success = await onAddLog(payload);
      if (success) {
        setIsModalOpen(false);
      } else {
        setErrorMessage('Falha ao registrar ocorrência operacional. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao salvar registro.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (selectedCondoId !== 'all' && log.condoId !== selectedCondoId) {
      return false;
    }
    if (typeFilter !== 'all' && log.logType !== typeFilter) {
      return false;
    }
    if (severityFilter !== 'all' && log.severity !== severityFilter) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = log.title.toLowerCase().includes(term);
      const matchAgent = log.agentName.toLowerCase().includes(term);
      const matchCondo = log.condoName?.toLowerCase().includes(term);
      const matchDesc = log.description.toLowerCase().includes(term);
      const matchIncoming = log.incomingAgentName?.toLowerCase().includes(term);
      const matchDesignated = log.designatedIncomingAgentName?.toLowerCase().includes(term);
      return matchTitle || matchAgent || matchCondo || matchDesc || matchIncoming || matchDesignated;
    }
    return true;
  });

  const getLogTypeLabel = (type: OperationalLog['logType']) => {
    switch (type) {
      case 'passagem_turno':
        return 'Passagem de Turno';
      case 'ronda_preventiva':
        return 'Ronda Preventiva';
      case 'vistoria_supervisor':
        return 'Vistoria de Supervisão';
      case 'ocorrencia_posto':
      default:
        return 'Ocorrência no Posto';
    }
  };

  const getSeverityBadge = (severity: OperationalLog['severity']) => {
    switch (severity) {
      case 'alta':
      case 'grave':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-3 h-3" />
            Alta / Grave
          </span>
        );
      case 'media':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
            <AlertTriangle className="w-3 h-3" />
            Média
          </span>
        );
      case 'baixa':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300">
            <Info className="w-3 h-3" />
            Baixa
          </span>
        );
      case 'informativa':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Shield className="w-3 h-3" />
            Informativa
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Livro de Ocorrências & Passagem de Turno
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro digital com confirmação e aceite de posto pelo agente entrante
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {isManager && (
            <button
              onClick={() => setIsChecklistModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/80 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
              title="Gerenciar itens obrigatórios de conferência do posto"
            >
              <ListChecks className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Checklist do Posto ({checklistItems.length})</span>
            </button>
          )}

          {isManager && (
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
              title="Baixar relatório completo em PDF"
            >
              <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Exportar PDF</span>
            </button>
          )}

          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar Passagem / Ocorrência</span>
          </button>
        </div>
      </div>

      {/* AVISO AO AGENTE ENTRANTE: Passagem de Serviço Designada para Ele */}
      {(() => {
        const myPending = logs.filter((l) => {
          if (l.logType !== 'passagem_turno' || l.incomingAgentAccepted) return false;
          if (!user?.name) return false;
          const uName = user.name.trim().toLowerCase();
          const designated = l.designatedIncomingAgentName?.trim().toLowerCase();
          return Boolean(designated && (designated === uName || uName.includes(designated) || designated.includes(uName)));
        });

        if (myPending.length === 0) return null;

        const firstLog = myPending[0];
        return (
          <div className="bg-linear-to-r from-amber-500 via-amber-600 to-orange-600 rounded-2xl p-4 sm:p-5 text-white shadow-lg border border-amber-400 space-y-3 animate-in fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                  <BellRing className="w-5 h-5 text-white animate-bounce" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-white/25 px-2.5 py-0.5 rounded-full">
                      🚨 AVISO OPERACIONAL DE PASSAGEM DE SERVIÇO
                    </span>
                    <span className="text-xs text-amber-100 font-semibold">
                      {myPending.length} plantão pendente de recebimento
                    </span>
                  </div>
                  <h2 className="text-base sm:text-lg font-black mt-1">
                    {firstLog.agentName} está passando o serviço para você!
                  </h2>
                  <p className="text-xs text-amber-100 mt-0.5">
                    Posto: <strong>{firstLog.condoName || 'Posto Geral'}</strong> · Transmissão: <strong>{firstLog.logDate} às {firstLog.logTime}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => openAcceptModal(firstLog)}
                className="px-5 py-2.5 bg-white text-amber-950 hover:bg-amber-50 font-black text-xs rounded-xl shadow-md transition-all hover:scale-105 shrink-0 flex items-center gap-2 cursor-pointer self-stretch sm:self-auto justify-center"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Conferir Checklist & Receber Serviço</span>
              </button>
            </div>

            {firstLog.description && (
              <div className="bg-black/15 p-2.5 rounded-xl text-xs text-amber-50 border border-white/10">
                <strong className="block text-[11px] font-bold text-amber-200">Relato do Agente Sainte ({firstLog.agentName}):</strong>
                <p className="mt-0.5 italic">"{firstLog.description}"</p>
              </div>
            )}
          </div>
        );
      })()}

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3 sm:p-4 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ocorrência, agente, condomínio ou relato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">Todos os Tipos</option>
            <option value="passagem_turno">Passagem de Turno</option>
            <option value="ronda_preventiva">Ronda Preventiva</option>
            <option value="vistoria_supervisor">Vistoria de Supervisão</option>
            <option value="ocorrencia_posto">Ocorrência no Posto</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="all">Todas as Gravidades</option>
            <option value="informativa">Informativa</option>
            <option value="baixa">Baixa</option>
            <option value="media">Média</option>
            <option value="alta">Alta / Grave</option>
          </select>
        </div>
      </div>

      {/* Log Feed */}
      {filteredLogs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Nenhum registro operacional encontrado</h3>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1 max-w-md mx-auto">
            {searchTerm || typeFilter !== 'all' || severityFilter !== 'all'
              ? 'Tente ajustar os filtros ou termo de busca acima.'
              : 'Registre a primeira passagem de turno ou relatório de ronda dos seus agentes.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs hover:border-blue-300 dark:hover:border-blue-700 transition-all"
            >
              {/* Header do Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {getLogTypeLabel(log.logType)}
                  </span>
                  <span className="text-slate-300">·</span>
                  <span className="font-bold text-slate-900 dark:text-white text-sm">{log.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{log.logDate}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{log.logTime}</span>
                  </div>
                  {getSeverityBadge(log.severity)}
                </div>
              </div>

              {/* Banner de Solicitação de Alteração / Exclusão do Agente */}
              {log.changeRequest && log.changeRequest.status === 'pendente' && (
                <div className="mt-3 p-3.5 bg-amber-50/90 dark:bg-amber-950/40 border-2 border-amber-400 dark:border-amber-600 rounded-xl text-xs space-y-2">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="font-extrabold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 uppercase text-[10px] tracking-wider">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      SOLICITAÇÃO DE {log.changeRequest.requestType === 'exclusao' ? 'EXCLUSÃO' : 'ALTERAÇÃO'} ENVIADA PELO AGENTE
                    </span>
                    <span className="text-[10px] font-mono text-amber-700 dark:text-amber-400 font-bold">
                      {log.changeRequest.requestedAt}
                    </span>
                  </div>

                  <div className="text-slate-800 dark:text-slate-200">
                    <p className="text-[11px] text-slate-600 dark:text-slate-400">
                      Solicitante: <strong>{log.changeRequest.requestedBy}</strong>
                    </p>
                    <div className="mt-1 p-2 bg-white/90 dark:bg-slate-900/90 rounded-lg border border-amber-200 dark:border-amber-800 text-[11px] italic text-slate-700 dark:text-slate-300">
                      Justificativa: "{log.changeRequest.reason}"
                    </div>
                  </div>

                  {isManager && (
                    <div className="pt-2 border-t border-amber-200 dark:border-amber-800/80 flex items-center gap-2 flex-wrap">
                      {log.changeRequest.requestType === 'exclusao' ? (
                        <button
                          onClick={() => handleApproveExclusion(log)}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Aprovar Exclusão do Registro</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleOpenEditAsManager(log)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <FileEdit className="w-3.5 h-3.5" />
                          <span>Editar Registro Conforme Solicitado</span>
                        </button>
                      )}

                      <button
                        onClick={() => handleRejectChangeRequest(log)}
                        className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg font-semibold text-xs cursor-pointer"
                      >
                        Rejeitar Solicitação
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Descrição / Relato */}
              <div className="mt-3 text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                {log.description}
              </div>

              {log.actionTaken && (
                <div className="mt-3 p-2.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 rounded-xl text-xs text-blue-900 dark:text-blue-300">
                  <strong className="block font-semibold">Providência Adotada:</strong>
                  <p className="mt-0.5">{log.actionTaken}</p>
                </div>
              )}

              {/* DISCIPLINA DO POSTO: Confirmação / Aceite da Passagem de Turno pelo Agente Entrante */}
              {log.logType === 'passagem_turno' && (() => {
                const isDesignatedForMe = Boolean(
                  user?.name &&
                  log.designatedIncomingAgentName &&
                  (log.designatedIncomingAgentName.trim().toLowerCase() === user.name.trim().toLowerCase() ||
                   user.name.trim().toLowerCase().includes(log.designatedIncomingAgentName.trim().toLowerCase()))
                );
                const designatedAgentObj = agents.find((a) => a.name === log.designatedIncomingAgentName);

                if (log.incomingAgentAccepted) {
                  return (
                    <div className="mt-3 pt-2">
                      <div className="p-3 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs space-y-1.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <span className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>Turno Recebido & Posto Conferido pelo Agente Entrante</span>
                          </span>
                          <span className="text-[10px] font-mono font-semibold text-emerald-700 dark:text-emerald-400">
                            {log.incomingAcceptedAt}
                          </span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 text-[11px]">
                          Recebido por: <strong className="text-emerald-900 dark:text-emerald-200">{log.incomingAgentName}</strong>
                          {log.designatedIncomingAgentName && log.designatedIncomingAgentName !== log.incomingAgentName && (
                            <span className="text-slate-500 text-[10px]"> (designado originalmente: {log.designatedIncomingAgentName})</span>
                          )} · Chaves, rádios HT, bastão e guarita conferidos em ordem.
                        </p>
                        {log.incomingNotes && (
                          <p className="text-[11px] text-slate-600 dark:text-slate-400 italic bg-white/70 dark:bg-slate-900/50 p-2 rounded-lg border border-emerald-200/50 dark:border-emerald-800/40">
                            Ressalva do entrante: "{log.incomingNotes}"
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="mt-3 pt-2">
                    <div className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isDesignatedForMe
                        ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/50 shadow-md'
                        : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50'
                    }`}>
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${isDesignatedForMe ? 'text-amber-600 animate-bounce' : 'text-amber-500'}`} />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-amber-900 dark:text-amber-200">
                              Aguardando Recebimento de Serviço
                            </span>
                            {isDesignatedForMe && (
                              <span className="text-[10px] bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                                VOCÊ FOI SELECIONADO
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 flex-wrap text-[11px] text-amber-900 dark:text-amber-300">
                            <span>Designado para receber:</span>
                            <span className="font-bold text-slate-900 dark:text-white bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900">
                              {log.designatedIncomingAgentName || 'Próximo Plantonista'}
                            </span>
                            {designatedAgentObj?.badgeNumber && (
                              <span className="text-[10px] text-slate-500 font-mono">
                                ({designatedAgentObj.badgeNumber})
                              </span>
                            )}
                            {designatedAgentObj?.phone && (
                              <WhatsAppButton
                                phone={designatedAgentObj.phone}
                                name={designatedAgentObj.name}
                                badgeOnly
                                customMessage={`Olá ${designatedAgentObj.name}, você foi selecionado para receber o serviço da guarita no sistema NOVA BRASIL.`}
                              />
                            )}
                          </div>

                          <p className="text-[10px] text-slate-500 dark:text-slate-400">
                            O agente entrante deve conferir chaves, rádios HT e assinar o recebimento no sistema.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                        {onUpdateLog && (isDesignatedForMe || isManager) ? (
                          <button
                            onClick={() => openAcceptModal(log)}
                            className={`px-3.5 py-2 rounded-xl font-extrabold text-xs shadow-xs transition-transform hover:scale-105 flex items-center gap-1.5 cursor-pointer ${
                              isDesignatedForMe
                                ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/20'
                                : 'bg-slate-800 hover:bg-slate-900 text-white dark:bg-slate-700 dark:hover:bg-slate-600'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isDesignatedForMe ? 'Receber Serviço & Assinar' : 'Conferir & Aceitar Turno'}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 italic">
                            Aguardando {log.designatedIncomingAgentName || 'plantonista'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Rodapé do Card */}
              <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-slate-900 dark:text-slate-200">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {log.condoName || 'Posto Geral'}
                  </span>
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>
                      Passado por: <strong className="text-slate-800 dark:text-slate-200">{log.agentName}</strong> ({log.shiftType === 'dia' ? 'Diurno' : 'Noturno'})
                    </span>
                    {log.agentName?.trim().toLowerCase() === user?.name?.trim().toLowerCase() && (
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-semibold px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-900">
                        👤 Meu Registro
                      </span>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Gestor: pode editar e excluir diretamente */}
                  {isManager && (
                    <>
                      <button
                        onClick={() => handleOpenEditAsManager(log)}
                        className="p-1.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                        title="Editar Registro"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(log.id)}
                        className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Excluir Registro"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {/* Agente: NÃO PODE APAGAR DIRETAMENTE! Pode apenas solicitar alteração ou exclusão ao gestor */}
                  {!isManager && log.agentName?.trim().toLowerCase() === user?.name?.trim().toLowerCase() && (
                    log.changeRequest?.status === 'pendente' ? (
                      <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-800 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-500 animate-spin" />
                        <span>Solicitação ({log.changeRequest.requestType}) enviada ao gestor</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => handleOpenRequestModal(log)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 text-xs font-bold transition-colors cursor-pointer"
                        title="Solicitar alteração ou exclusão ao gestor"
                      >
                        <FileEdit className="w-3.5 h-3.5" />
                        <span>Solicitar Alteração / Exclusão</span>
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Conferência e Aceite de Passagem de Turno pelo Agente Entrante */}
      {acceptingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Aceite de Passagem de Turno
                  </h3>
                  <p className="text-[10px] text-slate-400">Termo de responsabilidade e conferência do posto</p>
                </div>
              </div>
              <button
                onClick={() => setAcceptingLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações da Passagem Entregue */}
            <div className="mt-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">
                  Posto: <strong className="text-slate-900 dark:text-white">{acceptingLog.condoName || 'Posto Geral'}</strong>
                </span>
                <span className="text-[10px] bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full">
                  Termo de Recebimento
                </span>
              </div>
              <p className="text-slate-600 dark:text-slate-400">
                Sainte (Transmitido por):{' '}
                <strong className="text-slate-900 dark:text-white">{acceptingLog.agentName}</strong> em{' '}
                {acceptingLog.logDate} às {acceptingLog.logTime}
              </p>
              {acceptingLog.designatedIncomingAgentName && (
                <p className="text-amber-800 dark:text-amber-300 font-medium">
                  Designado para assumir:{' '}
                  <strong className="text-amber-950 dark:text-amber-100 font-bold">{acceptingLog.designatedIncomingAgentName}</strong>
                </p>
              )}
              <p className="text-slate-500 dark:text-slate-400">
                Assinando o recebimento agora:{' '}
                <strong className="text-blue-700 dark:text-blue-300 font-bold">{user?.name || acceptingLog.designatedIncomingAgentName || 'Agente Entrante'}</strong>
              </p>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] mt-1.5 bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-800">
                "{acceptingLog.description}"
              </p>
            </div>

            {/* Checklist de Conferência do Agente Entrante */}
            <form onSubmit={handleConfirmAcceptance} className="space-y-3.5 mt-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider">
                    Checklist Obrigatório de Conferência do Posto
                  </p>
                  <span className="text-[10px] text-slate-400">
                    * Itens obrigatórios para validação
                  </span>
                </div>

                {(() => {
                  const relevantItems = checklistItems.filter(
                    (it) => it.isActive && (!it.condoId || it.condoId === acceptingLog.condoId)
                  );

                  if (relevantItems.length > 0) {
                    return (
                      <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60 max-h-60 overflow-y-auto">
                        {relevantItems.map((item, index) => (
                          <label
                            key={item.id}
                            className="flex items-start gap-2.5 p-2 bg-white dark:bg-slate-900/60 rounded-lg border border-slate-200/80 dark:border-slate-800 cursor-pointer hover:border-blue-400 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={Boolean(dynamicChecklistResponses[item.id])}
                              onChange={(e) =>
                                setDynamicChecklistResponses((prev) => ({
                                  ...prev,
                                  [item.id]: e.target.checked,
                                }))
                              }
                              className="w-4 h-4 text-blue-600 rounded mt-0.5"
                            />
                            <div className="flex-1">
                              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                                {index + 1}. {item.title}{' '}
                                {item.isRequired && <span className="text-rose-500 font-bold">*</span>}
                              </span>
                              {item.description && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                                  {item.description}
                                </span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-700/60">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={checklist.keysReceived}
                          onChange={(e) => setChecklist({ ...checklist, keysReceived: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                          required
                        />
                        <span>1. Chaves da portaria e claviculário conferidos na íntegra *</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={checklist.radiosOk}
                          onChange={(e) => setChecklist({ ...checklist, radiosOk: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                          required
                        />
                        <span>2. Rádios comunicadores HT testados com áudio nítido e baterias ok *</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={checklist.patrolStickOk}
                          onChange={(e) => setChecklist({ ...checklist, patrolStickOk: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                          required
                        />
                        <span>3. Bastão de ronda e leitor eletrônico iButton recebidos em ordem *</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={checklist.stationClean}
                          onChange={(e) => setChecklist({ ...checklist, stationClean: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                          required
                        />
                        <span>4. Guarita / posto de trabalho limpo, organizado e livros em dia *</span>
                      </label>

                      <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800 dark:text-slate-200">
                        <input
                          type="checkbox"
                          checked={checklist.noPendingIssues}
                          onChange={(e) => setChecklist({ ...checklist, noPendingIssues: e.target.checked })}
                          className="w-4 h-4 text-blue-600 rounded"
                          required
                        />
                        <span>5. Ciente de encomendas pendentes e orientações do turno anterior *</span>
                      </label>
                    </div>
                  );
                })()}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações / Ressalvas do Entrante (opcional)
                </label>
                <textarea
                  rows={2}
                  value={incomingNotes}
                  onChange={(e) => setIncomingNotes(e.target.value)}
                  placeholder="Ex: Tudo recebido em ordem, apenas rádio 03 deixado carregando..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              {/* Identificação do Agente Autenticado */}
              <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="text-[10px] text-blue-700 dark:text-blue-300 font-semibold uppercase">
                    Assinatura Digital do Agente Entrante
                  </p>
                  <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                    {user?.name || 'Agente de Portaria Conectado'}
                  </p>
                </div>
                <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full">
                  Identidade Verificada
                </span>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAcceptingLog(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isAcceptingSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isAcceptingSubmitting ? 'Salvando...' : 'Confirmar & Assinar Recebimento'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Registro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-5 sm:p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  Novo Registro no Livro de Turno / Ocorrências
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-700 dark:text-rose-300">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5 mt-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Agente Responsável *
                  </label>
                  <input
                    type="text"
                    value={agentName}
                    onChange={(e) => isManager && setAgentName(e.target.value)}
                    readOnly={!isManager}
                    className={`w-full px-3 py-2 rounded-xl border text-slate-900 dark:text-white ${
                      !isManager
                        ? 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 cursor-not-allowed font-semibold'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                    }`}
                    required
                  />
                  {!isManager && (
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold mt-1 block">
                      🔒 Agente Autenticado
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Turno do Agente *
                  </label>
                  <select
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="dia">Diurno (06h - 18h)</option>
                    <option value="noite">Noturno (18h - 06h)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo do Registro *
                  </label>
                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  >
                    <option value="passagem_turno">Passagem de Turno</option>
                    <option value="ronda_preventiva">Ronda Preventiva</option>
                    <option value="vistoria_supervisor">Vistoria de Supervisão</option>
                    <option value="ocorrencia_posto">Ocorrência no Posto</option>
                  </select>
                </div>
              </div>

              {/* QUEM IRÁ RECEBER O SERVIÇO (Passagem de Turno) */}
              {logType === 'passagem_turno' && (
                <div className="p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-xs text-amber-950 dark:text-amber-200 flex items-center gap-1.5">
                      <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>Quem irá receber o serviço? (Agente Entrante) *</span>
                    </label>
                    <span className="text-[10px] bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                      <BellRing className="w-3 h-3 text-amber-600 animate-bounce" />
                      <span>Aviso Automático no Painel</span>
                    </span>
                  </div>

                  <p className="text-[11px] text-amber-900/80 dark:text-amber-300">
                    Selecione o profissional que está assumindo o posto agora. <strong>Ele receberá um aviso prioritário no painel dele</strong> com o checklist obrigatório para conferir chaves, rádios e assinar o recebimento.
                  </p>

                  <select
                    value={designatedIncomingAgentName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDesignatedIncomingAgentName(val);
                      const match = agents.find((a) => a.name === val);
                      setDesignatedIncomingAgentId(match ? match.id : undefined);
                    }}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-slate-900 dark:text-white font-medium text-xs focus:ring-2 focus:ring-amber-500"
                    required
                  >
                    <option value="">-- Selecione quem irá receber o serviço --</option>
                    {agents.map((ag) => (
                      <option key={ag.id} value={ag.name}>
                        {ag.name} {ag.badgeNumber ? `(${ag.badgeNumber})` : ''} - {ag.assignedStation || 'Portaria Principal'}
                      </option>
                    ))}
                  </select>

                  {/* Card Preview do Agente Entrante Selecionado */}
                  {(() => {
                    const selectedIncoming = agents.find((a) => a.name === designatedIncomingAgentName);
                    if (!selectedIncoming) return null;
                    return (
                      <div className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-900/90 rounded-lg border border-amber-200/80 dark:border-amber-800 text-xs">
                        <div className="flex items-center gap-2.5">
                          {selectedIncoming.photoUrl ? (
                            <img
                              src={selectedIncoming.photoUrl}
                              alt={selectedIncoming.name}
                              className="w-8 h-8 rounded-full object-cover border border-amber-300 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-amber-600 text-white font-bold flex items-center justify-center text-xs shrink-0">
                              {selectedIncoming.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white leading-tight">
                              {selectedIncoming.name}
                            </p>
                            <p className="text-[10px] text-slate-500 dark:text-slate-400">
                              {selectedIncoming.badgeNumber ? `Crachá: ${selectedIncoming.badgeNumber} • ` : ''}
                              {selectedIncoming.assignedStation || 'Portaria Principal'}
                            </p>
                          </div>
                        </div>
                        {selectedIncoming.phone && (
                          <WhatsAppButton
                            phone={selectedIncoming.phone}
                            name={selectedIncoming.name}
                            badgeOnly
                            customMessage={`Olá ${selectedIncoming.name}, estou passando o serviço do posto para você no sistema NOVA BRASIL.`}
                          />
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data do Fato *
                  </label>
                  <input
                    type="text"
                    value={logDate}
                    onChange={(e) => setLogDate(maskDate(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Horário *
                  </label>
                  <input
                    type="text"
                    value={logTime}
                    onChange={(e) => setLogTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título do Registro *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Passagem de Turno sem Alterações, Lâmpada do Bloco B Queimada..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Relato Operacional Detalhado *
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o que ocorreu no posto ou as condições de entrega da guarita..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Providências Adotadas (opcional)
                </label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="Ex: Comunicado ao síndico via WhatsApp, acionado técnico de portão..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Solicitação de Alteração ou Exclusão pelo Agente */}
      {requestChangeModalLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
                  <FileEdit className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Solicitar Alteração / Exclusão
                  </h3>
                  <p className="text-xs text-slate-400">
                    O livro de ocorrências é um documento oficial. Seu pedido será analisado pela gestão.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRequestChangeModalLog(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Informações do Registro Atual */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
              <p className="font-bold text-slate-900 dark:text-white">
                Registro: {requestChangeModalLog.title}
              </p>
              <p className="text-slate-500">
                Posto: {requestChangeModalLog.condoName || 'Posto Geral'} · Data: {requestChangeModalLog.logDate} às {requestChangeModalLog.logTime}
              </p>
              <p className="text-slate-600 dark:text-slate-400 italic line-clamp-2 mt-1">
                "{requestChangeModalLog.description}"
              </p>
            </div>

            {requestFeedback && (
              <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-xs">
                {requestFeedback}
              </div>
            )}

            <form onSubmit={handleSubmitChangeRequest} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                  Tipo de Solicitação *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRequestType('alteracao')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      requestType === 'alteracao'
                        ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-600 text-blue-700 dark:text-blue-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    ✏️ Solicitar Correção / Edição
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                      Para corrigir dados ou relatar fatos adicionais
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequestType('exclusao')}
                    className={`p-2.5 rounded-xl border text-left font-bold transition-all cursor-pointer ${
                      requestType === 'exclusao'
                        ? 'bg-rose-50 dark:bg-rose-950/60 border-rose-600 text-rose-700 dark:text-rose-300'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    🗑️ Solicitar Exclusão do Registro
                    <span className="block text-[10px] font-normal text-slate-500 mt-0.5">
                      Para registros lançados em duplicidade ou incorretos
                    </span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 dark:text-slate-200 mb-1">
                  O que deve ser alterado e qual o motivo? *
                </label>
                <textarea
                  rows={4}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Descreva detalhadamente o que precisa ser corrigido (ex: 'O horário correto foi 14:30 e não 15:30', ou 'Registro duplicado com o anterior')..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRequestChangeModalLog(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isRequestSubmitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isRequestSubmitting ? 'Enviando...' : 'Enviar Solicitação ao Gestor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edição de Registro pelo Gestor */}
      {isEditModalOpen && editingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Editar Registro (Painel do Gestor)
                  </h3>
                  <p className="text-xs text-slate-400">Correção e aprovação de apontamentos do posto</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingLog(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editingLog.changeRequest && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl text-xs space-y-1">
                <p className="font-bold text-amber-900 dark:text-amber-200">
                  Solicitação do Agente ({editingLog.changeRequest.requestedBy}):
                </p>
                <p className="text-slate-700 dark:text-slate-300 italic">
                  "{editingLog.changeRequest.reason}"
                </p>
              </div>
            )}

            <form onSubmit={handleSaveEditAsManager} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Título do Registro *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Relato Operacional *
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Providências Adotadas
                </label>
                <input
                  type="text"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data
                  </label>
                  <input
                    type="text"
                    value={logDate}
                    onChange={(e) => setLogDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Horário
                  </label>
                  <input
                    type="text"
                    value={logTime}
                    onChange={(e) => setLogTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingLog(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: CRUD do Checklist Obrigatório de Conferência do Posto */}
      {isChecklistModalOpen && (
        <PostChecklistManagementModal
          isOpen={isChecklistModalOpen}
          onClose={() => setIsChecklistModalOpen(false)}
          condominiums={condominiums}
          items={checklistItems}
          onSaveItem={onSaveChecklistItem || (async () => false)}
          onDeleteItem={onDeleteChecklistItem || (async () => false)}
          onToggleActive={onToggleChecklistActive || (async () => false)}
          onResetDefaults={onResetDefaultChecklist}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-5 text-center">
            <Trash2 className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h4 className="font-bold text-slate-900 dark:text-white text-base">Excluir Registro?</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Esta ação removerá este relato do histórico do livro de ocorrências.
            </p>
            <div className="flex items-center justify-center gap-2 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await onDeleteLog(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Sim, Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
