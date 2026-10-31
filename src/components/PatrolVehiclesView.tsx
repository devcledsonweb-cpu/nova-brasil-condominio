import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
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
  Fuel,
  CheckSquare,
  Square,
  Shield,
  KeyRound,
  ArrowRight,
} from 'lucide-react';
import { PatrolVehicle, Condominium } from '../types/index.ts';
import { maskPlate } from '../utils/masks.ts';
import { PhotoField } from './PhotoField.tsx';

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
  const { user, role } = useAuth();
  const isManager = role === 'sindico' || role === 'admin' || role === 'supervisor';

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<PatrolVehicle | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [feedbackBanner, setFeedbackBanner] = useState('');

  // Form State (Cadastro e Edição restritos aos Gestores)
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
  const [status, setStatus] = useState<PatrolVehicle['status']>('disponivel');
  const [routeDescription, setRouteDescription] = useState('Ronda perimetral e garagens a cada 30 minutos');
  const [photoUrl, setPhotoUrl] = useState('');

  // --- MODAL DE CHECK-IN: RECEBER VEÍCULO PARA SERVIÇO ---
  const [checkinVehicle, setCheckinVehicle] = useState<PatrolVehicle | null>(null);
  const [checkinDriverName, setCheckinDriverName] = useState('');
  const [checkinKm, setCheckinKm] = useState<number>(0);
  const [checkinFuel, setCheckinFuel] = useState('3/4');
  const [checkinNotes, setCheckinNotes] = useState('');
  const [checkinItems, setCheckinItems] = useState({
    farois: true,
    pneus: true,
    freios: true,
    oleo: true,
    retrovisores: true,
    equipamento: true,
    documentos: true,
  });

  // --- MODAL DE CHECK-OUT: FINALIZAR RONDA E DEVOLVER VEÍCULO ---
  const [checkoutVehicle, setCheckoutVehicle] = useState<PatrolVehicle | null>(null);
  const [checkoutFinalKm, setCheckoutFinalKm] = useState<number>(0);
  const [checkoutFuel, setCheckoutFuel] = useState('1/2');
  const [checkoutNotes, setCheckoutNotes] = useState('');
  const [checkoutItems, setCheckoutItems] = useState({
    estacionado: true,
    chaveDevolvida: true,
    semNovasAvarias: true,
    equipamentoGuardado: true,
  });

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
    setStatus('disponivel');
    setRouteDescription('Ronda perimetral externa e garagens a cada 30 min');
    setPhotoUrl('https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=600&q=80');
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
    setPhotoUrl(vehicle.photoUrl || '');
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
        photoUrl: photoUrl.trim() || null,
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
        setFeedbackBanner(`Veículo ${payload.plate} salvo com sucesso!`);
      } else {
        setErrorMessage('Falha ao salvar veículo de ronda. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro ao processar dados do veículo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- CHECK-IN DO VEÍCULO (AGENTE RECEBE O VEÍCULO PARA SERVIÇO) ---
  const openCheckinModal = (vehicle: PatrolVehicle) => {
    setCheckinVehicle(vehicle);
    setCheckinDriverName(user?.name || vehicle.driverName || 'Agente Operacional');
    setCheckinKm(vehicle.currentKm || 0);
    setCheckinFuel('3/4');
    setCheckinNotes('');
    setCheckinItems({
      farois: true,
      pneus: true,
      freios: true,
      oleo: true,
      retrovisores: true,
      equipamento: true,
      documentos: true,
    });
  };

  const handleConfirmCheckin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkinVehicle) return;

    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const success = await onUpdateVehicle(checkinVehicle.id, {
      status: 'em_ronda',
      driverName: checkinDriverName.trim(),
      inServiceWithAgentName: checkinDriverName.trim(),
      serviceStartedAt: nowTime,
      startKm: Number(checkinKm),
      currentKm: Number(checkinKm),
      fuelLevel: checkinFuel,
      lastChecklistNotes: checkinNotes.trim() || 'Checklist de início de ronda concluído sem avarias graves.',
      lastPatrolAt: nowTime,
    });

    if (success) {
      setFeedbackBanner(`Veículo ${checkinVehicle.plate} recebido em serviço por ${checkinDriverName}!`);
      setCheckinVehicle(null);
    }
  };

  // --- CHECK-OUT DO VEÍCULO (FINALIZAÇÃO DA RONDA E DEVOLUÇÃO) ---
  const openCheckoutModal = (vehicle: PatrolVehicle) => {
    setCheckoutVehicle(vehicle);
    setCheckoutFinalKm(vehicle.currentKm + 15);
    setCheckoutFuel(vehicle.fuelLevel || '1/2');
    setCheckoutNotes('');
    setCheckoutItems({
      estacionado: true,
      chaveDevolvida: true,
      semNovasAvarias: true,
      equipamentoGuardado: true,
    });
  };

  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutVehicle) return;

    const initial = checkoutVehicle.startKm ?? checkoutVehicle.currentKm;
    const final = Number(checkoutFinalKm);
    const distanceKm = Math.max(0, final - initial);
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const success = await onUpdateVehicle(checkoutVehicle.id, {
      status: 'disponivel',
      driverName: null,
      inServiceWithAgentName: null,
      serviceStartedAt: null,
      currentKm: final,
      fuelLevel: checkoutFuel,
      lastPatrolAt: nowTime,
      lastChecklistNotes: `Devolução registrada às ${nowTime}. ${distanceKm} km rodados. ${checkoutNotes.trim()}`,
    });

    if (success) {
      setFeedbackBanner(`Veículo ${checkoutVehicle.plate} devolvido com sucesso! Distância percorrida: ${distanceKm} km.`);
      setCheckoutVehicle(null);
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
      const matchAgent = v.inServiceWithAgentName?.toLowerCase().includes(term);
      const matchCondo = v.condoName?.toLowerCase().includes(term);
      return matchPlate || matchModel || matchDriver || matchAgent || matchCondo;
    }
    return true;
  });

  const getStatusIndicator = (status: PatrolVehicle['status']) => {
    switch (status) {
      case 'em_ronda':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Em Serviço / Ronda
          </span>
        );
      case 'disponivel':
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            Disponível no Posto
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
            Controle de viaturas com check-in e check-out de ronda, checklist de segurança e odômetro de início/fim.
          </p>
        </div>

        {/* Somente Gestores podem cadastrar novos veículos */}
        {isManager ? (
          <button
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Cadastrar Veículo de Ronda
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
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total de Viaturas</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{filteredVehicles.length}</p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Motos e viaturas cadastradas</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Em Serviço / Ronda</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
            {filteredVehicles.filter((v) => v.status === 'em_ronda' || v.inServiceWithAgentName).length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Com agente em patrulha</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Disponíveis no Posto</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {filteredVehicles.filter((v) => v.status === 'disponivel' && !v.inServiceWithAgentName).length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Prontos para assumir</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs transition-colors">
          <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Motos de Ronda</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
            {filteredVehicles.filter((v) => v.type === 'moto').length}
          </p>
          <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Rápida intervenção</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por placa, modelo, agente em serviço ou condomínio..."
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
            <option value="em_ronda">Em Ronda / Serviço</option>
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
              : 'Nenhum veículo cadastrado para os postos filtrados.'}
          </p>
          {isManager && (
            <button
              onClick={openAddModal}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 min-h-[44px] bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Primeiro Veículo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVehicles.map((vehicle) => {
            const isInService = vehicle.status === 'em_ronda' || Boolean(vehicle.inServiceWithAgentName);
            const activeAgent = vehicle.inServiceWithAgentName || vehicle.driverName;

            return (
              <div
                key={vehicle.id}
                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:border-amber-300 dark:hover:border-amber-600 transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Foto do Veículo (visível a todos) */}
                  {vehicle.photoUrl ? (
                    <div className="h-32 w-full overflow-hidden relative bg-slate-100 dark:bg-slate-800">
                      <img
                        src={vehicle.photoUrl}
                        alt={vehicle.model}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                      <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-white">
                        <span className="font-mono text-xs font-bold bg-black/50 backdrop-blur-xs px-2 py-0.5 rounded-md">
                          {maskPlate(vehicle.plate)}
                        </span>
                        <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-md capitalize">
                          {vehicle.color}
                        </span>
                      </div>
                    </div>
                  ) : null}

                  <div className="p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-3 min-w-0">
                        {!vehicle.photoUrl && (
                          <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-lg shrink-0 mt-0.5">
                            {getTypeIcon(vehicle.type)}
                          </div>
                        )}
                        <div className="min-w-0">
                          {!vehicle.photoUrl && (
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-white tracking-wider">
                                {maskPlate(vehicle.plate)}
                              </span>
                              <span>·</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">{vehicle.color}</span>
                            </div>
                          )}
                          <h3 className="font-bold text-slate-900 dark:text-white text-base leading-tight truncate">
                            {vehicle.model}
                          </h3>
                          {vehicle.brand && (
                            <p className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">
                              {vehicle.brand}
                            </p>
                          )}
                        </div>
                      </div>
                      <div>{getStatusIndicator(vehicle.status)}</div>
                    </div>

                    {/* STATUS DE SERVIÇO EM DESTAQUE (todos visualizam quem está de serviço com o veículo) */}
                    <div className="mt-3">
                      {isInService && activeAgent ? (
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs space-y-1.5 animate-in fade-in">
                          <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-200 font-bold">
                            <span className="flex items-center gap-1.5 truncate">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
                              EM SERVIÇO: {activeAgent}
                            </span>
                            {vehicle.serviceStartedAt && (
                              <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 shrink-0">
                                Desde {vehicle.serviceStartedAt}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between text-[11px] text-emerald-800 dark:text-emerald-300 pt-1 border-t border-emerald-200/60 dark:border-emerald-800/60">
                            <span>KM Inicial: <strong>{vehicle.startKm ?? vehicle.currentKm} km</strong></span>
                            <span>Tanque: <strong>{vehicle.fuelLevel || '3/4'}</strong></span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between text-slate-600 dark:text-slate-400">
                          <span className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-500" />
                            Veículo disponível no pátio
                          </span>
                          <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md">
                            Livre para ronda
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {vehicle.condoName || 'Posto Regional da Empresa'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <Gauge className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Odômetro Atual: <strong className="text-slate-800 dark:text-slate-200">{vehicle.currentKm.toLocaleString('pt-BR')} km</strong></span>
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
                          <span>Última checagem registrada às {vehicle.lastPatrolAt}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* AÇÕES OPERACIONAIS DO AGENTE & GESTOR */}
                <div className="p-3.5 sm:p-4 bg-slate-50/80 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                  {/* Botões do Agente: Assumir ou Devolver com Checklist */}
                  <div className="flex items-center gap-2">
                    {isInService ? (
                      <button
                        onClick={() => openCheckoutModal(vehicle)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer min-h-[38px] transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Finalizar Ronda & Devolver
                      </button>
                    ) : (
                      <button
                        onClick={() => openCheckinModal(vehicle)}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer min-h-[38px] transition-colors"
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Receber Veículo para Serviço
                      </button>
                    )}

                    <button
                      onClick={() => handleRegisterQuickPatrol(vehicle)}
                      title="Registrar checagem de ponto de ronda agora (+2km)"
                      className="px-2.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-medium cursor-pointer min-h-[38px] flex items-center justify-center"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Ações restritas para Gestores (Editar e Excluir) */}
                  {isManager && (
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-750 text-[11px] text-slate-500">
                      <span>Gestão da Frota</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(vehicle)}
                          className="p-1.5 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-md text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                          title="Editar Cadastro do Veículo (Gestor)"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(vehicle.id)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                          title="Excluir Veículo da Frota (Gestor)"
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

      {/* --- MODAL DE CHECK-IN: RECEBER VEÍCULO PARA SERVIÇO --- */}
      {checkinVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Receber Veículo para Serviço
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {checkinVehicle.model} · Placa {checkinVehicle.plate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCheckinVehicle(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCheckin} className="p-4 sm:p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Agente Condutor / Rondante em Serviço *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Seu nome completo"
                  value={checkinDriverName}
                  onChange={(e) => setCheckinDriverName(e.target.value)}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Odômetro Inicial (KM) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={checkinKm}
                    onChange={(e) => setCheckinKm(Number(e.target.value))}
                    className="w-full text-sm font-mono border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-[10px] text-slate-400">Último KM registrado: {checkinVehicle.currentKm}</span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nível de Combustível *
                  </label>
                  <select
                    value={checkinFuel}
                    onChange={(e) => setCheckinFuel(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Cheio">Tanque Cheio (100%)</option>
                    <option value="3/4">3/4 Tanque</option>
                    <option value="1/2">1/2 Tanque (Meio)</option>
                    <option value="1/4">1/4 Tanque</option>
                    <option value="Reserva">Reserva (Abastecer)</option>
                  </select>
                </div>
              </div>

              {/* Checklist de Verificação de Início de Turno */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2.5">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                  Checklist Inicial do Veículo
                </p>

                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkinItems.farois}
                      onChange={(e) => setCheckinItems({ ...checkinItems, farois: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Faróis, lanterna traseira e piscas operacionais</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkinItems.pneus}
                      onChange={(e) => setCheckinItems({ ...checkinItems, pneus: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Pneus calibrados e sem danos visíveis</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkinItems.freios}
                      onChange={(e) => setCheckinItems({ ...checkinItems, freios: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Freios dianteiro e traseiro operando normalmente</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkinItems.oleo}
                      onChange={(e) => setCheckinItems({ ...checkinItems, oleo: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Nível de óleo do motor verificado</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkinItems.equipamento}
                      onChange={(e) => setCheckinItems({ ...checkinItems, equipamento: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Equipamento do condutor (capacete, colete refletivo)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkinItems.documentos}
                      onChange={(e) => setCheckinItems({ ...checkinItems, documentos: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Documento do veículo presente e chave reserva no quadro</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Observações de Início (Avarias prévias, arranhões, etc.)
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Pequeno risco na lateral direita, farol regulado, pronto para patrulha..."
                  value={checkinNotes}
                  onChange={(e) => setCheckinNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCheckinVehicle(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer min-h-[38px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs min-h-[38px] flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar e Assumir Veículo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE CHECK-OUT: FINALIZAR RONDA E DEVOLVER VEÍCULO --- */}
      {checkoutVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    Finalizar Serviço & Devolver Veículo
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {checkoutVehicle.model} · Placa {checkoutVehicle.plate}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCheckoutVehicle(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmCheckout} className="p-4 sm:p-5 space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-950/60 rounded-xl border border-blue-100 dark:border-blue-900 text-xs space-y-1">
                <p className="text-blue-900 dark:text-blue-200 font-semibold">
                  Condutor: <strong>{checkoutVehicle.inServiceWithAgentName || checkoutVehicle.driverName}</strong>
                </p>
                <div className="flex items-center justify-between text-blue-800 dark:text-blue-300 text-[11px]">
                  <span>Início do Serviço: {checkoutVehicle.serviceStartedAt || 'Turno ativo'}</span>
                  <span>Odômetro Inicial: <strong>{checkoutVehicle.startKm ?? checkoutVehicle.currentKm} km</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Odômetro Final (KM) *
                  </label>
                  <input
                    type="number"
                    required
                    min={checkoutVehicle.startKm ?? checkoutVehicle.currentKm}
                    value={checkoutFinalKm}
                    onChange={(e) => setCheckoutFinalKm(Number(e.target.value))}
                    className="w-full text-sm font-mono border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                    Distância: {Math.max(0, checkoutFinalKm - (checkoutVehicle.startKm ?? checkoutVehicle.currentKm))} km rodados
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Combustível no Retorno *
                  </label>
                  <select
                    value={checkoutFuel}
                    onChange={(e) => setCheckoutFuel(e.target.value)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Cheio">Tanque Cheio (100%)</option>
                    <option value="3/4">3/4 Tanque</option>
                    <option value="1/2">1/2 Tanque (Meio)</option>
                    <option value="1/4">1/4 Tanque</option>
                    <option value="Reserva">Reserva (Aviso para abastecer)</option>
                  </select>
                </div>
              </div>

              {/* Checklist de Retorno */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/80 space-y-2">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-rose-600" />
                  Checklist de Encerramento da Ronda
                </p>

                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkoutItems.estacionado}
                      onChange={(e) => setCheckoutItems({ ...checkoutItems, estacionado: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Veículo estacionado na vaga de prontidão</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkoutItems.chaveDevolvida}
                      onChange={(e) => setCheckoutItems({ ...checkoutItems, chaveDevolvida: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Chave entregue e guardada no claviculário</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkoutItems.semNovasAvarias}
                      onChange={(e) => setCheckoutItems({ ...checkoutItems, semNovasAvarias: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Sem novas avarias, batidas ou danos no turno</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={checkoutItems.equipamentoGuardado}
                      onChange={(e) => setCheckoutItems({ ...checkoutItems, equipamentoGuardado: e.target.checked })}
                      className="rounded text-rose-600 focus:ring-rose-500"
                    />
                    <span>Capacetes e equipamentos devolvidos na portaria</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Relatório da Ronda / Observações Finais
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Ronda perimetral realizada sem intercorrências nos portões e subsolos..."
                  value={checkoutNotes}
                  onChange={(e) => setCheckoutNotes(e.target.value)}
                  className="w-full text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setCheckoutVehicle(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer min-h-[38px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs min-h-[38px] flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Registrar Devolução & Liberar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CADASTRO / EDIÇÃO DE VEÍCULO (SOMENTE GESTORES) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <Bike className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  {editingVehicle ? 'Editar Veículo de Ronda (Gestão)' : 'Novo Veículo na Frota da Empresa'}
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
                  Condomínio Vinculado ao Veículo *
                </label>
                <select
                  value={condoId}
                  onChange={(e) => setCondoId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Ronda Regional da Empresa (Múltiplos Postos)</option>
                  {condominiums.map((condo) => (
                    <option key={condo.id} value={condo.id}>
                      {condo.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Foto do Veículo (visível a todos) */}
              <PhotoField
                label="Foto do Veículo / Viatura de Ronda"
                value={photoUrl}
                onChange={setPhotoUrl}
                type="vehicle"
                helperText="A foto ficará visível no painel da frota para toda a equipe operacional."
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Veículo *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
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
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Operacional Inicial *
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full text-sm border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="disponivel">Disponível no Posto</option>
                    <option value="em_ronda">Em Ronda / Serviço</option>
                    <option value="manutencao">Em Manutenção Mecânica</option>
                    <option value="abastecimento">Abastecendo</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Procedimento / Rota Recomendada da Ronda
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
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
