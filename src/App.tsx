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
  getFirestoreCollection,
  saveToFirestore,
  updateInFirestore,
  deleteFromFirestore,
  seedIfEmpty,
} from './services/firestoreSync.ts';

const notifySync = (entity?: string) => {
  try {
    const bc = new BroadcastChannel('novabrasil_sync');
    bc.postMessage({ type: 'SYNC_UPDATE', entity, timestamp: Date.now() });
    bc.close();
  } catch {}
};

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
      // 1. Carrega dados diretamente da nuvem compartilhada do Firestore (nova-brasil-ac663)
      const [
        fsCondos,
        fsAgents,
        fsVehicles,
        fsAssets,
        fsMaintenances,
        fsLogs,
        fsCoverages,
      ] = await Promise.all([
        getFirestoreCollection<Condominium>(COLLECTIONS.CONDOMINIUMS),
        getFirestoreCollection<SecurityAgent>(COLLECTIONS.AGENTS),
        getFirestoreCollection<PatrolVehicle>(COLLECTIONS.VEHICLES),
        getFirestoreCollection<CompanyAsset>(COLLECTIONS.ASSETS),
        getFirestoreCollection<MaintenanceOrder>(COLLECTIONS.MAINTENANCES),
        getFirestoreCollection<OperationalLog>(COLLECTIONS.LOGS),
        getFirestoreCollection<ShiftCoverage>(COLLECTIONS.COVERAGES),
      ]);

      let loadedCondos: Condominium[] = fsCondos || [];

      // Se houver algum condomínio no navegador local que ainda não existe no Firestore, sincroniza para a nuvem
      const saved = localStorage.getItem('novabrasil_condos');
      if (saved) {
        try {
          const localCondos: Condominium[] = JSON.parse(saved);
          const existingIds = new Set(loadedCondos.map((c) => String(c.id)));
          for (const c of localCondos) {
            if (!existingIds.has(String(c.id))) {
              await saveToFirestore(COLLECTIONS.CONDOMINIUMS, c.id, c);
              loadedCondos.push(c);
            }
          }
        } catch {}
      }

      // Sincronizar dinamicamente as contagens de agentes, rondas, materiais e O.S. nos condomínios
      const condosWithCounts = loadedCondos.map((c) => ({
        ...c,
        imageUrl: c.imageUrl || c.photoUrl || 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=600&q=80',
        agentsCount: fsAgents.filter((a) => Number(a.condoId) === Number(c.id) || (Array.isArray(a.condoIds) && a.condoIds.includes(Number(c.id)))).length,
        vehiclesCount: fsVehicles.filter((v) => Number(v.condoId) === Number(c.id)).length,
        assetsCount: fsAssets.filter((a) => Number(a.condoId) === Number(c.id)).reduce((acc, a) => acc + (a.quantity || 1), 0),
        maintenancesCount: fsMaintenances.filter((m) => Number(m.condoId) === Number(c.id) && m.status !== 'concluida').length,
      }));

      setCondominiums(condosWithCounts);
      localStorage.setItem('novabrasil_condos', JSON.stringify(condosWithCounts));

      setAgents(fsAgents);
      localStorage.setItem('novabrasil_agents', JSON.stringify(fsAgents));

      setPatrolVehicles(fsVehicles);
      localStorage.setItem('novabrasil_patrol_vehicles', JSON.stringify(fsVehicles));

      setCompanyAssets(fsAssets);
      localStorage.setItem('novabrasil_company_assets', JSON.stringify(fsAssets));

      setMaintenances(fsMaintenances);
      localStorage.setItem('novabrasil_maintenances', JSON.stringify(fsMaintenances));

      setOperationalLogs(fsLogs);
      localStorage.setItem('novabrasil_operational_logs', JSON.stringify(fsLogs));

      setCoverages(fsCoverages);
      localStorage.setItem('novabrasil_shift_coverages', JSON.stringify(fsCoverages));

      setStats({
        totalCondos: condosWithCounts.length,
        totalAgents: fsAgents.length,
        agentsOnDuty: fsAgents.filter((a) => a.status === 'em_servico').length,
        totalPatrolVehicles: fsVehicles.length,
        activePatrolVehicles: fsVehicles.filter((v) => v.status === 'em_ronda' || v.status === 'disponivel').length,
        totalAssets: fsAssets.reduce((acc, a) => acc + (a.quantity || 1), 0),
        pendingMaintenances: fsMaintenances.filter((m) => m.status !== 'concluida').length,
        completedMaintenances: fsMaintenances.filter((m) => m.status === 'concluida').length,
        todayLogs: fsLogs.length,
      });
    } catch (error) {
      console.warn('Erro ao carregar dados do Firestore:', error);
    } finally {
      setLoading(false);
    }
  };

  // 1. Sincronização multi-dispositivo em tempo real via Firestore (projeto nova-brasil-ac663)
  useEffect(() => {
    if (!isAuthenticated) return;

    // Carga inicial
    fetchAllData();

    // Sincronização em tempo real via Firestore (Zero Latência entre celulares, PCs e Vercel)
    const unsubCondos = subscribeToFirestoreCollection<Condominium>(COLLECTIONS.CONDOMINIUMS, (items) => {
      if (items) {
        setCondominiums(items);
        localStorage.setItem('novabrasil_condos', JSON.stringify(items));
      }
    });

    const unsubAgents = subscribeToFirestoreCollection<SecurityAgent>(COLLECTIONS.AGENTS, (items) => {
      if (items) {
        setAgents(items);
        localStorage.setItem('novabrasil_agents', JSON.stringify(items));
      }
    });

    const unsubVehicles = subscribeToFirestoreCollection<PatrolVehicle>(COLLECTIONS.VEHICLES, (items) => {
      if (items) {
        setPatrolVehicles(items);
        localStorage.setItem('novabrasil_patrol_vehicles', JSON.stringify(items));
      }
    });

    const unsubAssets = subscribeToFirestoreCollection<CompanyAsset>(COLLECTIONS.ASSETS, (items) => {
      if (items) {
        setCompanyAssets(items);
        localStorage.setItem('novabrasil_company_assets', JSON.stringify(items));
      }
    });

    const unsubMaintenances = subscribeToFirestoreCollection<MaintenanceOrder>(COLLECTIONS.MAINTENANCES, (items) => {
      if (items) {
        setMaintenances(items);
        localStorage.setItem('novabrasil_maintenances', JSON.stringify(items));
      }
    });

    const unsubLogs = subscribeToFirestoreCollection<OperationalLog>(COLLECTIONS.LOGS, (items) => {
      if (items) {
        setOperationalLogs(items);
        localStorage.setItem('novabrasil_operational_logs', JSON.stringify(items));
      }
    });

    const unsubCoverages = subscribeToFirestoreCollection<ShiftCoverage>(COLLECTIONS.COVERAGES, (items) => {
      if (items) {
        setCoverages(items);
        localStorage.setItem('novabrasil_shift_coverages', JSON.stringify(items));
      }
    });

    // Sincronização instantânea no mesmo dispositivo (outras abas)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel('novabrasil_sync');
      bc.onmessage = () => {
        fetchAllData();
      };
    } catch {}

    // Atualização imediata ao reabrir a janela ou retornar ao navegador no celular
    const handleFocus = () => {
      fetchAllData();
    };
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      unsubCondos();
      unsubAgents();
      unsubVehicles();
      unsubAssets();
      unsubMaintenances();
      unsubLogs();
      unsubCoverages();
      if (bc) bc.close();
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [isAuthenticated, selectedCondoId]);

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

  // --- HANDLERS: AGENTES (FIRESTORE CLOUD & LOCAL) ---
  const handleAddAgent = async (agentData: Omit<SecurityAgent, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const newId = Date.now();
      const newAgent: SecurityAgent = {
        ...agentData,
        id: newId,
        createdAt: new Date().toISOString(),
      };

      // 1. Grava no Firestore (nova-brasil-ac663)
      try {
        await saveToFirestore(COLLECTIONS.AGENTS, newAgent.id, newAgent);
      } catch (fErr) {
        console.warn('Aviso ao sincronizar agente no Firestore:', fErr);
      }

      // 2. Atualiza estado local
      const updated = [newAgent, ...agents.filter((a) => a.id !== newAgent.id)];
      setAgents(updated);
      localStorage.setItem('novabrasil_agents', JSON.stringify(updated));
      notifySync('agents');

      // 3. Sync API em background se backend existir
      try {
        const headers = await getAuthHeaders();
        fetch('/api/agents', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(newAgent),
        }).catch(() => {});
      } catch {}

      // Se solicitado criar acesso
      const dataWithAccess = agentData as any;
      if (dataWithAccess.createAccess && dataWithAccess.accessEmail && dataWithAccess.accessPassword) {
        const cleanEmail = dataWithAccess.accessEmail.trim().toLowerCase();
        const cleanPassword = dataWithAccess.accessPassword.trim();
        const assignedIds = Array.isArray(agentData.condoIds) && agentData.condoIds.length > 0
          ? agentData.condoIds
          : (agentData.condoId ? [agentData.condoId] : []);
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
          condoNames: agentData.condoNames || (agentData.condoName ? [agentData.condoName] : []),
          isActive: true,
          createdAt: new Date().toISOString(),
        };

        try {
          await saveToFirestore(COLLECTIONS.USERS, newUserObj.id, newUserObj);
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

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao salvar agente:', err);
      return false;
    }
  };

  const handleUpdateAgent = async (id: number, patch: Partial<SecurityAgent>): Promise<boolean> => {
    try {
      try {
        await updateInFirestore(COLLECTIONS.AGENTS, id, patch);
      } catch (fErr) {
        console.warn('Aviso ao atualizar agente no Firestore:', fErr);
      }

      const updated = agents.map((a) => (a.id === id ? { ...a, ...patch } : a));
      setAgents(updated);
      localStorage.setItem('novabrasil_agents', JSON.stringify(updated));
      notifySync('agents');

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/agents/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao atualizar agente:', err);
      return false;
    }
  };

  const handleDeleteAgent = async (id: number): Promise<boolean> => {
    try {
      try {
        await deleteFromFirestore(COLLECTIONS.AGENTS, id);
      } catch (fErr) {
        console.warn('Aviso ao remover agente no Firestore:', fErr);
      }

      const updated = agents.filter((a) => a.id !== id);
      setAgents(updated);
      localStorage.setItem('novabrasil_agents', JSON.stringify(updated));
      notifySync('agents');

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/agents/${id}`, { method: 'DELETE', headers }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao excluir agente:', err);
      return false;
    }
  };

  // --- HANDLERS: VEÍCULOS DE RONDA ---
  const handleAddPatrolVehicle = async (vehData: Omit<PatrolVehicle, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const newVeh: PatrolVehicle = {
        ...vehData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      try {
        await saveToFirestore(COLLECTIONS.VEHICLES, newVeh.id, newVeh);
      } catch {}

      const updated = [newVeh, ...patrolVehicles.filter((v) => v.id !== newVeh.id)];
      setPatrolVehicles(updated);
      localStorage.setItem('novabrasil_patrol_vehicles', JSON.stringify(updated));
      notifySync('vehicles');

      try {
        const headers = await getAuthHeaders();
        fetch('/api/patrol-vehicles', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(newVeh),
        }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao adicionar veículo:', err);
      return false;
    }
  };

  const handleUpdatePatrolVehicle = async (id: number, patch: Partial<PatrolVehicle>): Promise<boolean> => {
    try {
      try {
        await updateInFirestore(COLLECTIONS.VEHICLES, id, patch);
      } catch {}

      const updated = patrolVehicles.map((v) => (v.id === id ? { ...v, ...patch } : v));
      setPatrolVehicles(updated);
      localStorage.setItem('novabrasil_patrol_vehicles', JSON.stringify(updated));
      notifySync('vehicles');

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/patrol-vehicles/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao atualizar veículo:', err);
      return false;
    }
  };

  const handleDeletePatrolVehicle = async (id: number): Promise<boolean> => {
    try {
      try {
        await deleteFromFirestore(COLLECTIONS.VEHICLES, id);
      } catch {}

      const updated = patrolVehicles.filter((v) => v.id !== id);
      setPatrolVehicles(updated);
      localStorage.setItem('novabrasil_patrol_vehicles', JSON.stringify(updated));
      notifySync('vehicles');

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/patrol-vehicles/${id}`, { method: 'DELETE', headers }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao excluir veículo:', err);
      return false;
    }
  };

  // --- HANDLERS: MATERIAIS / PATRIMÔNIO ---
  const handleAddAsset = async (assetData: Omit<CompanyAsset, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const newAsset: CompanyAsset = {
        ...assetData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      try {
        await saveToFirestore(COLLECTIONS.ASSETS, newAsset.id, newAsset);
      } catch {}

      const updated = [newAsset, ...companyAssets.filter((a) => a.id !== newAsset.id)];
      setCompanyAssets(updated);
      localStorage.setItem('novabrasil_company_assets', JSON.stringify(updated));
      notifySync('assets');

      try {
        const headers = await getAuthHeaders();
        fetch('/api/company-assets', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(newAsset),
        }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao adicionar material:', err);
      return false;
    }
  };

  const handleUpdateAsset = async (id: number, patch: Partial<CompanyAsset>): Promise<boolean> => {
    try {
      try {
        await updateInFirestore(COLLECTIONS.ASSETS, id, patch);
      } catch {}

      const updated = companyAssets.map((a) => (a.id === id ? { ...a, ...patch } : a));
      setCompanyAssets(updated);
      localStorage.setItem('novabrasil_company_assets', JSON.stringify(updated));
      notifySync('assets');

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/company-assets/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao atualizar material:', err);
      return false;
    }
  };

  const handleDeleteAsset = async (id: number): Promise<boolean> => {
    try {
      try {
        await deleteFromFirestore(COLLECTIONS.ASSETS, id);
      } catch {}

      const updated = companyAssets.filter((a) => a.id !== id);
      setCompanyAssets(updated);
      localStorage.setItem('novabrasil_company_assets', JSON.stringify(updated));
      notifySync('assets');

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/company-assets/${id}`, { method: 'DELETE', headers }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao excluir material:', err);
      return false;
    }
  };

  // --- HANDLERS: MANUTENÇÕES ---
  const handleAddMaintenance = async (maintData: Omit<MaintenanceOrder, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const newMaint: MaintenanceOrder = {
        ...maintData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      try {
        await saveToFirestore(COLLECTIONS.MAINTENANCES, newMaint.id, newMaint);
      } catch {}

      const updated = [newMaint, ...maintenances.filter((m) => m.id !== newMaint.id)];
      setMaintenances(updated);
      localStorage.setItem('novabrasil_maintenances', JSON.stringify(updated));
      notifySync('maintenances');

      try {
        const headers = await getAuthHeaders();
        fetch('/api/maintenances', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(newMaint),
        }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao adicionar manutenção:', err);
      return false;
    }
  };

  const handleUpdateMaintenance = async (id: number, patch: Partial<MaintenanceOrder>): Promise<boolean> => {
    try {
      try {
        await updateInFirestore(COLLECTIONS.MAINTENANCES, id, patch);
      } catch {}

      const updated = maintenances.map((m) => (m.id === id ? { ...m, ...patch } : m));
      setMaintenances(updated);
      localStorage.setItem('novabrasil_maintenances', JSON.stringify(updated));
      notifySync('maintenances');

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/maintenances/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao atualizar manutenção:', err);
      return false;
    }
  };

  const handleDeleteMaintenance = async (id: number): Promise<boolean> => {
    try {
      try {
        await deleteFromFirestore(COLLECTIONS.MAINTENANCES, id);
      } catch {}

      const updated = maintenances.filter((m) => m.id !== id);
      setMaintenances(updated);
      localStorage.setItem('novabrasil_maintenances', JSON.stringify(updated));
      notifySync('maintenances');

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/maintenances/${id}`, { method: 'DELETE', headers }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao excluir manutenção:', err);
      return false;
    }
  };

  // --- HANDLERS: LIVRO DE OCORRÊNCIAS ---
  const handleAddLog = async (logData: Omit<OperationalLog, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const newLog: OperationalLog = {
        ...logData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      try {
        await saveToFirestore(COLLECTIONS.LOGS, newLog.id, newLog);
      } catch {}

      const updated = [newLog, ...operationalLogs.filter((l) => l.id !== newLog.id)];
      setOperationalLogs(updated);
      localStorage.setItem('novabrasil_operational_logs', JSON.stringify(updated));
      notifySync('logs');

      try {
        const headers = await getAuthHeaders();
        fetch('/api/operational-logs', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(logData),
        }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao registrar ocorrência:', err);
      return false;
    }
  };

  const handleUpdateLog = async (id: number, patch: Partial<OperationalLog>): Promise<boolean> => {
    try {
      try {
        await updateInFirestore(COLLECTIONS.LOGS, id, patch);
      } catch {}

      const updated = operationalLogs.map((l) => (l.id === id ? { ...l, ...patch } : l));
      setOperationalLogs(updated);
      localStorage.setItem('novabrasil_operational_logs', JSON.stringify(updated));
      notifySync('logs');

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/operational-logs/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao atualizar ocorrência:', err);
      return false;
    }
  };

  const handleDeleteLog = async (id: number): Promise<boolean> => {
    try {
      try {
        await deleteFromFirestore(COLLECTIONS.LOGS, id);
      } catch {}

      const updated = operationalLogs.filter((l) => l.id !== id);
      setOperationalLogs(updated);
      localStorage.setItem('novabrasil_operational_logs', JSON.stringify(updated));
      notifySync('logs');

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/operational-logs/${id}`, { method: 'DELETE', headers }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao excluir ocorrência:', err);
      return false;
    }
  };

  // --- HANDLERS: ESCALA 12x36 & COBERTURAS ---
  const handleAddCoverage = async (coverageData: Omit<ShiftCoverage, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const newCov: ShiftCoverage = {
        ...coverageData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      try {
        await saveToFirestore(COLLECTIONS.COVERAGES, newCov.id, newCov);
      } catch {}

      const updated = [newCov, ...coverages.filter((c) => c.id !== newCov.id)];
      setCoverages(updated);
      localStorage.setItem('novabrasil_shift_coverages', JSON.stringify(updated));
      notifySync('coverages');

      try {
        const headers = await getAuthHeaders();
        fetch('/api/shift-coverages', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(newCov),
        }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao salvar escala:', err);
      return false;
    }
  };

  const handleUpdateCoverage = async (id: number, patch: Partial<ShiftCoverage>): Promise<boolean> => {
    try {
      try {
        await updateInFirestore(COLLECTIONS.COVERAGES, id, patch);
      } catch {}

      const updated = coverages.map((c) => (c.id === id ? { ...c, ...patch } : c));
      setCoverages(updated);
      localStorage.setItem('novabrasil_shift_coverages', JSON.stringify(updated));
      notifySync('coverages');

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/shift-coverages/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
      return true;
    } catch (err) {
      console.warn('Erro ao atualizar escala:', err);
      return false;
    }
  };

  const handleDeleteCoverage = async (id: number): Promise<boolean> => {
    try {
      try {
        await deleteFromFirestore(COLLECTIONS.COVERAGES, id);
      } catch {}

      const updated = coverages.filter((c) => c.id !== id);
      setCoverages(updated);
      localStorage.setItem('novabrasil_shift_coverages', JSON.stringify(updated));
      notifySync('coverages');

      try {
        const headers = await getAuthHeaders();
        fetch(`/api/shift-coverages/${id}`, { method: 'DELETE', headers }).catch(() => {});
      } catch {}

      await fetchAllData().catch(() => {});
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
