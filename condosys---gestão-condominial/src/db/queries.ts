import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  accessLogs,
  announcements,
  blocks,
  commonAreas,
  deliveries,
  incidents,
  pollOptions,
  polls,
  pollVotes,
  reservations,
  residents,
  units,
  users,
  vehicles,
} from './schema.ts';

// --- USUÁRIOS ---
export async function getOrCreateUser(uid: string, email: string, name: string, role: string = 'portaria') {
  try {
    const existing = await db.select().from(users).where(eq(users.uid, uid));
    if (existing.length > 0) {
      return existing[0];
    }
    const inserted = await db
      .insert(users)
      .values({ uid, email, name, role })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateUser:', error);
    throw new Error('Falha ao sincronizar usuário.', { cause: error });
  }
}

// --- ESTRUTURA: BLOCOS E UNIDADES ---
export async function getBlocks() {
  try {
    return await db.select().from(blocks).orderBy(blocks.name);
  } catch (error) {
    console.error('getBlocks failed:', error);
    throw new Error('Falha ao consultar blocos.', { cause: error });
  }
}

export async function createBlock(data: { name: string; description?: string; totalFloors?: number }) {
  try {
    const res = await db.insert(blocks).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('createBlock failed:', error);
    throw new Error('Falha ao cadastrar bloco.', { cause: error });
  }
}

export async function updateBlock(id: number, data: { name?: string; description?: string; totalFloors?: number }) {
  try {
    const res = await db.update(blocks).set(data).where(eq(blocks.id, id)).returning();
    return res[0];
  } catch (error) {
    console.error('updateBlock failed:', error);
    throw new Error('Falha ao atualizar bloco.', { cause: error });
  }
}

export async function deleteBlock(id: number) {
  try {
    await db.delete(blocks).where(eq(blocks.id, id));
    return { success: true };
  } catch (error) {
    console.error('deleteBlock failed:', error);
    throw new Error('Falha ao excluir bloco.', { cause: error });
  }
}

export async function getUnits() {
  try {
    const rows = await db
      .select({
        id: units.id,
        number: units.number,
        floor: units.floor,
        unitType: units.unitType,
        notes: units.notes,
        createdAt: units.createdAt,
        blockId: blocks.id,
        blockName: blocks.name,
      })
      .from(units)
      .innerJoin(blocks, eq(units.blockId, blocks.id))
      .orderBy(blocks.name, units.number);
    return rows;
  } catch (error) {
    console.error('getUnits failed:', error);
    throw new Error('Falha ao consultar unidades.', { cause: error });
  }
}

export async function createUnit(data: { blockId: number; number: string; floor?: number; unitType?: string; notes?: string }) {
  try {
    const res = await db.insert(units).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('createUnit failed:', error);
    throw new Error('Falha ao cadastrar unidade.', { cause: error });
  }
}

export async function updateUnit(id: number, data: { blockId?: number; number?: string; floor?: number; unitType?: string; notes?: string }) {
  try {
    const res = await db.update(units).set(data).where(eq(units.id, id)).returning();
    return res[0];
  } catch (error) {
    console.error('updateUnit failed:', error);
    throw new Error('Falha ao atualizar unidade.', { cause: error });
  }
}

export async function deleteUnit(id: number) {
  try {
    await db.delete(units).where(eq(units.id, id));
    return { success: true };
  } catch (error) {
    console.error('deleteUnit failed:', error);
    throw new Error('Falha ao excluir unidade.', { cause: error });
  }
}

// --- MORADORES ---
export async function getResidents() {
  try {
    return await db
      .select({
        id: residents.id,
        name: residents.name,
        cpf: residents.cpf,
        email: residents.email,
        phone: residents.phone,
        emergencyContact: residents.emergencyContact,
        residentType: residents.residentType,
        isActive: residents.isActive,
        createdAt: residents.createdAt,
        unitId: units.id,
        unitNumber: units.number,
        blockId: blocks.id,
        blockName: blocks.name,
      })
      .from(residents)
      .innerJoin(units, eq(residents.unitId, units.id))
      .innerJoin(blocks, eq(units.blockId, blocks.id))
      .orderBy(residents.name);
  } catch (error) {
    console.error('getResidents failed:', error);
    throw new Error('Falha ao consultar moradores.', { cause: error });
  }
}

export async function createResident(data: {
  unitId: number;
  name: string;
  cpf?: string;
  email?: string;
  phone: string;
  emergencyContact?: string;
  residentType: string;
}) {
  try {
    const res = await db.insert(residents).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('createResident failed:', error);
    throw new Error('Falha ao cadastrar morador.', { cause: error });
  }
}

export async function updateResident(
  id: number,
  data: {
    unitId?: number;
    name?: string;
    cpf?: string;
    email?: string;
    phone?: string;
    emergencyContact?: string;
    residentType?: string;
    isActive?: boolean;
  }
) {
  try {
    const res = await db.update(residents).set(data).where(eq(residents.id, id)).returning();
    return res[0];
  } catch (error) {
    console.error('updateResident failed:', error);
    throw new Error('Falha ao atualizar morador.', { cause: error });
  }
}

export async function deleteResident(id: number) {
  try {
    await db.delete(residents).where(eq(residents.id, id));
    return { success: true };
  } catch (error) {
    console.error('deleteResident failed:', error);
    throw new Error('Falha ao excluir morador.', { cause: error });
  }
}

// --- VEÍCULOS E VAGAS ---
export async function getVehicles() {
  try {
    return await db
      .select({
        id: vehicles.id,
        plate: vehicles.plate,
        model: vehicles.model,
        color: vehicles.color,
        parkingSpot: vehicles.parkingSpot,
        spotType: vehicles.spotType,
        residentName: vehicles.residentName,
        createdAt: vehicles.createdAt,
        unitId: units.id,
        unitNumber: units.number,
        blockId: blocks.id,
        blockName: blocks.name,
      })
      .from(vehicles)
      .innerJoin(units, eq(vehicles.unitId, units.id))
      .innerJoin(blocks, eq(units.blockId, blocks.id))
      .orderBy(vehicles.parkingSpot, vehicles.plate);
  } catch (error) {
    console.error('getVehicles failed:', error);
    throw new Error('Falha ao consultar veículos.', { cause: error });
  }
}

export async function createVehicle(data: {
  unitId: number;
  plate: string;
  model: string;
  color: string;
  parkingSpot: string;
  spotType?: string;
  residentName?: string;
}) {
  try {
    const res = await db.insert(vehicles).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('createVehicle failed:', error);
    throw new Error('Falha ao registrar veículo.', { cause: error });
  }
}

export async function updateVehicle(
  id: number,
  data: {
    unitId?: number;
    plate?: string;
    model?: string;
    color?: string;
    parkingSpot?: string;
    spotType?: string;
    residentName?: string;
  }
) {
  try {
    const res = await db.update(vehicles).set(data).where(eq(vehicles.id, id)).returning();
    return res[0];
  } catch (error) {
    console.error('updateVehicle failed:', error);
    throw new Error('Falha ao atualizar veículo.', { cause: error });
  }
}

export async function deleteVehicle(id: number) {
  try {
    await db.delete(vehicles).where(eq(vehicles.id, id));
    return { success: true };
  } catch (error) {
    console.error('deleteVehicle failed:', error);
    throw new Error('Falha ao excluir veículo.', { cause: error });
  }
}

// --- LIVRO DE OCORRÊNCIAS ---
export async function getIncidents() {
  try {
    return await db
      .select({
        id: incidents.id,
        title: incidents.title,
        category: incidents.category,
        description: incidents.description,
        involvedPersons: incidents.involvedPersons,
        severity: incidents.severity,
        status: incidents.status,
        attachmentUrl: incidents.attachmentUrl,
        actionTaken: incidents.actionTaken,
        registeredBy: incidents.registeredBy,
        incidentDate: incidents.incidentDate,
        incidentTime: incidents.incidentTime,
        createdAt: incidents.createdAt,
        unitId: units.id,
        unitNumber: units.number,
        blockName: blocks.name,
      })
      .from(incidents)
      .leftJoin(units, eq(incidents.unitId, units.id))
      .leftJoin(blocks, eq(units.blockId, blocks.id))
      .orderBy(desc(incidents.createdAt));
  } catch (error) {
    console.error('getIncidents failed:', error);
    throw new Error('Falha ao consultar ocorrências.', { cause: error });
  }
}

export async function createIncident(data: {
  unitId?: number;
  title: string;
  category: string;
  description: string;
  involvedPersons?: string;
  severity?: string;
  attachmentUrl?: string;
  registeredBy: string;
  incidentDate: string;
  incidentTime: string;
}) {
  try {
    const res = await db.insert(incidents).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('createIncident failed:', error);
    throw new Error('Falha ao registrar ocorrência.', { cause: error });
  }
}

export async function updateIncidentStatus(
  id: number,
  data: {
    status: string;
    actionTaken?: string;
  }
) {
  try {
    const res = await db.update(incidents).set(data).where(eq(incidents.id, id)).returning();
    return res[0];
  } catch (error) {
    console.error('updateIncidentStatus failed:', error);
    throw new Error('Falha ao atualizar status da ocorrência.', { cause: error });
  }
}

// --- ÁREAS COMUNS E RESERVAS ---
export async function getCommonAreas() {
  try {
    return await db.select().from(commonAreas).where(eq(commonAreas.active, true)).orderBy(commonAreas.name);
  } catch (error) {
    console.error('getCommonAreas failed:', error);
    throw new Error('Falha ao consultar áreas comuns.', { cause: error });
  }
}

export async function createCommonArea(data: {
  name: string;
  capacity: number;
  description?: string;
  cleaningFee?: string;
  rules?: string;
}) {
  try {
    const res = await db.insert(commonAreas).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('createCommonArea failed:', error);
    throw new Error('Falha ao criar área comum.', { cause: error });
  }
}

export async function getReservations() {
  try {
    return await db
      .select({
        id: reservations.id,
        areaId: commonAreas.id,
        areaName: commonAreas.name,
        cleaningFee: commonAreas.cleaningFee,
        unitId: units.id,
        unitNumber: units.number,
        blockName: blocks.name,
        residentName: reservations.residentName,
        reservationDate: reservations.reservationDate,
        period: reservations.period,
        startTime: reservations.startTime,
        endTime: reservations.endTime,
        status: reservations.status,
        notes: reservations.notes,
        createdAt: reservations.createdAt,
      })
      .from(reservations)
      .innerJoin(commonAreas, eq(reservations.areaId, commonAreas.id))
      .innerJoin(units, eq(reservations.unitId, units.id))
      .innerJoin(blocks, eq(units.blockId, blocks.id))
      .orderBy(desc(reservations.reservationDate));
  } catch (error) {
    console.error('getReservations failed:', error);
    throw new Error('Falha ao consultar reservas.', { cause: error });
  }
}

export async function createReservation(data: {
  areaId: number;
  unitId: number;
  residentName: string;
  reservationDate: string;
  period: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
}) {
  try {
    // Verificar conflito de reserva na mesma área e data
    const existing = await db
      .select()
      .from(reservations)
      .where(
        and(
          eq(reservations.areaId, data.areaId),
          eq(reservations.reservationDate, data.reservationDate),
          eq(reservations.status, 'confirmada')
        )
      );

    const hasConflict = existing.some((res) => {
      if (res.period === 'dia_todo' || data.period === 'dia_todo') return true;
      return res.period === data.period;
    });

    if (hasConflict) {
      throw new Error(`Conflito: A área já possui uma reserva confirmada para este período nesta data.`);
    }

    const res = await db.insert(reservations).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('createReservation failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Falha ao realizar reserva.', { cause: error });
  }
}

export async function cancelReservation(id: number) {
  try {
    const res = await db
      .update(reservations)
      .set({ status: 'cancelada' })
      .where(eq(reservations.id, id))
      .returning();
    return res[0];
  } catch (error) {
    console.error('cancelReservation failed:', error);
    throw new Error('Falha ao cancelar reserva.', { cause: error });
  }
}

// --- PORTARIA: CONTROLE DE ACESSO (VISITANTES E PRESTADORES) ---
export async function getAccessLogs() {
  try {
    return await db
      .select({
        id: accessLogs.id,
        visitorType: accessLogs.visitorType,
        name: accessLogs.name,
        document: accessLogs.document,
        company: accessLogs.company,
        unitId: units.id,
        unitNumber: units.number,
        blockName: blocks.name,
        authorizedBy: accessLogs.authorizedBy,
        entryTime: accessLogs.entryTime,
        exitTime: accessLogs.exitTime,
        vehiclePlate: accessLogs.vehiclePlate,
        notes: accessLogs.notes,
        registeredBy: accessLogs.registeredBy,
      })
      .from(accessLogs)
      .innerJoin(units, eq(accessLogs.unitId, units.id))
      .innerJoin(blocks, eq(units.blockId, blocks.id))
      .orderBy(desc(accessLogs.entryTime));
  } catch (error) {
    console.error('getAccessLogs failed:', error);
    throw new Error('Falha ao consultar acessos de portaria.', { cause: error });
  }
}

export async function createAccessLog(data: {
  visitorType: string;
  name: string;
  document: string;
  company?: string;
  unitId: number;
  authorizedBy?: string;
  vehiclePlate?: string;
  notes?: string;
  registeredBy?: string;
}) {
  try {
    const res = await db.insert(accessLogs).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('createAccessLog failed:', error);
    throw new Error('Falha ao registrar acesso na portaria.', { cause: error });
  }
}

export async function registerAccessExit(id: number) {
  try {
    const res = await db
      .update(accessLogs)
      .set({ exitTime: new Date() })
      .where(eq(accessLogs.id, id))
      .returning();
    return res[0];
  } catch (error) {
    console.error('registerAccessExit failed:', error);
    throw new Error('Falha ao registrar saída do visitante.', { cause: error });
  }
}

// --- PORTARIA: ENCOMENDAS ---
export async function getDeliveries() {
  try {
    return await db
      .select({
        id: deliveries.id,
        recipientName: deliveries.recipientName,
        trackingCode: deliveries.trackingCode,
        carrier: deliveries.carrier,
        packageType: deliveries.packageType,
        location: deliveries.location,
        status: deliveries.status,
        receivedAt: deliveries.receivedAt,
        pickedUpAt: deliveries.pickedUpAt,
        pickedUpBy: deliveries.pickedUpBy,
        receivedByPortaria: deliveries.receivedByPortaria,
        unitId: units.id,
        unitNumber: units.number,
        blockName: blocks.name,
      })
      .from(deliveries)
      .innerJoin(units, eq(deliveries.unitId, units.id))
      .innerJoin(blocks, eq(units.blockId, blocks.id))
      .orderBy(desc(deliveries.receivedAt));
  } catch (error) {
    console.error('getDeliveries failed:', error);
    throw new Error('Falha ao consultar encomendas.', { cause: error });
  }
}

export async function createDelivery(data: {
  unitId: number;
  recipientName: string;
  trackingCode?: string;
  carrier: string;
  packageType?: string;
  location?: string;
  receivedByPortaria?: string;
}) {
  try {
    const res = await db.insert(deliveries).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('createDelivery failed:', error);
    throw new Error('Falha ao registrar encomenda.', { cause: error });
  }
}

export async function markDeliveryPickup(id: number, pickedUpBy: string) {
  try {
    const res = await db
      .update(deliveries)
      .set({
        status: 'retirado',
        pickedUpAt: new Date(),
        pickedUpBy,
      })
      .where(eq(deliveries.id, id))
      .returning();
    return res[0];
  } catch (error) {
    console.error('markDeliveryPickup failed:', error);
    throw new Error('Falha ao registrar retirada da encomenda.', { cause: error });
  }
}

// --- MURAL DE AVISOS ---
export async function getAnnouncements() {
  try {
    return await db
      .select()
      .from(announcements)
      .orderBy(desc(announcements.pinned), desc(announcements.createdAt));
  } catch (error) {
    console.error('getAnnouncements failed:', error);
    throw new Error('Falha ao consultar comunicados.', { cause: error });
  }
}

export async function createAnnouncement(data: {
  title: string;
  content: string;
  priority?: string;
  pinned?: boolean;
  author: string;
}) {
  try {
    const res = await db.insert(announcements).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('createAnnouncement failed:', error);
    throw new Error('Falha ao publicar comunicado.', { cause: error });
  }
}

export async function deleteAnnouncement(id: number) {
  try {
    await db.delete(announcements).where(eq(announcements.id, id));
    return { success: true };
  } catch (error) {
    console.error('deleteAnnouncement failed:', error);
    throw new Error('Falha ao excluir comunicado.', { cause: error });
  }
}

// --- ENQUETES E VOTAÇÕES ---
export async function getPolls() {
  try {
    const allPolls = await db.select().from(polls).orderBy(desc(polls.createdAt));
    const allOptions = await db.select().from(pollOptions);
    const allVotes = await db.select().from(pollVotes);

    return allPolls.map((poll) => {
      const options = allOptions.filter((opt) => opt.pollId === poll.id);
      const votes = allVotes.filter((v) => v.pollId === poll.id);
      const totalVotes = options.reduce((sum, opt) => sum + (opt.voteCount || 0), 0);

      const optionsWithPct = options.map((opt) => ({
        ...opt,
        percentage: totalVotes > 0 ? Math.round(((opt.voteCount || 0) / totalVotes) * 100) : 0,
      }));

      return {
        ...poll,
        totalVotes,
        options: optionsWithPct,
        votes,
      };
    });
  } catch (error) {
    console.error('getPolls failed:', error);
    throw new Error('Falha ao consultar enquetes.', { cause: error });
  }
}

export async function createPoll(data: {
  title: string;
  description?: string;
  expiresAt?: string;
  options: string[];
}) {
  try {
    const newPoll = await db
      .insert(polls)
      .values({
        title: data.title,
        description: data.description,
        expiresAt: data.expiresAt,
      })
      .returning();

    const pollId = newPoll[0].id;
    for (const optText of data.options) {
      if (optText.trim()) {
        await db.insert(pollOptions).values({
          pollId,
          text: optText.trim(),
          voteCount: 0,
        });
      }
    }
    return newPoll[0];
  } catch (error) {
    console.error('createPoll failed:', error);
    throw new Error('Falha ao criar enquete.', { cause: error });
  }
}

export async function votePoll(pollId: number, optionId: number, unitId: number, voterName?: string) {
  try {
    // Check if unit already voted in this poll
    const existing = await db
      .select()
      .from(pollVotes)
      .where(and(eq(pollVotes.pollId, pollId), eq(pollVotes.unitId, unitId)));

    if (existing.length > 0) {
      throw new Error('Esta unidade já votou nesta enquete.');
    }

    await db.insert(pollVotes).values({
      pollId,
      optionId,
      unitId,
      voterName,
    });

    await db
      .update(pollOptions)
      .set({ voteCount: sql`${pollOptions.voteCount} + 1` })
      .where(eq(pollOptions.id, optionId));

    return { success: true };
  } catch (error) {
    console.error('votePoll failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Falha ao registrar voto.', { cause: error });
  }
}

// --- PAINEL: ESTATÍSTICAS DO CONDOMÍNIO ---
export async function getDashboardStats() {
  try {
    const [
      totalBlocksRes,
      totalUnitsRes,
      totalResidentsRes,
      totalVehiclesRes,
      pendingDeliveriesRes,
      activeVisitorsRes,
      openIncidentsRes,
      todayReservationsRes,
    ] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` }).from(blocks),
      db.select({ count: sql<number>`count(*)::int` }).from(units),
      db.select({ count: sql<number>`count(*)::int` }).from(residents).where(eq(residents.isActive, true)),
      db.select({ count: sql<number>`count(*)::int` }).from(vehicles),
      db.select({ count: sql<number>`count(*)::int` }).from(deliveries).where(eq(deliveries.status, 'aguardando')),
      db.select({ count: sql<number>`count(*)::int` }).from(accessLogs).where(sql`${accessLogs.exitTime} IS NULL`),
      db.select({ count: sql<number>`count(*)::int` }).from(incidents).where(eq(incidents.status, 'aberta')),
      db.select({ count: sql<number>`count(*)::int` }).from(reservations).where(eq(reservations.status, 'confirmada')),
    ]);

    return {
      totalBlocks: totalBlocksRes[0]?.count || 0,
      totalUnits: totalUnitsRes[0]?.count || 0,
      totalResidents: totalResidentsRes[0]?.count || 0,
      totalVehicles: totalVehiclesRes[0]?.count || 0,
      pendingDeliveries: pendingDeliveriesRes[0]?.count || 0,
      activeVisitors: activeVisitorsRes[0]?.count || 0,
      openIncidents: openIncidentsRes[0]?.count || 0,
      confirmedReservations: todayReservationsRes[0]?.count || 0,
    };
  } catch (error) {
    console.error('getDashboardStats failed:', error);
    throw new Error('Falha ao compilar estatísticas do painel.', { cause: error });
  }
}
