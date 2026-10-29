export type UserRole = 'admin' | 'supervisor' | 'operador' | 'sindico' | 'portaria';

export interface Condominium {
  id: number;
  name: string; // ex: "Residencial Jardins", "Edifício Alphaville Corporate"
  cnpj?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
  supervisorName?: string | null;
  supervisorPhone?: string | null;
  contractType?: string | null; // ex: "Portaria 24h + Ronda Noturna"
  sindicoName?: string | null; // Contato no cliente
  sindicoPhone?: string | null;
  sindicoEmail?: string | null;
  totalUnits?: number | null;
  status: 'ativo' | 'inativo' | 'implantacao';
  createdAt?: string;
  // Métricas operacionais agregadas
  agentsCount?: number;
  vehiclesCount?: number;
  assetsCount?: number;
  maintenancesCount?: number;
  usersCount?: number;
}

export interface SecurityAgent {
  id: number;
  condoId?: number | null;
  condoName?: string;
  name: string;
  cpf?: string | null;
  phone: string;
  badgeNumber: string; // Crachá / Matrícula
  roleTitle: 'agente_portaria' | 'ronda_motorizada' | 'fiscal_piso' | 'lider_posto' | 'zelador_operacional';
  shift: '12x36_dia' | '12x36_noite' | '6x1' | 'folguista';
  status: 'em_servico' | 'folga' | 'ferias' | 'afastado';
  admissionDate?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface PatrolVehicle {
  id: number;
  condoId?: number | null;
  condoName?: string;
  type: 'moto' | 'carro' | 'utilitario' | 'bicicleta';
  plate: string;
  model: string;
  brand?: string | null;
  color: string;
  currentKm: number;
  driverName?: string | null; // Rondante ou condutor designado
  status: 'em_ronda' | 'disponivel' | 'manutencao' | 'abastecimento';
  routeDescription?: string | null; // ex: "Perímetro externo e garagens a cada 30min"
  lastPatrolAt?: string | null;
  createdAt?: string;
}

export interface CompanyAsset {
  id: number;
  condoId?: number | null;
  condoName?: string;
  name: string; // ex: "Rádio Comunicador HT Baofeng UV-5R", "Bastão Vigia Guardus"
  category: 'comunicacao' | 'seguranca_ronda' | 'cftv_ti' | 'ferramentas' | 'sinalizacao' | 'epi' | 'outro';
  assetTag?: string | null; // Nº do Patrimônio / Tombamento
  serialNumber?: string | null;
  quantity: number;
  condition: 'novo' | 'bom' | 'regular' | 'danificado';
  deliveryDate?: string | null;
  responsibleAgent?: string | null; // Quem assinou a cautela
  notes?: string | null;
  createdAt?: string;
}

export interface MaintenanceOrder {
  id: number;
  condoId?: number | null;
  condoName?: string;
  title: string;
  category: 'portoes' | 'cftv' | 'interfonia' | 'eletrica' | 'hidraulica' | 'gerador' | 'controle_acesso' | 'alvenaria_pintura' | 'outro';
  maintenanceType: 'preventiva' | 'corretiva' | 'emergencial';
  technicianName: string; // Técnico ou equipe enviada pela empresa
  scheduledDate: string; // YYYY-MM-DD
  completedDate?: string | null;
  cost: string; // R$ 0,00
  status: 'agendada' | 'em_andamento' | 'aguardando_peca' | 'concluida' | 'cancelada';
  description: string;
  solutionDetails?: string | null;
  createdAt?: string;
}

export interface OperationalLog {
  id: number;
  condoId?: number | null;
  condoName?: string;
  agentName: string;
  shiftType: 'dia' | 'noite';
  logType: 'passagem_turno' | 'ocorrencia_posto' | 'ronda_preventiva' | 'vistoria_supervisor';
  severity: 'informativa' | 'baixa' | 'media' | 'alta' | 'grave';
  status: 'aberta' | 'em_analise' | 'resolvida';
  title: string;
  description: string;
  actionTaken?: string | null;
  logDate: string;
  logTime: string;
  createdAt?: string;
}

export interface UserProfile {
  id?: number;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  permissions?: string | null;
  condoId?: number | null;
  condoName?: string;
  isActive?: boolean;
}

export interface SystemUser {
  id: number;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
  permissions?: string | null;
  condoId?: number | null;
  condoName?: string;
  isActive: boolean;
  createdAt?: string;
}

export interface DashboardStats {
  totalCondos: number;
  totalAgents: number;
  agentsOnDuty: number;
  totalPatrolVehicles: number;
  activePatrolVehicles: number;
  totalAssets: number;
  pendingMaintenances: number;
  completedMaintenances: number;
  todayLogs: number;
  // Legacy fields
  totalBlocks?: number;
  totalUnits?: number;
  totalResidents?: number;
  totalVehicles?: number;
  pendingDeliveries?: number;
  activeVisitors?: number;
  openIncidents?: number;
  confirmedReservations?: number;
}

// --- TIPOS LEGADOS DE COMPATIBILIDADE ---
export interface Block {
  id: number;
  condoId?: number | null;
  condoName?: string;
  name: string;
  description?: string | null;
  totalFloors?: number | null;
  unitsCount?: number;
  createdAt?: string;
}

export interface Unit {
  id: number;
  condoId?: number | null;
  condoName?: string;
  blockId: number;
  blockName?: string;
  number: string;
  floor?: number | null;
  unitType?: string | null;
  notes?: string | null;
  residentsCount?: number;
  createdAt?: string;
}

export interface Resident {
  id: number;
  condoId?: number | null;
  condoName?: string;
  unitId: number;
  unitNumber?: string;
  blockId?: number;
  blockName?: string;
  name: string;
  cpf?: string | null;
  email?: string | null;
  phone: string;
  emergencyContact?: string | null;
  residentType: 'proprietario' | 'inquilino';
  isActive: boolean;
  createdAt?: string;
}

export interface Vehicle {
  id: number;
  condoId?: number | null;
  condoName?: string;
  unitId: number;
  unitNumber?: string;
  blockId?: number;
  blockName?: string;
  plate: string;
  model: string;
  color: string;
  parkingSpot: string;
  spotType: 'coberta' | 'descoberta';
  residentName?: string | null;
  createdAt?: string;
}

export interface Incident {
  id: number;
  condoId?: number | null;
  condoName?: string;
  unitId?: number | null;
  unitNumber?: string | null;
  blockName?: string | null;
  title: string;
  category: string;
  description: string;
  involvedPersons?: string | null;
  severity: string;
  status: string;
  attachmentUrl?: string | null;
  actionTaken?: string | null;
  registeredBy: string;
  incidentDate: string;
  incidentTime: string;
  createdAt?: string;
}

export interface CommonArea {
  id: number;
  condoId?: number | null;
  condoName?: string;
  name: string;
  capacity: number;
  description?: string | null;
  cleaningFee?: string | null;
  rules?: string | null;
  active: boolean;
}

export interface Reservation {
  id: number;
  condoId?: number | null;
  condoName?: string;
  areaId: number;
  areaName?: string;
  cleaningFee?: string | null;
  unitId: number;
  unitNumber?: string;
  blockName?: string;
  residentName: string;
  reservationDate: string;
  period: string;
  startTime?: string | null;
  endTime?: string | null;
  status: string;
  notes?: string | null;
  createdAt?: string;
}

export interface AccessLog {
  id: number;
  condoId?: number | null;
  condoName?: string;
  visitorType: string;
  name: string;
  document: string;
  company?: string | null;
  unitId: number;
  unitNumber?: string;
  blockName?: string;
  authorizedBy?: string | null;
  entryTime: string;
  exitTime?: string | null;
  vehiclePlate?: string | null;
  notes?: string | null;
  registeredBy?: string | null;
}

export interface Delivery {
  id: number;
  condoId?: number | null;
  condoName?: string;
  unitId: number;
  unitNumber?: string;
  blockName?: string;
  recipientName: string;
  trackingCode?: string | null;
  carrier: string;
  packageType: string;
  location: string;
  status: string;
  receivedAt: string;
  pickedUpAt?: string | null;
  pickedUpBy?: string | null;
  receivedByPortaria?: string | null;
}

export interface Announcement {
  id: number;
  condoId?: number | null;
  condoName?: string;
  title: string;
  content: string;
  priority: string;
  pinned: boolean;
  author: string;
  createdAt: string;
}

export interface PollOption {
  id: number;
  pollId: number;
  text: string;
  voteCount: number;
  percentage?: number;
}

export interface PollVote {
  id?: number;
  pollId: number;
  optionId: number;
  unitId: number;
  voterName?: string | null;
  createdAt?: string;
}

export interface Poll {
  id: number;
  condoId?: number | null;
  condoName?: string;
  title: string;
  description?: string | null;
  active: boolean;
  expiresAt?: string | null;
  createdAt: string;
  totalVotes: number;
  options: PollOption[];
  votes?: PollVote[];
}


