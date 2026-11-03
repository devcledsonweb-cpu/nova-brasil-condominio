import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { CondominiumsView } from './components/CondominiumsView.tsx';
import { AgentsView } from './components/AgentsView.tsx';
import { ShiftScaleView } from './components/ShiftScaleView.tsx';
import { PatrolVehiclesView } from './components/PatrolVehiclesView.tsx';
import { CompanyAssetsView } from './components/CompanyAssetsView.tsx';
import { MaintenancesView } from './components/MaintenancesView.tsx';
import { OperationalLogsView } from './components/OperationalLogsView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { LoginView } from './components/LoginView.tsx';
import { UsersManagementView } from './components/UsersManagementView.tsx';
import {
  Condominium,
  DashboardStats,
  SecurityAgent,
  PatrolVehicle,
  CompanyAsset,
  MaintenanceOrder,
  OperationalLog,
  ShiftCoverage,
} from './types/index.ts';
import { Loader2, Bell } from 'lucide-react';
import {
  COLLECTIONS,
  subscribeToFirestoreCollection,
  saveToFirestore,
  updateInFirestore,
  deleteFromFirestore,
  seedIfEmpty,
} from './services/firestoreSync.ts';

function NovaBrasilMain() {
  const { user, getAuthHeaders, role, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados Multi-Condomínio
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [selectedCondoId, setSelectedCondoId] = useState<number | 'all'>('all');

  // Estados dos Módulos Operacionais da Empresa Terceirizada
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [agents, setAgents] = useState<SecurityAgent[]>([]);
  const [coverages, setCoverages] = useState<ShiftCoverage[]>([]);
  const [patrolVehicles, setPatrolVehicles] = useState<PatrolVehicle[]>([]);
  const [companyAssets, setCompanyAssets] = useState<CompanyAsset[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceOrder[]>([]);
  const [operationalLogs, setOperationalLogs] = useState<OperationalLog[]>([]);

  // Sincronizar condomínio padrão se o usuário for restrito a um condomínio específico
  useEffect(() => {
    const isMaster =
      user?.email?.toLowerCase() === 'administrativo@novabrasil.com' ||
      user?.email?.toLowerCase() === 'cledson@novabrasil.com';
    const isSuper = role === 'sindico' || role === 'admin' || isMaster;
    if (!isSuper && user) {
      const userAssignedIds: number[] = Array.isArray(user.condoIds) && user.condoIds.length > 0
        ? user.condoIds
        : (user.condoId ? [user.condoId] : []);

      if (userAssignedIds.length === 1) {
        setSelectedCondoId(userAssignedIds[0]);
      } else if (userAssignedIds.length > 1) {
        if (selectedCondoId !== 'all' && !userAssignedIds.includes(Number(selectedCondoId))) {
          setSelectedCondoId(userAssignedIds[0]);
        }
      }

      // Se tentar navegar para o módulo de gestão de usuários da empresa sem ser administrador geral
      if (activeTab === 'usuarios') {
        setActiveTab('dashboard');
      }
    }
  }, [user, role, activeTab]);

  const fetchAllData = async () => {
    try {
      const headers = await getAuthHeaders();
      const queryParam = selectedCondoId !== 'all' ? `?condoId=${selectedCondoId}` : '';

      const [
        condosRes,
        statsRes,
        agentsRes,
        vehiclesRes,
        assetsRes,
        maintenancesRes,
        logsRes,
        coveragesRes,
      ] = await Promise.all([
        fetch('/api/condominiums', { headers }),
        fetch(`/api/dashboard/stats${queryParam}`, { headers }),
        fetch('/api/agents', { headers }),
        fetch('/api/patrol-vehicles', { headers }),
        fetch('/api/company-assets', { headers }),
        fetch('/api/maintenances', { headers }),
        fetch('/api/operational-logs', { headers }),
        fetch('/api/shift-coverages', { headers }),
      ]);

      // Helper para ler JSON com segurança e prevenir erros de parse caso o host retorne HTML
      const parseJsonRes = async <T,>(res: Response): Promise<T | null> => {
        try {
          const contentType = res.headers.get('content-type') || '';
          if (res.ok && contentType.includes('application/json')) {
            return (await res.json()) as T;
          }
        } catch {
          // ignora erro de parse de HTML
        }
        return null;
      };

      // 1. Condomínios
      let loadedCondos: Condominium[] = [];
      const condosData = await parseJsonRes<Condominium[]>(condosRes);
      if (condosData && Array.isArray(condosData)) {
        loadedCondos = condosData.map((c: any) => ({
          ...c,
          imageUrl: c.imageUrl || c.photoUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
          photoUrl: c.photoUrl || c.imageUrl || null,
          serviceStations: Array.isArray(c.serviceStations) && c.serviceStations.length > 0
            ? c.serviceStations
            : (Array.isArray(c.servicePosts)
                ? c.servicePosts.map((p: string, idx: number) => ({
                    id: `st-${c.id}-${idx + 1}`,
                    condoId: c.id,
                    name: p,
                    type: idx === 0 ? 'portaria_principal' : 'posto_geral',
                    shiftSchedule: '12x36 Diurno (06h às 18h)',
                    assignedAgentName: null,
                  }))
                : []),
        }));
        localStorage.setItem('novabrasil_condos', JSON.stringify(loadedCondos));
      } else {
        const saved = localStorage.getItem('novabrasil_condos');
        if (saved) {
          try { loadedCondos = JSON.parse(saved); } catch {}
        }
      }
      setCondominiums(loadedCondos);

      // 2. Agentes de Portaria
      let loadedAgents: SecurityAgent[] = [];
      const agentsData = await parseJsonRes<SecurityAgent[]>(agentsRes);
      if (agentsData && Array.isArray(agentsData)) {
        loadedAgents = agentsData;
        localStorage.setItem('novabrasil_agents', JSON.stringify(loadedAgents));
      } else {
        const saved = localStorage.getItem('novabrasil_agents');
        if (saved) {
          try { loadedAgents = JSON.parse(saved); } catch {}
        }
      }
      setAgents(loadedAgents);

      // 3. Veículos de Ronda da Empresa
      let loadedVehicles: PatrolVehicle[] = [];
      const vehiclesData = await parseJsonRes<PatrolVehicle[]>(vehiclesRes);
      if (vehiclesData && Array.isArray(vehiclesData)) {
        loadedVehicles = vehiclesData;
        localStorage.setItem('novabrasil_patrol_vehicles', JSON.stringify(loadedVehicles));
      } else {
        const saved = localStorage.getItem('novabrasil_patrol_vehicles');
        if (saved) {
          try { loadedVehicles = JSON.parse(saved); } catch {}
        }
      }
      setPatrolVehicles(loadedVehicles);

      // 4. Materiais e Patrimônio da Empresa
      let loadedAssets: CompanyAsset[] = [];
      const assetsData = await parseJsonRes<CompanyAsset[]>(assetsRes);
      if (assetsData && Array.isArray(assetsData)) {
        loadedAssets = assetsData;
        localStorage.setItem('novabrasil_company_assets', JSON.stringify(loadedAssets));
      } else {
        const saved = localStorage.getItem('novabrasil_company_assets');
        if (saved) {
          try { loadedAssets = JSON.parse(saved); } catch {}
        }
      }
      setCompanyAssets(loadedAssets);

      // 5. Manutenções Realizadas pela Empresa
      let loadedMaintenances: MaintenanceOrder[] = [];
      const maintenancesData = await parseJsonRes<MaintenanceOrder[]>(maintenancesRes);
      if (maintenancesData && Array.isArray(maintenancesData)) {
        loadedMaintenances = maintenancesData;
        localStorage.setItem('novabrasil_maintenances', JSON.stringify(loadedMaintenances));
      } else {
        const saved = localStorage.getItem('novabrasil_maintenances');
        if (saved) {
          try { loadedMaintenances = JSON.parse(saved); } catch {}
        }
      }
      setMaintenances(loadedMaintenances);

      // 6. Livro de Ocorrências e Turnos
      let loadedLogs: OperationalLog[] = [];
      const logsData = await parseJsonRes<OperationalLog[]>(logsRes);
      if (logsData && Array.isArray(logsData)) {
        loadedLogs = logsData;
        localStorage.setItem('novabrasil_operational_logs', JSON.stringify(loadedLogs));
      } else {
        const saved = localStorage.getItem('novabrasil_operational_logs');
        if (saved) {
          try { loadedLogs = JSON.parse(saved); } catch {}
        }
      }
      setOperationalLogs(loadedLogs);

      // 7. Escala 12x36 e Cobertura de Faltas
      let loadedCoverages: ShiftCoverage[] = [];
      const coveragesData = await parseJsonRes<ShiftCoverage[]>(coveragesRes);
      if (coveragesData && Array.isArray(coveragesData)) {
        loadedCoverages = coveragesData;
        localStorage.setItem('novabrasil_shift_coverages', JSON.stringify(loadedCoverages));
      } else {
        const saved = localStorage.getItem('novabrasil_shift_coverages');
        if (saved) {
          try { loadedCoverages = JSON.parse(saved); } catch {}
        }
      }
      setCoverages(loadedCoverages);

      // Sincronizar dinamicamente as contagens de agentes, rondas, materiais e O.S. nos condomínios
      const condosWithDynamicCounts = loadedCondos.map((c) => ({
        ...c,
        agentsCount: loadedAgents.filter((a) => Number(a.condoId) === Number(c.id) || (Array.isArray(a.condoIds) && a.condoIds.includes(Number(c.id)))).length,
        vehiclesCount: loadedVehicles.filter((v) => Number(v.condoId) === Number(c.id)).length,
        assetsCount: loadedAssets.filter((a) => Number(a.condoId) === Number(c.id)).reduce((acc, a) => acc + (a.quantity || 1), 0),
        maintenancesCount: loadedMaintenances.filter((m) => Number(m.condoId) === Number(c.id) && m.status !== 'concluida').length,
      }));
      setCondominiums(condosWithDynamicCounts);
      localStorage.setItem('novabrasil_condos', JSON.stringify(condosWithDynamicCounts));

      // 8. Estatísticas Consolidadas
      const statsData = await parseJsonRes<DashboardStats>(statsRes);
      if (statsData) {
        setStats(statsData);
      } else {
        setStats({
          totalCondos: condosWithDynamicCounts.length,
          totalAgents: loadedAgents.length,
          agentsOnDuty: loadedAgents.filter((a) => a.status === 'em_servico').length,
          totalPatrolVehicles: loadedVehicles.length,
          activePatrolVehicles: loadedVehicles.filter((v) => v.status === 'em_ronda' || v.status === 'disponivel').length,
          totalAssets: loadedAssets.reduce((acc, a) => acc + (a.quantity || 1), 0),
          pendingMaintenances: loadedMaintenances.filter((m) => m.status !== 'concluida').length,
          completedMaintenances: loadedMaintenances.filter((m) => m.status === 'concluida').length,
          todayLogs: loadedLogs.length,
        });
      }
    } catch (error) {
      console.warn('Erro ao carregar dados do servidor:', error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Inicia escuta em tempo real via Firebase Firestore (Zero Latência entre todos os dispositivos)
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubCondos = subscribeToFirestoreCollection<Condominium>(COLLECTIONS.CONDOMINIUMS, (items) => {
      if (items && items.length > 0) {
        setCondominiums(items);
        localStorage.setItem('novabrasil_condos', JSON.stringify(items));
      }
    });

    const unsubAgents = subscribeToFirestoreCollection<SecurityAgent>(COLLECTIONS.AGENTS, (items) => {
      if (items && items.length > 0) {
        setAgents(items);
        localStorage.setItem('novabrasil_agents', JSON.stringify(items));
      }
    });

    const unsubVehicles = subscribeToFirestoreCollection<PatrolVehicle>(COLLECTIONS.VEHICLES, (items) => {
      if (items && items.length > 0) {
        setPatrolVehicles(items);
        localStorage.setItem('novabrasil_patrol_vehicles', JSON.stringify(items));
      }
    });

    const unsubAssets = subscribeToFirestoreCollection<CompanyAsset>(COLLECTIONS.ASSETS, (items) => {
      if (items && items.length > 0) {
        setCompanyAssets(items);
        localStorage.setItem('novabrasil_company_assets', JSON.stringify(items));
      }
    });

    const unsubMaintenances = subscribeToFirestoreCollection<MaintenanceOrder>(COLLECTIONS.MAINTENANCES, (items) => {
      if (items && items.length > 0) {
        setMaintenances(items);
        localStorage.setItem('novabrasil_maintenances', JSON.stringify(items));
      }
    });

    const unsubLogs = subscribeToFirestoreCollection<OperationalLog>(COLLECTIONS.LOGS, (items) => {
      if (items && items.length > 0) {
        setOperationalLogs(items);
        localStorage.setItem('novabrasil_operational_logs', JSON.stringify(items));
      }
    });

    const unsubCoverages = subscribeToFirestoreCollection<ShiftCoverage>(COLLECTIONS.COVERAGES, (items) => {
      if (items && items.length > 0) {
        setCoverages(items);
        localStorage.setItem('novabrasil_shift_coverages', JSON.stringify(items));
      }
    });

    // Carga inicial do servidor / cache
    fetchAllData();

    return () => {
      unsubCondos();
      unsubAgents();
      unsubVehicles();
      unsubAssets();
      unsubMaintenances();
      unsubLogs();
      unsubCoverages();
    };
  }, [isAuthenticated]);

  // 2. Atualiza estatísticas consolidadas sempre que os dados mudam
  useEffect(() => {
    const updatedStats: DashboardStats = {
      totalCondos: condominiums.length,
      totalAgents: agents.length,
      agentsOnDuty: agents.filter((a) => a.status === 'em_servico').length,
      totalPatrolVehicles: patrolVehicles.length,
      activePatrolVehicles: patrolVehicles.filter((v) => v.status === 'em_ronda' || v.status === 'disponivel').length,
      totalAssets: companyAssets.reduce((acc, a) => acc + (a.quantity || 1), 0),
      pendingMaintenances: maintenances.filter((m) => m.status !== 'concluida').length,
      completedMaintenances: maintenances.filter((m) => m.status === 'concluida').length,
      todayLogs: operationalLogs.length,
    };
    setStats(updatedStats);
  }, [condominiums.length, agents, patrolVehicles, companyAssets, maintenances, operationalLogs]);

  // --- HANDLERS: AGENTES (FIRESTORE) ---
  const handleAddAgent = async (agentData: Omit<SecurityAgent, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const newId = Date.now();
      const newAgent: SecurityAgent = {
        ...agentData,
        id: newId,
        createdAt: new Date().toISOString(),
      };

      // 1. Gravação no Firebase Firestore para sincronização multi-dispositivos
      await saveToFirestore(COLLECTIONS.AGENTS, newAgent.id, newAgent);

      // 2. Atualização otimista no estado local
      const updated = [newAgent, ...agents.filter((a) => a.id !== newAgent.id)];
      setAgents(updated);
      localStorage.setItem('novabrasil_agents', JSON.stringify(updated));

      // 3. Fallback/Sync backend em background
      try {
        const headers = await getAuthHeaders();
        fetch('/api/agents', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(newAgent),
        }).catch(() => {});
      } catch {}

      // Se foi solicitado gerar acesso ao sistema, adiciona automaticamente na Gestão de Usuários e no Firestore
      const dataWithAccess = agentData as any;
      if (dataWithAccess.createAccess && dataWithAccess.accessEmail && dataWithAccess.accessPassword) {
        const cleanEmail = dataWithAccess.accessEmail.trim().toLowerCase();
        const cleanPassword = dataWithAccess.accessPassword.trim();
        const assignedIds = Array.isArray(agentData.condoIds) && agentData.condoIds.length > 0
          ? agentData.condoIds
          : (agentData.condoId ? [agentData.condoId] : []);
        const assignedNames = agentData.condoNames || (agentData.condoName ? [agentData.condoName] : []);
        const selectedCondo = condominiums.find((c) => c.id === Number(agentData.condoId));

        const newUserObj = {
          id: Date.now() + 1,
          uid: `usr-agent-${Date.now()}`,
          name: agentData.name,
          email: cleanEmail,
          password: cleanPassword,
          role: 'portaria',
          permissions: JSON.stringify(['portaria', 'ronda', 'materiais', 'ocorrencias']),
          condoId: agentData.condoId ? Number(agentData.condoId) : null,
          condoIds: assignedIds,
          condoName: selectedCondo?.name || agentData.condoName || null,
          condoNames: assignedNames,
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        // Salva usuário no Firestore
        await saveToFirestore(COLLECTIONS.USERS, newUserObj.id, newUserObj);

        try {
          const savedUsers = localStorage.getItem('novabrasil_users_list');
          const usersList = savedUsers ? JSON.parse(savedUsers) : [];
          const filtered = usersList.filter((u: any) => u.email.toLowerCase() !== cleanEmail);
          localStorage.setItem('novabrasil_users_list', JSON.stringify([newUserObj, ...filtered]));
        } catch {}

        try {
          const headers = await getAuthHeaders();
          fetch('/api/users', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: agentData.name,
              email: cleanEmail,
              password: cleanPassword,
              role: 'portaria',
              permissions: ['portaria', 'ronda', 'materiais', 'ocorrencias'],
              condoId: agentData.condoId ? Number(agentData.condoId) : null,
              condoIds: assignedIds,
            }),
          }).catch(() => {});
        } catch {}
      }

      return true;
    } catch (err) {
      console.warn('Erro ao salvar agente:', err);
      return false;
    }
  };

  const handleUpdateAgent = async (id: number, patch: Partial<SecurityAgent>): Promise<boolean> => {
    try {
      // 1. Atualiza no Firestore
      await updateInFirestore(COLLECTIONS.AGENTS, id, patch);

      // 2. Atualiza estado local
      const updated = agents.map((a) => (a.id === id ? { ...a, ...patch } : a));
      setAgents(updated);
      localStorage.setItem('novabrasil_agents', JSON.stringify(updated));

      // 3. Sync API backend
      try {
        const headers = await getAuthHeaders();
        fetch(`/api/agents/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(() => {});
      } catch {}

      // Se na edição foi solicitado gerar acesso que não existia
      const patchWithAccess = patch as any;
      if (patchWithAccess.createAccess && patchWithAccess.accessEmail && patchWithAccess.accessPassword) {
        const cleanEmail = patchWithAccess.accessEmail.trim().toLowerCase();
        const cleanPassword = patchWithAccess.accessPassword.trim();
        const agentObj = agents.find((a) => a.id === id);
        const agentName = patch.name || agentObj?.name || 'Agente de Portaria';
        const condoIdVal = patch.condoId !== undefined ? patch.condoId : agentObj?.condoId;
        const selectedCondo = condominiums.find((c) => c.id === Number(condoIdVal));

        const newUserObj = {
          id: Date.now() + 1,
          uid: `usr-agent-${Date.now()}`,
          name: agentName,
          email: cleanEmail,
          password: cleanPassword,
          role: 'portaria',
          permissions: JSON.stringify(['portaria', 'ronda', 'materiais', 'ocorrencias']),
          condoId: condoIdVal ? Number(condoIdVal) : null,
          condoName: selectedCondo?.name || null,
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        await saveToFirestore(COLLECTIONS.USERS, newUserObj.id, newUserObj);

        try {
          const savedUsers = localStorage.getItem('novabrasil_users_list');
          const usersList = savedUsers ? JSON.parse(savedUsers) : [];
          const filtered = usersList.filter((u: any) => u.email.toLowerCase() !== cleanEmail);
          localStorage.setItem('novabrasil_users_list', JSON.stringify([newUserObj, ...filtered]));
        } catch {}

        try {
          const headers = await getAuthHeaders();
          fetch('/api/users', {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: agentName,
              email: cleanEmail,
              password: cleanPassword,
              role: 'portaria',
              permissions: ['portaria', 'ronda', 'materiais', 'ocorrencias'],
              condoId: condoIdVal ? Number(condoIdVal) : null,
            }),
          }).catch(() => {});
        } catch {}
      }

      return true;
    } catch (err) {
      console.warn('Erro ao atualizar agente:', err);
      return false;
    }
  };

  const handleDeleteAgent = async (id: number): Promise<boolean> => {
    try {
      // 1. Remove do Firestore
      await deleteFromFirestore(COLLECTIONS.AGENTS, id);

      // 2. Atualiza estado local
      const updated = agents.filter((a) => a.id !== id);
      setAgents(updated);
      localStorage.setItem('novabrasil_agents', JSON.stringify(updated));

      // 3. Sync API backend
      try {
        const headers = await getAuthHeaders();
        fetch(`/api/agents/${id}`, { method: 'DELETE', headers }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao excluir agente:', err);
      return false;
    }
  };

  // --- HANDLERS: VEÍCULOS DE RONDA (FIRESTORE) ---
  const handleAddPatrolVehicle = async (vehData: Omit<PatrolVehicle, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const newVeh: PatrolVehicle = {
        ...vehData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      // Gravação no Firestore
      await saveToFirestore(COLLECTIONS.VEHICLES, newVeh.id, newVeh);

      const updated = [newVeh, ...patrolVehicles.filter((v) => v.id !== newVeh.id)];
      setPatrolVehicles(updated);
      localStorage.setItem('novabrasil_patrol_vehicles', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch('/api/patrol-vehicles', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(newVeh),
        }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao adicionar veículo:', err);
      return false;
    }
  };

  const handleUpdatePatrolVehicle = async (id: number, patch: Partial<PatrolVehicle>): Promise<boolean> => {
    try {
      await updateInFirestore(COLLECTIONS.VEHICLES, id, patch);

      const updated = patrolVehicles.map((v) => (v.id === id ? { ...v, ...patch } : v));
      setPatrolVehicles(updated);
      localStorage.setItem('novabrasil_patrol_vehicles', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/patrol-vehicles/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao atualizar veículo:', err);
      return false;
    }
  };

  const handleDeletePatrolVehicle = async (id: number): Promise<boolean> => {
    try {
      await deleteFromFirestore(COLLECTIONS.VEHICLES, id);

      const updated = patrolVehicles.filter((v) => v.id !== id);
      setPatrolVehicles(updated);
      localStorage.setItem('novabrasil_patrol_vehicles', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/patrol-vehicles/${id}`, { method: 'DELETE', headers }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao excluir veículo:', err);
      return false;
    }
  };

  // --- HANDLERS: MATERIAIS / PATRIMÔNIO (FIRESTORE) ---
  const handleAddAsset = async (assetData: Omit<CompanyAsset, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const newAsset: CompanyAsset = {
        ...assetData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      await saveToFirestore(COLLECTIONS.ASSETS, newAsset.id, newAsset);

      const updated = [newAsset, ...companyAssets.filter((a) => a.id !== newAsset.id)];
      setCompanyAssets(updated);
      localStorage.setItem('novabrasil_company_assets', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch('/api/company-assets', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(newAsset),
        }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao adicionar material:', err);
      return false;
    }
  };

  const handleUpdateAsset = async (id: number, patch: Partial<CompanyAsset>): Promise<boolean> => {
    try {
      await updateInFirestore(COLLECTIONS.ASSETS, id, patch);

      const updated = companyAssets.map((a) => (a.id === id ? { ...a, ...patch } : a));
      setCompanyAssets(updated);
      localStorage.setItem('novabrasil_company_assets', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/company-assets/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao atualizar material:', err);
      return false;
    }
  };

  const handleDeleteAsset = async (id: number): Promise<boolean> => {
    try {
      await deleteFromFirestore(COLLECTIONS.ASSETS, id);

      const updated = companyAssets.filter((a) => a.id !== id);
      setCompanyAssets(updated);
      localStorage.setItem('novabrasil_company_assets', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/company-assets/${id}`, { method: 'DELETE', headers }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao excluir material:', err);
      return false;
    }
  };

  // --- HANDLERS: MANUTENÇÕES (FIRESTORE) ---
  const handleAddMaintenance = async (maintData: Omit<MaintenanceOrder, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const newMaint: MaintenanceOrder = {
        ...maintData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      await saveToFirestore(COLLECTIONS.MAINTENANCES, newMaint.id, newMaint);

      const updated = [newMaint, ...maintenances.filter((m) => m.id !== newMaint.id)];
      setMaintenances(updated);
      localStorage.setItem('novabrasil_maintenances', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch('/api/maintenances', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(newMaint),
        }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao adicionar manutenção:', err);
      return false;
    }
  };

  const handleUpdateMaintenance = async (id: number, patch: Partial<MaintenanceOrder>): Promise<boolean> => {
    try {
      await updateInFirestore(COLLECTIONS.MAINTENANCES, id, patch);

      const updated = maintenances.map((m) => (m.id === id ? { ...m, ...patch } : m));
      setMaintenances(updated);
      localStorage.setItem('novabrasil_maintenances', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/maintenances/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao atualizar manutenção:', err);
      return false;
    }
  };

  const handleDeleteMaintenance = async (id: number): Promise<boolean> => {
    try {
      await deleteFromFirestore(COLLECTIONS.MAINTENANCES, id);

      const updated = maintenances.filter((m) => m.id !== id);
      setMaintenances(updated);
      localStorage.setItem('novabrasil_maintenances', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/maintenances/${id}`, { method: 'DELETE', headers }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao excluir manutenção:', err);
      return false;
    }
  };

  // --- HANDLERS: LIVRO DE OCORRÊNCIAS (FIRESTORE) ---
  const handleAddLog = async (logData: Omit<OperationalLog, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const newLog: OperationalLog = {
        ...logData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      await saveToFirestore(COLLECTIONS.LOGS, newLog.id, newLog);

      const updated = [newLog, ...operationalLogs.filter((l) => l.id !== newLog.id)];
      setOperationalLogs(updated);
      localStorage.setItem('novabrasil_operational_logs', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch('/api/operational-logs', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(newLog),
        }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao registrar ocorrência:', err);
      return false;
    }
  };

  const handleUpdateLog = async (id: number, patch: Partial<OperationalLog>): Promise<boolean> => {
    try {
      await updateInFirestore(COLLECTIONS.LOGS, id, patch);

      const updated = operationalLogs.map((l) => (l.id === id ? { ...l, ...patch } : l));
      setOperationalLogs(updated);
      localStorage.setItem('novabrasil_operational_logs', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/operational-logs/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao atualizar ocorrência:', err);
      return false;
    }
  };

  const handleDeleteLog = async (id: number): Promise<boolean> => {
    try {
      await deleteFromFirestore(COLLECTIONS.LOGS, id);

      const updated = operationalLogs.filter((l) => l.id !== id);
      setOperationalLogs(updated);
      localStorage.setItem('novabrasil_operational_logs', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/operational-logs/${id}`, { method: 'DELETE', headers }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao excluir ocorrência:', err);
      return false;
    }
  };

  // --- HANDLERS: ESCALA 12x36 & COBERTURAS (FIRESTORE) ---
  const handleAddCoverage = async (coverageData: Omit<ShiftCoverage, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const newCov: ShiftCoverage = {
        ...coverageData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      await saveToFirestore(COLLECTIONS.COVERAGES, newCov.id, newCov);

      const updated = [newCov, ...coverages.filter((c) => c.id !== newCov.id)];
      setCoverages(updated);
      localStorage.setItem('novabrasil_shift_coverages', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch('/api/shift-coverages', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(newCov),
        }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao salvar escala:', err);
      return false;
    }
  };

  const handleUpdateCoverage = async (id: number, patch: Partial<ShiftCoverage>): Promise<boolean> => {
    try {
      await updateInFirestore(COLLECTIONS.COVERAGES, id, patch);

      const updated = coverages.map((c) => (c.id === id ? { ...c, ...patch } : c));
      setCoverages(updated);
      localStorage.setItem('novabrasil_shift_coverages', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/shift-coverages/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao atualizar escala:', err);
      return false;
    }
  };

  const handleDeleteCoverage = async (id: number): Promise<boolean> => {
    try {
      await deleteFromFirestore(COLLECTIONS.COVERAGES, id);

      const updated = coverages.filter((c) => c.id !== id);
      setCoverages(updated);
      localStorage.setItem('novabrasil_shift_coverages', JSON.stringify(updated));

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/shift-coverages/${id}`, { method: 'DELETE', headers }).catch(() => {});
      } catch {}

      return true;
    } catch (err) {
      console.warn('Erro ao excluir escala:', err);
      return false;
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-2" />
          <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">Conectando ao sistema NOVA BRASIL...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  // Identifica se há passagens de serviço pendentes onde o usuário conectado é o agente entrante designado
  const pendingHandoversForMe = operationalLogs.filter((log) => {
    if (log.logType !== 'passagem_turno' || log.incomingAgentAccepted) return false;
    if (!user?.name) return false;
    const uName = user.name.trim().toLowerCase();
    const designated = log.designatedIncomingAgentName?.trim().toLowerCase();
    return Boolean(designated && (designated === uName || uName.includes(designated) || designated.includes(uName)));
  });

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        condominiums={condominiums}
        selectedCondoId={selectedCondoId}
        onSelectCondo={setSelectedCondoId}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        pendingHandoverCount={pendingHandoversForMe.length}
      />

      {/* Aviso Global Flutuante de Passagem de Serviço Designada para o Agente Entrante */}
      {pendingHandoversForMe.length > 0 && activeTab !== 'ocorrencias' && (
        <div className="bg-amber-500 dark:bg-amber-600 text-white px-3 sm:px-6 py-2.5 shadow-md flex items-center justify-between gap-3 text-xs border-b border-amber-600 dark:border-amber-700 animate-in fade-in sticky top-[57px] z-30">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="p-1 rounded-full bg-white/20 shrink-0">
              <Bell className="w-4 h-4 text-white animate-bounce" />
            </span>
            <div className="truncate">
              <strong className="font-extrabold mr-1.5 uppercase text-[10px] tracking-wider bg-white/25 px-2 py-0.5 rounded-full">
                Passagem de Serviço
              </strong>
              <span className="truncate">
                O agente <strong>{pendingHandoversForMe[0].agentName}</strong> designou você para receber o serviço no <strong>{pendingHandoversForMe[0].condoName || 'Posto'}</strong> ({pendingHandoversForMe[0].logTime}).
              </span>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('ocorrencias')}
            className="px-3.5 py-1.5 bg-white text-amber-950 font-extrabold rounded-xl hover:bg-amber-50 transition-transform hover:scale-105 shrink-0 cursor-pointer shadow-xs"
          >
            Receber Serviço Agora
          </button>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          pendingHandoverCount={pendingHandoversForMe.length}
        />

        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 pb-24 md:pb-8 max-w-7xl mx-auto w-full transition-colors">
          {activeTab === 'dashboard' && (
            <DashboardView
              stats={stats}
              condominiums={condominiums}
              agents={agents}
              patrolVehicles={patrolVehicles}
              companyAssets={companyAssets}
              maintenances={maintenances}
              operationalLogs={operationalLogs}
              selectedCondoId={selectedCondoId}
              onNavigate={setActiveTab}
              onRefresh={fetchAllData}
            />
          )}

          {activeTab === 'condominios' && (
            <CondominiumsView
              condominiums={condominiums}
              agents={agents}
              selectedCondoId={selectedCondoId}
              onSelectCondo={setSelectedCondoId}
              onRefresh={fetchAllData}
              onNavigateToTab={setActiveTab}
              getAuthHeaders={getAuthHeaders}
            />
          )}

          {activeTab === 'agentes' && (
            <AgentsView
              agents={agents}
              condominiums={condominiums}
              selectedCondoId={selectedCondoId}
              onSelectCondo={setSelectedCondoId}
              onAddAgent={handleAddAgent}
              onUpdateAgent={handleUpdateAgent}
              onDeleteAgent={handleDeleteAgent}
            />
          )}

          {activeTab === 'escalas' && (
            <ShiftScaleView
              coverages={coverages}
              condominiums={condominiums}
              agents={agents}
              selectedCondoId={selectedCondoId}
              onSelectCondo={setSelectedCondoId}
              onAddCoverage={handleAddCoverage}
              onUpdateCoverage={handleUpdateCoverage}
              onDeleteCoverage={handleDeleteCoverage}
            />
          )}

          {activeTab === 'ronda' && (
            <PatrolVehiclesView
              vehicles={patrolVehicles}
              condominiums={condominiums}
              selectedCondoId={selectedCondoId}
              onAddVehicle={handleAddPatrolVehicle}
              onUpdateVehicle={handleUpdatePatrolVehicle}
              onDeleteVehicle={handleDeletePatrolVehicle}
            />
          )}

          {activeTab === 'patrimonio' && (
            <CompanyAssetsView
              assets={companyAssets}
              condominiums={condominiums}
              selectedCondoId={selectedCondoId}
              onAddAsset={handleAddAsset}
              onUpdateAsset={handleUpdateAsset}
              onDeleteAsset={handleDeleteAsset}
            />
          )}

          {activeTab === 'manutencoes' && (
            <MaintenancesView
              maintenances={maintenances}
              condominiums={condominiums}
              selectedCondoId={selectedCondoId}
              onAddMaintenance={handleAddMaintenance}
              onUpdateMaintenance={handleUpdateMaintenance}
              onDeleteMaintenance={handleDeleteMaintenance}
            />
          )}

          {activeTab === 'ocorrencias' && (
            <OperationalLogsView
              logs={operationalLogs}
              condominiums={condominiums}
              agents={agents}
              selectedCondoId={selectedCondoId}
              onAddLog={handleAddLog}
              onUpdateLog={handleUpdateLog}
              onDeleteLog={handleDeleteLog}
            />
          )}

          {activeTab === 'relatorios' && (
            <ReportsView
              condominiums={condominiums}
              logs={operationalLogs}
              maintenances={maintenances}
              coverages={coverages}
              assets={companyAssets}
              vehicles={patrolVehicles}
              agents={agents}
              selectedCondoId={selectedCondoId}
              onSelectCondo={setSelectedCondoId}
              onNavigateToTab={setActiveTab}
            />
          )}

          {activeTab === 'usuarios' && (
            <UsersManagementView
              condominiums={condominiums}
              agents={agents}
              selectedCondoId={selectedCondoId}
              onRefresh={fetchAllData}
            />
          )}
        </main>
      </div>

      {/* Navegação Inferior para Telas Mobile */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
      />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NovaBrasilMain />
      </AuthProvider>
    </ThemeProvider>
  );
}
