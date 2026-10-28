import React, { useState } from 'react';
import { Resident, Unit } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Users, Plus, Search, Phone, Mail, UserCheck, ShieldAlert, Trash2 } from 'lucide-react';

interface ResidentsViewProps {
  residents: Resident[];
  units: Unit[];
  onRefresh: () => void;
}

export const ResidentsView: React.FC<ResidentsViewProps> = ({ residents, units, onRefresh }) => {
  const { role, getAuthHeaders } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'proprietario' | 'inquilino'>('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [unitId, setUnitId] = useState<number>(units[0]?.id || 1);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [residentType, setResidentType] = useState<'proprietario' | 'inquilino'>('proprietario');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/residents', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          unitId,
          name: name.trim(),
          cpf: cpf.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim(),
          emergencyContact: emergencyContact.trim() || undefined,
          residentType,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao cadastrar morador.');
      }
      setShowModal(false);
      setName('');
      setCpf('');
      setEmail('');
      setPhone('');
      setEmergencyContact('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente remover o cadastro deste morador?')) return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/residents/${id}`, { method: 'DELETE', headers });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = residents.filter((r) => {
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.includes(searchTerm) ||
      (r.unitNumber && r.unitNumber.includes(searchTerm)) ||
      (r.blockName && r.blockName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || r.residentType === typeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Cadastro de Moradores</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de proprietários e inquilinos, dados de contato e vínculos habitacionais
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
          Novo Morador
        </button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou apto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              typeFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos ({residents.length})
          </button>
          <button
            onClick={() => setTypeFilter('proprietario')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              typeFilter === 'proprietario' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Proprietários ({residents.filter((r) => r.residentType === 'proprietario').length})
          </button>
          <button
            onClick={() => setTypeFilter('inquilino')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
              typeFilter === 'inquilino' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Inquilinos ({residents.filter((r) => r.residentType === 'inquilino').length})
          </button>
        </div>
      </div>

      {/* Lista / Tabela de Moradores */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
              <tr>
                <th className="py-2.5 px-4">Nome do Morador</th>
                <th className="py-2.5 px-4">Unidade / Apto</th>
                <th className="py-2.5 px-4">Vínculo</th>
                <th className="py-2.5 px-4">Telefone</th>
                <th className="py-2.5 px-4">E-mail</th>
                <th className="py-2.5 px-4">Contato de Emergência</th>
                {role === 'sindico' && <th className="py-2.5 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Nenhum morador encontrado com os filtros informados.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900 flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {r.name}
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-slate-900">
                      {r.blockName} - Apto {r.unitNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                          r.residentType === 'proprietario'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {r.residentType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700">{r.phone}</td>
                    <td className="py-3 px-4 text-slate-600">{r.email || '—'}</td>
                    <td className="py-3 px-4 text-slate-500">{r.emergencyContact || '—'}</td>
                    {role === 'sindico' && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(r.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Remover morador"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Morador */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Cadastrar Novo Morador</h3>
            {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
            <form onSubmit={handleCreateResident} className="space-y-3">
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
                  <label className="text-xs font-medium text-slate-700 block mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Roberto Silva"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Tipo de Vínculo *</label>
                  <select
                    value={residentType}
                    onChange={(e) => setResidentType(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  >
                    <option value="proprietario">Proprietário</option>
                    <option value="inquilino">Inquilino</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Telefone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98765-4321"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">CPF (opcional)</label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">E-mail</label>
                <input
                  type="email"
                  placeholder="morador@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Contato de Emergência</label>
                <input
                  type="text"
                  placeholder="Ex: Mãe Maria (11) 98888-7777"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
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
                  {saving ? 'Salvando...' : 'Cadastrar Morador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
