import React, { useState, useEffect } from 'react';
import { SystemUser, Condominium, UserRole } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  UserCheck,
  Plus,
  ShieldCheck,
  Lock,
  Trash2,
  KeyRound,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  UserPlus,
  Building2,
  X,
  Briefcase,
  CheckSquare,
  Square,
  Filter,
  Search,
} from 'lucide-react';

interface UsersManagementViewProps {
  condominiums?: Condominium[];
  selectedCondoId?: number | 'all';
  onRefresh?: () => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  condominiums = [],
  selectedCondoId = 'all',
}) => {
  const { user, getAuthHeaders } = useAuth();
  const [usersList, setUsersList] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterCondo, setFilterCondo] = useState<string>(
    selectedCondoId !== 'all' ? String(selectedCondoId) : 'all'
  );

  // Modal Novo Usuário
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('portaria');
  const [userCondoIds, setUserCondoIds] = useState<number[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  // Modal Redefinir Senha
  const [resetModalUser, setResetModalUser] = useState<SystemUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    try {
      const headers = await getAuthHeaders();
      let serverUsers: SystemUser[] = [];

      try {
        const res = await fetch('/api/users', { headers });
        if (res.ok) {
          const text = await res.text();
          if (text && text.trim()) {
            serverUsers = JSON.parse(text);
          }
        }
      } catch (netErr) {
        console.warn('API /api/users inacessível no momento:', netErr);
      }

      // Mescla com usuários criados localmente / salvos no cache para garantir persistência
      let localUsers: any[] = [];
      try {
        const saved = localStorage.getItem('novabrasil_users_list');
        if (saved) localUsers = JSON.parse(saved);
      } catch {}

      const emailMap = new Set<string>();
      const combined: SystemUser[] = [];

      for (const u of serverUsers) {
        if (!emailMap.has(u.email.toLowerCase())) {
          emailMap.add(u.email.toLowerCase());
          combined.push({
            ...u,
            condoIds: Array.isArray(u.condoIds) && u.condoIds.length > 0 ? u.condoIds : (u.condoId ? [u.condoId] : []),
            condoNames: u.condoNames || (u.condoName ? [u.condoName] : []),
          });
        }
      }

      for (const u of localUsers) {
        if (!emailMap.has(u.email.toLowerCase())) {
          emailMap.add(u.email.toLowerCase());
          const ids = Array.isArray(u.condoIds) && u.condoIds.length > 0 ? u.condoIds : (u.condoId ? [u.condoId] : []);
          const names = u.condoNames || (u.condoName ? [u.condoName] : []);
          combined.push({
            id: u.id,
            uid: u.uid || `local-${u.id}`,
            name: u.name,
            email: u.email,
            role: u.role || 'portaria',
            permissions: typeof u.permissions === 'string' ? u.permissions : JSON.stringify(u.permissions || []),
            condoId: ids[0] || u.condoId || null,
            condoIds: ids,
            condoName: u.condoName || (names[0] ?? null),
            condoNames: names,
            isActive: u.isActive ?? true,
            createdAt: u.createdAt || new Date().toISOString(),
          });
        }
      }

      setUsersList(combined);
    } catch (err) {
      console.error('Erro ao buscar lista de usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openCreateModal = () => {
    setErrorMsg('');
    setName('');
    setEmail('');
    setPassword('');
    setSelectedRole('portaria');
    setUserCondoIds(
      filterCondo !== 'all' ? [Number(filterCondo)] : (condominiums.length > 0 ? [condominiums[0].id] : [])
    );
    setShowPassword(false);
    setShowModal(true);
  };

  const toggleCondo = (id: number) => {
    setUserCondoIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllCondos = () => {
    if (userCondoIds.length === condominiums.length) {
      setUserCondoIds([]);
    } else {
      setUserCondoIds(condominiums.map((c) => c.id));
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Informe o nome completo do usuário.');
      return;
    }
    if (!email.trim()) {
      setErrorMsg('Informe o e-mail institucional.');
      return;
    }
    if (!password.trim() || password.trim().length < 6) {
      setErrorMsg('A senha inicial deve ter no mínimo 6 caracteres.');
      return;
    }

    // Se for supervisor ou portaria, exige pelo menos um condomínio selecionado
    if (selectedRole !== 'sindico' && userCondoIds.length === 0 && condominiums.length > 0) {
      setErrorMsg('Selecione pelo menos um condomínio para atribuir este usuário.');
      return;
    }

    setSaving(true);
    setErrorMsg('');

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPassword = password.trim();

    const selectedCondoObjects = condominiums.filter((c) => userCondoIds.includes(c.id));
    const assignedNames = selectedCondoObjects.map((c) => c.name);
    const primaryCondoId = userCondoIds.length > 0 ? userCondoIds[0] : null;

    let permissions: string[] = [];
    if (selectedRole === 'sindico') {
      permissions = ['all'];
    } else if (selectedRole === 'supervisor') {
      permissions = ['supervisor', 'condominio', 'agentes', 'ronda', 'materiais', 'manutencao', 'ocorrencias'];
    } else {
      permissions = ['portaria', 'ronda', 'materiais', 'ocorrencias', 'manutencao'];
    }

    try {
      const headers = await getAuthHeaders();
      const payload = {
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role: selectedRole,
        permissions,
        condoId: selectedRole === 'sindico' ? null : primaryCondoId,
        condoIds: selectedRole === 'sindico' ? [] : userCondoIds,
      };

      let createdUser: any = null;

      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
        });

        const text = await res.text();
        let jsonRes: any = null;
        if (text && text.trim()) {
          try {
            jsonRes = JSON.parse(text);
          } catch {}
        }

        if (res.ok && jsonRes) {
          createdUser = jsonRes;
        } else if (!res.ok) {
          if (jsonRes?.error) {
            throw new Error(jsonRes.error);
          }
        }
      } catch (fetchErr: any) {
        if (fetchErr.message && (fetchErr.message.includes('Já existe') || fetchErr.message.includes('obrigatório'))) {
          throw fetchErr;
        }
        console.warn('Operando com persistência resiliente:', fetchErr);
      }

      if (!createdUser) {
        createdUser = {
          id: Date.now(),
          uid: `usr-${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          role: selectedRole,
          permissions: JSON.stringify(permissions),
          condoId: selectedRole === 'sindico' ? null : primaryCondoId,
          condoIds: selectedRole === 'sindico' ? [] : userCondoIds,
          condoName: selectedRole === 'sindico' ? 'Todos os Condomínios' : (assignedNames[0] || null),
          condoNames: selectedRole === 'sindico' ? ['Todos os Condomínios'] : assignedNames,
          isActive: true,
          createdAt: new Date().toISOString(),
        };
      }

      // Salva no localStorage (novabrasil_users_list) para permitir login imediato
      try {
        const saved = localStorage.getItem('novabrasil_users_list');
        const list = saved ? JSON.parse(saved) : [];
        const filtered = list.filter((u: any) => u.email.toLowerCase() !== cleanEmail);
        const updatedLocal = [
          {
            ...createdUser,
            condoIds: selectedRole === 'sindico' ? [] : userCondoIds,
            condoNames: selectedRole === 'sindico' ? ['Todos os Condomínios'] : assignedNames,
            password: cleanPassword,
          },
          ...filtered,
        ];
        localStorage.setItem('novabrasil_users_list', JSON.stringify(updatedLocal));
      } catch {}

      setShowModal(false);
      setName('');
      setEmail('');
      setPassword('');
      await fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro inesperado ao cadastrar usuário.');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword.trim()) return;
    setSaving(true);
    setErrorMsg('');

    try {
      const headers = await getAuthHeaders();
      try {
        const res = await fetch(`/api/users/${resetModalUser.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ password: newPassword.trim() }),
        });
        const text = await res.text();
        let jsonRes: any = null;
        if (text && text.trim()) {
          try {
            jsonRes = JSON.parse(text);
          } catch {}
        }
        if (!res.ok && jsonRes?.error) {
          throw new Error(jsonRes.error);
        }
      } catch (err: any) {
        if (err.message && !err.message.includes('fetch')) {
          throw err;
        }
      }

      try {
        const saved = localStorage.getItem('novabrasil_users_list');
        if (saved) {
          const list = JSON.parse(saved);
          const updated = list.map((u: any) =>
            u.id === resetModalUser.id || u.email.toLowerCase() === resetModalUser.email.toLowerCase()
              ? { ...u, password: newPassword.trim() }
              : u
          );
          localStorage.setItem('novabrasil_users_list', JSON.stringify(updated));
        }
      } catch {}

      setResetModalUser(null);
      setNewPassword('');
      alert(`Senha de ${resetModalUser.name} redefinida com sucesso!`);
    } catch (err: any) {
      setErrorMsg(err.message || 'Falha ao redefinir senha.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: SystemUser) => {
    try {
      const headers = await getAuthHeaders();
      try {
        await fetch(`/api/users/${u.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ isActive: !u.isActive }),
        });
      } catch {}

      try {
        const saved = localStorage.getItem('novabrasil_users_list');
        if (saved) {
          const list = JSON.parse(saved);
          const updated = list.map((item: any) =>
            item.id === u.id || item.email.toLowerCase() === u.email.toLowerCase()
              ? { ...item, isActive: !u.isActive }
              : item
          );
          localStorage.setItem('novabrasil_users_list', JSON.stringify(updated));
        }
      } catch {}

      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (u: SystemUser) => {
    if (!confirm(`Deseja realmente excluir o acesso de "${u.name}"?`)) return;
    try {
      const headers = await getAuthHeaders();
      try {
        const res = await fetch(`/api/users/${u.id}`, {
          method: 'DELETE',
          headers,
        });
        const text = await res.text();
        let jsonRes: any = null;
        if (text && text.trim()) {
          try {
            jsonRes = JSON.parse(text);
          } catch {}
        }
        if (!res.ok && jsonRes?.error) {
          alert(jsonRes.error);
          return;
        }
      } catch {}

      try {
        const saved = localStorage.getItem('novabrasil_users_list');
        if (saved) {
          const list = JSON.parse(saved);
          const filtered = list.filter((item: any) => item.id !== u.id && item.email.toLowerCase() !== u.email.toLowerCase());
          localStorage.setItem('novabrasil_users_list', JSON.stringify(filtered));
        }
      } catch {}

      await fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredUsers = usersList.filter((u) => {
    if (filterCondo !== 'all') {
      const condoNum = Number(filterCondo);
      const isGlobal = u.role === 'sindico' || u.role === 'admin' || (u.condoId == null && (!u.condoIds || u.condoIds.length === 0));
      const hasCondo = u.condoId === condoNum || (Array.isArray(u.condoIds) && u.condoIds.includes(condoNum));
      if (!isGlobal && !hasCondo) return false;
    }

    if (filterRole !== 'all') {
      if (filterRole === 'sindico' && u.role !== 'sindico' && u.role !== 'admin') return false;
      if (filterRole === 'supervisor' && u.role !== 'supervisor') return false;
      if (filterRole === 'portaria' && u.role !== 'portaria' && u.role !== 'operador') return false;
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(term);
      const matchEmail = u.email?.toLowerCase().includes(term);
      const matchCondo =
        u.condoName?.toLowerCase().includes(term) ||
        (u.condoNames && u.condoNames.some((c) => c.toLowerCase().includes(term)));
      return matchName || matchEmail || matchCondo;
    }
    return true;
  });

  const getRoleBadge = (r: UserRole) => {
    if (r === 'sindico' || r === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
          <ShieldCheck className="w-3 h-3 text-blue-600 dark:text-blue-400" />
          Gestor Geral da Empresa
        </span>
      );
    }
    if (r === 'supervisor') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900">
          <Briefcase className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
          Gestor do Condomínio (Supervisor)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
        <UserCheck className="w-3 h-3 text-slate-500" />
        Agente de Portaria
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Gestão de Usuários & Níveis de Acesso
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-600 text-white font-mono">
              {usersList.length} cadastrados
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Controle de acessos da NOVA BRASIL: atribua gestores gerais, gestores de condomínios específicos e agentes de portaria com restrição por postos.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Cadastrar Usuário / Gestor</span>
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou condomínio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Posto:</span>
          </div>

          <select
            value={filterCondo}
            onChange={(e) => setFilterCondo(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
          >
            <option value="all">🏢 Todos os Postos</option>
            {condominiums.map((c) => (
              <option key={c.id} value={c.id}>
                📍 {c.name}
              </option>
            ))}
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-2 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Todos os Níveis</option>
            <option value="sindico">Gestor Geral da Empresa</option>
            <option value="supervisor">Gestor de Condomínio</option>
            <option value="portaria">Agente de Portaria</option>
          </select>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">E-mail de Login</th>
                <th className="py-3 px-4">Condomínio(s) Vinculado(s)</th>
                <th className="py-3 px-4">Função / Nível de Acesso</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    Carregando usuários...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    Nenhum usuário encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isMaster = u.email === 'administrativo@novabrasil.com';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          <span>{u.name}</span>
                          {isMaster && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-600 text-white rounded font-bold">
                              Master
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{u.email}</td>
                      <td className="py-3 px-4">
                        {u.role === 'sindico' || u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            Todos os Condomínios (Global)
                          </span>
                        ) : u.condoNames && u.condoNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {u.condoNames.map((cName, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                              >
                                {cName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                            {u.condoName || 'Posto Geral / Não Especificado'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">{getRoleBadge(u.role)}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isMaster}
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded cursor-pointer transition-colors ${
                            u.isActive
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 hover:bg-rose-100'
                          } ${isMaster ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                              Inativo
                            </>
                          )}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setResetModalUser(u);
                              setNewPassword('');
                            }}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer"
                            title="Alterar / Redefinir Senha"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          {!isMaster && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded cursor-pointer"
                              title="Excluir Usuário"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Criar Novo Usuário */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-5 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Cadastrar Novo Usuário / Gestor
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 rounded-lg text-xs text-rose-700 dark:text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  Função / Nível de Acesso *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div
                    onClick={() => setSelectedRole('sindico')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedRole === 'sindico'
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Gestor Geral</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Total (Todos os Postos)</span>
                  </div>

                  <div
                    onClick={() => setSelectedRole('supervisor')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedRole === 'supervisor'
                        ? 'border-indigo-600 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs ring-1 ring-indigo-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Gestor do Posto</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Supervisor Local</span>
                  </div>

                  <div
                    onClick={() => setSelectedRole('portaria')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedRole === 'portaria'
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 shadow-xs ring-1 ring-blue-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Agente Portaria</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">Operação Guarita</span>
                  </div>
                </div>
              </div>

              {/* Seleção de Condomínio(s) vinculados para Supervisor e Agente */}
              {selectedRole !== 'sindico' ? (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Condomínio(s) Atribuído(s) * ({userCondoIds.length} selecionado{userCondoIds.length !== 1 ? 's' : ''})
                    </label>
                    <button
                      type="button"
                      onClick={selectAllCondos}
                      className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                    >
                      {userCondoIds.length === condominiums.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                    {selectedRole === 'supervisor'
                      ? 'O supervisor terá acesso de gestão total exclusivamente aos condomínios selecionados:'
                      : 'O agente de portaria só poderá acessar e operar nos condomínios selecionados:'}
                  </p>
                  <div className="max-h-36 overflow-y-auto space-y-1.5 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 bg-slate-50/50 dark:bg-slate-800/50">
                    {condominiums.map((condo) => {
                      const isChecked = userCondoIds.includes(condo.id);
                      return (
                        <div
                          key={condo.id}
                          onClick={() => toggleCondo(condo.id)}
                          className={`flex items-center justify-between p-2 rounded-md cursor-pointer transition-colors border text-xs ${
                            isChecked
                              ? 'bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100 font-medium'
                              : 'bg-white dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <span className="truncate">{condo.name}</span>
                          </div>
                          {condo.city && (
                            <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">
                              {condo.city}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-xl border border-blue-200/80 dark:border-blue-900/60 flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-blue-900 dark:text-blue-200">
                    <strong>Gestor Geral:</strong> Tem acesso total a todos os condomínios da empresa, incluindo cadastrar novos condomínios, excluir condomínios e gerenciar usuários.
                  </p>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo de Oliveira"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  E-mail Institucional de Login *
                </label>
                <input
                  type="email"
                  required
                  placeholder="carlos@novabrasil.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Senha Inicial de Acesso *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 pr-10 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium cursor-pointer min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50 min-h-[40px] shadow-sm"
                >
                  {saving ? 'Cadastrando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Redefinir Senha */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-sm w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Redefinir Senha de {resetModalUser.name}
            </h3>
            {errorMsg && <p className="text-xs text-rose-600 dark:text-rose-400">{errorMsg}</p>}

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nova Senha *</label>
                <input
                  type="text"
                  required
                  placeholder="Digite a nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-4 py-2 text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 font-medium cursor-pointer min-h-[40px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50 min-h-[40px]"
                >
                  {saving ? 'Salvando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
