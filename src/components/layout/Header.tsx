'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Plus,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  X,
} from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { cn } from '@/lib/utils';

export function Header() {
  const {
    openQuickAction,
    triggerRefresh,
    selectedYear,
    selectedMonth,
  } = useFinancial();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.isRead).length);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-navy-900/90 backdrop-blur-md border-b border-navy-750/60 px-4 sm:px-8 flex items-center justify-between">
      {/* Current View Indicator */}
      <div className="flex items-center gap-3 pl-10 lg:pl-0">
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-850 border border-navy-750 text-xs text-slate-300">
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          <span>Filtro Ativo:</span>
          <span className="font-semibold text-white">{selectedMonth} / {selectedYear}</span>
        </div>
      </div>

      {/* Action buttons and notifications */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Quick Add Dropdown or Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => openQuickAction('income')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 text-xs font-semibold transition-all shadow-sm"
          >
            <Plus size={14} />
            <span>Receita</span>
          </button>
          <button
            onClick={() => openQuickAction('expense')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-400 hover:bg-rose-500/25 border border-rose-500/30 text-xs font-semibold transition-all shadow-sm"
          >
            <Plus size={14} />
            <span>Despesa</span>
          </button>
          <button
            onClick={() => openQuickAction('purchase')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 border border-purple-500/30 text-xs font-semibold transition-all shadow-sm"
          >
            <Plus size={14} />
            <span>Compra Cartão</span>
          </button>
        </div>

        {/* Mobile Quick Action button */}
        <div className="md:hidden">
          <button
            onClick={() => openQuickAction('expense')}
            className="p-2 rounded-lg bg-sky-500 text-white font-bold shadow-glow text-xs flex items-center gap-1"
          >
            <Plus size={16} />
          </button>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => triggerRefresh()}
          title="Atualizar Dados"
          className="p-2 rounded-lg bg-navy-850 hover:bg-navy-800 border border-navy-750 text-slate-300 hover:text-white transition-colors"
        >
          <RefreshCw size={17} />
        </button>

        {/* Notifications Icon & Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg bg-navy-850 hover:bg-navy-800 border border-navy-750 text-slate-300 hover:text-white relative transition-colors"
            aria-label="Notificações"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-navy-900 border border-navy-750 shadow-2xl z-50 overflow-hidden">
              <div className="p-3.5 border-b border-navy-750/80 flex items-center justify-between bg-navy-950/60">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-sky-400" />
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">Alertas & Notificações</h3>
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-sky-400 hover:underline"
                    >
                      Ler todas
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-navy-750/40 p-1">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    Nenhuma notificação no momento.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'p-3 transition-colors rounded-xl flex items-start gap-3 my-1',
                        n.isRead ? 'opacity-60 bg-transparent' : 'bg-navy-800/60'
                      )}
                    >
                      <div className="mt-0.5">
                        {n.type === 'alert' && <AlertTriangle size={16} className="text-rose-400" />}
                        {n.type === 'warning' && <AlertTriangle size={16} className="text-amber-400" />}
                        {n.type === 'success' && <CheckCircle2 size={16} className="text-emerald-400" />}
                        {n.type === 'info' && <Info size={16} className="text-sky-400" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-xs font-semibold text-white">{n.title}</h4>
                        <p className="text-[11px] text-slate-300 mt-0.5">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-navy-750">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-400 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shadow-sm">
            CF
          </div>
          <div className="hidden lg:block text-left">
            <p className="text-xs font-medium text-white leading-tight">Usuário Demo</p>
            <p className="text-[10px] text-slate-400 leading-tight">Admin</p>
          </div>
        </div>
      </div>
    </header>
  );
}
