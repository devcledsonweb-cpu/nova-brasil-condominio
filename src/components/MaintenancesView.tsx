import React, { useState } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  DollarSign,
  UserCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Edit2,
  Trash2,
  X,
  AlertCircle,
  Zap,
  Droplets,
  Video,
  KeyRound,
  RotateCcw,
} from 'lucide-react';
import { MaintenanceOrder, Condominium } from '../types/index.ts';
import { maskDate, maskCurrency } from '../utils/masks.ts';

interface MaintenancesViewProps {
  maintenances: MaintenanceOrder[];
  condominiums: Condominium[];
  selectedCondoId: number | 'all';
  onAddMaintenance: (order: Omit<MaintenanceOrder, 'id' | 'createdAt'>) => Promise<boolean>;
  onUpdateMaintenance: (id: number, order: Partial<MaintenanceOrder>) => Promise<boolean>;
  onDeleteMaintenance: (id: number) => Promise<boolean>;
}

export const MaintenancesView: React.FC<MaintenancesViewProps> = ({
  maintenances,
  condominiums,
  selectedCondoId,
  onAddMaintenance,
  onUpdateMaintenance,
  onDeleteMaintenance,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<MaintenanceOrder | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [condoId, setCondoId] = useState<number | ''>(
    selectedCondoId !== 'all' ? selectedCondoId : (condominiums[0]?.id || '')
  );
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<MaintenanceOrder['category']>('portoes');
  const [maintenanceType, setMaintenanceType] = useState<MaintenanceOrder['maintenanceType']>('preventiva');
  const [technicianName, setTechnicianName] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [completedDate, setCompletedDate] = useState('');
  const [cost, setCost] = useState('R$ 0,00');
  const [status, setStatus] = useState<MaintenanceOrder['status']>('agendada');
  const [description, setDescription] = useState('');
  const [solutionDetails, setSolutionDetails] = useState('');

  const openAddModal = () => {
    setEditingOrder(null);
    setCondoId(selectedCondoId !== 'all' ? selectedCondoId : (condominiums[0]?.id || ''));
    setTitle('');
    setCategory('portoes');
    setMaintenanceType('preventiva');
    setTechnicianName('Equipe Técnica Predial');
    setScheduledDate(new Date().toLocaleDateString('pt-BR'));
    setCompletedDate('');
    setCost('R$ 0,00');
    setStatus('agendada');
    setDescription('');
    setSolutionDetails('');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (order: MaintenanceOrder) => {
    setEditingOrder(order);
    setCondoId(order.condoId || (condominiums[0]?.id || ''));
    setTitle(order.title);
    setCategory(order.category);
    setMaintenanceType(order.maintenanceType);
    setTechnicianName(order.technicianName);
    setScheduledDate(order.scheduledDate ? maskDate(order.scheduledDate) : '');
    setCompletedDate(order.completedDate ? maskDate(order.completedDate) : '');
    setCost(order.cost || 'R$ 0,00');
    setStatus(order.status);
    setDescription(order.description);
    setSolutionDetails(order.solutionDetails || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Informe o título da ordem de manutenção.');
      return;
    }
    if (!technicianName.trim()) {
      setErrorMessage('Informe o técnico ou equipe responsável da sua empresa.');
      return;
    }
    if (!scheduledDate.trim()) {
      setErrorMessage('Informe a data agendada para o serviço.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Descreva o serviço a ser executado ou o problema identificado.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const selectedCondo = condominiums.find((c) => c.id === Number(condoId));
      const payload = {
        condoId: condoId ? Number(condoId) : null,
        condoName: selectedCondo?.name || 'Posto Geral',
        title: title.trim(),
        category,
        maintenanceType,
        technicianName: technicianName.trim(),
        scheduledDate: scheduledDate.trim(),
        completedDate: completedDate.trim() || null,
        cost: cost.trim() || 'R$ 0,00',
        status,
        description: description.trim(),
        solutionDetails: solutionDetails.trim() || null,
      };

      let success = false;
      if (editingOrder) {
        success = await onUpdateMaintenance(editingOrder.id, payload);
      } else {
        success = await onAddMaintenance(payload);
      }

      if (success) {
        setIsModalOpen(false);
      } else {
        setErrorMessage('Falha ao salvar manutenção. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar dados da manutenção.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickComplete = async (order: MaintenanceOrder) => {
    const today = new Date().toLocaleDateString('pt-BR');
    await onUpdateMaintenance(order.id, {
      status: 'concluida',
      completedDate: today,
      solutionDetails: order.solutionDetails || 'Manutenção realizada com sucesso pela equipe técnica da empresa.',
    });
  };

  const filteredOrders = maintenances.filter((order) => {
    if (selectedCondoId !== 'all' && order.condoId !== selectedCondoId) {
      return false;
    }
    if (categoryFilter !== 'all' && order.category !== categoryFilter) {
      return false;
    }
    if (statusFilter !== 'all' && order.status !== statusFilter) {
      return false;
    }
    if (typeFilter !== 'all' && order.maintenanceType !== typeFilter) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchTitle = order.title.toLowerCase().includes(term);
      const matchTech = order.technicianName.toLowerCase().includes(term);
      const matchCondo = order.condoName?.toLowerCase().includes(term);
      const matchDesc = order.description.toLowerCase().includes(term);
      return matchTitle || matchTech || matchCondo || matchDesc;
    }
    return true;
  });

  const getCategoryIcon = (cat: MaintenanceOrder['category']) => {
    switch (cat) {
      case 'portoes':
        return <KeyRound className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'cftv':
        return <Video className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
      case 'eletrica':
      case 'gerador':
        return <Zap className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
      case 'hidraulica':
        return <Droplets className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <Wrench className="w-5 h-5 text-slate-700 dark:text-slate-300" />;
    }
  };

  const getCategoryLabel = (cat: MaintenanceOrder['category']) => {
    switch (cat) {
      case 'portoes':
        return 'Portões & Motores';
      case 'cftv':
        return 'CFTV & Câmeras';
      case 'interfonia':
        return 'Interfonia & Telefonia';
      case 'eletrica':
        return 'Elétrica & Iluminação';
      case 'hidraulica':
        return 'Hidráulica & Bombas';
      case 'gerador':
        return 'Gerador de Energia';
      case 'controle_acesso':
        return 'Controle de Acesso';
      case 'alvenaria_pintura':
        return 'Alvenaria & Pintura';
      default:
        return 'Outra Manutenção';
    }
  };

  const getStatusIndicator = (status: MaintenanceOrder['status']) => {
    switch (status) {
      case 'agendada':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Clock className="w-3.5 h-3.5" />
            Agendada
          </span>
        );
      case 'em_andamento':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            Em Andamento
          </span>
        );
      case 'aguardando_peca':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Aguardando Peça
          </span>
        );
      case 'concluida':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Concluída
          </span>
        );
      case 'cancelada':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            Cancelada
          </span>
        );
    }
  };

  const getTypeLabel = (type: MaintenanceOrder['maintenanceType']) => {
    switch (type) {
      case 'preventiva':
        return 'Preventiva';
      case 'corretiva':
        return 'Corretiva';
      case 'emergencial':
        return 'Emergencial';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xl">
            <Wrench className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span>Manutenções da Empresa nos Condomínios</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Ordens de serviço de manutenção preventiva, corretiva e emergencial executadas pela sua empresa nos condomínios clientes.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Abrir Ordem de Manutenção (O.S.)
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Ordens</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{filteredOrders.length}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Histórico completo</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Em Aberto / Andamento</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {filteredOrders.filter((o) => o.status === 'agendada' || o.status === 'em_andamento' || o.status === 'aguardando_peca').length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Demandas ativas</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Concluídas com Sucesso</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {filteredOrders.filter((o) => o.status === 'concluida').length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Serviços finalizados</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-rose-600 dark:text-rose-400">Emergenciais</p>
          <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
            {filteredOrders.filter((o) => o.maintenanceType === 'emergencial').length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Atendimentos rápidos</p>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por título da OS, técnico, condomínio ou problema..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="agendada">Agendadas</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="aguardando_peca">Aguardando Peça</option>
            <option value="concluida">Concluídas</option>
            <option value="cancelada">Canceladas</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Tipos</option>
            <option value="preventiva">Preventiva Periódica</option>
            <option value="corretiva">Corretiva</option>
            <option value="emergencial">Emergencial</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todas as Categorias</option>
            <option value="portoes">Portões & Motores</option>
            <option value="cftv">CFTV & Câmeras</option>
            <option value="interfonia">Interfonia</option>
            <option value="eletrica">Elétrica Predial</option>
            <option value="hidraulica">Hidráulica & Bombas</option>
            <option value="gerador">Gerador</option>
            <option value="controle_acesso">Controle de Acesso</option>
            <option value="alvenaria_pintura">Alvenaria & Pintura</option>
          </select>
        </div>
      </div>

      {/* Orders List / Grid */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <Wrench className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Nenhuma manutenção encontrada</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md mx-auto">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
              ? 'Tente ajustar os filtros ou termo de busca acima.'
              : 'Registre as manutenções executadas pela sua empresa nos condomínios (portões, bombas, CFTV, etc.).'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeira Manutenção
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-amber-300 dark:hover:border-amber-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 mt-0.5">
                      {getCategoryIcon(order.category)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          {getTypeLabel(order.maintenanceType)}
                        </span>
                        <span>·</span>
                        <span>{getCategoryLabel(order.category)}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">{order.title}</h3>
                    </div>
                  </div>
                  <div>{getStatusIndicator(order.status)}</div>
                </div>

                <div className="mt-3 p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg text-xs text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                  <p className="line-clamp-2">{order.description}</p>
                </div>

                {order.solutionDetails && (
                  <div className="mt-2 p-2.5 bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/50 rounded-lg text-xs text-emerald-800 dark:text-emerald-300">
                    <span className="font-semibold block">Solução Técnica:</span>
                    <p className="line-clamp-2 mt-0.5">{order.solutionDetails}</p>
                  </div>
                )}

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {order.condoName || 'Posto Geral'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Técnico: <strong className="text-slate-800 dark:text-slate-200">{order.technicianName}</strong></span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Agendada: {order.scheduledDate}</span>
                    </div>

                    {order.cost && order.cost !== 'R$ 0,00' && (
                      <div className="font-semibold text-slate-900 dark:text-slate-100">
                        {order.cost}
                      </div>
                    )}
                  </div>

                  {order.completedDate && (
                    <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Concluída em {order.completedDate}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                {order.status !== 'concluida' ? (
                  <button
                    onClick={() => handleQuickComplete(order)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Concluir Serviço
                  </button>
                ) : (
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Finalizada
                  </span>
                )}

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(order)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Editar Manutenção"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(order.id)}
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Excluir Manutenção"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastro / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-5 sm:p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  {editingOrder ? 'Editar Ordem de Manutenção' : 'Nova Ordem de Manutenção'}
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
                  Condomínio / Posto Atendido *
                </label>
                <select
                  value={condoId}
                  onChange={(e) => setCondoId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Posto Geral da Empresa</option>
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
                    Título do Serviço / O.S. *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Troca do motor do portão de entrada principal"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria do Serviço *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="portoes">Portões & Motores</option>
                    <option value="cftv">CFTV & Câmeras</option>
                    <option value="interfonia">Interfonia & Telefonia</option>
                    <option value="eletrica">Elétrica & Iluminação</option>
                    <option value="hidraulica">Hidráulica & Bombas</option>
                    <option value="gerador">Gerador de Energia</option>
                    <option value="controle_acesso">Controle de Acesso / Tags</option>
                    <option value="alvenaria_pintura">Alvenaria & Pintura</option>
                    <option value="outro">Outra Manutenção</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Manutenção *
                  </label>
                  <select
                    value={maintenanceType}
                    onChange={(e) => setMaintenanceType(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="preventiva">Preventiva Periódica</option>
                    <option value="corretiva">Corretiva</option>
                    <option value="emergencial">Emergencial (Chamado Urgente)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Técnico / Equipe da Empresa *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Técnico Rodrigo (Equipe Eletrotécnica)"
                    value={technicianName}
                    onChange={(e) => setTechnicianName(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Custo Estimado / Peças
                  </label>
                  <input
                    type="text"
                    placeholder="R$ 350,00"
                    value={cost}
                    onChange={(e) => setCost(maskCurrency(e.target.value))}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Data Agendada *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="DD/MM/AAAA"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(maskDate(e.target.value))}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status da Manutenção *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="agendada">Agendada</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="aguardando_peca">Aguardando Peça</option>
                    <option value="concluida">Concluída</option>
                    <option value="cancelada">Cancelada</option>
                  </select>
                </div>

                {status === 'concluida' && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Data de Conclusão (DD/MM/AAAA)
                    </label>
                    <input
                      type="text"
                      placeholder="DD/MM/AAAA"
                      value={completedDate}
                      onChange={(e) => setCompletedDate(maskDate(e.target.value))}
                      className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição do Problema ou Serviço a Realizar *
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Descreva o que será feito ou a queixa recebida do condomínio..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Relatório da Solução / Peças Substituídas (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Substituída placa central Peccinin e ajustado fim de curso do portão..."
                    value={solutionDetails}
                    onChange={(e) => setSolutionDetails(e.target.value)}
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
                  {isSubmitting ? 'Salvando...' : editingOrder ? 'Atualizar O.S.' : 'Salvar O.S.'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmação Exclusão */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-sm w-full p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Remover Ordem de Manutenção?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Esta ação removerá a ordem de serviço do histórico do condomínio.
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
                  await onDeleteMaintenance(deleteConfirmId);
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
