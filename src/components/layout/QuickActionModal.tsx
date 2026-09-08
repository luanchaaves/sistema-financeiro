'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, TrendingUp, TrendingDown, CreditCard, LineChart, AlertTriangle, Target } from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { MONTHS } from '@/types';

export function QuickActionModal() {
  const { quickActionModal, closeQuickAction, triggerRefresh, selectedMonth, selectedYear } = useFinancial();
  const { isOpen, type, initialData } = quickActionModal;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lists for dropdown selects
  const [categories, setCategories] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [cards, setCards] = useState<any[]>([]);

  // Common Form States
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (!isOpen) {
      setFormData({});
      setError(null);
      return;
    }

    // Load available banks, categories, cards
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/banks').then((r) => r.json()),
      fetch('/api/credit-cards').then((r) => r.json()),
    ]).then(([cats, bks, crds]) => {
      setCategories(Array.isArray(cats) ? cats : []);
      setBanks(Array.isArray(bks) ? bks : []);
      setCards(Array.isArray(crds) ? crds : []);
    });

    const today = new Date().toISOString().split('T')[0];

    if (initialData) {
      setFormData({
        ...initialData,
        date: initialData.date ? new Date(initialData.date).toISOString().split('T')[0] : today,
      });
    } else {
      setFormData({
        date: today,
        month: selectedMonth === 'TODOS' ? 'Setembro' : selectedMonth,
        year: selectedYear === 'TODOS' ? 2026 : parseInt(selectedYear, 10),
        status: type === 'income' ? 'Recebido' : (type === 'expense' ? 'Pago' : 'Fatura Aberta'),
        paymentMethod: 'Pix',
        bankName: 'Nubank',
        totalInstallments: 1,
        frequency: 'Mensal',
      });
    }
  }, [isOpen, type, initialData]);

  if (!isOpen || !type) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let endpoint = '';
      let method = initialData?.id ? 'PUT' : 'POST';

      if (type === 'income') {
        endpoint = initialData?.id ? `/api/incomes/${initialData.id}` : '/api/incomes';
      } else if (type === 'expense') {
        endpoint = initialData?.id ? `/api/expenses/${initialData.id}` : '/api/expenses';
      } else if (type === 'purchase') {
        endpoint = initialData?.id ? `/api/credit-cards/purchases/${initialData.id}` : '/api/credit-cards/purchases';
      } else if (type === 'investment') {
        endpoint = initialData?.id ? `/api/investments/${initialData.id}` : '/api/investments';
      } else if (type === 'debt') {
        endpoint = initialData?.id ? `/api/debts/${initialData.id}` : '/api/debts';
      } else if (type === 'goal') {
        endpoint = initialData?.id ? `/api/goals/${initialData.id}` : '/api/goals';
      }

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Erro ao processar solicitação');
      }

      triggerRefresh();
      closeQuickAction();
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro');
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    const isEdit = Boolean(initialData?.id);
    switch (type) {
      case 'income':
        return isEdit ? 'Editar Receita' : 'Nova Receita / Ganho';
      case 'expense':
        return isEdit ? 'Editar Despesa' : 'Nova Despesa / Custo';
      case 'purchase':
        return isEdit ? 'Editar Compra' : 'Nova Compra no Cartão';
      case 'investment':
        return isEdit ? 'Editar Investimento' : 'Novo Investimento / Reserva';
      case 'debt':
        return isEdit ? 'Editar Dívida' : 'Nova Dívida / Financiamento';
      case 'goal':
        return isEdit ? 'Editar Meta' : 'Nova Meta Financeira';
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (type === 'income') return c.type === 'INCOME';
    if (type === 'expense') return c.type === 'EXPENSE' || c.type === 'FIXED' || c.type === 'DEBT';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-navy-750">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold">
              {type === 'income' && <TrendingUp size={18} />}
              {type === 'expense' && <TrendingDown size={18} />}
              {type === 'purchase' && <CreditCard size={18} />}
              {type === 'investment' && <LineChart size={18} />}
              {type === 'debt' && <AlertTriangle size={18} />}
              {type === 'goal' && <Target size={18} />}
            </div>
            <h2 className="text-base font-bold text-white">{getTitle()}</h2>
          </div>
          <button onClick={closeQuickAction} className="p-1 rounded text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Form fields for Income & Expense */}
          {(type === 'income' || type === 'expense') && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Salário mensal, Mercado, Aluguel..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                  <select
                    value={formData.type || (type === 'income' ? 'Salário' : 'Despesa')}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  >
                    {type === 'income' ? (
                      <>
                        <option value="Salário">Salário</option>
                        <option value="PJ">PJ</option>
                        <option value="Motoboy">Motoboy</option>
                        <option value="Freelance">Freelance</option>
                        <option value="Reembolso">Reembolso</option>
                        <option value="Investimentos">Investimentos</option>
                        <option value="Venda">Venda</option>
                        <option value="Outros">Outros</option>
                      </>
                    ) : (
                      <>
                        <option value="Despesa">Despesa</option>
                        <option value="Conta Fixa">Conta Fixa</option>
                        <option value="Dívida">Dívida</option>
                        <option value="Poupança/Investimento">Poupança/Investimento</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Categoria</label>
                  <select
                    value={formData.categoryName || ''}
                    onChange={(e) => {
                      const sel = categories.find((c) => c.name === e.target.value);
                      setFormData({
                        ...formData,
                        categoryName: e.target.value,
                        categoryId: sel?.id,
                      });
                    }}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  >
                    <option value="">Selecione a categoria</option>
                    {filteredCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Banco / Origem</label>
                  <select
                    value={formData.bankName || 'Nubank'}
                    onChange={(e) => {
                      const sel = banks.find((b) => b.name === e.target.value);
                      setFormData({
                        ...formData,
                        bankName: e.target.value,
                        bankId: sel?.id,
                      });
                    }}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  >
                    {banks.map((b) => (
                      <option key={b.id} value={b.name}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Status</label>
                  <select
                    value={formData.status || (type === 'income' ? 'Recebido' : 'Pago')}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  >
                    {type === 'income' ? (
                      <>
                        <option value="Recebido">Recebido</option>
                        <option value="Não recebido">Não recebido</option>
                        <option value="Parcial">Parcial</option>
                        <option value="Cancelado">Cancelado</option>
                      </>
                    ) : (
                      <>
                        <option value="Pago">Pago</option>
                        <option value="A pagar">A pagar</option>
                        <option value="Parcial">Parcial</option>
                        <option value="Cancelado">Cancelado</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Forma de Pagamento</label>
                <select
                  value={formData.paymentMethod || 'Pix'}
                  onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                >
                  <option value="Pix">Pix</option>
                  <option value="Transferência">Transferência</option>
                  <option value="Cartão">Cartão</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Boleto">Boleto</option>
                  <option value="Débito Automático">Débito Automático</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Observações (opcional)</label>
                <textarea
                  rows={2}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Anotações adicionais..."
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-sky-500 resize-none"
                />
              </div>
            </>
          )}

          {/* Form fields for Credit Card Purchase */}
          {type === 'purchase' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Cartão de Crédito</label>
                  <select
                    required
                    value={formData.cardId || ''}
                    onChange={(e) => setFormData({ ...formData, cardId: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  >
                    <option value="">Selecione o Cartão</option>
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
                    value={formData.date || ''}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Descrição da Compra</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Compra Zara, Eletrônicos, Mercado..."
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={formData.totalAmount || ''}
                    onChange={(e) => setFormData({ ...formData, totalAmount: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Número de Parcelas</label>
                  <select
                    value={formData.totalInstallments || 1}
                    onChange={(e) => setFormData({ ...formData, totalInstallments: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
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
                  <label className="block text-xs text-slate-400 mb-1">Mês da 1ª Fatura</label>
                  <select
                    value={formData.invoiceMonth || 'Setembro'}
                    onChange={(e) => setFormData({ ...formData, invoiceMonth: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
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
                    placeholder="Ex: Roupas, Mercado, Pet..."
                    value={formData.categoryName || ''}
                    onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Form fields for Investment */}
          {type === 'investment' && (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome do Investimento</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reserva de Emergência Nubank, Tesouro Selic..."
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                  <select
                    value={formData.type || 'CDB'}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  >
                    <option value="Reserva de emergência">Reserva de Emergência</option>
                    <option value="CDB">CDB / Renda Fixa</option>
                    <option value="Tesouro Direto">Tesouro Direto</option>
                    <option value="Ações">Ações</option>
                    <option value="FIIs">Fundos Imobiliários (FIIs)</option>
                    <option value="Cripto">Criptomoedas</option>
                    <option value="Poupança">Poupança</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Instituição</label>
                  <input
                    type="text"
                    placeholder="Ex: Nubank, XP, Inter..."
                    value={formData.institution || ''}
                    onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor Aplicado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={formData.appliedAmount || ''}
                    onChange={(e) => setFormData({ ...formData, appliedAmount: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor Atual (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.currentAmount || ''}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Form fields for Debt */}
          {type === 'debt' && (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome da Dívida</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Financiamento Moto Ninja, Empréstimo..."
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Credor / Instituição</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Santander, Nubank..."
                    value={formData.creditor || ''}
                    onChange={(e) => setFormData({ ...formData, creditor: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor Original (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={formData.originalAmount || ''}
                    onChange={(e) => setFormData({ ...formData, originalAmount: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Qtd Parcelas Total</label>
                  <input
                    type="number"
                    value={formData.totalInstallments || 12}
                    onChange={(e) => setFormData({ ...formData, totalInstallments: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Parcelas já Pagas</label>
                  <input
                    type="number"
                    value={formData.currentInstallment || 0}
                    onChange={(e) => setFormData({ ...formData, currentInstallment: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Form fields for Goal */}
          {type === 'goal' && (
            <>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome da Meta</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Reserva de 6 meses, Viagem, Troca de Moto..."
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor Alvo (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0,00"
                    value={formData.targetAmount || ''}
                    onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor Atual Acumulado (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={formData.currentAmount || ''}
                    onChange={(e) => setFormData({ ...formData, currentAmount: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-semibold rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                  />
                </div>
              </div>
            </>
          )}

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-navy-750">
            <button
              type="button"
              onClick={closeQuickAction}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 border border-navy-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-xs font-bold text-white shadow-lg shadow-sky-500/20 transition-all"
            >
              <Check size={15} />
              <span>{loading ? 'Salvando...' : 'Salvar Registro'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
