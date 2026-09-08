import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { MONTHS, MonthName } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return 'R$ 0,00';
  }
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return '0,0%';
  }
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function parseDateInput(dateString: string): Date {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split('-').map(Number);
  if (year && month && day) {
    return new Date(year, month - 1, day, 12, 0, 0);
  }
  return new Date(dateString);
}

export function getMonthNameFromDate(date: Date): MonthName {
  const monthIdx = date.getMonth();
  return MONTHS[monthIdx];
}

export function getMonthIndex(monthName: string): number {
  const idx = MONTHS.findIndex(
    (m) => m.toLowerCase() === monthName.toLowerCase().trim()
  );
  return idx >= 0 ? idx : 0;
}

export function getNextMonth(monthName: string, year: number, offset: number = 1): { month: MonthName; year: number } {
  const currentIdx = getMonthIndex(monthName);
  const totalMonths = currentIdx + offset;
  const newYear = year + Math.floor(totalMonths / 12);
  const newMonthIdx = ((totalMonths % 12) + 12) % 12;
  return {
    month: MONTHS[newMonthIdx],
    year: newYear,
  };
}

export interface GeneratedInstallment {
  installmentNumber: number;
  totalInstallments: number;
  amount: number;
  invoiceMonth: MonthName;
  invoiceYear: number;
  dueDate: Date;
}

export function splitInstallments(
  totalAmount: number,
  totalInstallments: number,
  startMonth: MonthName,
  startYear: number,
  dueDay: number = 10
): GeneratedInstallment[] {
  const installmentsCount = Math.max(1, Math.floor(totalInstallments));
  const rawBase = Math.floor((totalAmount / installmentsCount) * 100) / 100;
  let remaining = Math.round((totalAmount - rawBase * installmentsCount) * 100) / 100;

  const result: GeneratedInstallment[] = [];

  for (let i = 1; i <= installmentsCount; i++) {
    const { month, year } = getNextMonth(startMonth, startYear, i - 1);
    const monthIdx = getMonthIndex(month);
    
    // Adjust penny difference on the first installment
    let installmentAmt = rawBase;
    if (i === 1 && remaining !== 0) {
      installmentAmt = Math.round((installmentAmt + remaining) * 100) / 100;
    }

    const safeDay = Math.min(dueDay, 28);
    const dueDate = new Date(year, monthIdx, safeDay, 12, 0, 0);

    result.push({
      installmentNumber: i,
      totalInstallments: installmentsCount,
      amount: installmentAmt,
      invoiceMonth: month,
      invoiceYear: year,
      dueDate,
    });
  }

  return result;
}
