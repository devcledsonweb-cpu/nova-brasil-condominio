import { relations } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';

// 1. Usuários do sistema administrativo (Síndico e Portaria)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name').notNull(),
  role: text('role').notNull().default('portaria'), // 'sindico' | 'portaria'
  createdAt: timestamp('created_at').defaultNow(),
});

// 2. Blocos do condomínio
export const blocks = pgTable('blocks', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // ex: "Bloco A - Acácias"
  description: text('description'),
  totalFloors: integer('total_floors').default(4),
  createdAt: timestamp('created_at').defaultNow(),
});

// 3. Unidades de apartamentos
export const units = pgTable('units', {
  id: serial('id').primaryKey(),
  blockId: integer('block_id')
    .references(() => blocks.id, { onDelete: 'cascade' })
    .notNull(),
  number: text('number').notNull(), // ex: "101", "204"
  floor: integer('floor').default(1),
  unitType: text('unit_type').default('apartamento'), // apartamento, cobertura, studio
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 4. Moradores
export const residents = pgTable('residents', {
  id: serial('id').primaryKey(),
  unitId: integer('unit_id')
    .references(() => units.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  cpf: text('cpf'),
  email: text('email'),
  phone: text('phone').notNull(),
  emergencyContact: text('emergency_contact'),
  residentType: text('resident_type').notNull().default('inquilino'), // 'proprietario' | 'inquilino'
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// 5. Veículos e Vagas
export const vehicles = pgTable('vehicles', {
  id: serial('id').primaryKey(),
  unitId: integer('unit_id')
    .references(() => units.id, { onDelete: 'cascade' })
    .notNull(),
  plate: text('plate').notNull(),
  model: text('model').notNull(),
  color: text('color').notNull(),
  parkingSpot: text('parking_spot').notNull(), // ex: "Vaga 102"
  spotType: text('spot_type').default('coberta'), // 'coberta' | 'descoberta'
  residentName: text('resident_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 6. Livro de Ocorrências
export const incidents = pgTable('incidents', {
  id: serial('id').primaryKey(),
  unitId: integer('unit_id').references(() => units.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  category: text('category').notNull(), // 'barulho', 'animais', 'estacionamento', 'patrimonio', 'lixo', 'convivencia', 'outros'
  description: text('description').notNull(),
  involvedPersons: text('involved_persons'),
  severity: text('severity').default('media'), // 'baixa', 'media', 'alta', 'grave'
  status: text('status').default('aberta'), // 'aberta', 'em_analise', 'resolvida', 'advertencia', 'multa'
  attachmentUrl: text('attachment_url'),
  actionTaken: text('action_taken'),
  registeredBy: text('registered_by').notNull(),
  incidentDate: text('incident_date').notNull(), // YYYY-MM-DD
  incidentTime: text('incident_time').notNull(), // HH:MM
  createdAt: timestamp('created_at').defaultNow(),
});

// 7. Áreas Comuns
export const commonAreas = pgTable('common_areas', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(), // Churrasqueira Gourmet, Salão de Festas, Quadra Poliesportiva
  capacity: integer('capacity').notNull().default(30),
  description: text('description'),
  cleaningFee: text('cleaning_fee').default('0.00'),
  rules: text('rules'),
  active: boolean('active').default(true),
});

// 8. Reservas de Áreas Comuns
export const reservations = pgTable('reservations', {
  id: serial('id').primaryKey(),
  areaId: integer('area_id')
    .references(() => commonAreas.id, { onDelete: 'cascade' })
    .notNull(),
  unitId: integer('unit_id')
    .references(() => units.id, { onDelete: 'cascade' })
    .notNull(),
  residentName: text('resident_name').notNull(),
  reservationDate: text('reservation_date').notNull(), // YYYY-MM-DD
  period: text('period').notNull().default('dia_todo'), // 'manha', 'tarde', 'noite', 'dia_todo'
  startTime: text('start_time'),
  endTime: text('end_time'),
  status: text('status').default('confirmada'), // 'confirmada', 'pendente', 'cancelada'
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

// 9. Controle de Portaria: Acesso de Visitantes e Prestadores
export const accessLogs = pgTable('access_logs', {
  id: serial('id').primaryKey(),
  visitorType: text('visitor_type').notNull().default('visitante'), // 'visitante' | 'prestador'
  name: text('name').notNull(),
  document: text('document').notNull(), // RG / CPF
  company: text('company'), // Para prestadores de serviço
  unitId: integer('unit_id')
    .references(() => units.id, { onDelete: 'cascade' })
    .notNull(),
  authorizedBy: text('authorized_by'),
  entryTime: timestamp('entry_time').defaultNow().notNull(),
  exitTime: timestamp('exit_time'),
  vehiclePlate: text('vehicle_plate'),
  notes: text('notes'),
  registeredBy: text('registered_by'),
});

// 10. Encomendas recebidas na Portaria
export const deliveries = pgTable('deliveries', {
  id: serial('id').primaryKey(),
  unitId: integer('unit_id')
    .references(() => units.id, { onDelete: 'cascade' })
    .notNull(),
  recipientName: text('recipient_name').notNull(),
  trackingCode: text('tracking_code'),
  carrier: text('carrier').notNull(), // Correios, Mercado Livre, Amazon, etc.
  packageType: text('package_type').default('pacote'), // caixa, envelope, pacote, refrigerado
  location: text('location').default('Armário 1'),
  status: text('status').default('aguardando'), // 'aguardando' | 'retirado'
  receivedAt: timestamp('received_at').defaultNow().notNull(),
  pickedUpAt: timestamp('picked_up_at'),
  pickedUpBy: text('picked_up_by'),
  receivedByPortaria: text('received_by_portaria'),
});

// 11. Mural de Avisos e Comunicados Oficiais
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  priority: text('priority').default('informativo'), // 'informativo', 'importante', 'urgente'
  pinned: boolean('pinned').default(false),
  author: text('author').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// 12. Enquetes e Votações
export const polls = pgTable('polls', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  active: boolean('active').default(true),
  expiresAt: text('expires_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const pollOptions = pgTable('poll_options', {
  id: serial('id').primaryKey(),
  pollId: integer('poll_id')
    .references(() => polls.id, { onDelete: 'cascade' })
    .notNull(),
  text: text('text').notNull(),
  voteCount: integer('vote_count').default(0),
});

export const pollVotes = pgTable('poll_votes', {
  id: serial('id').primaryKey(),
  pollId: integer('poll_id')
    .references(() => polls.id, { onDelete: 'cascade' })
    .notNull(),
  optionId: integer('option_id')
    .references(() => pollOptions.id, { onDelete: 'cascade' })
    .notNull(),
  unitId: integer('unit_id')
    .references(() => units.id, { onDelete: 'cascade' })
    .notNull(),
  voterName: text('voter_name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relacionamentos Drizzle
export const blocksRelations = relations(blocks, ({ many }) => ({
  units: many(units),
}));

export const unitsRelations = relations(units, ({ one, many }) => ({
  block: one(blocks, {
    fields: [units.blockId],
    references: [blocks.id],
  }),
  residents: many(residents),
  vehicles: many(vehicles),
  incidents: many(incidents),
  reservations: many(reservations),
  accessLogs: many(accessLogs),
  deliveries: many(deliveries),
}));

export const residentsRelations = relations(residents, ({ one }) => ({
  unit: one(units, {
    fields: [residents.unitId],
    references: [units.id],
  }),
}));

export const vehiclesRelations = relations(vehicles, ({ one }) => ({
  unit: one(units, {
    fields: [vehicles.unitId],
    references: [units.id],
  }),
}));

export const incidentsRelations = relations(incidents, ({ one }) => ({
  unit: one(units, {
    fields: [incidents.unitId],
    references: [units.id],
  }),
}));

export const reservationsRelations = relations(reservations, ({ one }) => ({
  area: one(commonAreas, {
    fields: [reservations.areaId],
    references: [commonAreas.id],
  }),
  unit: one(units, {
    fields: [reservations.unitId],
    references: [units.id],
  }),
}));

export const accessLogsRelations = relations(accessLogs, ({ one }) => ({
  unit: one(units, {
    fields: [accessLogs.unitId],
    references: [units.id],
  }),
}));

export const deliveriesRelations = relations(deliveries, ({ one }) => ({
  unit: one(units, {
    fields: [deliveries.unitId],
    references: [units.id],
  }),
}));

export const pollsRelations = relations(polls, ({ many }) => ({
  options: many(pollOptions),
  votes: many(pollVotes),
}));

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
  poll: one(polls, {
    fields: [pollOptions.pollId],
    references: [polls.id],
  }),
  votes: many(pollVotes),
}));
