import { PortalMessage } from '@/types';

// Messages start empty
export const MESSAGES: PortalMessage[] = [];

// Staff recipients for messaging (kept as static reference)
export const STAFF_RECIPIENTS = [
  { id: 'rep-1', name: 'Emre KARGI', role: 'Satış & Pazarlama Müdürü' },
  { id: 'rep-2', name: 'Şevki GÜRDAL', role: 'Mali İşler & Finans Müdürü' },
  { id: 'rep-3', name: 'Halis TOSUN', role: 'Lojistik & Depo Amiri' },
  { id: 'rep-4', name: 'Emin KARGI', role: 'Genel Müdür' }
];
