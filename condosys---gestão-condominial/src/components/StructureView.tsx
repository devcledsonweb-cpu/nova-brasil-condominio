import React, { useState } from 'react';
import { Block, Unit } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Building2, Plus, Home, Trash2, Edit3, ShieldAlert } from 'lucide-react';

interface StructureViewProps {
  blocks: Block[];
  units: Unit[];
  onRefresh: () => void;
}

export const StructureView: React.FC<StructureViewProps> = ({ blocks, units, onRefresh }) => {
  const { role, getAuthHeaders } = useAuth();
  const [selectedBlockId, setSelectedBlockId] = useState<number | 'all'>('all');

  // Form states
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockName, setBlockName] = useState('');
  const [blockDesc, setBlockDesc] = useState('');
  const [blockFloors, setBlockFloors] = useState('4');

  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitBlockId, setUnitBlockId] = useState<number>(blocks[0]?.id || 1);
  const [unitNumber, setUnitNumber] = useState('');
  const [unitFloor, setUnitFloor] = useState('1');
  const [unitType, setUnitType] = useState('apartamento');
  const [unitNotes, setUnitNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockName.trim()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/blocks', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: blockName.trim(),
          description: blockDesc.trim() || undefined,
          totalFloors: parseInt(blockFloors, 10) || 4,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar bloco.');
      }
      setShowBlockModal(false);
      setBlockName('');
      setBlockDesc('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/units', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          blockId: unitBlockId,
          number: unitNumber.trim(),
          floor: parseInt(unitFloor, 10) || 1,
          unitType,
          notes: unitNotes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar unidade.');
      }
      setShowUnitModal(false);
      setUnitNumber('');
      setUnitNotes('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUnit = async (id: number) => {
    if (!confirm('Deseja realmente remover esta unidade do condomínio?')) return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/units/${id}`, { method: 'DELETE', headers });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    if (!confirm('Atenção: A exclusão do bloco removerá também todas as unidades vinculadas. Continuar?')) return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/blocks/${id}`, { method: 'DELETE', headers });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUnits = selectedBlockId === 'all'
    ? units
    : units.filter((u) => u.blockId === selectedBlockId);

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Gestão de Estrutura Física</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro dinâmico de blocos, torres e unidades de apartamentos do condomínio
          </p>
        </div>
        {role === 'sindico' ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setErrorMsg('');
                setShowBlockModal(true);
              }}
              className="px-3.5 py-2 text-xs font-medium border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Bloco / Torre
            </button>
            <button
              onClick={() => {
                setErrorMsg('');
                if (blocks.length > 0) setUnitBlockId(blocks[0].id);
                setShowUnitModal(true);
              }}
              className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Nova Unidade / Apto
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-lg">
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            <span>Modo Portaria: Visualização de unidades</span>
          </div>
        )}
      </div>

      {/* Grid de Blocos Cadastrados */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Blocos e Torres ({blocks.length})
          </h3>
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setSelectedBlockId('all')}
              className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                selectedBlockId === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todos os Blocos
            </button>
            {blocks.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBlockId(b.id)}
                className={`px-3 py-1 rounded-md font-medium transition-colors cursor-pointer ${
                  selectedBlockId === b.id
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blocks.map((block) => {
            const countUnits = units.filter((u) => u.blockId === block.id).length;
            return (
              <div
                key={block.id}
                className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs relative space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-slate-700" />
                    <h4 className="text-sm font-bold text-slate-900">{block.name}</h4>
                  </div>
                  {role === 'sindico' && (
                    <button
                      onClick={() => handleDeleteBlock(block.id)}
                      title="Excluir bloco"
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-slate-500">{block.description || 'Sem descrição complementar.'}</p>
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-600">{block.totalFloors || 4} andares</span>
                  <span className="text-slate-900 font-semibold">{countUnits} unidades</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabela de Unidades / Apartamentos */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Unidades Residenciais {selectedBlockId !== 'all' ? `(${blocks.find(b => b.id === selectedBlockId)?.name})` : ''}
            </h3>
            <p className="text-xs text-slate-500">Total: {filteredUnits.length} apartamentos listados</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
              <tr>
                <th className="py-2.5 px-4">Bloco</th>
                <th className="py-2.5 px-4">Unidade / Apto</th>
                <th className="py-2.5 px-4">Andar</th>
                <th className="py-2.5 px-4">Tipo</th>
                <th className="py-2.5 px-4">Observações</th>
                {role === 'sindico' && <th className="py-2.5 px-4 text-right">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUnits.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    Nenhuma unidade cadastrada para a seleção atual.
                  </td>
                </tr>
              ) : (
                filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900">{unit.blockName}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                      Apto {unit.number}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{unit.floor}º Andar</td>
                    <td className="py-3 px-4 capitalize text-slate-600">{unit.unitType}</td>
                    <td className="py-3 px-4 text-slate-500">{unit.notes || '—'}</td>
                    {role === 'sindico' && (
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDeleteUnit(unit.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Remover unidade"
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

      {/* Modal Criar Bloco */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Cadastrar Novo Bloco / Torre</h3>
            {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
            <form onSubmit={handleCreateBlock} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Nome do Bloco *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bloco C - Palmeiras"
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Total de Andares</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={blockFloors}
                  onChange={(e) => setBlockFloors(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Descrição / Detalhes</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Torre residencial entregue em 2024"
                  value={blockDesc}
                  onChange={(e) => setBlockDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Salvar Bloco'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Unidade */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Cadastrar Nova Unidade / Apartamento</h3>
            {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
            <form onSubmit={handleCreateUnit} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Bloco de Vínculo *</label>
                <select
                  value={unitBlockId}
                  onChange={(e) => setUnitBlockId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                >
                  {blocks.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Número do Apto *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 302"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Andar</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={unitFloor}
                    onChange={(e) => setUnitFloor(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Tipo de Unidade</label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                >
                  <option value="apartamento">Apartamento Padrão</option>
                  <option value="cobertura">Cobertura</option>
                  <option value="garden">Apartamento Garden</option>
                  <option value="studio">Studio</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Observações (opcional)</label>
                <input
                  type="text"
                  placeholder="Ex: Vaga extra vinculada"
                  value={unitNotes}
                  onChange={(e) => setUnitNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUnitModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Salvando...' : 'Cadastrar Unidade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
