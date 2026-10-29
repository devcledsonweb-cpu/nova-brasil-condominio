import React, { useState } from 'react';
import { Announcement, Poll, Unit } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Megaphone,
  Vote,
  Plus,
  Pin,
  Trash2,
  Clock,
  CheckCircle2,
  BarChart3,
  Calendar,
} from 'lucide-react';

interface AnnouncementsViewProps {
  announcements: Announcement[];
  polls: Poll[];
  units: Unit[];
  onRefresh: () => void;
}

export const AnnouncementsView: React.FC<AnnouncementsViewProps> = ({
  announcements,
  polls,
  units,
  onRefresh,
}) => {
  const { role, user, getAuthHeaders } = useAuth();
  const [activeTab, setActiveTab] = useState<'avisos' | 'enquetes'>('avisos');

  // Modal Novo Comunicado
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticePriority, setNoticePriority] = useState<'informativo' | 'importante' | 'urgente'>('informativo');
  const [noticePinned, setNoticePinned] = useState(false);

  // Modal Nova Enquete
  const [showPollModal, setShowPollModal] = useState(false);
  const [pollTitle, setPollTitle] = useState('');
  const [pollDesc, setPollDesc] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['Opção A', 'Opção B', '']);
  const [pollExpiresAt, setPollExpiresAt] = useState('');

  // Votação State
  const [selectedUnitForVote, setSelectedUnitForVote] = useState<number>(units[0]?.id || 1);
  const [votingPollId, setVotingPollId] = useState<number | null>(null);
  const [votingOptionId, setVotingOptionId] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/announcements', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: noticeTitle.trim(),
          content: noticeContent.trim(),
          priority: noticePriority,
          pinned: noticePinned,
          author: user?.name || 'Administração',
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao publicar comunicado.');
      }
      setShowNoticeModal(false);
      setNoticeTitle('');
      setNoticeContent('');
      setNoticePinned(false);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAnnouncement = async (id: number) => {
    if (!confirm('Deseja excluir este comunicado oficial?')) return;
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/announcements/${id}`, { method: 'DELETE', headers });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePoll = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
    if (!pollTitle.trim() || validOptions.length < 2) {
      setErrorMsg('Forneça o título da enquete e pelo menos 2 opções de voto.');
      return;
    }
    setSaving(true);
    setErrorMsg('');
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/polls', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: pollTitle.trim(),
          description: pollDesc.trim() || undefined,
          expiresAt: pollExpiresAt || undefined,
          options: validOptions,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar enquete.');
      }
      setShowPollModal(false);
      setPollTitle('');
      setPollDesc('');
      setPollOptions(['Opção A', 'Opção B', '']);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleVote = async (pollId: number, optionId: number) => {
    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          optionId,
          unitId: selectedUnitForVote,
          voterName: user?.name,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Erro ao registrar voto.');
        return;
      }
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Mural de Avisos e Votações Rápidas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Canal oficial de comunicação do condomínio, notificações de obras e assembleias/enquetes virtuais
          </p>
        </div>

        {role === 'sindico' && (
          <div className="flex items-center gap-2">
            {activeTab === 'avisos' ? (
              <button
                onClick={() => {
                  setErrorMsg('');
                  setShowNoticeModal(true);
                }}
                className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Novo Comunicado
              </button>
            ) : (
              <button
                onClick={() => {
                  setErrorMsg('');
                  setShowPollModal(true);
                }}
                className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Criar Enquete
              </button>
            )}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('avisos')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'avisos'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Mural de Comunicados ({announcements.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('enquetes')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-medium border-b-2 transition-all cursor-pointer ${
            activeTab === 'enquetes'
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Vote className="w-4 h-4" />
          <span>Votações & Enquetes em Andamento ({polls.length})</span>
        </button>
      </div>

      {/* ABA 1: COMUNICADOS OFICIAIS */}
      {activeTab === 'avisos' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {announcements.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-xl">
                Nenhum comunicado oficial publicado no momento.
              </div>
            ) : (
              announcements.map((a) => (
                <div
                  key={a.id}
                  className={`bg-white border rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-3 transition-all ${
                    a.pinned ? 'border-slate-400/80 bg-slate-50/40 ring-1 ring-slate-300' : 'border-slate-200'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {a.pinned && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                            <Pin className="w-3 h-3 text-slate-700" />
                            Fixado
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold uppercase ${
                            a.priority === 'urgente'
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : a.priority === 'importante'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {a.priority}
                        </span>
                      </div>

                      {role === 'sindico' && (
                        <button
                          onClick={() => handleDeleteAnnouncement(a.id)}
                          className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                          title="Excluir comunicado"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-slate-900 leading-snug">{a.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{a.content}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>Autor: {a.author}</span>
                    <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ABA 2: ENQUETES E VOTAÇÕES */}
      {activeTab === 'enquetes' && (
        <div className="space-y-6">
          {/* Seletor de Unidade para Simular Votação de Morador/Unidade */}
          <div className="p-3 bg-white border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
            <div className="space-y-0.5">
              <span className="font-semibold text-slate-900">Unidade Representante no Voto:</span>
              <p className="text-slate-500">Cada apartamento tem direito a 1 voto computado por enquete</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedUnitForVote}
                onChange={(e) => setSelectedUnitForVote(Number(e.target.value))}
                className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-slate-50 font-mono"
              >
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.blockName} - Apto {u.number}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {polls.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-xl">
                Nenhuma enquete ou votação aberta no momento.
              </div>
            ) : (
              polls.map((poll) => {
                const hasUnitVoted = poll.votes?.some((v: any) => v.unitId === selectedUnitForVote);
                return (
                  <div
                    key={poll.id}
                    className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                        <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                          {poll.active ? 'Votação Ativa' : 'Encerrada'}
                        </span>
                        {poll.expiresAt && (
                          <span className="flex items-center gap-1 font-mono text-[11px]">
                            <Clock className="w-3 h-3" />
                            Encerra em: {poll.expiresAt}
                          </span>
                        )}
                      </div>

                      <h3 className="text-base font-bold text-slate-900">{poll.title}</h3>
                      {poll.description && (
                        <p className="text-xs text-slate-600 mt-1 leading-relaxed">{poll.description}</p>
                      )}

                      {/* Opções de Voto com Barras de Progresso */}
                      <div className="space-y-3 mt-4">
                        {poll.options.map((opt: any) => (
                          <div key={opt.id} className="space-y-1">

                            <div className="flex items-center justify-between text-xs">
                              <span className="font-medium text-slate-800">{opt.text}</span>
                              <span className="font-mono text-slate-500 tabular-nums">
                                {opt.voteCount} votos ({opt.percentage}%)
                              </span>
                            </div>
                            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden flex">
                              <div
                                className="bg-slate-900 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${opt.percentage || 0}%` }}
                              />
                            </div>
                            {poll.active && (
                              <button
                                disabled={hasUnitVoted}
                                onClick={() => handleVote(poll.id, opt.id)}
                                className={`mt-1 px-3 py-1 text-[11px] font-medium rounded transition-colors cursor-pointer ${
                                  hasUnitVoted
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                    : 'border border-slate-300 hover:bg-slate-100 text-slate-700'
                                }`}
                              >
                                {hasUnitVoted ? 'Voto Registrado' : `Votar nesta opção`}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-mono text-slate-500">
                      <span>Total: {poll.totalVotes} votos computados</span>
                      {hasUnitVoted && (
                        <span className="text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Unidade já votou
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Modal Novo Comunicado */}
      {showNoticeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Publicar Comunicado Oficial</h3>
            {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
            <form onSubmit={handleCreateAnnouncement} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Título do Aviso *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Interrupção temporária de água para manutenção"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Nível de Prioridade *</label>
                <select
                  value={noticePriority}
                  onChange={(e) => setNoticePriority(e.target.value as any)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                >
                  <option value="informativo">Informativo Geral</option>
                  <option value="importante">Importante</option>
                  <option value="urgente">Urgente / Atenção</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Conteúdo Completo *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Descreva as orientações aos moradores..."
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinCheck"
                  checked={noticePinned}
                  onChange={(e) => setNoticePinned(e.target.checked)}
                  className="rounded border-slate-300 text-slate-900"
                />
                <label htmlFor="pinCheck" className="text-xs text-slate-700 cursor-pointer">
                  Fixar aviso com destaque no topo do mural
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoticeModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Publicando...' : 'Publicar Comunicado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Enquete */}
      {showPollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Criar Enquete / Votação Rápida</h3>
            {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}
            <form onSubmit={handleCreatePoll} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Título da Pergunta *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reforma da Fachada ou Instalação de Placas Solares"
                  value={pollTitle}
                  onChange={(e) => setPollTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Descrição / Contexto</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes adicionais sobre a votação para esclarecer os condôminos"
                  value={pollDesc}
                  onChange={(e) => setPollDesc(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Data Limite de Votação</label>
                <input
                  type="date"
                  value={pollExpiresAt}
                  onChange={(e) => setPollExpiresAt(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Opções de Voto *</label>
                <div className="space-y-2">
                  {pollOptions.map((opt, idx) => (
                    <input
                      key={idx}
                      type="text"
                      placeholder={`Opção ${idx + 1}`}
                      value={opt}
                      onChange={(e) => {
                        const newOpts = [...pollOptions];
                        newOpts[idx] = e.target.value;
                        setPollOptions(newOpts);
                      }}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                    />
                  ))}
                  {pollOptions.length < 5 && (
                    <button
                      type="button"
                      onClick={() => setPollOptions([...pollOptions, ''])}
                      className="text-xs text-slate-600 hover:text-slate-900 hover:underline cursor-pointer"
                    >
                      + Adicionar outra opção
                    </button>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPollModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Criando...' : 'Abrir Enquete'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
