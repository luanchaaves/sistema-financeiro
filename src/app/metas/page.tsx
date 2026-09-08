'use client';

import React, { useState, useEffect } from 'react';
import {
  Target,
  Plus,
  Calendar,
  Sparkles,
  CheckCircle2,
  Edit2,
  Trash2,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import { FinancialGoal } from '@/types';

export default function MetasPage() {
  const { refreshKey, triggerRefresh, openQuickAction } = useFinancial();
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Quick Deposit to Goal
  const [depositTarget, setDepositTarget] = useState<FinancialGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  // Deletion Modal
  const [deleteTarget, setDeleteTarget] = useState<FinancialGoal | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadGoals() {
      setLoading(true);
      try {
        const res = await fetch('/api/goals');
        if (res.ok) setGoals(await res.json());
      } catch (err) {
        console.error('Failed to load goals:', err);
      } finally {
        setLoading(false);
      }
    }

    loadGoals();
  }, [refreshKey]);

  const totalTarget = goals.reduce((acc, curr) => acc + curr.targetAmount, 0);
  const totalAccumulated = goals.reduce((acc, curr) => acc + curr.currentAmount, 0);
  const overallProgress = totalTarget > 0 ? (totalAccumulated / totalTarget) * 100 : 0;

  const handleDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depositTarget) return;
    setIsDepositing(true);

    try {
      const newAmount = depositTarget.currentAmount + parseFloat(depositAmount);
      await fetch(`/api/goals/${depositTarget.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentAmount: newAmount }),
      });

      setDepositTarget(null);
      setDepositAmount('');
      triggerRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsDepositing(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/goals/${deleteTarget.id}`, { method: 'DELETE' });
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
            <Target className="text-emerald-400" size={26} />
            Metas & Objetivos Financeiros
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Definição e acompanhamento de metas para conquistas de curto, médio e longo prazo.
          </p>
        </div>

        <button
          onClick={() => openQuickAction('goal')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>+ Nova Meta</span>
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Alvo Planejado</span>
          <p className="text-xl font-black text-white mt-1">{formatCurrency(totalTarget)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{goals.length} metas ativas</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={13} />
            Total Já Acumulado
          </span>
          <p className="text-xl font-black text-emerald-400 mt-1">{formatCurrency(totalAccumulated)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Recursos direcionados</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Progresso Médio Geral</span>
          <p className="text-xl font-black text-sky-400 mt-1">{formatPercent(overallProgress)}</p>
          <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-sky-400 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, overallProgress)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Goals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {goals.map((goal) => {
          const progress = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
          const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

          return (
            <div
              key={goal.id}
              className="p-6 rounded-3xl bg-navy-900 border border-navy-750/80 shadow-card space-y-4 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full">
                    {goal.category}
                  </span>
                  <span className="text-xs font-black text-emerald-400">{formatPercent(progress)}</span>
                </div>

                <h3 className="text-base font-bold text-white mt-3">{goal.name}</h3>
                {goal.notes && <p className="text-xs text-slate-400 mt-1">{goal.notes}</p>}

                {/* Progress Bar */}
                <div className="space-y-1.5 mt-4">
                  <div className="w-full bg-navy-950 h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-sky-400 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(100, progress)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span className="font-bold text-white">{formatCurrency(goal.currentAmount)}</span>
                    <span>Alvo: {formatCurrency(goal.targetAmount)}</span>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-2xl bg-navy-850/60 border border-navy-750 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Faltam:</span>
                  <span className="font-bold text-slate-200">{formatCurrency(remaining)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-navy-800 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openQuickAction('goal', goal)}
                    className="p-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white text-xs"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(goal)}
                    className="p-2 rounded-xl bg-navy-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <button
                  onClick={() => setDepositTarget(goal)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs border border-emerald-500/30"
                >
                  <Plus size={13} />
                  <span>Aportar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Deposit Modal */}
      {depositTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Aportar na Meta</h3>
            <p className="text-xs text-slate-400 mb-4">{depositTarget.name}</p>

            <form onSubmit={handleDeposit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Valor do Aporte (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-750">
                <button
                  type="button"
                  onClick={() => setDepositTarget(null)}
                  className="px-4 py-2 rounded-xl bg-navy-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isDepositing}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-lg"
                >
                  {isDepositing ? 'Salvando...' : 'Confirmar Aporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir Meta"
        description={`Tem certeza que deseja excluir a meta "${deleteTarget?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
