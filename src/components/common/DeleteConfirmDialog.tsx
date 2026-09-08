'use client';

import React from 'react';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface DeleteConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function DeleteConfirmDialog({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl bg-navy-900 border border-navy-750 p-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{description}</p>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 rounded text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl bg-navy-800 hover:bg-navy-750 border border-navy-700 text-xs font-semibold text-slate-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-xs font-semibold text-white shadow-lg shadow-rose-500/20 transition-all"
          >
            <Trash2 size={14} />
            <span>{isLoading ? 'Excluindo...' : 'Confirmar Exclusão'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
