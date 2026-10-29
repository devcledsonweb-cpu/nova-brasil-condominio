import React, { useState } from 'react';
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
}

export const AgentsView: React.FC<AgentsViewProps> = ({
  agents,
  condominiums,
  selectedCondoId,
  onAddAgent,
  onUpdateAgent,
  onDeleteAgent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<SecurityAgent | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [condoId, setCondoId] = useState<number | ''>(
    selectedCondoId !== 'all' ? selectedCondoId : (condominiums[0]?.id || '')
  );
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [phone, setPhone] = useState('');
  const [badgeNumber, setBadgeNumber] = useState('');
  const [roleTitle, setRoleTitle] = useState<SecurityAgent['roleTitle']>('agente_portaria');
  const [shift, setShift] = useState<SecurityAgent['shift']>('12x36_dia');
  const [status, setStatus] = useState<SecurityAgent['status']>('em_servico');
  const [admissionDate, setAdmissionDate] = useState('');
  const [notes, setNotes] = useState('');

  const openAddModal = () => {
    setEditingAgent(null);
    setCondoId(selectedCondoId !== 'all' ? selectedCondoId : (condominiums[0]?.id || ''));
    setName('');
    setCpf('');
    setPhone('');
    setBadgeNumber(`AG-${Math.floor(1000 + Math.random() * 9000)}`);
    setRoleTitle('agente_portaria');
    setShift('12x36_dia');
    setStatus('em_servico');
    setAdmissionDate(new Date().toLocaleDateString('pt-BR'));
    setNotes('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (agent: SecurityAgent) => {
    setEditingAgent(agent);
    setCondoId(agent.condoId || (condominiums[0]?.id || ''));
    setName(agent.name);
    setCpf(agent.cpf ? maskCPF(agent.cpf) : '');
    setPhone(maskPhone(agent.phone));
    setBadgeNumber(agent.badgeNumber);
    setRoleTitle(agent.roleTitle);
    setShift(agent.shift);
    setStatus(agent.status);
    setAdmissionDate(agent.admissionDate ? maskDate(agent.admissionDate) : '');
    setNotes(agent.notes || '');
    setErrorMessage('');
    setIsModalOpen(true);
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

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const selectedCondo = condominiums.find((c) => c.id === Number(condoId));
      const payload = {
        condoId: condoId ? Number(condoId) : null,
        condoName: selectedCondo?.name || 'Posto Geral',
        name: name.trim(),
        cpf: cpf.trim() || null,
        phone: phone.trim(),
        badgeNumber: badgeNumber.trim().toUpperCase(),
        roleTitle,
        shift,
        status,
        admissionDate: admissionDate.trim() || null,
        notes: notes.trim() || null,
      };

      let success = false;
      if (editingAgent) {
        success = await onUpdateAgent(editingAgent.id, payload);
      } else {
        success = await onAddAgent(payload);
      }

      if (success) {
        setIsModalOpen(false);
      } else {
        setErrorMessage('Falha ao salvar agente. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar dados do agente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAgents = agents.filter((ag) => {
    // Filtro por condomínio selecionado
    if (selectedCondoId !== 'all' && ag.condoId !== selectedCondoId) {
      return false;
    }
    // Filtro por cargo
    if (roleFilter !== 'all' && ag.roleTitle !== roleFilter) {
      return false;
    }
    // Filtro por status
    if (statusFilter !== 'all' && ag.status !== statusFilter) {
      return false;
    }
    // Busca por texto
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = ag.name.toLowerCase().includes(term);
      const matchBadge = ag.badgeNumber.toLowerCase().includes(term);
      const matchCondo = ag.condoName?.toLowerCase().includes(term);
      const matchPhone = ag.phone.includes(term);
      return matchName || matchBadge || matchCondo || matchPhone;
    }
    return true;
  });

  const getRoleBadge = (role: SecurityAgent['roleTitle']) => {
    switch (role) {
      case 'agente_portaria':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">Agente de Portaria</span>;
      case 'ronda_motorizada':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">Ronda Motorizada</span>;
      case 'fiscal_piso':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">Fiscal de Posto</span>;
      case 'lider_posto':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">Líder de Posto</span>;
      case 'zelador_operacional':
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">Zelador Operacional</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-50 text-slate-700 border border-slate-200">{role}</span>;
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

  const getStatusBadge = (status: SecurityAgent['status']) => {
    switch (status) {
      case 'em_servico':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Em Serviço no Posto
          </span>
        );
      case 'folga':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            Escala de Folga
          </span>
        );
      case 'ferias':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Em Férias
          </span>
        );
      case 'afastado':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Afastado
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-slate-900 font-bold text-xl">
            <ShieldCheck className="w-6 h-6 text-blue-600" />
            <span>Agentes de Portaria & Equipe Operacional</span>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Gestão dos colaboradores da empresa terceirizada alocados nos condomínios e postos de serviço.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Agente de Portaria
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Total de Agentes</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{filteredAgents.length}</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Equipe cadastrada</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-emerald-600">Em Serviço Agora</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">
            {filteredAgents.filter((a) => a.status === 'em_servico').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Escalados no posto</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-slate-500">Em Folga</p>
          <p className="text-2xl font-bold text-slate-700 mt-1">
            {filteredAgents.filter((a) => a.status === 'folga').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Escala de descanso</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <p className="text-xs font-medium text-amber-600">Rondas Motorizadas</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">
            {filteredAgents.filter((a) => a.roleTitle === 'ronda_motorizada').length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Vigilantes rondantes</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, crachá, condomínio ou telefone..."
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
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="text-xs border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <ShieldCheck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900">Nenhum agente de portaria encontrado</h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
              ? 'Tente ajustar os filtros ou termo de busca acima.'
              : 'Cadastre o primeiro colaborador da sua empresa alocado aos condomínios.'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeiro Agente
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <div
              key={agent.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-base">{agent.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                        Crachá: {agent.badgeNumber}
                      </span>
                      {getRoleBadge(agent.roleTitle)}
                    </div>
                  </div>
                  <div>{getStatusBadge(agent.status)}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-900 truncate">
                      {agent.condoName || 'Posto Geral / Volante'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Escala: {getShiftLabel(agent.shift)}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{agent.phone}</span>
                  </div>

                  {agent.cpf && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <IdCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>CPF: {maskCPF(agent.cpf)}</span>
                    </div>
                  )}

                  {agent.notes && (
                    <div className="mt-2 p-2 bg-slate-50 rounded text-slate-500 text-[11px] italic">
                      "{agent.notes}"
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Admissão: {agent.admissionDate || 'N/I'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(agent)}
                    className="p-1.5 hover:bg-slate-100 rounded text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                    title="Editar Agente"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(agent.id)}
                    className="p-1.5 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Excluir Agente"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full p-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-lg">
                  {editingAgent ? 'Editar Agente de Portaria' : 'Novo Agente de Portaria'}
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Condomínio / Posto Alocado *
                </label>
                <select
                  value={condoId}
                  onChange={(e) => setCondoId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Posto Geral / Reserva Técnica da Empresa</option>
                  {condominiums.map((condo) => (
                    <option key={condo.id} value={condo.id}>
                      {condo.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo do Colaborador *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Carlos Eduardo de Oliveira"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nº Crachá / Matrícula *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: AG-1042"
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value.toUpperCase())}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 font-mono uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    CPF (000.000.000-00)
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(maskCPF(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Data de Admissão (DD/MM/AAAA)
                  </label>
                  <input
                    type="text"
                    placeholder="01/03/2024"
                    value={admissionDate}
                    onChange={(e) => setAdmissionDate(maskDate(e.target.value))}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Função / Cargo no Posto *
                  </label>
                  <select
                    value={roleTitle}
                    onChange={(e) => setRoleTitle(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="agente_portaria">Agente de Portaria</option>
                    <option value="ronda_motorizada">Ronda Motorizada</option>
                    <option value="fiscal_piso">Fiscal de Posto</option>
                    <option value="lider_posto">Líder de Posto</option>
                    <option value="zelador_operacional">Zelador Operacional</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Escala de Trabalho *
                  </label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="12x36_dia">12x36 Diurno (06h às 18h)</option>
                    <option value="12x36_noite">12x36 Noturno (18h às 06h)</option>
                    <option value="6x1">6x1 Comercial</option>
                    <option value="folguista">Folguista / Reserva</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Status Operacional Atual *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="em_servico">Em Serviço no Posto</option>
                    <option value="folga">Escala de Folga</option>
                    <option value="ferias">Em Férias</option>
                    <option value="afastado">Afastado / Licença</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observações Operacionais (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Instruções de conduta, curso de CFTV, habilidades específicas..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
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
                  {isSubmitting ? 'Salvando...' : editingAgent ? 'Atualizar Agente' : 'Salvar Agente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Remover Agente?</h3>
            <p className="text-slate-500 text-xs mt-1">
              Esta ação removerá o registro do colaborador do posto da sua empresa.
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
                  await onDeleteAgent(deleteConfirmId);
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
