import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { RoleModal } from './components/RoleModal.tsx';
import { DashboardView } from './components/DashboardView.tsx';
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
  const { getAuthHeaders, role, isAuthenticated, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const fetchAllData = async () => {
    try {
      const headers = await getAuthHeaders();
      const [
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
        fetch('/api/dashboard/stats', { headers }),
        fetch('/api/blocks', { headers }),
        fetch('/api/units', { headers }),
        fetch('/api/residents', { headers }),
        fetch('/api/vehicles', { headers }),
        fetch('/api/incidents', { headers }),
        fetch('/api/common-areas', { headers }),
        fetch('/api/reservations', { headers }),
        fetch('/api/access-logs', { headers }),
        fetch('/api/deliveries', { headers }),
        fetch('/api/announcements', { headers }),
        fetch('/api/polls', { headers }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (blocksRes.ok) setBlocks(await blocksRes.json());
      if (unitsRes.ok) setUnits(await unitsRes.json());
      if (residentsRes.ok) setResidents(await residentsRes.json());
      if (vehiclesRes.ok) setVehicles(await vehiclesRes.json());
      if (incidentsRes.ok) setIncidents(await incidentsRes.json());
      if (areasRes.ok) setCommonAreas(await areasRes.json());
      if (reservationsRes.ok) setReservations(await reservationsRes.json());
      if (accessRes.ok) setAccessLogs(await accessRes.json());
      if (deliveriesRes.ok) setDeliveries(await deliveriesRes.json());
      if (announcementsRes.ok) setAnnouncements(await announcementsRes.json());
      if (pollsRes.ok) setPolls(await pollsRes.json());
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
  }, [role, isAuthenticated]);

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
      {/* Top Bar seguindo o contrato de 3 zonas */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenRoleModal={() => setIsRoleModalOpen(true)}
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
                  onNavigate={(tab) => setActiveTab(tab)}
                  onRefresh={fetchAllData}
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
                  onRefresh={fetchAllData}
                />
              )}

              {activeTab === 'estrutura' && (
                <StructureView
                  blocks={blocks}
                  units={units}
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
                <UsersManagementView onRefresh={fetchAllData} />
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
