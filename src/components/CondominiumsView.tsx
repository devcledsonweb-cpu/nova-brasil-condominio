import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Condominium, ServiceStation, SecurityAgent } from '../types/index.ts';
import { maskCNPJ, maskCEP, maskPhone, cleanDigits } from '../utils/masks.ts';
import { fetchAddressByCep } from '../services/cep.ts';
import { safeFetchJson } from '../services/api.ts';
import { PhotoField } from './PhotoField.tsx';
import {
  Building2,
  Plus,
  Search,
  MapPin,
  Users,
  Layers,
  Home,
  UserCheck,
  Phone,
  Mail,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  ArrowRight,
  Shield,
  Briefcase,
  UserPlus,
  X,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface CondominiumsViewProps {
  condominiums: Condominium[];
  agents?: SecurityAgent[];
  selectedCondoId: number | 'all';
  onSelectCondo: (id: number | 'all') => void;
  onRefresh: () => Promise<void>;
  onNavigateToTab: (tab: string) => void;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

export const CondominiumsView: React.FC<CondominiumsViewProps> = ({
  condominiums,
  agents = [],
  selectedCondoId,
  onSelectCondo,
  onRefresh,
  onNavigateToTab,
  getAuthHeaders,
}) => {
  const { user, role } = useAuth();
  const isSuperAdmin = role === 'sindico' || role === 'admin';
  const isSupervisor = role === 'supervisor';

  const userAssignedIds: number[] = Array.isArray(user?.condoIds) && user.condoIds.length > 0
    ? user.condoIds
    : (user?.condoId ? [user.condoId] : []);

  const accessibleCondominiums = isSuperAdmin || userAssignedIds.length === 0
    ? condominiums
    : condominiums.filter((c) => userAssignedIds.includes(c.id));

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCondo, setEditingCondo] = useState<Condominium | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Postos de Serviço Modal State
  const [managingStationsCondo, setManagingStationsCondo] = useState<Condominium | null>(null);
  const [newStationName, setNewStationName] = useState('');
  const [newStationType, setNewStationType] = useState<NonNullable<ServiceStation['type']>>('portaria_principal');
  const [newStationShift, setNewStationShift] = useState('12x36 Diurno (06h às 18h)');
  const [newStationAgentId, setNewStationAgentId] = useState<string>('');
  const [newStationInstructions, setNewStationInstructions] = useState('');
  const [stationsFeedback, setStationsFeedback] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    address: '',
    city: '',
    state: 'SP',
    zipCode: '',
    supervisorName: '',
    supervisorPhone: '',
    contractType: 'Portaria 24h + Ronda Noturna',
    totalUnits: 0,
    sindicoName: '',
    sindicoPhone: '',
    sindicoEmail: '',
    status: 'ativo',
    imageUrl: '',
  });

  const [isSearchingCep, setIsSearchingCep] = useState(false);
  const [cepFeedback, setCepFeedback] = useState<string>('');

  const lookupCep = async (digits: string) => {
    if (digits.length !== 8) return;
    setIsSearchingCep(true);
    setCepFeedback('Buscando endereço via CEP...');
    try {
      const res = await fetchAddressByCep(digits);
      if (res.success) {
        setFormData((prev) => ({
          ...prev,
          address: res.fullAddress || prev.address,
          city: res.city || prev.city,
          state: res.state || prev.state,
        }));
        setCepFeedback('Endereço preenchido automaticamente (você pode alterá-lo livremente).');
      } else {
        setCepFeedback(res.error || 'CEP não localizado. Preencha manualmente.');
      }
    } catch {
      setCepFeedback('Não foi possível consultar o CEP no momento. Preencha manualmente.');
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleCepInputChange = (rawVal: string) => {
    const masked = maskCEP(rawVal);
    setFormData((prev) => ({ ...prev, zipCode: masked }));
    const digits = cleanDigits(rawVal);
    if (digits.length === 8) {
      lookupCep(digits);
    } else {
      setCepFeedback('');
    }
  };

  const openAddModal = () => {
    setEditingCondo(null);
    setFormData({
      name: '',
      cnpj: '',
      address: '',
      city: '',
      state: 'SP',
      zipCode: '',
      supervisorName: '',
      supervisorPhone: '',
      contractType: 'Portaria 24h + Ronda Noturna',
      totalUnits: 0,
      sindicoName: '',
      sindicoPhone: '',
      sindicoEmail: '',
      status: 'ativo',
      imageUrl: '',
    });
    setErrorMsg('');
    setCepFeedback('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (condo: Condominium) => {
    setEditingCondo(condo);
    setFormData({
      name: condo.name,
      cnpj: condo.cnpj ? maskCNPJ(condo.cnpj) : '',
      address: condo.address || '',
      city: condo.city || '',
      state: condo.state || 'SP',
      zipCode: condo.zipCode ? maskCEP(condo.zipCode) : '',
      supervisorName: condo.supervisorName || '',
      supervisorPhone: condo.supervisorPhone ? maskPhone(condo.supervisorPhone) : '',
      contractType: condo.contractType || 'Portaria 24h + Ronda Noturna',
      totalUnits: condo.totalUnits || 0,
      sindicoName: condo.sindicoName || '',
      sindicoPhone: condo.sindicoPhone ? maskPhone(condo.sindicoPhone) : '',
      sindicoEmail: condo.sindicoEmail || '',
      status: condo.status || 'ativo',
      imageUrl: condo.imageUrl || '',
    });
    setErrorMsg('');
    setCepFeedback('');
    setIsAddModalOpen(true);
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrorMsg('O nome do condomínio é obrigatório.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const headers = await getAuthHeaders();
      const url = editingCondo ? `/api/condominiums/${editingCondo.id}` : '/api/condominiums';
      const method = editingCondo ? 'PUT' : 'POST';

      // 1. Tentar salvar no servidor backend
      let savedCondo: any = null;
      try {
        const result = await safeFetchJson(url, {
          method,
          headers,
          body: JSON.stringify({
            ...formData,
            totalUnits: Number(formData.totalUnits) || 0,
          }),
        });

        if (result.success && result.data) {
          savedCondo = result.data;
        }
      } catch (e) {
        console.warn('Backend indisponível, sincronizando localmente:', e);
      }

      // 2. Sincronizar e salvar localmente para garantir persistência mesmo em Vercel ou conexão instável
      const localCondosStr = localStorage.getItem('novabrasil_condos');
      let localCondos: Condominium[] = localCondosStr
        ? JSON.parse(localCondosStr)
        : [...condominiums];

      if (editingCondo) {
        localCondos = localCondos.map((c) =>
          c.id === editingCondo.id
            ? {
                ...c,
                name: formData.name.trim(),
                cnpj: formData.cnpj || null,
                address: formData.address || null,
                city: formData.city || null,
                state: formData.state || 'SP',
                zipCode: formData.zipCode || null,
                totalUnits: Number(formData.totalUnits) || 0,
                supervisorName: formData.supervisorName?.trim() || formData.sindicoName?.trim() || null,
                supervisorPhone: formData.supervisorPhone?.trim() || formData.sindicoPhone?.trim() || null,
                contractType: formData.contractType?.trim() || 'Portaria 24h + Ronda Noturna',
                sindicoName: formData.supervisorName?.trim() || formData.sindicoName || null,
                sindicoPhone: formData.supervisorPhone?.trim() || formData.sindicoPhone || null,
                sindicoEmail: formData.contractType?.trim() || formData.sindicoEmail || 'Portaria 24h + Ronda Noturna',
                status: (formData.status as 'ativo' | 'implantacao' | 'inativo') || 'ativo',
                imageUrl: formData.imageUrl?.trim() || c.imageUrl || null,
                serviceStations: c.serviceStations || [],
              }
            : c
        );
      } else {
        const newCondo: Condominium = savedCondo || {
          id: Date.now(),
          name: formData.name.trim(),
          cnpj: formData.cnpj || null,
          address: formData.address || null,
          city: formData.city || null,
          state: formData.state || 'SP',
          zipCode: formData.zipCode || null,
          totalUnits: Number(formData.totalUnits) || 0,
          supervisorName: formData.supervisorName?.trim() || formData.sindicoName?.trim() || null,
          supervisorPhone: formData.supervisorPhone?.trim() || formData.sindicoPhone?.trim() || null,
          contractType: formData.contractType?.trim() || 'Portaria 24h + Ronda Noturna',
          agentsCount: 0,
          vehiclesCount: 0,
          assetsCount: 0,
          maintenancesCount: 0,
          sindicoName: formData.supervisorName?.trim() || formData.sindicoName || null,
          sindicoPhone: formData.supervisorPhone?.trim() || formData.sindicoPhone || null,
          sindicoEmail: formData.contractType?.trim() || formData.sindicoEmail || 'Portaria 24h + Ronda Noturna',
          status: (formData.status as 'ativo' | 'implantacao' | 'inativo') || 'ativo',
          imageUrl: formData.imageUrl?.trim() || null,
          serviceStations: [
            {
              id: `st-${Date.now()}-1`,
              condoId: Date.now(),
              name: 'Portaria Principal (Social)',
              type: 'portaria_principal',
              shiftSchedule: '12x36 Diurno (06h às 18h)',
              assignedAgentName: null,
            },
            {
              id: `st-${Date.now()}-2`,
              condoId: Date.now(),
              name: 'Área de Lazer / Piscina',
              type: 'area_lazer',
              shiftSchedule: '12x36 Diurno',
              assignedAgentName: null,
            },
          ],
          createdAt: new Date().toISOString(),
        };
        localCondos.push(newCondo);
      }

      localStorage.setItem('novabrasil_condos', JSON.stringify(localCondos));

      // 3. Atualizar dados na interface
      try {
        await onRefresh();
      } catch (e) {
        console.warn('Erro ao atualizar lista de condomínios:', e);
      }

      setIsAddModalOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado ao salvar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (condo: Condominium) => {
    if (
      !confirm(
        `Tem certeza que deseja excluir o condomínio "${condo.name}"? Todos os blocos, apartamentos, moradores e dados vinculados serão excluídos permanentemente.`
      )
    ) {
      return;
    }

    try {
      const headers = await getAuthHeaders();
      try {
        await safeFetchJson(`/api/condominiums/${condo.id}`, {
          method: 'DELETE',
          headers,
        });
      } catch (e) {
        console.warn('API indisponível, deletando localmente:', e);
      }

      // Remover do localStorage
      const localCondosStr = localStorage.getItem('novabrasil_condos');
      if (localCondosStr) {
        const localCondos = JSON.parse(localCondosStr).filter((c: any) => c.id !== condo.id);
        localStorage.setItem('novabrasil_condos', JSON.stringify(localCondos));
      }

      if (selectedCondoId === condo.id) {
        onSelectCondo('all');
      }
      await onRefresh();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir condomínio.');
    }
  };

  // --- GERENCIAMENTO DE POSTOS DE SERVIÇO ---
  const openStationsModal = (condo: Condominium) => {
    setManagingStationsCondo(condo);
    setNewStationName('');
    setNewStationType('portaria_principal');
    setNewStationShift('12x36 Diurno (06h às 18h)');
    setNewStationAgentId('');
    setNewStationInstructions('');
    setStationsFeedback('');
  };

  const handleAddServiceStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managingStationsCondo) return;
    if (!newStationName.trim()) {
      setStationsFeedback('Informe o nome do posto de serviço.');
      return;
    }

    const assignedAgent = agents.find((a) => String(a.id) === String(newStationAgentId));

    const newStation: ServiceStation = {
      id: `st-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      condoId: managingStationsCondo.id,
      name: newStationName.trim(),
      type: newStationType,
      shiftSchedule: newStationShift.trim() || '12x36 Diurno',
      assignedAgentId: assignedAgent ? assignedAgent.id : null,
      assignedAgentName: assignedAgent ? assignedAgent.name : null,
      instructions: newStationInstructions.trim() || null,
    };

    const updatedStations = [...(managingStationsCondo.serviceStations || []), newStation];

    // Atualiza condomínio no storage
    const localCondosStr = localStorage.getItem('novabrasil_condos');
    let localCondos: Condominium[] = localCondosStr
      ? JSON.parse(localCondosStr)
      : [...condominiums];

    localCondos = localCondos.map((c) =>
      c.id === managingStationsCondo.id ? { ...c, serviceStations: updatedStations } : c
    );
    localStorage.setItem('novabrasil_condos', JSON.stringify(localCondos));

    // Se um agente foi escalado, sincroniza no cadastro do agente
    if (assignedAgent) {
      const localAgentsStr = localStorage.getItem('novabrasil_agents');
      if (localAgentsStr) {
        const localAgents: SecurityAgent[] = JSON.parse(localAgentsStr);
        const updatedAgents = localAgents.map((ag) =>
          ag.id === assignedAgent.id
            ? {
                ...ag,
                assignedStation: newStation.name,
                assignedStationId: newStation.id,
              }
            : ag
        );
        localStorage.setItem('novabrasil_agents', JSON.stringify(updatedAgents));
      }
    }

    setManagingStationsCondo({ ...managingStationsCondo, serviceStations: updatedStations });
    setNewStationName('');
    setNewStationInstructions('');
    setNewStationAgentId('');
    setStationsFeedback('Posto de serviço adicionado e agente escalado!');
    await onRefresh();
  };

  const handleRemoveStation = async (stationId: string) => {
    if (!managingStationsCondo) return;
    const updatedStations = (managingStationsCondo.serviceStations || []).filter(
      (s) => s.id !== stationId
    );

    const localCondosStr = localStorage.getItem('novabrasil_condos');
    let localCondos: Condominium[] = localCondosStr
      ? JSON.parse(localCondosStr)
      : [...condominiums];

    localCondos = localCondos.map((c) =>
      c.id === managingStationsCondo.id ? { ...c, serviceStations: updatedStations } : c
    );
    localStorage.setItem('novabrasil_condos', JSON.stringify(localCondos));

    setManagingStationsCondo({ ...managingStationsCondo, serviceStations: updatedStations });
    setStationsFeedback('Posto de serviço removido.');
    await onRefresh();
  };

  const handleQuickReassign = async (stationId: string, agentIdStr: string) => {
    if (!managingStationsCondo) return;
    const assignedAgent = agents.find((a) => String(a.id) === String(agentIdStr));

    const updatedStations = (managingStationsCondo.serviceStations || []).map((s) => {
      if (s.id === stationId) {
        return {
          ...s,
          assignedAgentId: assignedAgent ? assignedAgent.id : null,
          assignedAgentName: assignedAgent ? assignedAgent.name : null,
        };
      }
      return s;
    });

    const localCondosStr = localStorage.getItem('novabrasil_condos');
    let localCondos: Condominium[] = localCondosStr
      ? JSON.parse(localCondosStr)
      : [...condominiums];

    localCondos = localCondos.map((c) =>
      c.id === managingStationsCondo.id ? { ...c, serviceStations: updatedStations } : c
    );
    localStorage.setItem('novabrasil_condos', JSON.stringify(localCondos));

    // Sincroniza também no storage dos agentes
    if (assignedAgent) {
      const station = updatedStations.find((s) => s.id === stationId);
      const localAgentsStr = localStorage.getItem('novabrasil_agents');
      if (localAgentsStr) {
        const localAgents: SecurityAgent[] = JSON.parse(localAgentsStr);
        const updatedAgents = localAgents.map((ag) =>
          ag.id === assignedAgent.id
            ? {
                ...ag,
                assignedStation: station?.name || null,
                assignedStationId: station?.id || null,
              }
            : ag
        );
        localStorage.setItem('novabrasil_agents', JSON.stringify(updatedAgents));
      }
    }

    setManagingStationsCondo({ ...managingStationsCondo, serviceStations: updatedStations });
    setStationsFeedback('Escala do posto atualizada com sucesso!');
    await onRefresh();
  };

  const filteredCondos = accessibleCondominiums.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.sindicoName && c.sindicoName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.cnpj && c.cnpj.includes(searchTerm));
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Postos & Condomínios Atendidos
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-600 text-white font-mono">
              {accessibleCondominiums.length} {accessibleCondominiums.length === 1 ? 'posto' : 'postos'}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gestão dos condomínios clientes atendidos pela NOVA BRASIL, com supervisão, escopo de contrato e controle das guarnições.
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer shrink-0 min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Condomínio / Posto</span>
          </button>
        )}
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar posto por nome, cidade, CNPJ ou supervisor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:border-blue-600 cursor-pointer min-h-[38px]"
        >
          <option value="all">Todos os Status</option>
          <option value="ativo">Apenas Ativos</option>
          <option value="implantacao">Em Implantação</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>

      {/* Grid de Condomínios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
        {filteredCondos.map((condo) => {
          const isSelected = selectedCondoId === condo.id;

          return (
            <div
              key={condo.id}
              className={`bg-white dark:bg-slate-900 border rounded-xl overflow-hidden transition-all shadow-xs flex flex-col justify-between group ${
                isSelected
                  ? 'border-blue-600 dark:border-blue-500 ring-2 ring-blue-600/20 dark:ring-blue-500/30'
                  : 'border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              {/* Foto da Fachada do Condomínio (visível a todos) */}
              {condo.imageUrl ? (
                <div className="h-32 w-full overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                  <img
                    src={condo.imageUrl}
                    alt={condo.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white">
                    <span className="text-[10px] font-semibold bg-black/40 backdrop-blur-xs px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-blue-300" />
                      {condo.contractType || 'Posto Operacional'}
                    </span>
                    <span
                      className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                        condo.status === 'ativo'
                          ? 'bg-emerald-500/90 text-white'
                          : condo.status === 'implantacao'
                          ? 'bg-amber-500/90 text-white'
                          : 'bg-slate-600 text-white'
                      }`}
                    >
                      {condo.status === 'ativo' ? 'Ativo' : condo.status === 'implantacao' ? 'Implantação' : 'Inativo'}
                    </span>
                  </div>
                </div>
              ) : null}

              <div className="p-4 sm:p-5 space-y-3.5">
                {/* Header do Card (quando não tem foto ou título) */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!condo.imageUrl && (
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <Building2 className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight truncate">
                          {condo.name}
                        </h3>
                        {condo.cnpj && (
                          <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            CNPJ: {maskCNPJ(condo.cnpj)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {!condo.imageUrl && (
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full shrink-0 ${
                        condo.status === 'ativo'
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900'
                          : condo.status === 'implantacao'
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {condo.status === 'ativo'
                        ? 'Ativo'
                        : condo.status === 'implantacao'
                        ? 'Implantação'
                        : 'Inativo'}
                    </span>
                  )}
                </div>

                {/* Endereço */}
                {(condo.address || condo.city) && (
                  <div className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">
                      {[
                        condo.address,
                        condo.city,
                        condo.state,
                        condo.zipCode ? `CEP ${maskCEP(condo.zipCode)}` : '',
                      ]
                        .filter(Boolean)
                        .join(' - ')}
                    </span>
                  </div>
                )}

                {/* Postos de Serviço do Condomínio (Portaria Principal, Lazer, etc.) */}
                <div className="p-2.5 sm:p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Postos de Serviço ({condo.serviceStations?.length || 0})
                    </span>
                    {(isSuperAdmin || isSupervisor) && (
                      <button
                        type="button"
                        onClick={() => openStationsModal(condo)}
                        className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                      >
                        Gerenciar / Escalar →
                      </button>
                    )}
                  </div>

                  {condo.serviceStations && condo.serviceStations.length > 0 ? (
                    <div className="space-y-1.5 pt-0.5">
                      {condo.serviceStations.slice(0, 3).map((st) => (
                        <div
                          key={st.id}
                          className="flex items-center justify-between text-[11px] bg-white dark:bg-slate-800 px-2 py-1.5 rounded-lg border border-slate-200/70 dark:border-slate-700/60"
                        >
                          <div className="min-w-0 pr-1">
                            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                              📍 {st.name}
                            </span>
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                              {st.shiftSchedule || 'Escala padrão'}
                            </span>
                          </div>

                          {st.assignedAgentName ? (
                            <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 shrink-0 ml-1">
                              👤 {st.assignedAgentName}
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900 shrink-0 ml-1">
                              Posto vago
                            </span>
                          )}
                        </div>
                      ))}

                      {condo.serviceStations.length > 3 && (
                        <button
                          type="button"
                          onClick={() => openStationsModal(condo)}
                          className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 block text-center w-full pt-0.5 font-medium cursor-pointer"
                        >
                          + Ver mais {condo.serviceStations.length - 3} postos deste condomínio
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 py-1 flex items-center justify-between">
                      <span>Nenhum posto cadastrado ainda.</span>
                      {(isSuperAdmin || isSupervisor) && (
                        <button
                          type="button"
                          onClick={() => openStationsModal(condo)}
                          className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
                        >
                          + Criar postos
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Informações de Contrato e Supervisão da Empresa */}
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/60 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5 truncate">
                      <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                      {condo.contractType || 'Portaria 24h + Ronda Noturna'}
                    </span>
                  </div>
                  {condo.supervisorName && (
                    <div className="flex items-center justify-between text-[11px] text-blue-800 dark:text-blue-300 pt-1 border-t border-blue-100/60 dark:border-blue-900/40">
                      <span>Supervisor: <strong>{condo.supervisorName}</strong></span>
                      {condo.supervisorPhone && <span className="font-mono">{condo.supervisorPhone}</span>}
                    </div>
                  )}
                </div>

                {/* Métricas Operacionais do Condomínio */}
                <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                  <div
                    onClick={() => {
                      onSelectCondo(condo.id);
                      onNavigateToTab('agentes');
                    }}
                    className="p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg cursor-pointer transition-colors border border-slate-100 dark:border-slate-800"
                    title="Ver Agentes de Portaria neste condomínio"
                  >
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Agentes</p>
                    <p className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono mt-0.5">
                      {condo.agentsCount ?? 0}
                    </p>
                  </div>
                  <div
                    onClick={() => {
                      onSelectCondo(condo.id);
                      onNavigateToTab('ronda');
                    }}
                    className="p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-lg cursor-pointer transition-colors border border-slate-100 dark:border-slate-800"
                    title="Ver Veículos de Ronda neste condomínio"
                  >
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Rondas</p>
                    <p className="text-xs font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                      {condo.vehiclesCount ?? 0}
                    </p>
                  </div>
                  <div
                    onClick={() => {
                      onSelectCondo(condo.id);
                      onNavigateToTab('patrimonio');
                    }}
                    className="p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg cursor-pointer transition-colors border border-slate-100 dark:border-slate-800"
                    title="Ver Materiais da Empresa neste condomínio"
                  >
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Materiais</p>
                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                      {condo.assetsCount ?? 0}
                    </p>
                  </div>
                  <div
                    onClick={() => {
                      onSelectCondo(condo.id);
                      onNavigateToTab('manutencoes');
                    }}
                    className="p-2 bg-slate-50 dark:bg-slate-800/60 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg cursor-pointer transition-colors border border-slate-100 dark:border-slate-800"
                    title="Ver Manutenções da Empresa neste condomínio"
                  >
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">O.S.</p>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                      {condo.maintenancesCount ?? 0}
                    </p>
                  </div>
                </div>

                {/* Contato no Cliente (Síndico/Administração) */}
                {condo.sindicoName && (
                  <div className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200 truncate">
                      <UserCheck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">Contato: {condo.sindicoName}</span>
                    </div>
                    {condo.sindicoPhone && (
                      <span className="text-slate-500 dark:text-slate-400 font-mono shrink-0 ml-1">{condo.sindicoPhone}</span>
                    )}
                  </div>
                )}
              </div>

              {/* Ações do Card */}
              <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {(isSuperAdmin || isSupervisor) && (
                    <button
                      onClick={() => openEditModal(condo)}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Editar Posto"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {isSuperAdmin && (
                    <button
                      onClick={() => handleDelete(condo)}
                      className="p-2 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                      title="Excluir Posto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectCondo(condo.id);
                      onNavigateToTab('agentes');
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer min-h-[36px] ${
                      isSelected
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span>{isSelected ? 'Selecionado' : 'Operação'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCondos.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
          <Building2 className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Nenhum condomínio encontrado</p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastre o primeiro condomínio atendido pela empresa para alocar agentes, veículos e materiais.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Condomínio</span>
          </button>
        </div>
      )}

      {/* Modal Adicionar / Editar Condomínio */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-150 transition-colors">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingCondo ? 'Editar Posto / Condomínio' : 'Novo Condomínio da Empresa'}
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="m-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs text-rose-800 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Condomínio / Posto *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Residencial Parque dos Pássaros"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    CNPJ do Condomínio
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    maxLength={18}
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Status Operacional
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600 cursor-pointer"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="implantacao">Em Implantação</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Foto da Fachada do Condomínio (visível a todos) */}
              <PhotoField
                label="Foto da Fachada / Entrada do Condomínio"
                value={formData.imageUrl}
                onChange={(url) => setFormData({ ...formData, imageUrl: url })}
                type="condo"
                helperText="A foto ficará visível para toda a equipe no painel e na identificação do condomínio."
              />

              {/* Seção de Endereço com Busca Automática por CEP */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    Localização & Endereço
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">
                    CEP preenche automático e permite edição
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      CEP (00000-000)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="00000-000"
                        maxLength={9}
                        value={formData.zipCode}
                        onChange={(e) => handleCepInputChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600 font-mono"
                      />
                      {isSearchingCep && (
                        <div className="absolute right-2.5 top-2.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Cidade</label>
                    <input
                      type="text"
                      placeholder="São Paulo"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Estado (UF)</label>
                    <input
                      type="text"
                      placeholder="SP"
                      maxLength={2}
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600 uppercase font-mono"
                    />
                  </div>
                </div>

                {cepFeedback && (
                  <p
                    className={`text-[11px] leading-tight flex items-center gap-1 ${
                      cepFeedback.includes('preenchido')
                        ? 'text-emerald-700 dark:text-emerald-400 font-medium'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {cepFeedback.includes('preenchido') && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                    {cepFeedback}
                  </p>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Logradouro, Bairro e Número (Editável)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Contrato e Supervisão Operacional da Empresa */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Contrato & Supervisão da Empresa Terceirizada
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Tipo de Contrato / Escopo Contratado
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Portaria 24h + Ronda Noturna Motorizada"
                      value={formData.contractType}
                      onChange={(e) => setFormData({ ...formData, contractType: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Supervisor Operacional (Empresa)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: Supervisor Roberto Alves"
                        value={formData.supervisorName}
                        onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Telefone do Supervisor
                      </label>
                      <input
                        type="text"
                        placeholder="(11) 98888-8888"
                        maxLength={15}
                        value={formData.supervisorPhone}
                        onChange={(e) => setFormData({ ...formData, supervisorPhone: maskPhone(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Contato no Cliente (Síndico / Administradora)
                </p>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Nome do Síndico / Gestor do Condomínio
                    </label>
                    <input
                      type="text"
                      placeholder="Nome completo do responsável no condomínio"
                      value={formData.sindicoName}
                      onChange={(e) => setFormData({ ...formData, sindicoName: e.target.value })}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="text"
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                        value={formData.sindicoPhone}
                        onChange={(e) => setFormData({ ...formData, sindicoPhone: maskPhone(e.target.value) })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        E-mail de Contato
                      </label>
                      <input
                        type="email"
                        placeholder="sindico@condominio.com"
                        value={formData.sindicoEmail}
                        onChange={(e) => setFormData({ ...formData, sindicoEmail: e.target.value })}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer min-h-[38px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50 cursor-pointer flex items-center gap-2 shadow-xs min-h-[38px]"
                >
                  {isSubmitting ? 'Salvando...' : editingCondo ? 'Atualizar Dados' : 'Cadastrar Condomínio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Gerenciar Postos de Serviço e Escalar Agentes */}
      {managingStationsCondo && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in zoom-in duration-150 transition-colors">
            {/* Header do Modal */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    Postos de Serviço & Escala de Agentes
                  </h2>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Condomínio: <strong>{managingStationsCondo.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setManagingStationsCondo(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-6">
              {stationsFeedback && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 rounded-xl text-xs text-blue-800 dark:text-blue-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{stationsFeedback}</span>
                  </div>
                  <button
                    onClick={() => setStationsFeedback('')}
                    className="text-blue-500 hover:text-blue-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Formulário: Criar Novo Posto */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-blue-600" />
                    Criar Novo Posto de Serviço
                  </h3>
                  <span className="text-[10px] text-slate-500">Ex: Portaria Principal, Área de Lazer</span>
                </div>

                {/* Sugestões Rápidas de Nomes de Postos */}
                <div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mb-1.5">
                    Sugestões rápidas de postos frequentes:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { name: 'Portaria Principal (Social)', type: 'portaria_principal' },
                      { name: 'Portaria de Serviços & Cargas', type: 'portaria_servico' },
                      { name: 'Área de Lazer & Piscinas', type: 'area_lazer' },
                      { name: 'Garagem Subterrânea & Estacionamento', type: 'garagem' },
                      { name: 'Ronda Noturna Perimetral', type: 'ronda_perimetro' },
                    ].map((sug, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setNewStationName(sug.name);
                          setNewStationType(sug.type as any);
                        }}
                        className="text-[10px] px-2.5 py-1 rounded-md bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                      >
                        + {sug.name}
                      </button>
                    ))}
                  </div>
                </div>

                <form onSubmit={handleAddServiceStation} className="space-y-3 pt-1">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Nome do Posto *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Portaria Principal (Guarita 01)"
                        value={newStationName}
                        onChange={(e) => setNewStationName(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Tipo de Posto
                      </label>
                      <select
                        value={newStationType}
                        onChange={(e) => setNewStationType(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600 cursor-pointer"
                      >
                        <option value="portaria_principal">Portaria Principal / Social</option>
                        <option value="portaria_servico">Portaria de Serviços & Cargas</option>
                        <option value="area_lazer">Área de Lazer / Clube / Piscinas</option>
                        <option value="garagem">Garagens & Subsolos</option>
                        <option value="ronda_perimetro">Ronda Perimetral / Muros</option>
                        <option value="outro">Outro Posto Operacional</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Escala / Horário de Funcionamento
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 12x36 Diurno (06h às 18h)"
                        value={newStationShift}
                        onChange={(e) => setNewStationShift(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Escalar Agente no Posto (Opcional)
                      </label>
                      <select
                        value={newStationAgentId}
                        onChange={(e) => setNewStationAgentId(e.target.value)}
                        className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600 cursor-pointer"
                      >
                        <option value="">Nenhum agente no momento (Vago)</option>
                        {agents.map((ag) => (
                          <option key={ag.id} value={ag.id}>
                            👤 {ag.name} ({ag.badgeNumber} - {ag.shift})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Instruções Especiais / Rotina do Posto
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Exigir documento com foto de prestadores de serviço e anunciar entregas."
                      value={newStationInstructions}
                      onChange={(e) => setNewStationInstructions(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:border-blue-600"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs flex items-center gap-1.5 min-h-[38px]"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Cadastrar Posto & Salvar Escala
                    </button>
                  </div>
                </form>
              </div>

              {/* Lista dos Postos Existentes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-slate-500" />
                    Postos Cadastrados no Condomínio ({managingStationsCondo.serviceStations?.length || 0})
                  </h3>
                  <span className="text-[11px] text-slate-500">
                    O agente escalado visualiza seu posto diretamente no seu painel
                  </span>
                </div>

                {(!managingStationsCondo.serviceStations || managingStationsCondo.serviceStations.length === 0) ? (
                  <div className="text-center py-8 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 p-4">
                    <Briefcase className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Nenhum posto de serviço criado para este condomínio.
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Utilize o formulário acima para cadastrar portarias, áreas de lazer, guaritas e rondas.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {managingStationsCondo.serviceStations.map((station) => (
                      <div
                        key={station.id}
                        className="p-3.5 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              🏢 {station.name}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                              {station.shiftSchedule || 'Escala padrão'}
                            </span>
                          </div>

                          {station.instructions && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                              "{station.instructions}"
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-xs pt-0.5">
                            <span className="text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                              Agente escalado:
                            </span>
                            {station.assignedAgentName ? (
                              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[11px]">
                                <UserCheck className="w-3 h-3" />
                                {station.assignedAgentName}
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400 text-[11px] font-medium">
                                Nenhum agente escalado
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Reatribuir rápido ou Excluir */}
                        <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-700/60">
                          <select
                            value={station.assignedAgentId ? String(station.assignedAgentId) : ''}
                            onChange={(e) => handleQuickReassign(station.id, e.target.value)}
                            className="text-[11px] px-2 py-1.5 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 cursor-pointer max-w-[170px] truncate"
                            title="Alterar agente escalado neste posto"
                          >
                            <option value="">Trocar / Vago</option>
                            {agents.map((ag) => (
                              <option key={ag.id} value={ag.id}>
                                {ag.name}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            onClick={() => handleRemoveStation(station.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                            title="Excluir este posto"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setManagingStationsCondo(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 text-white rounded-lg text-xs font-semibold cursor-pointer min-h-[38px]"
              >
                Concluir & Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
