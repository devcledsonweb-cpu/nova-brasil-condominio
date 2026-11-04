import React, { useState } from 'react';
import {
  X,
  Plus,
  CheckSquare,
  Square,
  Edit2,
  Trash2,
  Building2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Tag,
  Sliders,
  RotateCcw,
} from 'lucide-react';
import { PostChecklistItem, Condominium } from '../types/index.ts';

interface PostChecklistManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  condominiums: Condominium[];
  items: PostChecklistItem[];
  onSaveItem: (item: Omit<PostChecklistItem, 'id' | 'createdAt'> & { id?: string }) => Promise<boolean>;
  onDeleteItem: (id: string) => Promise<boolean>;
  onToggleActive: (id: string, currentActive: boolean) => Promise<boolean>;
  onResetDefaults?: () => Promise<void>;
}

export const PostChecklistManagementModal: React.FC<PostChecklistManagementModalProps> = ({
  isOpen,
  onClose,
  condominiums,
  items,
  onSaveItem,
  onDeleteItem,
  onToggleActive,
  onResetDefaults,
}) => {
  const [filterCondo, setFilterCondo] = useState<string>('all');
  const [editingItem, setEditingItem] = useState<PostChecklistItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<PostChecklistItem['category']>('equipamentos');
  const [condoId, setCondoId] = useState<number | null>(null);
  const [isRequired, setIsRequired] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (!isOpen) return null;

  const openNewForm = () => {
    setEditingItem(null);
    setTitle('');
    setDescription('');
    setCategory('equipamentos');
    setCondoId(filterCondo !== 'all' ? Number(filterCondo) : null);
    setIsRequired(true);
    setIsActive(true);
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const openEditForm = (item: PostChecklistItem) => {
    setEditingItem(item);
    setTitle(item.title);
    setDescription(item.description || '');
    setCategory(item.category);
    setCondoId(item.condoId ?? null);
    setIsRequired(item.isRequired);
    setIsActive(item.isActive);
    setErrorMsg('');
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Informe o título do item de conferência.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const selectedCondo = condoId ? condominiums.find((c) => c.id === condoId) : null;
      const success = await onSaveItem({
        id: editingItem?.id,
        title: title.trim(),
        description: description.trim() || null,
        category,
        condoId: condoId || null,
        condoName: selectedCondo ? selectedCondo.name : null,
        isRequired,
        isActive,
      });

      if (success) {
        setIsFormOpen(false);
        setEditingItem(null);
      } else {
        setErrorMsg('Erro ao salvar item. Tente novamente.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredItems = items.filter((item) => {
    if (filterCondo === 'all') return true;
    if (filterCondo === 'global') return item.condoId == null;
    return item.condoId === Number(filterCondo);
  });

  const getCategoryLabel = (cat: PostChecklistItem['category']) => {
    switch (cat) {
      case 'equipamentos':
        return 'Equipamentos (HT, Bastão, CFTV)';
      case 'chaves_documentos':
        return 'Chaves & Documentos';
      case 'instalacoes':
        return 'Instalações & Guarita';
      case 'procedimentos':
        return 'Procedimentos & Portões';
      default:
        return 'Geral';
    }
  };

  const getCategoryBadgeClass = (cat: PostChecklistItem['category']) => {
    switch (cat) {
      case 'equipamentos':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border-blue-200 dark:border-blue-900';
      case 'chaves_documentos':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-200 dark:border-amber-900';
      case 'instalacoes':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900';
      case 'procedimentos':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border-purple-200 dark:border-purple-900';
      default:
        return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Checklist Obrigatório de Conferência do Posto
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  {items.length} itens
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Gestão dos itens que os agentes devem auditar e assinar eletronicamente na passagem de turno.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra Superior de Filtros e Ações */}
        <div className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
            <span className="text-xs text-slate-500 font-medium">Condomínio:</span>
            <select
              value={filterCondo}
              onChange={(e) => setFilterCondo(e.target.value)}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Todos os Itens ({items.length})</option>
              <option value="global">🌐 Padrão Global (Todos os Postos)</option>
              {condominiums.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  🏢 {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {onResetDefaults && items.length === 0 && (
              <button
                type="button"
                onClick={onResetDefaults}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrões</span>
              </button>
            )}

            <button
              onClick={openNewForm}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Item de Checklist</span>
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          {/* Formulário de Criação/Edição */}
          {isFormOpen && (
            <form
              onSubmit={handleSubmit}
              className="p-4 bg-blue-50/50 dark:bg-blue-950/20 border-2 border-blue-200 dark:border-blue-900 rounded-2xl space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between border-b border-blue-200/60 dark:border-blue-900/60 pb-2">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  {editingItem ? 'Editar Item de Conferência' : 'Cadastrar Novo Item de Conferência'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-bold"
                >
                  Cancelar
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Título do Item de Conferência *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Rádios Comunicadores HT carregados"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Instrução / Detalhes de Verificação
                  </label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Ex: Testar canal 1 e 2, conferir se os dois aparelhos estão no carregador"
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Categoria do Item
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="equipamentos">Equipamentos (HT, Bastão, CFTV)</option>
                    <option value="chaves_documentos">Chaves & Documentos</option>
                    <option value="instalacoes">Instalações & Guarita</option>
                    <option value="procedimentos">Procedimentos & Portões</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Aplicar para o Condomínio
                  </label>
                  <select
                    value={condoId ? String(condoId) : ''}
                    onChange={(e) => setCondoId(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">🌐 Todos os Condomínios (Padrão Global)</option>
                    {condominiums.map((c) => (
                      <option key={c.id} value={String(c.id)}>
                        🏢 {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isRequired}
                    onChange={(e) => setIsRequired(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Obrigatório marcar SIM para concluir a passagem de turno</span>
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Ativo no Sistema</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-blue-200/60 dark:border-blue-900/60">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Salvando...' : editingItem ? 'Atualizar Item' : 'Salvar Item'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Lista de Itens Configurados */}
          {filteredItems.length === 0 ? (
            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-6">
              <CheckSquare className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhum item cadastrado para este filtro.</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Clique no botão "Novo Item de Checklist" para criar os requisitos obrigatórios de conferência do posto.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    item.isActive
                      ? 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                      : 'bg-slate-50/70 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-850 opacity-60'
                  }`}
                >
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => onToggleActive(item.id, item.isActive)}
                        className={`text-xs font-bold px-2 py-0.5 rounded-md border flex items-center gap-1 cursor-pointer transition-colors ${
                          item.isActive
                            ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                        }`}
                        title="Clique para ativar/desativar este item no checklist"
                      >
                        <span className={`w-2 h-2 rounded-full ${item.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{item.isActive ? 'Ativo' : 'Inativo'}</span>
                      </button>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getCategoryBadgeClass(item.category)}`}>
                        {getCategoryLabel(item.category)}
                      </span>

                      {item.isRequired ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                          Obrigatório
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          Opcional
                        </span>
                      )}

                      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {item.condoName || '🌐 Global (Todos os Postos)'}
                      </span>
                    </div>

                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-tight">
                      {item.title}
                    </h4>

                    {item.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditForm(item)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Editar item"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {deleteConfirmId === item.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 dark:bg-rose-950/60 p-1 rounded-lg border border-rose-200">
                        <span className="text-[10px] text-rose-700 font-bold px-1">Excluir?</span>
                        <button
                          type="button"
                          onClick={() => {
                            onDeleteItem(item.id);
                            setDeleteConfirmId(null);
                          }}
                          className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold cursor-pointer"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1 text-slate-400 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(item.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                        title="Excluir item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Auditoria contínua: Todos os itens ativos aparecem automaticamente no momento da passagem de turno do agente.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold rounded-xl cursor-pointer"
          >
            Concluir & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
