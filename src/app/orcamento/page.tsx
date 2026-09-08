'use client';

import React, { useState, useEffect } from 'react';
import {
  PieChart as PieChartIcon,
  Plus,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Edit2,
  Trash2,
  ShieldCheck,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { FilterBar } from '@/components/layout/FilterBar';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Budget } from '@/types';

export default function OrcamentoPage() {
  const { selectedYear, selectedMonth, refreshKey, triggerRefresh } = useFinancial();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [plannedAmount, setPlannedAmount] = useState('');

  // Deletion Modal
  const [deleteTarget, setDeleteTarget] = useState<Budget | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadBudgets() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (selectedYear && selectedYear !== 'TODOS') query.set('year', selectedYear);
        if (selectedMonth && selectedMonth !== 'TODOS') query.set('month', selectedMonth);

        const res = await fetch(`/api/budgets?${query.toString()}`);
        if (res.ok) setBudgets(await res.json());
      } catch (err) {
        console.error('Failed to load budgets:', err);
      } finally {
        setLoading(false);
      }
    }

    loadBudgets();
  }, [selectedYear, selectedMonth, refreshKey]);

  // Aggregate Metrics
  const totalPlanned = budgets.reduce((acc, curr) => acc + curr.plannedAmount, 0);
  const totalActual = budgets.reduce((acc, curr) => acc + curr.actualAmount, 0);
  const totalRemaining = totalPlanned - totalActual;
  const overallConsumed = totalPlanned > 0 ? (totalActual / totalPlanned) * 100 : 0;

  const handleOpenCreate = () => {
    setEditingBudget(null);
    setCategoryName('');
    setPlannedAmount('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b: Budget) => {
    setEditingBudget(b);
    setCategoryName(b.categoryName);
    setPlannedAmount(b.plannedAmount.toString());
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingBudget ? `/api/budgets/${editingBudget.id}` : '/api/budgets';
      const method = editingBudget ? 'PUT' : 'POST';

      await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName,
          plannedAmount: parseFloat(plannedAmount),
          month: selectedMonth === 'TODOS' ? 'Setembro' : selectedMonth,
          year: selectedYear === 'TODOS' ? 2026 : parseInt(selectedYear, 10),
        }),
      });

      setIsModalOpen(false);
      triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/budgets/${deleteTarget.id}`, { method: 'DELETE' });
      triggerRefresh();
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <PieChartIcon className="text-sky-400" size={26} />
            Orçamento & Tetos de Gastos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Planejamento por categoria, limites orçamentários e controle de gastos em tempo real.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>+ Novo Orçamento</span>
        </button>
      </div>

      <FilterBar />

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Teto Orçado Total</span>
          <p className="text-xl font-black text-white mt-1">{formatCurrency(totalPlanned)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Limite máximo estabelecido</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Gasto Realizado</span>
          <p className="text-xl font-black text-rose-400 mt-1">{formatCurrency(totalActual)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Despesas consolidadas</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Margem Livre Restante</span>
          <p className={`text-xl font-black mt-1 ${totalRemaining >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
            {formatCurrency(totalRemaining)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">{totalRemaining >= 0 ? 'Dentro do teto' : 'Teto estourado'}</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">% Consumido</span>
          <p className="text-xl font-black text-sky-400 mt-1">{formatPercent(overallConsumed)}</p>
          <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden mt-2">
            <div
              className={`h-full rounded-full transition-all ${
                overallConsumed > 100
                  ? 'bg-rose-500'
                  : overallConsumed > 80
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${Math.min(100, overallConsumed)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Budget Categories Progress Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {budgets.map((b) => {
          const pct = b.plannedAmount > 0 ? (b.actualAmount / b.plannedAmount) * 100 : 0;
          const isOver = b.actualAmount > b.plannedAmount;
          const isNear = pct >= 80 && !isOver;

          return (
            <div
              key={b.id}
              className={`p-6 rounded-3xl bg-navy-900 border shadow-card space-y-4 transition-all ${
                isOver
                  ? 'border-rose-500/50 bg-rose-950/10'
                  : isNear
                  ? 'border-amber-500/40'
                  : 'border-navy-750/80 hover:border-sky-500/40'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">{b.categoryName}</h3>
                  <span className="text-xs text-slate-400">{b.month} / {b.year}</span>
                </div>
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                    isOver
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : isNear
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isOver ? '🔴 Estourado' : isNear ? '🟡 Alerta' : '🟢 Na Meta'}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="w-full bg-navy-950 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isOver
                        ? 'bg-rose-500'
                        : isNear
                        ? 'bg-amber-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span className="font-bold text-white">Gasto: {formatCurrency(b.actualAmount)}</span>
                  <span>Teto: {formatCurrency(b.plannedAmount)}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-navy-850/60 border border-navy-750 flex items-center justify-between text-xs">
                <span className="text-slate-400">Saldo Disponível:</span>
                <span className={`font-bold ${b.plannedAmount - b.actualAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {formatCurrency(b.plannedAmount - b.actualAmount)}
                </span>
              </div>

              <div className="pt-2 border-t border-navy-800 flex items-center justify-end gap-1.5">
                <button
                  onClick={() => handleOpenEdit(b)}
                  className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white text-xs"
                >
                  <Edit2 size={13} />
                </button>
                <button
                  onClick={() => setDeleteTarget(b)}
                  className="p-1.5 rounded-lg bg-navy-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              {editingBudget ? 'Editar Teto de Gastos' : 'Novo Teto de Gastos'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Categoria</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alimentação & Mercado, Transporte, Lazer..."
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Limite Orçado (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={plannedAmount}
                  onChange={(e) => setPlannedAmount(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-750">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-navy-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold shadow-lg"
                >
                  Salvar Teto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir Orçamento"
        description={`Tem certeza que deseja excluir o teto de gastos para "${deleteTarget?.categoryName}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
