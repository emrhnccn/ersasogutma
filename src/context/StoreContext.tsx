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
  OrderStatus,
  Quote,
  B2BNotification,
  WarrantyClaim
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
  refreshProducts: () => Promise<void>;
  currency: Currency;
  setCurrency: (c: Currency) => void;
  exchangeRates: ExchangeRates;
  isFetchingRates: boolean;
  fetchLiveRates: (showNotification?: boolean) => Promise<void>;
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
  repeatOrder: (orderId: string) => boolean;

  // Quotes (Teklifler)
  quotes: Quote[];
  createQuote: (quoteData: { validUntil: string; notes?: string }) => Quote;
  convertQuoteToOrder: (quoteId: string) => boolean;

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

  // Notifications
  notifications: B2BNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  unreadNotificationCount: number;

  // Warranty Claims
  warrantyClaims: WarrantyClaim[];
  createWarrantyClaim: (claim: { serialNumber: string; productName: string; issueDescription: string }) => WarrantyClaim;

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

  // Theme Mode (Light / Dark)
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Toasts
  toasts: Toast[];
  showToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  // Initialize States
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [currency, setCurrency] = useState<Currency>('TRY');
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates>(INITIAL_EXCHANGE_RATES);

  // Fetch real products from DB (/api/products)
  const refreshProducts = React.useCallback(async () => {
    try {
      const res = await fetch('/api/products?status=ALL');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        const mapped: Product[] = json.data.map((p: any) => ({
          id: p.id,
          code: p.sku,
          name: p.name,
          category: p.category?.name || 'Genel',
          brand: p.brand?.name || 'Ersa',
          pim: p.minOrderQty || 1,
          priceTRY: p.salePrice || 0,
          priceUSD: Number(((p.salePrice || 0) / 38.45).toFixed(2)),
          priceEUR: Number(((p.salePrice || 0) / 42.10).toFixed(2)),
          originalCurrency: (p.currency as Currency) || 'TRY',
          stock: p.stockQty || 0,
          inStock: (p.stockQty || 0) > 0,
          image: p.images?.[0]?.url || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
          unit: p.unit || 'Adet',
          description: p.description || '',
          specifications: p.specsJson ? (typeof p.specsJson === 'string' ? JSON.parse(p.specsJson) : p.specsJson) : {},
          barcode: p.barcode || undefined,
          isNew: true
        }));
        setProducts(mapped);
      }
    } catch (err) {
      console.error('Failed to load products in StoreContext:', err);
    }
  }, []);

  React.useEffect(() => {
    refreshProducts();
  }, [refreshProducts]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);
  const [cariTransactions, setCariTransactions] = useState<CariTransaction[]>(INITIAL_CARI);
  const [posSlips, setPosSlips] = useState<PosSlip[]>([]);
  const [profile, setProfile] = useState<DealerProfile>(INITIAL_DEALER_PROFILE);
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [reminders, setReminders] = useState<UserReminder[]>([]);
  const [messages, setMessages] = useState<PortalMessage[]>(INITIAL_MESSAGES);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [notifications, setNotifications] = useState<B2BNotification[]>([
    {
      id: 'notif-1',
      title: 'Sipariş Sevkiyatta',
      message: '#ERS-2026-9042 nolu siparişiniz Aras Kargo ile sevk edildi.',
      type: 'order',
      date: 'Bugün 14:30',
      isRead: false,
      link: '/bayi/siparisler'
    },
    {
      id: 'notif-2',
      title: 'TCMB Kur Güncellemesi',
      message: 'Güncel USD/TRY ve EUR/TRY kurları 30s periyotla canlı akmaktadır.',
      type: 'system',
      date: 'Bugün 00:00',
      isRead: true
    }
  ]);
  const [warrantyClaims, setWarrantyClaims] = useState<WarrantyClaim[]>([]);
  const [orderNote, setOrderNote] = useState('');
  const [accountingNote, setAccountingNote] = useState('');
  const [isAdminView, setIsAdminView] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('ersa_theme') as 'light' | 'dark' | null;
      if (savedTheme === 'dark' || savedTheme === 'light') {
        setTheme(savedTheme);
        if (savedTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const toggleTheme = React.useCallback(() => {
    setTheme((prev) => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('ersa_theme', nextTheme);
      } catch {
        // ignore
      }
      if (nextTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return nextTheme;
    });
  }, []);

  // Load / Save localStorage if on client & sync with DB
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem('ersa_b2b_cart');
      if (savedCart) setCart(JSON.parse(savedCart));

      const savedFavs = localStorage.getItem('ersa_b2b_favorites');
      if (savedFavs) setFavorites(JSON.parse(savedFavs));

      const savedProfile = localStorage.getItem('ersa_b2b_profile');
      if (savedProfile) setProfile(JSON.parse(savedProfile));

      const savedQuotes = localStorage.getItem('ersa_b2b_quotes');
      if (savedQuotes) setQuotes(JSON.parse(savedQuotes));
    } catch {
      // ignore
    }

    // Fetch DB cart if user is authenticated dealer
    async function loadDbCart() {
      try {
        const res = await fetch('/api/b2b/cart');
        const json = await res.json();
        if (json.success && json.data?.items && Array.isArray(json.data.items)) {
          const dbItems: CartItem[] = json.data.items.map((i: any) => ({
            product: {
              id: i.productId,
              code: i.productCode,
              name: i.productName,
              category: i.categoryName,
              brand: i.brandName,
              pim: i.minOrderQty || 1,
              priceTRY: i.basePriceTRY,
              priceUSD: Number((i.basePriceTRY / 38.45).toFixed(2)),
              priceEUR: Number((i.basePriceTRY / 42.10).toFixed(2)),
              originalCurrency: 'TRY',
              stock: i.stockQty || 0,
              inStock: i.inStock,
              image: i.image || '/placeholder.svg',
              unit: i.unit || 'Adet',
              description: '',
              specifications: {}
            },
            quantity: i.quantity,
            unitPriceTRY: i.unitPriceTRY,
            totalTRY: i.totalTRY,
            appliedDiscountRate: i.appliedDiscountRate
          }));
          if (dbItems.length > 0) {
            setCart(dbItems);
          }
        }
      } catch (err) {
        console.error('Failed to load DB cart on mount:', err);
      }
    }
    loadDbCart();
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

  useEffect(() => {
    try {
      localStorage.setItem('ersa_b2b_quotes', JSON.stringify(quotes));
    } catch {
      // ignore
    }
  }, [quotes]);

  const showToast = (message: string, type: 'success' | 'info' | 'warning' | 'error' = 'success') => {
    const id = Date.now().toString() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const [isFetchingRates, setIsFetchingRates] = useState(false);

  const fetchLiveRates = async (showNotification = false) => {
    try {
      setIsFetchingRates(true);
      const res = await fetch('/api/currency');
      if (!res.ok) throw new Error('API yanıt vermedi');
      const data = await res.json();
      if (data?.success && data?.data) {
        setExchangeRates({
          USD_TRY: Number(data.data.USD_TRY),
          EUR_TRY: Number(data.data.EUR_TRY),
          GBP_TRY: Number(data.data.GBP_TRY || 48.90),
          lastUpdated: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
        if (showNotification) {
          showToast('TCMB canlı kurları güncellendi.', 'info');
        }
      }
    } catch (err) {
      console.error('Döviz kurları çekilemedi:', err);
    } finally {
      setIsFetchingRates(false);
    }
  };

  // 5-minute interval for live currency fetching
  useEffect(() => {
    fetchLiveRates(false);
    const interval = setInterval(() => {
      fetchLiveRates(false);
    }, 300000);
    return () => clearInterval(interval);
  }, []);

  const updateExchangeRate = (newRates: Partial<ExchangeRates>) => {
    setExchangeRates((prev) => ({
      ...prev,
      ...newRates,
      lastUpdated: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }));
    showToast('Döviz kurları güncellendi.');
  };

  const convertPrice = (priceTRY: number) => {
    let amount = priceTRY;
    let symbol = '₺';
    if (currency === 'USD' && exchangeRates.USD_TRY > 0) {
      amount = priceTRY / exchangeRates.USD_TRY;
      symbol = '$';
    } else if (currency === 'EUR' && exchangeRates.EUR_TRY > 0) {
      amount = priceTRY / exchangeRates.EUR_TRY;
      symbol = '€';
    }
    return {
      amount,
      formatted: `${amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`
    };
  };

  const addToCart = (product: Product, quantity = 1) => {
    const minQty = product.pim || 1;
    const addedQty = Math.max(quantity, minQty);

    setCart((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + addedQty,
                totalTRY: (item.quantity + addedQty) * item.unitPriceTRY
              }
            : item
        );
      }

      const discountedPrice = product.priceTRY * (1 - (profile.customDiscountPercent ? profile.customDiscountPercent / 100 : profile.discountRate || 0));
      return [
        ...prev,
        {
          product,
          quantity: addedQty,
          unitPriceTRY: discountedPrice,
          totalTRY: addedQty * discountedPrice,
          appliedDiscountRate: profile.customDiscountPercent ? profile.customDiscountPercent / 100 : profile.discountRate || 0
        }
      ];
    });

    // Async sync to DB
    fetch('/api/b2b/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: product.id, quantity: addedQty, isIncrement: true })
    }).catch((err) => console.error('Failed to sync addToCart with DB:', err));

    showToast(`"${product.name}" sepete eklendi!`, 'success');
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

    // Async sync to DB
    fetch('/api/b2b/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity, isIncrement: false })
    }).catch((err) => console.error('Failed to sync updateCartQuantity with DB:', err));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));

    // Async sync to DB
    fetch(`/api/b2b/cart?productId=${productId}`, {
      method: 'DELETE'
    }).catch((err) => console.error('Failed to sync removeFromCart with DB:', err));

    showToast('Ürün sepetten çıkarıldı.', 'info');
  };

  const clearCart = () => {
    setCart([]);

    // Async sync to DB
    fetch('/api/b2b/cart?clearAll=true', {
      method: 'DELETE'
    }).catch((err) => console.error('Failed to sync clearCart with DB:', err));
  };

  const cartTotals = React.useMemo(() => {
    const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotalTRY = cart.reduce((sum, item) => sum + item.product.priceTRY * item.quantity, 0);
    const grandTotalTRY = cart.reduce((sum, item) => sum + item.totalTRY, 0);
    const discountTRY = subtotalTRY - grandTotalTRY;
    const vatTRY = grandTotalTRY * 0.20; // 20% standard VAT

    return {
      itemCount,
      subtotalTRY,
      discountTRY,
      vatTRY,
      grandTotalTRY: grandTotalTRY + vatTRY
    };
  }, [cart]);

  const completeOrder = (): Order => {
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    const newOrderNumber = `ERS-${now.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      orderNumber: newOrderNumber,
      date: dateFormatted,
      source: 'Web',
      orderType: 'Standart Sipariş',
      status: 'bekliyor',
      statusText: 'Bekliyor',
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
      history: []
    };

    setOrders((prev) => [newOrder, ...prev]);
    clearCart();
    showToast(`Sipariş #${newOrderNumber} başarıyla oluşturuldu!`, 'success');
    return newOrder;
  };

  const repeatOrder = (orderId: string): boolean => {
    const prevOrder = orders.find((o) => o.id === orderId || o.orderNumber === orderId);
    if (!prevOrder || prevOrder.items.length === 0) {
      showToast('Tekrarlanacak sipariş bulunamadı.', 'error');
      return false;
    }

    let addedCount = 0;
    prevOrder.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId || p.code === item.productCode);
      if (prod) {
        addToCart(prod, item.quantity);
        addedCount++;
      }
    });

    if (addedCount > 0) {
      showToast(`${addedCount} kalem ürün önceki siparişinizden sepete aktarıldı!`, 'success');
      return true;
    } else {
      showToast('Siparişteki ürünler şu anda katalogda bulunamadı.', 'warning');
      return false;
    }
  };

  const createQuote = ({ validUntil, notes }: { validUntil: string; notes?: string }): Quote => {
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    const quoteNum = `TEK-${now.getFullYear()}-${String(Math.floor(100 + Math.random() * 900))}`;

    const newQuote: Quote = {
      id: `quote-${Date.now()}`,
      quoteNumber: quoteNum,
      date: dateFormatted,
      validUntil,
      dealerName: profile.companyName,
      dealerCode: profile.dealerCode,
      items: cart.map((item) => ({
        productId: item.product.id,
        productCode: item.product.code,
        productName: item.product.name,
        unitPriceTRY: item.unitPriceTRY,
        quantity: item.quantity,
        discountRate: item.appliedDiscountRate,
        totalTRY: item.totalTRY
      })),
      subtotalTRY: cartTotals.subtotalTRY,
      discountTRY: cartTotals.discountTRY,
      vatTRY: cartTotals.vatTRY,
      totalTRY: cartTotals.grandTotalTRY,
      status: 'Aktif',
      notes
    };

    setQuotes((prev) => [newQuote, ...prev]);
    showToast(`Teklif #${quoteNum} başarıyla oluşturuldu!`, 'success');
    return newQuote;
  };

  const convertQuoteToOrder = (quoteId: string): boolean => {
    const q = quotes.find((x) => x.id === quoteId || x.quoteNumber === quoteId);
    if (!q || q.status === 'Sipariş Edildi') {
      showToast('Geçerli bir teklif bulunamadı.', 'warning');
      return false;
    }

    q.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId || p.code === item.productCode);
      if (prod) {
        addToCart(prod, item.quantity);
      }
    });

    setQuotes((prev) => prev.map((item) => (item.id === quoteId ? { ...item, status: 'Sipariş Edildi' } : item)));
    showToast(`Teklif #${q.quoteNumber} sepete aktarıldı!`, 'success');
    return true;
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
    totalOrders: orders.reduce((sum, o) => sum + o.totalTRY, 0),
    totalDebt: cariTransactions.reduce((sum, t) => sum + t.debt, 0),
    totalCredit: cariTransactions.reduce((sum, t) => sum + t.credit, 0),
    balance: Math.abs(cariTransactions.reduce((sum, t) => sum + t.debt, 0) - cariTransactions.reduce((sum, t) => sum + t.credit, 0)),
    balanceType: (cariTransactions.reduce((sum, t) => sum + t.debt, 0) >= cariTransactions.reduce((sum, t) => sum + t.credit, 0) ? 'B' : 'A') as 'B' | 'A'
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

    addCariTransaction({
      date: newSlip.date.split(' ')[0],
      documentNo: newSlip.referenceCode,
      documentType: 'Kredi Kartı Ödemesi',
      debt: 0,
      credit: newSlip.amount,
      balance: cariSummary.balance + newSlip.amount,
      balanceType: 'A',
      description: `${newSlip.bankName} Sanal POS Tahsilatı (${newSlip.installmentCount} Taksit)`
    });

    showToast('Ödeme başarıyla gerçekleşti ve cariye işlendi.', 'success');
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
  };

  const setDealerTier = (tier: 'Standart' | 'Silver' | 'Gold') => {
    const rates: Record<string, number> = {
      Standart: 0.20,
      Silver: 0.30,
      Gold: 0.40
    };
    updateProfile({ tier, discountRate: rates[tier] });
    showToast(`Bayi sınıfınız "${tier}" (%${rates[tier] * 100}) olarak ayarlandı.`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
  };

  const markAllNotificationsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    showToast('Tüm bildirimler okundu olarak işaretlendi.', 'info');
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  const createWarrantyClaim = ({ serialNumber, productName, issueDescription }: { serialNumber: string; productName: string; issueDescription: string }): WarrantyClaim => {
    const now = new Date();
    const dateFormatted = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`;
    const claimNum = `GAR-${now.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;

    const newClaim: WarrantyClaim = {
      id: `claim-${Date.now()}`,
      claimNumber: claimNum,
      serialNumber,
      productName,
      dealerName: profile.companyName,
      date: dateFormatted,
      issueDescription,
      status: 'İnceleniyor',
      technicianNotes: 'Ersa Teknik Servis kaydı alındı.'
    };

    setWarrantyClaims((prev) => [newClaim, ...prev]);
    showToast(`Garanti destek talebi #${claimNum} oluşturuldu!`, 'success');
    return newClaim;
  };

  const addNote = ({ title, description }: { title: string; description: string }) => {
    const now = new Date();
    const newNote: UserNote = {
      id: `n-${Date.now()}`,
      title,
      description,
      date: `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`,
      color: 'blue'
    };
    setNotes((prev) => [newNote, ...prev]);
    showToast('Not eklendi.');
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    showToast('Not silindi.', 'info');
  };

  const addReminder = ({ title, description, reminderDate, days }: { title: string; description: string; reminderDate: string; days: string[] }) => {
    const newRem: UserReminder = {
      id: `r-${Date.now()}`,
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
        refreshProducts,
        currency,
        setCurrency,
        exchangeRates,
        isFetchingRates,
        fetchLiveRates,
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
        repeatOrder,
        quotes,
        createQuote,
        convertQuoteToOrder,
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
        notifications,
        markNotificationRead,
        markAllNotificationsRead,
        unreadNotificationCount,
        warrantyClaims,
        createWarrantyClaim,
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
        theme,
        toggleTheme,
        toasts,
        showToast
      }}
    >
      {children}
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
