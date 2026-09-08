'use client';

import React, { useState, useEffect } from 'react';
import {
  Settings as SettingsIcon,
  Plus,
  Building2,
  Tag,
  Shield,
  Trash2,
  Edit2,
  CheckCircle2,
  History,
  Download,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function ConfiguracoesPage() {
  const { refreshKey, triggerRefresh } = useFinancial();
  const [activeTab, setActiveTab] = useState<'banks' | 'categories' | 'logs'>('banks');

  const [banks, setBanks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  // New Bank Modal / Form
  const [bankForm, setBankForm] = useState({ name: '', initialBalance: '', color: '#38bdf8' });
  const [showBankModal, setShowBankModal] = useState(false);

  // New Category Form
  const [catForm, setCatForm] = useState({ name: '', type: 'EXPENSE', color: '#f43f5e' });
  const [showCatModal, setShowCatModal] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/banks').then((r) => r.json()),
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/audit-logs').then((r) => r.json()),
    ]).then(([bks, cats, lg]) => {
      setBanks(Array.isArray(bks) ? bks : []);
      setCategories(Array.isArray(cats) ? cats : []);
      setLogs(Array.isArray(lg) ? lg : []);
    });
  }, [refreshKey]);

  const handleCreateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/banks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bankForm),
      });
      setShowBankModal(false);
      setBankForm({ name: '', initialBalance: '', color: '#38bdf8' });
      triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(catForm),
      });
      setShowCatModal(false);
      setCatForm({ name: '', type: 'EXPENSE', color: '#f43f5e' });
      triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteBank = async (id: string) => {
    try {
      await fetch(`/api/banks/${id}`, { method: 'DELETE' });
      triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      triggerRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
          <SettingsIcon className="text-sky-400" size={26} />
          Configurações do Sistema
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Gerenciamento de bancos, cartões, categorias, métodos de pagamento e trilhas de auditoria.
        </p>
      </div>

      {/* 2. Tabs */}
      <div className="flex items-center gap-2 border-b border-navy-750 pb-2">
        <button
          onClick={() => setActiveTab('banks')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'banks'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 size={15} />
          <span>Bancos & Contas</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'categories'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Tag size={15} />
          <span>Categorias & Centros de Custo</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'logs'
              ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <History size={15} />
          <span>Logs de Auditoria</span>
        </button>
      </div>

      {/* Tab Content: Banks */}
      {activeTab === 'banks' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Bancos e Contas Cadastradas</h3>
            <button
              onClick={() => setShowBankModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 text-white font-bold text-xs"
            >
              <Plus size={14} />
              <span>+ Novo Banco</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {banks.map((bank) => (
              <div key={bank.id} className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: bank.color || '#38bdf8' }} />
                  <div>
                    <h4 className="text-sm font-bold text-white">{bank.name}</h4>
                    <p className="text-xs text-slate-400">Saldo Inicial: {formatCurrency(bank.initialBalance)}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteBank(bank.id)}
                  className="p-1.5 rounded-lg bg-navy-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Categories */}
      {activeTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Categorias Financeiras</h3>
            <button
              onClick={() => setShowCatModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 text-white font-bold text-xs"
            >
              <Plus size={14} />
              <span>+ Nova Categoria</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div key={cat.id} className="p-4 rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: cat.color || '#38bdf8' }} />
                  <div>
                    <h4 className="text-sm font-bold text-white">{cat.name}</h4>
                    <span className="text-[10px] text-slate-400 uppercase">{cat.type}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteCategory(cat.id)}
                  className="p-1.5 rounded-lg bg-navy-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Content: Logs */}
      {activeTab === 'logs' && (
        <div className="rounded-2xl bg-navy-900 border border-navy-750/80 shadow-card overflow-hidden">
          <div className="p-4 border-b border-navy-750">
            <h3 className="text-sm font-bold text-white">Histórico de Ações e Alterações</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-navy-950 text-slate-400 font-bold uppercase">
                  <th className="py-2.5 px-4">Data/Hora</th>
                  <th className="py-2.5 px-4">Ação</th>
                  <th className="py-2.5 px-4">Entidade</th>
                  <th className="py-2.5 px-4">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-800">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      Nenhum registro de log encontrado.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-navy-800/40">
                      <td className="py-2.5 px-4 text-slate-400">{new Date(log.createdAt).toLocaleString('pt-BR')}</td>
                      <td className="py-2.5 px-4 font-bold text-sky-400">{log.action}</td>
                      <td className="py-2.5 px-4 text-white">{log.entity}</td>
                      <td className="py-2.5 px-4 text-slate-300 truncate max-w-sm">{log.details || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bank Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Novo Banco / Origem</h3>
            <form onSubmit={handleCreateBank} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome do Banco</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Nubank, Itaú, Inter..."
                  value={bankForm.name}
                  onChange={(e) => setBankForm({ ...bankForm, name: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Saldo Inicial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0,00"
                  value={bankForm.initialBalance}
                  onChange={(e) => setBankForm({ ...bankForm, initialBalance: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Cor Identificadora</label>
                <input
                  type="color"
                  value={bankForm.color}
                  onChange={(e) => setBankForm({ ...bankForm, color: e.target.value })}
                  className="w-full h-10 bg-navy-800 border border-navy-700 rounded-xl p-1 outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-750">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2 rounded-xl bg-navy-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold shadow-lg"
                >
                  Salvar Banco
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Nova Categoria</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome da Categoria</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Alimentação, Moradia, Transporte..."
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Tipo</label>
                <select
                  value={catForm.type}
                  onChange={(e) => setCatForm({ ...catForm, type: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-sky-500"
                >
                  <option value="EXPENSE">Despesa (Saída)</option>
                  <option value="INCOME">Receita (Entrada)</option>
                  <option value="INVESTMENT">Investimento</option>
                  <option value="DEBT">Dívida</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Cor</label>
                <input
                  type="color"
                  value={catForm.color}
                  onChange={(e) => setCatForm({ ...catForm, color: e.target.value })}
                  className="w-full h-10 bg-navy-800 border border-navy-700 rounded-xl p-1 outline-none cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-750">
                <button
                  type="button"
                  onClick={() => setShowCatModal(false)}
                  className="px-4 py-2 rounded-xl bg-navy-800 text-slate-300 text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-sky-500 text-white text-xs font-bold shadow-lg"
                >
                  Salvar Categoria
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
