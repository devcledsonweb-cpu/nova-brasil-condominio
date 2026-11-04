import { doc, setDoc, getDocs, collection, terminate } from 'firebase/firestore';
import { db } from '../src/lib/firebase.ts';
import { COLLECTIONS } from '../src/services/firestoreSync.ts';
import fs from 'fs';
import path from 'path';

async function seed() {
  console.log('--- INICIANDO SEED NO FIRESTORE (nova-brasil-ac663) ---');

  // 1. Condomínios Padrão da NOVA BRASIL
  const condos = [
    {
      id: 1,
      name: 'Residencial Parque das Flores',
      cnpj: '12.345.678/0001-90',
      address: 'Av. das Flores, 1500 - Jardim Primavera',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      supervisorName: 'Carlos Alberto Mendes',
      supervisorPhone: '(11) 98765-4321',
      contractType: 'Portaria 24h + Ronda Noturna',
      sindicoName: 'Carlos Alberto Mendes',
      sindicoPhone: '(11) 98765-4321',
      sindicoEmail: 'sindico@parquedasflores.com.br',
      totalUnits: 180,
      status: 'ativo',
      photoUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800&auto=format&fit=crop&q=80',
      serviceStations: [
        {
          id: 'st-1-1',
          condoId: 1,
          name: 'Portaria Principal (Social)',
          type: 'portaria_principal',
          shiftSchedule: '12x36 Diurno (06h às 18h)',
          assignedAgentName: 'Carlos Alberto Mendes',
          instructions: 'Controle rigoroso de visitantes e prestadores de serviço com documento com foto.',
        },
        {
          id: 'st-1-2',
          condoId: 1,
          name: 'Portaria de Serviço / Entregas',
          type: 'portaria_servico',
          shiftSchedule: '12x36 Diurno (06h às 18h)',
          assignedAgentName: 'Francisco Oliveira Costa',
          instructions: 'Triagem de encomendas e delivery com verificação no interfone.',
        },
        {
          id: 'st-1-3',
          condoId: 1,
          name: 'Área de Lazer / Piscina',
          type: 'area_lazer',
          shiftSchedule: '12x36 Diurno (08h às 20h)',
          assignedAgentName: null,
          instructions: 'Fiscalização de convidados nas churrasqueiras e salão de festas.',
        },
        {
          id: 'st-1-4',
          condoId: 1,
          name: 'Ronda Perimetral',
          type: 'ronda_perimetro',
          shiftSchedule: '12x36 Noturno (18h às 06h)',
          assignedAgentName: 'Roberto Silveira Santos',
          instructions: 'Ronda perimetral de 30 em 30 minutos com bastão vigia.',
        },
      ],
      createdAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 2,
      name: 'Edifício Alphaville Corporate',
      cnpj: '98.765.432/0001-10',
      address: 'Alameda Rio Negro, 500 - Alphaville',
      city: 'Barueri',
      state: 'SP',
      zipCode: '06454-000',
      supervisorName: 'Valdemar Costa Lima',
      supervisorPhone: '(11) 96543-2109',
      contractType: 'Controle de Acesso Corporativo + CFTV',
      sindicoName: 'Valdemar Costa Lima',
      sindicoPhone: '(11) 96543-2109',
      sindicoEmail: 'gestao@alphavillecorporate.com.br',
      totalUnits: 320,
      status: 'ativo',
      photoUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
      serviceStations: [
        {
          id: 'st-2-1',
          condoId: 2,
          name: 'Recepção Torre A',
          type: 'portaria_principal',
          shiftSchedule: '12x36 Diurno (07h às 19h)',
          assignedAgentName: 'Marcos Vinicius Rezende',
          instructions: 'Emissão de crachás provisórios e catracas biométricas.',
        },
        {
          id: 'st-2-2',
          condoId: 2,
          name: 'Docas de Carga & Descarga',
          type: 'portaria_servico',
          shiftSchedule: '6x1 Manhã (06h às 14h)',
          assignedAgentName: null,
          instructions: 'Inspeção veicular de caminhões e vans de entrega.',
        },
      ],
      createdAt: '2026-02-15T10:00:00.000Z',
    },
    {
      id: 3,
      name: 'Condomínio Morada do Sol',
      cnpj: '45.678.901/0001-23',
      address: 'Rua dos Pinheiros, 780 - Pinheiros',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05422-001',
      supervisorName: 'Guilherme Albuquerque',
      supervisorPhone: '(11) 98877-6655',
      contractType: 'Portaria Híbrida + Ronda Motorizada',
      sindicoName: 'Guilherme Albuquerque',
      sindicoPhone: '(11) 98877-6655',
      sindicoEmail: 'contato@moradadosol.com.br',
      totalUnits: 96,
      status: 'ativo',
      photoUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&auto=format&fit=crop&q=80',
      serviceStations: [
        {
          id: 'st-3-1',
          condoId: 3,
          name: 'Portaria Social',
          type: 'portaria_principal',
          shiftSchedule: '12x36 Diurno',
          assignedAgentName: null,
          instructions: 'Atendimento a moradores e liberação de encomendas.',
        },
      ],
      createdAt: '2026-03-01T10:00:00.000Z',
    },
    {
      id: 4,
      name: 'Residencial Bosque dos Pássaros',
      cnpj: '34.567.890/0001-45',
      address: 'Rua das Andorinhas, 210 - Morumbi',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '05650-000',
      supervisorName: 'Carlos Alberto Mendes',
      supervisorPhone: '(11) 98765-4321',
      contractType: 'Portaria 24h + Vigilância Armada',
      sindicoName: 'Carlos Alberto Mendes',
      sindicoPhone: '(11) 98765-4321',
      sindicoEmail: 'sindico@bosquedospassaros.com.br',
      totalUnits: 140,
      status: 'implantacao',
      photoUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80',
      imageUrl: 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&auto=format&fit=crop&q=80',
      serviceStations: [
        {
          id: 'st-4-1',
          condoId: 4,
          name: 'Guarita de Entrada',
          type: 'portaria_principal',
          shiftSchedule: '12x36 Diurno',
          assignedAgentName: null,
          instructions: 'Posto em fase de implantação contratual.',
        },
      ],
      createdAt: '2026-04-12T10:00:00.000Z',
    },
  ];

  for (const c of condos) {
    await setDoc(doc(db, COLLECTIONS.CONDOMINIUMS, String(c.id)), c, { merge: true });
    console.log(`✓ Condomínio gravado no Firestore: ${c.name} (ID: ${c.id})`);
  }

  // 2. Agentes de Portaria e Segurança
  const agents = [
    {
      id: 1,
      condoId: 1,
      condoIds: [1],
      condoName: 'Residencial Parque das Flores',
      condoNames: ['Residencial Parque das Flores'],
      name: 'Carlos Alberto Mendes',
      cpf: '234.567.890-12',
      phone: '(11) 98765-4321',
      badgeNumber: 'NB-0412',
      roleTitle: 'agente_portaria',
      shift: '12x36_dia',
      status: 'em_servico',
      admissionDate: '15/02/2023',
      notes: 'Líder da guarnição diurna. Curso de atendimento tático e CFTV atualizado.',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
      assignedStation: 'Portaria Principal (Social)',
      assignedStationId: 'st-1-1',
      accessEmail: 'carlos.mendes@novabrasil.com',
      createdAt: '2026-01-15T08:00:00.000Z',
    },
    {
      id: 2,
      condoId: 1,
      condoIds: [1],
      condoName: 'Residencial Parque das Flores',
      condoNames: ['Residencial Parque das Flores'],
      name: 'Roberto Silveira Santos',
      cpf: '345.678.901-23',
      phone: '(11) 97654-3210',
      badgeNumber: 'NB-0418',
      roleTitle: 'ronda_motorizada',
      shift: '12x36_noite',
      status: 'em_servico',
      admissionDate: '10/05/2023',
      notes: 'Responsável pela ronda perimetral e bastão vigia noturno.',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
      assignedStation: 'Ronda Perimetral',
      assignedStationId: 'st-1-4',
      accessEmail: 'roberto.santos@novabrasil.com',
      createdAt: '2026-01-20T08:00:00.000Z',
    },
    {
      id: 3,
      condoId: 2,
      condoIds: [2],
      condoName: 'Edifício Alphaville Corporate',
      condoNames: ['Edifício Alphaville Corporate'],
      name: 'Valdemar Costa Lima',
      cpf: '456.789.012-34',
      phone: '(11) 96543-2109',
      badgeNumber: 'NB-0390',
      roleTitle: 'lider_posto',
      shift: '12x36_dia',
      status: 'em_servico',
      admissionDate: '01/11/2022',
      notes: 'Supervisor operacional do Posto Alphaville.',
      photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&auto=format&fit=crop&q=80',
      assignedStation: 'Recepção Torre A',
      assignedStationId: 'st-2-1',
      accessEmail: 'valdemar.lima@novabrasil.com',
      createdAt: '2026-02-01T08:00:00.000Z',
    },
    {
      id: 4,
      condoId: 2,
      condoIds: [2],
      condoName: 'Edifício Alphaville Corporate',
      condoNames: ['Edifício Alphaville Corporate'],
      name: 'Marcos Vinicius Rezende',
      cpf: '567.890.123-45',
      phone: '(11) 95432-1098',
      badgeNumber: 'NB-0520',
      roleTitle: 'agente_portaria',
      shift: '12x36_dia',
      status: 'folga',
      admissionDate: '20/01/2024',
      notes: 'Controle de triagem de caminhões e prestadores de serviços.',
      photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&auto=format&fit=crop&q=80',
      assignedStation: 'Recepção Torre A',
      assignedStationId: 'st-2-1',
      accessEmail: 'marcos.rezende@novabrasil.com',
      createdAt: '2026-02-10T08:00:00.000Z',
    },
  ];

  for (const a of agents) {
    await setDoc(doc(db, COLLECTIONS.AGENTS, String(a.id)), a, { merge: true });
    console.log(`✓ Agente gravado no Firestore: ${a.name} (ID: ${a.id})`);
  }

  // 3. Viaturas e Veículos de Ronda
  const vehicles = [
    {
      id: 1,
      condoId: 1,
      condoName: 'Residencial Parque das Flores',
      type: 'moto',
      plate: 'BRA-2E19',
      model: 'Honda XRE 300 Rally',
      brand: 'Honda',
      color: 'Preto Fosco',
      currentKm: 14850,
      driverName: 'Roberto Silveira Santos',
      inServiceWithAgentName: 'Roberto Silveira Santos',
      status: 'em_ronda',
      routeDescription: 'Perímetro externo e garagens a cada 30min',
      fuelLevel: '3/4',
      lastPatrolAt: 'Hoje às 15:45',
      createdAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 2,
      condoId: 2,
      condoName: 'Edifício Alphaville Corporate',
      type: 'carro',
      plate: 'SP-NB8800',
      model: 'Renault Kwid Operacional',
      brand: 'Renault',
      color: 'Branco / Identificado',
      currentKm: 32400,
      driverName: 'Valdemar Costa Lima',
      inServiceWithAgentName: 'Valdemar Costa Lima',
      status: 'disponivel',
      routeDescription: 'Supervisão tática de docas e perímetro empresarial',
      fuelLevel: 'Cheio',
      lastPatrolAt: 'Hoje às 14:00',
      createdAt: '2026-02-01T10:00:00.000Z',
    },
  ];

  for (const v of vehicles) {
    await setDoc(doc(db, COLLECTIONS.VEHICLES, String(v.id)), v, { merge: true });
    console.log(`✓ Viatura gravada no Firestore: ${v.model} (${v.plate})`);
  }

  // 4. Materiais e Patrimônio da Empresa
  const assets = [
    {
      id: 1,
      condoId: 1,
      condoName: 'Residencial Parque das Flores',
      name: 'Rádio Comunicador HT Baofeng UV-5R',
      category: 'comunicacao',
      assetTag: 'NB-HT-01',
      serialNumber: 'BFG-98442-SP',
      quantity: 4,
      condition: 'bom',
      deliveryDate: '15/01/2026',
      responsibleAgent: 'Carlos Alberto Mendes',
      notes: 'Baterias sobressalentes e bases carregadoras na portaria principal.',
      createdAt: '2026-01-15T10:00:00.000Z',
    },
    {
      id: 2,
      condoId: 1,
      condoName: 'Residencial Parque das Flores',
      name: 'Bastão Vigia Vigia Guardus G5',
      category: 'seguranca_ronda',
      assetTag: 'NB-RONDA-01',
      serialNumber: 'GRD-5512-BR',
      quantity: 1,
      condition: 'bom',
      deliveryDate: '10/01/2026',
      responsibleAgent: 'Roberto Silveira Santos',
      notes: '12 iButtons instalados no perímetro do condomínio.',
      createdAt: '2026-01-10T10:00:00.000Z',
    },
    {
      id: 3,
      condoId: 2,
      condoName: 'Edifício Alphaville Corporate',
      name: 'Detector de Metais Portátil Garrett',
      category: 'seguranca_ronda',
      assetTag: 'NB-DET-02',
      serialNumber: 'GRT-4421',
      quantity: 2,
      condition: 'novo',
      deliveryDate: '01/02/2026',
      responsibleAgent: 'Marcos Vinicius Rezende',
      notes: 'Utilizado na triagem de visitantes e prestadores nas docas.',
      createdAt: '2026-02-01T10:00:00.000Z',
    },
  ];

  for (const ast of assets) {
    await setDoc(doc(db, COLLECTIONS.ASSETS, String(ast.id)), ast, { merge: true });
    console.log(`✓ Patrimônio gravado no Firestore: ${ast.name} (ID: ${ast.id})`);
  }

  // 5. Ordens de Manutenção Preventiva/Corretiva
  const maintenances = [
    {
      id: 1,
      condoId: 1,
      condoName: 'Residencial Parque das Flores',
      title: 'Revisão dos Motores de Portão Pivotante Social',
      category: 'portoes',
      maintenanceType: 'preventiva',
      technicianName: 'Eletrônica Paulista Seg',
      scheduledDate: '2026-11-08',
      cost: 'R$ 650,00',
      status: 'agendada',
      description: 'Troca de cremalheira, lubrificação e ajuste fino dos sensores antiesmagamento.',
      createdAt: '2026-11-01T10:00:00.000Z',
    },
    {
      id: 2,
      condoId: 2,
      condoName: 'Edifício Alphaville Corporate',
      title: 'Manutenção e Limpeza das Câmeras IP CFTV Torre A',
      category: 'cftv',
      maintenanceType: 'preventiva',
      technicianName: 'TechVision Facilities',
      scheduledDate: '2026-11-05',
      cost: 'R$ 1.200,00',
      status: 'em_andamento',
      description: 'Alinhamento óptico e substituição de conectores RJ45 oxidados no subsolo.',
      createdAt: '2026-11-02T10:00:00.000Z',
    },
  ];

  for (const m of maintenances) {
    await setDoc(doc(db, COLLECTIONS.MAINTENANCES, String(m.id)), m, { merge: true });
    console.log(`✓ Manutenção gravada no Firestore: ${m.title}`);
  }

  // 6. Livro de Ocorrências e Passagem de Turno
  const logs = [
    {
      id: 1,
      condoId: 1,
      condoName: 'Residencial Parque das Flores',
      agentName: 'Carlos Alberto Mendes',
      shiftType: 'dia',
      logType: 'passagem_turno',
      severity: 'informativa',
      status: 'resolvida',
      title: 'Passagem de Turno Diurno Normal',
      description: 'Assumido o posto com 4 rádios HT, 1 bastão vigia e chaves de portão conferidas. Sem incidentes graves durante o dia.',
      logDate: '03/11/2026',
      logTime: '18:00',
      createdAt: '2026-11-03T18:00:00.000Z',
    },
    {
      id: 2,
      condoId: 1,
      condoName: 'Residencial Parque das Flores',
      agentName: 'Roberto Silveira Santos',
      shiftType: 'noite',
      logType: 'ronda_preventiva',
      severity: 'atencao',
      status: 'resolvida',
      title: 'Lâmpada do Perímetro Fundos Queimada',
      description: 'Durante a ronda das 22h, foi constatada lâmpada do refletor 3 apagada próxima ao muro dos fundos. Comunicado ao supervisor.',
      actionTaken: 'Anotado para O.S. elétrica e intensificada a ronda com lanterna de alta potência.',
      logDate: '03/11/2026',
      logTime: '22:15',
      createdAt: '2026-11-03T22:15:00.000Z',
    },
  ];

  for (const l of logs) {
    await setDoc(doc(db, COLLECTIONS.LOGS, String(l.id)), l, { merge: true });
    console.log(`✓ Ocorrência gravada no Firestore: ${l.title}`);
  }

  // 7. Usuários do Sistema para Autenticação Unificada
  const users = [
    {
      id: 1,
      uid: 'admin-master',
      name: 'Administrador Geral',
      email: 'administrativo@novabrasil.com',
      password: '@nb32573515',
      role: 'sindico',
      permissions: JSON.stringify(['all']),
      condoId: null,
      condoIds: [],
      condoName: 'Todos os Condomínios',
      condoNames: ['Todos os Condomínios'],
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 2,
      uid: 'user-portaria',
      name: 'Portaria Central',
      email: 'portaria@novabrasil.com',
      password: 'portaria123',
      role: 'portaria',
      permissions: JSON.stringify(['portaria', 'ronda', 'materiais', 'ocorrencias']),
      condoId: null,
      condoIds: [],
      condoName: 'Posto Central',
      condoNames: ['Posto Central'],
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
    {
      id: 7,
      uid: 'usr-cledson-admin',
      name: 'CLEDSON DA SILVA SALES',
      email: 'cledson@novabrasil.com',
      password: '@nb32573515',
      role: 'sindico',
      permissions: JSON.stringify(['all']),
      condoId: null,
      condoIds: [],
      condoName: 'Todos os Condomínios',
      condoNames: ['Todos os Condomínios'],
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
    },
  ];

  for (const u of users) {
    await setDoc(doc(db, COLLECTIONS.USERS, String(u.id)), u, { merge: true });
    console.log(`✓ Usuário gravado no Firestore: ${u.email}`);
  }

  console.log('--- SEED CONCLUÍDO COM SUCESSO! ---');
  await terminate(db);
}

seed().catch((err) => {
  console.error('ERRO NO SEED:', err);
  process.exit(1);
});
