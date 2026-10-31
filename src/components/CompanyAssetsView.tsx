import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Package,
  Radio,
  Wrench,
  Shield,
  HardHat,
  Monitor,
  Cone,
  Plus,
  Search,
  Filter,
  Building2,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  UserCheck,
  Tag,
  Hash,
  X,
  AlertCircle,
  FileCheck,
  Clock,
  Briefcase,
} from 'lucide-react';
import { CompanyAsset, Condominium } from '../types/index.ts';
import { maskDate } from '../utils/masks.ts';
import { PhotoField } from './PhotoField.tsx';

interface CompanyAssetsViewProps {
  assets: CompanyAsset[];
  condominiums: Condominium[];
  selectedCondoId: number | 'all';
  onAddAsset: (asset: Omit<CompanyAsset, 'id' | 'createdAt'>) => Promise<boolean>;
  onUpdateAsset: (id: number, asset: Partial<CompanyAsset>) => Promise<boolean>;
  onDeleteAsset: (id: number) => Promise<boolean>;
}

export const CompanyAssetsView: React.FC<CompanyAssetsViewProps> = ({
  assets,
  condominiums,
  selectedCondoId,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
}) => {
  const { user, role } = useAuth();
  const isManager = role === 'sindico' || role === 'admin' || role === 'supervisor';

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<CompanyAsset | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState('');

  // Form State (Cadastro e Edição restritos aos Gestores)
  const [condoId, setCondoId] = useState<number | ''>(
    selectedCondoId !== 'all' ? selectedCondoId : (condominiums[0]?.id || '')
  );
  const [name, setName] = useState('');
  const [category, setCategory] = useState<CompanyAsset['category']>('comunicacao');
  const [assetTag, setAssetTag] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [condition, setCondition] = useState<CompanyAsset['condition']>('bom');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [responsibleAgent, setResponsibleAgent] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  // --- MODAL DE CAUTELA: RECEBER MATERIAL PARA O SERVIÇO ---
  const [cautelaAsset, setCautelaAsset] = useState<CompanyAsset | null>(null);
  const [cautelaAgentName, setCautelaAgentName] = useState('');
  const [cautelaNotes, setCautelaNotes] = useState('');
  const [cautelaChecklist, setCautelaChecklist] = useState({
    estadoFisico: true,
    bateriaCarregada: true,
    botoesTravas: true,
    acessoriosInclusos: true,
  });

  // --- MODAL DE DEVOLUÇÃO: BAIXAR CAUTELA ---
  const [devolucaoAsset, setDevolucaoAsset] = useState<CompanyAsset | null>(null);
  const [devolucaoCondition, setDevolucaoCondition] = useState<CompanyAsset['condition']>('bom');
  const [devolucaoNotes, setDevolucaoNotes] = useState('');
  const [devolucaoChecklist, setDevolucaoChecklist] = useState({
    limpoSemDanos: true,
    acessoriosDevolvidos: true,
    testeFuncionamento: true,
  });

  const openAddModal = () => {
    setEditingAsset(null);
    setCondoId(selectedCondoId !== 'all' ? selectedCondoId : (condominiums[0]?.id || ''));
    setName('');
    setCategory('comunicacao');
    setAssetTag(`PAT-${Math.floor(10000 + Math.random() * 90000)}`);
    setSerialNumber('');
    setQuantity(1);
    setCondition('bom');
    setDeliveryDate(new Date().toLocaleDateString('pt-BR'));
    setResponsibleAgent('');
    setNotes('');
    setPhotoUrl('https://images.unsplash.com/photo-1588854337236-6889d631faa8?auto=format&fit=crop&w=400&q=80');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (asset: CompanyAsset) => {
    setEditingAsset(asset);
    setCondoId(asset.condoId || (condominiums[0]?.id || ''));
    setName(asset.name);
    setCategory(asset.category);
    setAssetTag(asset.assetTag || '');
    setSerialNumber(asset.serialNumber || '');
    setQuantity(asset.quantity);
    setCondition(asset.condition);
    setDeliveryDate(asset.deliveryDate ? maskDate(asset.deliveryDate) : '');
    setResponsibleAgent(asset.responsibleAgent || '');
    setNotes(asset.notes || '');
    setPhotoUrl(asset.photoUrl || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('O nome do material ou equipamento é obrigatório.');
      return;
    }
    if (quantity <= 0) {
      setErrorMessage('A quantidade deve ser de pelo menos 1 unidade.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const selectedCondo = condominiums.find((c) => c.id === Number(condoId));
      const payload = {
        condoId: condoId ? Number(condoId) : null,
        condoName: selectedCondo?.name || 'Almoxarifado Central da Empresa',
        name: name.trim(),
        category,
        assetTag: assetTag.trim() || null,
        serialNumber: serialNumber.trim() || null,
        quantity: Number(quantity) || 1,
        condition,
        deliveryDate: deliveryDate.trim() || null,
        responsibleAgent: responsibleAgent.trim() || null,
        notes: notes.trim() || null,
        photoUrl: photoUrl.trim() || null,
      };

      let success = false;
      if (editingAsset) {
        success = await onUpdateAsset(editingAsset.id, payload);
      } else {
        success = await onAddAsset(payload);
      }

      if (success) {
        setIsModalOpen(false);
        setFeedbackBanner(`Material "${payload.name}" salvo com sucesso!`);
      } else {
        setErrorMessage('Falha ao salvar material. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar dados do patrimônio.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- AÇÕES DO AGENTE: RECEBER MATERIAL (CAUTELA) ---
  const openCautelaModal = (asset: CompanyAsset) => {
    setCautelaAsset(asset);
    setCautelaAgentName(user?.name || 'Agente de Plantão');
    setCautelaNotes('');
    setCautelaChecklist({
      estadoFisico: true,
      bateriaCarregada: true,
      botoesTravas: true,
      acessoriosInclusos: true,
    });
  };

  const handleConfirmCautela = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cautelaAsset) return;

    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const success = await onUpdateAsset(cautelaAsset.id, {
      inUseWithAgentName: cautelaAgentName.trim(),
      inUseSince: nowTime,
      cautelaNotes: cautelaNotes.trim() || 'Material retirado para o serviço com checklist de conferência aprovado.',
    });

    if (success) {
      setFeedbackBanner(`Material "${cautelaAsset.name}" retirado sob cautela por ${cautelaAgentName}!`);
      setCautelaAsset(null);
    }
  };

  // --- AÇÕES DO AGENTE: DEVOLVER MATERIAL (BAIXAR CAUTELA) ---
  const openDevolucaoModal = (asset: CompanyAsset) => {
    setDevolucaoAsset(asset);
    setDevolucaoCondition(asset.condition || 'bom');
    setDevolucaoNotes('');
    setDevolucaoChecklist({
      limpoSemDanos: true,
      acessoriosDevolvidos: true,
      testeFuncionamento: true,
    });
  };

  const handleConfirmDevolucao = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!devolucaoAsset) return;

    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const success = await onUpdateAsset(devolucaoAsset.id, {
      inUseWithAgentName: null,
      inUseSince: null,
      condition: devolucaoCondition,
      cautelaNotes: `Devolução registrada às ${nowTime}. ${devolucaoNotes.trim()}`,
    });

    if (success) {
      setFeedbackBanner(`Material "${devolucaoAsset.name}" devolvido e cautela baixada com sucesso!`);
      setDevolucaoAsset(null);
    }
  };

  const filteredAssets = assets.filter((asset) => {
    if (selectedCondoId !== 'all' && asset.condoId !== selectedCondoId) {
      return false;
    }
    if (categoryFilter !== 'all' && asset.category !== categoryFilter) {
      return false;
    }
    if (conditionFilter !== 'all' && asset.condition !== conditionFilter) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = asset.name.toLowerCase().includes(term);
      const matchTag = asset.assetTag?.toLowerCase().includes(term);
      const matchSN = asset.serialNumber?.toLowerCase().includes(term);
      const matchAgent = asset.responsibleAgent?.toLowerCase().includes(term) || asset.inUseWithAgentName?.toLowerCase().includes(term);
      const matchCondo = asset.condoName?.toLowerCase().includes(term);
      return matchName || matchTag || matchSN || matchAgent || matchCondo;
    }
    return true;
  });

  const getCategoryIcon = (category: CompanyAsset['category']) => {
    switch (category) {
      case 'comunicacao':
        return <Radio className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'seguranca_ronda':
        return <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'ferramentas':
        return <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'epi':
        return <HardHat className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'cftv_ti':
        return <Monitor className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'sinalizacao':
        return <Cone className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      default:
        return <Package className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getCategoryLabel = (category: CompanyAsset['category']) => {
    switch (category) {
      case 'comunicacao':
        return 'Radiocomunicação HT';
      case 'seguranca_ronda':
        return 'Bastões de Vigia / Ronda';
      case 'ferramentas':
        return 'Ferramental e Manutenção';
      case 'epi':
        return 'EPI & Proteção Individual';
      case 'cftv_ti':
        return 'CFTV, Computadores & TI';
      case 'sinalizacao':
        return 'Cones & Sinalização Viária';
      default:
        return 'Outro Equipamento';
    }
  };

  const getConditionIndicator = (condition: CompanyAsset['condition']) => {
    switch (condition) {
      case 'novo':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            Novo (100%)
          </span>
        );
      case 'bom':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400">
            Bom Estado
          </span>
        );
      case 'regular':
        return (
          <span className="inline-flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400">
            Regular / Desgaste
          </span>
        );
      case 'danificado':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Danificado / Avaria
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xl">
            <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Materiais & Patrimônio da Empresa nos Postos</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Gestão de rádios HT, bastões de vigia e ferramentas com termo de cautela e controle de devolução.
          </p>
        </div>

        {/* Somente Gestores podem cadastrar novos materiais */}
        {isManager ? (
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Novo Material
          </button>
        ) : (
          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
            🔒 Cadastro restrito a Gestores e Supervisores
          </div>
        )}
      </div>

      {feedbackBanner && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{feedbackBanner}</span>
          </div>
          <button onClick={() => setFeedbackBanner('')} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Itens</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{filteredAssets.length}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Patrimônios registrados</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Sob Cautela Ativa</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {filteredAssets.filter((a) => Boolean(a.inUseWithAgentName)).length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Em posse dos agentes</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Rádios HT</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
            {filteredAssets.filter((a) => a.category === 'comunicacao').length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Comunicação guarita</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Bastões de Vigia</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {filteredAssets.filter((a) => a.category === 'seguranca_ronda').length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Controle de ronda</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, tombamento/patrimônio, serial ou condomínio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtros:</span>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Categorias</option>
            <option value="comunicacao">Rádios HT & Comunicação</option>
            <option value="seguranca_ronda">Bastões de Vigia / Ronda</option>
            <option value="ferramentas">Ferramentas & Manutenção</option>
            <option value="epi">EPI & Proteção</option>
            <option value="cftv_ti">CFTV & Informática</option>
            <option value="sinalizacao">Sinalização & Cones</option>
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Condições</option>
            <option value="novo">Novo</option>
            <option value="bom">Bom Estado</option>
            <option value="regular">Regular</option>
            <option value="danificado">Danificado</option>
          </select>
        </div>
      </div>

      {/* Grid of Assets */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Nenhum material encontrado</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md mx-auto">
            {searchTerm || categoryFilter !== 'all' || conditionFilter !== 'all'
              ? 'Tente ajustar os filtros ou termo de busca acima.'
              : 'Nenhum equipamento registrado para os postos filtrados.'}
          </p>
          {isManager && (
            <button
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Primeiro Material
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => {
            const hasActiveCautela = Boolean(asset.inUseWithAgentName);

            return (
              <div
                key={asset.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Foto do Material (visível a todos) */}
                  {asset.photoUrl ? (
                    <div className="h-32 w-full overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                      <img
                        src={asset.photoUrl}
                        alt={asset.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white">
                        <span className="font-mono text-xs font-bold bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
                          {asset.assetTag || 'S/N'}
                        </span>
                        <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-md">
                          Qtd: {asset.quantity}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        {!asset.photoUrl && (
                          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 mt-0.5">
                            {getCategoryIcon(asset.category)}
                          </div>
                        )}
                        <div className="min-w-0">
                          {!asset.photoUrl && (
                            <div className="flex items-center gap-2">
                              {asset.assetTag && (
                                <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                                  {asset.assetTag}
                                </span>
                              )}
                              <span>·</span>
                              <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                                {asset.quantity} {asset.quantity > 1 ? 'unidades' : 'unidade'}
                              </span>
                            </div>
                          )}
                          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate">
                            {asset.name}
                          </h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400">{getCategoryLabel(asset.category)}</p>
                        </div>
                      </div>
                      <div>{getConditionIndicator(asset.condition)}</div>
                    </div>

                    {/* STATUS DE CAUTELA EM DESTAQUE (todos visualizam quem está de posse do material) */}
                    <div className="mt-3">
                      {hasActiveCautela ? (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5 animate-in fade-in">
                          <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-200 font-bold">
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                              SOB CAUTELA: {asset.inUseWithAgentName}
                            </span>
                            {asset.inUseSince && (
                              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 shrink-0">
                                Desde {asset.inUseSince}
                              </span>
                            )}
                          </div>
                          {asset.cautelaNotes && (
                            <p className="text-[10px] text-emerald-800 dark:text-emerald-300 italic line-clamp-1">
                              "{asset.cautelaNotes}"
                            </p>
                          )}
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Em estoque no posto
                          </span>
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                            Disponível para cautela
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {asset.condoName || 'Posto Geral / Almoxarifado'}
                        </span>
                      </div>

                      {asset.serialNumber && (
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-mono">
                          <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>S/N: {asset.serialNumber}</span>
                        </div>
                      )}

                      {asset.responsibleAgent && !hasActiveCautela && (
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>Responsável cadastrado: <strong className="text-slate-800 dark:text-slate-200">{asset.responsibleAgent}</strong></span>
                        </div>
                      )}

                      {asset.notes && (
                        <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed italic border border-slate-100 dark:border-slate-800">
                          "{asset.notes}"
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AÇÕES OPERACIONAIS: ASSUMIR / DEVOLVER CAUTELA */}
                <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    {hasActiveCautela ? (
                      <button
                        onClick={() => openDevolucaoModal(asset)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer min-h-[38px] transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Devolver Material (Baixar Cautela)
                      </button>
                    ) : (
                      <button
                        onClick={() => openCautelaModal(asset)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer min-h-[38px] transition-colors"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        Assumir Cautela de Material
                      </button>
                    )}
                  </div>

                  {/* Gestão restrita para Gestores (Editar e Excluir) */}
                  {isManager && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-750 text-[11px] text-slate-500">
                      <span>Gestão Patrimonial</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(asset)}
                          className="p-1.5 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          title="Editar Material (Gestor)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(asset.id)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Excluir Material (Gestor)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* --- MODAL DE CAUTELA: RETIRAR MATERIAL PARA SERVIÇO --- */}
      {cautelaAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Termo de Cautela de Material
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {cautelaAsset.name} · Tombamento: {cautelaAsset.assetTag || 'S/N'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCautelaAsset(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCautela} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Agente / Colaborador Recebedor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Seu nome completo"
                  value={cautelaAgentName}
                  onChange={(e) => setCautelaAgentName(e.target.value)}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Checklist de Conferência do Material */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  Checklist de Retirada do Material
                </p>

                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cautelaChecklist.estadoFisico}
                      onChange={(e) => setCautelaChecklist({ ...cautelaChecklist, estadoFisico: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Equipamento em perfeito estado físico, sem trincas ou quebras</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cautelaChecklist.bateriaCarregada}
                      onChange={(e) => setCautelaChecklist({ ...cautelaChecklist, bateriaCarregada: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Bateria carregada e testada na guarita</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cautelaChecklist.botoesTravas}
                      onChange={(e) => setCautelaChecklist({ ...cautelaChecklist, botoesTravas: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Antena, presilhas e botões íntegros</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={cautelaChecklist.acessoriosInclusos}
                      onChange={(e) => setCautelaChecklist({ ...cautelaChecklist, acessoriosInclusos: e.target.checked })}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Acessórios inclusos (base carregadora / fone PTT / cordão)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações da Cautela (Opcional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Equipamento retirado para ronda perimetral da noite no condomínio..."
                  value={cautelaNotes}
                  onChange={(e) => setCautelaNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCautelaAsset(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer min-h-[38px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs min-h-[38px] flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar e Assumir Cautela
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE DEVOLUÇÃO: BAIXAR CAUTELA --- */}
      {devolucaoAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Devolução de Material Sob Cautela
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {devolucaoAsset.name} · Retirado por {devolucaoAsset.inUseWithAgentName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDevolucaoAsset(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDevolucao} className="p-4 sm:p-5 space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-100 dark:border-blue-900 text-xs">
                <p className="text-blue-900 dark:text-blue-200 font-semibold">
                  Responsável pela Devolução: <strong>{devolucaoAsset.inUseWithAgentName}</strong>
                </p>
                <p className="text-blue-700 dark:text-blue-300 text-[11px] mt-0.5">
                  Retirado às {devolucaoAsset.inUseSince || 'Turno ativo'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Estado de Conservação no Retorno *
                </label>
                <select
                  value={devolucaoCondition}
                  onChange={(e) => setDevolucaoCondition(e.target.value as any)}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="novo">Novo / Impecável</option>
                  <option value="bom">Bom Estado de Uso</option>
                  <option value="regular">Regular (com desgaste natural)</option>
                  <option value="danificado">Avariado / Danificado no Turno</option>
                </select>
              </div>

              {/* Checklist de Devolução */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                  Checklist de Recebimento
                </p>

                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={devolucaoChecklist.limpoSemDanos}
                      onChange={(e) => setDevolucaoChecklist({ ...devolucaoChecklist, limpoSemDanos: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Equipamento devolvido limpo e sem danos novos</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={devolucaoChecklist.acessoriosDevolvidos}
                      onChange={(e) => setDevolucaoChecklist({ ...devolucaoChecklist, acessoriosDevolvidos: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Acessórios e carregador conferidos na entrega</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={devolucaoChecklist.testeFuncionamento}
                      onChange={(e) => setDevolucaoChecklist({ ...devolucaoChecklist, testeFuncionamento: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Teste de funcionamento concluído no recebimento</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações de Devolução
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Devolvido na portaria sem avarias, bateria colocada para recarga..."
                  value={devolucaoNotes}
                  onChange={(e) => setDevolucaoNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDevolucaoAsset(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer min-h-[38px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs min-h-[38px] flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Devolução & Baixar Cautela
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CADASTRO / EDIÇÃO DE MATERIAL (SOMENTE GESTORES) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {editingAsset ? 'Editar Material (Gestão)' : 'Novo Material no Posto'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {errorMessage && (
              <div className="m-4 p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg flex items-center gap-2 text-rose-700 dark:text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Condomínio / Posto Alocado *
                </label>
                <select
                  value={condoId}
                  onChange={(e) => setCondoId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="">Almoxarifado Central da Empresa</option>
                  {condominiums.map((condo) => (
                    <option key={condo.id} value={condo.id}>
                      {condo.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Foto do Material (visível a todos) */}
              <PhotoField
                label="Foto do Material / Equipamento"
                value={photoUrl}
                onChange={setPhotoUrl}
                type="asset"
                helperText="A foto ficará visível no catálogo de patrimônio para todos os colaboradores."
              />

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome do Material / Equipamento *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Rádio Comunicador HT Baofeng UV-5R"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria do Material *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="comunicacao">Radiocomunicação HT</option>
                    <option value="seguranca_ronda">Bastão de Vigia / Ronda</option>
                    <option value="ferramentas">Ferramental & Manutenção</option>
                    <option value="epi">EPI & Proteção</option>
                    <option value="cftv_ti">CFTV & Informática</option>
                    <option value="sinalizacao">Sinalização & Cones</option>
                    <option value="outro">Outro Patrimônio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tombamento / Plaqueta de Patrimônio
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: PAT-10492"
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value.toUpperCase())}
                    className="w-full text-sm font-mono border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Número de Série (S/N)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: SN-8823199"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full text-sm font-mono border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantidade em Unidades *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado de Conservação *
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    <option value="novo">Novo (100%)</option>
                    <option value="bom">Bom Estado</option>
                    <option value="regular">Regular</option>
                    <option value="danificado">Danificado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Alocação / Entrega
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(maskDate(e.target.value))}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Observações e Acessórios Inclusos
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Acompanha fonte de alimentação, 2 bases carregadoras e fone PTT..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
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
                  {isSubmitting ? 'Salvando...' : editingAsset ? 'Atualizar Material' : 'Salvar Material'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação Exclusão */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Remover Material da Empresa?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Esta ação removerá o material do inventário do posto.
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
                  await onDeleteAsset(deleteConfirmId);
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
