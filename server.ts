import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { createPool } from './src/db/index.ts';
import { requireAuth, requireSindico, AuthRequest } from './src/middleware/auth.ts';
import {
  authenticateUser,
  cancelReservation,
  createAccessLog,
  createAnnouncement,
  createBlock,
  createCommonArea,
  createCondominium,
  createDelivery,
  createIncident,
  createPoll,
  createReservation,
  createResident,
  createSystemUser,
  createUnit,
  createVehicle,
  deleteAnnouncement,
  deleteBlock,
  deleteCondominium,
  deleteResident,
  deleteSystemUser,
  deleteUnit,
  deleteVehicle,
  getAccessLogs,
  getAnnouncements,
  getBlocks,
  getCommonAreas,
  getCondominiumById,
  getCondominiums,
  getDashboardStats,
  getDeliveries,
  getIncidents,
  getOrCreateUser,
  getPolls,
  getReservations,
  getResidents,
  getUnits,
  getUsersList,
  getVehicles,
  markDeliveryPickup,
  registerAccessExit,
  updateBlock,
  updateCondominium,
  updateIncidentStatus,
  updateResident,
  updateSystemUser,
  updateUnit,
  updateVehicle,
  votePoll,
} from './src/db/queries.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper para extrair condoId das requisições
const getRequestedCondoId = (req: express.Request): number | undefined => {
  const queryParam = req.query.condoId;
  if (queryParam && queryParam !== 'all' && queryParam !== 'undefined') {
    const parsed = parseInt(String(queryParam), 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return undefined;
};

// --- ROTAS DA API ---

// 1. Autenticação e Login com E-mail e Senha
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' });
    }
    const user = await authenticateUser(email, password);
    res.json(user);
  } catch (error: any) {
    res.status(401).json({ error: error.message || 'Credenciais inválidas.' });
  }
});

// 2. Gestão de Condomínios (Multi-Condomínio)
app.get('/api/condominiums', requireAuth, async (_req, res) => {
  try {
    const list = await getCondominiums();
    res.json(list);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/condominiums/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const condo = await getCondominiumById(id);
    if (!condo) return res.status(404).json({ error: 'Condomínio não encontrado.' });
    res.json(condo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/condominiums', requireAuth, requireSindico, async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'O nome do condomínio é obrigatório.' });
    }
    const condo = await createCondominium(req.body);
    res.status(201).json(condo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/condominiums/:id', requireAuth, requireSindico, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const condo = await updateCondominium(id, req.body);
    res.json(condo);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/condominiums/:id', requireAuth, requireSindico, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteCondominium(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 3. Gestão de Usuários e Funcionários (Exclusivo Síndico / Administrador)
app.get('/api/users', requireAuth, requireSindico, async (req, res) => {
  try {
    const condoId = getRequestedCondoId(req);
    const users = await getUsersList(condoId);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/users', requireAuth, requireSindico, async (req, res) => {
  try {
    const { name, email, password, role, permissions, condoId } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Nome, e-mail e senha são obrigatórios.' });
    }
    const newUser = await createSystemUser({
      name,
      email,
      password,
      role: role || 'portaria',
      permissions: typeof permissions === 'string' ? permissions : JSON.stringify(permissions || []),
      condoId: condoId ? Number(condoId) : null,
    });
    res.status(201).json(newUser);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/users/:id', requireAuth, requireSindico, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await updateSystemUser(id, req.body);
    res.json(updated);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.delete('/api/users/:id', requireAuth, requireSindico, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteSystemUser(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// 4. Perfil e Sincronização Google
app.post('/api/auth/sync', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { name, email, role } = req.body;
    const uid = (req.user as any)?.uid || 'user-default';
    const user = await getOrCreateUser(uid, email || (req.user as any)?.email, name || 'Administrador', role || 'portaria');
    res.json(user);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 5. Estatísticas do Painel
app.get('/api/dashboard/stats', requireAuth, async (req, res) => {
  try {
    const condoId = getRequestedCondoId(req);
    const stats = await getDashboardStats(condoId);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 6. Gestão de Estrutura: Blocos
app.get('/api/blocks', requireAuth, async (req, res) => {
  try {
    const condoId = getRequestedCondoId(req);
    const blocks = await getBlocks(condoId);
    res.json(blocks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/blocks', requireAuth, requireSindico, async (req, res) => {
  try {
    const block = await createBlock({
      name: req.body.name,
      description: req.body.description,
      totalFloors: req.body.totalFloors ? Number(req.body.totalFloors) : 4,
      condoId: req.body.condoId ? Number(req.body.condoId) : undefined,
    });
    res.status(201).json(block);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/blocks/:id', requireAuth, requireSindico, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const block = await updateBlock(id, req.body);
    res.json(block);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/blocks/:id', requireAuth, requireSindico, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteBlock(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 7. Gestão de Estrutura: Unidades
app.get('/api/units', requireAuth, async (req, res) => {
  try {
    const condoId = getRequestedCondoId(req);
    const units = await getUnits(condoId);
    res.json(units);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/units', requireAuth, requireSindico, async (req, res) => {
  try {
    const unit = await createUnit({
      blockId: Number(req.body.blockId),
      number: req.body.number,
      floor: req.body.floor ? Number(req.body.floor) : 1,
      unitType: req.body.unitType,
      notes: req.body.notes,
      condoId: req.body.condoId ? Number(req.body.condoId) : undefined,
    });
    res.status(201).json(unit);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/units/:id', requireAuth, requireSindico, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const unit = await updateUnit(id, req.body);
    res.json(unit);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/units/:id', requireAuth, requireSindico, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteUnit(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Moradores
app.get('/api/residents', requireAuth, async (req, res) => {
  try {
    const condoId = getRequestedCondoId(req);
    const residents = await getResidents(condoId);
    res.json(residents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/residents', requireAuth, async (req, res) => {
  try {
    const resident = await createResident({
      unitId: Number(req.body.unitId),
      name: req.body.name,
      cpf: req.body.cpf,
      email: req.body.email,
      phone: req.body.phone,
      emergencyContact: req.body.emergencyContact,
      residentType: req.body.residentType || 'inquilino',
      condoId: req.body.condoId ? Number(req.body.condoId) : undefined,
    });
    res.status(201).json(resident);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/residents/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const resident = await updateResident(id, req.body);
    res.json(resident);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/residents/:id', requireAuth, requireSindico, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteResident(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 9. Veículos e Vagas
app.get('/api/vehicles', requireAuth, async (req, res) => {
  try {
    const condoId = getRequestedCondoId(req);
    const vehicles = await getVehicles(condoId);
    res.json(vehicles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vehicles', requireAuth, async (req, res) => {
  try {
    const vehicle = await createVehicle({
      unitId: Number(req.body.unitId),
      plate: req.body.plate.toUpperCase().trim(),
      model: req.body.model,
      color: req.body.color,
      parkingSpot: req.body.parkingSpot,
      spotType: req.body.spotType || 'coberta',
      residentName: req.body.residentName,
      condoId: req.body.condoId ? Number(req.body.condoId) : undefined,
    });
    res.status(201).json(vehicle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/vehicles/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const vehicle = await updateVehicle(id, req.body);
    res.json(vehicle);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/vehicles/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteVehicle(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 10. Livro de Ocorrências
app.get('/api/incidents', requireAuth, async (req, res) => {
  try {
    const condoId = getRequestedCondoId(req);
    const incidents = await getIncidents(condoId);
    res.json(incidents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/incidents', requireAuth, async (req: AuthRequest, res) => {
  try {
    const registeredBy = req.body.registeredBy || (req.user as any)?.name || 'Portaria';
    const incident = await createIncident({
      unitId: req.body.unitId ? Number(req.body.unitId) : undefined,
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      involvedPersons: req.body.involvedPersons,
      severity: req.body.severity || 'media',
      attachmentUrl: req.body.attachmentUrl,
      registeredBy,
      incidentDate: req.body.incidentDate,
      incidentTime: req.body.incidentTime,
      condoId: req.body.condoId ? Number(req.body.condoId) : undefined,
    });
    res.status(201).json(incident);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/incidents/:id/status', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const incident = await updateIncidentStatus(id, {
      status: req.body.status,
      actionTaken: req.body.actionTaken,
      severity: req.body.severity,
    });
    res.json(incident);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 11. Áreas Comuns e Reservas
app.get('/api/common-areas', requireAuth, async (req, res) => {
  try {
    const condoId = getRequestedCondoId(req);
    const areas = await getCommonAreas(condoId);
    res.json(areas);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/common-areas', requireAuth, requireSindico, async (req, res) => {
  try {
    const area = await createCommonArea({
      name: req.body.name,
      capacity: Number(req.body.capacity),
      description: req.body.description,
      cleaningFee: req.body.cleaningFee,
      rules: req.body.rules,
      condoId: req.body.condoId ? Number(req.body.condoId) : undefined,
    });
    res.status(201).json(area);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reservations', requireAuth, async (req, res) => {
  try {
    const condoId = getRequestedCondoId(req);
    const reservations = await getReservations(condoId);
    res.json(reservations);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/reservations', requireAuth, async (req, res) => {
  try {
    const reservation = await createReservation({
      areaId: Number(req.body.areaId),
      unitId: Number(req.body.unitId),
      residentName: req.body.residentName,
      reservationDate: req.body.reservationDate,
      period: req.body.period,
      startTime: req.body.startTime,
      endTime: req.body.endTime,
      notes: req.body.notes,
      condoId: req.body.condoId ? Number(req.body.condoId) : undefined,
    });
    res.status(201).json(reservation);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/reservations/:id/cancel', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const reservation = await cancelReservation(id);
    res.json(reservation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 12. Portaria: Controle de Acessos
app.get('/api/access-logs', requireAuth, async (req, res) => {
  try {
    const condoId = getRequestedCondoId(req);
    const logs = await getAccessLogs(condoId);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/access-logs', requireAuth, async (req: AuthRequest, res) => {
  try {
    const registeredBy = (req.user as any)?.name || 'Portaria';
    const log = await createAccessLog({
      visitorType: req.body.visitorType || 'visitante',
      name: req.body.name,
      document: req.body.document,
      company: req.body.company,
      unitId: Number(req.body.unitId),
      authorizedBy: req.body.authorizedBy,
      vehiclePlate: req.body.vehiclePlate,
      notes: req.body.notes,
      registeredBy,
      condoId: req.body.condoId ? Number(req.body.condoId) : undefined,
    });
    res.status(201).json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/access-logs/:id/exit', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const log = await registerAccessExit(id);
    res.json(log);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 13. Portaria: Encomendas
app.get('/api/deliveries', requireAuth, async (req, res) => {
  try {
    const condoId = getRequestedCondoId(req);
    const deliveries = await getDeliveries(condoId);
    res.json(deliveries);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/deliveries', requireAuth, async (req: AuthRequest, res) => {
  try {
    const receivedByPortaria = (req.user as any)?.name || 'Portaria';
    const delivery = await createDelivery({
      unitId: Number(req.body.unitId),
      recipientName: req.body.recipientName,
      trackingCode: req.body.trackingCode,
      carrier: req.body.carrier,
      packageType: req.body.packageType || 'pacote',
      location: req.body.location || 'Armário Portaria',
      receivedByPortaria,
      condoId: req.body.condoId ? Number(req.body.condoId) : undefined,
    });
    res.status(201).json(delivery);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/deliveries/:id/pickup', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const pickedUpBy = req.body.pickedUpBy || 'Morador/Autorizado';
    const delivery = await markDeliveryPickup(id, pickedUpBy);
    res.json(delivery);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 14. Mural de Avisos
app.get('/api/announcements', requireAuth, async (req, res) => {
  try {
    const condoId = getRequestedCondoId(req);
    const announcements = await getAnnouncements(condoId);
    res.json(announcements);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/announcements', requireAuth, requireSindico, async (req: AuthRequest, res) => {
  try {
    const author = (req.user as any)?.name || 'Administração';
    const announcement = await createAnnouncement({
      title: req.body.title,
      content: req.body.content,
      priority: req.body.priority || 'informativo',
      pinned: req.body.pinned ?? false,
      author,
      condoId: req.body.condoId ? Number(req.body.condoId) : undefined,
    });
    res.status(201).json(announcement);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/announcements/:id', requireAuth, requireSindico, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    await deleteAnnouncement(id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 15. Enquetes e Votações
app.get('/api/polls', requireAuth, async (req, res) => {
  try {
    const condoId = getRequestedCondoId(req);
    const polls = await getPolls(condoId);
    res.json(polls);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/polls', requireAuth, requireSindico, async (req, res) => {
  try {
    const poll = await createPoll({
      title: req.body.title,
      description: req.body.description,
      expiresAt: req.body.expiresAt,
      options: req.body.options || [],
      condoId: req.body.condoId ? Number(req.body.condoId) : undefined,
    });
    res.status(201).json(poll);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/polls/:id/vote', requireAuth, async (req, res) => {
  try {
    const pollId = parseInt(req.params.id, 10);
    const { optionId, unitId, voterName } = req.body;
    const result = await votePoll(pollId, Number(optionId), Number(unitId), voterName);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- SERVIÇO VITE SPA OU DIST ESTÁTICO ---
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`NOVA BRASIL API and Frontend server listening at http://localhost:${port}`);

  // Pré-aquece o pool de conexões do PostgreSQL e evita cold start
  try {
    const pool = createPool();
    pool.query('SELECT 1').then(() => {
      console.log('PostgreSQL conectado e pronto para receber conexões.');
    }).catch((err) => {
      console.warn('Tentativa inicial de conexão PostgreSQL:', err.message);
    });

    // Keep-alive a cada 3 minutos para evitar que a conexão caia por ociosidade
    setInterval(() => {
      pool.query('SELECT 1').catch(() => {});
    }, 180000);
  } catch (e) {
    console.warn('Erro ao inicializar pool keep-alive:', e);
  }
});
