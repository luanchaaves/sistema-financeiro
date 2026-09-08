'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Building2,
  Car,
  Laptop,
  Smartphone,
  Tv,
  Watch,
  Box,
  Plus,
  Edit2,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  LineChart,
  ShieldCheck,
  AlertTriangle,
  FileSpreadsheet,
  X,
  Search,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Layers,
  Calendar,
  Tag,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import { exportToExcel } from '@/lib/export-helpers';
import { Asset } from '@/types';

const CATEGORIES = [
  { id: 'TODOS', label: 'Todos os Bens', icon: Layers },
  { id: 'Veículo', label: 'Veículos 🏍️🚗', icon: Car, type: 'VEICULO' },
  { id: 'Imóvel', label: 'Imóveis 🏠', icon: Building2, type: 'IMOVEL' },
  { id: 'Eletrônico', label: 'Eletrônicos & Setup 💻📱', icon: Laptop, type: 'ELETRONICO' },
  { id: 'Equipamento', label: 'Equipamentos ⚙️', icon: Box, type: 'EQUIPAMENTO' },
  { id: 'Outro', label: 'Outros Bens 📦', icon: Box, type: 'OUTRO' },
];

const ICON_OPTIONS = [
  { id: 'Car', label: 'Veículo / Carro', icon: Car },
  { id: 'Building', label: 'Imóvel / Casa', icon: Building2 },
  { id: 'Laptop', label: 'Notebook / PC', icon: Laptop },
  { id: 'Smartphone', label: 'Celular / Tablet', icon: Smartphone },
  { id: 'Tv', label: 'TV / Monitor', icon: Tv },
  { id: 'Watch', label: 'Relógio / Joia', icon: Watch },
  { id: 'Box', label: 'Geral / Outro', icon: Box },
];

const COLOR_OPTIONS = [
  { label: 'Esmeralda / Verde', value: '#10b981' },
  { label: 'Azul Céu', value: '#38bdf8' },
  { label: 'Roxo Modern', value: '#a855f7' },
  { label: 'Laranja Flame', value: '#f97316' },
  { label: 'Rosa Pink', value: '#ec4899' },
  { label: 'Ambar Ouro', value: '#f59e0b' },
  { label: 'Preto Titanium', value: '#1e293b' },
];

export default function PatrimonioPage() {
  const { refreshKey, triggerRefresh } = useFinancial();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [summaryData, setSummaryData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals state
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Asset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Veículo',
    type: 'VEICULO',
    estimatedValue: '',
    purchaseValue: '',
    purchaseDate: '',
    brand: '',
    modelYear: '',
    color: '#10b981',
    icon: 'Car',
    notes: '',
  });

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [assetsRes, summaryRes] = await Promise.all([
          fetch('/api/assets'),
          fetch('/api/summary'),
        ]);

        if (assetsRes.ok) {
          const data = await assetsRes.json();
          setAssets(data.items || []);
        }
        if (summaryRes.ok) {
          const data = await summaryRes.json();
          setSummaryData(data);
        }
      } catch (err) {
        console.error('Failed to load asset data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [refreshKey]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingAsset(null);
    setFormData({
      name: '',
      category: 'Veículo',
      type: 'VEICULO',
      estimatedValue: '',
      purchaseValue: '',
      purchaseDate: new Date().toISOString().split('T')[0],
      brand: '',
      modelYear: new Date().getFullYear().toString(),
      color: '#10b981',
      icon: 'Car',
      notes: '',
    });
    setShowAssetModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      category: asset.category,
      type: asset.type,
      estimatedValue: asset.estimatedValue.toString(),
      purchaseValue: asset.purchaseValue ? asset.purchaseValue.toString() : '',
      purchaseDate: asset.purchaseDate ? new Date(asset.purchaseDate).toISOString().split('T')[0] : '',
      brand: asset.brand || '',
      modelYear: asset.modelYear ? asset.modelYear.toString() : '',
      color: asset.color || '#38bdf8',
      icon: asset.icon || 'Box',
      notes: asset.notes || '',
    });
    setShowAssetModal(true);
  };

  // Save Asset (POST or PUT)
  const handleSaveAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isEditing = Boolean(editingAsset);
      const url = isEditing ? `/api/assets/${editingAsset!.id}` : '/api/assets';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowAssetModal(false);
        setEditingAsset(null);
        triggerRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Delete Asset
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await fetch(`/api/assets/${deleteTarget.id}`, { method: 'DELETE' });
      triggerRefresh();
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Assets
  const filteredAssets = useMemo(() => {
    return assets.filter((item) => {
      const matchesCat = selectedCategory === 'TODOS' || item.category === selectedCategory;
      const matchesSearch =
        !searchQuery ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCat && matchesSearch;
    });
  }, [assets, selectedCategory, searchQuery]);

  // Totals
  const totalPhysicalAssets = assets.reduce((sum, a) => sum + (a.estimatedValue || 0), 0);
  const totalPurchaseValue = assets.reduce((sum, a) => sum + (a.purchaseValue || 0), 0);
  const totalBankBalance = summaryData?.netWorth?.bankBalances || 0;
  const totalInvestments = summaryData?.netWorth?.investments || 0;
  const totalDebts = summaryData?.netWorth?.debts || 0;
  const totalOpenInvoices = summaryData?.netWorth?.openCreditCardInvoices || 0;

  const grandTotalAssets = totalPhysicalAssets + totalBankBalance + totalInvestments;
  const grandTotalLiabilities = totalDebts + totalOpenInvoices;
  const realNetWorth = grandTotalAssets - grandTotalLiabilities;

  const solvencyRatio = grandTotalLiabilities > 0 ? (grandTotalAssets / grandTotalLiabilities).toFixed(1) : '∞';

  // Export Excel
  const handleExport = () => {
    exportToExcel('meu_patrimonio_e_bens', [
      {
        sheetName: 'Bens e Ativos',
        data: assets.map((a) => ({
          Nome: a.name,
          Categoria: a.category,
          Marca: a.brand || '',
          Ano: a.modelYear || '',
          ValorMercadoAtual: a.estimatedValue,
          ValorCompra: a.purchaseValue || '',
          DataAquisicao: a.purchaseDate ? formatDate(a.purchaseDate) : '',
          Observacoes: a.notes || '',
        })),
      },
      {
        sheetName: 'Balanço Geral',
        data: [
          { Descrição: 'Total em Bens Físicos', Valor: totalPhysicalAssets },
          { Descrição: 'Total em Investimentos', Valor: totalInvestments },
          { Descrição: 'Saldos em Contas Bancárias', Valor: totalBankBalance },
          { Descrição: 'Ativos Totais (O que você tem)', Valor: grandTotalAssets },
          { Descrição: 'Dívidas e Financiamentos', Valor: totalDebts },
          { Descrição: 'Faturas de Cartão em Aberto', Valor: totalOpenInvoices },
          { Descrição: 'Passivos Totais (O que você deve)', Valor: grandTotalLiabilities },
          { Descrição: 'Patrimônio Líquido Real', Valor: realNetWorth },
        ],
      },
    ]);
  };

  const renderIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Car':
        return <Car size={20} />;
      case 'Building':
        return <Building2 size={20} />;
      case 'Laptop':
        return <Laptop size={20} />;
      case 'Smartphone':
        return <Smartphone size={20} />;
      case 'Tv':
        return <Tv size={20} />;
      case 'Watch':
        return <Watch size={20} />;
      default:
        return <Box size={20} />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="text-emerald-400" size={26} />
            Patrimônio, Bens & Riqueza Líquida
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestão dos seus bens materiais (veículos, imóveis, tecnologia e equipamentos) e cálculo consolidado do patrimônio líquido real.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="p-2.5 rounded-xl bg-navy-850 hover:bg-navy-800 border border-navy-750 text-slate-300 hover:text-white transition-colors"
            title="Exportar Patrimônio para Excel"
          >
            <FileSpreadsheet size={16} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Plus size={16} />
            <span>+ Cadastrar Novo Bem</span>
          </button>
        </div>
      </div>

      {/* 2. Top Executive Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Patrimônio Líquido */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-navy-900 via-indigo-950/40 to-navy-900 border border-emerald-500/40 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Patrimônio Líquido Real
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
              {solvencyRatio}x Solvência
            </span>
          </div>
          <div className="my-3">
            <h2 className={`text-2xl font-black tracking-tight ${realNetWorth >= 0 ? 'text-white' : 'text-rose-400'}`}>
              {formatCurrency(realNetWorth)}
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Ativos Totais ({formatCurrency(grandTotalAssets)}) - Passivos ({formatCurrency(grandTotalLiabilities)})
            </p>
          </div>
          <div className="pt-2 border-t border-navy-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Riqueza Construída</span>
            <span className="text-emerald-400 font-bold">100% Atualizado</span>
          </div>
        </div>

        {/* Card 2: Bens Físicos & Materiais */}
        <div className="p-5 rounded-2xl bg-navy-900 border border-navy-750 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Bens & Veículos Físicos
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Car size={15} />
            </div>
          </div>
          <div className="my-3">
            <h2 className="text-2xl font-black text-emerald-400 tracking-tight">
              {formatCurrency(totalPhysicalAssets)}
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {assets.length} bens cadastrados (veículos, imóveis, eletrônicos)
            </p>
          </div>
          <div className="pt-2 border-t border-navy-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Valor de Aquisição:</span>
            <span className="text-white font-semibold">{formatCurrency(totalPurchaseValue)}</span>
          </div>
        </div>

        {/* Card 3: Investimentos & Caixa */}
        <div className="p-5 rounded-2xl bg-navy-900 border border-navy-750 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Investimentos & Caixa
            </span>
            <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <LineChart size={15} />
            </div>
          </div>
          <div className="my-3">
            <h2 className="text-2xl font-black text-sky-400 tracking-tight">
              {formatCurrency(totalBankBalance + totalInvestments)}
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Aplicações + Saldos em Contas Correntes
            </p>
          </div>
          <div className="pt-2 border-t border-navy-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Liquidez Imediata:</span>
            <span className="text-white font-semibold">{formatCurrency(totalBankBalance)}</span>
          </div>
        </div>

        {/* Card 4: Passivos Totais */}
        <div className="p-5 rounded-2xl bg-navy-900 border border-navy-750 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400">
              Passivos & Financiamentos
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="my-3">
            <h2 className="text-2xl font-black text-rose-400 tracking-tight">
              {formatCurrency(grandTotalLiabilities)}
            </h2>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Dívidas Restantes ({formatCurrency(totalDebts)}) + Cartões ({formatCurrency(totalOpenInvoices)})
            </p>
          </div>
          <div className="pt-2 border-t border-navy-800 flex items-center justify-between text-[11px] text-slate-400">
            <span>Compromissos Futuros</span>
            <span className="text-rose-300 font-semibold">{formatCurrency(totalDebts)}</span>
          </div>
        </div>
      </div>

      {/* 3. Explanation Banner for Net Worth Balance */}
      <div className="p-4 rounded-2xl bg-navy-900/90 border border-emerald-500/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Como Funciona o Balanço Patrimonial</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Seu patrimônio considera o valor de mercado atual de todos os seus bens físicos (como sua moto ou veículo), somados às suas economias e investimentos, descontando apenas o saldo devedor restante dos financiamentos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-navy-950/80 px-3 py-2 rounded-xl border border-navy-800 text-slate-300 whitespace-nowrap">
          <span className="text-emerald-400 font-bold">Ativos: {formatCurrency(grandTotalAssets)}</span>
          <span className="text-slate-500">-</span>
          <span className="text-rose-400 font-bold">Passivos: {formatCurrency(grandTotalLiabilities)}</span>
          <span className="text-slate-500">=</span>
          <span className="text-white font-extrabold">{formatCurrency(realNetWorth)}</span>
        </div>
      </div>

      {/* 4. Filter Categories & Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => {
            const IconComp = cat.icon;
            const count =
              cat.id === 'TODOS' ? assets.length : assets.filter((a) => a.category === cat.id).length;

            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all border ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md shadow-emerald-500/20'
                    : 'bg-navy-850 text-slate-400 hover:text-white border-navy-750 hover:bg-navy-800'
                }`}
              >
                <IconComp size={14} />
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    selectedCategory === cat.id ? 'bg-slate-950/20 text-slate-950' : 'bg-navy-900 text-slate-300'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input
            type="text"
            placeholder="Buscar bem por nome, marca ou placa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-navy-850 border border-navy-750 text-white text-xs rounded-xl pl-9 pr-3 py-2 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* 5. Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredAssets.length === 0 ? (
          <div className="col-span-full p-12 text-center rounded-3xl bg-navy-900 border border-navy-750 text-slate-400 space-y-3">
            <Box size={36} className="mx-auto text-slate-500" />
            <p className="text-sm font-semibold text-white">Nenhum bem encontrado nesta categoria</p>
            <p className="text-xs text-slate-400">
              Cadastre seus veículos, imóveis, computadores, celulares e equipamentos para compor seu patrimônio.
            </p>
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-md"
            >
              + Cadastrar Primeiro Bem
            </button>
          </div>
        ) : (
          filteredAssets.map((item) => {
            const hasPurchase = item.purchaseValue && item.purchaseValue > 0;
            const diff = hasPurchase ? item.estimatedValue - item.purchaseValue! : 0;
            const pct = hasPurchase ? (diff / item.purchaseValue!) * 100 : 0;

            return (
              <div
                key={item.id}
                className="relative rounded-3xl bg-navy-900 border border-navy-750/80 p-5 shadow-card hover:border-emerald-500/40 hover:scale-[1.01] transition-all flex flex-col justify-between gap-4 group"
              >
                {/* Header with Icon, Category & Actions */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: item.color || '#10b981' }}
                    >
                      {renderIcon(item.icon)}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {item.category} {item.brand ? `• ${item.brand}` : ''} {item.modelYear ? `(${item.modelYear})` : ''}
                      </span>
                      <h3 className="text-base font-black text-white leading-tight mt-0.5">{item.name}</h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      title="Editar Bem"
                      className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-750 text-slate-300 hover:text-white transition-colors border border-navy-700"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(item)}
                      title="Excluir Bem"
                      className="p-1.5 rounded-lg bg-navy-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 transition-colors border border-navy-700"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Values and Valuation Badge */}
                <div className="space-y-2">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider">Valor de Mercado Atual</span>
                      <p className="text-2xl font-black text-emerald-400">{formatCurrency(item.estimatedValue)}</p>
                    </div>

                    {hasPurchase && (
                      <div
                        className={`text-right px-2 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 ${
                          diff >= 0
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {diff >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        <span>
                          {diff >= 0 ? '+' : ''}
                          {pct.toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>

                  {hasPurchase && (
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-navy-800">
                      <span>Valor de Compra:</span>
                      <span className="text-slate-300 font-semibold">{formatCurrency(item.purchaseValue!)}</span>
                    </div>
                  )}
                </div>

                {/* Notes and Acquisition Date */}
                <div className="pt-3 border-t border-navy-800 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="truncate max-w-[200px]" title={item.notes || ''}>
                    {item.notes ? <span>{item.notes}</span> : <span>Cadastrado no patrimônio</span>}
                  </div>

                  {item.purchaseDate && (
                    <span className="whitespace-nowrap text-slate-400">
                      Adquirido em {formatDate(item.purchaseDate)}
                    </span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 6. MODAL: Create / Edit Asset */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4 border-b border-navy-750 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400" />
                {editingAsset ? `Editar Bem: ${editingAsset.name}` : 'Cadastrar Novo Bem / Ativo'}
              </h3>
              <button onClick={() => setShowAssetModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveAsset} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nome do Bem / Ativo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Kawasaki Ninja ZX-10R, Apartamento Centro, MacBook Pro M3..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Categoria *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      let type = 'OUTRO';
                      let icon = 'Box';
                      if (cat === 'Veículo') {
                        type = 'VEICULO';
                        icon = 'Car';
                      } else if (cat === 'Imóvel') {
                        type = 'IMOVEL';
                        icon = 'Building';
                      } else if (cat === 'Eletrônico') {
                        type = 'ELETRONICO';
                        icon = 'Laptop';
                      } else if (cat === 'Equipamento') {
                        type = 'EQUIPAMENTO';
                        icon = 'Box';
                      }
                      setFormData({ ...formData, category: cat, type, icon });
                    }}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
                  >
                    <option value="Veículo">Veículo (Carro / Moto)</option>
                    <option value="Imóvel">Imóvel (Casa / Apto / Terreno)</option>
                    <option value="Eletrônico">Eletrônico (PC / Celular / TV)</option>
                    <option value="Equipamento">Equipamento / Ferramentas</option>
                    <option value="Outro">Outro Bem / Coleção</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Marca / Fabricante (opcional)</label>
                  <input
                    type="text"
                    placeholder="Ex: Kawasaki, Apple, Honda, Sony..."
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor de Mercado Atual (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="85000.00"
                    value={formData.estimatedValue}
                    onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-emerald-400 text-xs font-bold rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Valor Pago / Aquisição (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="92000.00"
                    value={formData.purchaseValue}
                    onChange={(e) => setFormData({ ...formData, purchaseValue: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Data da Aquisição</label>
                  <input
                    type="date"
                    value={formData.purchaseDate}
                    onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Ano do Modelo / Fabricação</label>
                  <input
                    type="number"
                    placeholder="2024"
                    value={formData.modelYear}
                    onChange={(e) => setFormData({ ...formData, modelYear: e.target.value })}
                    className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2.5 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Observações, Placa ou Especificações</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Placa BRA-2026 • 998cc • Verde KRT • Chassi..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-2">Ícone e Cor de Destaque</label>
                <div className="flex items-center gap-2 flex-wrap">
                  {ICON_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setFormData({ ...formData, icon: opt.id })}
                      className={`p-2 rounded-xl border text-xs flex items-center gap-1.5 transition-all ${
                        formData.icon === opt.id
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500'
                          : 'bg-navy-800 text-slate-400 border-navy-700 hover:text-white'
                      }`}
                    >
                      {renderIcon(opt.id)}
                      <span>{opt.label.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-2 mt-3">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c.value}
                      onClick={() => setFormData({ ...formData, color: c.value })}
                      className={`h-7 rounded-lg transition-all border ${
                        formData.color === c.value
                          ? 'border-white scale-110 shadow-md'
                          : 'border-transparent opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.value }}
                      title={c.label}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-navy-750">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 rounded-xl bg-navy-800 text-slate-300 text-xs hover:bg-navy-750"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20"
                >
                  {editingAsset ? 'Salvar Alterações' : 'Cadastrar Bem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Excluir Bem do Patrimônio"
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? O valor de mercado deste bem será removido do cálculo do seu patrimônio líquido.`}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={isDeleting}
      />
    </div>
  );
}
