import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrency, formatDate } from './utils';

export function exportToCSV(filename: string, rows: any[]) {
  if (!rows || !rows.length) return;
  const separator = ';';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) =>
        keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n|;)/g) >= 0) cell = `"${cell}"`;
            return cell;
          })
          .join(separator)
      )
      .join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(filename: string, sheets: { sheetName: string; data: any[] }[]) {
  const wb = XLSX.utils.book_new();

  sheets.forEach((s) => {
    const ws = XLSX.utils.json_to_sheet(s.data);
    XLSX.utils.book_append_sheet(wb, ws, s.sheetName.slice(0, 31));
  });

  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportToPDF(title: string, headers: string[], rows: any[][], filename?: string) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(13, 20, 36);
  doc.rect(0, 0, 210, 26, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text(title, 14, 16);

  autoTable(doc, {
    startY: 32,
    head: [headers],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: [56, 189, 248], textColor: [255, 255, 255] },
    margin: { left: 14, right: 14 },
  });

  doc.save(filename || `${title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
}

export function exportFinancialPDFReport(params: {
  title: string;
  period: string;
  incomes: any[];
  expenses: any[];
  summary: any;
}) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(13, 20, 36);
  doc.rect(0, 0, 210, 30, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.text(params.title, 14, 18);
  doc.setFontSize(10);
  doc.text(`Período: ${params.period} | Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 25);

  let startY = 38;

  // Key metrics summary box
  if (params.summary) {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text('Resumo Financeiro Consolidado', 14, startY);

    const summaryData = [
      ['Renda Recebida', formatCurrency(params.summary.incomeReceived)],
      ['Despesas Pagas', formatCurrency(params.summary.expensesPaid)],
      ['Contas Fixas Pagas', formatCurrency(params.summary.fixedPaid)],
      ['Dívidas Pagas', formatCurrency(params.summary.debtPaid)],
      ['Saldo Disponível', formatCurrency(params.summary.availableBalance)],
      ['Saldo Projetado', formatCurrency(params.summary.projectedBalance)],
      ['Taxa de Economia', `${params.summary.savingsRate}%`],
      ['Diagnóstico', params.summary.diagnostic?.label || 'Estável'],
    ];

    autoTable(doc, {
      startY: startY + 4,
      head: [['Métrica', 'Valor']],
      body: summaryData,
      theme: 'grid',
      headStyles: { fillColor: [56, 189, 248], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    startY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Incomes table
  if (params.incomes && params.incomes.length > 0) {
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text('Principais Receitas', 14, startY);

    const incomeRows = params.incomes.slice(0, 20).map((i) => [
      formatDate(i.date),
      i.description,
      i.categoryName,
      i.bankName,
      i.status,
      formatCurrency(i.amount),
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [['Data', 'Descrição', 'Categoria', 'Banco', 'Status', 'Valor']],
      body: incomeRows,
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });

    startY = (doc as any).lastAutoTable.finalY + 12;
  }

  // Expenses table
  if (params.expenses && params.expenses.length > 0) {
    if (startY > 230) {
      doc.addPage();
      startY = 20;
    }

    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.text('Principais Despesas e Saídas', 14, startY);

    const expenseRows = params.expenses.slice(0, 25).map((e) => [
      formatDate(e.date),
      e.description,
      e.type,
      e.categoryName,
      e.status,
      formatCurrency(e.amount),
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [['Data', 'Descrição', 'Tipo', 'Categoria', 'Status', 'Valor']],
      body: expenseRows,
      theme: 'striped',
      headStyles: { fillColor: [244, 63, 94], textColor: [255, 255, 255] },
      margin: { left: 14, right: 14 },
    });
  }

  doc.save(`${params.title.toLowerCase().replace(/\s+/g, '_')}.pdf`);
}
