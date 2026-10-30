import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { MobileBottomNav } from './components/MobileBottomNav.tsx';
import { RoleModal } from './components/RoleModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { CondominiumsView } from './components/CondominiumsView.tsx';
import { AgentsView } from './components/AgentsView.tsx';
import { PatrolVehiclesView } from './components/PatrolVehiclesView.tsx';
import { CompanyAssetsView } from './components/CompanyAssetsView.tsx';
import { MaintenancesView } from './components/MaintenancesView.tsx';
import { OperationalLogsView } from './components/OperationalLogsView.tsx';
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
} from './types/index.ts';
import { Loader2 } from 'lucide-react';

function NovaBrasilMain() {
  const { user, getAuthHeaders, role, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados Multi-Condomínio
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [selectedCondoId, setSelectedCondoId] = useState<number | 'all'>('all');

  // Estados dos Módulos Operacionais da Empresa Terceirizada
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [agents, setAgents] = useState<SecurityAgent[]>([]);
  const [patrolVehicles, setPatrolVehicles] = useState<PatrolVehicle[]>([]);
  const [companyAssets, setCompanyAssets] = useState<CompanyAsset[]>([]);
  const [maintenances, setMaintenances] = useState<MaintenanceOrder[]>([]);
  const [operationalLogs, setOperationalLogs] = useState<OperationalLog[]>([]);

  // Sincronizar condomínio padrão se o usuário for restrito a um condomínio específico
  useEffect(() => {
    const isSuper = role === 'sindico' || role === 'admin';
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
      ] = await Promise.all([
        fetch('/api/condominiums', { headers }),
        fetch(`/api/dashboard/stats${queryParam}`, { headers }),
        fetch('/api/agents', { headers }),
        fetch('/api/patrol-vehicles', { headers }),
        fetch('/api/company-assets', { headers }),
        fetch('/api/maintenances', { headers }),
        fetch('/api/operational-logs', { headers }),
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
        loadedCondos = condosData;
        localStorage.setItem('novabrasil_condos', JSON.stringify(loadedCondos));
      } else {
        const saved = localStorage.getItem('novabrasil_condos');
        loadedCondos = saved ? JSON.parse(saved) : [
          {
            id: 1,
            name: 'Condomínio Residencial Jardins',
            address: 'Av. Paulista, 1000 - Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01310-100',
            cnpj: '12.345.678/0001-90',
            supervisorName: 'Supervisor Roberto Alves',
            supervisorPhone: '(11) 98888-1234',
            contractType: 'Portaria 24h + Ronda Noturna Motorizada',
            sindicoName: 'Administradora Predial Aliança',
            sindicoPhone: '(11) 3250-9000',
            status: 'ativo',
            agentsCount: 4,
            vehiclesCount: 2,
            assetsCount: 8,
            maintenancesCount: 2,
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            name: 'Condomínio Solar das Palmeiras',
            address: 'Rua das Flores, 250 - Moema',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '04500-001',
            cnpj: '98.765.432/0001-10',
            supervisorName: 'Supervisor Marcelo Duarte',
            supervisorPhone: '(11) 97777-5678',
            contractType: 'Portaria Diurna + Ronda Perimetral',
            sindicoName: 'CondoPrime Gestão Imobiliária',
            sindicoPhone: '(11) 3100-4400',
            status: 'ativo',
            agentsCount: 2,
            vehiclesCount: 1,
            assetsCount: 5,
            maintenancesCount: 1,
            createdAt: new Date().toISOString(),
          },
        ];
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
        loadedAgents = saved ? JSON.parse(saved) : [
          {
            id: 1,
            condoId: 1,
            condoName: 'Condomínio Residencial Jardins',
            name: 'Carlos Eduardo da Silva',
            cpf: '123.456.789-00',
            phone: '(11) 98111-2233',
            badgeNumber: 'AG-101',
            roleTitle: 'agente_portaria',
            shift: '12x36_dia',
            status: 'em_servico',
            admissionDate: '10/01/2023',
            notes: 'Operador com curso de CFTV e controle de acesso.',
          },
          {
            id: 2,
            condoId: 1,
            condoName: 'Condomínio Residencial Jardins',
            name: 'Marcos Antônio Ribeiro',
            cpf: '234.567.890-11',
            phone: '(11) 98222-3344',
            badgeNumber: 'AG-102',
            roleTitle: 'agente_portaria',
            shift: '12x36_noite',
            status: 'folga',
            admissionDate: '15/03/2023',
            notes: 'Turno noturno.',
          },
          {
            id: 3,
            condoId: 1,
            condoName: 'Condomínio Residencial Jardins',
            name: 'Lucas Ferreira dos Santos',
            cpf: '345.678.901-22',
            phone: '(11) 98333-4455',
            badgeNumber: 'RD-201',
            roleTitle: 'ronda_motorizada',
            shift: '12x36_noite',
            status: 'em_servico',
            admissionDate: '01/06/2023',
            notes: 'Habilitação A/B e curso de vigilância patrimonial.',
          },
          {
            id: 4,
            condoId: 2,
            condoName: 'Condomínio Solar das Palmeiras',
            name: 'José Roberto de Oliveira',
            cpf: '456.789.012-33',
            phone: '(11) 98444-5566',
            badgeNumber: 'AG-103',
            roleTitle: 'lider_posto',
            shift: '6x1',
            status: 'em_servico',
            admissionDate: '05/02/2022',
            notes: 'Líder de guarita e conferência de materiais.',
          },
        ];
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
        loadedVehicles = saved ? JSON.parse(saved) : [
          {
            id: 1,
            condoId: 1,
            condoName: 'Condomínio Residencial Jardins',
            type: 'moto',
            plate: 'BRA2E19',
            model: 'Honda CG 160 Fan',
            brand: 'Honda',
            color: 'Preto',
            currentKm: 14250,
            driverName: 'Lucas Ferreira (Ronda Noturna)',
            status: 'em_ronda',
            routeDescription: 'Ronda perimetral nos muros externos e checagem de garagens a cada 30min',
            lastPatrolAt: '20:45',
          },
          {
            id: 2,
            condoId: 1,
            condoName: 'Condomínio Residencial Jardins',
            type: 'carro',
            plate: 'ABC-1020',
            model: 'Fiat Mobi Easy 1.0',
            brand: 'Fiat',
            color: 'Branco',
            currentKm: 48900,
            driverName: 'Supervisor Roberto Alves',
            status: 'disponivel',
            routeDescription: 'Viatura de apoio operacional e rondas de perímetro expandido',
            lastPatrolAt: '19:10',
          },
          {
            id: 3,
            condoId: 2,
            condoName: 'Condomínio Solar das Palmeiras',
            type: 'moto',
            plate: 'MER4C22',
            model: 'Yamaha Fazer 150',
            brand: 'Yamaha',
            color: 'Azul',
            currentKm: 9800,
            driverName: 'Rondante Volante',
            status: 'em_ronda',
            routeDescription: 'Perímetro dos portões e garagens dos blocos',
            lastPatrolAt: '21:00',
          },
        ];
      }
      setPatrolVehicles(loadedVehicles);

      // 4. Materiais e Patrimônio da Empresa no Condomínio
      let loadedAssets: CompanyAsset[] = [];
      const assetsData = await parseJsonRes<CompanyAsset[]>(assetsRes);
      if (assetsData && Array.isArray(assetsData)) {
        loadedAssets = assetsData;
        localStorage.setItem('novabrasil_company_assets', JSON.stringify(loadedAssets));
      } else {
        const saved = localStorage.getItem('novabrasil_company_assets');
        loadedAssets = saved ? JSON.parse(saved) : [
          {
            id: 1,
            condoId: 1,
            condoName: 'Condomínio Residencial Jardins',
            name: 'Rádio Comunicador HT Baofeng UV-5R',
            category: 'comunicacao',
            assetTag: 'PAT-1011',
            serialNumber: 'SN-998231',
            quantity: 4,
            condition: 'bom',
            deliveryDate: '15/01/2023',
            responsibleAgent: 'Agente Carlos Silva (Guarita)',
            notes: 'Acompanha 4 bases carregadoras e fones PTT.',
          },
          {
            id: 2,
            condoId: 1,
            condoName: 'Condomínio Residencial Jardins',
            name: 'Bastão de Ronda Vigia Eletrônico Guardus',
            category: 'seguranca_ronda',
            assetTag: 'PAT-1012',
            serialNumber: 'GD-4421',
            quantity: 1,
            condition: 'novo',
            deliveryDate: '01/02/2023',
            responsibleAgent: 'Lucas Ferreira (Ronda)',
            notes: 'Com 12 botões iButton instalados nos pontos de ronda.',
          },
          {
            id: 3,
            condoId: 1,
            condoName: 'Condomínio Residencial Jardins',
            name: 'Kit de Ferramentas de Manutenção (Maleta Completa)',
            category: 'ferramentas',
            assetTag: 'PAT-1013',
            serialNumber: 'KT-7710',
            quantity: 1,
            condition: 'bom',
            deliveryDate: '20/02/2023',
            responsibleAgent: 'Equipe de Manutenção Predial',
            notes: 'Alicates, chaves de fenda/phillips, multímetro e furadeira Bosch.',
          },
          {
            id: 4,
            condoId: 2,
            condoName: 'Condomínio Solar das Palmeiras',
            name: 'Rádio Comunicador HT Motorola Talkabout',
            category: 'comunicacao',
            assetTag: 'PAT-2001',
            serialNumber: 'MT-8812',
            quantity: 2,
            condition: 'bom',
            deliveryDate: '10/03/2023',
            responsibleAgent: 'José Roberto (Líder)',
            notes: 'Baterias revisadas.',
          },
        ];
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
        loadedMaintenances = saved ? JSON.parse(saved) : [
          {
            id: 1,
            condoId: 1,
            condoName: 'Condomínio Residencial Jardins',
            title: 'Substituição da Placa Central do Portão Social',
            category: 'portoes',
            maintenanceType: 'corretiva',
            technicianName: 'Técnico Rodrigo Ramos',
            scheduledDate: '12/03/2024',
            completedDate: '12/03/2024',
            cost: 'R$ 480,00',
            status: 'concluida',
            description: 'Portão travando no fechamento. Troca de sensores de fim de curso e placa Peccinin.',
            solutionDetails: 'Instalada nova placa inversora, ajustado tempo de rampa e configurados novos controles.',
          },
          {
            id: 2,
            condoId: 1,
            condoName: 'Condomínio Residencial Jardins',
            title: 'Manutenção Preventiva Semanal do Gerador',
            category: 'gerador',
            maintenanceType: 'preventiva',
            technicianName: 'Equipe Eletrotécnica',
            scheduledDate: '18/03/2024',
            completedDate: '',
            cost: 'R$ 250,00',
            status: 'agendada',
            description: 'Teste de carga de 30 minutos, verificação do nível de diesel, filtro de óleo e bateria 12V.',
          },
          {
            id: 3,
            condoId: 2,
            condoName: 'Condomínio Solar das Palmeiras',
            title: 'Reparo nas Câmeras Bullet do Perímetro e DVR',
            category: 'cftv',
            maintenanceType: 'corretiva',
            technicianName: 'Especialista em CFTV Marcos',
            scheduledDate: '14/03/2024',
            completedDate: '',
            cost: 'R$ 620,00',
            status: 'em_andamento',
            description: 'Câmera 04 e 07 apresentando ruído na imagem. Substituição do conector BNC e fonte colmeia 12V.',
          },
        ];
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
        loadedLogs = saved ? JSON.parse(saved) : [
          {
            id: 1,
            condoId: 1,
            condoName: 'Condomínio Residencial Jardins',
            agentName: 'Carlos Eduardo da Silva',
            shiftType: 'dia',
            logType: 'passagem_turno',
            severity: 'informativa',
            status: 'resolvida',
            title: 'Passagem de Turno Diurno para Noturno',
            description: 'Guarita entregue em ordem com os 4 rádios HT carregados, bastão de vigia conferido e livro de chaves assinado. Sem ocorrências durante o dia.',
            actionTaken: 'Entregue as chaves da sala técnica ao vigilante noturno.',
            logDate: new Date().toLocaleDateString('pt-BR'),
            logTime: '18:00',
          },
          {
            id: 2,
            condoId: 1,
            condoName: 'Condomínio Residencial Jardins',
            agentName: 'Lucas Ferreira (Ronda)',
            shiftType: 'noite',
            logType: 'ronda_preventiva',
            severity: 'informativa',
            status: 'resolvida',
            title: 'Ronda Perimetral Realizada com Moto',
            description: 'Verificados os 12 pontos iButton nos muros e garagens subterrâneas. Iluminação das garagens e portões operando normalmente.',
            actionTaken: 'Check concluído em 22 minutos.',
            logDate: new Date().toLocaleDateString('pt-BR'),
            logTime: '20:30',
          },
        ];
      }
      setOperationalLogs(loadedLogs);

      // Sincronizar dinamicamente as contagens de agentes, rondas, materiais e O.S. nos condomínios
      const condosWithDynamicCounts = loadedCondos.map((c) => ({
        ...c,
        agentsCount: loadedAgents.filter((a) => Number(a.condoId) === Number(c.id)).length,
        vehiclesCount: loadedVehicles.filter((v) => Number(v.condoId) === Number(c.id)).length,
        assetsCount: loadedAssets.filter((a) => Number(a.condoId) === Number(c.id)).length,
        maintenancesCount: loadedMaintenances.filter((m) => Number(m.condoId) === Number(c.id)).length,
      }));
      setCondominiums(condosWithDynamicCounts);
      localStorage.setItem('novabrasil_condos', JSON.stringify(condosWithDynamicCounts));

      // 7. Estatísticas Consolidadas
      const statsData = await parseJsonRes<DashboardStats>(statsRes);
      if (statsData) {
        setStats(statsData);
      } else {
        setStats({
          totalCondos: condosWithDynamicCounts.length,
          totalAgents: loadedAgents.length,
          agentsOnDuty: loadedAgents.filter((a) => a.status === 'em_servico').length,
          totalPatrolVehicles: loadedVehicles.length,
          activePatrolVehicles: loadedVehicles.filter((v) => v.status === 'em_ronda').length,
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

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    }
  }, [isAuthenticated, selectedCondoId]);

  // --- HANDLERS: AGENTES ---
  const handleAddAgent = async (agentData: Omit<SecurityAgent, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      let created: any = null;
      try {
        const res = await fetch('/api/agents', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(agentData),
        });
        if (res.ok) {
          const text = await res.text();
          if (text) created = JSON.parse(text);
        }
      } catch {
        // Fallback local
      }

      const newAgent: SecurityAgent = created || {
        ...agentData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      const updated = [newAgent, ...agents.filter((a) => a.id !== newAgent.id)];
      setAgents(updated);
      localStorage.setItem('novabrasil_agents', JSON.stringify(updated));

      // Sincroniza dinamicamente as estatísticas do painel
      setStats((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          totalAgents: updated.length,
          agentsOnDuty: updated.filter((a) => a.status === 'em_servico').length,
        };
      });

      // Sincroniza as contagens dos condomínios
      setCondominiums((prev) => {
        const next = prev.map((c) => ({
          ...c,
          agentsCount: updated.filter((a) => Number(a.condoId) === Number(c.id)).length,
        }));
        localStorage.setItem('novabrasil_condos', JSON.stringify(next));
        return next;
      });

      // Se foi solicitado gerar acesso ao sistema, adiciona automaticamente na Gestão de Usuários
      const dataWithAccess = agentData as any;
      if (dataWithAccess.createAccess && dataWithAccess.accessEmail && dataWithAccess.accessPassword) {
        const cleanEmail = dataWithAccess.accessEmail.trim().toLowerCase();
        const cleanPassword = dataWithAccess.accessPassword.trim();
        const assignedIds = Array.isArray(agentData.condoIds) && agentData.condoIds.length > 0
          ? agentData.condoIds
          : (agentData.condoId ? [agentData.condoId] : []);
        const assignedNames = agentData.condoNames || (agentData.condoName ? [agentData.condoName] : []);
        const selectedCondo = condominiums.find((c) => c.id === Number(agentData.condoId));

        // 1. Tenta cadastrar na API /api/users
        try {
          await fetch('/api/users', {
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
          });
        } catch (uErr) {
          console.warn('Aviso ao sincronizar usuário do agente:', uErr);
        }

        // 2. Salva em novabrasil_users_list para persistência e login imediato
        try {
          const savedUsers = localStorage.getItem('novabrasil_users_list');
          const usersList = savedUsers ? JSON.parse(savedUsers) : [];
          const filtered = usersList.filter((u: any) => u.email.toLowerCase() !== cleanEmail);
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
          localStorage.setItem('novabrasil_users_list', JSON.stringify([newUserObj, ...filtered]));
        } catch (lsErr) {
          console.warn('Erro ao salvar usuário no localStorage:', lsErr);
        }
      }

      return true;
    } catch {
      return false;
    }
  };

  const handleUpdateAgent = async (id: number, patch: Partial<SecurityAgent>): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      try {
        await fetch(`/api/agents/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
      } catch {
        // Fallback local
      }

      const updated = agents.map((a) => (a.id === id ? { ...a, ...patch } : a));
      setAgents(updated);
      localStorage.setItem('novabrasil_agents', JSON.stringify(updated));

      // Sincroniza dinamicamente as estatísticas e condomínios
      setStats((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          totalAgents: updated.length,
          agentsOnDuty: updated.filter((a) => a.status === 'em_servico').length,
        };
      });

      setCondominiums((prev) => {
        const next = prev.map((c) => ({
          ...c,
          agentsCount: updated.filter((a) => Number(a.condoId) === Number(c.id)).length,
        }));
        localStorage.setItem('novabrasil_condos', JSON.stringify(next));
        return next;
      });

      // Se na edição foi solicitado gerar acesso que não existia
      const patchWithAccess = patch as any;
      if (patchWithAccess.createAccess && patchWithAccess.accessEmail && patchWithAccess.accessPassword) {
        const cleanEmail = patchWithAccess.accessEmail.trim().toLowerCase();
        const cleanPassword = patchWithAccess.accessPassword.trim();
        const agentObj = agents.find((a) => a.id === id);
        const agentName = patch.name || agentObj?.name || 'Agente de Portaria';
        const condoIdVal = patch.condoId !== undefined ? patch.condoId : agentObj?.condoId;
        const selectedCondo = condominiums.find((c) => c.id === Number(condoIdVal));

        try {
          await fetch('/api/users', {
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
          });
        } catch {}

        try {
          const savedUsers = localStorage.getItem('novabrasil_users_list');
          const usersList = savedUsers ? JSON.parse(savedUsers) : [];
          const filtered = usersList.filter((u: any) => u.email.toLowerCase() !== cleanEmail);
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
          localStorage.setItem('novabrasil_users_list', JSON.stringify([newUserObj, ...filtered]));
        } catch {}
      }

      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteAgent = async (id: number): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      try {
        await fetch(`/api/agents/${id}`, { method: 'DELETE', headers });
      } catch {
        // Fallback local
      }

      const updated = agents.filter((a) => a.id !== id);
      setAgents(updated);
      localStorage.setItem('novabrasil_agents', JSON.stringify(updated));

      // Sincroniza dinamicamente as estatísticas e condomínios
      setStats((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          totalAgents: updated.length,
          agentsOnDuty: updated.filter((a) => a.status === 'em_servico').length,
        };
      });

      setCondominiums((prev) => {
        const next = prev.map((c) => ({
          ...c,
          agentsCount: updated.filter((a) => Number(a.condoId) === Number(c.id)).length,
        }));
        localStorage.setItem('novabrasil_condos', JSON.stringify(next));
        return next;
      });

      return true;
    } catch {
      return false;
    }
  };

  // --- HANDLERS: VEÍCULOS DE RONDA ---
  const handleAddPatrolVehicle = async (vehData: Omit<PatrolVehicle, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      let created: any = null;
      try {
        const res = await fetch('/api/patrol-vehicles', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(vehData),
        });
        if (res.ok) created = await res.json();
      } catch {
        // Fallback local
      }

      const newVeh: PatrolVehicle = created || {
        ...vehData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      const updated = [newVeh, ...patrolVehicles];
      setPatrolVehicles(updated);
      localStorage.setItem('novabrasil_patrol_vehicles', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  const handleUpdatePatrolVehicle = async (id: number, patch: Partial<PatrolVehicle>): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      try {
        await fetch(`/api/patrol-vehicles/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
      } catch {
        // Fallback local
      }

      const updated = patrolVehicles.map((v) => (v.id === id ? { ...v, ...patch } : v));
      setPatrolVehicles(updated);
      localStorage.setItem('novabrasil_patrol_vehicles', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  const handleDeletePatrolVehicle = async (id: number): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      try {
        await fetch(`/api/patrol-vehicles/${id}`, { method: 'DELETE', headers });
      } catch {
        // Fallback local
      }

      const updated = patrolVehicles.filter((v) => v.id !== id);
      setPatrolVehicles(updated);
      localStorage.setItem('novabrasil_patrol_vehicles', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  // --- HANDLERS: MATERIAIS / PATRIMÔNIO ---
  const handleAddAsset = async (assetData: Omit<CompanyAsset, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      let created: any = null;
      try {
        const res = await fetch('/api/company-assets', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(assetData),
        });
        if (res.ok) created = await res.json();
      } catch {
        // Fallback local
      }

      const newAsset: CompanyAsset = created || {
        ...assetData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      const updated = [newAsset, ...companyAssets];
      setCompanyAssets(updated);
      localStorage.setItem('novabrasil_company_assets', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  const handleUpdateAsset = async (id: number, patch: Partial<CompanyAsset>): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      try {
        await fetch(`/api/company-assets/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
      } catch {
        // Fallback local
      }

      const updated = companyAssets.map((a) => (a.id === id ? { ...a, ...patch } : a));
      setCompanyAssets(updated);
      localStorage.setItem('novabrasil_company_assets', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteAsset = async (id: number): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      try {
        await fetch(`/api/company-assets/${id}`, { method: 'DELETE', headers });
      } catch {
        // Fallback local
      }

      const updated = companyAssets.filter((a) => a.id !== id);
      setCompanyAssets(updated);
      localStorage.setItem('novabrasil_company_assets', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  // --- HANDLERS: MANUTENÇÕES ---
  const handleAddMaintenance = async (maintData: Omit<MaintenanceOrder, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      let created: any = null;
      try {
        const res = await fetch('/api/maintenances', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(maintData),
        });
        if (res.ok) created = await res.json();
      } catch {
        // Fallback local
      }

      const newMaint: MaintenanceOrder = created || {
        ...maintData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      const updated = [newMaint, ...maintenances];
      setMaintenances(updated);
      localStorage.setItem('novabrasil_maintenances', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  const handleUpdateMaintenance = async (id: number, patch: Partial<MaintenanceOrder>): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      try {
        await fetch(`/api/maintenances/${id}`, {
          method: 'PUT',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(patch),
        });
      } catch {
        // Fallback local
      }

      const updated = maintenances.map((m) => (m.id === id ? { ...m, ...patch } : m));
      setMaintenances(updated);
      localStorage.setItem('novabrasil_maintenances', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteMaintenance = async (id: number): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      try {
        await fetch(`/api/maintenances/${id}`, { method: 'DELETE', headers });
      } catch {
        // Fallback local
      }

      const updated = maintenances.filter((m) => m.id !== id);
      setMaintenances(updated);
      localStorage.setItem('novabrasil_maintenances', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  // --- HANDLERS: LIVRO DE OCORRÊNCIAS ---
  const handleAddLog = async (logData: Omit<OperationalLog, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      let created: any = null;
      try {
        const res = await fetch('/api/operational-logs', {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify(logData),
        });
        if (res.ok) created = await res.json();
      } catch {
        // Fallback local
      }

      const newLog: OperationalLog = created || {
        ...logData,
        id: Date.now(),
        createdAt: new Date().toISOString(),
      };

      const updated = [newLog, ...operationalLogs];
      setOperationalLogs(updated);
      localStorage.setItem('novabrasil_operational_logs', JSON.stringify(updated));
      return true;
    } catch {
      return false;
    }
  };

  const handleDeleteLog = async (id: number): Promise<boolean> => {
    try {
      const headers = await getAuthHeaders();
      try {
        await fetch(`/api/operational-logs/${id}`, { method: 'DELETE', headers });
      } catch {
        // Fallback local
      }

      const updated = operationalLogs.filter((l) => l.id !== id);
      setOperationalLogs(updated);
      localStorage.setItem('novabrasil_operational_logs', JSON.stringify(updated));
      return true;
    } catch {
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

  return (
    <div className="min-h-screen bg-slate-100/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        condominiums={condominiums}
        selectedCondoId={selectedCondoId}
        onSelectCondo={setSelectedCondoId}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <div className="flex-1 flex flex-col md:flex-row">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenRoleModal={() => setIsRoleModalOpen(true)}
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
              onDeleteLog={handleDeleteLog}
            />
          )}

          {activeTab === 'usuarios' && (
            <UsersManagementView
              condominiums={condominiums}
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

      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
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
