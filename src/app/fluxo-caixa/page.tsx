'use client';

import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  TrendingUp,
  TrendingDown,
  Calendar,
  Wallet,
  Building2,
  DollarSign,
  BarChart3,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { useFinancial } from '@/context/FinancialContext';
import { FilterBar } from '@/components/layout/FilterBar';
import { formatCurrency } from '@/lib/utils';
import { MonthlyMatrixRow } from '@/types';

export default function FluxoCaixaPage() {
  const { selectedYear, selectedMonth, refreshKey } = useFinancial();
  const [matrix, setMatrix] = useState<MonthlyMatrixRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (selectedYear) query.set('year', selectedYear);

        const res = await fetch(`/api/summary?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.monthlyConsolidated) {
            const mapped: MonthlyMatrixRow[] = data.monthlyConsolidated.map((m: any) => ({
              month: m.month,
              incomes: m.incomeReal || 0,
              expenses: m.expensesReal || 0,
              fixedExpenses: m.fixedReal || 0,
              debts: m.debtReal || 0,
              investments: m.savingsReal || 0,
              totalExpenses: (m.expensesReal || 0) + (m.fixedReal || 0) + (m.debtReal || 0) + (m.savingsReal || 0),
              balance: m.balanceReal || 0,
            }));
            setMatrix(mapped);
          } else if (data.monthlyMatrix) {
            setMatrix(data.monthlyMatrix);
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedYear, refreshKey]);

  // Cumulative balance calculation
  let runningBalance = 0;
  const chartData = matrix.map((row) => {
    runningBalance += row.balance;
    return {
      ...row,
      accumulatedBalance: runningBalance,
    };
  });

  const totalIncomes = matrix.reduce((acc, curr) => acc + curr.incomes, 0);
  const totalExpenses = matrix.reduce((acc, curr) => acc + curr.totalExpenses, 0);
  const totalNet = totalIncomes - totalExpenses;

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ArrowRightLeft className="text-sky-400" size={26} />
            Fluxo de Caixa & Projeções
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Planejamento de liquidez, curvas de entradas e saídas, e projeção de saldo acumulado.
          </p>
        </div>
      </div>

      <FilterBar />

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Entradas ({selectedYear})</span>
          <p className="text-xl font-black text-emerald-400 mt-1">{formatCurrency(totalIncomes)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Soma de todos os meses</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total de Saídas ({selectedYear})</span>
          <p className="text-xl font-black text-rose-400 mt-1">{formatCurrency(totalExpenses)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Despesas + Fixas + Dívidas + Aportes</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Saldo Líquido Gerado</span>
          <p className={`text-xl font-black mt-1 ${totalNet >= 0 ? 'text-sky-300' : 'text-rose-500'}`}>
            {formatCurrency(totalNet)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{totalNet >= 0 ? 'Superávit no período' : 'Déficit no período'}</p>
        </div>
      </div>

      {/* 3. Composed Chart */}
      <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-5 shadow-card">
        <div className="mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <BarChart3 size={16} className="text-sky-400" />
            Curva de Fluxo de Caixa e Acumulado
          </h3>
          <p className="text-xs text-slate-400">Barras de receitas/despesas vs Linha de saldo acumulado</p>
        </div>

        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <XAxis dataKey="month" tickLine={false} stroke="#64748b" tickFormatter={(v) => v.slice(0, 3)} />
              <YAxis tickLine={false} stroke="#64748b" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(val: any) => [formatCurrency(Number(val)), '']}
                contentStyle={{ backgroundColor: '#0D1424', borderColor: '#2D4475', borderRadius: '12px' }}
              />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar dataKey="incomes" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="totalExpenses" name="Saídas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey="accumulatedBalance" name="Saldo Acumulado" stroke="#38bdf8" strokeWidth={3} dot={{ fill: '#38bdf8' }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Tabela de Projeções */}
      <div className="rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card overflow-hidden">
        <div className="p-4 border-b border-navy-750">
          <h3 className="text-sm font-bold text-white">Detalhamento Mês a Mês</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-navy-750 bg-navy-950/60 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Mês</th>
                <th className="py-3 px-4 text-right">Receitas</th>
                <th className="py-3 px-4 text-right">Variáveis</th>
                <th className="py-3 px-4 text-right">Contas Fixas</th>
                <th className="py-3 px-4 text-right">Dívidas</th>
                <th className="py-3 px-4 text-right">Investimentos</th>
                <th className="py-3 px-4 text-right">Total Saídas</th>
                <th className="py-3 px-4 text-right">Resultado</th>
                <th className="py-3 px-4 text-right">Acumulado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {chartData.map((row) => (
                <tr key={row.month} className="hover:bg-navy-800/40 transition-colors">
                  <td className="py-3 px-4 font-bold text-white">{row.month}</td>
                  <td className="py-3 px-4 text-right text-emerald-400 font-semibold">{formatCurrency(row.incomes)}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(row.expenses)}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(row.fixedExpenses)}</td>
                  <td className="py-3 px-4 text-right text-slate-300">{formatCurrency(row.debts)}</td>
                  <td className="py-3 px-4 text-right text-teal-400">{formatCurrency(row.investments)}</td>
                  <td className="py-3 px-4 text-right text-rose-400 font-semibold">{formatCurrency(row.totalExpenses)}</td>
                  <td className={`py-3 px-4 text-right font-bold ${row.balance >= 0 ? 'text-sky-300' : 'text-rose-400'}`}>
                    {formatCurrency(row.balance)}
                  </td>
                  <td className={`py-3 px-4 text-right font-black ${row.accumulatedBalance >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                    {formatCurrency(row.accumulatedBalance)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
