'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Plus,
  Search,
  Filter,
  Download,
  Copy,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Building2,
  Receipt,
  FileSpreadsheet,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { FilterBar } from '@/components/layout/FilterBar';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToCSV, exportToExcel } from '@/lib/export-helpers';
import { Income } from '@/types';

export default function RendasPage() {
  const { selectedYear, selectedMonth, refreshKey, triggerRefresh, openQuickAction } = useFinancial();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('TODOS');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [filterBank, setFilterBank] = useState('TODOS');

  // Deletion Modal
  const [deleteTarget, setDeleteTarget] = useState<Income | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadIncomes() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (selectedYear && selectedYear !== 'TODOS') query.set('year', selectedYear);
        if (selectedMonth && selectedMonth !== 'TODOS') query.set('month', selectedMonth);

        const res = await fetch(`/api/incomes?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setIncomes(data);
        }
      } catch (err) {
        console.error('Failed to load incomes:', err);
      } finally {
        setLoading(false);
      }
    }

    loadIncomes();
  }, [selectedYear, selectedMonth, refreshKey]);

  // Filtered list
  const filteredIncomes = incomes.filter((item) => {
    const matchesSearch =
      searchTerm === '' ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.notes && item.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'TODOS' || item.type === filterType;
    const matchesStatus = filterStatus === 'TODOS' || item.status === filterStatus;
    const matchesBank = filterBank === 'TODOS' || item.bankName === filterBank;

    return matchesSearch && matchesType && matchesStatus && matchesBank;
  });

  // Top Metrics
  const totalAmount = filteredIncomes.reduce((acc, curr) => acc + curr.amount, 0);
  const receivedAmount = filteredIncomes
    .filter((i) => i.status === 'Recebido')
    .reduce((acc, curr) => acc + curr.amount, 0);
  const pendingAmount = totalAmount - receivedAmount;

  // Toggle status quick action
  const toggleStatus = async (item: Income) => {
    const nextStatus = item.status === 'Recebido' ? 'Não recebido' : 'Recebido';
    try {
      await fetch(`/api/incomes/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Duplicate income
  const handleDuplicate = async (item: Income) => {
    try {
      const copy = {
        ...item,
        description: `${item.description} (Cópia)`,
      };
      await fetch('/api/incomes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(copy),
      });
      triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Delete income
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/incomes/${deleteTarget.id}`, { method: 'DELETE' });
      triggerRefresh();
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export handlers
  const handleExportCSV = () => {
    exportToCSV(
      `rendas_${selectedMonth}_${selectedYear}`,
      filteredIncomes.map((i) => ({
        Data: formatDate(i.date),
        Mês: i.month,
        Ano: i.year,
        Tipo: i.type,
        Categoria: i.categoryName,
        Descrição: i.description,
        Valor: i.amount,
        Status: i.status,
        Banco: i.bankName,
        Pagamento: i.paymentMethod,
        Observações: i.notes || '',
      }))
    );
  };

  const handleExportExcel = () => {
    exportToExcel(`rendas_${selectedMonth}_${selectedYear}`, [
      {
        sheetName: 'Rendas',
        data: filteredIncomes.map((i) => ({
          Data: formatDate(i.date),
          Mês: i.month,
          Ano: i.year,
          Tipo: i.type,
          Categoria: i.categoryName,
          Descrição: i.description,
          Valor: i.amount,
          Status: i.status,
          Banco: i.bankName,
          Pagamento: i.paymentMethod,
          Observações: i.notes || '',
        })),
      },
    ]);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <TrendingUp className="text-emerald-400" size={26} />
            Ganhos & Rendas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Controle todas as fontes de receitas, salários, freelas e entradas de capital.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="p-2 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-750 text-slate-300 hover:text-white transition-colors"
            title="Exportar CSV"
          >
            <Download size={16} />
          </button>
          <button
            onClick={handleExportExcel}
            className="p-2 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-750 text-slate-300 hover:text-white transition-colors"
            title="Exportar Excel"
          >
            <FileSpreadsheet size={16} />
          </button>
          <button
            onClick={() => openQuickAction('income')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus size={16} />
            <span>+ Nova Receita</span>
          </button>
        </div>
      </div>

      <FilterBar />

      {/* 2. Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Previsto</span>
          <p className="text-xl font-black text-white mt-1">{formatCurrency(totalAmount)}</p>
          <p className="text-[11px] text-slate-400 mt-1">{filteredIncomes.length} lançamentos listados</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={13} />
            Total Recebido
          </span>
          <p className="text-xl font-black text-emerald-400 mt-1">{formatCurrency(receivedAmount)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Já creditado em conta</p>
        </div>

        <div className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
            <Clock size={13} />
            Pendente a Receber
          </span>
          <p className="text-xl font-black text-amber-400 mt-1">{formatCurrency(pendingAmount)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Previsão no período</p>
        </div>
      </div>

      {/* 3. Filters & Search Bar */}
      <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-4 shadow-card flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px]">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por descrição, notas ou categoria..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent text-xs text-white placeholder:text-slate-500 outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tipo Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-navy-800 border border-navy-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-300 outline-none"
          >
            <option value="TODOS">Todos os Tipos</option>
            <option value="Salário">Salário</option>
            <option value="PJ">PJ</option>
            <option value="Motoboy">Motoboy</option>
            <option value="Freelance">Freelance</option>
            <option value="Reembolso">Reembolso</option>
            <option value="Investimentos">Investimentos</option>
            <option value="Venda">Venda</option>
            <option value="Outros">Outros</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-navy-800 border border-navy-700 text-xs rounded-xl px-2.5 py-1.5 text-slate-300 outline-none"
          >
            <option value="TODOS">Todos os Status</option>
            <option value="Recebido">Recebido</option>
            <option value="Não recebido">Não recebido</option>
            <option value="Parcial">Parcial</option>
            <option value="Cancelado">Cancelado</option>
          </select>
        </div>
      </div>

      {/* 4. Table */}
      <div className="rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-navy-750 bg-navy-950/60 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Banco / Destino</th>
                <th className="py-3 px-4 text-right">Valor</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {filteredIncomes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Nenhuma receita encontrada para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filteredIncomes.map((item) => (
                  <tr key={item.id} className="hover:bg-navy-800/40 transition-colors group">
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{formatDate(item.date)}</td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{item.description}</p>
                      {item.notes && <p className="text-[10px] text-slate-400 truncate max-w-xs">{item.notes}</p>}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{item.type}</td>
                    <td className="py-3 px-4 text-slate-300">{item.categoryName}</td>
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{item.bankName}</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400 text-sm whitespace-nowrap">
                      {formatCurrency(item.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => toggleStatus(item)}
                        title="Clique para alternar o status"
                        className={`text-[10px] px-2.5 py-1 rounded-full font-bold transition-transform active:scale-95 ${
                          item.status === 'Recebido'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {item.status}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => handleDuplicate(item)}
                          title="Duplicar Receita"
                          className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white"
                        >
                          <Copy size={13} />
                        </button>
                        <button
                          onClick={() => openQuickAction('income', item)}
                          title="Editar"
                          className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(item)}
                          title="Excluir"
                          className="p-1.5 rounded-lg bg-navy-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir Receita"
        description={`Tem certeza que deseja excluir "${deleteTarget?.description}" no valor de ${deleteTarget ? formatCurrency(deleteTarget.amount) : ''}?`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
