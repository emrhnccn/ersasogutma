'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Product,
  CartItem,
  Order,
  CariTransaction,
  DealerProfile,
  ExchangeRates,
  Currency,
  UserNote,
  UserReminder,
  PortalMessage,
  PosSlip,
  OrderStatus
} from '@/types';
import { PRODUCTS, INITIAL_EXCHANGE_RATES } from '@/data/products';
import { ORDERS as INITIAL_ORDERS } from '@/data/orders';
import { CARI_TRANSACTIONS as INITIAL_CARI } from '@/data/cariTransactions';
import { INITIAL_DEALER_PROFILE } from '@/data/dealerProfile';
import { MESSAGES as INITIAL_MESSAGES } from '@/data/messages';
import { cn } from '@/lib/utils';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface StoreContextType {
  // Products & Currency
  products: Product[];
  currency: Currency;
  setCurrency: (c: Currency) => void;
  exchangeRates: ExchangeRates;
  updateExchangeRate: (rates: Partial<ExchangeRates>) => void;
  convertPrice: (priceTRY: number) => { amount: number; formatted: string };

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartTotals: {
    itemCount: number;
    subtotalTRY: number;
    discountTRY: number;
    vatTRY: number;
    grandTotalTRY: number;
  };
  orderNote: string;
  setOrderNote: (note: string) => void;
  accountingNote: string;
  setAccountingNote: (note: string) => void;
  completeOrder: () => Order;

  // Favorites
  favorites: string[];
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;

  // Orders
  orders: Order[];
  getOrderById: (orderNumberOrId: string) => Order | undefined;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;

  // Cari / Finance
  cariTransactions: CariTransaction[];
  cariSummary: {
    totalOrders: number;
    totalDebt: number;
    totalCredit: number;
    balance: number;
    balanceType: 'B' | 'A';
  };
  addCariTransaction: (tx: Omit<CariTransaction, 'id'>) => void;

  // Pos Slips
  posSlips: PosSlip[];
  addPosSlip: (slip: Omit<PosSlip, 'id'>) => PosSlip;

  // Profile & Dealer Tier
  profile: DealerProfile;
  updateProfile: (data: Partial<DealerProfile>) => void;
  setDealerTier: (tier: 'Standart' | 'Silver' | 'Gold') => void;

  // Notes & Reminders
  notes: UserNote[];
  addNote: (note: { title: string; description: string }) => void;
  deleteNote: (id: string) => void;
  reminders: UserReminder[];
  addReminder: (rem: { title: string; description: string; reminderDate: string; days: string[] }) => void;
  toggleReminder: (id: string) => void;
  deleteReminder: (id: string) => void;

  // Messages
  messages: PortalMessage[];
  sendMessage: (msg: { recipient: string; subject: string; content: string; department?: string }) => void;
  markMessageRead: (id: string) => void;
  unreadCount: number;

  // Admin Mode
  isAdminView: boolean;
  setIsAdminView: (val: boolean) => void;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Initialize States
  const [products] = useState<Product[]>(PRODUCTS);
  const [currency, setCurrency] = useState<Currency>('TRY');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(INITIAL_EXCHANGE_RATES);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>(['ersa-701010009', 'ersa-7011204205']);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [cariTransactions, setCariTransactions] = useState<CariTransaction[]>(INITIAL_CARI);
  const [posSlips, setPosSlips] = useState<PosSlip[]>([
    {
      id: 'slip-01',
      date: '26.01.2026 16:20',
      referenceCode: 'SANPOS-5438',
      cardNumberMasked: '5400 **** **** 8812',
      cardHolder: 'AFFAN EMIRHAN',
      bankName: 'Yapı Kredi - World',
      installmentCount: 6,
      amount: 35000.00,
      status: 'Başarılı',
      authCode: 'AUTH-948271',
      terminalId: 'TRM-88902',
      responseMessage: 'İşlem Başarılı (00 - Onaylandı)',
      dealerName: 'ERSA TİCARET & SOĞUTMA LTD. ŞTİ.'
    },
    {
      id: 'slip-02',
      date: '25.01.2026 11:45',
      referenceCode: 'SANPOS-5434',
      cardNumberMasked: '4543 **** **** 1092',
      cardHolder: 'AFFAN EMIRHAN',
      bankName: 'Garanti BBVA - Bonus',
      installmentCount: 1,
      amount: 6000.00,
      status: 'Başarılı',
      authCode: 'AUTH-839102',
      terminalId: 'TRM-88901',
      responseMessage: 'İşlem Başarılı (00 - Onaylandı)',
      dealerName: 'ERSA TİCARET & SOĞUTMA LTD. ŞTİ.'
    }
  ]);
  const [profile, setProfile] = useState<DealerProfile>(INITIAL_DEALER_PROFILE);
  const [notes, setNotes] = useState<UserNote[]>([
    {
      id: 'n-1',
      title: 'Haftalık Gaz Sevkiyatı',
      description: 'Cuma günü saat 14:00te 10 tüp R134a depoya ulaşacak, kontrol edilecek.',
      date: '25.08.2026',
      color: 'blue'
    },
    {
      id: 'n-2',
      title: 'Soğuk Oda Teklifi',
      description: 'Gültekin Şarküteri 2.5 kW tavan evaporatör montajı için teklif onaylandı.',
      date: '22.08.2026',
      color: 'amber'
    }
  ]);
  const [reminders, setReminders] = useState<UserReminder[]>([
    {
      id: 'r-1',
      title: 'Çek Vadesi Hatırlatması',
      description: 'CHK-88390 numaralı çekin takasa giriş kontrolü yapılacak.',
      reminderDate: '25.04.2026',
      days: ['Pazartesi'],
      isCompleted: false
    }
  ]);
  const [messages, setMessages] = useState<PortalMessage[]>(INITIAL_MESSAGES);
  const [orderNote, setOrderNote] = useState('');
  const [accountingNote, setAccountingNote] = useState('');
  const [isAdminView, setIsAdminView] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Load / Save localStorage if on client
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('ersa_b2b_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedFavs = localStorage.getItem('ersa_b2b_favorites');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));

      const savedProfile = localStorage.getItem('ersa_b2b_profile');
      if (savedProfile) setProfile(JSON.parse(savedProfile));
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('ersa_b2b_cart', JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem('ersa_b2b_favorites', JSON.stringify(favorites));
    } catch {
      // ignore
    }
  }, [favorites]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const updateExchangeRate = (rates: Partial<ExchangeRates>) => {
    setExchangeRates((prev) => ({
      ...prev,
      ...rates,
      lastUpdated: new Date().toLocaleDateString('tr-TR', { hour: '2-digit', minute: '2-digit' })
    }));
    showToast('Döviz kurları başarıyla güncellendi.');
  };

  const convertPrice = (priceTRY: number) => {
    if (currency === 'USD') {
      const amount = priceTRY / exchangeRates.USD_TRY;
      return {
        amount,
        formatted: `$${amount.toFixed(2)}`
      };
    }
    if (currency === 'EUR') {
      const amount = priceTRY / exchangeRates.EUR_TRY;
      return {
        amount,
        formatted: `€${amount.toFixed(2)}`
      };
    }
    return {
      amount: priceTRY,
      formatted: `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2 }).format(priceTRY)} TL`
    };
  };

  const addToCart = (product: Product, quantity = 1) => {
    const minQty = Math.max(1, product.pim || 1);
    const addQty = quantity > 0 ? quantity : minQty;

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = existing.quantity + addQty;
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: newQty,
                totalTRY: newQty * item.unitPriceTRY
              }
            : item
        );
      } else {
        const discount = profile.discountRate || 0.20;
        const discountedUnitPrice = product.priceTRY * (1 - discount);
        return [
          ...prev,
          {
            product,
            quantity: addQty,
            unitPriceTRY: discountedUnitPrice,
            totalTRY: addQty * discountedUnitPrice,
            appliedDiscountRate: discount
          }
        ];
      }
    });

    showToast(`${product.name.slice(0, 32)}... sepete eklendi (${addQty} adet).`);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? {
              ...item,
              quantity,
              totalTRY: quantity * item.unitPriceTRY
            }
          : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Ürün sepetten kaldırıldı.', 'info');
  };

  const clearCart = () => {
    setCart([]);
    setOrderNote('');
    setAccountingNote('');
  };

  // Cart Totals
  const cartTotals = cart.reduce(
    (acc, item) => {
      const listTotal = item.product.priceTRY * item.quantity;
      const finalTotal = item.totalTRY;
      const discount = listTotal - finalTotal;

      acc.itemCount += item.quantity;
      acc.subtotalTRY += listTotal;
      acc.discountTRY += discount;
      acc.grandTotalTRY += finalTotal;
      return acc;
    },
    { itemCount: 0, subtotalTRY: 0, discountTRY: 0, vatTRY: 0, grandTotalTRY: 0 }
  );
  cartTotals.vatTRY = cartTotals.grandTotalTRY * 0.20;
  cartTotals.grandTotalTRY += cartTotals.vatTRY;

  const completeOrder = (): Order => {
    const newOrderNumber = String(Math.floor(28000 + Math.random() * 1999));
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    const newOrder: Order = {
      id: `ord-${newOrderNumber}`,
      orderNumber: newOrderNumber,
      date: dateFormatted,
      source: 'Web',
      orderType: 'Standart Sipariş',
      status: 'bekliyor',
      statusText: 'Bekliyor (Onay Sürecinde)',
      dealerName: profile.companyName,
      items: cart.map((item) => ({
        productId: item.product.id,
        productCode: item.product.code,
        productName: item.product.name,
        productImage: item.product.image,
        quantity: item.quantity,
        shippedQuantity: 0,
        unitPriceTRY: item.unitPriceTRY,
        totalTRY: item.totalTRY,
        pim: item.product.pim,
        status: 'Bekliyor'
      })),
      subtotalTRY: cartTotals.subtotalTRY,
      discountTRY: cartTotals.discountTRY,
      vatTRY: cartTotals.vatTRY,
      totalTRY: cartTotals.grandTotalTRY,
      orderNote: orderNote || undefined,
      accountingNote: accountingNote || undefined,
      shippingAddress: profile.address,
      history: [
        {
          title: 'Sipariş Oluşturuldu',
          description: 'Web B2B Portalı üzerinden sipariş gönderildi.',
          date: dateFormatted,
          user: profile.contactPerson,
          status: 'completed'
        },
        {
          title: 'Muhasebe Onayı',
          description: 'Limit ve cari hesap kontrolü yapılıyor.',
          date: 'Bekleniyor',
          user: 'Ersa Muhasebe',
          status: 'current'
        },
        {
          title: 'Depo & Hazırlık',
          description: 'Sevkiyat ambalajı yapılacak.',
          date: 'Bekleniyor',
          user: 'Ersa Lojistik',
          status: 'pending'
        },
        {
          title: 'Sevkiyat & Teslimat',
          description: 'Kargo / Kendi araç teslimatı.',
          date: 'Bekleniyor',
          user: 'Ersa Sevk Amiri',
          status: 'pending'
        }
      ]
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    showToast(`Sipariş #${newOrderNumber} başarıyla oluşturuldu!`, 'success');
    return newOrder;
  };

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) => {
      if (prev.includes(productId)) {
        showToast('Ürün favorilerden çıkarıldı.', 'info');
        return prev.filter((id) => id !== productId);
      } else {
        showToast('Ürün favorilere eklendi.', 'success');
        return [...prev, productId];
      }
    });
  };

  const isFavorite = (productId: string) => favorites.includes(productId);

  const getOrderById = (idOrNum: string) => {
    return orders.find((o) => o.id === idOrNum || o.orderNumber === idOrNum);
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    const statusMap: Record<OrderStatus, string> = {
      onaysiz: 'Kontrol Edilen Sipariş',
      bekliyor: 'Bekliyor',
      sevkiyatta: 'Sevkiyatta',
      parcali: 'Parçalı Sevkiyat',
      tamamlandi: 'Teslim Edildi',
      iptal: 'İptal Edildi'
    };

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId || o.orderNumber === orderId
          ? { ...o, status, statusText: statusMap[status] }
          : o
      )
    );
    showToast(`Sipariş durumu "${statusMap[status]}" olarak güncellendi.`);
  };

  const cariSummary = {
    totalOrders: 5354113.59,
    totalDebt: cariTransactions.reduce((sum, t) => sum + t.debt, 0),
    totalCredit: cariTransactions.reduce((sum, t) => sum + t.credit, 0),
    balance: 26233.61,
    balanceType: 'A' as const
  };

  const addCariTransaction = (tx: Omit<CariTransaction, 'id'>) => {
    const newTx: CariTransaction = {
      ...tx,
      id: `cari-${Date.now()}`
    };
    setCariTransactions((prev) => [newTx, ...prev]);
  };

  const addPosSlip = (slip: Omit<PosSlip, 'id'>): PosSlip => {
    const newSlip: PosSlip = {
      ...slip,
      id: `slip-${Date.now()}`
    };
    setPosSlips((prev) => [newSlip, ...prev]);

    // Also add to Cari Transactions as payment
    addCariTransaction({
      date: newSlip.date.split(' ')[0],
      documentNo: newSlip.referenceCode,
      documentType: 'Kredi Kartı Ödemesi',
      debt: 0,
      credit: newSlip.amount,
      balance: Math.max(0, cariSummary.balance + newSlip.amount),
      balanceType: 'A',
      description: `${newSlip.bankName} Sanal POS (${newSlip.installmentCount} Taksit) Tahsilatı`
    });

    return newSlip;
  };

  const updateProfile = (data: Partial<DealerProfile>) => {
    setProfile((prev) => {
      const updated = { ...prev, ...data };
      try {
        localStorage.setItem('ersa_b2b_profile', JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
    showToast('Profil bilgileri güncellendi.');
  };

  const setDealerTier = (tier: 'Standart' | 'Silver' | 'Gold') => {
    const rateMap = { Standart: 0.20, Silver: 0.30, Gold: 0.40 };
    updateProfile({ tier, discountRate: rateMap[tier] });
    showToast(`Bayi sınıfınız "${tier}" (%${rateMap[tier] * 100} İskonto) olarak değiştirildi.`);
  };

  const addNote = ({ title, description }: { title: string; description: string }) => {
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    const newNote: UserNote = {
      id: `note-${Date.now()}`,
      title,
      description,
      date: dateFormatted,
      color: 'blue'
    };
    setNotes((prev) => [newNote, ...prev]);
    showToast('Not başarıyla kaydedildi.');
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    showToast('Not silindi.', 'info');
  };

  const addReminder = ({ title, description, reminderDate, days }: { title: string; description: string; reminderDate: string; days: string[] }) => {
    const newRem: UserReminder = {
      id: `rem-${Date.now()}`,
      title,
      description,
      reminderDate,
      days,
      isCompleted: false
    };
    setReminders((prev) => [newRem, ...prev]);
    showToast('Hatırlatma eklendi.');
  };

  const toggleReminder = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isCompleted: !r.isCompleted } : r))
    );
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
    showToast('Hatırlatma silindi.', 'info');
  };

  const sendMessage = ({ recipient, subject, content, department }: { recipient: string; subject: string; content: string; department?: string }) => {
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const code = `MES-${now.getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`;

    const newMsg: PortalMessage = {
      id: `msg-${Date.now()}`,
      code,
      sender: profile.companyName,
      recipient,
      subject,
      content,
      department: department || 'Müşteri Hizmetleri',
      date: dateFormatted,
      isRead: true,
      type: 'sent'
    };

    setMessages((prev) => [newMsg, ...prev]);
    showToast('Mesajınız ilgili birime iletildi.');
  };

  const markMessageRead = (id: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, isRead: true } : m))
    );
  };

  const unreadCount = messages.filter((m) => m.type === 'inbox' && !m.isRead).length;

  return (
    <StoreContext.Provider
      value={{
        products,
        currency,
        setCurrency,
        exchangeRates,
        updateExchangeRate,
        convertPrice,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartTotals,
        orderNote,
        setOrderNote,
        accountingNote,
        setAccountingNote,
        completeOrder,
        favorites,
        toggleFavorite,
        isFavorite,
        orders,
        getOrderById,
        updateOrderStatus,
        cariTransactions,
        cariSummary,
        addCariTransaction,
        posSlips,
        addPosSlip,
        profile,
        updateProfile,
        setDealerTier,
        notes,
        addNote,
        deleteNote,
        reminders,
        addReminder,
        toggleReminder,
        deleteReminder,
        messages,
        sendMessage,
        markMessageRead,
        unreadCount,
        isAdminView,
        setIsAdminView,
        toasts,
        showToast
      }}
    >
      {children}
      {/* Toast Render Component */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "px-4 py-3 rounded-lg shadow-xl text-sm font-medium transition-all duration-300 flex items-center gap-2 pointer-events-auto border animate-in slide-in-from-bottom-5",
              toast.type === 'success' && "bg-emerald-600 text-white border-emerald-500",
              toast.type === 'info' && "bg-sky-600 text-white border-sky-500",
              toast.type === 'warning' && "bg-amber-600 text-white border-amber-500",
              toast.type === 'error' && "bg-rose-600 text-white border-rose-500"
            )}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
