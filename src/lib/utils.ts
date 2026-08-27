import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { Currency, ChequeItem, MaturityResult } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: Currency = 'TRY'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }
  
  if (currency === 'USD') {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace('USD', '$');
  }

  if (currency === 'EUR') {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount).replace('EUR', '€');
  }

  return new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount) + ' TL';
}

export function parseDate(dateStr: string): Date {
  // Supports YYYY-MM-DD or DD.MM.YYYY
  if (dateStr.includes('.')) {
    const [day, month, year] = dateStr.split('.').map(Number);
    return new Date(year, month - 1, day);
  }
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(date: Date | string): string {
  if (!date) return '';
  const d = typeof date === 'string' ? parseDate(date) : date;
  if (isNaN(d.getTime())) return String(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

export function daysBetween(date1: Date, date2: Date): number {
  const oneDay = 24 * 60 * 60 * 1000;
  const diffTime = date2.getTime() - date1.getTime();
  return Math.round(diffTime / oneDay);
}

export function calculateAverageMaturity(cheques: ChequeItem[], startDateStr: string): MaturityResult {
  if (cheques.length === 0) {
    return {
      totalAmount: 0,
      chequeCount: 0,
      averageValueDays: 0,
      averageMaturityDate: startDateStr,
      startDate: startDateStr
    };
  }

  const startDate = parseDate(startDateStr);
  let totalAmount = 0;
  let weightedDaysSum = 0;

  cheques.forEach((cheque) => {
    const chequeDate = parseDate(cheque.maturityDate);
    const diffDays = Math.max(0, daysBetween(startDate, chequeDate));
    cheque.valueDays = diffDays;
    totalAmount += cheque.amount;
    weightedDaysSum += cheque.amount * diffDays;
  });

  const averageValueDays = totalAmount > 0 ? Math.round(weightedDaysSum / totalAmount) : 0;
  const avgDate = new Date(startDate.getTime() + averageValueDays * 24 * 60 * 60 * 1000);

  return {
    totalAmount,
    chequeCount: cheques.length,
    averageValueDays,
    averageMaturityDate: formatDate(avgDate),
    startDate: startDateStr
  };
}
