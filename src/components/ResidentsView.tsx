import React, { useState } from 'react';
import { Resident, Unit, Condominium } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { maskCPF, maskPhone } from '../utils/masks.ts';
import { safeFetchJson } from '../services/api.ts';
import { Users, Plus, Search, Phone, Mail, UserCheck, ShieldAlert, Trash2, Building2 } from 'lucide-react';

interface ResidentsViewProps {
  residents: Resident[];
  units: Unit[];
  condominiums: Condominium[];
  selectedCondoId: number | 'all';
  onRefresh: () => void;
}

export const ResidentsView: React.FC<ResidentsViewProps> = ({
  residents,
  units,
  condominiums,
  selectedCondoId,
  onRefresh,
}) => {
  const { role, getAuthHeaders } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'proprietario' | 'inquilino'>('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [residentCondoId, setResidentCondoId] = useState<number>(
    selectedCondoId === 'all' ? condominiums[0]?.id || 1 : selectedCondoId
  );
  const [unitId, setUnitId] = useState<number>(units[0]?.id || 1);
  const [name, setName] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [residentType, setResidentType] = useState<'proprietario' | 'inquilino'>('proprietario');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sincronizar quando muda condomínio no header
  React.useEffect(() => {
    if (selectedCondoId !== 'all') {
      setResidentCondoId(selectedCondoId);
    }
  }, [selectedCondoId]);

  const availableUnitsForResident = units.filter(
    (u) => !residentCondoId || u.condoId === residentCondoId
  );

  const handleCreateResident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !unitId) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const result = await safeFetchJson('/api/residents', {
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
          condoId: residentCondoId,
        }),
      });

      // Sincronizar com localStorage para suporte a ambientes estáticos (Vercel)
      const localResidentsStr = localStorage.getItem('novabrasil_residents');
      let list: Resident[] = localResidentsStr ? JSON.parse(localResidentsStr) : [...residents];
      const targetUnit = units.find((u) => u.id === unitId);
      const newResident: Resident = (result.success && result.data) ? result.data : {
        id: (result.data && result.data.id) || Date.now(),
        unitId,
        condoId: residentCondoId,
        name: name.trim(),
        cpf: cpf.trim() || null,
        email: email.trim() || null,
        phone: phone.trim(),
        emergencyContact: emergencyContact.trim() || null,
        residentType,
        isActive: true,
        unitNumber: targetUnit ? targetUnit.number : '',
        blockName: targetUnit ? targetUnit.blockName : '',
        condoName: condominiums.find((c) => c.id === residentCondoId)?.name || '',
        createdAt: new Date().toISOString(),
      };
      list.push(newResident);
      localStorage.setItem('novabrasil_residents', JSON.stringify(list));

      setShowModal(false);
      setName('');
      setCpf('');
      setEmail('');
      setPhone('');
      setEmergencyContact('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao cadastrar morador.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Deseja realmente remover o cadastro deste morador?')) return;
    try {
      const headers = await getAuthHeaders();
      try {
        await safeFetchJson(`/api/residents/${id}`, { method: 'DELETE', headers });
      } catch (e) {
        console.warn('Erro ao deletar morador via API:', e);
      }

      const localResidentsStr = localStorage.getItem('novabrasil_residents');
      if (localResidentsStr) {
        const list = JSON.parse(localResidentsStr).filter((r: any) => r.id !== id);
        localStorage.setItem('novabrasil_residents', JSON.stringify(list));
      }

      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = residents.filter((r) => {
    const matchesCondo = selectedCondoId === 'all' || r.condoId === selectedCondoId;
    const matchesSearch =
      r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.phone.includes(searchTerm) ||
      (r.unitNumber && r.unitNumber.includes(searchTerm)) ||
      (r.blockName && r.blockName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.condoName && r.condoName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || r.residentType === typeFilter;
    return matchesCondo && matchesSearch && matchesType;
  });

  const activeCondoName =
    selectedCondoId === 'all'
      ? 'Todos os Condomínios'
      : condominiums.find((c) => c.id === selectedCondoId)?.name || 'Condomínio';

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Cadastro de Moradores
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {activeCondoName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de proprietários e inquilinos especificamente vinculados a cada condomínio e unidade
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMsg('');
            const defCondo = selectedCondoId === 'all' ? condominiums[0]?.id || 1 : selectedCondoId;
            setResidentCondoId(defCondo);
            const matching = units.filter((u) => u.condoId === defCondo);
            if (matching.length > 0) {
              setUnitId(matching[0].id);
            }
            setShowModal(true);
          }}
          disabled={units.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Cadastrar Morador</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone, bloco ou apartamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 focus:ring-1 focus:ring-slate-900 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as any)}
            className="px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-slate-900"
          >
            <option value="all">Todos os Vínculos</option>
            <option value="proprietario">Apenas Proprietários</option>
            <option value="inquilino">Apenas Inquilinos</option>
          </select>
        </div>
      </div>

      {/* Tabela de Moradores */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                {selectedCondoId === 'all' && <th className="py-3 px-4">Condomínio</th>}
                <th className="py-3 px-4">Morador</th>
                <th className="py-3 px-4">Unidade / Bloco</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Contatos</th>
                <th className="py-3 px-4">Emergência</th>
                {role === 'sindico' && <th className="py-3 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filtered.map((resident) => (
                <tr key={resident.id} className="hover:bg-slate-50/60 transition-colors">
                  {selectedCondoId === 'all' && (
                    <td className="py-3 px-4 font-medium text-slate-800">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[140px]">
                          {resident.condoName || 'Principal'}
                        </span>
                      </div>
                    </td>
                  )}
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-900">{resident.name}</div>
                    {resident.cpf && (
                      <div className="text-[10px] text-slate-400 font-mono">
                        CPF: {maskCPF(resident.cpf)}
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      Apto {resident.unitNumber}
                    </span>
                    <span className="text-slate-500 block text-[11px] mt-0.5">
                      {resident.blockName}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        resident.residentType === 'proprietario'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                    >
                      {resident.residentType === 'proprietario' ? 'Proprietário' : 'Inquilino'}
                    </span>
                  </td>
                  <td className="py-3 px-4 space-y-0.5">
                    <div className="flex items-center gap-1.5 font-mono text-slate-800">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{maskPhone(resident.phone)}</span>
                    </div>
                    {resident.email && (
                      <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                        <Mail className="w-3 h-3 text-slate-400" />
                        <span>{resident.email}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-[11px]">
                    {resident.emergencyContact || '—'}
                  </td>
                  {role === 'sindico' && (
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDelete(resident.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer transition-colors"
                        title="Remover morador"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={selectedCondoId === 'all' ? 7 : 6}
                    className="py-8 text-center text-slate-400 text-xs"
                  >
                    Nenhum morador encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Novo Morador */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Cadastrar Novo Morador</h3>
              <button
                onClick={() => setShowModal(false)}
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

            <form onSubmit={handleCreateResident} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Condomínio *
                </label>
                <select
                  value={residentCondoId}
                  onChange={(e) => {
                    const cId = Number(e.target.value);
                    setResidentCondoId(cId);
                    const matching = units.filter((u) => u.condoId === cId);
                    if (matching.length > 0) {
                      setUnitId(matching[0].id);
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-slate-900 font-medium"
                >
                  {condominiums.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.city ? `(${c.city})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Apartamento Vinculado *
                </label>
                <select
                  value={unitId}
                  onChange={(e) => setUnitId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-slate-900"
                >
                  {availableUnitsForResident.map((u) => (
                    <option key={u.id} value={u.id}>
                      Apto {u.number} — {u.blockName}
                    </option>
                  ))}
                </select>
                {availableUnitsForResident.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Nenhum apartamento cadastrado neste condomínio. Cadastre apartamentos primeiro.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Vínculo Habitacional
                  </label>
                  <select
                    value={residentType}
                    onChange={(e) => setResidentType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-slate-900"
                  >
                    <option value="proprietario">Proprietário</option>
                    <option value="inquilino">Inquilino</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    CPF (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="000.000.000-00"
                    maxLength={14}
                    value={cpf}
                    onChange={(e) => setCpf(maskCPF(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Telefone / WhatsApp *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 98888-7777"
                    maxLength={15}
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    E-mail
                  </label>
                  <input
                    type="email"
                    placeholder="morador@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Contato de Emergência
                </label>
                <input
                  type="text"
                  placeholder="Ex: Esposa Maria (11) 97777-6666"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || availableUnitsForResident.length === 0}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Salvar Morador'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
