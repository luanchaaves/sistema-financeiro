'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  CalendarCheck2,
  AlertTriangle,
  LineChart,
  Wallet,
  ShieldCheck,
  Percent,
  Activity,
  CreditCard,
  Building2,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PieChart as PieChartIcon,
  BarChart3,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useFinancial } from '@/context/FinancialContext';
import { FilterBar } from '@/components/layout/FilterBar';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { DashboardSummary } from '@/types';
import Link from 'next/link';

export default function DashboardPage() {
  const { selectedYear, selectedMonth, refreshKey, openQuickAction } = useFinancial();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (selectedYear) query.set('year', selectedYear);
        if (selectedMonth) query.set('month', selectedMonth);

        const res = await fetch(`/api/summary?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSummary(data);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedYear, selectedMonth, refreshKey]);

  if (loading || !summary) {
    return (
      <div className="space-y-6">
        <FilterBar />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Carregando painel consolidado...</p>
          </div>
        </div>
      </div>
    );
  }

  const {
    metrics,
    diagnostic,
    monthlyMatrix,
    annualComparison,
    categoryDistribution,
    bankBalances,
    creditCards,
    goals,
    netWorth,
  } = summary;

  // Custom Chart Colors
  const COLORS = ['#38bdf8', '#818cf8', '#f43f5e', '#fbbf24', '#34d399', '#a78bfa', '#fb923c', '#e879f9'];

  // Diagnostic Styling
  const getDiagnosticStyle = (status: string) => {
    switch (status) {
      case 'positive':
        return {
          bg: 'bg-emerald-500/10 border-emerald-500/30',
          text: 'text-emerald-400',
          badge: 'bg-emerald-500 text-slate-950',
          icon: ShieldCheck,
        };
      case 'warning':
        return {
          bg: 'bg-amber-500/10 border-amber-500/30',
          text: 'text-amber-400',
          badge: 'bg-amber-500 text-slate-950',
          icon: AlertTriangle,
        };
      case 'negative':
      default:
        return {
          bg: 'bg-rose-500/10 border-rose-500/30',
          text: 'text-rose-400',
          badge: 'bg-rose-500 text-white',
          icon: AlertTriangle,
        };
    }
  };

  const diagStyle = getDiagnosticStyle(diagnostic.status);
  const DiagIcon = diagStyle.icon;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header & Global Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Painel Geral
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-400 border border-sky-500/30">
              {selectedYear}
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Visão financeira unificada, cálculos automatizados e inteligência de patrimônio.
          </p>
        </div>

        {/* Quick actions buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => openQuickAction('income')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 text-xs font-bold transition-all shadow-sm"
          >
            <Plus size={14} />
            <span>+ Receita</span>
          </button>
          <button
            onClick={() => openQuickAction('expense')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 text-xs font-bold transition-all shadow-sm"
          >
            <Plus size={14} />
            <span>+ Despesa</span>
          </button>
        </div>
      </div>

      <FilterBar />

      {/* 2. Diagnostic Banner */}
      <div className={`p-5 rounded-2xl border ${diagStyle.bg} backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${diagStyle.badge}`}>
            <DiagIcon size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${diagStyle.badge}`}>
                {diagnostic.label}
              </span>
              <span className="text-xs text-slate-400">Diagnóstico Inteligente</span>
            </div>
            <p className="text-sm font-semibold text-white mt-1.5">{diagnostic.recommendation}</p>
          </div>
        </div>

        <div className="flex items-center gap-6 border-t sm:border-t-0 sm:border-l border-navy-750 pt-3 sm:pt-0 sm:pl-6">
          <div>
            <p className="text-[11px] text-slate-400 font-medium">Taxa de Economia</p>
            <p className="text-base font-bold text-white">{formatPercent(metrics.savingsRate)}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400 font-medium">% Renda Comprometida</p>
            <p className={`text-base font-bold ${metrics.commitmentRate > 75 ? 'text-rose-400' : 'text-sky-400'}`}>
              {formatPercent(metrics.commitmentRate)}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Top Metrics Cards Grid (10 Consolidations) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Renda Total */}
        <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-4 shadow-card hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Rendas Totais</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <TrendingUp size={16} />
            </div>
          </div>
          <p className="text-lg font-black text-white">{formatCurrency(metrics.incomeTotal)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-navy-800">
            <span>Recebido:</span>
            <span className="text-emerald-400 font-semibold">{formatCurrency(metrics.incomeReceived)}</span>
          </div>
        </div>

        {/* Despesas Pagas */}
        <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-4 shadow-card hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between text-rose-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Despesas / Variáveis</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10">
              <TrendingDown size={16} />
            </div>
          </div>
          <p className="text-lg font-black text-white">{formatCurrency(metrics.expensesTotal)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-navy-800">
            <span>Pagas:</span>
            <span className="text-rose-400 font-semibold">{formatCurrency(metrics.expensesPaid)}</span>
          </div>
        </div>

        {/* Contas Fixas */}
        <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-4 shadow-card hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Contas Fixas</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10">
              <CalendarCheck2 size={16} />
            </div>
          </div>
          <p className="text-lg font-black text-white">{formatCurrency(metrics.fixedTotal)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-navy-800">
            <span>Pagas:</span>
            <span className="text-amber-400 font-semibold">{formatCurrency(metrics.fixedPaid)}</span>
          </div>
        </div>

        {/* Dívidas & Financiamentos */}
        <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-4 shadow-card hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Dívidas / Parcelas</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10">
              <AlertTriangle size={16} />
            </div>
          </div>
          <p className="text-lg font-black text-white">{formatCurrency(metrics.debtTotal)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-navy-800">
            <span>Pagas:</span>
            <span className="text-purple-400 font-semibold">{formatCurrency(metrics.debtPaid)}</span>
          </div>
        </div>

        {/* Investimentos & Poupança */}
        <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-4 shadow-card hover:border-teal-500/40 transition-all">
          <div className="flex items-center justify-between text-teal-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Investimentos</span>
            <div className="p-1.5 rounded-lg bg-teal-500/10">
              <LineChart size={16} />
            </div>
          </div>
          <p className="text-lg font-black text-white">{formatCurrency(metrics.investmentsTotal)}</p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-navy-800">
            <span>Aportes:</span>
            <span className="text-teal-400 font-semibold">{formatCurrency(metrics.investmentsTotal)}</span>
          </div>
        </div>

        {/* Saldo Disponível em Caixa */}
        <div className="rounded-2xl bg-gradient-to-tr from-navy-900 to-sky-950/40 border border-sky-500/40 p-4 shadow-card">
          <div className="flex items-center justify-between text-sky-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Saldo Disponível</span>
            <div className="p-1.5 rounded-lg bg-sky-500/20">
              <Wallet size={16} />
            </div>
          </div>
          <p className={`text-lg font-black ${metrics.availableBalance >= 0 ? 'text-sky-300' : 'text-rose-400'}`}>
            {formatCurrency(metrics.availableBalance)}
          </p>
          <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-navy-800">
            Dinheiro livre real hoje
          </p>
        </div>

        {/* Saldo Projetado do Fim do Mês */}
        <div className="rounded-2xl bg-gradient-to-tr from-navy-900 to-indigo-950/40 border border-indigo-500/40 p-4 shadow-card">
          <div className="flex items-center justify-between text-indigo-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Saldo Projetado</span>
            <div className="p-1.5 rounded-lg bg-indigo-500/20">
              <Activity size={16} />
            </div>
          </div>
          <p className={`text-lg font-black ${metrics.projectedBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(metrics.projectedBalance)}
          </p>
          <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-navy-800">
            Após pagar pendências
          </p>
        </div>

        {/* Faturas de Cartão Abertas */}
        <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-4 shadow-card">
          <div className="flex items-center justify-between text-purple-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Faturas de Cartão</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10">
              <CreditCard size={16} />
            </div>
          </div>
          <p className="text-lg font-black text-white">{formatCurrency(metrics.creditCardInvoicesOpen)}</p>
          <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-navy-800">
            Em aberto no mês
          </p>
        </div>

        {/* Reserva de Emergência Total */}
        <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-4 shadow-card">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Reserva Acumulada</span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10">
              <ShieldCheck size={16} />
            </div>
          </div>
          <p className="text-lg font-black text-white">{formatCurrency(netWorth.emergencyFund)}</p>
          <p className="text-[11px] text-slate-400 mt-2 pt-2 border-t border-navy-800">
            Liquidez imediata
          </p>
        </div>

        {/* Patrimônio Líquido */}
        <Link
          href="/patrimonio"
          className="rounded-2xl bg-navy-900 border border-navy-750/80 p-4 shadow-card hover:border-emerald-500/50 hover:bg-navy-850/70 transition-all cursor-pointer group block"
        >
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 group-hover:text-emerald-300 transition-colors">
              Patrimônio Líquido
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sparkles size={16} />
            </div>
          </div>
          <p className={`text-lg font-black ${netWorth.netWorth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(netWorth.netWorth)}
          </p>
          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-navy-800">
            <span>Bens, Caixa - Dívidas</span>
            <span className="text-emerald-400 font-bold group-hover:underline">Ver Bens →</span>
          </div>
        </Link>
      </div>

      {/* 4. Charts Section: Fluxo Anual e Distribuição por Categoria */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Cashflow Evolution Chart */}
        <div className="lg:col-span-2 rounded-2xl bg-navy-900 border border-navy-750/80 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 size={16} className="text-sky-400" />
                Evolução Mensal (Receitas vs Saídas)
              </h3>
              <p className="text-xs text-slate-400">Consolidado mês a mês ao longo do ano</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyMatrix} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tickLine={false} stroke="#64748b" tickFormatter={(v) => v.slice(0, 3)} />
                <YAxis tickLine={false} stroke="#64748b" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), '']}
                  contentStyle={{ backgroundColor: '#0D1424', borderColor: '#2D4475', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="incomes" name="Receitas" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="totalExpenses" name="Total Saídas" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-5 shadow-card flex flex-col justify-between">
          <div className="mb-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChartIcon size={16} className="text-purple-400" />
              Gastos por Categoria
            </h3>
            <p className="text-xs text-slate-400">Distribuição percentual das despesas</p>
          </div>

          <div className="h-52 w-full">
            {categoryDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-full text-xs text-slate-500">
                Sem despesas no período
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryDistribution.slice(0, 6)}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Valor']} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="space-y-1.5 mt-2 max-h-28 overflow-y-auto pr-1">
            {categoryDistribution.slice(0, 5).map((cat, idx) => (
              <div key={cat.category} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color || COLORS[idx % COLORS.length] }} />
                  <span className="text-slate-300 truncate max-w-[120px]">{cat.category}</span>
                </div>
                <div className="flex items-center gap-2 font-medium">
                  <span className="text-slate-400">{formatPercent(cat.percentage)}</span>
                  <span className="text-white">{formatCurrency(cat.amount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 5. Tabela Consolidada Jan-Dez (Matriz Mensal Completa da Planilha) */}
      <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-5 shadow-card overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CalendarCheck2 size={16} className="text-sky-400" />
              Consolidado Mensal (Jan - Dez)
            </h3>
            <p className="text-xs text-slate-400">Demonstrativo completo de entradas, saídas e resultado mês a mês</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-navy-750 bg-navy-950/60 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Mês</th>
                <th className="py-3 px-3 text-right">Rendas</th>
                <th className="py-3 px-3 text-right">Despesas</th>
                <th className="py-3 px-3 text-right">Contas Fixas</th>
                <th className="py-3 px-3 text-right">Dívidas</th>
                <th className="py-3 px-3 text-right">Investimentos</th>
                <th className="py-3 px-3 text-right">Total Saídas</th>
                <th className="py-3 px-3 text-right">Saldo do Mês</th>
                <th className="py-3 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {monthlyMatrix.map((row) => (
                <tr
                  key={row.month}
                  className={`hover:bg-navy-800/40 transition-colors ${selectedMonth === row.month ? 'bg-sky-500/10 font-semibold' : ''}`}
                >
                  <td className="py-2.5 px-3 font-medium text-white flex items-center gap-2">
                    {selectedMonth === row.month && <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />}
                    {row.month}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-400">{formatCurrency(row.incomes)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{formatCurrency(row.expenses)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{formatCurrency(row.fixedExpenses)}</td>
                  <td className="py-2.5 px-3 text-right text-slate-300">{formatCurrency(row.debts)}</td>
                  <td className="py-2.5 px-3 text-right text-teal-400">{formatCurrency(row.investments)}</td>
                  <td className="py-2.5 px-3 text-right text-rose-400 font-semibold">{formatCurrency(row.totalExpenses)}</td>
                  <td className={`py-2.5 px-3 text-right font-bold ${row.balance >= 0 ? 'text-sky-300' : 'text-rose-400'}`}>
                    {formatCurrency(row.balance)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        row.balance > 0
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : row.balance < 0
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {row.balance > 0 ? 'Positivo' : row.balance < 0 ? 'Déficit' : 'Neutro'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Bancos, Cartões & Metas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Posição por Banco */}
        <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 size={16} className="text-sky-400" />
              Posição por Banco / Origem
            </h3>
            <Link href="/configuracoes" className="text-xs text-sky-400 hover:underline">
              Gerenciar
            </Link>
          </div>

          <div className="space-y-3">
            {bankBalances.map((b) => (
              <div key={b.bankId} className="p-3 rounded-xl bg-navy-850/60 border border-navy-750 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.color || '#38bdf8' }}
                  />
                  <div>
                    <h4 className="text-xs font-semibold text-white">{b.bankName}</h4>
                    <span className="text-[10px] text-slate-400">Entradas - Saídas</span>
                  </div>
                </div>
                <p className={`text-xs font-bold ${b.currentBalance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(b.currentBalance)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Cartões de Crédito */}
        <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCard size={16} className="text-purple-400" />
              Cartões de Crédito
            </h3>
            <Link href="/cartoes" className="text-xs text-purple-400 hover:underline">
              Ver Faturas
            </Link>
          </div>

          <div className="space-y-3">
            {creditCards.map((c) => {
              const used = c.limitTotal - c.limitAvailable;
              const usedPct = c.limitTotal > 0 ? (used / c.limitTotal) * 100 : 0;
              return (
                <div key={c.id} className="p-3 rounded-xl bg-navy-850/60 border border-navy-750 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">{c.name}</span>
                    <span className="text-[11px] text-purple-300 font-bold">{formatCurrency(c.limitAvailable)} livre</span>
                  </div>
                  <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-purple-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, usedPct)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>Limite: {formatCurrency(c.limitTotal)}</span>
                    <span>Vencimento: dia {c.dueDay}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metas Financeiras */}
        <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sparkles size={16} className="text-emerald-400" />
              Metas & Reserva
            </h3>
            <Link href="/metas" className="text-xs text-emerald-400 hover:underline">
              Ver Todas
            </Link>
          </div>

          <div className="space-y-3">
            {goals.map((g) => {
              const progress = g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0;
              return (
                <div key={g.id} className="p-3 rounded-xl bg-navy-850/60 border border-navy-750 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white truncate max-w-[150px]">{g.name}</span>
                    <span className="text-[11px] text-emerald-400 font-bold">{formatPercent(progress)}</span>
                  </div>
                  <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{formatCurrency(g.currentAmount)}</span>
                    <span>Alvo: {formatCurrency(g.targetAmount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
