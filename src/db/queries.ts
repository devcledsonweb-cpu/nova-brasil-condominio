import { and, desc, eq, sql } from 'drizzle-orm';
import { db, createPool } from './index.ts';
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
  securityAgents,
  patrolVehicles,
  companyAssets,
  maintenanceOrders,
  operationalLogs,
} from './schema.ts';
import {
  getStoreAgents,
  createStoreAgent,
  updateStoreAgent,
  deleteStoreAgent,
  getStorePatrolVehicles,
  createStorePatrolVehicle,
  updateStorePatrolVehicle,
  deleteStorePatrolVehicle,
  getStoreCompanyAssets,
  createStoreCompanyAsset,
  updateStoreCompanyAsset,
  deleteStoreCompanyAsset,
  getStoreMaintenances,
  createStoreMaintenance,
  updateStoreMaintenance,
  deleteStoreMaintenance,
  getStoreOperationalLogs,
  createStoreOperationalLog,
  deleteStoreOperationalLog,
  getStoreDashboardStats,
} from './operationalStore.ts';

// Cache auxiliar para nomes de condomínios
async function getCondoNameMap(): Promise<Map<number, string>> {
  const map = new Map<number, string>();
  try {
    const list = await db.select({ id: condominiums.id, name: condominiums.name }).from(condominiums);
    for (const c of list) {
      map.set(c.id, c.name);
    }
  } catch (err) {
    console.warn('getCondoNameMap aviso:', err);
  }
  return map;
}

// --- INICIALIZAÇÃO SEGURA DO BANCO DE DADOS ---
export async function ensureEnterpriseTables() {
  console.log('Tabelas operacionais da NOVA BRASIL prontas e ativas.');
}

// --- GESTÃO DE CONDOMÍNIOS / POSTOS DE ATENDIMENTO ---

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

    const results = list.map((c) => {
      const agents = getStoreAgents(c.id);
      const vehicles = getStorePatrolVehicles(c.id);
      const assets = getStoreCompanyAssets(c.id);
      const maintenances = getStoreMaintenances(c.id);

      return {
        id: c.id,
        name: c.name,
        cnpj: c.cnpj,
        address: c.address,
        city: c.city,
        state: c.state,
        zipCode: c.zipCode,
        totalUnits: c.totalUnits || 0,
        supervisorName: c.sindicoName || 'Supervisor Regional',
        supervisorPhone: c.sindicoPhone || '',
        contractType: c.sindicoEmail || 'Portaria 24h + Ronda Noturna',
        sindicoName: c.sindicoName || 'Supervisor Regional',
        sindicoPhone: c.sindicoPhone || '',
        sindicoEmail: c.sindicoEmail || 'Portaria 24h + Ronda Noturna',
        status: (c.status as 'ativo' | 'inativo' | 'implantacao') || 'ativo',
        createdAt: c.createdAt,
        agentsCount: agents.length,
        vehiclesCount: vehicles.length,
        assetsCount: assets.reduce((acc, curr) => acc + (curr.quantity || 1), 0),
        maintenancesCount: maintenances.filter((m) => m.status === 'agendada' || m.status === 'em_andamento').length,
      };
    });

    return results;
  } catch (error) {
    console.error('getCondominiums failed:', error);
    throw new Error('Falha ao listar condomínios.', { cause: error });
  }
}

export async function getCondominiumById(id: number) {
  try {
    const res = await db.select().from(condominiums).where(eq(condominiums.id, id));
    if (!res || !res[0]) return null;
    const c = res[0];
    return {
      ...c,
      supervisorName: c.sindicoName || 'Supervisor Regional',
      supervisorPhone: c.sindicoPhone || '',
      contractType: c.sindicoEmail || 'Portaria 24h + Ronda Noturna',
    };
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
  supervisorName?: string;
  supervisorPhone?: string;
  contractType?: string;
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
        cnpj: data.cnpj?.trim() || null,
        address: data.address?.trim() || null,
        city: data.city?.trim() || null,
        state: data.state?.trim() || 'SP',
        zipCode: data.zipCode?.trim() || null,
        totalUnits: parseInt(String(data.totalUnits || 0), 10) || 0,
        sindicoName: (data.supervisorName || data.sindicoName)?.trim() || null,
        sindicoPhone: (data.supervisorPhone || data.sindicoPhone)?.trim() || null,
        sindicoEmail: (data.contractType || data.sindicoEmail)?.trim() || 'Portaria 24h + Ronda Noturna',
        status: data.status || 'ativo',
      })
      .returning();

    const c = res[0];
    return {
      ...c,
      supervisorName: c.sindicoName || 'Supervisor Regional',
      supervisorPhone: c.sindicoPhone || '',
      contractType: c.sindicoEmail || 'Portaria 24h + Ronda Noturna',
    };
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
    supervisorName?: string;
    supervisorPhone?: string;
    contractType?: string;
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
    if (data.cnpj !== undefined) updateData.cnpj = data.cnpj?.trim() || null;
    if (data.address !== undefined) updateData.address = data.address?.trim() || null;
    if (data.city !== undefined) updateData.city = data.city?.trim() || null;
    if (data.state !== undefined) updateData.state = data.state?.trim() || null;
    if (data.zipCode !== undefined) updateData.zipCode = data.zipCode?.trim() || null;
    if (data.totalUnits !== undefined) updateData.totalUnits = parseInt(String(data.totalUnits || 0), 10) || 0;
    
    if (data.supervisorName !== undefined || data.sindicoName !== undefined) {
      updateData.sindicoName = (data.supervisorName ?? data.sindicoName)?.trim() || null;
    }
    if (data.supervisorPhone !== undefined || data.sindicoPhone !== undefined) {
      updateData.sindicoPhone = (data.supervisorPhone ?? data.sindicoPhone)?.trim() || null;
    }
    if (data.contractType !== undefined || data.sindicoEmail !== undefined) {
      updateData.sindicoEmail = (data.contractType ?? data.sindicoEmail)?.trim() || 'Portaria 24h + Ronda Noturna';
    }
    if (data.status !== undefined) updateData.status = data.status;

    let res = await db.update(condominiums).set(updateData).where(eq(condominiums.id, id)).returning();
    if (!res || res.length === 0) {
      res = await db
        .insert(condominiums)
        .values({
          name: updateData.name || 'Condomínio',
          cnpj: updateData.cnpj || null,
          address: updateData.address || null,
          city: updateData.city || null,
          state: updateData.state || 'SP',
          zipCode: updateData.zipCode || null,
          totalUnits: updateData.totalUnits || 0,
          sindicoName: updateData.sindicoName || null,
          sindicoPhone: updateData.sindicoPhone || null,
          sindicoEmail: updateData.sindicoEmail || 'Portaria 24h + Ronda Noturna',
          status: updateData.status || 'ativo',
        })
        .returning();
    }
    const c = res[0];
    return {
      ...c,
      supervisorName: c.sindicoName || 'Supervisor Regional',
      supervisorPhone: c.sindicoPhone || '',
      contractType: c.sindicoEmail || 'Portaria 24h + Ronda Noturna',
    };
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

// --- AGENTES DE PORTARIA E EQUIPE OPERACIONAL DA EMPRESA ---

export async function getSecurityAgents(condoId?: number) {
  try {
    const list = getStoreAgents(condoId);
    const condoMap = await getCondoNameMap();
    return list.map((a) => {
      const ids: number[] = Array.isArray(a.condoIds) && a.condoIds.length > 0
        ? a.condoIds
        : (a.condoId ? [a.condoId] : []);
      const names = ids.map((id) => condoMap.get(id)).filter(Boolean) as string[];

      let mainCondoName = 'Operações Regionais';
      if (names.length === 1) {
        mainCondoName = names[0];
      } else if (names.length > 1) {
        mainCondoName = `${names[0]} (+${names.length - 1} postos)`;
      } else if (a.condoId) {
        mainCondoName = condoMap.get(a.condoId) || 'Posto Geral';
      }

      return {
        ...a,
        condoIds: ids,
        condoNames: names,
        condoName: mainCondoName,
      };
    });
  } catch (error) {
    console.error('getSecurityAgents failed:', error);
    return [];
  }
}

export async function createSecurityAgent(data: {
  condoId?: number;
  condoIds?: number[];
  name: string;
  cpf?: string;
  phone: string;
  badgeNumber: string;
  roleTitle?: any;
  shift?: any;
  status?: any;
  admissionDate?: string;
  notes?: string;
}) {
  try {
    const ids: number[] = Array.isArray(data.condoIds) && data.condoIds.length > 0
      ? data.condoIds.map(Number)
      : (data.condoId ? [Number(data.condoId)] : []);
    const primaryCondoId = ids[0] ?? (data.condoId ? Number(data.condoId) : null);

    const newAgent = createStoreAgent({
      condoId: primaryCondoId,
      condoIds: ids,
      name: (data.name || '').trim(),
      cpf: data.cpf ? String(data.cpf).trim() : null,
      phone: (data.phone || '').trim(),
      badgeNumber: (data.badgeNumber || `AG-${Math.floor(1000 + Math.random() * 9000)}`).trim(),
      roleTitle: data.roleTitle || 'agente_portaria',
      shift: data.shift || '12x36_dia',
      status: data.status || 'em_servico',
      admissionDate: data.admissionDate ? String(data.admissionDate).trim() : null,
      notes: data.notes ? String(data.notes).trim() : null,
    });
    const condoMap = await getCondoNameMap();
    const names = ids.map((id) => condoMap.get(id)).filter(Boolean) as string[];
    const mainCondoName = names.length > 1
      ? `${names[0]} (+${names.length - 1} postos)`
      : (names[0] || (newAgent.condoId ? condoMap.get(newAgent.condoId) || 'Posto Geral' : 'Operações Regionais'));

    return {
      ...newAgent,
      condoIds: ids,
      condoNames: names,
      condoName: mainCondoName,
    };
  } catch (error) {
    console.error('createSecurityAgent failed:', error);
    throw new Error('Falha ao cadastrar agente de portaria.', { cause: error });
  }
}

export async function updateSecurityAgent(id: number, data: Partial<{
  condoId?: number;
  condoIds?: number[];
  name?: string;
  cpf?: string;
  phone?: string;
  badgeNumber?: string;
  roleTitle?: any;
  shift?: any;
  status?: any;
  admissionDate?: string;
  notes?: string;
}>) {
  try {
    const safeData: any = { ...data };
    if (data.name !== undefined) safeData.name = (data.name || '').trim();
    if (data.phone !== undefined) safeData.phone = (data.phone || '').trim();
    if (data.badgeNumber !== undefined) safeData.badgeNumber = (data.badgeNumber || '').trim();
    if (data.condoIds !== undefined && Array.isArray(data.condoIds)) {
      safeData.condoIds = data.condoIds.map(Number);
      safeData.condoId = safeData.condoIds[0] ?? null;
    } else if (data.condoId !== undefined) {
      safeData.condoId = data.condoId ? Number(data.condoId) : null;
      safeData.condoIds = safeData.condoId ? [safeData.condoId] : [];
    }
    const updated = updateStoreAgent(id, safeData);
    const condoMap = await getCondoNameMap();
    const ids: number[] = Array.isArray(updated.condoIds) && updated.condoIds.length > 0
      ? updated.condoIds
      : (updated.condoId ? [updated.condoId] : []);
    const names = ids.map((cid) => condoMap.get(cid)).filter(Boolean) as string[];
    const mainCondoName = names.length > 1
      ? `${names[0]} (+${names.length - 1} postos)`
      : (names[0] || (updated.condoId ? condoMap.get(updated.condoId) || 'Posto Geral' : 'Operações Regionais'));

    return {
      ...updated,
      condoIds: ids,
      condoNames: names,
      condoName: mainCondoName,
    };
  } catch (error) {
    console.error('updateSecurityAgent failed:', error);
    throw new Error('Falha ao atualizar agente.', { cause: error });
  }
}

export async function deleteSecurityAgent(id: number) {
  try {
    deleteStoreAgent(id);
    return { success: true };
  } catch (error) {
    console.error('deleteSecurityAgent failed:', error);
    throw new Error('Falha ao remover agente.', { cause: error });
  }
}

// --- VEÍCULOS DE RONDA DA EMPRESA (MOTO, CARRO, ETC.) ---

export async function getPatrolVehicles(condoId?: number) {
  try {
    const list = getStorePatrolVehicles(condoId);
    const condoMap = await getCondoNameMap();
    return list.map((v) => ({
      ...v,
      condoName: v.condoId ? (condoMap.get(v.condoId) || 'Posto Geral') : 'Frota Geral',
    }));
  } catch (error) {
    console.error('getPatrolVehicles failed:', error);
    return [];
  }
}

export async function createPatrolVehicle(data: {
  condoId?: number;
  type?: any;
  plate: string;
  model: string;
  brand?: string;
  color?: string;
  currentKm?: number;
  driverName?: string;
  status?: any;
  routeDescription?: string;
  lastPatrolAt?: string;
}) {
  try {
    const newVehicle = createStorePatrolVehicle({
      condoId: data.condoId ? Number(data.condoId) : null,
      type: data.type || 'moto',
      plate: data.plate.trim().toUpperCase(),
      model: data.model.trim(),
      brand: data.brand?.trim() || null,
      color: data.color?.trim() || 'Preto',
      currentKm: parseInt(String(data.currentKm || 0), 10) || 0,
      driverName: data.driverName?.trim() || null,
      status: data.status || 'em_ronda',
      routeDescription: data.routeDescription?.trim() || null,
      lastPatrolAt: data.lastPatrolAt?.trim() || ('Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })),
    });
    const condoMap = await getCondoNameMap();
    return {
      ...newVehicle,
      condoName: newVehicle.condoId ? (condoMap.get(newVehicle.condoId) || 'Posto Geral') : 'Frota Geral',
    };
  } catch (error) {
    console.error('createPatrolVehicle failed:', error);
    throw new Error('Falha ao cadastrar veículo de ronda.', { cause: error });
  }
}

export async function updatePatrolVehicle(id: number, data: Partial<{
  condoId?: number;
  type?: any;
  plate?: string;
  model?: string;
  brand?: string;
  color?: string;
  currentKm?: number;
  driverName?: string;
  status?: any;
  routeDescription?: string;
  lastPatrolAt?: string;
}>) {
  try {
    const updated = updateStorePatrolVehicle(id, data);
    const condoMap = await getCondoNameMap();
    return {
      ...updated,
      condoName: updated.condoId ? (condoMap.get(updated.condoId) || 'Posto Geral') : 'Frota Geral',
    };
  } catch (error) {
    console.error('updatePatrolVehicle failed:', error);
    throw new Error('Falha ao atualizar veículo de ronda.', { cause: error });
  }
}

export async function deletePatrolVehicle(id: number) {
  try {
    deleteStorePatrolVehicle(id);
    return { success: true };
  } catch (error) {
    console.error('deletePatrolVehicle failed:', error);
    throw new Error('Falha ao excluir veículo de ronda.', { cause: error });
  }
}

// --- MATERIAIS E PATRIMÔNIO DA EMPRESA NO CONDOMÍNIO ---

export async function getCompanyAssets(condoId?: number) {
  try {
    const list = getStoreCompanyAssets(condoId);
    const condoMap = await getCondoNameMap();
    return list.map((a) => ({
      ...a,
      condoName: a.condoId ? (condoMap.get(a.condoId) || 'Posto Geral') : 'Almoxarifado Central',
    }));
  } catch (error) {
    console.error('getCompanyAssets failed:', error);
    return [];
  }
}

export async function createCompanyAsset(data: {
  condoId?: number;
  name: string;
  category?: any;
  assetTag?: string;
  serialNumber?: string;
  quantity?: number;
  condition?: any;
  deliveryDate?: string;
  responsibleAgent?: string;
  notes?: string;
}) {
  try {
    const newAsset = createStoreCompanyAsset({
      condoId: data.condoId ? Number(data.condoId) : null,
      name: data.name.trim(),
      category: data.category || 'comunicacao',
      assetTag: data.assetTag?.trim() || null,
      serialNumber: data.serialNumber?.trim() || null,
      quantity: parseInt(String(data.quantity || 1), 10) || 1,
      condition: data.condition || 'bom',
      deliveryDate: data.deliveryDate?.trim() || null,
      responsibleAgent: data.responsibleAgent?.trim() || null,
      notes: data.notes?.trim() || null,
    });
    const condoMap = await getCondoNameMap();
    return {
      ...newAsset,
      condoName: newAsset.condoId ? (condoMap.get(newAsset.condoId) || 'Posto Geral') : 'Almoxarifado Central',
    };
  } catch (error) {
    console.error('createCompanyAsset failed:', error);
    throw new Error('Falha ao cadastrar material da empresa.', { cause: error });
  }
}

export async function updateCompanyAsset(id: number, data: Partial<{
  condoId?: number;
  name?: string;
  category?: any;
  assetTag?: string;
  serialNumber?: string;
  quantity?: number;
  condition?: any;
  deliveryDate?: string;
  responsibleAgent?: string;
  notes?: string;
}>) {
  try {
    const updated = updateStoreCompanyAsset(id, data);
    const condoMap = await getCondoNameMap();
    return {
      ...updated,
      condoName: updated.condoId ? (condoMap.get(updated.condoId) || 'Posto Geral') : 'Almoxarifado Central',
    };
  } catch (error) {
    console.error('updateCompanyAsset failed:', error);
    throw new Error('Falha ao atualizar material.', { cause: error });
  }
}

export async function deleteCompanyAsset(id: number) {
  try {
    deleteStoreCompanyAsset(id);
    return { success: true };
  } catch (error) {
    console.error('deleteCompanyAsset failed:', error);
    throw new Error('Falha ao excluir material.', { cause: error });
  }
}

// --- MANUTENÇÕES REALIZADAS PELA EMPRESA NO CONDOMÍNIO ---

export async function getMaintenanceOrders(condoId?: number) {
  try {
    const list = getStoreMaintenances(condoId);
    const condoMap = await getCondoNameMap();
    return list.map((m) => ({
      ...m,
      condoName: m.condoId ? (condoMap.get(m.condoId) || 'Posto Geral') : 'Contrato Geral',
    }));
  } catch (error) {
    console.error('getMaintenanceOrders failed:', error);
    return [];
  }
}

export async function createMaintenanceOrder(data: {
  condoId?: number;
  title: string;
  category?: any;
  maintenanceType?: any;
  technicianName: string;
  scheduledDate: string;
  completedDate?: string;
  cost?: string;
  status?: any;
  description: string;
  solutionDetails?: string;
}) {
  try {
    const newM = createStoreMaintenance({
      condoId: data.condoId ? Number(data.condoId) : null,
      title: data.title.trim(),
      category: data.category || 'portoes',
      maintenanceType: data.maintenanceType || 'preventiva',
      technicianName: data.technicianName.trim(),
      scheduledDate: data.scheduledDate.trim(),
      completedDate: data.completedDate?.trim() || null,
      cost: data.cost?.trim() || 'R$ 0,00',
      status: data.status || 'agendada',
      description: data.description.trim(),
      solutionDetails: data.solutionDetails?.trim() || null,
    });
    const condoMap = await getCondoNameMap();
    return {
      ...newM,
      condoName: newM.condoId ? (condoMap.get(newM.condoId) || 'Posto Geral') : 'Contrato Geral',
    };
  } catch (error) {
    console.error('createMaintenanceOrder failed:', error);
    throw new Error('Falha ao cadastrar ordem de manutenção.', { cause: error });
  }
}

export async function updateMaintenanceOrder(id: number, data: Partial<{
  condoId?: number;
  title?: string;
  category?: any;
  maintenanceType?: any;
  technicianName?: string;
  scheduledDate?: string;
  completedDate?: string;
  cost?: string;
  status?: any;
  description?: string;
  solutionDetails?: string;
}>) {
  try {
    const updated = updateStoreMaintenance(id, data);
    const condoMap = await getCondoNameMap();
    return {
      ...updated,
      condoName: updated.condoId ? (condoMap.get(updated.condoId) || 'Posto Geral') : 'Contrato Geral',
    };
  } catch (error) {
    console.error('updateMaintenanceOrder failed:', error);
    throw new Error('Falha ao atualizar manutenção.', { cause: error });
  }
}

export async function deleteMaintenanceOrder(id: number) {
  try {
    deleteStoreMaintenance(id);
    return { success: true };
  } catch (error) {
    console.error('deleteMaintenanceOrder failed:', error);
    throw new Error('Falha ao excluir manutenção.', { cause: error });
  }
}

// --- LIVRO DE OCORRÊNCIAS OPERACIONAIS E PASSAGEM DE TURNO ---

export async function getOperationalLogs(condoId?: number) {
  try {
    const list = getStoreOperationalLogs(condoId);
    const condoMap = await getCondoNameMap();
    return list.map((l) => ({
      ...l,
      condoName: l.condoId ? (condoMap.get(l.condoId) || 'Posto Geral') : 'Supervisão Geral',
    }));
  } catch (error) {
    console.error('getOperationalLogs failed:', error);
    return [];
  }
}

export async function createOperationalLog(data: {
  condoId?: number;
  agentName: string;
  shiftType?: any;
  logType?: any;
  severity?: any;
  status?: any;
  title: string;
  description: string;
  actionTaken?: string;
  logDate: string;
  logTime: string;
}) {
  try {
    const newLog = createStoreOperationalLog({
      condoId: data.condoId ? Number(data.condoId) : null,
      agentName: data.agentName.trim(),
      shiftType: data.shiftType || 'dia',
      logType: data.logType || 'passagem_turno',
      severity: data.severity || 'informativa',
      status: data.status || 'resolvida',
      title: data.title.trim(),
      description: data.description.trim(),
      actionTaken: data.actionTaken?.trim() || null,
      logDate: data.logDate.trim(),
      logTime: data.logTime.trim(),
    });
    const condoMap = await getCondoNameMap();
    return {
      ...newLog,
      condoName: newLog.condoId ? (condoMap.get(newLog.condoId) || 'Posto Geral') : 'Supervisão Geral',
    };
  } catch (error) {
    console.error('createOperationalLog failed:', error);
    throw new Error('Falha ao registrar ocorrência operacional.', { cause: error });
  }
}

export async function deleteOperationalLog(id: number) {
  try {
    deleteStoreOperationalLog(id);
    return { success: true };
  } catch (error) {
    console.error('deleteOperationalLog failed:', error);
    throw new Error('Falha ao excluir registro operacional.', { cause: error });
  }
}

// --- ESTATÍSTICAS DO PAINEL OPERACIONAL DA EMPRESA ---

export async function getDashboardStats(condoId?: number) {
  try {
    let totalCondos = 0;
    try {
      const res = await db.select({ count: sql<number>`count(*)::int` }).from(condominiums);
      totalCondos = res[0]?.count || 0;
    } catch {
      totalCondos = 0;
    }

    const opStats = getStoreDashboardStats(condoId);

    return {
      totalCondos,
      ...opStats,
    };
  } catch (error) {
    console.error('getDashboardStats failed:', error);
    return {
      totalCondos: 0,
      totalAgents: 0,
      agentsOnDuty: 0,
      totalPatrolVehicles: 0,
      activePatrolVehicles: 0,
      totalAssets: 0,
      pendingMaintenances: 0,
      completedMaintenances: 0,
      todayLogs: 0,
    };
  }
}

