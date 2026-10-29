import React, { useState } from 'react';
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
} from 'lucide-react';
import { OperationalLog, Condominium, SecurityAgent } from '../types/index.ts';
import { maskDate } from '../utils/masks.ts';

interface OperationalLogsViewProps {
  logs: OperationalLog[];
  condominiums: Condominium[];
  agents: SecurityAgent[];
  selectedCondoId: number | 'all';
  onAddLog: (log: Omit<OperationalLog, 'id' | 'createdAt'>) => Promise<boolean>;
  onDeleteLog: (id: number) => Promise<boolean>;
}

export const OperationalLogsView: React.FC<OperationalLogsViewProps> = ({
  logs,
  condominiums,
  agents,
  selectedCondoId,
  onAddLog,
  onDeleteLog,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [condoId, setCondoId] = useState<number | ''>(
    selectedCondoId !== 'all' ? selectedCondoId : (condominiums[0]?.id || '')
  );
  const [agentName, setAgentName] = useState('');
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

  const openAddModal = () => {
    setCondoId(selectedCondoId !== 'all' ? selectedCondoId : (condominiums[0]?.id || ''));
    setAgentName(agents[0]?.name || 'Agente de Portaria');
    setShiftType('dia');
    setLogType('passagem_turno');
    setSeverity('informativa');
    setStatus('resolvida');
    setTitle('Passagem de Turno - Sem Alterações');
    setDescription(
      'Turno assumido no posto com todos os materiais conferidos (rádios HT, bastão de vigia e chaves da portaria). Perímetro do condomínio normal.'
    );
    setActionTaken('');
    setLogDate(new Date().toLocaleDateString('pt-BR'));
    setLogTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agentName.trim()) {
      setErrorMessage('Informe o nome do agente responsável pelo registro.');
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
      const payload = {
        condoId: condoId ? Number(condoId) : null,
        condoName: selectedCondo?.name || 'Posto Geral',
        agentName: agentName.trim(),
        shiftType,
        logType,
        severity,
        status,
        title: title.trim(),
        description: description.trim(),
        actionTaken: actionTaken.trim() || null,
        logDate: logDate.trim(),
        logTime: logTime.trim(),
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
      return matchTitle || matchAgent || matchCondo || matchDesc;
    }
    return true;
  });

  const getLogTypeBadge = (type: OperationalLog['logType']) => {
    switch (type) {
      case 'passagem_turno':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <RotateCw className="w-3 h-3" />
            Passagem de Turno
          </span>
        );
      case 'ronda_preventiva':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Shield className="w-3 h-3" />
            Ronda Preventiva
          </span>
        );
      case 'vistoria_supervisor':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <UserCheck className="w-3 h-3" />
            Vistoria de Supervisão
          </span>
        );
      case 'ocorrencia_posto':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3" />
            Ocorrência no Posto
          </span>
        );
    }
  };

  const getSeverityBadge = (sev: OperationalLog['severity']) => {
    switch (sev) {
      case 'informativa':
        return <span className="text-[11px] font-medium text-slate-500">Informativa</span>;
      case 'baixa':
        return <span className="text-[11px] font-medium text-blue-600">Gravidade Baixa</span>;
      case 'media':
        return <span className="text-[11px] font-medium text-amber-600 font-semibold">Gravidade Média</span>;
      case 'alta':
      case 'grave':
        return <span className="text-[11px] font-medium text-rose-600 font-bold">ALERTA / GRAVE</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
            <FileText className="w-6 h-6 text-blue-600" />
            <span>Livro de Ocorrências & Passagem de Turno</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Registro diário de passagem de serviço dos agentes de portaria, vistorias de supervisão e rondas da empresa.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Registrar Passagem / Ocorrência
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ocorrência, agente, condomínio ou relato..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">Nenhum registro operacional encontrado</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            {searchTerm || typeFilter !== 'all' || severityFilter !== 'all'
              ? 'Tente ajustar os filtros ou termo de busca acima.'
              : 'Registre a primeira passagem de turno ou relatório de ronda dos seus agentes.'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Registrar Primeira Ocorrência
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <div
              key={log.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-200 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {getLogTypeBadge(log.logType)}
                  <span className="font-semibold text-slate-900 text-sm">{log.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{log.logDate}</span>
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{log.logTime}</span>
                  </div>
                  {getSeverityBadge(log.severity)}
                </div>
              </div>

              <div className="mt-3 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                {log.description}
              </div>

              {log.actionTaken && (
                <div className="mt-3 p-2.5 bg-blue-50/70 border border-blue-100 rounded-lg text-xs text-blue-900">
                  <strong className="block font-semibold">Providência Adotada:</strong>
                  <p className="mt-0.5">{log.actionTaken}</p>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-4 flex-wrap">
                  <span className="flex items-center gap-1 font-medium text-slate-900">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    {log.condoName || 'Posto Geral'}
                  </span>
                  <span className="flex items-center gap-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    Agente: <strong>{log.agentName}</strong> ({log.shiftType === 'dia' ? 'Diurno' : 'Noturno'})
                  </span>
                </div>

                <button
                  onClick={() => setDeleteConfirmId(log.id)}
                  className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                  title="Excluir Registro"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Novo Registro */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-lg">
                  Novo Registro no Livro de Turno / Ocorrências
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Condomínio / Posto *
                  </label>
                  <select
                    value={condoId}
                    onChange={(e) => setCondoId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Posto Geral / Ronda Regional</option>
                    {condominiums.map((condo) => (
                      <option key={condo.id} value={condo.id}>
                        {condo.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tipo de Registro *
                  </label>
                  <select
                    value={logType}
                    onChange={(e) => setLogType(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="passagem_turno">Passagem de Turno</option>
                    <option value="ronda_preventiva">Ronda Preventiva</option>
                    <option value="vistoria_supervisor">Vistoria de Supervisão</option>
                    <option value="ocorrencia_posto">Ocorrência no Posto</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Turno *
                  </label>
                  <select
                    value={shiftType}
                    onChange={(e) => setShiftType(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="dia">Diurno (Dia)</option>
                    <option value="noite">Noturno (Noite)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Agente ou Supervisor Responsável *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Agente Carlos Silva ou Supervisor Roberto"
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data (DD/MM/AAAA) *
                  </label>
                  <input
                    type="text"
                    required
                    value={logDate}
                    onChange={(e) => setLogDate(maskDate(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Horário (HH:MM) *
                  </label>
                  <input
                    type="text"
                    required
                    value={logTime}
                    onChange={(e) => setLogTime(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Título do Registro *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Passagem de Turno das 18h - Sem Alterações"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Gravidade / Nível de Atenção
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="informativa">Informativa (Normal / Rotina)</option>
                    <option value="baixa">Baixa (Pequena observação)</option>
                    <option value="media">Média (Atenção ao próximo turno)</option>
                    <option value="alta">Alta / Grave (Notificar gerência/supervisor)</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Relato Operacional Detalhado *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Descreva as condições da guarita, equipamentos, rondas realizadas, portões testados..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Providência Adotada / Orientação ao Próximo Turno
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Verificado portão dos fundos e orientado vigia noturno sobre o evento..."
                    value={actionTaken}
                    onChange={(e) => setActionTaken(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Salvando...' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação Exclusão */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Remover Registro?</h3>
            <p className="text-slate-500 text-xs mt-1">
              Esta ação removerá este lançamento do livro de ocorrências.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await onDeleteLog(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
