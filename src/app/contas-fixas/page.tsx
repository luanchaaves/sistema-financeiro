'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck2,
  Plus,
  Search,
  Calendar,
  DollarSign,
  Building2,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { formatCurrency } from '@/lib/utils';
import { FixedExpense } from '@/types';

export default function ContasFixasPage() {
  const { refreshKey, triggerRefresh } = useFinancial();
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FixedExpense | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    categoryName: 'Aluguel',
    amount: '',
    dueDay: '1',
    bankName: 'Nubank',
    paymentMethod: 'Pix',
    frequency: 'Mensal',
    notes: '',
  });

  // Deletion Modal
  const [deleteTarget, setDeleteTarget] = useState<FixedExpense | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const res = await fetch('/api/fixed-expenses');
        if (res.ok) setFixedExpenses(await res.json());
      } catch (err) {
        console.error('Failed to load fixed expenses:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [refreshKey]);

  const totalMonthly = fixedExpenses
    .filter((f) => f.isActive)
    .reduce((acc, curr) => acc + curr.amount, 0);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      categoryName: 'Aluguel',
      amount: '',
      dueDay: '1',
      bankName: 'Nubank',
      paymentMethod: 'Pix',
      frequency: 'Mensal',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: FixedExpense) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      categoryName: item.categoryName,
      amount: item.amount.toString(),
      dueDay: item.dueDay.toString(),
      bankName: item.bankName,
      paymentMethod: item.paymentMethod,
      frequency: item.frequency,
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = editingItem ? `/api/fixed-expenses/${editingItem.id}` : '/api/fixed-expenses';
      const method = editingItem ? 'PUT' : 'POST';

      await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      setIsModalOpen(false);
      triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const toggleActive = async (item: FixedExpense) => {
    try {
      await fetch(`/api/fixed-expenses/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/fixed-expenses/${deleteTarget.id}`, { method: 'DELETE' });
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
            <CalendarCheck2 className="text-amber-400" size={26} />
            Contas Fixas & Recorrências
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Planejamento de despesas automáticas, compromissos mensais e datas de vencimento.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-lg shadow-amber-500/20 transition-all self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>+ Nova Conta Fixa</span>
        </button>
      </div>

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Fixo Mensal</span>
          <p className="text-xl font-black text-white mt-1">{formatCurrency(totalMonthly)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{fixedExpenses.filter((f) => f.isActive).length} contas ativas</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Custo Diário Estimado</span>
          <p className="text-xl font-black text-amber-400 mt-1">{formatCurrency(totalMonthly / 30)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Para manter as contas em dia</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Total Anual Projetado</span>
          <p className="text-xl font-black text-sky-400 mt-1">{formatCurrency(totalMonthly * 12)}</p>
          <p className="text-[11px] text-slate-400 mt-1">12 meses de despesas fixas</p>
        </div>
      </div>

      {/* 3. Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {fixedExpenses.map((item) => (
          <div
            key={item.id}
            className={`p-5 rounded-2xl border transition-all ${
              item.isActive
                ? 'bg-navy-900 border-navy-750/80 hover:border-amber-500/40'
                : 'bg-navy-950/60 border-navy-800 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                  {item.categoryName}
                </span>
                <h3 className="text-base font-bold text-white mt-2">{item.name}</h3>
              </div>
              <button
                onClick={() => toggleActive(item)}
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                  item.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                }`}
              >
                {item.isActive ? 'Ativa' : 'Pausada'}
              </button>
            </div>

            <div className="mt-4">
              <span className="text-[11px] text-slate-400">Valor Recorrente</span>
              <p className="text-xl font-black text-white">{formatCurrency(item.amount)}</p>
            </div>

            <div className="mt-4 pt-3 border-t border-navy-800 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} className="text-amber-400" />
                <span>Vence todo dia {item.dueDay}</span>
              </div>
              <span>{item.bankName}</span>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(item)}
                className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white text-xs flex items-center gap-1 px-2.5"
              >
                <Edit2 size={12} />
                <span>Editar</span>
              </button>
              <button
                onClick={() => setDeleteTarget(item)}
                className="p-1.5 rounded-lg bg-navy-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 text-xs flex items-center gap-1 px-2.5"
              >
                <Trash2 size={12} />
                <span>Excluir</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">
              {editingItem ? 'Editar Conta Fixa' : 'Nova Conta Fixa'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome da Conta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Aluguel, Internet Fibra, FIAP..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Dia do Vencimento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={formData.dueDay}
                    onChange={(e) => setFormData({ ...formData, dueDay: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={formData.categoryName}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Banco / Débito</label>
                  <input
                    type="text"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-amber-500"
                  />
                </div>
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
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold shadow-lg"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir Conta Fixa"
        description={`Tem certeza que deseja excluir permanentemente a regra da conta fixa "${deleteTarget?.name}"?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
