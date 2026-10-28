import React, { useState } from 'react';
import { Block, Unit, Condominium } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { Building2, Plus, Home, Trash2, Edit3, ShieldAlert, Layers, MapPin } from 'lucide-react';

interface StructureViewProps {
  blocks: Block[];
  units: Unit[];
  condominiums: Condominium[];
  selectedCondoId: number | 'all';
  onRefresh: () => void;
}

export const StructureView: React.FC<StructureViewProps> = ({
  blocks,
  units,
  condominiums,
  selectedCondoId,
  onRefresh,
}) => {
  const { role, getAuthHeaders } = useAuth();
  const [selectedBlockId, setSelectedBlockId] = useState<number | 'all'>('all');

  // Form states - Bloco
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockCondoId, setBlockCondoId] = useState<number>(
    selectedCondoId === 'all' ? condominiums[0]?.id || 1 : selectedCondoId
  );
  const [blockName, setBlockName] = useState('');
  const [blockDesc, setBlockDesc] = useState('');
  const [blockFloors, setBlockFloors] = useState('4');

  // Form states - Unidade
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [unitCondoId, setUnitCondoId] = useState<number>(
    selectedCondoId === 'all' ? condominiums[0]?.id || 1 : selectedCondoId
  );
  const [unitBlockId, setUnitBlockId] = useState<number>(blocks[0]?.id || 1);
  const [unitNumber, setUnitNumber] = useState('');
  const [unitFloor, setUnitFloor] = useState('1');
  const [unitType, setUnitType] = useState('apartamento');
  const [unitNotes, setUnitNotes] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Sincronizar condomínio padrão quando selecionado no topo
  React.useEffect(() => {
    if (selectedCondoId !== 'all') {
      setBlockCondoId(selectedCondoId);
      setUnitCondoId(selectedCondoId);
    }
  }, [selectedCondoId]);

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
          condoId: blockCondoId,
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
          condoId: unitCondoId,
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
    if (!confirm('Deseja realmente remover esta unidade?')) return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/units/${id}`, { method: 'DELETE', headers });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBlock = async (id: number) => {
    if (
      !confirm(
        'Atenção: A exclusão do bloco removerá também todos os apartamentos vinculados. Deseja continuar?'
      )
    )
      return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/blocks/${id}`, { method: 'DELETE', headers });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredBlocks =
    selectedCondoId === 'all'
      ? blocks
      : blocks.filter((b) => b.condoId === selectedCondoId);

  const filteredUnits = units
    .filter((u) => selectedCondoId === 'all' || u.condoId === selectedCondoId)
    .filter((u) => selectedBlockId === 'all' || u.blockId === selectedBlockId);

  const activeCondoName =
    selectedCondoId === 'all'
      ? 'Todos os Condomínios'
      : condominiums.find((c) => c.id === selectedCondoId)?.name || 'Condomínio';

  // Blocos disponíveis para adicionar unidade com base no condomínio escolhido no modal
  const availableBlocksForUnitModal = blocks.filter((b) => b.condoId === unitCondoId);

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Estrutura & Unidades
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700 border border-slate-200">
              {activeCondoName}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastro de blocos/torres e apartamentos de cada condomínio administrado
          </p>
        </div>

        {role === 'sindico' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setErrorMsg('');
                if (selectedCondoId !== 'all') {
                  setBlockCondoId(selectedCondoId);
                } else if (condominiums.length > 0) {
                  setBlockCondoId(condominiums[0].id);
                }
                setShowBlockModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Bloco</span>
            </button>
            <button
              onClick={() => {
                setErrorMsg('');
                const defaultCondo =
                  selectedCondoId === 'all'
                    ? condominiums[0]?.id || 1
                    : selectedCondoId;
                setUnitCondoId(defaultCondo);
                const matchingBlocks = blocks.filter((b) => b.condoId === defaultCondo);
                if (matchingBlocks.length > 0) {
                  setUnitBlockId(matchingBlocks[0].id);
                }
                setShowUnitModal(true);
              }}
              disabled={blocks.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Novo Apartamento</span>
            </button>
          </div>
        )}
      </div>

      {/* Blocos Cadastrados */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Blocos & Torres ({filteredBlocks.length})
          </h3>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSelectedBlockId('all')}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                selectedBlockId === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todos os Blocos
            </button>
            {filteredBlocks.map((b) => (
              <button
                key={b.id}
                onClick={() => setSelectedBlockId(b.id)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer ${
                  selectedBlockId === b.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {b.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBlocks.map((block) => {
            const count = units.filter((u) => u.blockId === block.id).length;
            const isFilterActive = selectedBlockId === block.id;

            return (
              <div
                key={block.id}
                onClick={() => setSelectedBlockId(isFilterActive ? 'all' : block.id)}
                className={`p-4 bg-white border rounded-xl transition-all cursor-pointer shadow-xs ${
                  isFilterActive
                    ? 'border-slate-900 ring-2 ring-slate-900/10'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{block.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {block.totalFloors || 4} andares • {count} apartamentos
                      </p>
                    </div>
                  </div>

                  {role === 'sindico' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteBlock(block.id);
                      }}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                      title="Excluir Bloco"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {block.condoName && selectedCondoId === 'all' && (
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span className="truncate">{block.condoName}</span>
                  </div>
                )}

                {block.description && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-1">
                    {block.description}
                  </p>
                )}
              </div>
            );
          })}

          {filteredBlocks.length === 0 && (
            <div className="col-span-full py-8 text-center bg-white rounded-xl border border-slate-200">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">Nenhum bloco cadastrado</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Clique em "Novo Bloco" para estruturar este condomínio.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grid de Apartamentos */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Apartamentos Cadastrados ({filteredUnits.length})
          </h3>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {filteredUnits.map((unit) => (
            <div
              key={unit.id}
              className="p-3 bg-white border border-slate-200 rounded-xl hover:border-slate-300 transition-colors shadow-xs relative group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                    Apto {unit.number}
                  </span>
                  {role === 'sindico' && (
                    <button
                      onClick={() => handleDeleteUnit(unit.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-rose-600 p-0.5 cursor-pointer transition-opacity"
                      title="Excluir Unidade"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <div className="mt-2 text-[11px] text-slate-600 space-y-0.5">
                  <p className="font-medium text-slate-800">{unit.blockName}</p>
                  <p className="text-slate-400">{unit.floor}º Andar</p>
                  {unit.condoName && selectedCondoId === 'all' && (
                    <p className="text-[10px] text-slate-400 truncate font-mono">
                      {unit.condoName}
                    </p>
                  )}
                </div>
              </div>

              {unit.notes && (
                <p className="text-[10px] text-slate-500 mt-1.5 pt-1.5 border-t border-slate-100 line-clamp-1 italic">
                  {unit.notes}
                </p>
              )}
            </div>
          ))}

          {filteredUnits.length === 0 && (
            <div className="col-span-full py-8 text-center bg-white rounded-xl border border-slate-200">
              <Home className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">Nenhum apartamento cadastrado</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Clique em "Novo Apartamento" para registrar as unidades.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Novo Bloco */}
      {showBlockModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Cadastrar Novo Bloco</h3>
              <button
                onClick={() => setShowBlockModal(false)}
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

            <form onSubmit={handleCreateBlock} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Condomínio *
                </label>
                <select
                  value={blockCondoId}
                  onChange={(e) => setBlockCondoId(Number(e.target.value))}
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
                  Identificação do Bloco / Torre *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Bloco A - Acácias, Torre Sul"
                  value={blockName}
                  onChange={(e) => setBlockName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Número de Andares
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={blockFloors}
                    onChange={(e) => setBlockFloors(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Observações / Descrição
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Torre residencial com elevador de serviço"
                  value={blockDesc}
                  onChange={(e) => setBlockDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Cadastrando...' : 'Cadastrar Bloco'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Novo Apartamento */}
      {showUnitModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-900">Cadastrar Novo Apartamento</h3>
              <button
                onClick={() => setShowUnitModal(false)}
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

            <form onSubmit={handleCreateUnit} className="p-4 space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Condomínio *
                </label>
                <select
                  value={unitCondoId}
                  onChange={(e) => {
                    const cId = Number(e.target.value);
                    setUnitCondoId(cId);
                    const matching = blocks.filter((b) => b.condoId === cId);
                    if (matching.length > 0) {
                      setUnitBlockId(matching[0].id);
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
                  Bloco Pertencente *
                </label>
                <select
                  value={unitBlockId}
                  onChange={(e) => setUnitBlockId(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-slate-900"
                >
                  {availableBlocksForUnitModal.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
                {availableBlocksForUnitModal.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    Nenhum bloco cadastrado neste condomínio. Cadastre um bloco primeiro.
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Número da Unidade *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: 101, 204B"
                    value={unitNumber}
                    onChange={(e) => setUnitNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Andar</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    value={unitFloor}
                    onChange={(e) => setUnitFloor(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Tipo de Unidade
                </label>
                <select
                  value={unitType}
                  onChange={(e) => setUnitType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-hidden focus:border-slate-900"
                >
                  <option value="apartamento">Apartamento Padrão</option>
                  <option value="cobertura">Cobertura</option>
                  <option value="studio">Studio</option>
                  <option value="duplex">Duplex</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notas / Detalhes Adicionais
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Sol da manhã, vista para a piscina"
                  value={unitNotes}
                  onChange={(e) => setUnitNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowUnitModal(false)}
                  className="px-3 py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || availableBlocksForUnitModal.length === 0}
                  className="px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Cadastrando...' : 'Cadastrar Apartamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
