import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import {
  accessLogs,
  announcements,
  blocks,
  commonAreas,
  condominiums,
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

// --- GESTÃO DE CONDOMÍNIOS (MULTI-CONDOMÍNIO / MULTI-TENANT) ---

export async function getCondominiums() {
  try {
    const list = await db
      .select({
        id: condominiums.id,
        name: condominiums.name,
        cnpj: condominiums.cnpj,
        address: condominiums.address,
        city: condominiums.city,
        state: condominiums.state,
        zipCode: condominiums.zipCode,
        totalUnits: condominiums.totalUnits,
        sindicoName: condominiums.sindicoName,
        sindicoPhone: condominiums.sindicoPhone,
        sindicoEmail: condominiums.sindicoEmail,
        status: condominiums.status,
        createdAt: condominiums.createdAt,
      })
      .from(condominiums)
      .orderBy(condominiums.name);

    // Contadores agregados para cada condomínio
    const results = await Promise.all(
      list.map(async (c) => {
        const [blocksCount, unitsCount, residentsCount, usersCount] = await Promise.all([
          db.select({ count: sql<number>`count(*)::int` }).from(blocks).where(eq(blocks.condoId, c.id)),
          db.select({ count: sql<number>`count(*)::int` }).from(units).where(eq(units.condoId, c.id)),
          db.select({ count: sql<number>`count(*)::int` }).from(residents).where(eq(residents.condoId, c.id)),
          db.select({ count: sql<number>`count(*)::int` }).from(users).where(eq(users.condoId, c.id)),
        ]);

        return {
          ...c,
          status: (c.status as 'ativo' | 'inativo' | 'implantacao') || 'ativo',
          blocksCount: blocksCount[0]?.count || 0,
          unitsCount: unitsCount[0]?.count || 0,
          residentsCount: residentsCount[0]?.count || 0,
          usersCount: usersCount[0]?.count || 0,
        };
      })
    );

    return results;
  } catch (error) {
    console.error('getCondominiums failed:', error);
    throw new Error('Falha ao listar condomínios.', { cause: error });
  }
}

export async function getCondominiumById(id: number) {
  try {
    const res = await db.select().from(condominiums).where(eq(condominiums.id, id));
    return res[0] || null;
  } catch (error) {
    console.error('getCondominiumById failed:', error);
    throw new Error('Falha ao obter condomínio.', { cause: error });
  }
}

export async function createCondominium(data: {
  name: string;
  cnpj?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  totalUnits?: number;
  sindicoName?: string;
  sindicoPhone?: string;
  sindicoEmail?: string;
  status?: string;
}) {
  try {
    const res = await db
      .insert(condominiums)
      .values({
        name: data.name.trim(),
        cnpj: data.cnpj?.trim(),
        address: data.address?.trim(),
        city: data.city?.trim(),
        state: data.state?.trim(),
        zipCode: data.zipCode?.trim(),
        totalUnits: data.totalUnits || 0,
        sindicoName: data.sindicoName?.trim(),
        sindicoPhone: data.sindicoPhone?.trim(),
        sindicoEmail: data.sindicoEmail?.trim(),
        status: data.status || 'ativo',
      })
      .returning();

    return res[0];
  } catch (error) {
    console.error('createCondominium failed:', error);
    throw new Error('Falha ao criar condomínio.', { cause: error });
  }
}

export async function updateCondominium(
  id: number,
  data: {
    name?: string;
    cnpj?: string;
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    totalUnits?: number;
    sindicoName?: string;
    sindicoPhone?: string;
    sindicoEmail?: string;
    status?: string;
  }
) {
  try {
    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.cnpj !== undefined) updateData.cnpj = data.cnpj?.trim();
    if (data.address !== undefined) updateData.address = data.address?.trim();
    if (data.city !== undefined) updateData.city = data.city?.trim();
    if (data.state !== undefined) updateData.state = data.state?.trim();
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode?.trim();
    if (data.totalUnits !== undefined) updateData.totalUnits = data.totalUnits;
    if (data.sindicoName !== undefined) updateData.sindicoName = data.sindicoName?.trim();
    if (data.sindicoPhone !== undefined) updateData.sindicoPhone = data.sindicoPhone?.trim();
    if (data.sindicoEmail !== undefined) updateData.sindicoEmail = data.sindicoEmail?.trim();
    if (data.status !== undefined) updateData.status = data.status;

    const res = await db.update(condominiums).set(updateData).where(eq(condominiums.id, id)).returning();
    return res[0];
  } catch (error) {
    console.error('updateCondominium failed:', error);
    throw new Error('Falha ao atualizar condomínio.', { cause: error });
  }
}

export async function deleteCondominium(id: number) {
  try {
    await db.delete(condominiums).where(eq(condominiums.id, id));
    return { success: true };
  } catch (error) {
    console.error('deleteCondominium failed:', error);
    throw new Error('Falha ao excluir condomínio.', { cause: error });
  }
}

// --- USUÁRIOS & AUTENTICAÇÃO ---

export async function authenticateUser(email: string, passwordAttempt: string) {
  let attempts = 0;
  while (attempts < 2) {
    try {
      attempts++;
      const result = await db.select().from(users).where(eq(users.email, email.trim().toLowerCase()));
      if (result.length === 0) {
        throw new Error('E-mail não cadastrado no sistema.');
      }
      const user = result[0];
      if (!user.isActive) {
        throw new Error('Usuário inativo. Entre em contato com a administração.');
      }
      if (user.password !== passwordAttempt) {
        throw new Error('Senha incorreta.');
      }

      let condoName = undefined;
      if (user.condoId) {
        const condoRes = await db.select().from(condominiums).where(eq(condominiums.id, user.condoId));
        if (condoRes.length > 0) condoName = condoRes[0].name;
      }

      return {
        id: user.id,
        uid: user.uid,
        email: user.email,
        name: user.name,
        role: user.role,
        permissions: user.permissions,
        condoId: user.condoId,
        condoName,
        isActive: user.isActive,
      };
    } catch (error: any) {
      // Se for credencial inválida, interrompe imediatamente sem tentar novamente
      if (
        error.message?.includes('E-mail não cadastrado') ||
        error.message?.includes('Usuário inativo') ||
        error.message?.includes('Senha incorreta')
      ) {
        throw error;
      }

      // Se for falha transitória de conexão / pool acordando, tenta novamente após 1s
      if (attempts < 2) {
        console.warn('Conexão ao banco de dados aquecendo, repetindo busca de usuário...');
        await new Promise((r) => setTimeout(r, 1200));
        continue;
      }

      console.error('authenticateUser failed:', error);
      throw new Error(error instanceof Error ? error.message : 'Falha na autenticação.', { cause: error });
    }
  }
}

export async function getUsersList(condoId?: number) {
  try {
    let query = db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        name: users.name,
        role: users.role,
        permissions: users.permissions,
        condoId: users.condoId,
        condoName: condominiums.name,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(condominiums, eq(users.condoId, condominiums.id));

    if (condoId) {
      return await query.where(eq(users.condoId, condoId)).orderBy(desc(users.createdAt));
    }
    return await query.orderBy(desc(users.createdAt));
  } catch (error) {
    console.error('getUsersList failed:', error);
    throw new Error('Falha ao listar usuários do sistema.', { cause: error });
  }
}

export async function createSystemUser(data: {
  name: string;
  email: string;
  password: string;
  role: string;
  permissions?: string;
  condoId?: number | null;
}) {
  try {
    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await db.select().from(users).where(eq(users.email, cleanEmail));
    if (existing.length > 0) {
      throw new Error('Já existe um usuário cadastrado com este e-mail.');
    }

    const uid = `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const res = await db
      .insert(users)
      .values({
        uid,
        email: cleanEmail,
        password: data.password,
        name: data.name.trim(),
        role: data.role,
        permissions: data.permissions || (data.role === 'sindico' ? '["all"]' : '["portaria","encomendas","acessos","veiculos"]'),
        condoId: data.condoId || null,
        isActive: true,
      })
      .returning();

    return {
      id: res[0].id,
      uid: res[0].uid,
      email: res[0].email,
      name: res[0].name,
      role: res[0].role,
      permissions: res[0].permissions,
      condoId: res[0].condoId,
      isActive: res[0].isActive,
    };
  } catch (error) {
    console.error('createSystemUser failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Falha ao cadastrar usuário.', { cause: error });
  }
}

export async function updateSystemUser(
  id: number,
  data: {
    name?: string;
    role?: string;
    password?: string;
    permissions?: string;
    condoId?: number | null;
    isActive?: boolean;
  }
) {
  try {
    const updateData: any = {};
    if (data.name) updateData.name = data.name.trim();
    if (data.role) updateData.role = data.role;
    if (data.password && data.password.trim()) updateData.password = data.password.trim();
    if (data.permissions) updateData.permissions = data.permissions;
    if (data.condoId !== undefined) updateData.condoId = data.condoId;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const res = await db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return {
      id: res[0].id,
      uid: res[0].uid,
      email: res[0].email,
      name: res[0].name,
      role: res[0].role,
      permissions: res[0].permissions,
      condoId: res[0].condoId,
      isActive: res[0].isActive,
    };
  } catch (error) {
    console.error('updateSystemUser failed:', error);
    throw new Error('Falha ao atualizar usuário.', { cause: error });
  }
}

export async function deleteSystemUser(id: number) {
  try {
    const userToDel = await db.select().from(users).where(eq(users.id, id));
    if (userToDel[0]?.email === 'administrativo@novabrasil.com') {
      throw new Error('Não é permitido excluir o usuário Administrador Master do sistema.');
    }
    await db.delete(users).where(eq(users.id, id));
    return { success: true };
  } catch (error) {
    console.error('deleteSystemUser failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Falha ao excluir usuário.', { cause: error });
  }
}

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

export async function getBlocks(condoId?: number) {
  try {
    let query = db
      .select({
        id: blocks.id,
        condoId: blocks.condoId,
        condoName: condominiums.name,
        name: blocks.name,
        description: blocks.description,
        totalFloors: blocks.totalFloors,
        createdAt: blocks.createdAt,
      })
      .from(blocks)
      .leftJoin(condominiums, eq(blocks.condoId, condominiums.id));

    if (condoId) {
      return await query.where(eq(blocks.condoId, condoId)).orderBy(blocks.name);
    }
    return await query.orderBy(blocks.name);
  } catch (error) {
    console.error('getBlocks failed:', error);
    throw new Error('Falha ao consultar blocos.', { cause: error });
  }
}

export async function createBlock(data: { name: string; description?: string; totalFloors?: number; condoId?: number }) {
  try {
    const res = await db.insert(blocks).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('createBlock failed:', error);
    throw new Error('Falha ao cadastrar bloco.', { cause: error });
  }
}

export async function updateBlock(id: number, data: { name?: string; description?: string; totalFloors?: number; condoId?: number }) {
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

export async function getUnits(condoId?: number) {
  try {
    let query = db
      .select({
        id: units.id,
        condoId: units.condoId,
        condoName: condominiums.name,
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
      .leftJoin(condominiums, eq(units.condoId, condominiums.id));

    if (condoId) {
      return await query.where(eq(units.condoId, condoId)).orderBy(blocks.name, units.number);
    }
    return await query.orderBy(blocks.name, units.number);
  } catch (error) {
    console.error('getUnits failed:', error);
    throw new Error('Falha ao consultar unidades.', { cause: error });
  }
}

export async function createUnit(data: {
  blockId: number;
  number: string;
  floor?: number;
  unitType?: string;
  notes?: string;
  condoId?: number;
}) {
  try {
    let finalCondoId = data.condoId;
    if (!finalCondoId) {
      const blockRes = await db.select().from(blocks).where(eq(blocks.id, data.blockId));
      if (blockRes.length > 0 && blockRes[0].condoId) {
        finalCondoId = blockRes[0].condoId;
      }
    }

    const res = await db
      .insert(units)
      .values({
        blockId: data.blockId,
        number: data.number,
        floor: data.floor,
        unitType: data.unitType,
        notes: data.notes,
        condoId: finalCondoId,
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('createUnit failed:', error);
    throw new Error('Falha ao cadastrar unidade.', { cause: error });
  }
}

export async function updateUnit(
  id: number,
  data: {
    blockId?: number;
    number?: string;
    floor?: number;
    unitType?: string;
    notes?: string;
    condoId?: number;
  }
) {
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

// --- CADASTRO DE MORADORES ---

export async function getResidents(condoId?: number) {
  try {
    let query = db
      .select({
        id: residents.id,
        condoId: residents.condoId,
        condoName: condominiums.name,
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
      .leftJoin(condominiums, eq(residents.condoId, condominiums.id));

    if (condoId) {
      return await query.where(eq(residents.condoId, condoId)).orderBy(residents.name);
    }
    return await query.orderBy(residents.name);
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
  condoId?: number;
}) {
  try {
    let finalCondoId = data.condoId;
    if (!finalCondoId) {
      const unitRes = await db.select().from(units).where(eq(units.id, data.unitId));
      if (unitRes.length > 0 && unitRes[0].condoId) {
        finalCondoId = unitRes[0].condoId;
      }
    }

    const res = await db
      .insert(residents)
      .values({
        unitId: data.unitId,
        name: data.name,
        cpf: data.cpf,
        email: data.email,
        phone: data.phone,
        emergencyContact: data.emergencyContact,
        residentType: data.residentType,
        condoId: finalCondoId,
        isActive: true,
      })
      .returning();
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
    condoId?: number;
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

// --- CONTROLE DE VEÍCULOS E VAGAS ---

export async function getVehicles(condoId?: number) {
  try {
    let query = db
      .select({
        id: vehicles.id,
        condoId: vehicles.condoId,
        condoName: condominiums.name,
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
      .leftJoin(condominiums, eq(vehicles.condoId, condominiums.id));

    if (condoId) {
      return await query.where(eq(vehicles.condoId, condoId)).orderBy(vehicles.parkingSpot);
    }
    return await query.orderBy(vehicles.parkingSpot);
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
  condoId?: number;
}) {
  try {
    let finalCondoId = data.condoId;
    if (!finalCondoId) {
      const unitRes = await db.select().from(units).where(eq(units.id, data.unitId));
      if (unitRes.length > 0 && unitRes[0].condoId) {
        finalCondoId = unitRes[0].condoId;
      }
    }

    const res = await db
      .insert(vehicles)
      .values({
        unitId: data.unitId,
        plate: data.plate.toUpperCase().trim(),
        model: data.model.trim(),
        color: data.color.trim(),
        parkingSpot: data.parkingSpot.trim(),
        spotType: data.spotType || 'coberta',
        residentName: data.residentName,
        condoId: finalCondoId,
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('createVehicle failed:', error);
    throw new Error('Falha ao cadastrar veículo.', { cause: error });
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
    condoId?: number;
  }
) {
  try {
    const updateData = { ...data };
    if (updateData.plate) updateData.plate = updateData.plate.toUpperCase().trim();
    const res = await db.update(vehicles).set(updateData).where(eq(vehicles.id, id)).returning();
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
    throw new Error('Falha ao remover veículo.', { cause: error });
  }
}

// --- LIVRO DE OCORRÊNCIAS ---

export async function getIncidents(condoId?: number) {
  try {
    let query = db
      .select({
        id: incidents.id,
        condoId: incidents.condoId,
        condoName: condominiums.name,
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
      .leftJoin(condominiums, eq(incidents.condoId, condominiums.id));

    if (condoId) {
      return await query.where(eq(incidents.condoId, condoId)).orderBy(desc(incidents.incidentDate), desc(incidents.incidentTime));
    }
    return await query.orderBy(desc(incidents.incidentDate), desc(incidents.incidentTime));
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
  condoId?: number;
}) {
  try {
    let finalCondoId = data.condoId;
    if (!finalCondoId && data.unitId) {
      const unitRes = await db.select().from(units).where(eq(units.id, data.unitId));
      if (unitRes.length > 0 && unitRes[0].condoId) {
        finalCondoId = unitRes[0].condoId;
      }
    }

    const res = await db
      .insert(incidents)
      .values({
        unitId: data.unitId,
        title: data.title,
        category: data.category,
        description: data.description,
        involvedPersons: data.involvedPersons,
        severity: data.severity || 'media',
        attachmentUrl: data.attachmentUrl,
        registeredBy: data.registeredBy,
        incidentDate: data.incidentDate,
        incidentTime: data.incidentTime,
        condoId: finalCondoId,
        status: 'aberta',
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('createIncident failed:', error);
    throw new Error('Falha ao registrar ocorrência.', { cause: error });
  }
}

export async function updateIncidentStatus(
  id: number,
  data: { status?: string; actionTaken?: string; severity?: string }
) {
  try {
    const res = await db.update(incidents).set(data).where(eq(incidents.id, id)).returning();
    return res[0];
  } catch (error) {
    console.error('updateIncidentStatus failed:', error);
    throw new Error('Falha ao atualizar ocorrência.', { cause: error });
  }
}

// --- ÁREAS COMUNS & RESERVAS ---

export async function getCommonAreas(condoId?: number) {
  try {
    let query = db
      .select({
        id: commonAreas.id,
        condoId: commonAreas.condoId,
        condoName: condominiums.name,
        name: commonAreas.name,
        capacity: commonAreas.capacity,
        description: commonAreas.description,
        cleaningFee: commonAreas.cleaningFee,
        rules: commonAreas.rules,
        active: commonAreas.active,
      })
      .from(commonAreas)
      .leftJoin(condominiums, eq(commonAreas.condoId, condominiums.id));

    if (condoId) {
      return await query.where(eq(commonAreas.condoId, condoId)).orderBy(commonAreas.name);
    }
    return await query.orderBy(commonAreas.name);
  } catch (error) {
    console.error('getCommonAreas failed:', error);
    throw new Error('Falha ao consultar áreas comuns.', { cause: error });
  }
}

export async function createCommonArea(data: {
  name: string;
  capacity?: number;
  description?: string;
  cleaningFee?: string;
  rules?: string;
  condoId?: number;
}) {
  try {
    const res = await db.insert(commonAreas).values(data).returning();
    return res[0];
  } catch (error) {
    console.error('createCommonArea failed:', error);
    throw new Error('Falha ao criar área comum.', { cause: error });
  }
}

export async function getReservations(condoId?: number) {
  try {
    let query = db
      .select({
        id: reservations.id,
        condoId: reservations.condoId,
        condoName: condominiums.name,
        reservationDate: reservations.reservationDate,
        period: reservations.period,
        startTime: reservations.startTime,
        endTime: reservations.endTime,
        status: reservations.status,
        notes: reservations.notes,
        createdAt: reservations.createdAt,
        residentName: reservations.residentName,
        areaId: commonAreas.id,
        areaName: commonAreas.name,
        cleaningFee: commonAreas.cleaningFee,
        unitId: units.id,
        unitNumber: units.number,
        blockName: blocks.name,
      })
      .from(reservations)
      .innerJoin(commonAreas, eq(reservations.areaId, commonAreas.id))
      .innerJoin(units, eq(reservations.unitId, units.id))
      .innerJoin(blocks, eq(units.blockId, blocks.id))
      .leftJoin(condominiums, eq(reservations.condoId, condominiums.id));

    if (condoId) {
      return await query.where(eq(reservations.condoId, condoId)).orderBy(desc(reservations.reservationDate));
    }
    return await query.orderBy(desc(reservations.reservationDate));
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
  period?: string;
  startTime?: string;
  endTime?: string;
  notes?: string;
  condoId?: number;
}) {
  try {
    // 1. Validação de conflito de datas para a mesma área
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

    if (existing.length > 0) {
      const isConflict = existing.some((res) => {
        if (res.period === 'dia_todo' || data.period === 'dia_todo') return true;
        return res.period === data.period;
      });
      if (isConflict) {
        throw new Error('Esta área comum já possui reserva confirmada para este período/data.');
      }
    }

    let finalCondoId = data.condoId;
    if (!finalCondoId) {
      const areaRes = await db.select().from(commonAreas).where(eq(commonAreas.id, data.areaId));
      if (areaRes.length > 0 && areaRes[0].condoId) {
        finalCondoId = areaRes[0].condoId;
      }
    }

    const res = await db
      .insert(reservations)
      .values({
        areaId: data.areaId,
        unitId: data.unitId,
        residentName: data.residentName,
        reservationDate: data.reservationDate,
        period: data.period || 'dia_todo',
        startTime: data.startTime,
        endTime: data.endTime,
        notes: data.notes,
        condoId: finalCondoId,
        status: 'confirmada',
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('createReservation failed:', error);
    throw new Error(error instanceof Error ? error.message : 'Falha ao realizar reserva.', { cause: error });
  }
}

export async function cancelReservation(id: number) {
  try {
    const res = await db.update(reservations).set({ status: 'cancelada' }).where(eq(reservations.id, id)).returning();
    return res[0];
  } catch (error) {
    console.error('cancelReservation failed:', error);
    throw new Error('Falha ao cancelar reserva.', { cause: error });
  }
}

// --- PORTARIA: CONTROLE DE ACESSO & ENCOMENDAS ---

export async function getAccessLogs(condoId?: number) {
  try {
    let query = db
      .select({
        id: accessLogs.id,
        condoId: accessLogs.condoId,
        condoName: condominiums.name,
        visitorType: accessLogs.visitorType,
        name: accessLogs.name,
        document: accessLogs.document,
        company: accessLogs.company,
        authorizedBy: accessLogs.authorizedBy,
        entryTime: accessLogs.entryTime,
        exitTime: accessLogs.exitTime,
        vehiclePlate: accessLogs.vehiclePlate,
        notes: accessLogs.notes,
        registeredBy: accessLogs.registeredBy,
        unitId: units.id,
        unitNumber: units.number,
        blockName: blocks.name,
      })
      .from(accessLogs)
      .innerJoin(units, eq(accessLogs.unitId, units.id))
      .innerJoin(blocks, eq(units.blockId, blocks.id))
      .leftJoin(condominiums, eq(accessLogs.condoId, condominiums.id));

    if (condoId) {
      return await query.where(eq(accessLogs.condoId, condoId)).orderBy(desc(accessLogs.entryTime));
    }
    return await query.orderBy(desc(accessLogs.entryTime));
  } catch (error) {
    console.error('getAccessLogs failed:', error);
    throw new Error('Falha ao consultar acessos.', { cause: error });
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
  condoId?: number;
}) {
  try {
    let finalCondoId = data.condoId;
    if (!finalCondoId) {
      const unitRes = await db.select().from(units).where(eq(units.id, data.unitId));
      if (unitRes.length > 0 && unitRes[0].condoId) {
        finalCondoId = unitRes[0].condoId;
      }
    }

    const res = await db
      .insert(accessLogs)
      .values({
        visitorType: data.visitorType,
        name: data.name,
        document: data.document,
        company: data.company,
        unitId: data.unitId,
        authorizedBy: data.authorizedBy,
        vehiclePlate: data.vehiclePlate ? data.vehiclePlate.toUpperCase().trim() : null,
        notes: data.notes,
        registeredBy: data.registeredBy,
        condoId: finalCondoId,
      })
      .returning();
    return res[0];
  } catch (error) {
    console.error('createAccessLog failed:', error);
    throw new Error('Falha ao registrar entrada.', { cause: error });
  }
}

export async function registerAccessExit(id: number) {
  try {
    const res = await db.update(accessLogs).set({ exitTime: new Date() }).where(eq(accessLogs.id, id)).returning();
    return res[0];
  } catch (error) {
    console.error('registerAccessExit failed:', error);
    throw new Error('Falha ao registrar saída.', { cause: error });
  }
}

export async function getDeliveries(condoId?: number) {
  try {
    let query = db
      .select({
        id: deliveries.id,
        condoId: deliveries.condoId,
        condoName: condominiums.name,
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
      .leftJoin(condominiums, eq(deliveries.condoId, condominiums.id));

    if (condoId) {
      return await query.where(eq(deliveries.condoId, condoId)).orderBy(desc(deliveries.receivedAt));
    }
    return await query.orderBy(desc(deliveries.receivedAt));
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
  condoId?: number;
}) {
  try {
    let finalCondoId = data.condoId;
    if (!finalCondoId) {
      const unitRes = await db.select().from(units).where(eq(units.id, data.unitId));
      if (unitRes.length > 0 && unitRes[0].condoId) {
        finalCondoId = unitRes[0].condoId;
      }
    }

    const res = await db
      .insert(deliveries)
      .values({
        unitId: data.unitId,
        recipientName: data.recipientName,
        trackingCode: data.trackingCode,
        carrier: data.carrier,
        packageType: data.packageType || 'pacote',
        location: data.location || 'Armário 1',
        receivedByPortaria: data.receivedByPortaria,
        condoId: finalCondoId,
        status: 'aguardando',
      })
      .returning();
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
    throw new Error('Falha ao dar baixa na encomenda.', { cause: error });
  }
}

// --- MURAL DE AVISOS E COMUNICADOS ---

export async function getAnnouncements(condoId?: number) {
  try {
    let query = db
      .select({
        id: announcements.id,
        condoId: announcements.condoId,
        condoName: condominiums.name,
        title: announcements.title,
        content: announcements.content,
        priority: announcements.priority,
        pinned: announcements.pinned,
        author: announcements.author,
        createdAt: announcements.createdAt,
      })
      .from(announcements)
      .leftJoin(condominiums, eq(announcements.condoId, condominiums.id));

    if (condoId) {
      return await query.where(eq(announcements.condoId, condoId)).orderBy(desc(announcements.pinned), desc(announcements.createdAt));
    }
    return await query.orderBy(desc(announcements.pinned), desc(announcements.createdAt));
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
  condoId?: number;
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

export async function getPolls(condoId?: number) {
  try {
    let query = db
      .select({
        id: polls.id,
        condoId: polls.condoId,
        condoName: condominiums.name,
        title: polls.title,
        description: polls.description,
        active: polls.active,
        expiresAt: polls.expiresAt,
        createdAt: polls.createdAt,
      })
      .from(polls)
      .leftJoin(condominiums, eq(polls.condoId, condominiums.id));

    const pollRows = condoId ? await query.where(eq(polls.condoId, condoId)).orderBy(desc(polls.createdAt)) : await query.orderBy(desc(polls.createdAt));

    const options = await db.select().from(pollOptions);
    const votes = await db.select().from(pollVotes);

    return pollRows.map((poll) => {
      const pollOpts = options.filter((o) => o.pollId === poll.id);
      const pollVts = votes.filter((v) => v.pollId === poll.id);
      const totalVotes = pollOpts.reduce((acc, curr) => acc + (curr.voteCount || 0), 0);

      return {
        ...poll,
        totalVotes,
        options: pollOpts.map((opt) => ({
          ...opt,
          percentage: totalVotes > 0 ? Math.round(((opt.voteCount || 0) / totalVotes) * 100) : 0,
        })),
        votes: pollVts,
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
  condoId?: number;
}) {
  try {
    const newPoll = await db
      .insert(polls)
      .values({
        title: data.title,
        description: data.description,
        expiresAt: data.expiresAt,
        condoId: data.condoId,
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

export async function getDashboardStats(condoId?: number) {
  try {
    const totalCondosRes = await db.select({ count: sql<number>`count(*)::int` }).from(condominiums);

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
      condoId
        ? db.select({ count: sql<number>`count(*)::int` }).from(blocks).where(eq(blocks.condoId, condoId))
        : db.select({ count: sql<number>`count(*)::int` }).from(blocks),
      condoId
        ? db.select({ count: sql<number>`count(*)::int` }).from(units).where(eq(units.condoId, condoId))
        : db.select({ count: sql<number>`count(*)::int` }).from(units),
      condoId
        ? db.select({ count: sql<number>`count(*)::int` }).from(residents).where(and(eq(residents.isActive, true), eq(residents.condoId, condoId)))
        : db.select({ count: sql<number>`count(*)::int` }).from(residents).where(eq(residents.isActive, true)),
      condoId
        ? db.select({ count: sql<number>`count(*)::int` }).from(vehicles).where(eq(vehicles.condoId, condoId))
        : db.select({ count: sql<number>`count(*)::int` }).from(vehicles),
      condoId
        ? db.select({ count: sql<number>`count(*)::int` }).from(deliveries).where(and(eq(deliveries.status, 'aguardando'), eq(deliveries.condoId, condoId)))
        : db.select({ count: sql<number>`count(*)::int` }).from(deliveries).where(eq(deliveries.status, 'aguardando')),
      condoId
        ? db.select({ count: sql<number>`count(*)::int` }).from(accessLogs).where(and(sql`${accessLogs.exitTime} IS NULL`, eq(accessLogs.condoId, condoId)))
        : db.select({ count: sql<number>`count(*)::int` }).from(accessLogs).where(sql`${accessLogs.exitTime} IS NULL`),
      condoId
        ? db.select({ count: sql<number>`count(*)::int` }).from(incidents).where(and(eq(incidents.status, 'aberta'), eq(incidents.condoId, condoId)))
        : db.select({ count: sql<number>`count(*)::int` }).from(incidents).where(eq(incidents.status, 'aberta')),
      condoId
        ? db.select({ count: sql<number>`count(*)::int` }).from(reservations).where(and(eq(reservations.status, 'confirmada'), eq(reservations.condoId, condoId)))
        : db.select({ count: sql<number>`count(*)::int` }).from(reservations).where(eq(reservations.status, 'confirmada')),
    ]);

    return {
      totalCondos: totalCondosRes[0]?.count || 0,
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
