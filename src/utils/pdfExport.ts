import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  OperationalLog,
  MaintenanceOrder,
  ShiftCoverage,
  CompanyAsset,
  PatrolVehicle,
  Condominium,
  SecurityAgent,
} from '../types/index.ts';

interface ReportMeta {
  condoName?: string;
  generatedBy?: string;
  roleLabel?: string;
}

// 1. Relatório do Livro de Ocorrências & Passagens de Turno
export const exportOperationalLogsPDF = (logs: OperationalLog[], meta: ReportMeta = {}) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const condoLabel = meta.condoName || 'Todos os Condomínios e Postos';
  const managerName = meta.generatedBy || 'Gestor Operacional';
  const nowStr = new Date().toLocaleString('pt-BR');

  // Cabeçalho da Empresa
  doc.setFillColor(30, 58, 138); // Azul escuro Nova Brasil
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NOVA BRASIL · FACILITIES, PORTARIA & SEGURANÇA', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('SISTEMA DE GESTÃO OPERACIONAL · RELATÓRIO DO LIVRO DE OCORRÊNCIAS & TURNOS', 14, 18);

  // Metadados do Relatório
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Posto / Filtro: `, 14, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(condoLabel, 38, 31);

  doc.setFont('helvetica', 'bold');
  doc.text(`Emitido por: `, 14, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(`${managerName} (${meta.roleLabel || 'Gestor'})`, 35, 37);

  doc.setFont('helvetica', 'bold');
  doc.text(`Data de Emissão: `, 180, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(nowStr, 210, 31);

  doc.setFont('helvetica', 'bold');
  doc.text(`Total de Registros: `, 180, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(`${logs.length} ocorrência(s)`, 212, 37);

  // Linha separadora
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 41, 283, 41);

  // Tabela de Ocorrências
  const tableData = logs.map((log, index) => {
    let acceptanceInfo = '';
    if (log.logType === 'passagem_turno') {
      const designatedStr = log.designatedIncomingAgentName ? `\nDesignado para assumir: ${log.designatedIncomingAgentName}` : '';
      if (log.incomingAgentAccepted) {
        acceptanceInfo = `\n\n[ACEITE ENTRANTE]: Confirmado por ${log.incomingAgentName || 'Agente'} às ${log.incomingAcceptedAt || '-'}\nChecklist: Chaves, rádios, bastão e guarita conferidos.`;
        if (log.incomingNotes) {
          acceptanceInfo += `\nRessalva: ${log.incomingNotes}`;
        }
      } else {
        acceptanceInfo = `\n\n[ACEITE ENTRANTE]: PENDENTE de conferência no posto.${designatedStr ? ` Aguardando aceite de: ${log.designatedIncomingAgentName}` : ''}`;
      }
    }

    return [
      `${index + 1}`,
      `${log.logDate}\n${log.logTime}`,
      log.condoName || 'Posto Geral',
      `${log.agentName}\nTurno: ${log.shiftType === 'dia' ? 'Diurno' : 'Noturno'}`,
      log.logType.replace(/_/g, ' ').toUpperCase(),
      log.severity.toUpperCase(),
      `${log.title}\n\n${log.description}${log.actionTaken ? `\n\n[Providência]: ${log.actionTaken}` : ''}${acceptanceInfo}`,
      log.incomingAgentAccepted ? 'Turno Aceito' : (log.status === 'resolvida' ? 'Resolvida' : 'Pendente'),
    ];
  });

  autoTable(doc, {
    startY: 44,
    head: [['#', 'Data/Hora', 'Condomínio', 'Agente / Turno', 'Tipo', 'Gravidade', 'Relato Operacional & Aceite de Posto', 'Status']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 32 },
      3: { cellWidth: 34 },
      4: { cellWidth: 26 },
      5: { cellWidth: 20 },
      6: { cellWidth: 109 },
      7: { cellWidth: 20, halign: 'center' },
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `NOVA BRASIL · Gestão Operacional de Condomínios e Postos · Página ${data.pageNumber} de ${pageCount}`,
        14,
        202
      );
    },
  });

  const safeFilename = `Relatorio_Ocorrencias_NovaBrasil_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
};

// 2. Dossiê de Manutenções & Ordens de Serviço
export const exportMaintenancesPDF = (maintenances: MaintenanceOrder[], meta: ReportMeta = {}) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const condoLabel = meta.condoName || 'Todos os Condomínios e Postos';
  const managerName = meta.generatedBy || 'Gestor Operacional';
  const nowStr = new Date().toLocaleString('pt-BR');

  // Cabeçalho da Empresa
  doc.setFillColor(15, 23, 42); // Slate escuro
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NOVA BRASIL · FACILITIES & MANUTENÇÃO PREDIAL', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('SISTEMA DE GESTÃO OPERACIONAL · ORDENS DE SERVIÇO & MANUTENÇÕES', 14, 18);

  // Metadados do Relatório
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Condomínio / Posto: `, 14, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(condoLabel, 48, 31);

  doc.setFont('helvetica', 'bold');
  doc.text(`Gestor Emissor: `, 14, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(`${managerName} (${meta.roleLabel || 'Gestor'})`, 42, 37);

  doc.setFont('helvetica', 'bold');
  doc.text(`Data de Emissão: `, 180, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(nowStr, 210, 31);

  doc.setFont('helvetica', 'bold');
  doc.text(`Total de O.S.: `, 180, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(`${maintenances.length} ordem(ns) de serviço`, 205, 37);

  // Linha separadora
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 41, 283, 41);

  // Tabela de Manutenções
  const tableData = maintenances.map((order) => [
    `OS-${String(order.id).padStart(4, '0')}`,
    order.condoName || 'Posto Geral',
    order.category.toUpperCase(),
    order.maintenanceType === 'preventiva' ? 'Preventiva' : 'Corretiva',
    order.title,
    order.technicianName || 'Equipe Técnica',
    order.scheduledDate || '-',
    order.cost || 'R$ 0,00',
    order.status.replace(/_/g, ' ').toUpperCase(),
    order.description + (order.solutionDetails ? `\n\n[Solução]: ${order.solutionDetails}` : ''),
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['O.S.', 'Condomínio', 'Categoria', 'Tipo', 'Título', 'Técnico', 'Data Prevista', 'Custo', 'Status', 'Descrição / Solução']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 32 },
      2: { cellWidth: 22 },
      3: { cellWidth: 20 },
      4: { cellWidth: 35 },
      5: { cellWidth: 26 },
      6: { cellWidth: 22 },
      7: { cellWidth: 20 },
      8: { cellWidth: 24, halign: 'center' },
      9: { cellWidth: 52 },
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `NOVA BRASIL · Gestão Operacional de Condomínios e Manutenções · Página ${data.pageNumber} de ${pageCount}`,
        14,
        202
      );
    },
  });

  const safeFilename = `Relatorio_Manutencoes_NovaBrasil_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
};

// 3. Relatório de Escala 12x36, Controle de Faltas, Coberturas e Atestados
export const exportShiftScalePDF = (
  coverages: ShiftCoverage[],
  agents: SecurityAgent[],
  meta: ReportMeta = {}
) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const condoLabel = meta.condoName || 'Todos os Condomínios e Postos';
  const managerName = meta.generatedBy || 'Gestor Operacional';
  const nowStr = new Date().toLocaleString('pt-BR');

  // Cabeçalho da Empresa
  doc.setFillColor(30, 64, 175); // Azul royal
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NOVA BRASIL · GESTÃO DE EFETIVO & ESCALAS 12x36', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('CONTROLE DE FALTAS, ATESTADOS, COBERTURAS E DISPONIBILIDADE DO POSTO', 14, 18);

  // Metadados
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Posto / Filtro: `, 14, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(condoLabel, 38, 31);

  doc.setFont('helvetica', 'bold');
  doc.text(`Emitido por: `, 14, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(`${managerName} (${meta.roleLabel || 'Gestor'})`, 35, 37);

  doc.setFont('helvetica', 'bold');
  doc.text(`Data de Emissão: `, 180, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(nowStr, 210, 31);

  const coveredCount = coverages.filter((c) => c.coverageStatus === 'coberto').length;
  const uncoveredCount = coverages.filter((c) => c.coverageStatus === 'descoberto').length;

  doc.setFont('helvetica', 'bold');
  doc.text(`Status Geral: `, 180, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(`${coverages.length} registro(s) | ${coveredCount} Cobertos | ${uncoveredCount} Descobertos`, 205, 37);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 41, 283, 41);

  const tableData = coverages.map((item, index) => {
    const absenceLabel = {
      falta_injustificada: 'Falta Injustificada',
      atestado_medico: 'Atestado Médico',
      folga_programada: 'Folga Programada',
      licenca: 'Licença / Afastamento',
      troca_plantao: 'Troca de Plantão',
    }[item.absenceType] || item.absenceType;

    const shiftLabel = item.shiftType === '12x36_dia' ? '12x36 Diurno (06h às 18h)' : '12x36 Noturno (18h às 06h)';

    const coverageText = item.coverageStatus === 'coberto'
      ? `SIM - Coberto por:\n${item.coveringAgentName || 'Folguista Designado'}`
      : (item.coverageStatus === 'em_cobertura' ? 'Em Alocação de Substituto' : '⚠️ NÃO - POSTO DESCOBERTO');

    return [
      `${index + 1}`,
      item.date,
      item.condoName || 'Posto Geral',
      item.stationName,
      shiftLabel,
      item.scheduledAgentName,
      `${absenceLabel}${item.cidCode ? ` (CID: ${item.cidCode})` : ''}${item.absenceReason ? `\nMotivo: ${item.absenceReason}` : ''}`,
      coverageText,
      item.coverageStatus === 'coberto' ? 'Resolvido' : 'Urgente',
    ];
  });

  autoTable(doc, {
    startY: 44,
    head: [['#', 'Data Plantão', 'Condomínio', 'Posto de Serviço', 'Escala / Turno', 'Agente Titular', 'Ocorrência / Motivo', 'Status Cobertura', 'Situação']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 20 },
      2: { cellWidth: 32 },
      3: { cellWidth: 34 },
      4: { cellWidth: 32 },
      5: { cellWidth: 32 },
      6: { cellWidth: 45 },
      7: { cellWidth: 45 },
      8: { cellWidth: 21, halign: 'center' },
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `NOVA BRASIL · Gestão Operacional de Condomínios e Escalas 12x36 · Página ${data.pageNumber} de ${pageCount}`,
        14,
        202
      );
    },
  });

  const safeFilename = `Relatorio_Escalas_12x36_NovaBrasil_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
};

// 4. Relatório de Inventário, Materiais & Cautelas no Posto
export const exportAssetsPDF = (assets: CompanyAsset[], meta: ReportMeta = {}) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const condoLabel = meta.condoName || 'Todos os Condomínios e Postos';
  const managerName = meta.generatedBy || 'Gestor Operacional';
  const nowStr = new Date().toLocaleString('pt-BR');

  // Cabeçalho
  doc.setFillColor(71, 85, 105); // Slate
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NOVA BRASIL · CONTROLE DE PATRIMÔNIO & CAUTELAS DO POSTO', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('INVENTÁRIO DE MATERIAIS, RÁDIOS HT, BASTÕES DE RONDA E TERMOS DE CAUTELA', 14, 18);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Condomínio: `, 14, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(condoLabel, 36, 31);

  doc.setFont('helvetica', 'bold');
  doc.text(`Emitido por: `, 14, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(`${managerName} (${meta.roleLabel || 'Gestor'})`, 35, 37);

  doc.setFont('helvetica', 'bold');
  doc.text(`Data de Emissão: `, 180, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(nowStr, 210, 31);

  doc.setFont('helvetica', 'bold');
  doc.text(`Total de Itens: `, 180, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(`${assets.length} materiais cadastrados`, 205, 37);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 41, 283, 41);

  const tableData = assets.map((a, idx) => [
    `${idx + 1}`,
    a.assetTag || `PAT-${String(a.id).padStart(4, '0')}`,
    a.name,
    a.condoName || 'Posto Geral',
    a.category.toUpperCase(),
    `${a.quantity || 1} un`,
    a.condition.toUpperCase(),
    a.inUseWithAgentName ? `EM CAUTELA com:\n${a.inUseWithAgentName} (desde ${a.inUseSince || '-'})` : 'DISPONÍVEL NO POSTO',
    a.notes || '-',
  ]);

  autoTable(doc, {
    startY: 44,
    head: [['#', 'Tombamento', 'Equipamento / Material', 'Condomínio', 'Categoria', 'Qtd', 'Estado', 'Posse / Cautela Atual', 'Observações']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 24 },
      2: { cellWidth: 46 },
      3: { cellWidth: 32 },
      4: { cellWidth: 26 },
      5: { cellWidth: 16, halign: 'center' },
      6: { cellWidth: 20 },
      7: { cellWidth: 45 },
      8: { cellWidth: 52 },
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `NOVA BRASIL · Gestão de Patrimônio e Cautelas · Página ${data.pageNumber} de ${pageCount}`,
        14,
        202
      );
    },
  });

  const safeFilename = `Inventario_Patrimonio_NovaBrasil_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
};

// 5. Relatório de Frotas de Ronda, Checklists & Condutores
export const exportPatrolVehiclesPDF = (vehicles: PatrolVehicle[], meta: ReportMeta = {}) => {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const condoLabel = meta.condoName || 'Todos os Condomínios e Postos';
  const managerName = meta.generatedBy || 'Gestor Operacional';
  const nowStr = new Date().toLocaleString('pt-BR');

  // Cabeçalho
  doc.setFillColor(217, 119, 6); // Âmbar / Laranja Operacional
  doc.rect(0, 0, 297, 24, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('NOVA BRASIL · FROTA DE RONDA MOTORIZADA & CHECKLISTS', 14, 11);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('BOLETIM DE CONTROLE DE VIATURAS, ODÔMETRO, COMBUSTÍVEL E CONDUTORES', 14, 18);

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text(`Condomínio: `, 14, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(condoLabel, 36, 31);

  doc.setFont('helvetica', 'bold');
  doc.text(`Emitido por: `, 14, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(`${managerName} (${meta.roleLabel || 'Gestor'})`, 35, 37);

  doc.setFont('helvetica', 'bold');
  doc.text(`Data de Emissão: `, 180, 31);
  doc.setFont('helvetica', 'normal');
  doc.text(nowStr, 210, 31);

  doc.setFont('helvetica', 'bold');
  doc.text(`Total de Veículos: `, 180, 37);
  doc.setFont('helvetica', 'normal');
  doc.text(`${vehicles.length} viatura(s)`, 212, 37);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 41, 283, 41);

  const tableData = vehicles.map((v, idx) => {
    const statusLabel = {
      em_ronda: 'Em Ronda Ativa',
      disponivel: 'Disponível no Posto',
      manutencao: 'Em Manutenção',
      abastecimento: 'Em Abastecimento',
    }[v.status] || v.status;

    const inServiceText = v.inServiceWithAgentName
      ? `EM SERVIÇO com:\n${v.inServiceWithAgentName} (assumiu às ${v.serviceStartedAt || '-'} com ${v.startKm || v.currentKm} Km)`
      : (v.driverName ? `Condutor habitual:\n${v.driverName}` : 'Nenhum condutor em serviço');

    return [
      `${idx + 1}`,
      v.plate,
      `${v.model} (${v.color})`,
      v.condoName || 'Posto Geral',
      v.type.toUpperCase(),
      `${v.currentKm} km`,
      v.fuelLevel || '3/4',
      statusLabel,
      inServiceText,
      v.routeDescription || 'Ronda perimetral padrão',
    ];
  });

  autoTable(doc, {
    startY: 44,
    head: [['#', 'Placa', 'Modelo / Cor', 'Condomínio', 'Tipo', 'Odômetro', 'Tanque', 'Status', 'Condutor / Agente em Serviço', 'Itinerário de Ronda']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [217, 119, 6],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59],
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 22 },
      2: { cellWidth: 34 },
      3: { cellWidth: 30 },
      4: { cellWidth: 20 },
      5: { cellWidth: 20 },
      6: { cellWidth: 16 },
      7: { cellWidth: 24 },
      8: { cellWidth: 45 },
      9: { cellWidth: 50 },
    },
    margin: { left: 14, right: 14, bottom: 20 },
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `NOVA BRASIL · Gestão de Frota e Rondas · Página ${data.pageNumber} de ${pageCount}`,
        14,
        202
      );
    },
  });

  const safeFilename = `Boletim_Frota_Rondas_NovaBrasil_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(safeFilename);
};
