'use client';

import React, { useState } from 'react';
import {
  FileText,
  Download,
  FileSpreadsheet,
  FileCheck2,
  Calendar,
  Sparkles,
  Printer,
  CheckCircle2,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { FilterBar } from '@/components/layout/FilterBar';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export-helpers';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function RelatoriosPage() {
  const { selectedYear, selectedMonth } = useFinancial();
  const [generating, setGenerating] = useState<string | null>(null);

  const handleExportReport = async (reportType: string, format: 'pdf' | 'excel' | 'csv') => {
    setGenerating(`${reportType}-${format}`);
    try {
      // Fetch fresh raw data
      const query = new URLSearchParams();
      if (selectedYear && selectedYear !== 'TODOS') query.set('year', selectedYear);
      if (selectedMonth && selectedMonth !== 'TODOS') query.set('month', selectedMonth);

      const [incomesRes, expensesRes, cardsRes] = await Promise.all([
        fetch(`/api/incomes?${query.toString()}`).then((r) => r.json()),
        fetch(`/api/expenses?${query.toString()}`).then((r) => r.json()),
        fetch(`/api/credit-cards/purchases?${query.toString()}`).then((r) => r.json()),
      ]);

      const incomes = Array.isArray(incomesRes) ? incomesRes : [];
      const expenses = Array.isArray(expensesRes) ? expensesRes : [];
      const purchases = Array.isArray(cardsRes) ? cardsRes : [];

      const reportTitle = `Relatório Financeiro - ${selectedMonth} ${selectedYear}`;

      if (format === 'csv') {
        const rows = [
          ...incomes.map((i: any) => ({
            Tipo: 'RECEITA',
            Data: formatDate(i.date),
            Descrição: i.description,
            Categoria: i.categoryName,
            Valor: i.amount,
            Status: i.status,
            Banco: i.bankName,
          })),
          ...expenses.map((e: any) => ({
            Tipo: 'DESPESA',
            Data: formatDate(e.date),
            Descrição: e.description,
            Categoria: e.categoryName,
            Valor: -e.amount,
            Status: e.status,
            Banco: e.bankName,
          })),
        ];
        exportToCSV(`relatorio_${selectedMonth}_${selectedYear}`, rows);
      } else if (format === 'excel') {
        exportToExcel(`relatorio_${selectedMonth}_${selectedYear}`, [
          {
            sheetName: 'Receitas',
            data: incomes.map((i: any) => ({
              Data: formatDate(i.date),
              Descrição: i.description,
              Categoria: i.categoryName,
              Valor: i.amount,
              Status: i.status,
              Banco: i.bankName,
            })),
          },
          {
            sheetName: 'Despesas',
            data: expenses.map((e: any) => ({
              Data: formatDate(e.date),
              Descrição: e.description,
              Categoria: e.categoryName,
              Valor: e.amount,
              Status: e.status,
              Banco: e.bankName,
            })),
          },
          {
            sheetName: 'Cartão de Crédito',
            data: purchases.map((p: any) => ({
              Data: formatDate(p.date),
              Descrição: p.description,
              Cartão: p.card?.name || 'Cartão',
              Parcelas: `${p.currentInstallment}/${p.totalInstallments}`,
              ValorParcela: p.installmentAmount,
              Total: p.totalAmount,
            })),
          },
        ]);
      } else if (format === 'pdf') {
        const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor', 'Status'];
        const rows = [
          ...incomes.map((i: any) => [
            formatDate(i.date),
            'Receita',
            i.description,
            i.categoryName,
            formatCurrency(i.amount),
            i.status,
          ]),
          ...expenses.map((e: any) => [
            formatDate(e.date),
            'Despesa',
            e.description,
            e.categoryName,
            formatCurrency(e.amount),
            e.status,
          ]),
        ];

        exportToPDF(reportTitle, headers, rows, `relatorio_${selectedMonth}_${selectedYear}.pdf`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setGenerating(null);
    }
  };

  const reportsList = [
    {
      id: 'consolidated',
      title: 'Balanço Mensal Consolidado',
      description: 'Extrato completo com total de receitas, despesas, faturas de cartão e resultado líquido.',
      badge: 'Completo',
    },
    {
      id: 'categories',
      title: 'Demonstrativo por Centros de Custo & Categorias',
      description: 'Análise minuciosa de gastos divididos por Alimentação, Moradia, Transporte, Lazer e Fixas.',
      badge: 'Orçamento',
    },
    {
      id: 'cards',
      title: 'Faturas e Parcelas Futuras de Cartão',
      description: 'Detalhamento de parcelas vincendas, limites consumidos e projeção para os próximos meses.',
      badge: 'Cartões',
    },
    {
      id: 'irpf',
      title: 'Informe Anual para Declaração Financeira',
      description: 'Consolidado anual de rendimentos, patrimônio em bancos, dívidas e investimentos para fins fiscais.',
      badge: 'Anual',
    },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <FileText className="text-sky-400" size={26} />
            Central de Relatórios & Exportação
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gere relatórios executivos em PDF diagramado, planilhas Excel (.xlsx) e arquivos CSV.
          </p>
        </div>
      </div>

      <FilterBar />

      {/* 2. Reports Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {reportsList.map((rep) => (
          <div
            key={rep.id}
            className="p-6 rounded-3xl bg-navy-900 border border-navy-750/80 shadow-card flex flex-col justify-between gap-5 hover:border-sky-500/40 transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full">
                  {rep.badge}
                </span>
                <span className="text-xs text-slate-400">
                  Período: {selectedMonth} / {selectedYear}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">{rep.title}</h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{rep.description}</p>
            </div>

            <div className="pt-4 border-t border-navy-800 flex items-center justify-between">
              <span className="text-xs text-slate-400">Exportar como:</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportReport(rep.id, 'pdf')}
                  disabled={Boolean(generating)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold text-xs border border-rose-500/30 transition-all shadow-sm"
                >
                  <FileText size={13} />
                  <span>PDF</span>
                </button>

                <button
                  onClick={() => handleExportReport(rep.id, 'excel')}
                  disabled={Boolean(generating)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-xs border border-emerald-500/30 transition-all shadow-sm"
                >
                  <FileSpreadsheet size={13} />
                  <span>Excel</span>
                </button>

                <button
                  onClick={() => handleExportReport(rep.id, 'csv')}
                  disabled={Boolean(generating)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 font-bold text-xs border border-sky-500/30 transition-all shadow-sm"
                >
                  <Download size={13} />
                  <span>CSV</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
