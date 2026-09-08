'use client';

import React from 'react';
import { Filter, Calendar, Sparkles } from 'lucide-react';
import { useFinancial } from '@/context/FinancialContext';
import { MONTHS } from '@/types';

const YEARS = ['TODOS', '2024', '2025', '2026', '2027', '2028', '2029', '2030'];

export function FilterBar() {
  const {
    selectedYear,
    setSelectedYear,
    selectedMonth,
    setSelectedMonth,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  } = useFinancial();

  const isCustomActive = startDate && endDate;

  return (
    <div className="rounded-2xl bg-navy-850/80 border border-navy-750 p-4 sm:p-5 mb-6 backdrop-blur-md shadow-card">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          {/* ANO */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Ano:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-navy-900 border border-navy-700 text-sky-400 text-xs font-semibold rounded-xl px-3 py-2 outline-none hover:border-sky-500 focus:border-sky-400 cursor-pointer transition-colors"
            >
              {YEARS.map((y) => (
                <option key={y} value={y} className="bg-navy-900 text-white">
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* MÊS */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Mês:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-navy-900 border border-navy-700 text-sky-400 text-xs font-semibold rounded-xl px-3 py-2 outline-none hover:border-sky-500 focus:border-sky-400 cursor-pointer transition-colors"
            >
              <option value="TODOS" className="bg-navy-900 text-white">
                TODOS OS MESES
              </option>
              {MONTHS.map((m) => (
                <option key={m} value={m} className="bg-navy-900 text-white">
                  {m}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Date Range */}
          <div className="hidden sm:flex items-center gap-2 border-l border-navy-750 pl-4">
            <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">Intervalo:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-navy-900 border border-navy-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 outline-none hover:border-sky-500"
            />
            <span className="text-slate-500 text-xs">até</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-navy-900 border border-navy-700 text-slate-200 text-xs rounded-xl px-2.5 py-1.5 outline-none hover:border-sky-500"
            />
          </div>
        </div>

        {/* Dynamic Period Banner */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs">
          <Sparkles size={14} className="text-sky-400 animate-pulse" />
          <span>
            {isCustomActive
              ? `Período personalizado: ${startDate} a ${endDate}`
              : `Visão: ${selectedMonth === 'TODOS' ? 'Ano Completo' : `Mês de ${selectedMonth}`} (${selectedYear === 'TODOS' ? 'Todos os Anos' : selectedYear})`}
          </span>
        </div>
      </div>
    </div>
  );
}
