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
// Operações migradas 100% para o Cloud SQL PostgreSQL centralizado

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

function parseCondoStations(c: any) {
  let stations = c.service_stations;
  if (typeof stations === 'string') {
    try {
      stations = JSON.parse(stations);
    } catch {
      stations = [];
    }
  }
  if (!Array.isArray(stations) || stations.length === 0) {
    stations = [
      {
        id: `st-${c.id}-1`,
        condoId: c.id,
        name: 'Portaria Principal (Social)',
        type: 'portaria_principal',
        shiftSchedule: '12x36 Diurno (06h às 18h)',
        assignedAgentName: null,
      },
      {
        id: `st-${c.id}-2`,
        condoId: c.id,
        name: 'Área de Lazer / Piscina',
        type: 'area_lazer',
        shiftSchedule: '12x36 Diurno',
        assignedAgentName: null,
      },
    ];
  }
  return stations;
}

function parseCondoPosts(c: any, stations: any[]) {
  if (Array.isArray(c.service_posts) && c.service_posts.length > 0) {
    return c.service_posts;
  }
  if (stations && stations.length > 0) {
    return stations.map((s: any) => s.name);
  }
  return ['Portaria Principal (Social)', 'Garagem / Portões', 'Área de Lazer / Piscina', 'Ronda Perimetral'];
}

export async function getCondominiums() {
  const pool = createPool();
  try {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.cnpj,
        c.address,
        c.city,
        c.state,
        c.zip_code,
        c.total_units,
        c.sindico_name,
        c.sindico_phone,
        c.sindico_email,
        c.status,
        c.image_url,
        c.service_posts,
        c.service_stations,
        c.created_at,
        (SELECT count(*)::int FROM security_agents a WHERE a.condo_id = c.id OR c.id = ANY(a.condo_ids)) AS agents_count,
        (SELECT count(*)::int FROM patrol_vehicles v WHERE v.condo_id = c.id) AS vehicles_count,
        (SELECT COALESCE(sum(quantity), 0)::int FROM company_assets s WHERE s.condo_id = c.id) AS assets_count,
        (SELECT count(*)::int FROM maintenance_orders m WHERE m.condo_id = c.id AND m.status IN ('agendada', 'em_andamento')) AS maintenances_count
      FROM condominiums c
      ORDER BY c.name ASC
    `;
    const res = await pool.query(query);

    return res.rows.map((c: any) => {
      const stations = parseCondoStations(c);
      const posts = parseCondoPosts(c, stations);
      return {
        id: c.id,
        name: c.name,
        cnpj: c.cnpj,
        address: c.address,
        city: c.city,
        state: c.state,
        zipCode: c.zip_code,
        totalUnits: c.total_units || 0,
        supervisorName: c.sindico_name || 'Supervisor Regional',
        supervisorPhone: c.sindico_phone || '',
        contractType: c.sindico_email || 'Portaria 24h + Ronda Noturna',
        sindicoName: c.sindico_name || 'Supervisor Regional',
        sindicoPhone: c.sindico_phone || '',
        sindicoEmail: c.sindico_email || 'Portaria 24h + Ronda Noturna',
        status: (c.status as 'ativo' | 'inativo' | 'implantacao') || 'ativo',
        photoUrl: c.image_url || null,
        imageUrl: c.image_url || null,
        servicePosts: posts,
        serviceStations: stations,
        createdAt: c.created_at,
        agentsCount: c.agents_count || 0,
        vehiclesCount: c.vehicles_count || 0,
        assetsCount: c.assets_count || 0,
        maintenancesCount: c.maintenances_count || 0,
      };
    });
  } catch (error) {
    console.error('getCondominiums failed:', error);
    throw new Error('Falha ao listar condomínios.', { cause: error });
  }
}

export async function getCondominiumById(id: number) {
  const pool = createPool();
  try {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.cnpj,
        c.address,
        c.city,
        c.state,
        c.zip_code,
        c.total_units,
        c.sindico_name,
        c.sindico_phone,
        c.sindico_email,
        c.status,
        c.image_url,
        c.service_posts,
        c.service_stations,
        c.created_at,
        (SELECT count(*)::int FROM security_agents a WHERE a.condo_id = c.id OR c.id = ANY(a.condo_ids)) AS agents_count,
        (SELECT count(*)::int FROM patrol_vehicles v WHERE v.condo_id = c.id) AS vehicles_count,
        (SELECT COALESCE(sum(quantity), 0)::int FROM company_assets s WHERE s.condo_id = c.id) AS assets_count,
        (SELECT count(*)::int FROM maintenance_orders m WHERE m.condo_id = c.id AND m.status IN ('agendada', 'em_andamento')) AS maintenances_count
      FROM condominiums c
      WHERE c.id = $1
    `;
    const res = await pool.query(query, [id]);
    if (res.rows.length === 0) return null;
    const c = res.rows[0];
    const stations = parseCondoStations(c);
    const posts = parseCondoPosts(c, stations);

    return {
      id: c.id,
      name: c.name,
      cnpj: c.cnpj,
      address: c.address,
      city: c.city,
      state: c.state,
      zipCode: c.zip_code,
      totalUnits: c.total_units || 0,
      supervisorName: c.sindico_name || 'Supervisor Regional',
      supervisorPhone: c.sindico_phone || '',
      contractType: c.sindico_email || 'Portaria 24h + Ronda Noturna',
      sindicoName: c.sindico_name || 'Supervisor Regional',
      sindicoPhone: c.sindico_phone || '',
      sindicoEmail: c.sindico_email || 'Portaria 24h + Ronda Noturna',
      status: (c.status as 'ativo' | 'inativo' | 'implantacao') || 'ativo',
      photoUrl: c.image_url || null,
      imageUrl: c.image_url || null,
      servicePosts: posts,
      serviceStations: stations,
      createdAt: c.created_at,
      agentsCount: c.agents_count || 0,
      vehiclesCount: c.vehicles_count || 0,
      assetsCount: c.assets_count || 0,
      maintenancesCount: c.maintenances_count || 0,
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
  photoUrl?: string;
  imageUrl?: string;
  servicePosts?: string[];
  serviceStations?: any[];
}) {
  const pool = createPool();
  try {
    const photo = data.imageUrl?.trim() || data.photoUrl?.trim() || null;
    const initialStations = data.serviceStations && Array.isArray(data.serviceStations) && data.serviceStations.length > 0
      ? data.serviceStations
      : [
          {
            id: `st-new-1`,
            name: 'Portaria Principal (Social)',
            type: 'portaria_principal',
            shiftSchedule: '12x36 Diurno (06h às 18h)',
            assignedAgentName: null,
          },
          {
            id: `st-new-2`,
            name: 'Área de Lazer / Piscina',
            type: 'area_lazer',
            shiftSchedule: '12x36 Diurno',
            assignedAgentName: null,
          },
        ];

    const posts = data.servicePosts && Array.isArray(data.servicePosts) && data.servicePosts.length > 0
      ? data.servicePosts
      : initialStations.map((s: any) => s.name);

    const insertSql = `
      INSERT INTO condominiums (
        name, cnpj, address, city, state, zip_code, total_units,
        sindico_name, sindico_phone, sindico_email, status,
        image_url, service_stations, service_posts
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `;

    const res = await pool.query(insertSql, [
      data.name.trim(),
      data.cnpj?.trim() || null,
      data.address?.trim() || null,
      data.city?.trim() || null,
      data.state?.trim() || 'SP',
      data.zipCode?.trim() || null,
      parseInt(String(data.totalUnits || 0), 10) || 0,
      (data.supervisorName || data.sindicoName)?.trim() || null,
      (data.supervisorPhone || data.sindicoPhone)?.trim() || null,
      (data.contractType || data.sindicoEmail)?.trim() || 'Portaria 24h + Ronda Noturna',
      data.status || 'ativo',
      photo,
      JSON.stringify(initialStations),
      posts,
    ]);

    const c = res.rows[0];
    const stations = parseCondoStations(c);

    return {
      id: c.id,
      name: c.name,
      cnpj: c.cnpj,
      address: c.address,
      city: c.city,
      state: c.state,
      zipCode: c.zip_code,
      totalUnits: c.total_units || 0,
      supervisorName: c.sindico_name || 'Supervisor Regional',
      supervisorPhone: c.sindico_phone || '',
      contractType: c.sindico_email || 'Portaria 24h + Ronda Noturna',
      sindicoName: c.sindico_name || 'Supervisor Regional',
      sindicoPhone: c.sindico_phone || '',
      sindicoEmail: c.sindico_email || 'Portaria 24h + Ronda Noturna',
      status: (c.status as 'ativo' | 'inativo' | 'implantacao') || 'ativo',
      photoUrl: c.image_url || null,
      imageUrl: c.image_url || null,
      servicePosts: parseCondoPosts(c, stations),
      serviceStations: stations,
      createdAt: c.created_at,
      agentsCount: 0,
      vehiclesCount: 0,
      assetsCount: 0,
      maintenancesCount: 0,
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
    photoUrl?: string;
    imageUrl?: string;
    servicePosts?: string[];
    serviceStations?: any[];
  }
) {
  const pool = createPool();
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name.trim());
    }
    if (data.cnpj !== undefined) {
      fields.push(`cnpj = $${idx++}`);
      values.push(data.cnpj?.trim() || null);
    }
    if (data.address !== undefined) {
      fields.push(`address = $${idx++}`);
      values.push(data.address?.trim() || null);
    }
    if (data.city !== undefined) {
      fields.push(`city = $${idx++}`);
      values.push(data.city?.trim() || null);
    }
    if (data.state !== undefined) {
      fields.push(`state = $${idx++}`);
      values.push(data.state?.trim() || null);
    }
    if (data.zipCode !== undefined) {
      fields.push(`zip_code = $${idx++}`);
      values.push(data.zipCode?.trim() || null);
    }
    if (data.totalUnits !== undefined) {
      fields.push(`total_units = $${idx++}`);
      values.push(parseInt(String(data.totalUnits || 0), 10) || 0);
    }
    if (data.supervisorName !== undefined || data.sindicoName !== undefined) {
      fields.push(`sindico_name = $${idx++}`);
      values.push((data.supervisorName ?? data.sindicoName)?.trim() || null);
    }
    if (data.supervisorPhone !== undefined || data.sindicoPhone !== undefined) {
      fields.push(`sindico_phone = $${idx++}`);
      values.push((data.supervisorPhone ?? data.sindicoPhone)?.trim() || null);
    }
    if (data.contractType !== undefined || data.sindicoEmail !== undefined) {
      fields.push(`sindico_email = $${idx++}`);
      values.push((data.contractType ?? data.sindicoEmail)?.trim() || 'Portaria 24h + Ronda Noturna');
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    const photo = data.imageUrl !== undefined ? data.imageUrl?.trim() : data.photoUrl?.trim();
    if (photo !== undefined) {
      fields.push(`image_url = $${idx++}`);
      values.push(photo || null);
    }
    if (data.serviceStations !== undefined) {
      fields.push(`service_stations = $${idx++}`);
      values.push(JSON.stringify(data.serviceStations));
    }
    if (data.servicePosts !== undefined) {
      fields.push(`service_posts = $${idx++}`);
      values.push(data.servicePosts);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE condominiums SET ${fields.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    return await getCondominiumById(id);
  } catch (error) {
    console.error('updateCondominium failed:', error);
    throw new Error('Falha ao atualizar condomínio.', { cause: error });
  }
}

export async function deleteCondominium(id: number) {
  const pool = createPool();
  try {
    // Cascata completa em todas as tabelas com referência ao condomínio
    await pool.query('DELETE FROM shift_coverages WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM operational_logs WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM maintenance_orders WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM company_assets WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM patrol_vehicles WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM security_agents WHERE condo_id = $1 OR $1 = ANY(condo_ids)', [id]);
    await pool.query('DELETE FROM access_logs WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM deliveries WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM incidents WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM reservations WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM common_areas WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM announcements WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM poll_votes WHERE poll_id IN (SELECT id FROM polls WHERE condo_id = $1)', [id]);
    await pool.query('DELETE FROM poll_options WHERE poll_id IN (SELECT id FROM polls WHERE condo_id = $1)', [id]);
    await pool.query('DELETE FROM polls WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM vehicles WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM residents WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM units WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM blocks WHERE condo_id = $1', [id]);
    await pool.query('UPDATE users SET condo_id = NULL WHERE condo_id = $1', [id]);
    await pool.query('DELETE FROM condominiums WHERE id = $1', [id]);
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
      const updated = await db
        .update(users)
        .set({
          name: data.name.trim(),
          password: data.password,
          role: data.role,
          permissions: data.permissions || (data.role === 'sindico' ? '["all"]' : '["portaria","encomendas","acessos","veiculos"]'),
          condoId: data.condoId !== undefined ? data.condoId : existing[0].condoId,
          isActive: true,
        })
        .where(eq(users.email, cleanEmail))
        .returning();

      return {
        id: updated[0].id,
        uid: updated[0].uid,
        email: updated[0].email,
        name: updated[0].name,
        role: updated[0].role,
        permissions: updated[0].permissions,
        condoId: updated[0].condoId,
        isActive: updated[0].isActive,
      };
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

function formatAgentRow(r: any, condoMap: Map<number, string>) {
  const ids: number[] = Array.isArray(r.condo_ids) && r.condo_ids.length > 0
    ? r.condo_ids
    : (r.condo_id ? [r.condo_id] : []);
  const names = ids.map((id) => condoMap.get(id)).filter(Boolean) as string[];

  let mainCondoName = 'Operações Regionais';
  if (names.length === 1) {
    mainCondoName = names[0];
  } else if (names.length > 1) {
    mainCondoName = `${names[0]} (+${names.length - 1} postos)`;
  } else if (r.condo_id) {
    mainCondoName = condoMap.get(r.condo_id) || 'Posto Geral';
  }

  return {
    id: r.id,
    condoId: r.condo_id,
    condoIds: ids,
    condoNames: names,
    condoName: mainCondoName,
    name: r.name,
    cpf: r.cpf,
    phone: r.phone,
    badgeNumber: r.badge_number,
    roleTitle: r.role_title,
    shift: r.shift,
    status: r.status,
    admissionDate: r.admission_date,
    notes: r.notes,
    createdAt: r.created_at,
    photoUrl: r.photo_url,
    servicePost: r.assigned_station,
    assignedStation: r.assigned_station,
    assignedStationId: r.assigned_station_id,
  };
}

export async function getSecurityAgents(condoId?: number) {
  const pool = createPool();
  try {
    const condoMap = await getCondoNameMap();
    let query = 'SELECT * FROM security_agents ORDER BY name ASC';
    const params: any[] = [];
    if (condoId) {
      query = 'SELECT * FROM security_agents WHERE condo_id = $1 OR $1 = ANY(condo_ids) ORDER BY name ASC';
      params.push(condoId);
    }
    const res = await pool.query(query, params);
    return res.rows.map((r: any) => formatAgentRow(r, condoMap));
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
  servicePost?: string;
  assignedStation?: string;
  assignedStationId?: string;
  photoUrl?: string;
  admissionDate?: string;
  notes?: string;
}) {
  const pool = createPool();
  try {
    const ids: number[] = Array.isArray(data.condoIds) && data.condoIds.length > 0
      ? data.condoIds.map(Number)
      : (data.condoId ? [Number(data.condoId)] : []);
    const primaryCondoId = ids[0] ?? (data.condoId ? Number(data.condoId) : null);
    const badge = (data.badgeNumber || `AG-${Math.floor(1000 + Math.random() * 9000)}`).trim();
    const station = data.assignedStation?.trim() || data.servicePost?.trim() || null;

    const res = await pool.query(
      `INSERT INTO security_agents (
        condo_id, condo_ids, name, cpf, phone, badge_number,
        role_title, shift, status, admission_date, notes,
        photo_url, assigned_station, assigned_station_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        primaryCondoId,
        ids,
        data.name.trim(),
        data.cpf ? String(data.cpf).trim() : null,
        data.phone.trim(),
        badge,
        data.roleTitle || 'agente_portaria',
        data.shift || '12x36_dia',
        data.status || 'em_servico',
        data.admissionDate ? String(data.admissionDate).trim() : null,
        data.notes ? String(data.notes).trim() : null,
        data.photoUrl?.trim() || null,
        station,
        data.assignedStationId?.trim() || null,
      ]
    );

    const condoMap = await getCondoNameMap();
    return formatAgentRow(res.rows[0], condoMap);
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
  servicePost?: string;
  assignedStation?: string;
  assignedStationId?: string;
  photoUrl?: string;
  admissionDate?: string;
  notes?: string;
}>) {
  const pool = createPool();
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name.trim());
    }
    if (data.cpf !== undefined) {
      fields.push(`cpf = $${idx++}`);
      values.push(data.cpf ? String(data.cpf).trim() : null);
    }
    if (data.phone !== undefined) {
      fields.push(`phone = $${idx++}`);
      values.push(data.phone.trim());
    }
    if (data.badgeNumber !== undefined) {
      fields.push(`badge_number = $${idx++}`);
      values.push(data.badgeNumber.trim());
    }
    if (data.roleTitle !== undefined) {
      fields.push(`role_title = $${idx++}`);
      values.push(data.roleTitle);
    }
    if (data.shift !== undefined) {
      fields.push(`shift = $${idx++}`);
      values.push(data.shift);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.assignedStation !== undefined || data.servicePost !== undefined) {
      fields.push(`assigned_station = $${idx++}`);
      values.push(data.assignedStation?.trim() || data.servicePost?.trim() || null);
    }
    if (data.assignedStationId !== undefined) {
      fields.push(`assigned_station_id = $${idx++}`);
      values.push(data.assignedStationId?.trim() || null);
    }
    if (data.photoUrl !== undefined) {
      fields.push(`photo_url = $${idx++}`);
      values.push(data.photoUrl?.trim() || null);
    }
    if (data.admissionDate !== undefined) {
      fields.push(`admission_date = $${idx++}`);
      values.push(data.admissionDate ? String(data.admissionDate).trim() : null);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(data.notes ? String(data.notes).trim() : null);
    }
    if (data.condoIds !== undefined && Array.isArray(data.condoIds)) {
      const ids = data.condoIds.map(Number);
      fields.push(`condo_ids = $${idx++}`);
      values.push(ids);
      fields.push(`condo_id = $${idx++}`);
      values.push(ids[0] ?? null);
    } else if (data.condoId !== undefined) {
      const cid = data.condoId ? Number(data.condoId) : null;
      fields.push(`condo_id = $${idx++}`);
      values.push(cid);
      fields.push(`condo_ids = $${idx++}`);
      values.push(cid ? [cid] : []);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE security_agents SET ${fields.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    const res = await pool.query('SELECT * FROM security_agents WHERE id = $1', [id]);
    if (res.rows.length === 0) throw new Error('Agente não encontrado.');
    const condoMap = await getCondoNameMap();
    return formatAgentRow(res.rows[0], condoMap);
  } catch (error) {
    console.error('updateSecurityAgent failed:', error);
    throw new Error('Falha ao atualizar agente.', { cause: error });
  }
}

export async function deleteSecurityAgent(id: number) {
  const pool = createPool();
  try {
    await pool.query('DELETE FROM security_agents WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    console.error('deleteSecurityAgent failed:', error);
    throw new Error('Falha ao remover agente.', { cause: error });
  }
}

// --- VEÍCULOS DE RONDA DA EMPRESA (MOTO, CARRO, ETC.) ---

function formatVehicleRow(r: any, condoMap: Map<number, string>) {
  return {
    id: r.id,
    condoId: r.condo_id,
    condoName: r.condo_id ? (condoMap.get(r.condo_id) || 'Posto Geral') : 'Frota Geral',
    type: r.type,
    plate: r.plate,
    model: r.model,
    brand: r.brand,
    color: r.color,
    currentKm: r.current_km || 0,
    driverName: r.driver_name,
    activeDriver: r.active_driver,
    checkoutKm: r.checkout_km,
    checkoutFuel: r.checkout_fuel,
    checkoutAt: r.checkout_at,
    checkoutChecklist: Array.isArray(r.checkout_checklist) ? r.checkout_checklist : [],
    status: r.status,
    routeDescription: r.route_description,
    lastPatrolAt: r.last_patrol_at,
    photoUrl: r.photo_url,
    createdAt: r.created_at,
  };
}

export async function getPatrolVehicles(condoId?: number) {
  const pool = createPool();
  try {
    const condoMap = await getCondoNameMap();
    let query = 'SELECT * FROM patrol_vehicles ORDER BY id DESC';
    const params: any[] = [];
    if (condoId) {
      query = 'SELECT * FROM patrol_vehicles WHERE condo_id = $1 ORDER BY id DESC';
      params.push(condoId);
    }
    const res = await pool.query(query, params);
    return res.rows.map((r: any) => formatVehicleRow(r, condoMap));
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
  activeDriver?: string;
  checkoutKm?: number;
  checkoutFuel?: string;
  checkoutAt?: string;
  checkoutChecklist?: string[];
  status?: any;
  routeDescription?: string;
  lastPatrolAt?: string;
  photoUrl?: string;
}) {
  const pool = createPool();
  try {
    const res = await pool.query(
      `INSERT INTO patrol_vehicles (
        condo_id, type, plate, model, brand, color, current_km,
        driver_name, active_driver, checkout_km, checkout_fuel,
        checkout_at, checkout_checklist, status, route_description,
        last_patrol_at, photo_url
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        data.condoId ? Number(data.condoId) : null,
        data.type || 'moto',
        data.plate.trim().toUpperCase(),
        data.model.trim(),
        data.brand?.trim() || null,
        data.color?.trim() || 'Preto',
        parseInt(String(data.currentKm || 0), 10) || 0,
        data.driverName?.trim() || null,
        data.activeDriver?.trim() || null,
        data.checkoutKm !== undefined && data.checkoutKm !== null ? Number(data.checkoutKm) : null,
        data.checkoutFuel || null,
        data.checkoutAt || null,
        Array.isArray(data.checkoutChecklist) ? data.checkoutChecklist : [],
        data.status || 'disponivel',
        data.routeDescription?.trim() || null,
        data.lastPatrolAt?.trim() || ('Hoje às ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })),
        data.photoUrl?.trim() || null,
      ]
    );

    const condoMap = await getCondoNameMap();
    return formatVehicleRow(res.rows[0], condoMap);
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
  activeDriver?: string;
  checkoutKm?: number | null;
  checkoutFuel?: string | null;
  checkoutAt?: string | null;
  checkoutChecklist?: string[];
  status?: any;
  routeDescription?: string;
  lastPatrolAt?: string;
  photoUrl?: string;
}>) {
  const pool = createPool();
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.condoId !== undefined) {
      fields.push(`condo_id = $${idx++}`);
      values.push(data.condoId ? Number(data.condoId) : null);
    }
    if (data.type !== undefined) {
      fields.push(`type = $${idx++}`);
      values.push(data.type);
    }
    if (data.plate !== undefined) {
      fields.push(`plate = $${idx++}`);
      values.push(data.plate.trim().toUpperCase());
    }
    if (data.model !== undefined) {
      fields.push(`model = $${idx++}`);
      values.push(data.model.trim());
    }
    if (data.brand !== undefined) {
      fields.push(`brand = $${idx++}`);
      values.push(data.brand?.trim() || null);
    }
    if (data.color !== undefined) {
      fields.push(`color = $${idx++}`);
      values.push(data.color?.trim() || 'Preto');
    }
    if (data.currentKm !== undefined) {
      fields.push(`current_km = $${idx++}`);
      values.push(parseInt(String(data.currentKm || 0), 10) || 0);
    }
    if (data.driverName !== undefined) {
      fields.push(`driver_name = $${idx++}`);
      values.push(data.driverName?.trim() || null);
    }
    if (data.activeDriver !== undefined) {
      fields.push(`active_driver = $${idx++}`);
      values.push(data.activeDriver?.trim() || null);
    }
    if (data.checkoutKm !== undefined) {
      fields.push(`checkout_km = $${idx++}`);
      values.push(data.checkoutKm !== null ? Number(data.checkoutKm) : null);
    }
    if (data.checkoutFuel !== undefined) {
      fields.push(`checkout_fuel = $${idx++}`);
      values.push(data.checkoutFuel || null);
    }
    if (data.checkoutAt !== undefined) {
      fields.push(`checkout_at = $${idx++}`);
      values.push(data.checkoutAt || null);
    }
    if (data.checkoutChecklist !== undefined) {
      fields.push(`checkout_checklist = $${idx++}`);
      values.push(Array.isArray(data.checkoutChecklist) ? data.checkoutChecklist : []);
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.routeDescription !== undefined) {
      fields.push(`route_description = $${idx++}`);
      values.push(data.routeDescription?.trim() || null);
    }
    if (data.lastPatrolAt !== undefined) {
      fields.push(`last_patrol_at = $${idx++}`);
      values.push(data.lastPatrolAt?.trim() || null);
    }
    if (data.photoUrl !== undefined) {
      fields.push(`photo_url = $${idx++}`);
      values.push(data.photoUrl?.trim() || null);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE patrol_vehicles SET ${fields.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    const res = await pool.query('SELECT * FROM patrol_vehicles WHERE id = $1', [id]);
    if (res.rows.length === 0) throw new Error('Veículo não encontrado.');
    const condoMap = await getCondoNameMap();
    return formatVehicleRow(res.rows[0], condoMap);
  } catch (error) {
    console.error('updatePatrolVehicle failed:', error);
    throw new Error('Falha ao atualizar veículo de ronda.', { cause: error });
  }
}

export async function deletePatrolVehicle(id: number) {
  const pool = createPool();
  try {
    await pool.query('DELETE FROM patrol_vehicles WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    console.error('deletePatrolVehicle failed:', error);
    throw new Error('Falha ao excluir veículo de ronda.', { cause: error });
  }
}

// --- MATERIAIS E PATRIMÔNIO DA EMPRESA NO CONDOMÍNIO ---

function formatAssetRow(r: any, condoMap: Map<number, string>) {
  return {
    id: r.id,
    condoId: r.condo_id,
    condoName: r.condo_id ? (condoMap.get(r.condo_id) || 'Posto Geral') : 'Almoxarifado Central',
    name: r.name,
    category: r.category,
    assetTag: r.asset_tag,
    serialNumber: r.serial_number,
    quantity: r.quantity || 1,
    condition: r.condition,
    deliveryDate: r.delivery_date,
    responsibleAgent: r.responsible_agent,
    notes: r.notes,
    photoUrl: r.photo_url,
    cautelaAt: r.cautela_at,
    cautelaNotes: r.cautela_notes,
    cautelaItems: Array.isArray(r.cautela_items) ? r.cautela_items : [],
    createdAt: r.created_at,
  };
}

export async function getCompanyAssets(condoId?: number) {
  const pool = createPool();
  try {
    const condoMap = await getCondoNameMap();
    let query = 'SELECT * FROM company_assets ORDER BY id DESC';
    const params: any[] = [];
    if (condoId) {
      query = 'SELECT * FROM company_assets WHERE condo_id = $1 ORDER BY id DESC';
      params.push(condoId);
    }
    const res = await pool.query(query, params);
    return res.rows.map((r: any) => formatAssetRow(r, condoMap));
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
  cautelaAt?: string;
  cautelaNotes?: string;
  cautelaItems?: string[];
  photoUrl?: string;
  notes?: string;
}) {
  const pool = createPool();
  try {
    const res = await pool.query(
      `INSERT INTO company_assets (
        condo_id, name, category, asset_tag, serial_number, quantity,
        condition, delivery_date, responsible_agent, cautela_at,
        cautela_notes, cautela_items, photo_url, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        data.condoId ? Number(data.condoId) : null,
        data.name.trim(),
        data.category || 'comunicacao',
        data.assetTag?.trim() || null,
        data.serialNumber?.trim() || null,
        parseInt(String(data.quantity || 1), 10) || 1,
        data.condition || 'bom',
        data.deliveryDate?.trim() || null,
        data.responsibleAgent?.trim() || null,
        data.cautelaAt?.trim() || null,
        data.cautelaNotes?.trim() || null,
        Array.isArray(data.cautelaItems) ? data.cautelaItems : [],
        data.photoUrl?.trim() || null,
        data.notes?.trim() || null,
      ]
    );

    const condoMap = await getCondoNameMap();
    return formatAssetRow(res.rows[0], condoMap);
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
  cautelaAt?: string;
  cautelaNotes?: string;
  cautelaItems?: string[];
  photoUrl?: string;
  notes?: string;
}>) {
  const pool = createPool();
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.condoId !== undefined) {
      fields.push(`condo_id = $${idx++}`);
      values.push(data.condoId ? Number(data.condoId) : null);
    }
    if (data.name !== undefined) {
      fields.push(`name = $${idx++}`);
      values.push(data.name.trim());
    }
    if (data.category !== undefined) {
      fields.push(`category = $${idx++}`);
      values.push(data.category);
    }
    if (data.assetTag !== undefined) {
      fields.push(`asset_tag = $${idx++}`);
      values.push(data.assetTag?.trim() || null);
    }
    if (data.serialNumber !== undefined) {
      fields.push(`serial_number = $${idx++}`);
      values.push(data.serialNumber?.trim() || null);
    }
    if (data.quantity !== undefined) {
      fields.push(`quantity = $${idx++}`);
      values.push(parseInt(String(data.quantity || 1), 10) || 1);
    }
    if (data.condition !== undefined) {
      fields.push(`condition = $${idx++}`);
      values.push(data.condition);
    }
    if (data.deliveryDate !== undefined) {
      fields.push(`delivery_date = $${idx++}`);
      values.push(data.deliveryDate?.trim() || null);
    }
    if (data.responsibleAgent !== undefined) {
      fields.push(`responsible_agent = $${idx++}`);
      values.push(data.responsibleAgent?.trim() || null);
    }
    if (data.cautelaAt !== undefined) {
      fields.push(`cautela_at = $${idx++}`);
      values.push(data.cautelaAt?.trim() || null);
    }
    if (data.cautelaNotes !== undefined) {
      fields.push(`cautela_notes = $${idx++}`);
      values.push(data.cautelaNotes?.trim() || null);
    }
    if (data.cautelaItems !== undefined) {
      fields.push(`cautela_items = $${idx++}`);
      values.push(Array.isArray(data.cautelaItems) ? data.cautelaItems : []);
    }
    if (data.photoUrl !== undefined) {
      fields.push(`photo_url = $${idx++}`);
      values.push(data.photoUrl?.trim() || null);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(data.notes?.trim() || null);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE company_assets SET ${fields.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    const res = await pool.query('SELECT * FROM company_assets WHERE id = $1', [id]);
    if (res.rows.length === 0) throw new Error('Material não encontrado.');
    const condoMap = await getCondoNameMap();
    return formatAssetRow(res.rows[0], condoMap);
  } catch (error) {
    console.error('updateCompanyAsset failed:', error);
    throw new Error('Falha ao atualizar material.', { cause: error });
  }
}

export async function deleteCompanyAsset(id: number) {
  const pool = createPool();
  try {
    await pool.query('DELETE FROM company_assets WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    console.error('deleteCompanyAsset failed:', error);
    throw new Error('Falha ao excluir material.', { cause: error });
  }
}

// --- MANUTENÇÕES REALIZADAS PELA EMPRESA NO CONDOMÍNIO ---

function formatMaintenanceRow(r: any, condoMap: Map<number, string>) {
  return {
    id: r.id,
    condoId: r.condo_id,
    condoName: r.condo_id ? (condoMap.get(r.condo_id) || 'Posto Geral') : 'Contrato Geral',
    title: r.title,
    category: r.category,
    maintenanceType: r.maintenance_type,
    technicianName: r.technician_name,
    scheduledDate: r.scheduled_date,
    completedDate: r.completed_date,
    cost: r.cost,
    status: r.status,
    description: r.description,
    solutionDetails: r.solution_details,
    createdAt: r.created_at,
  };
}

export async function getMaintenanceOrders(condoId?: number) {
  const pool = createPool();
  try {
    const condoMap = await getCondoNameMap();
    let query = 'SELECT * FROM maintenance_orders ORDER BY scheduled_date DESC, id DESC';
    const params: any[] = [];
    if (condoId) {
      query = 'SELECT * FROM maintenance_orders WHERE condo_id = $1 ORDER BY scheduled_date DESC, id DESC';
      params.push(condoId);
    }
    const res = await pool.query(query, params);
    return res.rows.map((r: any) => formatMaintenanceRow(r, condoMap));
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
  const pool = createPool();
  try {
    const res = await pool.query(
      `INSERT INTO maintenance_orders (
        condo_id, title, category, maintenance_type, technician_name,
        scheduled_date, completed_date, cost, status, description, solution_details
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        data.condoId ? Number(data.condoId) : null,
        data.title.trim(),
        data.category || 'portoes',
        data.maintenanceType || 'preventiva',
        data.technicianName.trim(),
        data.scheduledDate.trim(),
        data.completedDate?.trim() || null,
        data.cost?.trim() || 'R$ 0,00',
        data.status || 'agendada',
        data.description.trim(),
        data.solutionDetails?.trim() || null,
      ]
    );

    const condoMap = await getCondoNameMap();
    return formatMaintenanceRow(res.rows[0], condoMap);
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
  const pool = createPool();
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.condoId !== undefined) {
      fields.push(`condo_id = $${idx++}`);
      values.push(data.condoId ? Number(data.condoId) : null);
    }
    if (data.title !== undefined) {
      fields.push(`title = $${idx++}`);
      values.push(data.title.trim());
    }
    if (data.category !== undefined) {
      fields.push(`category = $${idx++}`);
      values.push(data.category);
    }
    if (data.maintenanceType !== undefined) {
      fields.push(`maintenance_type = $${idx++}`);
      values.push(data.maintenanceType);
    }
    if (data.technicianName !== undefined) {
      fields.push(`technician_name = $${idx++}`);
      values.push(data.technicianName.trim());
    }
    if (data.scheduledDate !== undefined) {
      fields.push(`scheduled_date = $${idx++}`);
      values.push(data.scheduledDate.trim());
    }
    if (data.completedDate !== undefined) {
      fields.push(`completed_date = $${idx++}`);
      values.push(data.completedDate?.trim() || null);
    }
    if (data.cost !== undefined) {
      fields.push(`cost = $${idx++}`);
      values.push(data.cost?.trim() || 'R$ 0,00');
    }
    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.description !== undefined) {
      fields.push(`description = $${idx++}`);
      values.push(data.description.trim());
    }
    if (data.solutionDetails !== undefined) {
      fields.push(`solution_details = $${idx++}`);
      values.push(data.solutionDetails?.trim() || null);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE maintenance_orders SET ${fields.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    const res = await pool.query('SELECT * FROM maintenance_orders WHERE id = $1', [id]);
    if (res.rows.length === 0) throw new Error('Manutenção não encontrada.');
    const condoMap = await getCondoNameMap();
    return formatMaintenanceRow(res.rows[0], condoMap);
  } catch (error) {
    console.error('updateMaintenanceOrder failed:', error);
    throw new Error('Falha ao atualizar manutenção.', { cause: error });
  }
}

export async function deleteMaintenanceOrder(id: number) {
  const pool = createPool();
  try {
    await pool.query('DELETE FROM maintenance_orders WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    console.error('deleteMaintenanceOrder failed:', error);
    throw new Error('Falha ao excluir manutenção.', { cause: error });
  }
}

// --- LIVRO DE OCORRÊNCIAS OPERACIONAIS E PASSAGEM DE TURNO ---

function formatOperationalLogRow(r: any, condoMap: Map<number, string>) {
  return {
    id: r.id,
    condoId: r.condo_id,
    condoName: r.condo_id ? (condoMap.get(r.condo_id) || 'Posto Geral') : 'Supervisão Geral',
    agentName: r.agent_name,
    shiftType: r.shift_type,
    logType: r.log_type,
    severity: r.severity,
    status: r.status,
    title: r.title,
    description: r.description,
    actionTaken: r.action_taken,
    logDate: r.log_date,
    logTime: r.log_time,
    photoUrl: r.photo_url,
    designatedIncomingAgentName: r.designated_incoming_agent_name,
    designatedIncomingAgentId: r.designated_incoming_agent_id,
    incomingAgentAccepted: !!r.incoming_agent_accepted,
    incomingAgentName: r.incoming_agent_name,
    incomingAcceptedAt: r.incoming_accepted_at,
    incomingChecklist: r.incoming_checklist || null,
    incomingNotes: r.incoming_notes,
    createdAt: r.created_at,
  };
}

export async function getOperationalLogs(condoId?: number) {
  const pool = createPool();
  try {
    const condoMap = await getCondoNameMap();
    let query = 'SELECT * FROM operational_logs ORDER BY log_date DESC, log_time DESC, id DESC';
    const params: any[] = [];
    if (condoId) {
      query = 'SELECT * FROM operational_logs WHERE condo_id = $1 ORDER BY log_date DESC, log_time DESC, id DESC';
      params.push(condoId);
    }
    const res = await pool.query(query, params);
    return res.rows.map((r: any) => formatOperationalLogRow(r, condoMap));
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
  photoUrl?: string;
  designatedIncomingAgentName?: string;
  designatedIncomingAgentId?: number;
}) {
  const pool = createPool();
  try {
    const res = await pool.query(
      `INSERT INTO operational_logs (
        condo_id, agent_name, shift_type, log_type, severity, status,
        title, description, action_taken, log_date, log_time, photo_url,
        designated_incoming_agent_name, designated_incoming_agent_id,
        incoming_agent_accepted
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        data.condoId ? Number(data.condoId) : null,
        data.agentName.trim(),
        data.shiftType || 'dia',
        data.logType || 'passagem_turno',
        data.severity || 'informativa',
        data.status || 'resolvida',
        data.title.trim(),
        data.description.trim(),
        data.actionTaken?.trim() || null,
        data.logDate.trim(),
        data.logTime.trim(),
        data.photoUrl?.trim() || null,
        data.designatedIncomingAgentName?.trim() || null,
        data.designatedIncomingAgentId ? Number(data.designatedIncomingAgentId) : null,
        false,
      ]
    );

    const condoMap = await getCondoNameMap();
    return formatOperationalLogRow(res.rows[0], condoMap);
  } catch (error) {
    console.error('createOperationalLog failed:', error);
    throw new Error('Falha ao registrar ocorrência operacional.', { cause: error });
  }
}

export async function updateOperationalLog(id: number, data: Partial<{
  status?: string;
  actionTaken?: string;
  incomingAgentAccepted?: boolean;
  incomingAgentName?: string;
  incomingAcceptedAt?: string;
  incomingChecklist?: any;
  incomingNotes?: string;
}>) {
  const pool = createPool();
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.status !== undefined) {
      fields.push(`status = $${idx++}`);
      values.push(data.status);
    }
    if (data.actionTaken !== undefined) {
      fields.push(`action_taken = $${idx++}`);
      values.push(data.actionTaken?.trim() || null);
    }
    if (data.incomingAgentAccepted !== undefined) {
      fields.push(`incoming_agent_accepted = $${idx++}`);
      values.push(Boolean(data.incomingAgentAccepted));
    }
    if (data.incomingAgentName !== undefined) {
      fields.push(`incoming_agent_name = $${idx++}`);
      values.push(data.incomingAgentName?.trim() || null);
    }
    if (data.incomingAcceptedAt !== undefined) {
      fields.push(`incoming_accepted_at = $${idx++}`);
      values.push(data.incomingAcceptedAt || null);
    }
    if (data.incomingChecklist !== undefined) {
      fields.push(`incoming_checklist = $${idx++}`);
      values.push(data.incomingChecklist ? JSON.stringify(data.incomingChecklist) : null);
    }
    if (data.incomingNotes !== undefined) {
      fields.push(`incoming_notes = $${idx++}`);
      values.push(data.incomingNotes?.trim() || null);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE operational_logs SET ${fields.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    const res = await pool.query('SELECT * FROM operational_logs WHERE id = $1', [id]);
    if (res.rows.length === 0) throw new Error('Ocorrência não encontrada.');
    const condoMap = await getCondoNameMap();
    return formatOperationalLogRow(res.rows[0], condoMap);
  } catch (error) {
    console.error('updateOperationalLog failed:', error);
    throw new Error('Falha ao atualizar ocorrência operacional.', { cause: error });
  }
}

export async function deleteOperationalLog(id: number) {
  const pool = createPool();
  try {
    await pool.query('DELETE FROM operational_logs WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    console.error('deleteOperationalLog failed:', error);
    throw new Error('Falha ao excluir registro operacional.', { cause: error });
  }
}

// --- ESCALA 12x36, CONTROLE DE FALTAS E COBERTURAS ---

function formatShiftCoverageRow(r: any, condoMap: Map<number, string>) {
  return {
    id: r.id,
    condoId: r.condo_id,
    condoName: r.condo_id ? (condoMap.get(r.condo_id) || 'Posto Geral') : 'Geral',
    stationId: r.station_id,
    stationName: r.station_name,
    date: r.date,
    shiftType: r.shift_type,
    scheduledAgentId: r.scheduled_agent_id,
    scheduledAgentName: r.scheduled_agent_name,
    absenceType: r.absence_type,
    absenceReason: r.absence_reason,
    coverageStatus: r.coverage_status,
    coveringAgentName: r.covering_agent_name,
    notes: r.notes,
    assignedBy: r.assigned_by,
    createdAt: r.created_at,
  };
}

export async function getShiftCoverages(condoId?: number) {
  const pool = createPool();
  try {
    const condoMap = await getCondoNameMap();
    let query = 'SELECT * FROM shift_coverages ORDER BY id DESC';
    const params: any[] = [];
    if (condoId) {
      query = 'SELECT * FROM shift_coverages WHERE condo_id = $1 ORDER BY id DESC';
      params.push(condoId);
    }
    const res = await pool.query(query, params);
    return res.rows.map((r: any) => formatShiftCoverageRow(r, condoMap));
  } catch (error) {
    console.error('getShiftCoverages failed:', error);
    return [];
  }
}

export async function createShiftCoverage(data: {
  condoId?: number;
  stationId?: string;
  stationName?: string;
  date: string;
  shiftType?: string;
  scheduledAgentId?: number;
  scheduledAgentName?: string;
  absenceType?: string;
  absenceReason?: string;
  coverageStatus?: string;
  coveringAgentName?: string;
  notes?: string;
  assignedBy?: string;
}) {
  const pool = createPool();
  try {
    const res = await pool.query(
      `INSERT INTO shift_coverages (
        condo_id, station_id, station_name, date, shift_type,
        scheduled_agent_id, scheduled_agent_name, absence_type,
        absence_reason, coverage_status, covering_agent_name,
        notes, assigned_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        data.condoId ? Number(data.condoId) : null,
        data.stationId || 'st-default',
        data.stationName || 'Portaria Principal',
        data.date,
        data.shiftType || '12x36_dia',
        data.scheduledAgentId ? Number(data.scheduledAgentId) : null,
        data.scheduledAgentName || null,
        data.absenceType || 'falta_injustificada',
        data.absenceReason || null,
        data.coverageStatus || 'descoberto',
        data.coveringAgentName || null,
        data.notes || null,
        data.assignedBy || 'Supervisor de Operações',
      ]
    );

    const condoMap = await getCondoNameMap();
    return formatShiftCoverageRow(res.rows[0], condoMap);
  } catch (error) {
    console.error('createShiftCoverage failed:', error);
    throw new Error('Falha ao registrar cobertura de escala.', { cause: error });
  }
}

export async function updateShiftCoverage(id: number, data: Partial<{
  coverageStatus?: string;
  coveringAgentName?: string;
  notes?: string;
  absenceReason?: string;
}>) {
  const pool = createPool();
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.coverageStatus !== undefined) {
      fields.push(`coverage_status = $${idx++}`);
      values.push(data.coverageStatus);
    }
    if (data.coveringAgentName !== undefined) {
      fields.push(`covering_agent_name = $${idx++}`);
      values.push(data.coveringAgentName?.trim() || null);
    }
    if (data.notes !== undefined) {
      fields.push(`notes = $${idx++}`);
      values.push(data.notes?.trim() || null);
    }
    if (data.absenceReason !== undefined) {
      fields.push(`absence_reason = $${idx++}`);
      values.push(data.absenceReason?.trim() || null);
    }

    if (fields.length > 0) {
      values.push(id);
      await pool.query(
        `UPDATE shift_coverages SET ${fields.join(', ')} WHERE id = $${idx}`,
        values
      );
    }

    const res = await pool.query('SELECT * FROM shift_coverages WHERE id = $1', [id]);
    if (res.rows.length === 0) throw new Error('Escala de cobertura não encontrada.');
    const condoMap = await getCondoNameMap();
    return formatShiftCoverageRow(res.rows[0], condoMap);
  } catch (error) {
    console.error('updateShiftCoverage failed:', error);
    throw new Error('Falha ao atualizar cobertura de escala.', { cause: error });
  }
}

export async function deleteShiftCoverage(id: number) {
  const pool = createPool();
  try {
    await pool.query('DELETE FROM shift_coverages WHERE id = $1', [id]);
    return { success: true };
  } catch (error) {
    console.error('deleteShiftCoverage failed:', error);
    throw new Error('Falha ao excluir cobertura de escala.', { cause: error });
  }
}

// --- ESTATÍSTICAS DO PAINEL OPERACIONAL DA EMPRESA ---

export async function getDashboardStats(condoId?: number) {
  const pool = createPool();
  try {
    const whereCondo = condoId ? 'WHERE condo_id = $1' : '';
    const params = condoId ? [condoId] : [];

    const totalCondosRes = await pool.query('SELECT count(*)::int as c FROM condominiums');
    const totalCondos = totalCondosRes.rows[0]?.c || 0;

    let agentsQuery = `
      SELECT 
        count(*)::int as total,
        count(*) FILTER (WHERE status = 'em_servico')::int as active
      FROM security_agents
    `;
    if (condoId) {
      agentsQuery = `
        SELECT 
          count(*)::int as total,
          count(*) FILTER (WHERE status = 'em_servico')::int as active
        FROM security_agents
        WHERE condo_id = $1 OR $1 = ANY(condo_ids)
      `;
    }
    const agentsRes = await pool.query(agentsQuery, params);

    const vehiclesQuery = `
      SELECT 
        count(*)::int as total,
        count(*) FILTER (WHERE status IN ('em_ronda', 'disponivel'))::int as active
      FROM patrol_vehicles ${whereCondo}
    `;
    const vehiclesRes = await pool.query(vehiclesQuery, params);

    const assetsQuery = `
      SELECT COALESCE(sum(quantity), 0)::int as total
      FROM company_assets ${whereCondo}
    `;
    const assetsRes = await pool.query(assetsQuery, params);

    const maintQuery = `
      SELECT 
        count(*) FILTER (WHERE status IN ('agendada', 'em_andamento'))::int as pending,
        count(*) FILTER (WHERE status = 'concluida')::int as completed
      FROM maintenance_orders ${whereCondo}
    `;
    const maintRes = await pool.query(maintQuery, params);

    const logsQuery = `
      SELECT count(*)::int as today
      FROM operational_logs
      WHERE ${condoId ? 'condo_id = $1 AND ' : ''} (log_date = CURRENT_DATE::text OR log_date = TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'))
    `;
    const logsRes = await pool.query(logsQuery, params);

    return {
      totalCondos,
      totalAgents: agentsRes.rows[0]?.total || 0,
      agentsOnDuty: agentsRes.rows[0]?.active || 0,
      totalPatrolVehicles: vehiclesRes.rows[0]?.total || 0,
      activePatrolVehicles: vehiclesRes.rows[0]?.active || 0,
      totalAssets: assetsRes.rows[0]?.total || 0,
      pendingMaintenances: maintRes.rows[0]?.pending || 0,
      completedMaintenances: maintRes.rows[0]?.completed || 0,
      todayLogs: logsRes.rows[0]?.today || 0,
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

