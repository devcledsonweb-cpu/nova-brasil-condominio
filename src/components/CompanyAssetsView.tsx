import React, { useState } from 'react';
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
} from 'lucide-react';
import { CompanyAsset, Condominium } from '../types/index.ts';
import { maskDate } from '../utils/masks.ts';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [conditionFilter, setConditionFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<CompanyAsset | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
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
      };

      let success = false;
      if (editingAsset) {
        success = await onUpdateAsset(editingAsset.id, payload);
      } else {
        success = await onAddAsset(payload);
      }

      if (success) {
        setIsModalOpen(false);
      } else {
        setErrorMessage('Falha ao salvar material. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar dados do patrimônio.');
    } finally {
      setIsSubmitting(false);
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
      const matchSerial = asset.serialNumber?.toLowerCase().includes(term);
      const matchCondo = asset.condoName?.toLowerCase().includes(term);
      const matchResp = asset.responsibleAgent?.toLowerCase().includes(term);
      return matchName || matchTag || matchSerial || matchCondo || matchResp;
    }
    return true;
  });

  const getCategoryIcon = (cat: CompanyAsset['category']) => {
    switch (cat) {
      case 'comunicacao':
        return <Radio className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'seguranca_ronda':
        return <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'cftv_ti':
        return <Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'ferramentas':
        return <Wrench className="w-5 h-5 text-slate-700 dark:text-slate-300" />;
      case 'sinalizacao':
        return <Cone className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
      case 'epi':
        return <HardHat className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Package className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
    }
  };

  const getCategoryLabel = (cat: CompanyAsset['category']) => {
    switch (cat) {
      case 'comunicacao':
        return 'Comunicação (HTs)';
      case 'seguranca_ronda':
        return 'Segurança & Ronda';
      case 'cftv_ti':
        return 'CFTV & Informática';
      case 'ferramentas':
        return 'Ferramentas de Manutenção';
      case 'sinalizacao':
        return 'Sinalização & Cones';
      case 'epi':
        return 'EPIs & Uniformes';
      default:
        return 'Outros Equipamentos';
    }
  };

  const getConditionIndicator = (cond: CompanyAsset['condition']) => {
    switch (cond) {
      case 'novo':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Novo
          </span>
        );
      case 'bom':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Bom Estado
          </span>
        );
      case 'regular':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            Uso Regular
          </span>
        );
      case 'danificado':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Danificado
          </span>
        );
    }
  };

  const totalQuantity = filteredAssets.reduce((acc, curr) => acc + (curr.quantity || 1), 0);

  return (
    <div className="space-y-6">
      {/* Banner Superior */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xl">
            <Package className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <span>Materiais & Patrimônio da Empresa no Condomínio</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Controle de inventário dos bens da empresa alocados aos postos de serviço (rádios comunicadores HT, bastões de vigia, ferramentas, etc.).
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Material no Posto
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Itens / Lotes</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{filteredAssets.length}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Cadastros de patrimônio</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-indigo-600 dark:text-indigo-400">Total de Peças/Aparelhos</p>
          <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{totalQuantity}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Unidades em campo</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Rádios HT / Comunicação</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {filteredAssets.filter((a) => a.category === 'comunicacao').reduce((acc, c) => acc + c.quantity, 0)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Aparelhos HT alocados</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Bastões de Ronda / CFTV</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {filteredAssets.filter((a) => a.category === 'seguranca_ronda' || a.category === 'cftv_ti').reduce((acc, c) => acc + c.quantity, 0)}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Equipamentos táticos</p>
        </div>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome do material, patrimônio, série, posto ou responsável..."
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
            <option value="comunicacao">Comunicação (HTs)</option>
            <option value="seguranca_ronda">Segurança & Ronda</option>
            <option value="cftv_ti">CFTV & Informática</option>
            <option value="ferramentas">Ferramentas de Manutenção</option>
            <option value="sinalizacao">Sinalização & Cones</option>
            <option value="epi">EPIs & Uniformes</option>
          </select>

          <select
            value={conditionFilter}
            onChange={(e) => setConditionFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Condições</option>
            <option value="novo">Novo</option>
            <option value="bom">Bom</option>
            <option value="regular">Regular</option>
            <option value="danificado">Danificado</option>
          </select>
        </div>
      </div>

      {/* Grid de Materiais */}
      {filteredAssets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <Package className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Nenhum material registrado</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md mx-auto">
            {searchTerm || categoryFilter !== 'all' || conditionFilter !== 'all'
              ? 'Tente ajustar os filtros ou termo de busca acima.'
              : 'Registre os materiais da sua empresa (rádios HT, bastões de vigia, ferramentas) alocados nos condomínios.'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeiro Material
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 mt-0.5">
                      {getCategoryIcon(asset.category)}
                    </div>
                    <div>
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
                      <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">{asset.name}</h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{getCategoryLabel(asset.category)}</p>
                    </div>
                  </div>
                  <div>{getConditionIndicator(asset.condition)}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
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

                  {asset.responsibleAgent && (
                    <div className="flex items-center gap-2">
                      <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Cautela: <strong className="text-slate-800 dark:text-slate-200">{asset.responsibleAgent}</strong></span>
                    </div>
                  )}

                  {asset.notes && (
                    <div className="mt-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed italic border border-slate-100 dark:border-slate-800">
                      "{asset.notes}"
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 dark:text-slate-500">
                  Entrega: {asset.deliveryDate || 'N/I'}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(asset)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Editar Material"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(asset.id)}
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Excluir Material"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastro/Edição de Material */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-5 sm:p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  {editingAsset ? 'Editar Material / Equipamento' : 'Novo Material no Posto'}
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Condomínio / Posto Alocado *
                </label>
                <select
                  value={condoId}
                  onChange={(e) => setCondoId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Almoxarifado Central da Empresa</option>
                  {condominiums.map((condo) => (
                    <option key={condo.id} value={condo.id}>
                      {condo.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nome / Descrição do Material *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Rádio Comunicador HT Motorola Talkabout T470"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria do Item *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="comunicacao">Comunicação (HTs)</option>
                    <option value="seguranca_ronda">Segurança & Ronda</option>
                    <option value="cftv_ti">CFTV & Informática</option>
                    <option value="ferramentas">Ferramentas de Manutenção</option>
                    <option value="sinalizacao">Sinalização & Cones</option>
                    <option value="epi">EPIs & Uniformes</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Etiqueta Patrimonial (Tag)
                  </label>
                  <input
                    type="text"
                    placeholder="PAT-10293"
                    value={assetTag}
                    onChange={(e) => setAssetTag(e.target.value.toUpperCase())}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-mono uppercase bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Número de Série (S/N)
                  </label>
                  <input
                    type="text"
                    placeholder="SN-987410293"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quantidade no Posto *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Estado de Conservação *
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="novo">Novo / Lacrado</option>
                    <option value="bom">Bom Estado</option>
                    <option value="regular">Uso Regular</option>
                    <option value="danificado">Danificado (Trocar)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data de Entrega no Posto
                  </label>
                  <input
                    type="text"
                    placeholder="DD/MM/AAAA"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(maskDate(e.target.value))}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Agente Responsável / Termo de Cautela
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Agente Carlos Eduardo (Portaria A)"
                    value={responsibleAgent}
                    onChange={(e) => setResponsibleAgent(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Observações e Acessórios Inclusos
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Acompanha base carregadora, fone de ouvido PTT e presilha de cinto..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

      {/* Modal Exclusão */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Remover Material?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Esta ação removerá o registro do patrimônio do condomínio.
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
