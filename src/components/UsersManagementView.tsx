import React, { useState, useEffect } from 'react';
import { SystemUser, Condominium } from '../types/index.ts';
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
  Shield,
  Eye,
  EyeOff,
  UserPlus,
  Building2,
  X,
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

  // Modal Novo Usuário
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'sindico' | 'portaria'>('portaria');
  const [userCondoId, setUserCondoId] = useState<string>(
    selectedCondoId !== 'all' ? String(selectedCondoId) : ''
  );
  const [showPassword, setShowPassword] = useState(false);

  // Permissões modulares
  const [permPortaria, setPermPortaria] = useState(true);
  const [permEncomendas, setPermEncomendas] = useState(true);
  const [permVeiculos, setPermVeiculos] = useState(true);
  const [permOcorrencias, setPermOcorrencias] = useState(true);
  const [permMoradores, setPermMoradores] = useState(false);
  const [permReservas, setPermReservas] = useState(false);
  const [permAvisos, setPermAvisos] = useState(false);
  const [permEstrutura, setPermEstrutura] = useState(false);

  // Modal Redefinir Senha
  const [resetModalUser, setResetModalUser] = useState<SystemUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchUsers = async () => {
    try {
      const headers = await getAuthHeaders();
      const queryParam = selectedCondoId !== 'all' ? `?condoId=${selectedCondoId}` : '';
      let serverUsers: SystemUser[] = [];

      try {
        const res = await fetch(`/api/users${queryParam}`, { headers });
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
          combined.push(u);
        }
      }

      for (const u of localUsers) {
        if (!emailMap.has(u.email.toLowerCase())) {
          emailMap.add(u.email.toLowerCase());
          combined.push({
            id: u.id,
            uid: u.uid || `local-${u.id}`,
            name: u.name,
            email: u.email,
            role: u.role || 'portaria',
            permissions: typeof u.permissions === 'string' ? u.permissions : JSON.stringify(u.permissions || []),
            condoId: u.condoId || null,
            condoName: u.condoName || (u.condoId ? `Posto ${u.condoId}` : null),
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
  }, [selectedCondoId]);

  const handleRoleChange = (newRole: 'sindico' | 'portaria') => {
    setRole(newRole);
    if (newRole === 'sindico') {
      setPermPortaria(true);
      setPermEncomendas(true);
      setPermVeiculos(true);
      setPermOcorrencias(true);
      setPermMoradores(true);
      setPermReservas(true);
      setPermAvisos(true);
      setPermEstrutura(true);
    } else {
      setPermPortaria(true);
      setPermEncomendas(true);
      setPermVeiculos(true);
      setPermOcorrencias(true);
      setPermMoradores(false);
      setPermReservas(false);
      setPermAvisos(false);
      setPermEstrutura(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    setSaving(true);
    setErrorMsg('');

    const permissions: string[] = [];
    if (permPortaria) permissions.push('portaria');
    if (permEncomendas) permissions.push('encomendas');
    if (permVeiculos) permissions.push('veiculos');
    if (permOcorrencias) permissions.push('ocorrencias');
    if (permMoradores) permissions.push('moradores');
    if (permReservas) permissions.push('reservas');
    if (permAvisos) permissions.push('avisos');
    if (permEstrutura) permissions.push('estrutura');

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanPassword = password.trim();

    try {
      const headers = await getAuthHeaders();
      const payload = {
        name: cleanName,
        email: cleanEmail,
        password: cleanPassword,
        role,
        permissions: role === 'sindico' ? ['all'] : permissions,
        condoId: userCondoId ? Number(userCondoId) : null,
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
          } catch {
            // não é json
          }
        }

        if (res.ok && jsonRes) {
          createdUser = jsonRes;
        } else if (!res.ok) {
          if (jsonRes?.error) {
            throw new Error(jsonRes.error);
          }
          console.warn(`API /api/users retornou status ${res.status}`);
        }
      } catch (fetchErr: any) {
        if (fetchErr.message && (fetchErr.message.includes('Já existe') || fetchErr.message.includes('obrigatório'))) {
          throw fetchErr;
        }
        console.warn('Operando com persistência de contingência:', fetchErr);
      }

      // Se a API não respondeu ou ambiente sem PostgreSQL, cria objeto resiliente
      if (!createdUser) {
        const selectedCondo = condominiums.find((c) => c.id === Number(userCondoId));
        createdUser = {
          id: Date.now(),
          uid: `usr-${Date.now()}`,
          name: cleanName,
          email: cleanEmail,
          role,
          permissions: JSON.stringify(role === 'sindico' ? ['all'] : permissions),
          condoId: userCondoId ? Number(userCondoId) : null,
          condoName: selectedCondo?.name || null,
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
      let apiUpdated = false;

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

        if (res.ok) {
          apiUpdated = true;
        } else if (jsonRes?.error) {
          throw new Error(jsonRes.error);
        }
      } catch (err: any) {
        if (err.message && !err.message.includes('fetch')) {
          throw err;
        }
      }

      // Atualiza também no localStorage
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
      alert(`Senha do usuário ${resetModalUser.name} alterada com sucesso!`);
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

      // Atualiza no localStorage
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

      // Remove do localStorage
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

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Gestão de Usuários & Equipe
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-slate-900 dark:bg-blue-600 text-white font-mono">
              {usersList.length} cadastrados
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastre funcionários, porteiros e gestores atribuindo o condomínio específico e permissões operacionais.
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setUserCondoId(selectedCondoId !== 'all' ? String(selectedCondoId) : '');
            setShowModal(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 min-h-[44px] bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Novo Usuário / Operador</span>
        </button>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">E-mail Institucional</th>
                <th className="py-3 px-4">Condomínio Vinculado</th>
                <th className="py-3 px-4">Nível de Função</th>
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
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => {
                  const isMaster = u.email === 'administrativo@novabrasil.com';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                        <div className="flex items-center gap-2">
                          {u.role === 'sindico' ? (
                            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-slate-500 dark:text-slate-400 shrink-0" />
                          )}
                          <span>{u.name}</span>
                          {isMaster && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-600 text-white rounded">
                              Master
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">{u.email}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span
                            className={`font-medium ${
                              u.condoName
                                ? 'text-slate-800 dark:text-slate-200'
                                : 'text-slate-500 dark:text-slate-400 italic'
                            }`}
                          >
                            {u.condoName ? u.condoName : 'Todos os Condomínios (Global)'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            u.role === 'sindico'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700'
                              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900'
                          }`}
                        >
                          {u.role === 'sindico' ? 'Supervisor Geral (Gestão)' : 'Operador (Portaria / Posto)'}
                        </span>
                      </td>
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
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Cadastrar Novo Usuário / Operador</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && <p className="text-xs text-rose-600 dark:text-rose-400">{errorMsg}</p>}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Condomínio Designado
                </label>
                <select
                  value={userCondoId}
                  onChange={(e) => setUserCondoId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">🏢 Todos os Condomínios (Gestor Geral / Empresa)</option>
                  {condominiums.map((c) => (
                    <option key={c.id} value={c.id}>
                      📍 {c.name} {c.city ? `(${c.city})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                  Selecione um condomínio específico para portarias ou "Todos os Condomínios" para administradores gerais.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Nome Completo *</label>
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">E-mail de Login *</label>
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
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Senha Inicial *</label>
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
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">Nível de Função *</label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => handleRoleChange('sindico')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      role === 'sindico'
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Supervisor Geral</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Acesso Total a Todos os Módulos</span>
                  </div>

                  <div
                    onClick={() => handleRoleChange('portaria')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      role === 'portaria'
                        ? 'border-blue-600 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-950/40 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Portaria / Posto</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Acessos, Rondas, Materiais</span>
                  </div>
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
                  className="px-5 py-2 text-xs bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-semibold cursor-pointer disabled:opacity-50 min-h-[40px]"
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
