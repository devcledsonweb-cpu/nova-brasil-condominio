export type UserRole = 'sindico' | 'portaria';

export interface UserProfile {
  id?: number;
  uid: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Block {
  id: number;
  name: string;
  description?: string | null;
  totalFloors?: number | null;
  createdAt?: string;
}

export interface Unit {
  id: number;
  blockId: number;
  blockName?: string;
  number: string;
  floor?: number | null;
  unitType?: string | null;
  notes?: string | null;
  createdAt?: string;
}

export interface Resident {
  id: number;
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
  unitId?: number | null;
  unitNumber?: string | null;
  blockName?: string | null;
  title: string;
  category: 'barulho' | 'animais' | 'estacionamento' | 'patrimonio' | 'lixo' | 'convivencia' | 'outros';
  description: string;
  involvedPersons?: string | null;
  severity: 'baixa' | 'media' | 'alta' | 'grave';
  status: 'aberta' | 'em_analise' | 'resolvida' | 'advertencia' | 'multa';
  attachmentUrl?: string | null;
  actionTaken?: string | null;
  registeredBy: string;
  incidentDate: string;
  incidentTime: string;
  createdAt?: string;
}

export interface CommonArea {
  id: number;
  name: string;
  capacity: number;
  description?: string | null;
  cleaningFee?: string | null;
  rules?: string | null;
  active: boolean;
}

export interface Reservation {
  id: number;
  areaId: number;
  areaName?: string;
  cleaningFee?: string | null;
  unitId: number;
  unitNumber?: string;
  blockName?: string;
  residentName: string;
  reservationDate: string;
  period: 'manha' | 'tarde' | 'noite' | 'dia_todo';
  startTime?: string | null;
  endTime?: string | null;
  status: 'confirmada' | 'pendente' | 'cancelada';
  notes?: string | null;
  createdAt?: string;
}

export interface AccessLog {
  id: number;
  visitorType: 'visitante' | 'prestador';
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
  unitId: number;
  unitNumber?: string;
  blockName?: string;
  recipientName: string;
  trackingCode?: string | null;
  carrier: string;
  packageType: string;
  location: string;
  status: 'aguardando' | 'retirado';
  receivedAt: string;
  pickedUpAt?: string | null;
  pickedUpBy?: string | null;
  receivedByPortaria?: string | null;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  priority: 'informativo' | 'importante' | 'urgente';
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
  title: string;
  description?: string | null;
  active: boolean;
  expiresAt?: string | null;
  createdAt: string;
  totalVotes: number;
  options: PollOption[];
  votes?: PollVote[];
}

export interface DashboardStats {
  totalBlocks: number;
  totalUnits: number;
  totalResidents: number;
  totalVehicles: number;
  pendingDeliveries: number;
  activeVisitors: number;
  openIncidents: number;
  confirmedReservations: number;
}
