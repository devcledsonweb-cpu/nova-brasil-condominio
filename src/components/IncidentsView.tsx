import React, { useState } from 'react';
import { Incident, Unit } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  FileWarning,
  Plus,
  Search,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  Eye,
  Gavel,
  X,
} from 'lucide-react';

interface IncidentsViewProps {
  incidents: Incident[];
  units: Unit[];
  onRefresh: () => void;
}

export const IncidentsView: React.FC<IncidentsViewProps> = ({ incidents, units, onRefresh }) => {
  const { role, user, getAuthHeaders } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Modal Novo Registro
  const [showModal, setShowModal] = useState(false);
  const [unitId, setUnitId] = useState<number | ''>(units[0]?.id || '');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Incident['category']>('barulho');
  const [description, setDescription] = useState('');
  const [involvedPersons, setInvolvedPersons] = useState('');
  const [severity, setSeverity] = useState<Incident['severity']>('media');
  const [incidentDate, setIncidentDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [incidentTime, setIncidentTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal Detalhes / Análise do Síndico
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [actionStatus, setActionStatus] = useState<string>('resolvida');
  const [actionNotes, setActionNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('O arquivo deve ter no máximo 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/incidents', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          unitId: unitId ? Number(unitId) : undefined,
          title: title.trim(),
          category,
          description: description.trim(),
          involvedPersons: involvedPersons.trim() || undefined,
          severity,
          attachmentUrl: attachmentBase64 || undefined,
          registeredBy: user?.name || (role === 'sindico' ? 'Síndico Geral' : 'Portaria'),
          incidentDate,
          incidentTime,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao registrar ocorrência.');
      }
      setShowModal(false);
      setTitle('');
      setDescription('');
      setInvolvedPersons('');
      setAttachmentBase64(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    setUpdatingStatus(true);
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/incidents/${selectedIncident.id}/status`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          status: actionStatus,
          actionTaken: actionNotes.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao atualizar ocorrência.');
      }
      setSelectedIncident(null);
      setActionNotes('');
      onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filtered = incidents.filter((inc) => {
    const matchesSearch =
      inc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inc.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inc.unitNumber && inc.unitNumber.includes(searchTerm)) ||
      (inc.involvedPersons && inc.involvedPersons.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || inc.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || inc.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Livro Digital de Ocorrências</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro formal de infrações com data, hora, fotos probatórias e parecer administrativo
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMsg('');
            setAttachmentBase64(null);
            setShowModal(true);
          }}
          className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          Registrar Ocorrência
        </button>
      </div>

      {/* Filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por título, unidade ou envolvidos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
          >
            <option value="all">Todos os Status ({incidents.length})</option>
            <option value="aberta">Abertas</option>
            <option value="em_analise">Em Análise</option>
            <option value="resolvida">Resolvidas</option>
            <option value="advertencia">Com Advertência</option>
            <option value="multa">Com Multa Aplicada</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-700"
          >
            <option value="all">Todas as Categorias</option>
            <option value="barulho">Barulho / Perturbação</option>
            <option value="animais">Animais / Pet</option>
            <option value="estacionamento">Estacionamento</option>
            <option value="patrimonio">Danos ao Patrimônio</option>
            <option value="lixo">Lixo / Descarte</option>
            <option value="convivencia">Convivência</option>
            <option value="outros">Outros</option>
          </select>
        </div>
      </div>

      {/* Grid de Ocorrências */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-xl">
            Nenhuma ocorrência registrada com os filtros selecionados.
          </div>
        ) : (
          filtered.map((inc) => (
            <div
              key={inc.id}
              className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                      inc.status === 'aberta'
                        ? 'bg-rose-50 text-rose-800 border border-rose-200'
                        : inc.status === 'multa'
                        ? 'bg-red-950 text-red-200 border border-red-800'
                        : inc.status === 'advertencia'
                        ? 'bg-amber-50 text-amber-800 border border-amber-200'
                        : inc.status === 'resolvida'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {inc.status.replace('_', ' ')}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {inc.incidentDate} às {inc.incidentTime}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-900 line-clamp-1">{inc.title}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="capitalize">{inc.category}</span>
                    <span>·</span>
                    <span className="font-mono">
                      {inc.unitNumber ? `${inc.blockName || 'Bloco'} - Apto ${inc.unitNumber}` : 'Área Comum'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{inc.description}</p>

                {/* Prévia da foto anexada se houver */}
                {inc.attachmentUrl && (
                  <div className="pt-1">
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 max-h-32 bg-slate-100 flex items-center justify-center">
                      <img
                        src={inc.attachmentUrl}
                        alt="Anexo da ocorrência"
                        className="object-cover w-full h-32"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                  Reg.: {inc.registeredBy}
                </span>
                <button
                  onClick={() => {
                    setSelectedIncident(inc);
                    setActionStatus(inc.status);
                    setActionNotes(inc.actionTaken || '');
                  }}
                  className="px-2.5 py-1 text-[11px] font-medium border border-slate-300 rounded hover:bg-slate-50 text-slate-700 flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  {role === 'sindico' ? 'Julgar / Parecer' : 'Ver Detalhes'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Registrar Ocorrência */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-900">Registrar no Livro de Ocorrências</h3>
            {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
            <form onSubmit={handleCreateIncident} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Título Resumido *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Barulho excessivo após as 22h"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Categoria da Infração *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  >
                    <option value="barulho">Barulho / Perturbação</option>
                    <option value="animais">Animais de Estimação</option>
                    <option value="estacionamento">Estacionamento Irregular</option>
                    <option value="patrimonio">Danos ao Patrimônio</option>
                    <option value="lixo">Descarte Incorreto de Lixo</option>
                    <option value="convivencia">Desentendimento / Convivência</option>
                    <option value="outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Gravidade Estimada</label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  >
                    <option value="baixa">Baixa (Leve)</option>
                    <option value="media">Média</option>
                    <option value="alta">Alta</option>
                    <option value="grave">Grave (Gravíssima)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Unidade Infratora / Alvo</label>
                  <select
                    value={unitId}
                    onChange={(e) => setUnitId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  >
                    <option value="">Área Comum / Não especificado</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.blockName} - Apto {u.number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Pessoas Envolvidas</label>
                  <input
                    type="text"
                    placeholder="Ex: Morador Carlos, visitante X"
                    value={involvedPersons}
                    onChange={(e) => setInvolvedPersons(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Data do Fato *</label>
                  <input
                    type="date"
                    required
                    value={incidentDate}
                    onChange={(e) => setIncidentDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Hora do Fato *</label>
                  <input
                    type="time"
                    required
                    value={incidentTime}
                    onChange={(e) => setIncidentTime(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Descrição Circunstanciada *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Relato detalhado dos acontecimentos, providências preliminares adotadas na portaria, etc."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              {/* Upload de Foto / Anexo */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Foto ou Anexo Probatório</label>
                <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer relative">
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {attachmentBase64 ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-emerald-700 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Foto carregada com sucesso! Clique para trocar.</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                      <Upload className="w-4 h-4" />
                      <span className="text-xs">Selecione uma imagem ou foto do celular (máx 5MB)</span>
                    </div>
                  )}
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
                  {saving ? 'Gravando...' : 'Salvar no Livro de Ocorrências'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Visualização & Julgamento pelo Síndico */}
      {selectedIncident && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 uppercase font-semibold text-slate-800">
                  Ocorrência #{selectedIncident.id} · {selectedIncident.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">{selectedIncident.title}</h3>
              </div>
              <button
                onClick={() => setSelectedIncident(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">Data e Hora:</span>
                <span className="font-mono text-slate-900">
                  {selectedIncident.incidentDate} às {selectedIncident.incidentTime}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unidade:</span>
                <span className="font-mono text-slate-900">
                  {selectedIncident.unitNumber
                    ? `${selectedIncident.blockName || 'Bloco'} - Apto ${selectedIncident.unitNumber}`
                    : 'Área Comum'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Registrado por:</span>
                <span className="text-slate-800 font-medium">{selectedIncident.registeredBy}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Envolvidos:</span>
                <span className="text-slate-800">{selectedIncident.involvedPersons || 'Não informado'}</span>
              </div>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-700">Relato dos Fatos:</span>
              <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 border border-slate-200 rounded-lg">
                {selectedIncident.description}
              </p>
            </div>

            {selectedIncident.attachmentUrl && (
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-700">Foto Anexada:</span>
                <div className="rounded-lg overflow-hidden border border-slate-200">
                  <img
                    src={selectedIncident.attachmentUrl}
                    alt="Foto da ocorrência"
                    className="w-full max-h-64 object-contain bg-slate-900"
                  />
                </div>
              </div>
            )}

            {/* Ação Administrativa (Síndico) */}
            {role === 'sindico' ? (
              <form onSubmit={handleUpdateStatus} className="pt-3 border-t border-slate-200 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Gavel className="w-4 h-4 text-slate-900" />
                  <span>Parecer e Julgamento do Síndico</span>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">Decisão / Status *</label>
                  <select
                    value={actionStatus}
                    onChange={(e) => setActionStatus(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  >
                    <option value="em_analise">Em Análise / Diligência</option>
                    <option value="resolvida">Resolvida Amigavelmente</option>
                    <option value="advertencia">Emitir Notificação / Advertência Formal</option>
                    <option value="multa">Aplicar Multa Condominial</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Justificativa / Parecer Administrativo
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ex: Advertência formal emitida com base no artigo 14 do Regimento Interno."
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSelectedIncident(null)}
                    className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={updatingStatus}
                    className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                  >
                    {updatingStatus ? 'Salvando...' : 'Atualizar Parecer'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="pt-2 border-t border-slate-200">
                <span className="text-xs font-semibold text-slate-700 block mb-1">Parecer Administrativo:</span>
                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded border border-slate-200">
                  {selectedIncident.actionTaken || 'Nenhum parecer emitido até o momento.'}
                </p>
                <div className="flex justify-end pt-3">
                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="px-4 py-1.5 text-xs font-medium border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
