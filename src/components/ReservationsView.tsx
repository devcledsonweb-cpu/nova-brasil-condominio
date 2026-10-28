import React, { useState } from 'react';
import { CommonArea, Reservation, Unit } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  CalendarDays,
  Plus,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Building,
  Users,
  Clock,
  DollarSign,
  Info,
} from 'lucide-react';

interface ReservationsViewProps {
  areas: CommonArea[];
  reservations: Reservation[];
  units: Unit[];
  onRefresh: () => void;
}

export const ReservationsView: React.FC<ReservationsViewProps> = ({
  areas,
  reservations,
  units,
  onRefresh,
}) => {
  const { role, getAuthHeaders } = useAuth();
  const [selectedAreaId, setSelectedAreaId] = useState<number | 'all'>('all');

  // Modal Reserva
  const [showModal, setShowModal] = useState(false);
  const [areaId, setAreaId] = useState<number>(areas[0]?.id || 1);
  const [unitId, setUnitId] = useState<number>(units[0]?.id || 1);
  const [residentName, setResidentName] = useState('');
  const [reservationDate, setReservationDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [period, setPeriod] = useState<'manha' | 'tarde' | 'noite' | 'dia_todo'>('tarde');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal Nova Área Comum (Síndico)
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [areaName, setAreaName] = useState('');
  const [capacity, setCapacity] = useState('30');
  const [cleaningFee, setCleaningFee] = useState('0.00');
  const [rules, setRules] = useState('');
  const [desc, setDesc] = useState('');

  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!residentName.trim()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          areaId,
          unitId,
          residentName: residentName.trim(),
          reservationDate,
          period,
          notes: notes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao efetuar reserva.');
      }
      setShowModal(false);
      setResidentName('');
      setNotes('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelReservation = async (id: number) => {
    if (!confirm('Deseja cancelar esta reserva?')) return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/reservations/${id}/cancel`, { method: 'PUT', headers });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateArea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!areaName.trim()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/common-areas', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: areaName.trim(),
          capacity: parseInt(capacity, 10) || 30,
          cleaningFee: cleaningFee.trim() || '0.00',
          rules: rules.trim() || undefined,
          description: desc.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar área comum.');
      }
      setShowAreaModal(false);
      setAreaName('');
      setRules('');
      setDesc('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredReservations = selectedAreaId === 'all'
    ? reservations
    : reservations.filter((r) => r.areaId === selectedAreaId);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Reserva de Áreas Comuns de Lazer</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Agendamento do Salão de Festas, Churrasqueira e Quadra Poliesportiva com bloqueio de conflitos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {role === 'sindico' && (
            <button
              onClick={() => {
                setErrorMsg('');
                setShowAreaModal(true);
              }}
              className="px-3.5 py-2 text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Área de Lazer
            </button>
          )}
          <button
            onClick={() => {
              setErrorMsg('');
              if (areas.length > 0) setAreaId(areas[0].id);
              if (units.length > 0) setUnitId(units[0].id);
              setShowModal(true);
            }}
            className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Reserva
          </button>
        </div>
      </div>

      {/* Cards de Áreas Comuns Disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {areas.map((area) => (
          <div
            key={area.id}
            className={`p-4 rounded-xl border bg-white shadow-xs space-y-2.5 transition-all ${
              selectedAreaId === area.id ? 'border-slate-900 ring-1 ring-slate-900' : 'border-slate-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{area.name}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Capacidade: {area.capacity} pessoas
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAreaId(selectedAreaId === area.id ? 'all' : area.id)}
                className={`text-[11px] font-medium px-2 py-0.5 rounded cursor-pointer ${
                  selectedAreaId === area.id ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {selectedAreaId === area.id ? 'Filtrado' : 'Filtrar'}
              </button>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{area.description || 'Espaço de convivência do condomínio.'}</p>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-500">Taxa de Limpeza:</span>
              <span className="font-semibold text-slate-900">
                {Number(area.cleaningFee) > 0 ? `R$ ${area.cleaningFee}` : 'Isento'}
              </span>
            </div>

            {area.rules && (
              <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200/60 leading-tight">
                {area.rules}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Tabela de Agendamentos / Reservas */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Calendário de Reservas Registradas
            </h3>
            <p className="text-xs text-slate-500">Lista completa com controle de períodos e status</p>
          </div>
          {selectedAreaId !== 'all' && (
            <button
              onClick={() => setSelectedAreaId('all')}
              className="text-xs text-slate-600 hover:text-slate-900 underline cursor-pointer"
            >
              Limpar filtro de área
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
              <tr>
                <th className="py-2.5 px-4">Espaço / Área</th>
                <th className="py-2.5 px-4">Data do Evento</th>
                <th className="py-2.5 px-4">Período</th>
                <th className="py-2.5 px-4">Unidade Solicitante</th>
                <th className="py-2.5 px-4">Morador Responsável</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReservations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Nenhuma reserva cadastrada para a seleção.
                  </td>
                </tr>
              ) : (
                filteredReservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{r.areaName}</td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">{r.reservationDate}</td>
                    <td className="py-3 px-4 capitalize">
                      <span className="font-mono text-slate-700">
                        {r.period === 'dia_todo'
                          ? 'Dia Completo'
                          : r.period === 'manha'
                          ? 'Manhã (08h - 12h)'
                          : r.period === 'tarde'
                          ? 'Tarde (12h - 18h)'
                          : 'Noite (18h - 23h)'}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-900">
                      {r.blockName} - Apto {r.unitNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-800 font-medium">{r.residentName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                          r.status === 'confirmada'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : r.status === 'cancelada'
                            ? 'bg-rose-50 text-rose-800 border border-rose-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'confirmada' && (
                        <button
                          onClick={() => handleCancelReservation(r.id)}
                          className="text-xs text-rose-600 hover:text-rose-800 hover:underline cursor-pointer"
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Reserva com Detecção Anti-Conflito */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Agendar Reserva de Área Comum</h3>
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2 text-rose-700 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMsg}</span>
              </div>
            )}
            <form onSubmit={handleCreateReservation} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Espaço de Lazer *</label>
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (Capacidade: {a.capacity} pessoas)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Unidade Solicitante *</label>
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

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Nome do Morador Responsável *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do condômino titular"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Data do Evento *</label>
                  <input
                    type="date"
                    required
                    value={reservationDate}
                    onChange={(e) => setReservationDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Período Desejado *</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  >
                    <option value="dia_todo">Dia Todo (Exclusivo)</option>
                    <option value="manha">Manhã (08h às 12h)</option>
                    <option value="tarde">Tarde (12h às 18h)</option>
                    <option value="noite">Noite (18h às 23h)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Observações (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Aniversário em família, 25 convidados"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
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
                  {saving ? 'Validando...' : 'Confirmar Reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Área Comum */}
      {showAreaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Cadastrar Nova Área Comum</h3>
            <form onSubmit={handleCreateArea} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Nome do Espaço *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Espaço Gourmet 2"
                  value={areaName}
                  onChange={(e) => setAreaName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Capacidade (Pessoas)</label>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Taxa de Limpeza (R$)</label>
                  <input
                    type="text"
                    placeholder="100.00"
                    value={cleaningFee}
                    onChange={(e) => setCleaningFee(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Regras de Uso</label>
                <input
                  type="text"
                  placeholder="Ex: Proibido som após 22h"
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAreaModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  Salvar Área
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
