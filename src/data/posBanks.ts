import { PosBank } from '@/types';

export const POS_BANKS: PosBank[] = [
  {
    id: 'garanti-bonus',
    name: 'Garanti BBVA - Bonus',
    cardBrand: 'Bonus',
    logo: '🟢',
    installments: [
      { installment: 1, rate: 0.00, monthlyAmount: 0, totalAmount: 0 },
      { installment: 2, rate: 0.029, monthlyAmount: 0, totalAmount: 0 },
      { installment: 3, rate: 0.045, monthlyAmount: 0, totalAmount: 0 },
      { installment: 6, rate: 0.089, monthlyAmount: 0, totalAmount: 0 },
      { installment: 9, rate: 0.129, monthlyAmount: 0, totalAmount: 0 },
      { installment: 12, rate: 0.165, monthlyAmount: 0, totalAmount: 0 }
    ]
  },
  {
    id: 'yapi-kredi-world',
    name: 'Yapı Kredi - World',
    cardBrand: 'World',
    logo: '🟣',
    installments: [
      { installment: 1, rate: 0.00, monthlyAmount: 0, totalAmount: 0 },
      { installment: 3, rate: 0.042, monthlyAmount: 0, totalAmount: 0 },
      { installment: 6, rate: 0.085, monthlyAmount: 0, totalAmount: 0 },
      { installment: 9, rate: 0.125, monthlyAmount: 0, totalAmount: 0 },
      { installment: 12, rate: 0.160, monthlyAmount: 0, totalAmount: 0 }
    ]
  },
  {
    id: 'is-bankasi-maximum',
    name: 'İş Bankası - Maximum',
    cardBrand: 'Maximum',
    logo: '🔵',
    installments: [
      { installment: 1, rate: 0.00, monthlyAmount: 0, totalAmount: 0 },
      { installment: 2, rate: 0.028, monthlyAmount: 0, totalAmount: 0 },
      { installment: 3, rate: 0.043, monthlyAmount: 0, totalAmount: 0 },
      { installment: 6, rate: 0.087, monthlyAmount: 0, totalAmount: 0 },
      { installment: 9, rate: 0.128, monthlyAmount: 0, totalAmount: 0 },
      { installment: 12, rate: 0.164, monthlyAmount: 0, totalAmount: 0 }
    ]
  },
  {
    id: 'akbank-axess',
    name: 'Akbank - Axess',
    cardBrand: 'Axess',
    logo: '🔴',
    installments: [
      { installment: 1, rate: 0.00, monthlyAmount: 0, totalAmount: 0 },
      { installment: 3, rate: 0.044, monthlyAmount: 0, totalAmount: 0 },
      { installment: 6, rate: 0.088, monthlyAmount: 0, totalAmount: 0 },
      { installment: 9, rate: 0.129, monthlyAmount: 0, totalAmount: 0 },
      { installment: 12, rate: 0.168, monthlyAmount: 0, totalAmount: 0 }
    ]
  },
  {
    id: 'halkbank-paraf',
    name: 'Halkbank - Paraf',
    cardBrand: 'Paraf',
    logo: '🟡',
    installments: [
      { installment: 1, rate: 0.00, monthlyAmount: 0, totalAmount: 0 },
      { installment: 3, rate: 0.039, monthlyAmount: 0, totalAmount: 0 },
      { installment: 6, rate: 0.079, monthlyAmount: 0, totalAmount: 0 },
      { installment: 9, rate: 0.119, monthlyAmount: 0, totalAmount: 0 },
      { installment: 12, rate: 0.155, monthlyAmount: 0, totalAmount: 0 }
    ]
  },
  {
    id: 'ziraat-bankkart',
    name: 'Ziraat Bankası - Bankkart',
    cardBrand: 'Bankkart',
    logo: '🏛️',
    installments: [
      { installment: 1, rate: 0.00, monthlyAmount: 0, totalAmount: 0 },
      { installment: 3, rate: 0.038, monthlyAmount: 0, totalAmount: 0 },
      { installment: 6, rate: 0.078, monthlyAmount: 0, totalAmount: 0 },
      { installment: 9, rate: 0.115, monthlyAmount: 0, totalAmount: 0 },
      { installment: 12, rate: 0.150, monthlyAmount: 0, totalAmount: 0 }
    ]
  },
  {
    id: 'qnb-cardfinans',
    name: 'QNB Finansbank - CardFinans',
    cardBrand: 'CardFinans',
    logo: '🔷',
    installments: [
      { installment: 1, rate: 0.00, monthlyAmount: 0, totalAmount: 0 },
      { installment: 3, rate: 0.046, monthlyAmount: 0, totalAmount: 0 },
      { installment: 6, rate: 0.090, monthlyAmount: 0, totalAmount: 0 },
      { installment: 9, rate: 0.130, monthlyAmount: 0, totalAmount: 0 },
      { installment: 12, rate: 0.169, monthlyAmount: 0, totalAmount: 0 }
    ]
  }
];

export function calculateInstallmentsForAmount(amount: number) {
  return POS_BANKS.map(bank => {
    return {
      ...bank,
      installments: bank.installments.map(inst => {
        const total = amount * (1 + inst.rate);
        const monthly = total / inst.installment;
        return {
          ...inst,
          monthlyAmount: monthly,
          totalAmount: total
        };
      })
    };
  });
}
