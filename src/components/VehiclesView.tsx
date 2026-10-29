import React, { useState } from 'react';
import { Vehicle, Unit } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { maskPlate } from '../utils/masks.ts';
import { Car, Plus, Search, Shield, Trash2, Key } from 'lucide-react';

interface VehiclesViewProps {
  vehicles: Vehicle[];
  units: Unit[];
  onRefresh: () => void;
}

export const VehiclesView: React.FC<VehiclesViewProps> = ({ vehicles, units, onRefresh }) => {
  const { role, getAuthHeaders } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [spotFilter, setSpotFilter] = useState<'all' | 'coberta' | 'descoberta'>('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [unitId, setUnitId] = useState<number>(units[0]?.id || 1);
  const [plate, setPlate] = useState('');
  const [model, setModel] = useState('');
  const [color, setColor] = useState('');
  const [parkingSpot, setParkingSpot] = useState('');
  const [spotType, setSpotType] = useState<'coberta' | 'descoberta'>('coberta');
  const [residentName, setResidentName] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plate.trim() || !model.trim() || !parkingSpot.trim()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/vehicles', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          unitId,
          plate: plate.toUpperCase().trim(),
          model: model.trim(),
          color: color.trim(),
          parkingSpot: parkingSpot.trim(),
          spotType,
          residentName: residentName.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao registrar veículo.');
      }
      setShowModal(false);
      setPlate('');
      setModel('');
      setColor('');
      setParkingSpot('');
      setResidentName('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente remover o registro deste veículo?')) return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/vehicles/${id}`, { method: 'DELETE', headers });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = vehicles.filter((v) => {
    const cleanSearch = searchTerm.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const cleanPlate = v.plate.toUpperCase().replace(/[^A-Z0-9]/g, '');
    const matchesSearch =
      cleanPlate.includes(cleanSearch) ||
      v.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.parkingSpot.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.unitNumber && v.unitNumber.includes(searchTerm)) ||
      (v.residentName && v.residentName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSpot = spotFilter === 'all' || v.spotType === spotFilter;
    return matchesSearch && matchesSpot;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Controle de Veículos e Vagas de Garagem</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identificação ágil de automóveis na portaria, vínculo por placa e mapeamento de vagas
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMsg('');
            if (units.length > 0) setUnitId(units[0].id);
            setShowModal(true);
          }}
          className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Registrar Veículo
        </button>
      </div>

      {/* Caixa de Busca Rápida na Portaria */}
      <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xs">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="space-y-1 w-full sm:w-auto">
            <span className="text-[11px] font-mono text-emerald-400 font-semibold uppercase">
              Identificação Instantânea na Portaria
            </span>
            <p className="text-xs text-slate-300">
              Digite a placa (ex: BRA2E19) ou número do apartamento para consultar proprietário e vaga
            </p>
          </div>
          <div className="relative w-full sm:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Digite a placa ou apto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-800 border border-slate-700 text-white placeholder-slate-400 rounded-lg focus:outline-hidden focus:border-emerald-400 font-mono uppercase"
            />
          </div>
        </div>
      </div>

      {/* Filtros de Vagas */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-500">
          Encontrados: <span className="font-semibold text-slate-900 font-mono">{filtered.length}</span> veículos
        </p>
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs">
          <button
            onClick={() => setSpotFilter('all')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              spotFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Todas as Vagas ({vehicles.length})
          </button>
          <button
            onClick={() => setSpotFilter('coberta')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              spotFilter === 'coberta' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Cobertas ({vehicles.filter((v) => v.spotType === 'coberta').length})
          </button>
          <button
            onClick={() => setSpotFilter('descoberta')}
            className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
              spotFilter === 'descoberta' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            Descobertas ({vehicles.filter((v) => v.spotType === 'descoberta').length})
          </button>
        </div>
      </div>

      {/* Grid de Veículos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-xl">
            Nenhum veículo encontrado com a busca informada.
          </div>
        ) : (
          filtered.map((v) => (
            <div
              key={v.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative space-y-3 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-slate-100 rounded-lg text-slate-700">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-mono font-bold text-sm tracking-wider px-2 py-0.5 bg-slate-100 border border-slate-300 rounded text-slate-900">
                      {v.plate}
                    </span>
                    <p className="text-xs font-semibold text-slate-900 mt-1">{v.model}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(v.id)}
                  title="Excluir veículo"
                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-500">Unidade:</span>
                  <span className="font-semibold text-slate-900 font-mono">
                    {v.blockName} - Apto {v.unitNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vaga Designada:</span>
                  <span className="font-mono font-medium text-slate-900">
                    {v.parkingSpot} ({v.spotType})
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cor do Veículo:</span>
                  <span className="text-slate-700">{v.color}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Condutor Habitual:</span>
                  <span className="text-slate-800 font-medium">{v.residentName || 'Morador cadastrado'}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Novo Veículo */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Registrar Novo Veículo</h3>
            {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
            <form onSubmit={handleCreateVehicle} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Unidade / Apartamento *</label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(Number(e.target.value))}
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
                  <label className="text-xs font-medium text-slate-700 block mb-1">Placa do Veículo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: ABC-1234 ou ABC1D23"
                    maxLength={8}
                    value={plate}
                    onChange={(e) => setPlate(maskPlate(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Modelo / Marca *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Honda Civic"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Cor Predominante *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Preto, Prata"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Vaga Designada *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Vaga 04-B"
                    value={parkingSpot}
                    onChange={(e) => setParkingSpot(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Tipo de Vaga</label>
                  <select
                    value={spotType}
                    onChange={(e) => setSpotType(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  >
                    <option value="coberta">Coberta</option>
                    <option value="descoberta">Descoberta</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Condutor Principal</label>
                  <input
                    type="text"
                    placeholder="Nome do morador"
                    value={residentName}
                    onChange={(e) => setResidentName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Salvar Veículo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
