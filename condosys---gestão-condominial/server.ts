import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { requireAuth, requireSindico, AuthRequest } from './src/middleware/auth.ts';
import {
  cancelReservation,
  createAccessLog,
  createAnnouncement,
  createBlock,
  createCommonArea,
  createDelivery,
  createIncident,
  createPoll,
  createReservation,
  createResident,
  createUnit,
  createVehicle,
  deleteAnnouncement,
  deleteBlock,
  deleteResident,
  deleteUnit,
  deleteVehicle,
  getAccessLogs,
  getAnnouncements,
  getBlocks,
  getCommonAreas,
  getDashboardStats,
  getDeliveries,
  getIncidents,
  getOrCreateUser,
  getPolls,
  getReservations,
  getResidents,
  getUnits,
  getVehicles,
  markDeliveryPickup,
  registerAccessExit,
  updateBlock,
  updateIncidentStatus,
  updateResident,
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

// --- ROTAS DA API ---

// 1. Perfil e Sincronização
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

// 2. Estatísticas do Painel
app.get('/api/dashboard/stats', requireAuth, async (_req, res) => {
  try {
    const stats = await getDashboardStats();
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Gestão de Estrutura: Blocos
app.get('/api/blocks', requireAuth, async (_req, res) => {
  try {
    const blocks = await getBlocks();
    res.json(blocks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/blocks', requireAuth, requireSindico, async (req, res) => {
  try {
    const block = await createBlock(req.body);
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

// 4. Gestão de Estrutura: Unidades
app.get('/api/units', requireAuth, async (_req, res) => {
  try {
    const units = await getUnits();
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

// 5. Moradores
app.get('/api/residents', requireAuth, async (_req, res) => {
  try {
    const residents = await getResidents();
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

// 6. Veículos e Vagas
app.get('/api/vehicles', requireAuth, async (_req, res) => {
  try {
    const vehicles = await getVehicles();
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

// 7. Livro de Ocorrências
app.get('/api/incidents', requireAuth, async (_req, res) => {
  try {
    const incidents = await getIncidents();
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
    });
    res.json(incident);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// 8. Áreas Comuns e Reservas
app.get('/api/common-areas', requireAuth, async (_req, res) => {
  try {
    const areas = await getCommonAreas();
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
    });
    res.status(201).json(area);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/reservations', requireAuth, async (_req, res) => {
  try {
    const reservations = await getReservations();
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

// 9. Portaria: Controle de Acessos
app.get('/api/access-logs', requireAuth, async (_req, res) => {
  try {
    const logs = await getAccessLogs();
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

// 10. Portaria: Encomendas
app.get('/api/deliveries', requireAuth, async (_req, res) => {
  try {
    const deliveries = await getDeliveries();
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

// 11. Mural de Avisos
app.get('/api/announcements', requireAuth, async (_req, res) => {
  try {
    const announcements = await getAnnouncements();
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

// 12. Enquetes e Votações
app.get('/api/polls', requireAuth, async (_req, res) => {
  try {
    const polls = await getPolls();
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
});
