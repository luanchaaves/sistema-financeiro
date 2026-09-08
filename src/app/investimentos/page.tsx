'use client';

import React, { useState, useEffect } from 'react';
import {
  LineChart as LineChartIcon,
  Plus,
  TrendingUp,
  ShieldCheck,
  Building2,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Edit2,
  Trash2,
  Layers,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useFinancial } from '@/context/FinancialContext';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { formatCurrency, formatPercent } from '@/lib/utils';
import { Investment } from '@/types';

export default function InvestimentosPage() {
  const { refreshKey, triggerRefresh, openQuickAction } = useFinancial();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  // Aporte / Resgate Modal
  const [txTarget, setTxTarget] = useState<Investment | null>(null);
  const [txType, setTxType] = useState<'Aporte' | 'Resgate' | 'Rendimento'>('Aporte');
  const [txAmount, setTxAmount] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [isSubmittingTx, setIsSubmittingTx] = useState(false);

  // Deletion Modal
  const [deleteTarget, setDeleteTarget] = useState<Investment | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadInvestments() {
      setLoading(true);
      try {
        const res = await fetch('/api/investments');
        if (res.ok) setInvestments(await res.json());
      } catch (err) {
        console.error('Failed to load investments:', err);
      } finally {
        setLoading(false);
      }
    }

    loadInvestments();
  }, [refreshKey]);

  // Aggregate Metrics
  const totalApplied = investments.reduce((acc, curr) => acc + curr.appliedAmount, 0);
  const totalCurrent = investments.reduce((acc, curr) => acc + curr.currentAmount, 0);
  const totalYield = totalCurrent - totalApplied;
  const yieldPct = totalApplied > 0 ? (totalYield / totalApplied) * 100 : 0;

  // Emergency Fund
  const emergencyFund = investments
    .filter((i) => i.isEmergencyFund)
    .reduce((acc, curr) => acc + curr.currentAmount, 0);

  // Portfolio Distribution
  const portfolioDistribution = investments.map((inv) => ({
    name: inv.name,
    value: inv.currentAmount,
  }));

  const COLORS = ['#10b981', '#38bdf8', '#a855f7', '#f59e0b', '#ec4899', '#6366f1'];

  // Handle transaction (Aporte / Resgate)
  const handleOpenTx = (inv: Investment, type: 'Aporte' | 'Resgate') => {
    setTxTarget(inv);
    setTxType(type);
    setTxAmount('');
    setTxNotes('');
  };

  const handleRegisterTx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txTarget) return;
    setIsSubmittingTx(true);

    try {
      await fetch(`/api/investments/${txTarget.id}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: txType,
          amount: parseFloat(txAmount),
          notes: txNotes,
        }),
      });

      setTxTarget(null);
      triggerRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingTx(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/investments/${deleteTarget.id}`, { method: 'DELETE' });
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
            <LineChartIcon className="text-teal-400" size={26} />
            Investimentos & Reserva de Emergência
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Construção de patrimônio, rentabilidade dos ativos e fundo de segurança.
          </p>
        </div>

        <button
          onClick={() => openQuickAction('investment')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 font-bold text-xs shadow-lg shadow-teal-500/20 transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>+ Novo Investimento</span>
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Patrimônio Investido</span>
          <p className="text-xl font-black text-white mt-1">{formatCurrency(totalCurrent)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Saldo consolidado</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Aplicado</span>
          <p className="text-xl font-black text-white mt-1">{formatCurrency(totalApplied)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Aportes originais</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <TrendingUp size={13} />
            Rendimento Acumulado
          </span>
          <p className="text-xl font-black text-emerald-400 mt-1">{formatCurrency(totalYield)}</p>
          <p className="text-[11px] text-emerald-300/80 mt-1 font-semibold">+{formatPercent(yieldPct)} de retorno</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
            <ShieldCheck size={13} />
            Reserva de Emergência
          </span>
          <p className="text-xl font-black text-teal-400 mt-1">{formatCurrency(emergencyFund)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Alta liquidez e segurança</p>
        </div>
      </div>

      {/* 3. Distribution Chart & Highlight Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Assets List */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers size={16} className="text-teal-400" />
            Ativos e Aplicações
          </h3>

          <div className="space-y-3">
            {investments.map((inv) => {
              const diff = inv.currentAmount - inv.appliedAmount;
              const diffPct = inv.appliedAmount > 0 ? (diff / inv.appliedAmount) * 100 : 0;

              return (
                <div
                  key={inv.id}
                  className="p-5 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-teal-500/40 transition-all"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded">
                        {inv.type}
                      </span>
                      {inv.isEmergencyFund && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <ShieldCheck size={11} />
                          Reserva
                        </span>
                      )}
                    </div>
                    <h4 className="text-base font-bold text-white">{inv.name}</h4>
                    <p className="text-xs text-slate-400">{inv.institution} • {inv.notes || 'Sem observações'}</p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-navy-800 pt-3 sm:pt-0">
                    <div>
                      <span className="text-[11px] text-slate-400">Saldo Atual</span>
                      <p className="text-base font-extrabold text-white">{formatCurrency(inv.currentAmount)}</p>
                      <p className={`text-[11px] font-semibold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {diff >= 0 ? '+' : ''}{formatCurrency(diff)} ({formatPercent(diffPct)})
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenTx(inv, 'Aporte')}
                        title="Fazer Aporte"
                        className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs border border-emerald-500/30"
                      >
                        + Aporte
                      </button>
                      <button
                        onClick={() => handleOpenTx(inv, 'Resgate')}
                        title="Resgatar"
                        className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-bold text-xs border border-amber-500/30"
                      >
                        - Resgate
                      </button>
                      <button
                        onClick={() => openQuickAction('investment', inv)}
                        className="p-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(inv)}
                        className="p-2 rounded-xl bg-navy-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Portfolio Pie Chart */}
        <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-5 shadow-card flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-1">
              <PieChartIcon size={16} className="text-teal-400" />
              Alocação da Carteira
            </h3>
            <p className="text-xs text-slate-400">Distribuição percentual dos ativos</p>
          </div>

          <div className="h-56 w-full my-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={portfolioDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                >
                  {portfolioDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [formatCurrency(Number(val)), 'Valor']} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            {investments.map((inv, idx) => {
              const pct = totalCurrent > 0 ? (inv.currentAmount / totalCurrent) * 100 : 0;
              return (
                <div key={inv.id} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-slate-300 truncate max-w-[120px]">{inv.name}</span>
                  </div>
                  <span className="text-white font-medium">{formatPercent(pct)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Aporte / Resgate Modal */}
      {txTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">
              {txType === 'Aporte' ? 'Registrar Aporte' : 'Registrar Resgate'}
            </h3>
            <p className="text-xs text-slate-400 mb-4">{txTarget.name}</p>

            <form onSubmit={handleRegisterTx} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Valor da Operação (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Notas / Motivo</label>
                <input
                  type="text"
                  placeholder="Ex: Aporte mensal da sobra de caixa..."
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-750">
                <button
                  type="button"
                  onClick={() => setTxTarget(null)}
                  className="px-4 py-2 rounded-xl bg-navy-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTx}
                  className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold shadow-lg"
                >
                  {isSubmittingTx ? 'Salvando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir Investimento"
        description={`Tem certeza que deseja excluir o ativo "${deleteTarget?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
