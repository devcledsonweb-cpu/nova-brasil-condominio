import React, { useState } from 'react';
import {
  Car,
  Bike,
  Plus,
  Search,
  Filter,
  Navigation,
  Gauge,
  UserCheck,
  Building2,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  X,
  AlertCircle,
  RotateCw,
} from 'lucide-react';
import { PatrolVehicle, Condominium } from '../types/index.ts';
import { maskPlate } from '../utils/masks.ts';

interface PatrolVehiclesViewProps {
  vehicles: PatrolVehicle[];
  condominiums: Condominium[];
  selectedCondoId: number | 'all';
  onAddVehicle: (vehicle: Omit<PatrolVehicle, 'id' | 'createdAt'>) => Promise<boolean>;
  onUpdateVehicle: (id: number, vehicle: Partial<PatrolVehicle>) => Promise<boolean>;
  onDeleteVehicle: (id: number) => Promise<boolean>;
}

export const PatrolVehiclesView: React.FC<PatrolVehiclesViewProps> = ({
  vehicles,
  condominiums,
  selectedCondoId,
  onAddVehicle,
  onUpdateVehicle,
  onDeleteVehicle,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<PatrolVehicle | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Form State
  const [condoId, setCondoId] = useState<number | ''>(
    selectedCondoId !== 'all' ? selectedCondoId : (condominiums[0]?.id || '')
  );
  const [type, setType] = useState<PatrolVehicle['type']>('moto');
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [brand, setBrand] = useState('');
  const [color, setColor] = useState('Preto');
  const [currentKm, setCurrentKm] = useState<number>(0);
  const [driverName, setDriverName] = useState('');
  const [status, setStatus] = useState<PatrolVehicle['status']>('em_ronda');
  const [routeDescription, setRouteDescription] = useState('Ronda perimetral e garagens a cada 30 minutos');

  const openAddModal = () => {
    setEditingVehicle(null);
    setCondoId(selectedCondoId !== 'all' ? selectedCondoId : (condominiums[0]?.id || ''));
    setType('moto');
    setPlate('');
    setModel('Honda CG 160 Fan');
    setBrand('Honda');
    setColor('Preto');
    setCurrentKm(12500);
    setDriverName('');
    setStatus('em_ronda');
    setRouteDescription('Ronda perimetral externa e garagens a cada 30 min');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle: PatrolVehicle) => {
    setEditingVehicle(vehicle);
    setCondoId(vehicle.condoId || (condominiums[0]?.id || ''));
    setType(vehicle.type);
    setPlate(maskPlate(vehicle.plate));
    setModel(vehicle.model);
    setBrand(vehicle.brand || '');
    setColor(vehicle.color);
    setCurrentKm(vehicle.currentKm);
    setDriverName(vehicle.driverName || '');
    setStatus(vehicle.status);
    setRouteDescription(vehicle.routeDescription || '');
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim()) {
      setErrorMessage('A placa do veículo de ronda é obrigatória.');
      return;
    }
    if (!model.trim()) {
      setErrorMessage('Informe o modelo do veículo (ex: Moto Honda CG 160, Carro Fiat Mobi).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const selectedCondo = condominiums.find((c) => c.id === Number(condoId));
      const payload = {
        condoId: condoId ? Number(condoId) : null,
        condoName: selectedCondo?.name || 'Ronda Regional da Empresa',
        type,
        plate: maskPlate(plate.trim().toUpperCase()),
        model: model.trim(),
        brand: brand.trim() || null,
        color: color.trim() || 'Preto',
        currentKm: Number(currentKm) || 0,
        driverName: driverName.trim() || null,
        status,
        routeDescription: routeDescription.trim() || null,
        lastPatrolAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };

      let success = false;
      if (editingVehicle) {
        success = await onUpdateVehicle(editingVehicle.id, payload);
      } else {
        success = await onAddVehicle(payload);
      }

      if (success) {
        setIsModalOpen(false);
      } else {
        setErrorMessage('Falha ao salvar veículo de ronda. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar dados do veículo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterQuickPatrol = async (vehicle: PatrolVehicle) => {
    const newKm = vehicle.currentKm + 2;
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    await onUpdateVehicle(vehicle.id, {
      currentKm: newKm,
      lastPatrolAt: nowTime,
      status: 'em_ronda',
    });
  };

  const filteredVehicles = vehicles.filter((v) => {
    if (selectedCondoId !== 'all' && v.condoId !== selectedCondoId) {
      return false;
    }
    if (typeFilter !== 'all' && v.type !== typeFilter) {
      return false;
    }
    if (statusFilter !== 'all' && v.status !== statusFilter) {
      return false;
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchPlate = v.plate.toLowerCase().includes(term);
      const matchModel = v.model.toLowerCase().includes(term);
      const matchDriver = v.driverName?.toLowerCase().includes(term);
      const matchCondo = v.condoName?.toLowerCase().includes(term);
      return matchPlate || matchModel || matchDriver || matchCondo;
    }
    return true;
  });

  const getStatusIndicator = (status: PatrolVehicle['status']) => {
    switch (status) {
      case 'em_ronda':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Em Ronda
          </span>
        );
      case 'disponivel':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Disponível
          </span>
        );
      case 'manutencao':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
            Manutenção
          </span>
        );
      case 'abastecimento':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400">
            Abastecendo
          </span>
        );
    }
  };

  const getTypeIcon = (type: PatrolVehicle['type']) => {
    switch (type) {
      case 'moto':
        return <Bike className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'carro':
      case 'utilitario':
        return <Car className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      default:
        return <Navigation className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-xl">
            <Bike className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            <span>Frota & Veículos de Ronda da Empresa</span>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Motos, carros e viaturas da empresa vinculados aos condomínios para patrulhamento e rondas perimetrais.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Veículo de Ronda
        </button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Viaturas</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{filteredVehicles.length}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Motos e carros de ronda</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Em Ronda Ativa</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {filteredVehicles.filter((v) => v.status === 'em_ronda').length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Patrulhando no momento</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Motos de Ronda</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {filteredVehicles.filter((v) => v.type === 'moto').length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Rápida intervenção</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Carros / Viaturas</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {filteredVehicles.filter((v) => v.type === 'carro' || v.type === 'utilitario').length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Apoio operacional</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por placa, modelo, rondante ou condomínio..."
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
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Tipos</option>
            <option value="moto">Motos de Ronda</option>
            <option value="carro">Carros de Ronda</option>
            <option value="utilitario">Utilitários / Apoio</option>
            <option value="bicicleta">Bicicletas / Patinetes</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Status</option>
            <option value="em_ronda">Em Ronda Ativa</option>
            <option value="disponivel">Disponível no Posto</option>
            <option value="manutencao">Em Manutenção</option>
            <option value="abastecimento">Abastecendo</option>
          </select>
        </div>
      </div>

      {/* Grid of Vehicles */}
      {filteredVehicles.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-xs">
          <Car className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">Nenhum veículo de ronda encontrado</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 max-w-md mx-auto">
            {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
              ? 'Tente ajustar os filtros ou termo de busca acima.'
              : 'Cadastre motos e carros da sua empresa alocados aos condomínios para ronda.'}
          </p>
          <button
            onClick={openAddModal}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Primeiro Veículo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => (
            <div
              key={vehicle.id}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs hover:border-amber-300 dark:hover:border-amber-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 mt-0.5">
                      {getTypeIcon(vehicle.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-wider">
                          {maskPlate(vehicle.plate)}
                        </span>
                        <span>·</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{vehicle.color}</span>
                      </div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base mt-1">{vehicle.model}</h3>
                    </div>
                  </div>
                  <div>{getStatusIndicator(vehicle.status)}</div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {vehicle.condoName || 'Posto Regional'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Rondante: <strong className="text-slate-800 dark:text-slate-200">{vehicle.driverName || 'Não escalado'}</strong></span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Gauge className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>KM Atual: <strong className="text-slate-800 dark:text-slate-200">{vehicle.currentKm.toLocaleString('pt-BR')} km</strong></span>
                  </div>

                  {vehicle.routeDescription && (
                    <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
                      <Navigation className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{vehicle.routeDescription}</span>
                    </div>
                  )}

                  {vehicle.lastPatrolAt && (
                    <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 pt-1 text-[11px] font-medium">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Última ronda registrada às {vehicle.lastPatrolAt}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                <button
                  onClick={() => handleRegisterQuickPatrol(vehicle)}
                  title="Registrar ronda realizada agora"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-700 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                  +1 Ronda
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(vehicle)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Editar Veículo"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(vehicle.id)}
                    className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
                    title="Excluir Veículo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastro/Edição de Veículo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg w-full p-5 sm:p-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                  {editingVehicle ? 'Editar Veículo de Ronda' : 'Novo Veículo de Ronda'}
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
                  Condomínio Vinculado ao Veículo *
                </label>
                <select
                  value={condoId}
                  onChange={(e) => setCondoId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Ronda Regional da Empresa (Múltiplos Postos)</option>
                  {condominiums.map((condo) => (
                    <option key={condo.id} value={condo.id}>
                      {condo.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Veículo *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="moto">Moto de Ronda</option>
                    <option value="carro">Carro / Viatura</option>
                    <option value="utilitario">Utilitário / Apoio Técnico</option>
                    <option value="bicicleta">Bicicleta / Patinete Elétrico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Placa do Veículo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ABC1D23 ou ABC-1234"
                    value={plate}
                    onChange={(e) => setPlate(maskPlate(e.target.value))}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-mono uppercase bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Marca / Fabricante
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Honda, Yamaha, Fiat"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Modelo do Veículo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: CG 160 Fan, Mobi 1.0"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cor Predominante
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Preto, Branco, Prata"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Quilometragem Atual (KM)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={currentKm}
                    onChange={(e) => setCurrentKm(Number(e.target.value))}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Rondante / Condutor Designado
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Agente Silva (Ronda Noturna)"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Operacional *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="em_ronda">Em Ronda Ativa</option>
                    <option value="disponivel">Disponível no Posto</option>
                    <option value="manutencao">Em Manutenção Mecânica</option>
                    <option value="abastecimento">Abastecendo</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Descrição da Rota & Procedimento de Ronda
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Ronda perimetral pelos portões e garagens dos blocos a cada 30 minutos..."
                    value={routeDescription}
                    onChange={(e) => setRouteDescription(e.target.value)}
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
                  {isSubmitting ? 'Salvando...' : editingVehicle ? 'Atualizar Veículo' : 'Salvar Veículo'}
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
            <h3 className="font-bold text-slate-900 dark:text-white text-base">Remover Veículo de Ronda?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
              Esta ação desvinculará o veículo do condomínio e da frota operacional.
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
                  await onDeleteVehicle(deleteConfirmId);
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
