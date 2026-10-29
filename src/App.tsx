import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { RoleModal } from './components/RoleModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { CondominiumsView } from './components/CondominiumsView.tsx';
import { StructureView } from './components/StructureView.tsx';
import { ResidentsView } from './components/ResidentsView.tsx';
import { VehiclesView } from './components/VehiclesView.tsx';
import { IncidentsView } from './components/IncidentsView.tsx';
import { ReservationsView } from './components/ReservationsView.tsx';
import { AccessDeliveriesView } from './components/AccessDeliveriesView.tsx';
import { AnnouncementsView } from './components/AnnouncementsView.tsx';
import { LoginView } from './components/LoginView.tsx';
import { UsersManagementView } from './components/UsersManagementView.tsx';
import {
  AccessLog,
  Announcement,
  Block,
  CommonArea,
  Condominium,
  DashboardStats,
  Delivery,
  Incident,
  Poll,
  Reservation,
  Resident,
  Unit,
  Vehicle,
} from './types/index.ts';
import { Loader2 } from 'lucide-react';

function NovaBrasilMain() {
  const { user, getAuthHeaders, role, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Estados Multi-Condomínio
  const [condominiums, setCondominiums] = useState<Condominium[]>([]);
  const [selectedCondoId, setSelectedCondoId] = useState<number | 'all'>('all');

  // Estados dos Módulos (Hooks chamados incondicionalmente no topo)
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [residents, setResidents] = useState<Resident[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [commonAreas, setCommonAreas] = useState<CommonArea[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [polls, setPolls] = useState<Poll[]>([]);

  // Sincronizar condomínio padrão se o usuário for restrito a um condomínio específico
  useEffect(() => {
    if (user?.condoId) {
      setSelectedCondoId(user.condoId);
    }
  }, [user]);

  const fetchAllData = async () => {
    try {
      const headers = await getAuthHeaders();
      const queryParam = selectedCondoId !== 'all' ? `?condoId=${selectedCondoId}` : '';

      const [
        condosRes,
        statsRes,
        blocksRes,
        unitsRes,
        residentsRes,
        vehiclesRes,
        incidentsRes,
        areasRes,
        reservationsRes,
        accessRes,
        deliveriesRes,
        announcementsRes,
        pollsRes,
      ] = await Promise.all([
        fetch('/api/condominiums', { headers }),
        fetch(`/api/dashboard/stats${queryParam}`, { headers }),
        fetch(`/api/blocks${queryParam}`, { headers }),
        fetch(`/api/units${queryParam}`, { headers }),
        fetch(`/api/residents${queryParam}`, { headers }),
        fetch(`/api/vehicles${queryParam}`, { headers }),
        fetch(`/api/incidents${queryParam}`, { headers }),
        fetch(`/api/common-areas${queryParam}`, { headers }),
        fetch(`/api/reservations${queryParam}`, { headers }),
        fetch(`/api/access-logs${queryParam}`, { headers }),
        fetch(`/api/deliveries${queryParam}`, { headers }),
        fetch(`/api/announcements${queryParam}`, { headers }),
        fetch(`/api/polls${queryParam}`, { headers }),
      ]);

      let loadedCondos: Condominium[] = [];
      let loadedBlocks: Block[] = [];
      let loadedUnits: Unit[] = [];
      let loadedResidents: Resident[] = [];
      let loadedVehicles: Vehicle[] = [];
      let loadedIncidents: Incident[] = [];
      let loadedAreas: CommonArea[] = [];
      let loadedReservations: Reservation[] = [];
      let loadedAccessLogs: AccessLog[] = [];
      let loadedDeliveries: Delivery[] = [];
      let loadedAnnouncements: Announcement[] = [];
      let loadedPolls: Poll[] = [];

      if (condosRes.ok) {
        loadedCondos = await condosRes.json();
        localStorage.setItem('novabrasil_condos', JSON.stringify(loadedCondos));
      } else {
        const saved = localStorage.getItem('novabrasil_condos');
        loadedCondos = saved ? JSON.parse(saved) : [
          {
            id: 1,
            name: 'Condomínio Residencial Jardins',
            address: 'Av. Paulista, 1000 - Bela Vista',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '01310-100',
            cnpj: '12.345.678/0001-90',
            totalUnits: 48,
            blocksCount: 2,
            unitsCount: 4,
            residentsCount: 4,
            usersCount: 2,
            sindicoName: 'Administrador Geral',
            sindicoPhone: '(11) 98765-4321',
            sindicoEmail: 'administrativo@novabrasil.com',
            status: 'ativo',
            createdAt: new Date().toISOString(),
          },
          {
            id: 2,
            name: 'Condomínio Solar das Palmeiras',
            address: 'Rua das Flores, 250 - Moema',
            city: 'São Paulo',
            state: 'SP',
            zipCode: '04500-001',
            cnpj: '98.765.432/0001-10',
            totalUnits: 72,
            blocksCount: 2,
            unitsCount: 2,
            residentsCount: 2,
            usersCount: 1,
            sindicoName: 'Administrador Geral',
            sindicoPhone: '(11) 99887-1122',
            sindicoEmail: 'administrativo@novabrasil.com',
            status: 'ativo',
            createdAt: new Date().toISOString(),
          },
        ];
      }
      setCondominiums(loadedCondos);

      if (blocksRes.ok) {
        loadedBlocks = await blocksRes.json();
        localStorage.setItem('novabrasil_blocks', JSON.stringify(loadedBlocks));
      } else {
        const saved = localStorage.getItem('novabrasil_blocks');
        loadedBlocks = saved ? JSON.parse(saved) : [
          { id: 1, name: 'Bloco A - Ipê Amarelo', condoId: 1, totalFloors: 4, description: 'Torre residencial principal' },
          { id: 2, name: 'Bloco B - Jacarandá', condoId: 1, totalFloors: 4, description: 'Torre residencial secundária' },
          { id: 3, name: 'Bloco 1 - Palmeira Real', condoId: 2, totalFloors: 6, description: 'Torre frente à piscina' },
        ];
      }
      setBlocks(loadedBlocks);

      if (unitsRes.ok) {
        loadedUnits = await unitsRes.json();
        localStorage.setItem('novabrasil_units', JSON.stringify(loadedUnits));
      } else {
        const saved = localStorage.getItem('novabrasil_units');
        loadedUnits = saved ? JSON.parse(saved) : [
          { id: 1, blockId: 1, blockName: 'Bloco A - Ipê Amarelo', number: '101', floor: 1, condoId: 1, unitType: 'apartamento' },
          { id: 2, blockId: 1, blockName: 'Bloco A - Ipê Amarelo', number: '102', floor: 1, condoId: 1, unitType: 'apartamento' },
          { id: 3, blockId: 2, blockName: 'Bloco B - Jacarandá', number: '201', floor: 2, condoId: 1, unitType: 'apartamento' },
          { id: 4, blockId: 2, blockName: 'Bloco B - Jacarandá', number: '202', floor: 2, condoId: 1, unitType: 'apartamento' },
        ];
      }
      setUnits(loadedUnits);

      if (residentsRes.ok) {
        loadedResidents = await residentsRes.json();
        localStorage.setItem('novabrasil_residents', JSON.stringify(loadedResidents));
      } else {
        const saved = localStorage.getItem('novabrasil_residents');
        loadedResidents = saved ? JSON.parse(saved) : [
          { id: 1, unitId: 1, name: 'Carlos Eduardo Silva', cpf: '123.456.789-00', email: 'carlos.silva@email.com', phone: '(11) 98111-2233', residentType: 'proprietario', isActive: true, condoId: 1, blockName: 'Bloco A - Ipê Amarelo', unitNumber: '101' },
          { id: 2, unitId: 2, name: 'Mariana Oliveira Santos', cpf: '234.567.890-11', email: 'mariana.santos@email.com', phone: '(11) 98222-3344', residentType: 'inquilino', isActive: true, condoId: 1, blockName: 'Bloco A - Ipê Amarelo', unitNumber: '102' },
          { id: 3, unitId: 3, name: 'Roberto de Almeida', cpf: '345.678.901-22', email: 'roberto.almeida@email.com', phone: '(11) 98333-4455', residentType: 'proprietario', isActive: true, condoId: 1, blockName: 'Bloco B - Jacarandá', unitNumber: '201' },
        ];
      }
      setResidents(loadedResidents);

      if (vehiclesRes.ok) {
        loadedVehicles = await vehiclesRes.json();
        localStorage.setItem('novabrasil_vehicles', JSON.stringify(loadedVehicles));
      } else {
        const saved = localStorage.getItem('novabrasil_vehicles');
        loadedVehicles = saved ? JSON.parse(saved) : [
          { id: 1, unitId: 1, plate: 'BRA2E19', model: 'Toyota Corolla Cross', color: 'Prata', parkingSpot: 'Vaga 12A', spotType: 'coberta', residentName: 'Carlos Eduardo Silva', condoId: 1 },
          { id: 2, unitId: 2, plate: 'ABC4D56', model: 'Honda Civic', color: 'Preto', parkingSpot: 'Vaga 14B', spotType: 'coberta', residentName: 'Mariana Oliveira Santos', condoId: 1 },
        ];
      }
      setVehicles(loadedVehicles);

      if (incidentsRes.ok) {
        loadedIncidents = await incidentsRes.json();
        localStorage.setItem('novabrasil_incidents', JSON.stringify(loadedIncidents));
      } else {
        const saved = localStorage.getItem('novabrasil_incidents');
        loadedIncidents = saved ? JSON.parse(saved) : [
          { id: 1, title: 'Barulho excessivo após as 22h', category: 'barulho', description: 'Música alta no apartamento 102 perturbando vizinhos.', severity: 'baixa', status: 'resolvida', registeredBy: 'Portaria', incidentDate: '2026-10-28', incidentTime: '22:30', createdAt: new Date().toISOString() },
        ];
      }
      setIncidents(loadedIncidents);

      if (areasRes.ok) {
        loadedAreas = await areasRes.json();
        localStorage.setItem('novabrasil_areas', JSON.stringify(loadedAreas));
      } else {
        const saved = localStorage.getItem('novabrasil_areas');
        loadedAreas = saved ? JSON.parse(saved) : [
          { id: 1, name: 'Salão de Festas Nobre', capacity: 60, cleaningFee: '150.00', description: 'Salão climatizado com cozinha completa.', active: true, condoId: 1 },
          { id: 2, name: 'Espaço Churrasqueira Gourmet', capacity: 25, cleaningFee: '80.00', description: 'Área externa com churrasqueira a carvão e freezer.', active: true, condoId: 1 },
        ];
      }
      setCommonAreas(loadedAreas);

      if (reservationsRes.ok) {
        loadedReservations = await reservationsRes.json();
        localStorage.setItem('novabrasil_reservations', JSON.stringify(loadedReservations));
      } else {
        const saved = localStorage.getItem('novabrasil_reservations');
        loadedReservations = saved ? JSON.parse(saved) : [];
      }
      setReservations(loadedReservations);

      if (accessRes.ok) {
        loadedAccessLogs = await accessRes.json();
        localStorage.setItem('novabrasil_access_logs', JSON.stringify(loadedAccessLogs));
      } else {
        const saved = localStorage.getItem('novabrasil_access_logs');
        loadedAccessLogs = saved ? JSON.parse(saved) : [
          { id: 1, visitorType: 'prestador', name: 'Marcos Eletricista (Enel)', document: '33.444.555-6', unitId: 1, authorizedBy: 'Carlos Eduardo Silva', entryTime: new Date(Date.now() - 3600000).toISOString(), condoId: 1 },
        ];
      }
      setAccessLogs(loadedAccessLogs);

      if (deliveriesRes.ok) {
        loadedDeliveries = await deliveriesRes.json();
        localStorage.setItem('novabrasil_deliveries', JSON.stringify(loadedDeliveries));
      } else {
        const saved = localStorage.getItem('novabrasil_deliveries');
        loadedDeliveries = saved ? JSON.parse(saved) : [
          { id: 1, unitId: 1, recipientName: 'Carlos Eduardo Silva', trackingCode: 'BR987654321', carrier: 'Mercado Livre', packageType: 'pacote', location: 'Armário Portaria - Prateleira 2', status: 'aguardando', receivedAt: new Date().toISOString(), condoId: 1 },
        ];
      }
      setDeliveries(loadedDeliveries);

      if (announcementsRes.ok) {
        loadedAnnouncements = await announcementsRes.json();
        localStorage.setItem('novabrasil_announcements', JSON.stringify(loadedAnnouncements));
      } else {
        const saved = localStorage.getItem('novabrasil_announcements');
        loadedAnnouncements = saved ? JSON.parse(saved) : [
          { id: 1, title: 'Manutenção Preventiva dos Elevadores', content: 'Informamos que na próxima terça-feira será realizada a manutenção preventiva anual nos elevadores.', priority: 'urgente', pinned: true, author: 'Administração Geral', createdAt: new Date().toISOString() },
        ];
      }
      setAnnouncements(loadedAnnouncements);

      if (pollsRes.ok) {
        loadedPolls = await pollsRes.json();
        localStorage.setItem('novabrasil_polls', JSON.stringify(loadedPolls));
      } else {
        const saved = localStorage.getItem('novabrasil_polls');
        loadedPolls = saved ? JSON.parse(saved) : [];
      }
      setPolls(loadedPolls);

      // Atualiza estatísticas com fallback calculado
      if (statsRes.ok) {
        setStats(await statsRes.json());
      } else {
        setStats({
          totalCondos: loadedCondos.length,
          totalBlocks: loadedBlocks.length,
          totalUnits: loadedUnits.length,
          totalResidents: loadedResidents.length,
          totalVehicles: loadedVehicles.length,
          pendingDeliveries: loadedDeliveries.filter((d) => d.status === 'aguardando').length,
          openIncidents: loadedIncidents.filter((i) => i.status === 'aberta').length,
          activeVisitors: loadedAccessLogs.filter((l) => !l.exitTime).length,
          confirmedReservations: loadedReservations.filter((r) => r.status === 'confirmada').length,
        });
      }
    } catch (err) {
      console.error('Erro ao carregar dados do NOVA BRASIL:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllData();
    } else {
      setLoading(false);
    }
  }, [role, isAuthenticated, selectedCondoId]);

  const pendingDeliveries = deliveries.filter((d) => d.status === 'aguardando');
  const openIncidents = incidents.filter((i) => i.status === 'aberta');
  const activeVisitors = accessLogs.filter((l) => !l.exitTime);

  // Retornos condicionais após a declaração de TODOS os hooks
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginView />;
  }

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col font-sans text-slate-900 antialiased">
      {/* Top Bar seguindo o contrato de 3 zonas com Seletor de Condomínio */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
        condominiums={condominiums}
        selectedCondoId={selectedCondoId}
        onSelectCondo={(id) => setSelectedCondoId(id)}
      />

      <div className="flex flex-1 max-w-7xl w-full mx-auto">
        {/* Barra Lateral com os Módulos Administrativos */}
        <div className="hidden md:block">
          <Sidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            pendingDeliveriesCount={pendingDeliveries.length}
            openIncidentsCount={openIncidents.length}
            onOpenRoleModal={() => setIsRoleModalOpen(true)}
          />
        </div>

        {/* Viewport Principal */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-slate-500 gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-slate-800" />
              <p className="text-xs font-medium">Carregando módulos do condomínio...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardView
                  stats={stats}
                  announcements={announcements}
                  pendingDeliveries={pendingDeliveries}
                  activeVisitors={activeVisitors}
                  condominiums={condominiums}
                  selectedCondoId={selectedCondoId}
                  onNavigate={(tab) => setActiveTab(tab)}
                  onRefresh={fetchAllData}
                />
              )}

              {activeTab === 'condominios' && (
                <CondominiumsView
                  condominiums={condominiums}
                  selectedCondoId={selectedCondoId}
                  onSelectCondo={(id) => setSelectedCondoId(id)}
                  onRefresh={fetchAllData}
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                  getAuthHeaders={getAuthHeaders}
                />
              )}

              {activeTab === 'portaria' && (
                <AccessDeliveriesView
                  accessLogs={accessLogs}
                  deliveries={deliveries}
                  units={units}
                  onRefresh={fetchAllData}
                />
              )}

              {activeTab === 'veiculos' && (
                <VehiclesView
                  vehicles={vehicles}
                  units={units}
                  onRefresh={fetchAllData}
                />
              )}

              {activeTab === 'ocorrencias' && (
                <IncidentsView
                  incidents={incidents}
                  units={units}
                  onRefresh={fetchAllData}
                />
              )}

              {activeTab === 'reservas' && (
                <ReservationsView
                  areas={commonAreas}
                  reservations={reservations}
                  units={units}
                  onRefresh={fetchAllData}
                />
              )}

              {activeTab === 'moradores' && (
                <ResidentsView
                  residents={residents}
                  units={units}
                  condominiums={condominiums}
                  selectedCondoId={selectedCondoId}
                  onRefresh={fetchAllData}
                />
              )}

              {activeTab === 'estrutura' && (
                <StructureView
                  blocks={blocks}
                  units={units}
                  condominiums={condominiums}
                  selectedCondoId={selectedCondoId}
                  onRefresh={fetchAllData}
                />
              )}

              {activeTab === 'comunicados' && (
                <AnnouncementsView
                  announcements={announcements}
                  polls={polls}
                  units={units}
                  onRefresh={fetchAllData}
                />
              )}

              {activeTab === 'usuarios' && (
                <UsersManagementView
                  condominiums={condominiums}
                  selectedCondoId={selectedCondoId}
                  onRefresh={fetchAllData}
                />
              )}
            </>
          )}
        </main>
      </div>

      {/* Modal de Nível de Acesso (Síndico / Portaria) */}
      <RoleModal
        isOpen={isRoleModalOpen}
        onClose={() => setIsRoleModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NovaBrasilMain />
    </AuthProvider>
  );
}
