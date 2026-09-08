'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Plus,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  Edit2,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { formatCurrency, formatDate, formatPercent } from '@/lib/utils';
import { Debt } from '@/types';

export default function DividasPage() {
  const { refreshKey, triggerRefresh, openQuickAction } = useFinancial();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  // Payment / Amortization Modal
  const [paymentTarget, setPaymentTarget] = useState<Debt | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Deletion Modal
  const [deleteTarget, setDeleteTarget] = useState<Debt | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadDebts() {
      setLoading(true);
      try {
        const res = await fetch('/api/debts');
        if (res.ok) setDebts(await res.json());
      } catch (err) {
        console.error('Failed to load debts:', err);
      } finally {
        setLoading(false);
      }
    }

    loadDebts();
  }, [refreshKey]);

  // Aggregate Metrics
  const totalOriginal = debts.reduce((acc, curr) => acc + curr.originalAmount, 0);
  const totalRemaining = debts.reduce((acc, curr) => acc + curr.remainingAmount, 0);
  const totalPaid = debts.reduce((acc, curr) => acc + curr.paidAmount, 0);
  const overallProgress = totalOriginal > 0 ? (totalPaid / totalOriginal) * 100 : 0;

  // Open amortization modal
  const handleOpenPayment = (debt: Debt) => {
    setPaymentTarget(debt);
    setPaymentAmount(debt.installmentAmount.toString());
    setPaymentNotes(`Pagamento parcela ${debt.currentInstallment + 1}/${debt.totalInstallments}`);
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentTarget) return;
    setIsSubmittingPayment(true);

    try {
      await fetch(`/api/debts/${paymentTarget.id}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(paymentAmount),
          installmentNumber: paymentTarget.currentInstallment + 1,
          notes: paymentNotes,
        }),
      });

      setPaymentTarget(null);
      triggerRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/debts/${deleteTarget.id}`, { method: 'DELETE' });
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
            <AlertTriangle className="text-purple-400" size={26} />
            Dívidas & Financiamentos
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Controle de saldo devedor, amortização de parcelas, credores e histórico de quitação.
          </p>
        </div>

        <button
          onClick={() => openQuickAction('debt')}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>+ Nova Dívida</span>
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Original</span>
          <p className="text-xl font-black text-white mt-1">{formatCurrency(totalOriginal)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Contratos ativos</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Já Amortizado</span>
          <p className="text-xl font-black text-emerald-400 mt-1">{formatCurrency(totalPaid)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Valor já pago</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">Saldo Devedor Restante</span>
          <p className="text-xl font-black text-rose-400 mt-1">{formatCurrency(totalRemaining)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Passivo a liquidar</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400">Progresso Geral</span>
          <p className="text-xl font-black text-purple-400 mt-1">{formatPercent(overallProgress)}</p>
          <div className="w-full bg-navy-950 h-2 rounded-full overflow-hidden mt-2">
            <div
              className="bg-purple-500 h-full rounded-full transition-all"
              style={{ width: `${Math.min(100, overallProgress)}%` }}
            />
          </div>
        </div>
      </div>

      {/* 3. Debts List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {debts.map((debt) => {
          const progress = debt.originalAmount > 0 ? (debt.paidAmount / debt.originalAmount) * 100 : 0;

          return (
            <div
              key={debt.id}
              className="rounded-3xl bg-navy-900 border border-navy-750/80 p-6 shadow-card space-y-4 hover:border-purple-500/40 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 bg-navy-800 px-2 py-0.5 rounded">
                    {debt.creditor}
                  </span>
                  <h3 className="text-lg font-black text-white mt-1.5">{debt.name}</h3>
                </div>
                <span
                  className={`text-[10px] px-2.5 py-1 rounded-full font-bold ${
                    debt.status === 'Paga'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                  }`}
                >
                  {debt.status}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Progresso de Quitação:</span>
                  <span className="text-emerald-400 font-bold">{formatPercent(progress)}</span>
                </div>
                <div className="w-full bg-navy-950 h-3 rounded-full overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full rounded-full transition-all"
                    style={{ width: `${Math.min(100, progress)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Pago: {formatCurrency(debt.paidAmount)}</span>
                  <span>Restante: {formatCurrency(debt.remainingAmount)}</span>
                </div>
              </div>

              {/* Installment & Value details */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-2xl bg-navy-850/60 border border-navy-750 text-xs">
                <div>
                  <span className="text-slate-400">Parcelas:</span>
                  <p className="font-bold text-white mt-0.5">
                    {debt.currentInstallment} de {debt.totalInstallments} pagas
                  </p>
                </div>
                <div>
                  <span className="text-slate-400">Valor da Parcela:</span>
                  <p className="font-bold text-purple-300 mt-0.5">
                    {formatCurrency(debt.installmentAmount)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openQuickAction('debt', debt)}
                    title="Editar"
                    className="p-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white text-xs"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(debt)}
                    title="Excluir"
                    className="p-2 rounded-xl bg-navy-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                {debt.status !== 'Paga' && (
                  <button
                    onClick={() => handleOpenPayment(debt)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    <DollarSign size={14} />
                    <span>Pagar / Amortizar</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Amortization Modal */}
      {paymentTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Amortizar Dívida</h3>
            <p className="text-xs text-slate-400 mb-4">{paymentTarget.name}</p>

            <form onSubmit={handleRegisterPayment} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Valor do Pagamento (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Observações</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-750">
                <button
                  type="button"
                  onClick={() => setPaymentTarget(null)}
                  className="px-4 py-2 rounded-xl bg-navy-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPayment}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold shadow-lg"
                >
                  {isSubmittingPayment ? 'Registrando...' : 'Confirmar Pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir Dívida"
        description={`Tem certeza que deseja excluir o registro de dívida "${deleteTarget?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
