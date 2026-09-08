'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { MONTHS, MonthName } from '@/types';

interface FinancialContextType {
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  refreshKey: number;
  triggerRefresh: () => void;
  quickActionModal: {
    isOpen: boolean;
    type: 'income' | 'expense' | 'purchase' | 'investment' | 'debt' | 'goal' | null;
    initialData?: any;
  };
  openQuickAction: (type: 'income' | 'expense' | 'purchase' | 'investment' | 'debt' | 'goal', initialData?: any) => void;
  closeQuickAction: () => void;
  unreadNotificationsCount: number;
  setUnreadNotificationsCount: React.Dispatch<React.SetStateAction<number>>;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function FinancialProvider({ children }: { children: React.ReactNode }) {
  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedMonth, setSelectedMonth] = useState<string>('Setembro');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(3);

  const [quickActionModal, setQuickActionModal] = useState<{
    isOpen: boolean;
    type: 'income' | 'expense' | 'purchase' | 'investment' | 'debt' | 'goal' | null;
    initialData?: any;
  }>({
    isOpen: false,
    type: null,
  });

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const openQuickAction = (type: 'income' | 'expense' | 'purchase' | 'investment' | 'debt' | 'goal', initialData?: any) => {
    setQuickActionModal({ isOpen: true, type, initialData });
  };

  const closeQuickAction = () => {
    setQuickActionModal({ isOpen: false, type: null, initialData: undefined });
  };

  return (
    <FinancialContext.Provider
      value={{
        selectedYear,
        setSelectedYear,
        selectedMonth,
        setSelectedMonth,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        refreshKey,
        triggerRefresh,
        quickActionModal,
        openQuickAction,
        closeQuickAction,
        unreadNotificationsCount,
        setUnreadNotificationsCount,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
}

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (!context) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
}
