'use client';

import React, { useState } from 'react';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Info,
  RefreshCw,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useFinancial } from '@/context/FinancialContext';
import { formatCurrency } from '@/lib/utils';

export default function ImportacaoPage() {
  const { triggerRefresh } = useFinancial();
  const [file, setFile] = useState<File | null>(null);
  const [importType, setImportType] = useState<'incomes' | 'expenses'>('expenses');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<{ success?: boolean; message?: string } | null>(null);

  // Column Mappings
  const [fieldMap, setFieldMap] = useState<Record<string, string>>({
    date: '',
    description: '',
    amount: '',
    categoryName: '',
    bankName: '',
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setImportStatus(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length > 0) {
          const headerRow = (data[0] as string[]).map((h) => String(h || '').trim());
          setColumns(headerRow);

          // Build json rows
          const rows = data.slice(1, 10).map((row) => {
            const rowObj: any = {};
            headerRow.forEach((col, idx) => {
              rowObj[col] = row[idx];
            });
            return rowObj;
          });
          setPreviewData(rows);

          // Auto-guess mapping
          const newMap: Record<string, string> = { date: '', description: '', amount: '', categoryName: '', bankName: '' };
          headerRow.forEach((col) => {
            const lower = col.toLowerCase();
            if (lower.includes('data') || lower.includes('date')) newMap.date = col;
            if (lower.includes('desc') || lower.includes('nome') || lower.includes('título')) newMap.description = col;
            if (lower.includes('valor') || lower.includes('amount') || lower.includes('preço')) newMap.amount = col;
            if (lower.includes('cat') || lower.includes('tipo')) newMap.categoryName = col;
            if (lower.includes('banco') || lower.includes('conta') || lower.includes('origem')) newMap.bankName = col;
          });
          setFieldMap(newMap);
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsBinaryString(uploadedFile);
  };

  const handleExecuteImport = async () => {
    if (!file) return;
    setLoading(true);
    setImportStatus(null);

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawJson: any[] = XLSX.utils.sheet_to_json(ws);

        const mappedRows = rawJson.map((row) => {
          let parsedAmount = 0;
          const rawVal = row[fieldMap.amount];
          if (typeof rawVal === 'number') parsedAmount = Math.abs(rawVal);
          else if (typeof rawVal === 'string') {
            const cleaned = rawVal.replace('R$', '').replace(/\./g, '').replace(',', '.').trim();
            parsedAmount = Math.abs(parseFloat(cleaned) || 0);
          }

          let parsedDate = new Date().toISOString();
          const rawDate = row[fieldMap.date];
          if (rawDate) {
            const d = new Date(rawDate);
            if (!isNaN(d.getTime())) parsedDate = d.toISOString();
          }

          return {
            date: parsedDate,
            month: 'Setembro',
            year: 2026,
            description: String(row[fieldMap.description] || 'Item importado'),
            amount: parsedAmount,
            categoryName: String(row[fieldMap.categoryName] || 'Geral'),
            bankName: String(row[fieldMap.bankName] || 'Nubank'),
            type: importType === 'incomes' ? 'Salário' : 'Despesa',
            status: importType === 'incomes' ? 'Recebido' : 'Pago',
            paymentMethod: 'Pix',
          };
        });

        const res = await fetch('/api/import-export', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: importType,
            data: mappedRows,
          }),
        });

        if (res.ok) {
          const result = await res.json();
          setImportStatus({
            success: true,
            message: `Sucesso! ${result.importedCount} registros foram importados para o banco de dados.`,
          });
          triggerRefresh();
        } else {
          setImportStatus({
            success: false,
            message: 'Falha ao processar arquivo. Verifique o mapeamento das colunas.',
          });
        }
        setLoading(false);
      };
      reader.readAsBinaryString(file);
    } catch (e: any) {
      setImportStatus({ success: false, message: e.message || 'Erro inesperado' });
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Upload className="text-sky-400" size={26} />
            Importação Inteligente de Planilhas
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Faça upload de arquivos XLSX ou CSV de bancos, extratos ou planilhas antigas para o sistema.
          </p>
        </div>
      </div>

      {/* 2. Upload Box */}
      <div className="rounded-3xl bg-navy-900 border border-navy-750/80 p-8 shadow-card text-center relative">
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          className="absolute inset-0 opacity-0 cursor-pointer z-10"
        />
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <FileSpreadsheet size={32} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {file ? file.name : 'Arraste ou selecione sua planilha (XLSX, CSV)'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Compatível com arquivos exportados do Nubank, Itaú, Inter, Bradesco e Excel.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Settings & Column Mapping */}
      {file && (
        <div className="rounded-2xl bg-navy-900 border border-navy-750/80 p-6 shadow-card space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-navy-800">
            <div>
              <h3 className="text-sm font-bold text-white">Configurações de Importação</h3>
              <p className="text-xs text-slate-400">Selecione o destino e faça o de-para dos campos</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setImportType('expenses')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  importType === 'expenses'
                    ? 'bg-rose-500 text-white shadow-lg'
                    : 'bg-navy-800 text-slate-400'
                }`}
              >
                Importar como Despesas
              </button>
              <button
                onClick={() => setImportType('incomes')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  importType === 'incomes'
                    ? 'bg-emerald-500 text-slate-950 shadow-lg'
                    : 'bg-navy-800 text-slate-400'
                }`}
              >
                Importar como Receitas
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Coluna de Data</label>
              <select
                value={fieldMap.date}
                onChange={(e) => setFieldMap({ ...fieldMap, date: e.target.value })}
                className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2 outline-none"
              >
                <option value="">Selecione...</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Coluna de Descrição</label>
              <select
                value={fieldMap.description}
                onChange={(e) => setFieldMap({ ...fieldMap, description: e.target.value })}
                className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2 outline-none"
              >
                <option value="">Selecione...</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Coluna de Valor (R$)</label>
              <select
                value={fieldMap.amount}
                onChange={(e) => setFieldMap({ ...fieldMap, amount: e.target.value })}
                className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2 outline-none"
              >
                <option value="">Selecione...</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Coluna de Categoria</label>
              <select
                value={fieldMap.categoryName}
                onChange={(e) => setFieldMap({ ...fieldMap, categoryName: e.target.value })}
                className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2 outline-none"
              >
                <option value="">(Opcional)</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Coluna de Banco</label>
              <select
                value={fieldMap.bankName}
                onChange={(e) => setFieldMap({ ...fieldMap, bankName: e.target.value })}
                className="w-full bg-navy-800 border border-navy-700 text-white text-xs rounded-xl px-3 py-2 outline-none"
              >
                <option value="">(Opcional)</option>
                {columns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table Preview */}
          {previewData.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-navy-800">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-navy-950 text-slate-400 font-bold uppercase">
                    {columns.map((c) => (
                      <th key={c} className="py-2.5 px-3">
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-800">
                  {previewData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-navy-800/40">
                      {columns.map((c) => (
                        <td key={c} className="py-2 px-3 text-slate-300 truncate max-w-xs">
                          {String(row[c] || '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {importStatus && (
            <div
              className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                importStatus.success
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {importStatus.success ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
              <span>{importStatus.message}</span>
            </div>
          )}

          <div className="flex items-center justify-end pt-2">
            <button
              onClick={handleExecuteImport}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-lg shadow-sky-500/20 transition-all"
            >
              <Sparkles size={16} />
              <span>{loading ? 'Processando...' : 'Confirmar Importação'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
