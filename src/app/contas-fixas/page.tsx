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
  RotateCcw,
  Sparkles,
  Check,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { FilterBar } from '@/components/layout/FilterBar';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { formatCurrency } from '@/lib/utils';
import { FixedExpense } from '@/types';

export default function ContasFixasPage() {
  const { selectedYear, selectedMonth, refreshKey, triggerRefresh } = useFinancial();
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [tabFilter, setTabFilter] = useState<'TODAS' | 'PENDENTES' | 'PAGAS'>('TODAS');

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
        const query = new URLSearchParams();
        if (selectedYear && selectedYear !== 'TODOS') query.set('year', selectedYear);
        if (selectedMonth && selectedMonth !== 'TODOS') query.set('month', selectedMonth);

        const res = await fetch(`/api/fixed-expenses?${query.toString()}`);
        if (res.ok) setFixedExpenses(await res.json());
      } catch (err) {
        console.error('Failed to load fixed expenses:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [selectedYear, selectedMonth, refreshKey]);

  // Calculations
  const activeItems = fixedExpenses.filter((f) => f.isActive);
  const totalMonthly = activeItems.reduce((acc, curr) => acc + curr.amount, 0);
  const paidInMonth = activeItems
    .filter((f) => f.monthlyPayment?.isPaid)
    .reduce((acc, curr) => acc + (curr.monthlyPayment?.paidAmount || curr.amount), 0);
  const pendingInMonth = totalMonthly - paidInMonth;
  const paidCount = activeItems.filter((f) => f.monthlyPayment?.isPaid).length;
  const pendingCount = activeItems.length - paidCount;

  // Filtered list
  const filteredList = fixedExpenses.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.bankName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const isPaid = item.monthlyPayment?.isPaid;
    if (tabFilter === 'PENDENTES' && isPaid) return false;
    if (tabFilter === 'PAGAS' && !isPaid) return false;

    return matchesSearch;
  });

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

  // 1-Click Pay / Unpay monthly action
  const handleTogglePayment = async (item: FixedExpense) => {
    const isPaid = Boolean(item.monthlyPayment?.isPaid);
    const action = isPaid ? 'UNPAY' : 'PAY';
    const targetMonth = selectedMonth && selectedMonth !== 'TODOS' ? selectedMonth : 'Outubro';
    const targetYear = selectedYear && selectedYear !== 'TODOS' ? selectedYear : '2026';

    setActionLoadingId(item.id);
    try {
      const res = await fetch('/api/fixed-expenses/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fixedExpenseId: item.id,
          month: targetMonth,
          year: targetYear,
          action,
        }),
      });

      if (res.ok) {
        triggerRefresh();
      }
    } catch (err) {
      console.error('Failed to toggle fixed expense payment:', err);
    } finally {
      setActionLoadingId(null);
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

  const activeMonthLabel = selectedMonth && selectedMonth !== 'TODOS' ? selectedMonth : 'Mês Atual';

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
            Planejamento de despesas recorrentes, compromissos mensais e liquidação por mês.
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

      {/* Filter Bar */}
      <FilterBar />

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Total Fixo Mensal */}
        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Fixo Mensal</span>
          <p className="text-xl font-black text-white mt-1">{formatCurrency(totalMonthly)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{activeItems.length} contas cadastradas</p>
        </div>

        {/* Pagas no Mês */}
        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card hover:border-emerald-500/40 transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">Pagas em {activeMonthLabel}</span>
          <p className="text-xl font-black text-emerald-400 mt-1">{formatCurrency(paidInMonth)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{paidCount} de {activeItems.length} liquidadas</p>
        </div>

        {/* Pendentes no Mês */}
        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card hover:border-amber-500/40 transition-all">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">A Pagar em {activeMonthLabel}</span>
          <p className="text-xl font-black text-amber-400 mt-1">{formatCurrency(pendingInMonth)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{pendingCount} aguardando pagamento</p>
        </div>

        {/* Total Anual Projetado */}
        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">Total Anual Projetado</span>
          <p className="text-xl font-black text-sky-400 mt-1">{formatCurrency(totalMonthly * 12)}</p>
          <p className="text-[11px] text-slate-400 mt-1">12 meses de contas fixas</p>
        </div>
      </div>

      {/* 3. Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-navy-900/90 border border-navy-800 w-full sm:w-auto">
          <button
            onClick={() => setTabFilter('TODAS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              tabFilter === 'TODAS'
                ? 'bg-navy-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Todas ({activeItems.length})
          </button>
          <button
            onClick={() => setTabFilter('PENDENTES')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tabFilter === 'PENDENTES'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock size={13} />
            <span>A Pagar ({pendingCount})</span>
          </button>
          <button
            onClick={() => setTabFilter('PAGAS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              tabFilter === 'PAGAS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>Pagas ({paidCount})</span>
          </button>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar conta fixa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-navy-900 border border-navy-800 text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-amber-500 transition-all placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* 4. Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredList.map((item) => {
          const isPaid = Boolean(item.monthlyPayment?.isPaid);
          const isLoadingThis = actionLoadingId === item.id;

          return (
            <div
              key={item.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isPaid
                  ? 'bg-navy-900/95 border-emerald-500/40 shadow-lg shadow-emerald-950/20'
                  : item.isActive
                  ? 'bg-navy-900 border-navy-750/80 hover:border-amber-500/40'
                  : 'bg-navy-950/60 border-navy-800 opacity-60'
              }`}
            >
              {/* Card Top: Badges & Name */}
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                      {item.categoryName}
                    </span>
                    {isPaid ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={11} />
                        Pago em {activeMonthLabel}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock size={11} />
                        A Pagar em {activeMonthLabel}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => toggleActive(item)}
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold transition-all ${
                      item.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                    }`}
                    title={item.isActive ? 'Pausar recorrência' : 'Ativar recorrência'}
                  >
                    {item.isActive ? 'Ativa' : 'Pausada'}
                  </button>
                </div>

                <h3 className="text-base font-bold text-white mt-2.5">{item.name}</h3>

                {/* Amount */}
                <div className="mt-3">
                  <span className="text-[11px] text-slate-400">Valor Mensal</span>
                  <p className="text-xl font-black text-white tracking-tight">{formatCurrency(item.amount)}</p>
                </div>

                {/* Details Footer */}
                <div className="mt-3 pt-3 border-t border-navy-800 flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-amber-400" />
                    <span>Vence todo dia {item.dueDay}</span>
                  </div>
                  <span className="text-slate-400 font-medium">{item.bankName}</span>
                </div>
              </div>

              {/* Card Actions */}
              <div className="mt-5 pt-3 border-t border-navy-800 flex items-center justify-between gap-2">
                {/* 1-Click Payment Button */}
                {isPaid ? (
                  <button
                    onClick={() => handleTogglePayment(item)}
                    disabled={isLoadingThis}
                    className="flex-1 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-700 disabled:opacity-50"
                  >
                    <RotateCcw size={13} />
                    <span>{isLoadingThis ? 'Atualizando...' : 'Desfazer Pagamento'}</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleTogglePayment(item)}
                    disabled={isLoadingThis || !item.isActive}
                    className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <CheckCircle2 size={14} />
                    <span>{isLoadingThis ? 'Pagando...' : `Pagar em ${activeMonthLabel}`}</span>
                  </button>
                )}

                {/* Edit & Delete */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-2 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white transition-all"
                    title="Editar Regra"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="p-2 rounded-xl bg-navy-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-all"
                    title="Excluir Regra"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredList.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-navy-900 border border-navy-800">
          <CalendarCheck2 size={36} className="mx-auto text-slate-500 mb-2" />
          <p className="text-sm font-semibold text-slate-300">Nenhuma conta fixa encontrada</p>
          <p className="text-xs text-slate-500 mt-1">Tente ajustar seus termos de busca ou filtros.</p>
        </div>
      )}

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
