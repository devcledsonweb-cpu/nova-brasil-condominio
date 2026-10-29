import React, { useState } from 'react';
import { Condominium } from '../types/index.ts';
import { maskCNPJ, maskCEP, maskPhone, cleanDigits } from '../utils/masks.ts';
import { fetchAddressByCep } from '../services/cep.ts';
import { safeFetchJson } from '../services/api.ts';
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
} from 'lucide-react';

interface CondominiumsViewProps {
  condominiums: Condominium[];
  selectedCondoId: number | 'all';
  onSelectCondo: (id: number | 'all') => void;
  onRefresh: () => Promise<void>;
  onNavigateToTab: (tab: string) => void;
  getAuthHeaders: () => Promise<Record<string, string>>;
}

export const CondominiumsView: React.FC<CondominiumsViewProps> = ({
  condominiums,
  selectedCondoId,
  onSelectCondo,
  onRefresh,
  onNavigateToTab,
  getAuthHeaders,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCondo, setEditingCondo] = useState<Condominium | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    cnpj: '',
    address: '',
    city: '',
    state: 'SP',
    zipCode: '',
    totalUnits: 24,
    sindicoName: '',
    sindicoPhone: '',
    sindicoEmail: '',
    status: 'ativo',
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
      totalUnits: 24,
      sindicoName: '',
      sindicoPhone: '',
      sindicoEmail: '',
      status: 'ativo',
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
      totalUnits: condo.totalUnits || 0,
      sindicoName: condo.sindicoName || '',
      sindicoPhone: condo.sindicoPhone ? maskPhone(condo.sindicoPhone) : '',
      sindicoEmail: condo.sindicoEmail || '',
      status: condo.status || 'ativo',
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
                sindicoName: formData.sindicoName || null,
                sindicoPhone: formData.sindicoPhone || null,
                sindicoEmail: formData.sindicoEmail || null,
                status: (formData.status as 'ativo' | 'implantacao' | 'inativo') || 'ativo',
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
          blocksCount: 0,
          unitsCount: 0,
          residentsCount: 0,
          usersCount: 0,
          sindicoName: formData.sindicoName || null,
          sindicoPhone: formData.sindicoPhone || null,
          sindicoEmail: formData.sindicoEmail || null,
          status: (formData.status as 'ativo' | 'implantacao' | 'inativo') || 'ativo',
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

  const filteredCondos = condominiums.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.city && c.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.sindicoName && c.sindicoName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.cnpj && c.cnpj.includes(searchTerm));
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Gestão de Condomínios
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-900 text-white font-mono">
              {condominiums.length} {condominiums.length === 1 ? 'condomínio' : 'condomínios'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre novos condomínios, gerencie suas estruturas de blocos, apartamentos, moradores e equipe de portaria.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar Condomínio</span>
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar condomínio por nome, cidade, CNPJ ou síndico..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-slate-900"
        >
          <option value="all">Todos os Status</option>
          <option value="ativo">Apenas Ativos</option>
          <option value="implantacao">Em Implantação</option>
          <option value="inativo">Inativos</option>
        </select>
      </div>

      {/* Grid de Condomínios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCondos.map((condo) => {
          const isSelected = selectedCondoId === condo.id;

          return (
            <div
              key={condo.id}
              className={`bg-white border rounded-xl overflow-hidden transition-all shadow-xs flex flex-col justify-between ${
                isSelected
                  ? 'border-slate-900 ring-2 ring-slate-900/10'
                  : 'border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="p-5 space-y-4">
                {/* Header do Card */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-800 shrink-0">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-tight">
                          {condo.name}
                        </h3>
                        {condo.cnpj && (
                          <p className="text-[11px] text-slate-400 font-mono">
                            CNPJ: {maskCNPJ(condo.cnpj)}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                      condo.status === 'ativo'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : condo.status === 'implantacao'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {condo.status === 'ativo'
                      ? 'Ativo'
                      : condo.status === 'implantacao'
                      ? 'Implantação'
                      : 'Inativo'}
                  </span>
                </div>

                {/* Endereço */}
                {(condo.address || condo.city) && (
                  <div className="flex items-start gap-1.5 text-xs text-slate-600">
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

                {/* Métricas do Condomínio */}
                <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 text-center">
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-slate-500 font-medium">Blocos</p>
                    <p className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                      {condo.blocksCount ?? 0}
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-slate-500 font-medium">Aptos</p>
                    <p className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                      {condo.unitsCount ?? 0}
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-slate-500 font-medium">Moradores</p>
                    <p className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                      {condo.residentsCount ?? 0}
                    </p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg">
                    <p className="text-[10px] text-slate-500 font-medium">Equipe</p>
                    <p className="text-xs font-bold text-slate-900 font-mono mt-0.5">
                      {condo.usersCount ?? 0}
                    </p>
                  </div>
                </div>

                {/* Informações de Gestão */}
                {condo.sindicoName && (
                  <div className="p-2.5 bg-slate-50/70 rounded-lg border border-slate-100 text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-medium text-slate-800">
                      <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                      <span>Síndico: {condo.sindicoName}</span>
                    </div>
                    {condo.sindicoPhone && (
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Phone className="w-3 h-3" />
                        <span>{condo.sindicoPhone}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Ações do Card */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(condo)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white rounded-md transition-colors cursor-pointer"
                    title="Editar Condomínio"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(condo)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-white rounded-md transition-colors cursor-pointer"
                    title="Excluir Condomínio"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onSelectCondo(condo.id);
                      onNavigateToTab('estrutura');
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-slate-900 text-white hover:bg-slate-800'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>{isSelected ? 'Gerenciando Agora' : 'Acessar Condomínio'}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCondos.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">Nenhum condomínio encontrado</p>
          <p className="text-xs text-slate-500 mt-1">
            Cadastre o primeiro condomínio da empresa para iniciar a gestão de blocos e moradores.
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar Primeiro Condomínio</span>
          </button>
        </div>
      )}

      {/* Modal Adicionar / Editar Condomínio */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-slate-900">
                  {editingCondo ? 'Editar Condomínio' : 'Novo Condomínio da Empresa'}
                </h2>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="m-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome do Condomínio *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Residencial Parque dos Pássaros"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    CNPJ do Condomínio
                  </label>
                  <input
                    type="text"
                    placeholder="00.000.000/0001-00"
                    maxLength={18}
                    value={formData.cnpj}
                    onChange={(e) => setFormData({ ...formData, cnpj: maskCNPJ(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Status Operacional
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 bg-white"
                  >
                    <option value="ativo">Ativo</option>
                    <option value="implantacao">Em Implantação</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>

              {/* Seção de Endereço com Busca Automática por CEP */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-slate-600" />
                    Localização & Endereço
                  </span>
                  <span className="text-[11px] text-slate-500">
                    CEP preenche automático e permite edição
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      CEP (00000-000)
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="00000-000"
                        maxLength={9}
                        value={formData.zipCode}
                        onChange={(e) => handleCepInputChange(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono bg-white"
                      />
                      {isSearchingCep && (
                        <div className="absolute right-2.5 top-2.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Cidade</label>
                    <input
                      type="text"
                      placeholder="São Paulo"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 bg-white"
                    />
                  </div>

                  <div className="col-span-1">
                    <label className="block text-xs font-medium text-slate-700 mb-1">Estado (UF)</label>
                    <input
                      type="text"
                      placeholder="SP"
                      maxLength={2}
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 uppercase font-mono bg-white"
                    />
                  </div>
                </div>

                {cepFeedback && (
                  <p
                    className={`text-[11px] leading-tight flex items-center gap-1 ${
                      cepFeedback.includes('preenchido')
                        ? 'text-emerald-700 font-medium'
                        : 'text-slate-600'
                    }`}
                  >
                    {cepFeedback.includes('preenchido') && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                    {cepFeedback}
                  </p>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Logradouro, Bairro e Número (Editável)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Av. Paulista, 1000 - Bela Vista"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Contato do Síndico / Gestor do Condomínio
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Nome do Síndico
                    </label>
                    <input
                      type="text"
                      placeholder="Nome completo do responsável"
                      value={formData.sindicoName}
                      onChange={(e) => setFormData({ ...formData, sindicoName: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Telefone / WhatsApp
                      </label>
                      <input
                        type="text"
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                        value={formData.sindicoPhone}
                        onChange={(e) => setFormData({ ...formData, sindicoPhone: maskPhone(e.target.value) })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        E-mail de Contato
                      </label>
                      <input
                        type="email"
                        placeholder="sindico@condominio.com"
                        value={formData.sindicoEmail}
                        onChange={(e) => setFormData({ ...formData, sindicoEmail: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? 'Salvando...' : editingCondo ? 'Atualizar Dados' : 'Cadastrar Condomínio'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
