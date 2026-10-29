import fs from 'fs';
import path from 'path';

export interface StoredSecurityAgent {
  id: number;
  condoId: number | null;
  name: string;
  cpf: string | null;
  phone: string;
  badgeNumber: string;
  roleTitle: 'agente_portaria' | 'vigilante_patrimonial' | 'controlador_acesso' | 'fiscal_piso' | 'supervisor_posto';
  shift: '12x36_dia' | '12x36_noite' | '6x1_manha' | '6x1_tarde' | '6x1_noite';
  status: 'em_servico' | 'folga' | 'ferias' | 'afastado';
  admissionDate: string | null;
  notes: string | null;
  createdAt: string;
}

export interface StoredPatrolVehicle {
  id: number;
  condoId: number | null;
  type: 'moto' | 'carro' | 'quadriciclo' | 'viatura';
  plate: string;
  model: string;
  brand: string | null;
  color: string;
  currentKm: number;
  driverName: string | null;
  status: 'em_ronda' | 'posto_base' | 'em_manutencao' | 'inativo';
  routeDescription: string | null;
  lastPatrolAt: string | null;
  createdAt: string;
}

export interface StoredCompanyAsset {
  id: number;
  condoId: number | null;
  name: string;
  category: 'comunicacao' | 'seguranca_ronda' | 'cftv_controle' | 'ferramentas' | 'epi' | 'escritorio_portaria';
  assetTag: string | null;
  serialNumber: string | null;
  quantity: number;
  condition: 'novo' | 'bom' | 'necessita_reparo' | 'danificado';
  deliveryDate: string | null;
  responsibleAgent: string | null;
  notes: string | null;
  createdAt: string;
}

export interface StoredMaintenanceOrder {
  id: number;
  condoId: number | null;
  title: string;
  category: 'portoes' | 'cftv' | 'interfonia' | 'geradores' | 'eletrica' | 'hidraulica' | 'alarmes' | 'iluminacao';
  maintenanceType: 'preventiva' | 'corretiva' | 'emergencial';
  technicianName: string;
  scheduledDate: string;
  completedDate: string | null;
  cost: string;
  status: 'agendada' | 'em_andamento' | 'concluida' | 'cancelada';
  description: string;
  solutionDetails: string | null;
  createdAt: string;
}

export interface StoredOperationalLog {
  id: number;
  condoId: number | null;
  agentName: string;
  shiftType: 'dia' | 'noite';
  logType: 'passagem_turno' | 'ronda_preventiva' | 'vistoria_patrimonio' | 'incidente_seguranca' | 'contato_supervisor' | 'aviso_manutencao';
  severity: 'informativa' | 'atencao' | 'critica';
  status: 'resolvida' | 'em_andamento' | 'pendente_supervisor';
  title: string;
  description: string;
  actionTaken: string | null;
  logDate: string;
  logTime: string;
  createdAt: string;
}

interface OperationalDatabase {
  agents: StoredSecurityAgent[];
  patrolVehicles: StoredPatrolVehicle[];
  companyAssets: StoredCompanyAsset[];
  maintenances: StoredMaintenanceOrder[];
  operationalLogs: StoredOperationalLog[];
  nextIds: {
    agent: number;
    vehicle: number;
    asset: number;
    maintenance: number;
    log: number;
  };
}

const dataDir = path.join(process.cwd(), 'data');
const dataFilePath = path.join(dataDir, 'operations.json');

const INITIAL_DATA: OperationalDatabase = {
  agents: [
    {
      id: 1,
      condoId: 1,
      name: 'Carlos Alberto Mendes',
      cpf: '234.567.890-12',
      phone: '(11) 98765-4321',
      badgeNumber: 'NB-0412',
      roleTitle: 'agente_portaria',
      shift: '12x36_dia',
      status: 'em_servico',
      admissionDate: '15/02/2023',
      notes: 'Líder da guarnição diurna. Curso de atendimento tático e CFTV atualizado.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      condoId: 1,
      name: 'Roberto Silveira Santos',
      cpf: '345.678.901-23',
      phone: '(11) 97654-3210',
      badgeNumber: 'NB-0418',
      roleTitle: 'vigilante_patrimonial',
      shift: '12x36_noite',
      status: 'em_servico',
      admissionDate: '10/05/2023',
      notes: 'Responsável pela ronda perimetral e bastão vigia noturno.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      condoId: 2,
      name: 'Valdemar Costa Lima',
      cpf: '456.789.012-34',
      phone: '(11) 96543-2109',
      badgeNumber: 'NB-0390',
      roleTitle: 'supervisor_posto',
      shift: '12x36_dia',
      status: 'em_servico',
      admissionDate: '01/11/2022',
      notes: 'Supervisor operacional do Posto Alphaville e bairros adjacentes.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      condoId: 2,
      name: 'Marcos Vinicius Rezende',
      cpf: '567.890.123-45',
      phone: '(11) 95432-1098',
      badgeNumber: 'NB-0520',
      roleTitle: 'controlador_acesso',
      shift: '6x1_manha',
      status: 'folga',
      admissionDate: '20/01/2024',
      notes: 'Controle de triagem de caminhões e prestadores de serviços.',
      createdAt: new Date().toISOString(),
    },
  ],
  patrolVehicles: [
    {
      id: 1,
      condoId: 1,
      type: 'moto',
      plate: 'BRA-2E19',
      model: 'Honda XRE 300 Rally',
      brand: 'Honda',
      color: 'Preto Fosco',
      currentKm: 14850,
      driverName: 'Roberto Silveira Santos',
      status: 'em_ronda',
      routeDescription: 'Perímetro externo dos muros, cerca elétrica e portões 01 e 02',
      lastPatrolAt: 'Hoje às 14:30',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      condoId: 1,
      type: 'carro',
      plate: 'RDA-9A44',
      model: 'Renault Duster 1.6 Tática',
      brand: 'Renault',
      color: 'Branco / Faixas NOVA BRASIL',
      currentKm: 42100,
      driverName: 'Valdemar Costa Lima',
      status: 'posto_base',
      routeDescription: 'Ronda de apoio tático, suporte a incidentes e inspeção de postos',
      lastPatrolAt: 'Hoje às 13:00',
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      condoId: 2,
      type: 'moto',
      plate: 'SPX-3K88',
      model: 'Yamaha Lander 250 ABS',
      brand: 'Yamaha',
      color: 'Preto',
      currentKm: 8900,
      driverName: 'Marcos Vinicius Rezende',
      status: 'em_ronda',
      routeDescription: 'Alameda Principal, Área de Lazer e Reservatórios Técnicos',
      lastPatrolAt: 'Hoje às 15:10',
      createdAt: new Date().toISOString(),
    },
  ],
  companyAssets: [
    {
      id: 1,
      condoId: 1,
      name: 'Rádio Comunicador HT Motorola DGP8550e',
      category: 'comunicacao',
      assetTag: 'NB-HT-019',
      serialNumber: 'MOT-7890123-BR',
      quantity: 4,
      condition: 'bom',
      deliveryDate: '10/01/2024',
      responsibleAgent: 'Carlos Alberto Mendes',
      notes: 'Com base carregadora quádrupla e microfone de lapela tático.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      condoId: 1,
      name: 'Bastão Vigia Biométrico / RFID Viggore',
      category: 'seguranca_ronda',
      assetTag: 'NB-RON-004',
      serialNumber: 'VIG-2023-8841',
      quantity: 2,
      condition: 'bom',
      deliveryDate: '15/02/2024',
      responsibleAgent: 'Roberto Silveira Santos',
      notes: '12 botons de ronda perimetral espalhados pelo muro norte e sul.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      condoId: 1,
      name: 'NVR Intelbras 32 Canais 4K com 2 HDs 8TB',
      category: 'cftv_controle',
      assetTag: 'NB-CFTV-102',
      serialNumber: 'ITB-998811-2023',
      quantity: 1,
      condition: 'bom',
      deliveryDate: '05/11/2023',
      responsibleAgent: 'Valdemar Costa Lima',
      notes: 'Equipamento pertencente à NOVA BRASIL cedido sob contrato.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 4,
      condoId: 2,
      name: 'Colete Balístico Nível II-A Tático',
      category: 'epi',
      assetTag: 'NB-EPI-055',
      serialNumber: 'CBC-55214-2023',
      quantity: 2,
      condition: 'bom',
      deliveryDate: '20/08/2023',
      responsibleAgent: 'Valdemar Costa Lima',
      notes: 'Capa tática com identificação da empresa. Validade até 2028.',
      createdAt: new Date().toISOString(),
    },
  ],
  maintenances: [
    {
      id: 1,
      condoId: 1,
      title: 'Revisão Preventiva Motores Portões Eclusa Principal',
      category: 'portoes',
      maintenanceType: 'preventiva',
      technicianName: 'Sérgio Ramos (Técnico Mecatrônico)',
      scheduledDate: '20/03/2025',
      completedDate: '20/03/2025',
      cost: 'R$ 480,00',
      status: 'concluida',
      description: 'Lubrificação das cremalheiras, regulagem de fim de curso e troca das correias dos motores Peccinin.',
      solutionDetails: 'Portões operando com tempo de abertura de 4 segundos e travamento magnético 100% funcional.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      condoId: 1,
      title: 'Ajuste e Recalibração de Câmeras Perimetrais Dome IP',
      category: 'cftv',
      maintenanceType: 'corretiva',
      technicianName: 'Henrique Alves (Técnico CFTV)',
      scheduledDate: '25/03/2025',
      completedDate: null,
      cost: 'R$ 350,00',
      status: 'agendada',
      description: 'Câmera CAM-07 (muro dos fundos) apresentando névoa noturna no IR e perda pontual de pacote no switch PoE.',
      solutionDetails: null,
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      condoId: 2,
      title: 'Troca de Baterias Nobreak da Central de Interfonia',
      category: 'interfonia',
      maintenanceType: 'preventiva',
      technicianName: 'Lucas Ferraz (Técnico Telecom)',
      scheduledDate: '28/03/2025',
      completedDate: null,
      cost: 'R$ 620,00',
      status: 'agendada',
      description: 'Substituição preventiva do banco de baterias 12V 45Ah do nobreak da portaria para garantir autonomia de 4 horas.',
      solutionDetails: null,
      createdAt: new Date().toISOString(),
    },
  ],
  operationalLogs: [
    {
      id: 1,
      condoId: 1,
      agentName: 'Carlos Alberto Mendes',
      shiftType: 'dia',
      logType: 'passagem_turno',
      severity: 'informativa',
      status: 'resolvida',
      title: 'Passagem de Turno Diurna sem Alterações Críticas',
      description: 'Turno das 07:00 às 19:00 entregue ao vigilante Roberto Silveira. Todos os 4 rádios HT com carga total, 2 viaturas abastecidas e chaves da sala técnica em quadro.',
      actionTaken: 'Conferência mútua de materiais e teste de áudio no canal 01.',
      logDate: '24/03/2025',
      logTime: '18:55',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      condoId: 1,
      agentName: 'Roberto Silveira Santos',
      shiftType: 'noite',
      logType: 'ronda_preventiva',
      severity: 'informativa',
      status: 'resolvida',
      title: 'Ronda Perimetral das 02:00 Concluída',
      description: 'Ronda de moto finalizada em todos os 12 botons de vigia do perímetro. Cerca elétrica energizada e sem falhas de alarme.',
      actionTaken: 'Descarregamento do bastão vigia no sistema da base.',
      logDate: '25/03/2025',
      logTime: '02:30',
      createdAt: new Date().toISOString(),
    },
    {
      id: 3,
      condoId: 2,
      agentName: 'Valdemar Costa Lima',
      shiftType: 'dia',
      logType: 'vistoria_patrimonio',
      severity: 'atencao',
      status: 'em_andamento',
      title: 'Inspeção Semanal de Equipamentos da Empresa no Posto',
      description: 'Identificado que o rádio HT NB-HT-012 está com presilha do cinto frouxa e cabo do carregador com mau contato na tomada da guarita 2.',
      actionTaken: 'Solicitada substituição do carregador junto à base de operações NOVA BRASIL.',
      logDate: '25/03/2025',
      logTime: '11:20',
      createdAt: new Date().toISOString(),
    },
  ],
  nextIds: {
    agent: 5,
    vehicle: 4,
    asset: 5,
    maintenance: 4,
    log: 4,
  },
};

let inMemoryDb: OperationalDatabase | null = null;

function ensureDataFile(): OperationalDatabase {
  if (inMemoryDb) return inMemoryDb;

  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (fs.existsSync(dataFilePath)) {
      const content = fs.readFileSync(dataFilePath, 'utf-8');
      inMemoryDb = JSON.parse(content);
      return inMemoryDb!;
    }
  } catch (err) {
    console.warn('Erro ao carregar data/operations.json, usando padrão:', err);
  }

  inMemoryDb = JSON.parse(JSON.stringify(INITIAL_DATA));
  saveDataFile();
  return inMemoryDb!;
}

function saveDataFile() {
  if (!inMemoryDb) return;
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    fs.writeFileSync(dataFilePath, JSON.stringify(inMemoryDb, null, 2), 'utf-8');
  } catch (err) {
    console.error('Falha ao salvar operations.json:', err);
  }
}

// --- AGENTES ---
export function getStoreAgents(condoId?: number): StoredSecurityAgent[] {
  const db = ensureDataFile();
  if (condoId) {
    return db.agents.filter((a) => a.condoId === condoId);
  }
  return [...db.agents].sort((a, b) => a.name.localeCompare(b.name));
}

export function createStoreAgent(data: Omit<StoredSecurityAgent, 'id' | 'createdAt'>): StoredSecurityAgent {
  const db = ensureDataFile();
  const id = db.nextIds.agent++;
  const newAgent: StoredSecurityAgent = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };
  db.agents.unshift(newAgent);
  saveDataFile();
  return newAgent;
}

export function updateStoreAgent(id: number, data: Partial<StoredSecurityAgent>): StoredSecurityAgent {
  const db = ensureDataFile();
  const index = db.agents.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error(`Agente com ID ${id} não encontrado.`);
  }
  db.agents[index] = { ...db.agents[index], ...data };
  saveDataFile();
  return db.agents[index];
}

export function deleteStoreAgent(id: number): boolean {
  const db = ensureDataFile();
  const index = db.agents.findIndex((a) => a.id === id);
  if (index !== -1) {
    db.agents.splice(index, 1);
    saveDataFile();
    return true;
  }
  return false;
}

// --- VEÍCULOS DE RONDA ---
export function getStorePatrolVehicles(condoId?: number): StoredPatrolVehicle[] {
  const db = ensureDataFile();
  if (condoId) {
    return db.patrolVehicles.filter((v) => v.condoId === condoId);
  }
  return [...db.patrolVehicles].sort((a, b) => a.model.localeCompare(b.model));
}

export function createStorePatrolVehicle(data: Omit<StoredPatrolVehicle, 'id' | 'createdAt'>): StoredPatrolVehicle {
  const db = ensureDataFile();
  const id = db.nextIds.vehicle++;
  const newVehicle: StoredPatrolVehicle = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };
  db.patrolVehicles.unshift(newVehicle);
  saveDataFile();
  return newVehicle;
}

export function updateStorePatrolVehicle(id: number, data: Partial<StoredPatrolVehicle>): StoredPatrolVehicle {
  const db = ensureDataFile();
  const index = db.patrolVehicles.findIndex((v) => v.id === id);
  if (index === -1) {
    throw new Error(`Veículo com ID ${id} não encontrado.`);
  }
  db.patrolVehicles[index] = { ...db.patrolVehicles[index], ...data };
  saveDataFile();
  return db.patrolVehicles[index];
}

export function deleteStorePatrolVehicle(id: number): boolean {
  const db = ensureDataFile();
  const index = db.patrolVehicles.findIndex((v) => v.id === id);
  if (index !== -1) {
    db.patrolVehicles.splice(index, 1);
    saveDataFile();
    return true;
  }
  return false;
}

// --- PATRIMÔNIO & MATERIAIS DA EMPRESA ---
export function getStoreCompanyAssets(condoId?: number): StoredCompanyAsset[] {
  const db = ensureDataFile();
  if (condoId) {
    return db.companyAssets.filter((a) => a.condoId === condoId);
  }
  return [...db.companyAssets].sort((a, b) => a.name.localeCompare(b.name));
}

export function createStoreCompanyAsset(data: Omit<StoredCompanyAsset, 'id' | 'createdAt'>): StoredCompanyAsset {
  const db = ensureDataFile();
  const id = db.nextIds.asset++;
  const newAsset: StoredCompanyAsset = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };
  db.companyAssets.unshift(newAsset);
  saveDataFile();
  return newAsset;
}

export function updateStoreCompanyAsset(id: number, data: Partial<StoredCompanyAsset>): StoredCompanyAsset {
  const db = ensureDataFile();
  const index = db.companyAssets.findIndex((a) => a.id === id);
  if (index === -1) {
    throw new Error(`Material com ID ${id} não encontrado.`);
  }
  db.companyAssets[index] = { ...db.companyAssets[index], ...data };
  saveDataFile();
  return db.companyAssets[index];
}

export function deleteStoreCompanyAsset(id: number): boolean {
  const db = ensureDataFile();
  const index = db.companyAssets.findIndex((a) => a.id === id);
  if (index !== -1) {
    db.companyAssets.splice(index, 1);
    saveDataFile();
    return true;
  }
  return false;
}

// --- MANUTENÇÕES PREDIAIS REALIZADAS PELA EMPRESA ---
export function getStoreMaintenances(condoId?: number): StoredMaintenanceOrder[] {
  const db = ensureDataFile();
  if (condoId) {
    return db.maintenances.filter((m) => m.condoId === condoId);
  }
  return [...db.maintenances].sort((a, b) => b.scheduledDate.localeCompare(a.scheduledDate));
}

export function createStoreMaintenance(data: Omit<StoredMaintenanceOrder, 'id' | 'createdAt'>): StoredMaintenanceOrder {
  const db = ensureDataFile();
  const id = db.nextIds.maintenance++;
  const newM: StoredMaintenanceOrder = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };
  db.maintenances.unshift(newM);
  saveDataFile();
  return newM;
}

export function updateStoreMaintenance(id: number, data: Partial<StoredMaintenanceOrder>): StoredMaintenanceOrder {
  const db = ensureDataFile();
  const index = db.maintenances.findIndex((m) => m.id === id);
  if (index === -1) {
    throw new Error(`Ordem de manutenção com ID ${id} não encontrada.`);
  }
  db.maintenances[index] = { ...db.maintenances[index], ...data };
  saveDataFile();
  return db.maintenances[index];
}

export function deleteStoreMaintenance(id: number): boolean {
  const db = ensureDataFile();
  const index = db.maintenances.findIndex((m) => m.id === id);
  if (index !== -1) {
    db.maintenances.splice(index, 1);
    saveDataFile();
    return true;
  }
  return false;
}

// --- OCORRÊNCIAS OPERACIONAIS E LIVRO DE TURNO ---
export function getStoreOperationalLogs(condoId?: number): StoredOperationalLog[] {
  const db = ensureDataFile();
  if (condoId) {
    return db.operationalLogs.filter((l) => l.condoId === condoId);
  }
  return [...db.operationalLogs].sort((a, b) => {
    const dateCmp = b.logDate.localeCompare(a.logDate);
    if (dateCmp !== 0) return dateCmp;
    return b.logTime.localeCompare(a.logTime);
  });
}

export function createStoreOperationalLog(data: Omit<StoredOperationalLog, 'id' | 'createdAt'>): StoredOperationalLog {
  const db = ensureDataFile();
  const id = db.nextIds.log++;
  const newLog: StoredOperationalLog = {
    ...data,
    id,
    createdAt: new Date().toISOString(),
  };
  db.operationalLogs.unshift(newLog);
  saveDataFile();
  return newLog;
}

export function deleteStoreOperationalLog(id: number): boolean {
  const db = ensureDataFile();
  const index = db.operationalLogs.findIndex((l) => l.id === id);
  if (index !== -1) {
    db.operationalLogs.splice(index, 1);
    saveDataFile();
    return true;
  }
  return false;
}

// --- ESTATÍSTICAS OPERACIONAIS ---
export function getStoreDashboardStats(condoId?: number) {
  const db = ensureDataFile();
  const agents = condoId ? db.agents.filter((a) => a.condoId === condoId) : db.agents;
  const vehicles = condoId ? db.patrolVehicles.filter((v) => v.condoId === condoId) : db.patrolVehicles;
  const assets = condoId ? db.companyAssets.filter((a) => a.condoId === condoId) : db.companyAssets;
  const maintenances = condoId ? db.maintenances.filter((m) => m.condoId === condoId) : db.maintenances;
  const logs = condoId ? db.operationalLogs.filter((l) => l.condoId === condoId) : db.operationalLogs;

  return {
    totalAgents: agents.length,
    agentsOnDuty: agents.filter((a) => a.status === 'em_servico').length,
    totalPatrolVehicles: vehicles.length,
    activePatrolVehicles: vehicles.filter((v) => v.status === 'em_ronda').length,
    totalAssets: assets.reduce((acc, curr) => acc + (curr.quantity || 1), 0),
    pendingMaintenances: maintenances.filter((m) => m.status === 'agendada' || m.status === 'em_andamento').length,
    completedMaintenances: maintenances.filter((m) => m.status === 'concluida').length,
    todayLogs: logs.length,
  };
}
