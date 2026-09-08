'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  TrendingUp,
  TrendingDown,
  CreditCard,
  CalendarCheck2,
  AlertTriangle,
  LineChart,
  Target,
  PieChart,
  ArrowRightLeft,
  FileText,
  Upload,
  Settings,
  Menu,
  X,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Receitas', href: '/rendas', icon: TrendingUp },
  { name: 'Despesas', href: '/despesas', icon: TrendingDown },
  { name: 'Cartões', href: '/cartoes', icon: CreditCard },
  { name: 'Contas Fixas', href: '/contas-fixas', icon: CalendarCheck2 },
  { name: 'Dívidas', href: '/dividas', icon: AlertTriangle },
  { name: 'Investimentos', href: '/investimentos', icon: LineChart },
  { name: 'Patrimônio & Bens', href: '/patrimonio', icon: Sparkles },
  { name: 'Metas', href: '/metas', icon: Target },
  { name: 'Orçamento', href: '/orcamento', icon: PieChart },
  { name: 'Fluxo de Caixa', href: '/fluxo-caixa', icon: ArrowRightLeft },
  { name: 'Relatórios', href: '/relatorios', icon: FileText },
  { name: 'Importação', href: '/importacao', icon: Upload },
  { name: 'Configurações', href: '/configuracoes', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-3 left-4 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-navy-850 border border-navy-750 text-slate-200 hover:text-white"
          aria-label="Toggle Menu"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed top-0 left-0 bottom-0 z-40 w-64 bg-navy-900 border-r border-navy-750/60 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand / Logo */}
        <div className="h-16 flex items-center px-6 border-b border-navy-750/60 gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center shadow-glow">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white flex items-center gap-1.5">
              Finanças <span className="text-xs px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-medium">PRO</span>
            </h1>
            <p className="text-[11px] text-slate-400">Controle Inteligente</p>
          </div>
        </div>

        {/* Navigation links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  'flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all group',
                  isActive
                    ? 'bg-gradient-to-r from-sky-500/20 to-indigo-500/10 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-navy-800/80 border border-transparent'
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      'w-4 h-4 transition-transform group-hover:scale-110',
                      isActive ? 'text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                    )}
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight size={14} className="text-sky-400" />}
              </Link>
            );
          })}
        </div>

        {/* Footer / Status */}
        <div className="p-4 border-t border-navy-750/60 bg-navy-950/40">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div className="text-xs">
              <p className="text-slate-300 font-medium">Banco Conectado</p>
              <p className="text-[10px] text-slate-500">Prisma SQLite & API Sync</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
