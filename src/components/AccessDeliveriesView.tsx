import React, { useState } from 'react';
import { AccessLog, Delivery, Unit } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { maskDocument, maskPlate } from '../utils/masks.ts';
import {
  Shield,
  Package,
  UserCheck,
  Plus,
  LogOut,
  CheckCircle2,
  Clock,
  Search,
  Truck,
  Building,
  UserPlus,
} from 'lucide-react';

interface AccessDeliveriesViewProps {
  accessLogs: AccessLog[];
  deliveries: Delivery[];
  units: Unit[];
  onRefresh: () => void;
}

export const AccessDeliveriesView: React.FC<AccessDeliveriesViewProps> = ({
  accessLogs,
  deliveries,
  units,
  onRefresh,
}) => {
  const { user, getAuthHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState<'acessos' | 'encomendas'>('acessos');

  // Filtros de Acessos
  const [accessSearch, setAccessSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState<'all' | 'ativos' | 'finalizados'>('ativos');

  // Filtros de Encomendas
  const [deliverySearch, setDeliverySearch] = useState('');
  const [deliveryFilter, setDeliveryFilter] = useState<'all' | 'aguardando' | 'retirado'>('aguardando');

  // Modal Novo Acesso
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [visitorType, setVisitorType] = useState<'visitante' | 'prestador'>('visitante');
  const [visitorName, setVisitorName] = useState('');
  const [visitorDoc, setVisitorDoc] = useState('');
  const [visitorCompany, setVisitorCompany] = useState('');
  const [accessUnitId, setAccessUnitId] = useState<number>(units[0]?.id || 1);
  const [authorizedBy, setAuthorizedBy] = useState('');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [accessNotes, setAccessNotes] = useState('');

  // Modal Nova Encomenda
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [deliveryUnitId, setDeliveryUnitId] = useState<number>(units[0]?.id || 1);
  const [recipientName, setRecipientName] = useState('');
  const [trackingCode, setTrackingCode] = useState('');
  const [carrier, setCarrier] = useState('Correios');
  const [packageType, setPackageType] = useState('caixa');
  const [location, setLocation] = useState('Armário Portaria - Prateleira A');

  // Modal Retirada de Encomenda
  const [pickupDelivery, setPickupDelivery] = useState<Delivery | null>(null);
  const [pickedUpBy, setPickedUpBy] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handlers de Acesso
  const handleCreateAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim() || !visitorDoc.trim()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/access-logs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          visitorType,
          name: visitorName.trim(),
          document: visitorDoc.trim(),
          company: visitorCompany.trim() || undefined,
          unitId: accessUnitId,
          authorizedBy: authorizedBy.trim() || undefined,
          vehiclePlate: vehiclePlate.trim().toUpperCase() || undefined,
          notes: accessNotes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao registrar acesso.');
      }
      setShowAccessModal(false);
      setVisitorName('');
      setVisitorDoc('');
      setVisitorCompany('');
      setAuthorizedBy('');
      setVehiclePlate('');
      setAccessNotes('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterExit = async (id: number) => {
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/access-logs/${id}/exit`, { method: 'PUT', headers });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  // Handlers de Encomendas
  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientName.trim()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/deliveries', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          unitId: deliveryUnitId,
          recipientName: recipientName.trim(),
          trackingCode: trackingCode.trim() || undefined,
          carrier,
          packageType,
          location,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao registrar encomenda.');
      }
      setShowDeliveryModal(false);
      setRecipientName('');
      setTrackingCode('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupDelivery || !pickedUpBy.trim()) return;
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/deliveries/${pickupDelivery.id}/pickup`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ pickedUpBy: pickedUpBy.trim() }),
      });
      setPickupDelivery(null);
      setPickedUpBy('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  // Filtros
  const filteredAccess = accessLogs.filter((log) => {
    const matchesSearch =
      log.name.toLowerCase().includes(accessSearch.toLowerCase()) ||
      log.document.includes(accessSearch) ||
      (log.vehiclePlate && log.vehiclePlate.includes(accessSearch.toUpperCase())) ||
      (log.unitNumber && log.unitNumber.includes(accessSearch));
    const isInside = !log.exitTime;
    const matchesFilter =
      accessFilter === 'all' || (accessFilter === 'ativos' ? isInside : !isInside);
    return matchesSearch && matchesFilter;
  });

  const filteredDeliveries = deliveries.filter((d) => {
    const matchesSearch =
      d.recipientName.toLowerCase().includes(deliverySearch.toLowerCase()) ||
      (d.trackingCode && d.trackingCode.toLowerCase().includes(deliverySearch.toLowerCase())) ||
      (d.unitNumber && d.unitNumber.includes(deliverySearch)) ||
      d.carrier.toLowerCase().includes(deliverySearch.toLowerCase());
    const matchesFilter = deliveryFilter === 'all' || d.status === deliveryFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Operação de Portaria e Recepção</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de fluxo de visitantes, prestadores de serviço e aviso e entrega de encomendas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'acessos' ? (
            <button
              onClick={() => {
                setErrorMsg('');
                if (units.length > 0) setAccessUnitId(units[0].id);
                setShowAccessModal(true);
              }}
              className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Registrar Entrada
            </button>
          ) : (
            <button
              onClick={() => {
                setErrorMsg('');
                if (units.length > 0) setDeliveryUnitId(units[0].id);
                setShowDeliveryModal(true);
              }}
              className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Receber Nova Encomenda
            </button>
          )}
        </div>
      </div>

      {/* Alternador de Módulo Portaria */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('acessos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'acessos'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Controle de Acessos & Visitantes ({accessLogs.filter((l) => !l.exitTime).length} ativos)</span>
        </button>
        <button
          onClick={() => setActiveTab('encomendas')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'encomendas'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Encomendas na Recepção ({deliveries.filter((d) => d.status === 'aguardando').length} pendentes)</span>
        </button>
      </div>

      {/* ABA 1: CONTROLE DE ACESSOS */}
      {activeTab === 'acessos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar por nome, documento, placa..."
                value={accessSearch}
                onChange={(e) => setAccessSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setAccessFilter('ativos')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  accessFilter === 'ativos' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                No Condomínio ({accessLogs.filter((l) => !l.exitTime).length})
              </button>
              <button
                onClick={() => setAccessFilter('finalizados')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  accessFilter === 'finalizados' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Histórico Saídas ({accessLogs.filter((l) => !!l.exitTime).length})
              </button>
              <button
                onClick={() => setAccessFilter('all')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  accessFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Todos ({accessLogs.length})
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                  <tr>
                    <th className="py-2.5 px-4">Visitante / Prestador</th>
                    <th className="py-2.5 px-4">Tipo</th>
                    <th className="py-2.5 px-4">Documento</th>
                    <th className="py-2.5 px-4">Destino (Apto)</th>
                    <th className="py-2.5 px-4">Entrada</th>
                    <th className="py-2.5 px-4">Saída</th>
                    <th className="py-2.5 px-4">Autorizado por</th>
                    <th className="py-2.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAccess.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Nenhum registro de acesso encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredAccess.map((log) => {
                      const isInside = !log.exitTime;
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{log.name}</div>
                            {log.company && (
                              <div className="text-[11px] text-slate-500">Empresa: {log.company}</div>
                            )}
                            {log.vehiclePlate && (
                              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 rounded text-slate-700">
                                Placa: {log.vehiclePlate}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 capitalize">
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded font-medium ${
                                log.visitorType === 'prestador'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-blue-50 text-blue-800 border border-blue-200'
                              }`}
                            >
                              {log.visitorType}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">{log.document}</td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-900">
                            {log.blockName} - Apto {log.unitNumber}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {new Date(log.entryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {log.exitTime
                              ? new Date(log.exitTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{log.authorizedBy || 'Interfone'}</td>
                          <td className="py-3 px-4 text-right">
                            {isInside ? (
                              <button
                                onClick={() => handleRegisterExit(log.id)}
                                className="px-2.5 py-1 text-[11px] font-medium bg-slate-900 text-white rounded hover:bg-slate-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                              >
                                <LogOut className="w-3 h-3" />
                                Registrar Saída
                              </button>
                            ) : (
                              <span className="text-[11px] text-slate-400 font-mono">Concluído</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ABA 2: ENCOMENDAS */}
      {activeTab === 'encomendas' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Buscar destinatário, rastreio, apto..."
                value={deliverySearch}
                onChange={(e) => setDeliverySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
              <button
                onClick={() => setDeliveryFilter('aguardando')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  deliveryFilter === 'aguardando' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Aguardando Retirada ({deliveries.filter((d) => d.status === 'aguardando').length})
              </button>
              <button
                onClick={() => setDeliveryFilter('retirado')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  deliveryFilter === 'retirado' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Já Entregues ({deliveries.filter((d) => d.status === 'retirado').length})
              </button>
              <button
                onClick={() => setDeliveryFilter('all')}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  deliveryFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Todas ({deliveries.length})
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
                  <tr>
                    <th className="py-2.5 px-4">Destinatário</th>
                    <th className="py-2.5 px-4">Unidade</th>
                    <th className="py-2.5 px-4">Transportadora</th>
                    <th className="py-2.5 px-4">Código Rastreio</th>
                    <th className="py-2.5 px-4">Localização na Portaria</th>
                    <th className="py-2.5 px-4">Recebido em</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDeliveries.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                        Nenhuma encomenda encontrada.
                      </td>
                    </tr>
                  ) : (
                    filteredDeliveries.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-900">{d.recipientName}</td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-900">
                          {d.blockName} - Apto {d.unitNumber}
                        </td>
                        <td className="py-3 px-4 text-slate-700">{d.carrier}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{d.trackingCode || '—'}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{d.location}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">
                          {new Date(d.receivedAt).toLocaleDateString()} {new Date(d.receivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                              d.status === 'aguardando'
                                ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            }`}
                          >
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {d.status === 'aguardando' ? (
                            <button
                              onClick={() => {
                                setPickupDelivery(d);
                                setPickedUpBy(d.recipientName);
                              }}
                              className="px-2.5 py-1 text-[11px] font-medium bg-emerald-700 text-white rounded hover:bg-emerald-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Dar Baixa
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400" title={`Retirado por ${d.pickedUpBy || 'Morador'}`}>
                              Entregue a {d.pickedUpBy || 'Morador'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Registrar Acesso */}
      {showAccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Registrar Entrada na Portaria</h3>
            {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
            <form onSubmit={handleCreateAccess} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Tipo de Ingresso *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setVisitorType('visitante')}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      visitorType === 'visitante'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Visitante Familiar / Social
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisitorType('prestador')}
                    className={`py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                      visitorType === 'prestador'
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Prestador de Serviços
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome da pessoa"
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Documento (CPF / RG) *</label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00 ou RG"
                    maxLength={18}
                    value={visitorDoc}
                    onChange={(e) => setVisitorDoc(maskDocument(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              {visitorType === 'prestador' && (
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Empresa / Razão Social</label>
                  <input
                    type="text"
                    placeholder="Ex: Net Claro, Enel, Pintura Express"
                    value={visitorCompany}
                    onChange={(e) => setVisitorCompany(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Unidade Destino *</label>
                  <select
                    value={accessUnitId}
                    onChange={(e) => setAccessUnitId(Number(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  >
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.blockName} - Apto {u.number}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Autorizado por</label>
                  <input
                    type="text"
                    placeholder="Ex: Morador Carlos (interfone)"
                    value={authorizedBy}
                    onChange={(e) => setAuthorizedBy(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Placa do Veículo (se houver)</label>
                  <input
                    type="text"
                    placeholder="Ex: ABC-1234 ou ABC1D23"
                    maxLength={8}
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(maskPlate(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Notas / Motivo</label>
                  <input
                    type="text"
                    placeholder="Ex: Entrega de móveis"
                    value={accessNotes}
                    onChange={(e) => setAccessNotes(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAccessModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Registrando...' : 'Confirmar Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Encomenda */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Receber Nova Encomenda na Portaria</h3>
            {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
            <form onSubmit={handleCreateDelivery} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Unidade Destino *</label>
                <select
                  value={deliveryUnitId}
                  onChange={(e) => setDeliveryUnitId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                >
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.blockName} - Apto {u.number}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Destinatário *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nome que consta no pacote"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Transportadora *</label>
                  <select
                    value={carrier}
                    onChange={(e) => setCarrier(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  >
                    <option value="Correios">Correios</option>
                    <option value="Mercado Livre">Mercado Livre</option>
                    <option value="Amazon">Amazon</option>
                    <option value="Shopee">Shopee</option>
                    <option value="Jadlog">Jadlog</option>
                    <option value="FedEx">FedEx / DHL</option>
                    <option value="Outro">Outra Transportadora</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Código de Rastreio / Nota</label>
                  <input
                    type="text"
                    placeholder="Ex: NL123456789BR"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Tipo de Volume</label>
                  <select
                    value={packageType}
                    onChange={(e) => setPackageType(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  >
                    <option value="caixa">Caixa de Papelão</option>
                    <option value="pacote">Pacote Plástico</option>
                    <option value="envelope">Envelope / Carta</option>
                    <option value="refrigerado">Perecível / Refrigerado</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Local Guardado na Portaria</label>
                <input
                  type="text"
                  placeholder="Ex: Armário A - Prateleira 2"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Gravando...' : 'Registrar Encomenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Baixa de Encomenda */}
      {pickupDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Registrar Entrega ao Morador</h3>
            <p className="text-xs text-slate-500">
              Encomenda da {pickupDelivery.carrier} para {pickupDelivery.blockName} Apto {pickupDelivery.unitNumber}.
            </p>
            <form onSubmit={handleConfirmPickup} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Nome de Quem Retirou *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo ou Empregada"
                  value={pickedUpBy}
                  onChange={(e) => setPickedUpBy(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPickupDelivery(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-medium bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Registrando...' : 'Confirmar Retirada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
