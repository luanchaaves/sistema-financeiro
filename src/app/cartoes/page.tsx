'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard as CreditCardIcon,
  Plus,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Edit2,
  Trash2,
  ChevronRight,
  ShieldCheck,
  Percent,
  Download,
  FileSpreadsheet,
  X,
  List,
  Eye,
  ArrowRight,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { FilterBar } from '@/components/layout/FilterBar';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToExcel } from '@/lib/export-helpers';
import { CreditCard, CreditCardPurchase, MONTHS, MonthName } from '@/types';

const COLOR_PRESETS = [
  { label: 'Roxo Nubank', value: '#8a05be' },
  { label: 'Laranja Itaú', value: '#ec7000' },
  { label: 'Azul Bradesco/Caixa', value: '#0284c7' },
  { label: 'Verde C6/Sicredi', value: '#10b981' },
  { label: 'Vermelho Santander', value: '#e11d48' },
  { label: 'Preto Black / Dark', value: '#1e293b' },
  { label: 'Dourado Gold', value: '#d97706' },
  { label: 'Rosa Pink', value: '#db2777' },
];

export default function CartoesPage() {
  const { selectedYear, selectedMonth, refreshKey, triggerRefresh, openQuickAction } = useFinancial();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [purchases, setPurchases] = useState<CreditCardPurchase[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<string>('TODOS');
  const [showAllInvoices, setShowAllInvoices] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  // Card Management Modals
  const [showNewCardModal, setShowNewCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [deleteCardTarget, setDeleteCardTarget] = useState<CreditCard | null>(null);
  const [cardForm, setCardForm] = useState({
    name: '',
    bankName: 'Nubank',
    limitTotal: '',
    limitAvailable: '',
    closingDay: '28',
    dueDay: '5',
    color: '#8a05be',
    brand: 'Mastercard',
  });

  // Invoice Details / Grouped Purchases Modal
  const [activeInvoice, setActiveInvoice] = useState<any | null>(null);

  // Purchase Edit Modal
  const [editingPurchase, setEditingPurchase] = useState<any | null>(null);
  const [purchaseForm, setPurchaseForm] = useState({
    description: '',
    totalAmount: '',
    totalInstallments: 1,
    invoiceMonth: 'Setembro',
    invoiceYear: 2026,
    categoryName: '',
    date: '',
    cardId: '',
    notes: '',
  });

  // Purchase Deletion Target
  const [deletePurchaseTarget, setDeletePurchaseTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    async function loadCardData() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (selectedYear && selectedYear !== 'TODOS') query.set('year', selectedYear);
        if (!showAllInvoices && selectedMonth && selectedMonth !== 'TODOS') {
          query.set('month', selectedMonth);
        }
        if (selectedCardId && selectedCardId !== 'TODOS') query.set('cardId', selectedCardId);

        const purchasesQuery = new URLSearchParams();
        if (selectedYear && selectedYear !== 'TODOS') purchasesQuery.set('year', selectedYear);
        if (selectedMonth && selectedMonth !== 'TODOS') purchasesQuery.set('month', selectedMonth);
        if (selectedCardId && selectedCardId !== 'TODOS') purchasesQuery.set('cardId', selectedCardId);

        const [cardsRes, purchasesRes, invoicesRes] = await Promise.all([
          fetch('/api/credit-cards'),
          fetch(`/api/credit-cards/purchases?${purchasesQuery.toString()}`),
          fetch(`/api/credit-cards/invoices?${query.toString()}`),
        ]);

        if (cardsRes.ok) setCards(await cardsRes.json());
        if (purchasesRes.ok) setPurchases(await purchasesRes.json());
        if (invoicesRes.ok) {
          const loadedInvoices = await invoicesRes.json();
          setInvoices(loadedInvoices);

          // Update active invoice if open
          if (activeInvoice) {
            const updated = loadedInvoices.find(
              (inv: any) =>
                inv.cardId === activeInvoice.cardId &&
                inv.month === activeInvoice.month &&
                inv.year === activeInvoice.year
            );
            if (updated) setActiveInvoice(updated);
          }
        }
      } catch (err) {
        console.error('Failed to load card data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadCardData();
  }, [selectedYear, selectedMonth, selectedCardId, showAllInvoices, refreshKey]);

  // Open Edit Card Modal
  const handleOpenEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setCardForm({
      name: card.name,
      bankName: card.bankName,
      limitTotal: card.limitTotal.toString(),
      limitAvailable: card.limitAvailable.toString(),
      closingDay: card.closingDay.toString(),
      dueDay: card.dueDay.toString(),
      color: card.color,
      brand: card.brand,
    });
  };

  // Save / Update Card
  const handleSaveCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = Boolean(editingCard);
      const url = isEditing ? `/api/credit-cards/${editingCard!.id}` : '/api/credit-cards';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardForm),
      });

      if (res.ok) {
        setShowNewCardModal(false);
        setEditingCard(null);
        triggerRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Card
  const confirmDeleteCard = async () => {
    if (!deleteCardTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/credit-cards/${deleteCardTarget.id}`, { method: 'DELETE' });
      triggerRefresh();
      setDeleteCardTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Update Invoice Status (Pagar / Reabrir / Mudar Status)
  const handleUpdateInvoiceStatus = async (invoice: any, newStatus: string) => {
    try {
      await fetch('/api/credit-cards/invoices', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId: invoice.cardId,
          month: invoice.month,
          year: invoice.year,
          status: newStatus,
        }),
      });
      triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Open Edit Purchase Modal
  const handleOpenEditPurchase = (purchase: any) => {
    setEditingPurchase(purchase);
    setPurchaseForm({
      description: purchase.description || '',
      totalAmount: purchase.totalAmount?.toString() || '',
      totalInstallments: purchase.totalInstallments || 1,
      invoiceMonth: purchase.invoiceMonth || 'Setembro',
      invoiceYear: purchase.invoiceYear || 2026,
      categoryName: purchase.categoryName || '',
      date: purchase.date ? new Date(purchase.date).toISOString().split('T')[0] : '',
      cardId: purchase.cardId || (purchase.card ? purchase.card.id : ''),
      notes: purchase.notes || '',
    });
  };

  // Save Purchase Changes
  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;

    try {
      const res = await fetch(`/api/credit-cards/purchases/${editingPurchase.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...purchaseForm,
          regenerateInstallments: true,
        }),
      });

      if (res.ok) {
        setEditingPurchase(null);
        triggerRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Purchase
  const confirmDeletePurchase = async () => {
    if (!deletePurchaseTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/credit-cards/purchases/${deletePurchaseTarget.id}`, { method: 'DELETE' });
      triggerRefresh();
      setDeletePurchaseTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Export handlers
  const handleExportPurchases = () => {
    exportToExcel(`compras_cartao_${selectedMonth}_${selectedYear}`, [
      {
        sheetName: 'Compras Cartão',
        data: purchases.map((p) => ({
          Data: formatDate(p.date),
          Cartão: p.card?.name || 'Cartão',
          Descrição: p.description,
          Categoria: p.categoryName,
          ValorTotal: p.totalAmount,
          Parcelas: `${p.currentInstallment || 1}/${p.totalInstallments}`,
          ValorParcela: p.installmentAmount,
          MêsFatura: p.invoiceMonth,
          AnoFatura: p.invoiceYear,
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
            <CreditCardIcon className="text-purple-400" size={26} />
            Cartões de Crédito & Faturas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestão de limites, datas de fechamento e vencimento, compras agrupadas e faturas consolidadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPurchases}
            className="p-2 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-750 text-slate-300 hover:text-white transition-colors"
            title="Exportar Compras"
          >
            <FileSpreadsheet size={16} />
          </button>
          <button
            onClick={() => {
              setEditingCard(null);
              setCardForm({
                name: '',
                bankName: 'Nubank',
                limitTotal: '5000',
                limitAvailable: '5000',
                closingDay: '28',
                dueDay: '5',
                color: '#8a05be',
                brand: 'Mastercard',
              });
              setShowNewCardModal(true);
            }}
            className="px-3 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 border border-navy-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Plus size={14} />
            <span>Novo Cartão</span>
          </button>
          <button
            onClick={() => openQuickAction('purchase')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all"
          >
            <Plus size={16} />
            <span>+ Nova Compra</span>
          </button>
        </div>
      </div>

      <FilterBar />

      {/* 2. Visual Credit Cards Carousel / Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Meus Cartões de Crédito ({cards.length})
          </h3>
          <span className="text-[11px] text-slate-500">
            Clique no ícone de lápis para editar limite, datas de fechamento e vencimento
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => {
            const used = Math.max(0, card.limitTotal - card.limitAvailable);
            const pct = card.limitTotal > 0 ? (used / card.limitTotal) * 100 : 0;

            return (
              <div
                key={card.id}
                className="relative rounded-3xl p-6 border border-navy-700/80 shadow-2xl overflow-hidden transition-all hover:scale-[1.01] group"
                style={{
                  background: `linear-gradient(135deg, ${card.color} 0%, #0D1424 100%)`,
                }}
              >
                {/* Header with Brand, Name & Edit Button */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-widest text-slate-300 drop-shadow">
                      {card.brand || 'Card'}
                    </span>
                    <h3 className="text-lg font-black text-white mt-0.5 drop-shadow-md">{card.name}</h3>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditCard(card)}
                      title="Editar Limite e Datas do Cartão"
                      className="w-8 h-8 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center border border-white/30 text-white transition-all shadow-sm"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => setDeleteCardTarget(card)}
                      title="Excluir Cartão"
                      className="w-8 h-8 rounded-xl bg-black/30 hover:bg-rose-500/40 backdrop-blur-md flex items-center justify-center border border-white/20 text-slate-300 hover:text-rose-200 transition-all shadow-sm"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Limits & Progress */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 drop-shadow">Limite Disponível:</span>
                    <span className="text-emerald-300 font-extrabold text-sm drop-shadow">
                      {formatCurrency(card.limitAvailable)}
                    </span>
                  </div>
                  <div className="w-full bg-black/50 h-2.5 rounded-full overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="bg-emerald-400 h-full rounded-full transition-all shadow-sm"
                      style={{ width: `${Math.max(5, Math.min(100, 100 - pct))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300">
                    <span>Total: {formatCurrency(card.limitTotal)}</span>
                    <span>Usado: {formatCurrency(used)}</span>
                  </div>
                </div>

                {/* Closing and Due Dates */}
                <div className="mt-5 pt-3 border-t border-white/15 flex items-center justify-between text-xs text-slate-200">
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-slate-300" />
                    <span>Fecha dia <strong className="text-white">{card.closingDay}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar size={13} className="text-purple-300" />
                    <span>Vence dia <strong className="text-white font-extrabold">{card.dueDay}</strong></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Faturas Consolidadas & Compras Agrupadas */}
      <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-5 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar size={16} className="text-purple-400" />
              Faturas Consolidadas & Compras Agrupadas
            </h3>
            <p className="text-xs text-slate-400">
              Clique em qualquer fatura para visualizar e editar as compras agrupadas
            </p>
          </div>

          <div className="flex items-center gap-2 bg-navy-950/80 p-1 rounded-xl border border-navy-750 text-xs">
            <button
              onClick={() => setShowAllInvoices(false)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                !showAllInvoices
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Mês Selecionado ({selectedMonth})
            </button>
            <button
              onClick={() => setShowAllInvoices(true)}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                showAllInvoices
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Todas as Faturas do Ano ({selectedYear})
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.length === 0 ? (
            <div className="col-span-full p-8 text-center text-xs text-slate-400 bg-navy-950/40 rounded-2xl border border-navy-800">
              Nenhuma fatura encontrada para este período.
            </div>
          ) : (
            invoices.map((inv) => (
              <div
                key={`${inv.cardId}-${inv.month}-${inv.year}`}
                className="p-5 rounded-2xl bg-navy-850/70 border border-navy-750 flex flex-col justify-between gap-4 hover:border-purple-500/50 hover:bg-navy-850 transition-all shadow-sm group"
              >
                {/* Card and Month Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{inv.cardName}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                        {inv.month} / {inv.year}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                      <List size={12} className="text-slate-400" />
                      <strong>{inv.purchasesCount}</strong> compras agrupadas
                    </p>
                  </div>

                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${
                      inv.status === 'Fatura Paga'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : inv.status === 'Fatura Vencida'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>

                {/* Amount */}
                <div>
                  <span className="text-[11px] text-slate-400">Total da Fatura</span>
                  <p className="text-xl font-black text-white tracking-tight">{formatCurrency(inv.totalAmount)}</p>
                </div>

                {/* Due Date & Action Buttons */}
                <div className="pt-3 border-t border-navy-800 flex items-center justify-between text-xs gap-2">
                  <span className="text-slate-400 text-[11px]">
                    Vence: <strong>{formatDate(inv.dueDate)}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveInvoice(inv)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy-750 hover:bg-navy-700 text-slate-200 hover:text-white font-semibold text-xs border border-navy-700 transition-all"
                      title="Ver Compras e Editar Fatura"
                    >
                      <Eye size={13} className="text-purple-400" />
                      <span>Ver / Editar</span>
                    </button>

                    {inv.status !== 'Fatura Paga' ? (
                      <button
                        onClick={() => handleUpdateInvoiceStatus(inv, 'Fatura Paga')}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs transition-all shadow-sm"
                      >
                        Pagar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateInvoiceStatus(inv, 'Fatura Aberta')}
                        className="px-2.5 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-400 hover:text-white text-[11px] border border-navy-700"
                        title="Reabrir Fatura"
                      >
                        Reabrir
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 4. Lista de Compras & Parcelamentos */}
      <div className="rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card overflow-hidden">
        <div className="p-4 border-b border-navy-750 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CreditCardIcon size={16} className="text-purple-400" />
              Compras e Parcelamentos Ativos ({selectedMonth} / {selectedYear})
            </h3>
            <p className="text-xs text-slate-400">
              Gerencie valores, parcelamentos e datas de cada lançamento
            </p>
          </div>
          <span className="text-xs text-slate-400 font-semibold">{purchases.length} compras encontradas</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-navy-750 bg-navy-950/60 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3 px-4">Data Compra</th>
                <th className="py-3 px-4">Cartão</th>
                <th className="py-3 px-4">Descrição</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4 text-center">Parcelamento</th>
                <th className="py-3 px-4 text-right">Valor Parcela</th>
                <th className="py-3 px-4 text-right">Valor Total</th>
                <th className="py-3 px-4 text-center">1ª Fatura</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-800">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    Nenhuma compra registrada para este período.
                  </td>
                </tr>
              ) : (
                purchases.map((item) => (
                  <tr key={item.id} className="hover:bg-navy-800/40 transition-colors group">
                    <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{formatDate(item.date)}</td>
                    <td className="py-3 px-4 font-semibold text-white whitespace-nowrap">
                      {item.card?.name || 'Cartão'}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-white">{item.description}</p>
                      {item.notes && <p className="text-[10px] text-slate-400">{item.notes}</p>}
                    </td>
                    <td className="py-3 px-4 text-slate-300">{item.categoryName}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold">
                        {item.totalInstallments}x
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-semibold text-purple-300">
                      {formatCurrency(item.installmentAmount)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {formatCurrency(item.totalAmount)}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-300">
                      {item.invoiceMonth} / {item.invoiceYear}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => handleOpenEditPurchase(item)}
                          title="Editar Compra"
                          className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white transition-colors"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => setDeletePurchaseTarget(item)}
                          title="Excluir Compra"
                          className="p-1.5 rounded-lg bg-navy-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors"
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

      {/* MODAL 1: Create / Edit Card Modal */}
      {(showNewCardModal || editingCard) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-navy-750 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCardIcon size={18} className="text-purple-400" />
                {editingCard ? `Editar Cartão: ${editingCard.name}` : 'Novo Cartão de Crédito'}
              </h3>
              <button
                onClick={() => {
                  setShowNewCardModal(false);
                  setEditingCard(null);
                }}
                className="text-slate-400 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCard} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nome do Cartão</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Nubank Ultravioleta, Itaú..."
                    value={cardForm.name}
                    onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Bandeira</label>
                  <select
                    value={cardForm.brand}
                    onChange={(e) => setCardForm({ ...cardForm, brand: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  >
                    <option value="Mastercard">Mastercard</option>
                    <option value="Visa">Visa</option>
                    <option value="Elo">Elo</option>
                    <option value="Amex">American Express</option>
                    <option value="Hipercard">Hipercard</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Limite Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="8000.00"
                    value={cardForm.limitTotal}
                    onChange={(e) => setCardForm({ ...cardForm, limitTotal: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Limite Disponível (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="4500.00"
                    value={cardForm.limitAvailable}
                    onChange={(e) => setCardForm({ ...cardForm, limitAvailable: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-emerald-400 text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Dia de Fechamento da Fatura (1-31)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={cardForm.closingDay}
                    onChange={(e) => setCardForm({ ...cardForm, closingDay: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    Dia de Vencimento da Fatura (1-31)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={cardForm.dueDay}
                    onChange={(e) => setCardForm({ ...cardForm, dueDay: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">Cor do Cartão (Gradiente)</label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      type="button"
                      key={preset.value}
                      onClick={() => setCardForm({ ...cardForm, color: preset.value })}
                      className={`h-9 rounded-xl flex items-center justify-center text-[10px] font-bold text-white transition-all border ${
                        cardForm.color === preset.value
                          ? 'border-white scale-105 shadow-md shadow-white/20'
                          : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: preset.value }}
                    >
                      {preset.label.split(' ')[0]}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-750">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewCardModal(false);
                    setEditingCard(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-navy-800 text-slate-300 text-xs hover:bg-navy-750"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-500/20"
                >
                  {editingCard ? 'Salvar Alterações' : 'Criar Cartão'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Invoice Details & Grouped Purchases Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-navy-900 border border-navy-750 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-navy-750 flex items-center justify-between bg-navy-950/60">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white">
                    Fatura de {activeInvoice.month} / {activeInvoice.year}
                  </h3>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                    {activeInvoice.cardName}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {activeInvoice.purchasesCount} compras agrupadas nesta fatura • Vencimento: {formatDate(activeInvoice.dueDate)}
                </p>
              </div>

              <button
                onClick={() => setActiveInvoice(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Invoice Overview Bar */}
            <div className="p-4 bg-navy-850/80 border-b border-navy-750 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-[11px] text-slate-400 uppercase tracking-wider">Valor Total Consolidado</span>
                <p className="text-2xl font-black text-white">{formatCurrency(activeInvoice.totalAmount)}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Status:</span>
                  <select
                    value={activeInvoice.status}
                    onChange={(e) => handleUpdateInvoiceStatus(activeInvoice, e.target.value)}
                    className="bg-navy-800 border border-navy-700 text-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none focus:border-purple-500"
                  >
                    <option value="Fatura Aberta">Fatura Aberta</option>
                    <option value="Fatura Paga">Fatura Paga</option>
                    <option value="Fatura Vencida">Fatura Vencida</option>
                    <option value="Fatura Fechada">Fatura Fechada</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    openQuickAction('purchase', {
                      cardId: activeInvoice.cardId,
                      invoiceMonth: activeInvoice.month,
                      invoiceYear: activeInvoice.year,
                    });
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs shadow-md transition-all"
                >
                  <Plus size={14} />
                  <span>Adicionar Compra</span>
                </button>
              </div>
            </div>

            {/* List of Grouped Purchases in This Invoice */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Itens e Parcelas que compõem esta fatura
              </h4>

              {(!activeInvoice.items || activeInvoice.items.length === 0) ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-navy-950/40 rounded-xl border border-navy-800">
                  Nenhuma compra registrada nesta fatura específica.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeInvoice.items.map((item: any) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-navy-800/80 border border-navy-750 flex items-center justify-between gap-3 hover:border-purple-500/40 transition-all"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{item.purchase?.description || 'Compra'}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-semibold">
                            Parcela {item.installmentNumber}/{item.totalInstallments}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
                          <span>Data da Compra: {formatDate(item.purchase?.date)}</span>
                          <span>•</span>
                          <span>Categoria: {item.purchase?.categoryName || 'Geral'}</span>
                          {item.purchase?.notes && (
                            <>
                              <span>•</span>
                              <span>{item.purchase.notes}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-white">{formatCurrency(item.amount)}</span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditPurchase(item.purchase)}
                            title="Editar Compra"
                            className="p-1.5 rounded-lg bg-navy-750 hover:bg-navy-700 text-slate-300 hover:text-white transition-colors"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            onClick={() => setDeletePurchaseTarget(item.purchase)}
                            title="Excluir Compra"
                            className="p-1.5 rounded-lg bg-navy-750 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-navy-750 bg-navy-950/60 flex items-center justify-end">
              <button
                onClick={() => setActiveInvoice(null)}
                className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold shadow-md"
              >
                Concluir Visualização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Edit Purchase Modal */}
      {editingPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-navy-750 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit2 size={16} className="text-purple-400" />
                Editar Compra de Cartão
              </h3>
              <button onClick={() => setEditingPurchase(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSavePurchase} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={purchaseForm.description}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, description: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={purchaseForm.totalAmount}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, totalAmount: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Número de Parcelas</label>
                  <select
                    value={purchaseForm.totalInstallments}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, totalInstallments: parseInt(e.target.value, 10) })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 18, 24, 36].map((n) => (
                      <option key={n} value={n}>
                        {n === 1 ? '1x (À vista)' : `${n}x parcelas`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Cartão</label>
                  <select
                    value={purchaseForm.cardId}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, cardId: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  >
                    {cards.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Data da Compra</label>
                  <input
                    type="date"
                    required
                    value={purchaseForm.date}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, date: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Mês da 1ª Fatura</label>
                  <select
                    value={purchaseForm.invoiceMonth}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, invoiceMonth: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  >
                    {MONTHS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={purchaseForm.categoryName}
                    onChange={(e) => setPurchaseForm({ ...purchaseForm, categoryName: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Observações (opcional)</label>
                <textarea
                  rows={2}
                  value={purchaseForm.notes}
                  onChange={(e) => setPurchaseForm({ ...purchaseForm, notes: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-purple-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-750">
                <button
                  type="button"
                  onClick={() => setEditingPurchase(null)}
                  className="px-4 py-2 rounded-xl bg-navy-800 text-slate-300 text-xs hover:bg-navy-750"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-500 hover:bg-purple-600 text-white text-xs font-bold shadow-lg shadow-purple-500/20"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Card Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={Boolean(deleteCardTarget)}
        title="Excluir Cartão"
        description={`Tem certeza que deseja excluir o cartão "${deleteCardTarget?.name}"? Todas as faturas e compras vinculadas serão desativadas.`}
        onConfirm={confirmDeleteCard}
        onCancel={() => setDeleteCardTarget(null)}
        isLoading={isDeleting}
      />

      {/* Delete Purchase Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={Boolean(deletePurchaseTarget)}
        title="Excluir Compra de Cartão"
        description={`Tem certeza que deseja excluir a compra "${deletePurchaseTarget?.description}"? As parcelas vinculadas serão excluídas e o limite do cartão será restituído.`}
        onConfirm={confirmDeletePurchase}
        onCancel={() => setDeletePurchaseTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
