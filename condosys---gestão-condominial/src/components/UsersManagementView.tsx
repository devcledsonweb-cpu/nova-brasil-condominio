import React, { useState, useEffect } from 'react';
import { SystemUser } from '../types/index.ts';
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
} from 'lucide-react';

interface UsersManagementViewProps {
  onRefresh?: () => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = () => {
  const { user, getAuthHeaders } = useAuth();
  const [usersList, setUsersList] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Novo Usuário
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'sindico' | 'portaria'>('portaria');
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
      const res = await fetch('/api/users', { headers });
      if (res.ok) {
        const data = await res.json();
        setUsersList(data);
      }
    } catch (err) {
      console.error('Erro ao buscar lista de usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

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

    const permissions = role === 'sindico' ? ['all'] : [];
    if (role === 'portaria') {
      if (permPortaria) permissions.push('portaria');
      if (permEncomendas) permissions.push('encomendas');
      if (permVeiculos) permissions.push('veiculos');
      if (permOcorrencias) permissions.push('ocorrencias');
      if (permMoradores) permissions.push('moradores');
      if (permReservas) permissions.push('reservas');
      if (permAvisos) permissions.push('comunicados');
      if (permEstrutura) permissions.push('estrutura');
    }

    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/users', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password: password.trim(),
          role,
          permissions: JSON.stringify(permissions),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Erro ao criar usuário.');
      }

      setShowModal(false);
      setName('');
      setEmail('');
      setPassword('');
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (u: SystemUser) => {
    if (u.email === 'administrativo@novabrasil.com') {
      alert('O usuário Administrador Master não pode ser desativado.');
      return;
    }
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/users/${u.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPassword.trim()) return;
    setSaving(true);
    try {
      const headers = await getAuthHeaders();
      await fetch(`/api/users/${resetModalUser.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ password: newPassword.trim() }),
      });
      setResetModalUser(null);
      setNewPassword('');
      alert('Senha atualizada com sucesso!');
      fetchUsers();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (u: SystemUser) => {
    if (u.email === 'administrativo@novabrasil.com') {
      alert('O usuário Administrador Master não pode ser excluído.');
      return;
    }
    if (!confirm(`Deseja realmente remover o acesso de ${u.name} (${u.email})?`)) return;

    try {
      const headers = await getAuthHeaders();
      const res = await fetch(`/api/users/${u.id}`, { method: 'DELETE', headers });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir usuário.');
        return;
      }
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Gestão de Usuários e Níveis de Acesso
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Criação e delegação de contas para Síndico e operadores de Portaria com controle granular de permissões
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setShowModal(true);
          }}
          className="px-3.5 py-2 text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Novo Usuário / Operador
        </button>
      </div>

      {/* Informação do Administrador Master */}
      <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-slate-900 text-white">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Conta Master do Sistema:</span>
              <span className="text-xs font-mono bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-semibold">
                administrativo@novabrasil.com
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Possui autoridade máxima para definir, conceder, revogar ou alterar qualquer nível de acesso na aplicação.
            </p>
          </div>
        </div>

        <span className="text-[11px] font-mono px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg font-semibold shrink-0">
          Acesso Total Liberado
        </span>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Usuários e Operadores Cadastrados</h3>
            <p className="text-xs text-slate-500">Contas habilitadas a fazer login no painel</p>
          </div>
          <span className="text-xs font-mono text-slate-500">Total: {usersList.length} usuários</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 font-medium">
              <tr>
                <th className="py-2.5 px-4">Nome do Usuário</th>
                <th className="py-2.5 px-4">E-mail de Login</th>
                <th className="py-2.5 px-4">Nível de Acesso</th>
                <th className="py-2.5 px-4">Módulos Permitidos</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Carregando usuários...
                  </td>
                </tr>
              ) : usersList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhum usuário cadastrado.
                  </td>
                </tr>
              ) : (
                usersList.map((u) => {
                  const isMaster = u.email === 'administrativo@novabrasil.com';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          {u.role === 'sindico' ? (
                            <ShieldCheck className="w-4 h-4 text-slate-900 shrink-0" />
                          ) : (
                            <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
                          )}
                          <span>{u.name}</span>
                          {isMaster && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-900 text-white rounded">
                              Master
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-700">{u.email}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                            u.role === 'sindico'
                              ? 'bg-slate-100 text-slate-900 border border-slate-300'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {u.role === 'sindico' ? 'Síndico (Gestão Total)' : 'Portaria (Operacional)'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {u.role === 'sindico' ? (
                          <span className="text-emerald-700 font-medium">Acesso Total irrestrito</span>
                        ) : (
                          <span className="text-slate-500">Portaria, Encomendas, Veículos, Acessos</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isMaster}
                          className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded cursor-pointer transition-colors ${
                            u.isActive
                              ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
                          } ${isMaster ? 'cursor-not-allowed opacity-80' : ''}`}
                        >
                          {u.isActive ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              Ativo
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
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
                            className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded cursor-pointer"
                            title="Alterar / Redefinir Senha"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          {!isMaster && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-sm font-bold text-slate-900">Cadastrar Novo Usuário / Operador</h3>
            {errorMsg && <p className="text-xs text-rose-600">{errorMsg}</p>}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: João da Silva (Porteiro Turno B)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">E-mail de Login *</label>
                <input
                  type="email"
                  required
                  placeholder="joao@novabrasil.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Senha Inicial *</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 pr-10 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1.5">Nível de Acesso *</label>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => handleRoleChange('sindico')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      role === 'sindico'
                        ? 'border-slate-900 bg-slate-50 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">Síndico / Gestor</span>
                    <span className="text-[11px] text-slate-500">Acesso Total a Todos os Módulos</span>
                  </div>

                  <div
                    onClick={() => handleRoleChange('portaria')}
                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                      role === 'portaria'
                        ? 'border-slate-900 bg-slate-50 shadow-xs'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 block">Portaria / Operador</span>
                    <span className="text-[11px] text-slate-500">Focado em Portaria, Encomendas e Acessos</span>
                  </div>
                </div>
              </div>

              {/* Permissões Específicas */}
              {role === 'portaria' && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <span className="text-xs font-semibold text-slate-700 block">
                    Módulos Liberados para este Operador:
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permPortaria}
                        onChange={(e) => setPermPortaria(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900"
                      />
                      <span>Controle de Acessos</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permEncomendas}
                        onChange={(e) => setPermEncomendas(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900"
                      />
                      <span>Receber Encomendas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permVeiculos}
                        onChange={(e) => setPermVeiculos(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900"
                      />
                      <span>Buscar Veículos & Vagas</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permOcorrencias}
                        onChange={(e) => setPermOcorrencias(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900"
                      />
                      <span>Livro de Ocorrências</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permMoradores}
                        onChange={(e) => setPermMoradores(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900"
                      />
                      <span>Consultar Moradores</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={permReservas}
                        onChange={(e) => setPermReservas(e.target.checked)}
                        className="rounded border-slate-300 text-slate-900"
                      />
                      <span>Consultar Reservas</span>
                    </label>
                  </div>
                </div>
              )}

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
                  {saving ? 'Criando...' : 'Criar Acesso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Redefinir Senha */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-sm w-full p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Redefinir Senha de Acesso</h3>
            <p className="text-xs text-slate-500">
              Usuário: <span className="font-semibold text-slate-800">{resetModalUser.name}</span> (
              {resetModalUser.email})
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">Nova Senha *</label>
                <input
                  type="password"
                  required
                  placeholder="Digite a nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:border-slate-900 font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 text-xs font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50 cursor-pointer"
                >
                  {saving ? 'Gravando...' : 'Salvar Nova Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
