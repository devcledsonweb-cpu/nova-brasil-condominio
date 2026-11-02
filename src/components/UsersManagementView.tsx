import React, { useState, useEffect } from 'react';
import { SystemUser, Condominium, UserRole, SecurityAgent } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { WhatsAppButton } from './WhatsAppButton.tsx';
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
  RefreshCw,
  Phone,
  Shield,
  BadgeAlert,
} from 'lucide-react';

interface UsersManagementViewProps {
  condominiums?: Condominium[];
  agents?: SecurityAgent[];
  selectedCondoId?: number | 'all';
  onRefresh?: () => void;
}

export const UsersManagementView: React.FC<UsersManagementViewProps> = ({
  condominiums = [],
  agents = [],
  selectedCondoId = 'all',
  onRefresh,
}) => {
  const { user, getAuthHeaders } = useAuth();
  const [usersList, setUsersList] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterCondo, setFilterCondo] = useState<string>(
    selectedCondoId !== 'all' ? String(selectedCondoId) : 'all'
  );
  const [activeTab, setActiveTab] = useState<'all' | 'agents' | 'managers'>('all');
  const [syncNotice, setSyncNotice] = useState<string>('');

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

  const suggestEmail = (agentName: string) => {
    if (!agentName || !agentName.trim()) return 'agente@novabrasil.com';
    const clean = agentName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim()
      .split(/\s+/);
    if (clean.length === 1) {
      return `${clean[0]}@novabrasil.com`;
    }
    return `${clean[0]}.${clean[clean.length - 1]}@novabrasil.com`;
  };

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

      // 1. Usuários salvos localmente
      let localUsers: any[] = [];
      try {
        const saved = localStorage.getItem('novabrasil_users_list');
        if (saved) localUsers = JSON.parse(saved);
      } catch {}

      // 2. Coletar todos os agentes disponíveis (prop ou localStorage)
      let allAgents: SecurityAgent[] = agents.length > 0 ? agents : [];
      if (allAgents.length === 0) {
        try {
          const savedAgents = localStorage.getItem('novabrasil_agents');
          if (savedAgents) allAgents = JSON.parse(savedAgents);
        } catch {}
      }

      const emailMap = new Set<string>();
      const nameMap = new Set<string>();
      const combined: SystemUser[] = [];

      // A. Adiciona usuários do servidor
      for (const u of serverUsers) {
        const cleanEmail = u.email.toLowerCase();
        if (!emailMap.has(cleanEmail)) {
          emailMap.add(cleanEmail);
          nameMap.add(u.name.toLowerCase().trim());
          combined.push({
            ...u,
            condoIds: Array.isArray(u.condoIds) && u.condoIds.length > 0 ? u.condoIds : (u.condoId ? [u.condoId] : []),
            condoNames: u.condoNames || (u.condoName ? [u.condoName] : []),
          });
        }
      }

      // B. Adiciona usuários locais existentes
      for (const u of localUsers) {
        const cleanEmail = u.email.toLowerCase();
        if (!emailMap.has(cleanEmail)) {
          emailMap.add(cleanEmail);
          nameMap.add(u.name.toLowerCase().trim());
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
            phone: u.phone,
            badgeNumber: u.badgeNumber,
            assignedStation: u.assignedStation,
            photoUrl: u.photoUrl,
            isAgent: u.role === 'portaria',
          });
        }
      }

      // C. GARANTIR QUE 100% DOS AGENTES APAREÇAM NA GESTÃO DE USUÁRIOS
      let newSyncedCount = 0;
      for (const ag of allAgents) {
        const cleanAgentName = ag.name.toLowerCase().trim();
        const candidateEmail = (ag.accessEmail || suggestEmail(ag.name)).toLowerCase().trim();

        // Se o agente já foi adicionado pelo e-mail ou nome
        const existingIdx = combined.findIndex(
          (u) => u.email.toLowerCase() === candidateEmail || u.name.toLowerCase().trim() === cleanAgentName
        );

        if (existingIdx !== -1) {
          // Enriquece com dados cadastrais do agente (telefone, crachá, foto, posto)
          combined[existingIdx].phone = combined[existingIdx].phone || ag.phone;
          combined[existingIdx].badgeNumber = combined[existingIdx].badgeNumber || ag.badgeNumber;
          combined[existingIdx].assignedStation = combined[existingIdx].assignedStation || ag.assignedStation;
          combined[existingIdx].photoUrl = combined[existingIdx].photoUrl || ag.photoUrl;
          combined[existingIdx].isAgent = true;
        } else {
          // Cria o registro unificado do agente no quadro de usuários
          const agentCondoIds = Array.isArray(ag.condoIds) && ag.condoIds.length > 0
            ? ag.condoIds
            : (ag.condoId ? [Number(ag.condoId)] : []);
          const agentCondo = condominiums.find((c) => c.id === Number(ag.condoId));
          const agentCondoNames = ag.condoNames || (agentCondo ? [agentCondo.name] : []);

          const newAgentUser: SystemUser = {
            id: 20000 + ag.id,
            uid: `usr-agent-${ag.id}`,
            name: ag.name,
            email: candidateEmail,
            role: 'portaria',
            permissions: JSON.stringify(['portaria', 'ronda', 'materiais', 'ocorrencias']),
            condoId: agentCondoIds[0] || null,
            condoIds: agentCondoIds,
            condoName: agentCondoNames[0] || ag.condoName || 'Posto Geral',
            condoNames: agentCondoNames,
            isActive: ag.status !== 'afastado',
            createdAt: ag.admissionDate || ag.createdAt || new Date().toISOString(),
            phone: ag.phone,
            badgeNumber: ag.badgeNumber,
            assignedStation: ag.assignedStation,
            photoUrl: ag.photoUrl,
            isAgent: true,
          };

          combined.push(newAgentUser);
          emailMap.add(candidateEmail);
          nameMap.add(cleanAgentName);
          newSyncedCount++;
        }
      }

      // Persistir lista unificada para permitir login imediato de qualquer agente
      try {
        localStorage.setItem('novabrasil_users_list', JSON.stringify(combined));
      } catch {}

      setUsersList(combined);
      if (newSyncedCount > 0) {
        setSyncNotice(`${newSyncedCount} agente(s) sincronizado(s) com sucesso na Gestão de Usuários.`);
        setTimeout(() => setSyncNotice(''), 4000);
      }
    } catch (err) {
      console.error('Erro ao buscar lista de usuários:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [agents.length]);

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
      let createdUser: any = null;

      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            name: cleanName,
            email: cleanEmail,
            password: cleanPassword,
            role: selectedRole,
            permissions,
            condoId: primaryCondoId,
            condoIds: userCondoIds,
          }),
        });

        const text = await res.text();
        if (text && text.trim()) {
          try {
            createdUser = JSON.parse(text);
          } catch {}
        }
        if (!res.ok && createdUser?.error) {
          throw new Error(createdUser.error);
        }
      } catch (postErr: any) {
        if (postErr.message && !postErr.message.includes('fetch')) {
          throw postErr;
        }
      }

      const newUserObj: SystemUser = {
        id: createdUser?.id || Date.now(),
        uid: createdUser?.uid || `usr-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        role: selectedRole,
        permissions: JSON.stringify(permissions),
        condoId: primaryCondoId,
        condoIds: userCondoIds,
        condoName: assignedNames[0] || null,
        condoNames: assignedNames,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      try {
        const saved = localStorage.getItem('novabrasil_users_list');
        const list = saved ? JSON.parse(saved) : [];
        const filtered = list.filter((u: any) => u.email.toLowerCase() !== cleanEmail);
        localStorage.setItem('novabrasil_users_list', JSON.stringify([newUserObj, ...filtered]));
      } catch {}

      setShowModal(false);
      setName('');
      setEmail('');
      setPassword('');
      await fetchUsers();
      if (onRefresh) onRefresh();
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
        await fetch(`/api/users/${resetModalUser.id}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify({ password: newPassword.trim() }),
        });
      } catch {}

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
      alert(`Senha de ${resetModalUser.name} redefinida com sucesso para "${newPassword.trim()}"!`);
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
    if (!confirm(`Deseja realmente excluir o acesso do usuário "${u.name}"?`)) return;
    try {
      const headers = await getAuthHeaders();
      try {
        await fetch(`/api/users/${u.id}`, {
          method: 'DELETE',
          headers,
        });
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

  // Contadores
  const agentsOnlyCount = usersList.filter((u) => u.role === 'portaria' || u.role === 'operador' || u.isAgent).length;
  const managersOnlyCount = usersList.filter((u) => u.role === 'sindico' || u.role === 'admin' || u.role === 'supervisor').length;

  // Filtragem dos usuários exibidos
  const filteredUsers = usersList.filter((u) => {
    // Aba ativa
    if (activeTab === 'agents' && u.role !== 'portaria' && u.role !== 'operador' && !u.isAgent) {
      return false;
    }
    if (activeTab === 'managers' && (u.role === 'portaria' || u.role === 'operador') && !u.isAgent) {
      return false;
    }

    // Filtro por condomínio
    if (filterCondo !== 'all') {
      const condoNum = Number(filterCondo);
      const isGlobal = u.role === 'sindico' || u.role === 'admin' || (u.condoId == null && (!u.condoIds || u.condoIds.length === 0));
      const hasCondo = u.condoId === condoNum || (Array.isArray(u.condoIds) && u.condoIds.includes(condoNum));
      if (!isGlobal && !hasCondo) return false;
    }

    // Filtro por papel específico
    if (filterRole !== 'all') {
      if (filterRole === 'sindico' && u.role !== 'sindico' && u.role !== 'admin') return false;
      if (filterRole === 'supervisor' && u.role !== 'supervisor') return false;
      if (filterRole === 'portaria' && u.role !== 'portaria' && u.role !== 'operador') return false;
    }

    // Busca textual
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchName = u.name?.toLowerCase().includes(term);
      const matchEmail = u.email?.toLowerCase().includes(term);
      const matchBadge = u.badgeNumber?.toLowerCase().includes(term);
      const matchPhone = u.phone?.toLowerCase().includes(term);
      const matchStation = u.assignedStation?.toLowerCase().includes(term);
      const matchCondo =
        u.condoName?.toLowerCase().includes(term) ||
        (u.condoNames && u.condoNames.some((c) => c.toLowerCase().includes(term)));
      return matchName || matchEmail || matchBadge || matchPhone || matchStation || matchCondo;
    }
    return true;
  });

  const getRoleBadge = (u: SystemUser) => {
    const r = u.role;
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
          Supervisor de Posto
        </span>
      );
    }
    return (
      <div className="space-y-0.5">
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
          <UserCheck className="w-3 h-3 text-emerald-600" />
          Agente de Portaria
        </span>
        {u.badgeNumber && (
          <span className="block text-[10px] text-slate-500 font-mono">
            Crachá: {u.badgeNumber}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Aviso de Sincronização */}
      {syncNotice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-200 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-semibold">{syncNotice}</span>
          </div>
          <button onClick={() => setSyncNotice('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-xs">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Gestão de Usuários & Agentes
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-600 text-white font-mono">
                  {usersList.length} no sistema
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Quadro unificado de credenciais: Gestores Gerais, Supervisores de Posto e Agentes de Portaria/Ronda.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={fetchUsers}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 transition-colors cursor-pointer"
            title="Atualizar e sincronizar agentes"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Sincronizar</span>
          </button>

          <button
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Usuário / Gestor</span>
          </button>
        </div>
      </div>

      {/* Abas Rápidas de Visualização */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Todos os Usuários & Agentes ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('agents')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'agents'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          🛡️ Agentes de Portaria ({agentsOnlyCount})
        </button>

        <button
          onClick={() => setActiveTab('managers')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
            activeTab === 'managers'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          👔 Gestores & Supervisores ({managersOnlyCount})
        </button>
      </div>

      {/* Filtros e Busca */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-3.5 sm:p-4 shadow-2xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail, crachá, telefone ou posto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-slate-50/50 dark:bg-slate-800 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtro Posto:</span>
          </div>

          <select
            value={filterCondo}
            onChange={(e) => setFilterCondo(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium"
          >
            <option value="all">🏢 Todos os Postos (Global)</option>
            {condominiums.map((c) => (
              <option key={c.id} value={c.id}>
                📍 {c.name}
              </option>
            ))}
          </select>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="text-xs border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
          >
            <option value="all">Todos os Níveis</option>
            <option value="sindico">Gestor Geral da Empresa</option>
            <option value="supervisor">Supervisor de Posto</option>
            <option value="portaria">Agente de Portaria</option>
          </select>
        </div>
      </div>

      {/* Tabela de Usuários */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Usuário / Agente</th>
                <th className="py-3 px-4">E-mail de Login</th>
                <th className="py-3 px-4">WhatsApp / Contato</th>
                <th className="py-3 px-4">Condomínio(s) Atribuído(s)</th>
                <th className="py-3 px-4">Perfil Operacional</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Carregando quadro de usuários...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Nenhum usuário ou agente encontrado com os filtros atuais.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isMaster = u.email === 'administrativo@novabrasil.com';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                      {/* Usuário / Agente com Foto */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {u.photoUrl ? (
                            <img
                              src={u.photoUrl}
                              alt={u.name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
                              u.role === 'sindico' || u.role === 'admin'
                                ? 'bg-blue-600'
                                : u.role === 'supervisor'
                                ? 'bg-indigo-600'
                                : 'bg-emerald-600'
                            }`}>
                              {u.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isMaster && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 bg-blue-600 text-white rounded font-bold">
                                  Master
                                </span>
                              )}
                            </p>
                            {u.assignedStation && (
                              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium truncate">
                                Posto: {u.assignedStation}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* E-mail de Login */}
                      <td className="py-3 px-4 font-mono text-slate-700 dark:text-slate-300">
                        {u.email}
                      </td>

                      {/* Contato WhatsApp Clicável */}
                      <td className="py-3 px-4">
                        {u.phone ? (
                          <WhatsAppButton phone={u.phone} name={u.name} />
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Sem telefone</span>
                        )}
                      </td>

                      {/* Condomínios Atribuídos */}
                      <td className="py-3 px-4">
                        {u.role === 'sindico' || u.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 dark:text-blue-400">
                            <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                            Rede Completa (Global)
                          </span>
                        ) : u.condoNames && u.condoNames.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {u.condoNames.map((cName, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                              >
                                {cName}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-500 dark:text-slate-400 italic text-[11px]">
                            {u.condoName || 'Posto Geral'}
                          </span>
                        )}
                      </td>

                      {/* Perfil Operacional */}
                      <td className="py-3 px-4">{getRoleBadge(u)}</td>

                      {/* Status */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isMaster}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full cursor-pointer transition-colors ${
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

                      {/* Ações */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setResetModalUser(u);
                              setNewPassword('');
                            }}
                            className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
                            title="Alterar / Redefinir Senha deste Usuário"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          {!isMaster && (
                            <button
                              onClick={() => handleDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg cursor-pointer transition-colors"
                              title="Remover Acesso"
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

      {/* Modal Redefinir Senha */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Redefinir Senha
                </h3>
              </div>
              <button
                onClick={() => setResetModalUser(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
              Defina a nova senha para o usuário <strong>{resetModalUser.name}</strong> ({resetModalUser.email}).
            </p>

            {errorMsg && (
              <div className="mt-2 p-2 bg-rose-50 text-rose-700 rounded-lg text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleResetPassword} className="space-y-3 mt-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nova Senha (mínimo 6 dígitos) *
                </label>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ex: Portaria@2026, 123456"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : 'Atualizar Senha'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Criar Novo Usuário */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Cadastrar Usuário / Gestor
                </h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Eduardo da Silva"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    E-mail Institucional de Login *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="carlos@novabrasil.com"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Senha Inicial (mínimo 6 dígitos) *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 pr-9 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nível de Acesso Operacional *
                </label>
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                >
                  <option value="portaria">Agente de Portaria / Ronda (Acesso aos postos)</option>
                  <option value="supervisor">Supervisor de Condomínio (Gestão de postos atribuídos)</option>
                  <option value="sindico">Gestor Geral da Empresa (Acesso completo e irrestrito)</option>
                </select>
              </div>

              {selectedRole !== 'sindico' && (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-semibold text-slate-700 dark:text-slate-300">
                      Condomínio(s) com Permissão de Acesso:
                    </label>
                    <button
                      type="button"
                      onClick={selectAllCondos}
                      className="text-[11px] text-blue-600 hover:underline"
                    >
                      {userCondoIds.length === condominiums.length ? 'Desmarcar Todos' : 'Marcar Todos'}
                    </button>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700">
                    {condominiums.map((c) => (
                      <label key={c.id} className="flex items-center gap-2 p-1 hover:bg-white dark:hover:bg-slate-800 rounded-lg cursor-pointer">
                        <input
                          type="checkbox"
                          checked={userCondoIds.includes(c.id)}
                          onChange={() => toggleCondo(c.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="font-medium text-slate-800 dark:text-slate-200 truncate">{c.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer disabled:opacity-50"
                >
                  {saving ? 'Cadastrando...' : 'Cadastrar Usuário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
