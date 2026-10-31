import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { PhotoField } from './PhotoField.tsx';
import {
  ShieldCheck,
  Plus,
  Search,
  Filter,
  Phone,
  Calendar,
  IdCard,
  Edit2,
  Trash2,
  Building2,
  Clock,
  UserCheck,
  UserX,
  AlertCircle,
  X,
  CheckCircle2,
  KeyRound,
  Eye,
  EyeOff,
  CheckSquare,
  Square,
  Briefcase,
} from 'lucide-react';
import { SecurityAgent, Condominium } from '../types/index.ts';
import { maskCPF, maskPhone, maskDate } from '../utils/masks.ts';

interface AgentsViewProps {
  agents: SecurityAgent[];
  condominiums: Condominium[];
  selectedCondoId: number | 'all';
  onAddAgent: (agent: Omit<SecurityAgent, 'id' | 'createdAt'>) => Promise<boolean>;
  onUpdateAgent: (id: number, agent: Partial<SecurityAgent>) => Promise<boolean>;
  onDeleteAgent: (id: number) => Promise<boolean>;
  onSelectCondo?: (id: number | 'all') => void;
}

export const AgentsView: React.FC<AgentsViewProps> = ({
  agents,
  condominiums,
  selectedCondoId,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent,
  onSelectCondo,
}) => {
  const { role } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<SecurityAgent | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Form State: Multi-Condomínio & Foto & Posto
  const [selectedCondoIds, setSelectedCondoIds] = useState<number[]>(
    selectedCondoId !== 'all' ? [Number(selectedCondoId)] : (condominiums.length > 0 ? [condominiums[0].id] : [])
  );
  const [name, setName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [assignedStation, setAssignedStation] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [roleTitle, setRoleTitle] = useState<SecurityAgent['roleTitle']>('agente_portaria');
  const [shift, setShift] = useState<SecurityAgent['shift']>('12x36_dia');
  const [status, setStatus] = useState<SecurityAgent['status']>('em_servico');
  const [admissionDate, setAdmissionDate] = useState('');
  const [notes, setNotes] = useState('');

  // Acesso ao sistema (Gestão de Usuários)
  const [createAccess, setCreateAccess] = useState(true);
  const [accessEmail, setAccessEmail] = useState('');
  const [accessPassword, setAccessPassword] = useState('Portaria@123');
  const [showAccessPassword, setShowAccessPassword] = useState(false);
  const [isEmailManuallyEdited, setIsEmailManuallyEdited] = useState(false);

  const suggestEmail = (agentName: string) => {
    if (!agentName.trim()) return '';
    const clean = agentName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/);
    if (clean.length === 1) {
      return `${clean[0]}@novabrasil.com`;
    }
    return `${clean[0]}.${clean[clean.length - 1]}@novabrasil.com`;
  };

  const openAddModal = () => {
    setEditingAgent(null);
    setSelectedCondoIds(
      selectedCondoId !== 'all' ? [Number(selectedCondoId)] : (condominiums.length > 0 ? [condominiums[0].id] : [])
    );
    setName('');
    setPhotoUrl('');
    setAssignedStation('Portaria Principal (Social)');
    setCpf('');
    setPhone('');
    setBadgeNumber(`AG-${Math.floor(1000 + Math.random() * 9000)}`);
    setRoleTitle('agente_portaria');
    setShift('12x36_dia');
    setStatus('em_servico');
    setAdmissionDate(new Date().toLocaleDateString('pt-BR'));
    setNotes('');
    setCreateAccess(true);
    setAccessEmail('');
    setAccessPassword('Portaria@123');
    setShowAccessPassword(false);
    setIsEmailManuallyEdited(false);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (agent: SecurityAgent) => {
    setEditingAgent(agent);
    const existingIds = Array.isArray(agent.condoIds) && agent.condoIds.length > 0
      ? agent.condoIds
      : (agent.condoId ? [agent.condoId] : []);
    setSelectedCondoIds(existingIds);
    setName(agent.name);
    setPhotoUrl(agent.photoUrl || '');
    setAssignedStation(agent.assignedStation || '');
    setCpf(agent.cpf ? maskCPF(agent.cpf) : '');
    setPhone(maskPhone(agent.phone));
    setBadgeNumber(agent.badgeNumber);
    setRoleTitle(agent.roleTitle);
    setShift(agent.shift);
    setStatus(agent.status);
    setAdmissionDate(agent.admissionDate ? maskDate(agent.admissionDate) : '');
    setNotes(agent.notes || '');
    setCreateAccess(false);
    setAccessEmail(agent.accessEmail || suggestEmail(agent.name));
    setAccessPassword('Portaria@123');
    setShowAccessPassword(false);
    setIsEmailManuallyEdited(false);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const toggleCondoSelection = (id: number) => {
    setSelectedCondoIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllCondos = () => {
    if (selectedCondoIds.length === condominiums.length) {
      setSelectedCondoIds([]);
    } else {
      setSelectedCondoIds(condominiums.map((c) => c.id));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Por favor, informe o nome completo do agente.');
      return;
    }
    if (!badgeNumber.trim()) {
      setErrorMessage('Informe a matrícula ou número do crachá.');
      return;
    }
    if (!phone.trim()) {
      setErrorMessage('Informe o telefone ou WhatsApp de contato.');
      return;
    }

    if (createAccess) {
      if (!accessEmail.trim()) {
        setErrorMessage('Informe o e-mail de login para gerar acesso ao sistema.');
        return;
      }
      if (!accessPassword.trim()) {
        setErrorMessage('Informe a senha inicial de acesso.');
        return;
      }
      if (accessPassword.trim().length < 6) {
        setErrorMessage('A senha de acesso deve ter pelo menos 6 caracteres.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const selectedCondos = condominiums.filter((c) => selectedCondoIds.includes(c.id));
      const condoNames = selectedCondos.map((c) => c.name);
      const primaryCondoId = selectedCondoIds.length > 0 ? selectedCondoIds[0] : null;
      const condoName = condoNames.length > 1
        ? `${condoNames[0]} (+${condoNames.length - 1} postos)`
        : (condoNames[0] || 'Posto Geral / Volante');

      const payload: any = {
        condoId: primaryCondoId,
        condoIds: selectedCondoIds,
        condoName,
        condoNames,
        name: name.trim(),
        photoUrl: photoUrl.trim() || null,
        assignedStation: assignedStation.trim() || null,
        cpf: cpf.trim() || null,
        phone: phone.trim(),
        badgeNumber: badgeNumber.trim().toUpperCase(),
        roleTitle,
        shift,
        status,
        admissionDate: admissionDate.trim() || null,
        notes: notes.trim() || null,
        createAccess,
        accessEmail: createAccess ? accessEmail.trim().toLowerCase() : undefined,
        accessPassword: createAccess ? accessPassword.trim() : undefined,
      };

      let success = false;
      if (editingAgent) {
        success = await onUpdateAgent(editingAgent.id, payload);
      } else {
        success = await onAddAgent(payload);
      }

      if (success) {
        setIsModalOpen(false);
        setSuccessBanner(`Agente "${name.trim()}" salvo com sucesso!`);
        if (
          selectedCondoId !== 'all' &&
          primaryCondoId &&
          Number(primaryCondoId) !== Number(selectedCondoId) &&
          !selectedCondoIds.includes(Number(selectedCondoId))
        ) {
          if (onSelectCondo) {
            onSelectCondo(primaryCondoId || 'all');
          }
        }
      } else {
        setErrorMessage('Falha ao salvar agente. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar dados do agente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentCondo =
    selectedCondoId === 'all'
      ? null
      : condominiums.find((c) => Number(c.id) === Number(selectedCondoId));

  const filteredAgents = agents.filter((ag) => {
    if (selectedCondoId !== 'all') {
      const matchPrimary = ag.condoId != null && Number(ag.condoId) === Number(selectedCondoId);
      const matchArray = Array.isArray(ag.condoIds) && ag.condoIds.some((id) => Number(id) === Number(selectedCondoId));
      const isGeneralPost = (ag.condoId == null || ag.condoId === 0) && (!ag.condoIds || ag.condoIds.length === 0);
      if (!matchPrimary && !matchArray && !isGeneralPost) {
        return false;
      }
    }
    if (roleFilter !== 'all' && ag.roleTitle !== roleFilter) {
      return false;
    }
    if (statusFilter !== 'all' && ag.status !== statusFilter) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = ag.name?.toLowerCase().includes(term);
      const matchBadge = ag.badgeNumber?.toLowerCase().includes(term);
      const matchCondo =
        ag.condoName?.toLowerCase().includes(term) ||
        (ag.condoNames && ag.condoNames.some((cn) => cn.toLowerCase().includes(term)));
      const matchPhone = ag.phone?.includes(term);
      return matchName || matchBadge || matchCondo || matchPhone;
    }
    return true;
  });

  const getRoleLabel = (role: SecurityAgent['roleTitle']) => {
    switch (role) {
      case 'agente_portaria':
        return 'Agente de Portaria';
      case 'ronda_motorizada':
        return 'Ronda Motorizada';
      case 'fiscal_piso':
        return 'Fiscal de Posto';
      case 'lider_posto':
        return 'Líder de Posto';
      case 'zelador_operacional':
        return 'Zelador Operacional';
      default:
        return role;
    }
  };

  const getShiftLabel = (shift: SecurityAgent['shift']) => {
    switch (shift) {
      case '12x36_dia':
        return '12x36 Diurno (06h às 18h)';
      case '12x36_noite':
        return '12x36 Noturno (18h às 06h)';
      case '6x1':
        return '6x1 Comercial';
      case 'folguista':
        return 'Folguista / Reserva Técnica';
      default:
        return shift;
    }
  };

  const getStatusIndicator = (status: SecurityAgent['status']) => {
    switch (status) {
      case 'em_servico':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Em Serviço
          </span>
        );
      case 'folga':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            Em Folga
          </span>
        );
      case 'ferias':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Férias
          </span>
        );
      case 'afastado':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Afastado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xl">
            <ShieldCheck className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            <span>Agentes de Portaria & Equipe Operacional</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gestão dos colaboradores da empresa terceirizada com opção de geração automática de login e acesso ao sistema.
          </p>
        </div>

        {role !== 'portaria' && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Agente de Portaria
          </button>
        )}
      </div>

      {/* Success Notification Banner */}
      {successBanner && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in transition-colors">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-medium">{successBanner}</span>
          </div>
          <button
            onClick={() => setSuccessBanner('')}
            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-100 p-1 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Active Condo Filter Notice */}
      {selectedCondoId !== 'all' && (
        <div className="p-3 bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors">
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
            <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <span>
              Filtrando agentes do posto: <strong>{currentCondo?.name || `Condomínio #${selectedCondoId}`}</strong>
              {' '}({filteredAgents.length} {filteredAgents.length === 1 ? 'agente exibido' : 'agentes exibidos'})
            </span>
          </div>
          <button
            type="button"
            onClick={() => onSelectCondo && onSelectCondo('all')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1 self-start sm:self-auto"
          >
            Exibir todos os {agents.length} agentes da empresa →
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Agentes</p>
            {selectedCondoId !== 'all' && (
              <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Posto Ativo
              </span>
            )}
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {filteredAgents.length}
            </p>
            {selectedCondoId !== 'all' && (
              <span className="text-xs text-slate-400 dark:text-slate-500">
                de {agents.length} na empresa
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
            {selectedCondoId !== 'all'
              ? `Alocados em ${currentCondo?.name || 'posto selecionado'}`
              : 'Equipe total cadastrada na empresa'}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Em Serviço Agora</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {filteredAgents.filter((a) => a.status === 'em_servico').length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Escalados no posto</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Em Folga</p>
          <p className="text-2xl font-bold text-slate-700 dark:text-slate-300 mt-1">
            {filteredAgents.filter((a) => a.status === 'folga').length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Escala de descanso</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Rondas Motorizadas</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {filteredAgents.filter((a) => a.roleTitle === 'ronda_motorizada').length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Vigilantes rondantes</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, crachá, condomínio ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Posto:</span>
          </div>

          <select
            value={selectedCondoId === 'all' ? 'all' : String(selectedCondoId)}
            onChange={(e) => {
              const val = e.target.value;
              if (onSelectCondo) onSelectCondo(val === 'all' ? 'all' : Number(val));
            }}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
            title="Selecionar posto para visualizar colaboradores"
          >
            <option value="all">🏢 Todos os Postos ({agents.length} agentes)</option>
            {condominiums.map((c) => {
              const count = agents.filter((a) => Number(a.condoId) === Number(c.id)).length;
              return (
                <option key={c.id} value={c.id}>
                  📍 {c.name} ({count} {count === 1 ? 'agente' : 'agentes'})
                </option>
              );
            })}
          </select>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Cargos</option>
            <option value="agente_portaria">Agente de Portaria</option>
            <option value="ronda_motorizada">Ronda Motorizada</option>
            <option value="fiscal_piso">Fiscal de Posto</option>
            <option value="lider_posto">Líder de Posto</option>
            <option value="zelador_operacional">Zelador Operacional</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="em_servico">Em Serviço</option>
            <option value="folga">Folga</option>
            <option value="ferias">Férias</option>
            <option value="afastado">Afastado</option>
          </select>
        </div>
      </div>

      {/* Agents List / Grid */}
      {filteredAgents.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 sm:p-12 text-center shadow-xs">
          <ShieldCheck className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Nenhum agente encontrado</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md mx-auto">
            {selectedCondoId !== 'all' && agents.length > 0
              ? `Nenhum agente alocado no posto "${currentCondo?.name}". Existem ${agents.length} colaboradores cadastrados em outros postos da sua empresa.`
              : searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Tente ajustar os filtros ou termo de busca acima.'
              : 'Cadastre o primeiro colaborador da sua empresa alocado aos condomínios.'}
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            {selectedCondoId !== 'all' && agents.length > 0 && (
              <button
                type="button"
                onClick={() => onSelectCondo && onSelectCondo('all')}
                className="px-4 py-2 min-h-[44px] bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Ver Todos os {agents.length} Agentes da Empresa
              </button>
            )}
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Agente de Portaria
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-blue-300 dark:hover:border-blue-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Foto do Agente (visível para todos) */}
                    {agent.photoUrl ? (
                      <img
                        src={agent.photoUrl}
                        alt={agent.name}
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold flex items-center justify-center text-sm border border-blue-200 dark:border-blue-900 shrink-0">
                        {agent.name
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-semibold text-slate-900 dark:text-white text-base leading-tight truncate">
                        {agent.name}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">
                          {agent.badgeNumber}
                        </span>
                        <span>·</span>
                        <span className="font-medium text-blue-600 dark:text-blue-400 truncate">
                          {getRoleLabel(agent.roleTitle)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>{getStatusIndicator(agent.status)}</div>
                </div>

                {/* Posto de Serviço Escalado (visível para todos e no painel do agente) */}
                {agent.assignedStation && (
                  <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg border border-emerald-200 dark:border-emerald-900/60 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="font-medium truncate">
                      Posto Escalado: <strong>{agent.assignedStation}</strong>
                    </span>
                  </div>
                )}

                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-xs font-semibold">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      <span>Condomínio(s) Vinculado(s):</span>
                    </div>
                    <div className="flex flex-wrap gap-1 pl-5">
                      {agent.condoNames && agent.condoNames.length > 0 ? (
                        agent.condoNames.map((cName, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                          >
                            {cName}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200">
                          {agent.condoName || 'Posto Geral / Reserva Técnica'}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{getShiftLabel(agent.shift)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{agent.phone}</span>
                  </div>

                  {agent.cpf && (
                    <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                      <IdCard className="w-3.5 h-3.5 shrink-0" />
                      <span>CPF: {maskCPF(agent.cpf)}</span>
                    </div>
                  )}

                  {agent.notes && (
                    <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed italic border border-slate-100 dark:border-slate-800">
                      "{agent.notes}"
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Admissão: {agent.admissionDate || 'N/I'}
                </span>
                {role !== 'portaria' && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(agent)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Editar Agente"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(agent.id)}
                      className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Excluir Agente"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-5 sm:p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  {editingAgent ? 'Editar Agente de Portaria' : 'Novo Agente de Portaria'}
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
              <div className="mt-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Condomínio(s) / Posto(s) Alocado(s) * ({selectedCondoIds.length} selecionado{selectedCondoIds.length !== 1 ? 's' : ''})
                  </label>
                  <button
                    type="button"
                    onClick={handleSelectAllCondos}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    {selectedCondoIds.length === condominiums.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                  Selecione um ou mais condomínios onde este agente atuará. O login dele terá acesso restrito apenas aos postos marcados:
                </p>
                <div className="max-h-36 overflow-y-auto space-y-1 border border-slate-200 dark:border-slate-700 rounded-lg p-2 bg-slate-50/50 dark:bg-slate-800/50">
                  {condominiums.map((condo) => {
                    const isChecked = selectedCondoIds.includes(condo.id);
                    return (
                      <div
                        key={condo.id}
                        onClick={() => toggleCondoSelection(condo.id)}
                        className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors border text-xs ${
                          isChecked
                            ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100 font-medium'
                            : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate">{condo.name}</span>
                        </div>
                        {condo.city && (
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                            {condo.city}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {condominiums.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-2">
                      Nenhum condomínio cadastrado na empresa.
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome Completo do Colaborador *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    value={name}
                    onChange={(e) => {
                      const val = e.target.value;
                      setName(val);
                      if (!isEmailManuallyEdited) {
                        setAccessEmail(suggestEmail(val));
                      }
                    }}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nº Crachá / Matrícula *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: AG-1042"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value.toUpperCase())}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-mono uppercase bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    CPF (000.000.000-00)
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(maskCPF(e.target.value))}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Admissão
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(maskDate(e.target.value))}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Função / Cargo no Posto *
                  </label>
                  <select
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="agente_portaria">Agente de Portaria</option>
                    <option value="ronda_motorizada">Ronda Motorizada</option>
                    <option value="fiscal_piso">Fiscal de Posto</option>
                    <option value="lider_posto">Líder de Posto</option>
                    <option value="zelador_operacional">Zelador Operacional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Escala de Trabalho *
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="12x36_dia">12x36 Diurno (06h às 18h)</option>
                    <option value="12x36_noite">12x36 Noturno (18h às 06h)</option>
                    <option value="6x1">6x1 Comercial</option>
                    <option value="folguista">Folguista / Reserva</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Operacional Atual *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="em_servico">Em Serviço no Posto</option>
                    <option value="folga">Escala de Folga</option>
                    <option value="ferias">Em Férias</option>
                    <option value="afastado">Afastado / Licença</option>
                  </select>
                </div>

                {/* Foto do Agente (visível para todos) */}
                <div className="sm:col-span-2">
                  <PhotoField
                    label="Foto do Agente / Colaborador"
                    value={photoUrl}
                    onChange={setPhotoUrl}
                    type="agent"
                    helperText="A foto ficará visível no crachá e nos registros operacionais para toda a equipe."
                  />
                </div>

                {/* Posto de Serviço Escalado */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Posto de Serviço Escalado *
                  </label>
                  <input
                    type="text"
                    list="stations-suggestions"
                    placeholder="Ex: Portaria Principal (Social), Área de Lazer, Garagem..."
                    value={assignedStation}
                    onChange={(e) => setAssignedStation(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <datalist id="stations-suggestions">
                    <option value="Portaria Principal (Social)" />
                    <option value="Portaria de Serviços & Entregas" />
                    <option value="Área de Lazer & Piscinas" />
                    <option value="Garagem Subterrânea & Subsolos" />
                    <option value="Ronda Noturna Perimetral" />
                    <option value="Guarita de Acesso Pedestres" />
                    <option value="Posto Geral / Reserva Técnica" />
                  </datalist>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    O agente escalado visualizará o posto em destaque no seu painel operacional.
                  </p>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Observações Operacionais (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Instruções de conduta, cursos, histórico no condomínio..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Seção Gerar Acesso ao Sistema e Sincronizar com Gestão de Usuários */}
                <div className="sm:col-span-2 p-3.5 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/60 space-y-3 transition-colors">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <KeyRound className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Gerar Acesso ao Sistema (Login do Operador)
                        </span>
                        <span className="text-[11px] text-slate-600 dark:text-slate-400">
                          Adiciona automaticamente este agente na tela de Gestão de Usuários
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={createAccess}
                        onChange={(e) => setCreateAccess(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-300 dark:bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {createAccess && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2.5 border-t border-blue-200/70 dark:border-blue-900/40">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          E-mail de Login *
                        </label>
                        <input
                          type="email"
                          required={createAccess}
                          placeholder="carlos.oliveira@novabrasil.com"
                          value={accessEmail}
                          onChange={(e) => {
                            setAccessEmail(e.target.value);
                            setIsEmailManuallyEdited(true);
                          }}
                          className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Senha Inicial *
                        </label>
                        <div className="relative">
                          <input
                            type={showAccessPassword ? 'text' : 'password'}
                            required={createAccess}
                            placeholder="Mínimo 6 caracteres"
                            value={accessPassword}
                            onChange={(e) => setAccessPassword(e.target.value)}
                            className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 pr-10 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowAccessPassword(!showAccessPassword)}
                            className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                          >
                            {showAccessPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-2 text-[11px] text-blue-800 dark:text-blue-300 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <span>O agente receberá permissão para registrar passagens de turno, rondas e visualizar materiais do posto.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium rounded-lg cursor-pointer min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50 min-h-[44px]"
                >
                  {isSubmitting ? 'Salvando...' : editingAgent ? 'Atualizar Agente' : 'Salvar Agente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Remover Agente?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Esta ação removerá o registro do colaborador do posto da sua empresa.
            </p>
            <div className="flex items-center justify-center gap-3 mt-5">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 min-h-[40px] border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await onDeleteAgent(deleteConfirmId);
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 min-h-[40px] bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
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
