'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/utils';
import {
  ShieldAlert,
  ShieldCheck,
  TrendingUp,
  ShoppingBag,
  CheckCircle2,
  Clock,
  Truck,
  Layers,
  UserCheck,
  RefreshCw,
  Plus,
  ArrowLeft,
  DollarSign,
  Bot,
  Database,
  Search,
  Filter,
  Trash2,
  Edit,
  Save,
  X,
  Building2,
  Check,
  AlertTriangle,
  Play,
  Square,
  ChevronRight,
  Package,
  FolderTree,
  FileText,
  CreditCard,
  Settings,
  ExternalLink,
  Loader2,
  Sparkles,
  ArrowUpRight,
  Eye,
  SlidersHorizontal,
  CheckSquare
} from 'lucide-react';
import { OrderStatus, BankAccount } from '@/types';
import { ScraperProgress, ScraperLog } from '@/lib/scrapers/types';

interface DBProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  salePrice?: number;
  costPrice?: number;
  stockQty: number;
  status: string;
  brand?: { id: string; name: string } | null;
  category?: { id: string; name: string } | null;
  images?: { id: string; url: string }[];
  createdAt: string;
}

interface DBCategory {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  parent?: { id: string; name: string } | null;
  _count?: { products: number };
}

export default function AdminControlPanel() {
  const {
    exchangeRates,
    updateExchangeRate,
    fetchLiveRates,
    isFetchingRates,
    orders,
    updateOrderStatus,
    profile,
    updateProfile,
    setDealerTier,
    addCariTransaction,
    showToast
  } = useStore();

  // Active Navigation Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scraper' | 'products' | 'categories' | 'orders' | 'dealers' | 'bank_accounts' | 'audit'>('dashboard');

  // DB Products State
  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');

  // DB Categories State
  const [dbCategories, setDbCategories] = useState<DBCategory[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  // Bank Accounts State
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);

  // Scraper State
  const [scraperProgress, setScraperProgress] = useState<ScraperProgress | null>(null);
  const [isScrapingActive, setIsScrapingActive] = useState(false);
  const [scrapeTargetUrl, setScrapeTargetUrl] = useState('https://www.ersaticaret.com');
  const [scrapeUsername, setScrapeUsername] = useState('');
  const [scrapePassword, setScrapePassword] = useState('');
  const [scrapeMaxLimit, setScrapeMaxLimit] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState('ersaticaret');

  // New Product Modal State
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductSku, setNewProductSku] = useState('');
  const [newProductCost, setNewProductCost] = useState('');
  const [newProductSale, setNewProductSale] = useState('');
  const [newProductStock, setNewProductStock] = useState('10');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');

  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState('');

  // New Bank Account Form State
  const [newBankName, setNewBankName] = useState('');
  const [newAccountHolder, setNewAccountHolder] = useState('ERSA SOĞUTMA ISITMA SAN. VE TİC. LTD. ŞTİ.');
  const [newIban, setNewIban] = useState('TR');
  const [newBranch, setNewBranch] = useState('');
  const [newCurrency, setNewCurrency] = useState('TRY');
  const [newSwift, setNewSwift] = useState('');

  // Dealer Risk Limit Editing
  const [creditLimitInput, setCreditLimitInput] = useState(profile.creditLimit.toString());

  // Registered Dealers State (Real PostgreSQL DB)
  const [dealersList, setDealersList] = useState<any[]>([]);
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [selectedDealerId, setSelectedDealerId] = useState<string | null>(null);
  const [selectedDealerDetail, setSelectedDealerDetail] = useState<any | null>(null);
  const [loadingDealerDetail, setLoadingDealerDetail] = useState(false);
  const [dealerDrawerTab, setDealerDrawerTab] = useState<'info' | 'finance' | 'cart' | 'orders'>('info');

  // Dealer Drawer Edit Form
  const [editLegalName, setEditLegalName] = useState('');
  const [editTaxNo, setEditTaxNo] = useState('');
  const [editTaxOffice, setEditTaxOffice] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStatus, setEditStatus] = useState('ACTIVE');
  const [editTier, setEditTier] = useState('Standart');
  const [editCreditLimit, setEditCreditLimit] = useState('');

  // Dealer Drawer Manual Cari Form
  const [drawerDocNo, setDrawerDocNo] = useState('');
  const [drawerDocType, setDrawerDocType] = useState('MANUAL_DEBIT');
  const [drawerAmount, setDrawerAmount] = useState('');
  const [drawerNote, setDrawerNote] = useState('');
  const [submittingCari, setSubmittingCari] = useState(false);

  // Dealer Applications State (Başvurular)
  const [dealerApplications, setDealerApplications] = useState<any[]>([]);

  // Manual Cari Transaction
  const [manualDocNo, setManualDocNo] = useState('');
  const [manualDocType, setManualDocType] = useState<'Satış Faturası' | 'Tahsilat Makbuzu' | 'Havale/EFT'>('Satış Faturası');
  const [manualDebt, setManualDebt] = useState('');
  const [manualCredit, setManualCredit] = useState('');
  const [manualDesc, setManualDesc] = useState('');

  // Clean DB confirmation state
  const [isCleaningDb, setIsCleaningDb] = useState(false);

  // 1. Fetch Dealers
  const loadDealers = useCallback(async () => {
    setLoadingDealers(true);
    try {
      const res = await fetch('/api/admin/dealers');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setDealersList(data.data);
      }
    } catch (err) {
      console.error('Dealers load error:', err);
    } finally {
      setLoadingDealers(false);
    }
  }, []);

  // Fetch Dealer Detail
  const openDealerDrawer = async (dealerId: string) => {
    setSelectedDealerId(dealerId);
    setLoadingDealerDetail(true);
    try {
      const res = await fetch(`/api/admin/dealers/${dealerId}`);
      const json = await res.json();
      if (json.success && json.data) {
        setSelectedDealerDetail(json.data);
        setEditLegalName(json.data.legalName || '');
        setEditTaxNo(json.data.taxNo || '');
        setEditTaxOffice(json.data.taxOffice || '');
        setEditPhone(json.data.phone || '');
        setEditEmail(json.data.email || '');
        setEditStatus(json.data.status || 'ACTIVE');
        setEditTier(json.data.tier || 'Standart');
        setEditCreditLimit(json.data.finance?.creditLimit?.toString() || '0');
      } else {
        showToast(json.error || 'Bayi detayları alınamadı', 'error');
      }
    } catch (err) {
      showToast('Bağlantı hatası', 'error');
    } finally {
      setLoadingDealerDetail(false);
    }
  };

  // 1. Fetch Products
  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch('/api/products?status=ALL');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setDbProducts(data.data);
      }
    } catch (err) {
      console.error('Products load error:', err);
    } finally {
      setLoadingProducts(false);
    }
  }, []);

  // 2. Fetch Categories
  const loadCategories = useCallback(async () => {
    setLoadingCategories(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setDbCategories(data.data);
      }
    } catch (err) {
      console.error('Categories load error:', err);
    } finally {
      setLoadingCategories(false);
    }
  }, []);

  // 3. Fetch Bank Accounts
  const loadBankAccounts = useCallback(async () => {
    setLoadingBanks(true);
    try {
      const res = await fetch('/api/bank-accounts');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setBankAccounts(data.data);
      }
    } catch (err) {
      console.error('Bank accounts load error:', err);
    } finally {
      setLoadingBanks(false);
    }
  }, []);

  // 4. Fetch Dealer Applications
  const loadDealerApplications = useCallback(async () => {
    try {
      const res = await fetch('/api/dealer-applications');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setDealerApplications(data.data);
      }
    } catch (err) {
      console.error('Dealer applications load error:', err);
    }
  }, []);

  // 5. Fetch Audit Logs
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState(false);

  const loadAuditLogs = useCallback(async () => {
    setLoadingAuditLogs(true);
    try {
      const res = await fetch('/api/admin/audit-logs');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setAuditLogs(data.data);
      }
    } catch (err) {
      console.error('Audit logs load error:', err);
    } finally {
      setLoadingAuditLogs(false);
    }
  }, []);

  // 5. Poll Scraper Progress
  const checkScraperStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/scrape');
      const data = await res.json();
      if (data?.success && data?.progress) {
        setScraperProgress(data.progress);
        setIsScrapingActive(data.progress.status === 'running');
        if (data.progress.status === 'completed' || data.progress.status === 'failed') {
          loadProducts();
          loadCategories();
        }
      }
    } catch (err) {
      console.error('Scraper status check error:', err);
    }
  }, [loadProducts, loadCategories]);

  useEffect(() => {
    loadProducts();
    loadCategories();
    loadBankAccounts();
    loadAuditLogs();
    loadDealerApplications();
    loadDealers();
    checkScraperStatus();
  }, [loadProducts, loadCategories, loadBankAccounts, loadAuditLogs, loadDealerApplications, loadDealers, checkScraperStatus]);

  // Polling during active scraping
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScrapingActive) {
      interval = setInterval(() => {
        checkScraperStatus();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isScrapingActive, checkScraperStatus]);

  // Handle Start Scraper
  const handleStartScraper = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const maxLimit = scrapeMaxLimit ? parseInt(scrapeMaxLimit, 10) : undefined;

      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          providerId: selectedProvider,
          options: {
            targetUrl: scrapeTargetUrl,
            username: scrapeUsername,
            password: scrapePassword,
            maxProducts: maxLimit
          }
        })
      });

      const data = await res.json();
      if (data.success) {
        setIsScrapingActive(true);
        showToast(`Bot başlatıldı! (${scrapeTargetUrl}) ürünleri çekiliyor...`, 'info');
        checkScraperStatus();
      } else {
        showToast(data.error || 'Bot başlatılamadı!', 'error');
      }
    } catch {
      showToast('Bağlantı hatası oluştu.', 'error');
    }
  };

  // Handle Stop Scraper
  const handleStopScraper = async () => {
    try {
      const res = await fetch('/api/admin/scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop', providerId: selectedProvider })
      });
      const data = await res.json();
      if (data.success) {
        setIsScrapingActive(false);
        showToast('Bot durduruldu.', 'warning');
        checkScraperStatus();
      }
    } catch {
      showToast('İşlem hatası.', 'error');
    }
  };

  // Handle Clean DB (P0 Security & Confirmation Guard)
  const handleCleanDatabase = async () => {
    const confirmation = window.prompt(
      'DİKKAT: Veritabanındaki tüm ürünler, kategoriler ve markalar kalıcı olarak SİLİNECEK.\n\nİşlemi onaylamak için lütfen "ERSA_RESET_CONFIRM_2026" yazın:'
    );

    if (confirmation !== 'ERSA_RESET_CONFIRM_2026') {
      showToast('Onay ifadesi hatalı veya iptal edildi. İşlem durduruldu.', 'warning');
      return;
    }

    setIsCleaningDb(true);
    try {
      const res = await fetch('/api/admin/clean-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmPhrase: 'ERSA_RESET_CONFIRM_2026' })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        loadProducts();
        loadCategories();
      } else {
        showToast(data.error || 'Temizleme başarısız!', 'error');
      }
    } catch {
      showToast('Sunucu hatası oluştu.', 'error');
    } finally {
      setIsCleaningDb(false);
    }
  };

  // Handle Add Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProductName,
          sku: newProductSku,
          costPrice: newProductCost ? parseFloat(newProductCost) : null,
          salePrice: newProductSale ? parseFloat(newProductSale) : null,
          stockQty: parseInt(newProductStock, 10) || 0,
          categoryId: newProductCategory || null,
          imageUrl: newProductImageUrl || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        showToast('Yeni ürün başarıyla eklendi!', 'success');
        setIsNewProductModalOpen(false);
        setNewProductName('');
        setNewProductSku('');
        setNewProductCost('');
        setNewProductSale('');
        setNewProductImageUrl('');
        loadProducts();
      } else {
        showToast(data.error || 'Ürün eklenemedi.', 'error');
      }
    } catch {
      showToast('Bağlantı hatası.', 'error');
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" ürününü silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Ürün silindi.', 'info');
        setDbProducts((prev) => prev.filter((p) => p.id !== id));
      } else {
        showToast(data.error || 'Silinemedi.', 'error');
      }
    } catch {
      showToast('Sunucu hatası.', 'error');
    }
  };

  // Handle Update Product Inline Price / Stock
  const handleUpdateProductInline = async (id: string, updates: Partial<DBProduct>) => {
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Ürün bilgisi güncellendi.');
        setDbProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
      }
    } catch {
      showToast('Güncelleme hatası.', 'error');
    }
  };

  // Handle Create Category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName) return;
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCatName,
          parentId: newCatParent || null
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Kategori oluşturuldu.', 'success');
        setNewCatName('');
        setNewCatParent('');
        loadCategories();
      }
    } catch {
      showToast('Hata oluştu.', 'error');
    }
  };

  // Handle Delete Category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (!window.confirm(`"${name}" kategorisini silmek istediğinize emin misiniz?`)) return;
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Kategori silindi.');
        loadCategories();
      }
    } catch {
      showToast('Hata oluştu.', 'error');
    }
  };

  // Handle Create Bank Account
  const handleCreateBankAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankName: newBankName,
          accountHolder: newAccountHolder,
          iban: newIban,
          branchName: newBranch,
          currency: newCurrency,
          swiftCode: newSwift
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Banka hesabı eklendi.', 'success');
        setNewBankName('');
        setNewBranch('');
        setNewSwift('');
        setNewIban('TR');
        loadBankAccounts();
      }
    } catch {
      showToast('Hata oluştu.', 'error');
    }
  };

  // Handle Delete Bank Account
  const handleDeleteBankAccount = async (id: string) => {
    if (!window.confirm('Bu banka hesabını silmek istiyor musunuz?')) return;
    try {
      const res = await fetch(`/api/bank-accounts?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Banka hesabı silindi.');
        loadBankAccounts();
      }
    } catch {
      showToast('Hata oluştu.', 'error');
    }
  };

  // Filtered Products
  const filteredProducts = dbProducts.filter((p) => {
    const matchesSearch =
      !productSearch ||
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase());
    const matchesCategory =
      productCategoryFilter === 'ALL' ||
      p.category?.id === productCategoryFilter ||
      p.category?.name === productCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950 to-slate-900 border border-sky-500/30 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-sky-400" />
              <span>B2B Yönetici Portalı</span>
            </span>
            <span className="text-emerald-400 text-xs font-mono font-bold">v2.4 Canlı</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">Ersa Soğutma Yönetim Merkezi</h1>
          <p className="text-slate-400 text-xs max-w-2xl">
            Tedarikçi sitelerinden otomatik ürün çekin, ürün kataloğunu yönetin, siparişleri sevk edin ve bayi cari hesaplarını kontrol edin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLiveRates(true)}
            disabled={isFetchingRates}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRates ? 'animate-spin text-sky-400' : ''}`} />
            <span>Kurları Yenile</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-700 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ziyaretçi Vitrini</span>
          </Link>

          <Link
            href="/bayi"
            target="_blank"
            className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-900/30 transition"
          >
            <UserCheck className="w-4 h-4" />
            <span>Bayi Portalı</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex bg-slate-900/90 border border-slate-800 p-1.5 rounded-2xl gap-1 overflow-x-auto">
        {[
          { id: 'dashboard', label: 'Genel Bakış', icon: Layers },
          { id: 'scraper', label: 'Tedarikçi Botu & Ürün Çekme', icon: Bot, highlight: true },
          { id: 'products', label: `Ürün Kataloğu (${dbProducts.length})`, icon: Package },
          { id: 'categories', label: `Kategoriler (${dbCategories.length})`, icon: FolderTree },
          { id: 'orders', label: `Siparişler (${orders.length})`, icon: ShoppingBag },
          { id: 'dealers', label: 'Bayi Cari & İskonto', icon: UserCheck },
          { id: 'bank_accounts', label: 'Banka Hesapları & Ayarlar', icon: Building2 },
          { id: 'audit', label: `Güvenlik & Audit Log (${auditLogs.length})`, icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-900/40'
                  : tab.highlight
                  ? 'text-amber-300 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
              {tab.highlight && !isActive && (
                <span className="relative flex h-2 w-2 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Veritabanındaki Ürün</span>
                <h3 className="text-2xl font-black text-white mt-1">{dbProducts.length} Adet</h3>
                <span className="text-[10px] text-emerald-400 font-mono">Aktif B2B Kataloğu</span>
              </div>
              <div className="w-12 h-12 bg-sky-950 border border-sky-800 rounded-2xl flex items-center justify-center text-sky-400">
                <Package className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Tanımlı Kategori</span>
                <h3 className="text-2xl font-black text-white mt-1">{dbCategories.length} Grup</h3>
                <span className="text-[10px] text-sky-400 font-mono">Hiyerarşik Ağaç</span>
              </div>
              <div className="w-12 h-12 bg-purple-950 border border-purple-800 rounded-2xl flex items-center justify-center text-purple-400">
                <FolderTree className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">TCMB Dolar Kuru</span>
                <h3 className="text-2xl font-black text-emerald-400 font-mono mt-1">
                  {exchangeRates.USD_TRY ? `${exchangeRates.USD_TRY.toFixed(4)} ₺` : '...'}
                </h3>
                <span className="text-[10px] text-slate-400 font-mono">EUR: {exchangeRates.EUR_TRY?.toFixed(4)} ₺</span>
              </div>
              <div className="w-12 h-12 bg-emerald-950 border border-emerald-800 rounded-2xl flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Bekleyen Sipariş</span>
                <h3 className="text-2xl font-black text-amber-400 mt-1">
                  {orders.filter((o) => o.status === 'bekliyor').length} Sipariş
                </h3>
                <span className="text-[10px] text-slate-400">Toplam {orders.length} Sipariş</span>
              </div>
              <div className="w-12 h-12 bg-amber-950 border border-amber-800 rounded-2xl flex items-center justify-center text-amber-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-gradient-to-br from-amber-950/40 to-slate-900 border border-amber-500/30 p-5 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Bot className="w-5 h-5" />
                <span>Girdap.com.tr Ürün Botu</span>
              </div>
              <p className="text-xs text-slate-300">
                Girdap B2B sisteminden en güncel yedek parça ve soğutma ürünlerini kategorileriyle çekin.
              </p>
              <button
                onClick={() => setActiveTab('scraper')}
                className="w-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                <span>Botu Başlat & Yapılandır</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <Package className="w-5 h-5" />
                <span>Ürün ve Stok Yönetimi</span>
              </div>
              <p className="text-xs text-slate-400">
                Ürünlerin fiyatlarını, kâr marjlarını ve stok durumlarını canlı olarak yönetin.
              </p>
              <button
                onClick={() => setActiveTab('products')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2"
              >
                <span>Kataloğa Git ({dbProducts.length} Ürün)</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-rose-950/30 border border-rose-800/40 p-5 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
                <Database className="w-5 h-5" />
                <span>Veritabanı Sıfırlama</span>
              </div>
              <p className="text-xs text-slate-400">
                Eski veya sahte verileri temizleyip sıfırdan temiz veri çekmek için kullanılır.
              </p>
              <button
                onClick={handleCleanDatabase}
                disabled={isCleaningDb}
                className="w-full bg-rose-800 hover:bg-rose-700 text-white font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isCleaningDb ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Veritabanını Temizle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCRAPER HUB */}
      {activeTab === 'scraper' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Bot className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-bold text-white">Tedarikçi Botu & Ürün Çekme</h2>
                  <span className="text-[11px] text-slate-400">Modüler tedarikçi entegrasyonu</span>
                </div>
              </div>

              <form onSubmit={handleStartScraper} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Tedarikçi Kaynağı (URL):</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      required
                      placeholder="https://www.ersaticaret.com"
                      value={scrapeTargetUrl}
                      onChange={(e) => setScrapeTargetUrl(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setScrapeTargetUrl('https://www.ersaticaret.com');
                          setSelectedProvider('ersaticaret');
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition ${
                          scrapeTargetUrl.includes('ersaticaret')
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        ersaticaret.com (2.375 Ürün)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScrapeTargetUrl('https://girdap.com.tr');
                          setSelectedProvider('girdap');
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-lg border font-bold transition ${
                          scrapeTargetUrl.includes('girdap')
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        girdap.com.tr
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Kullanıcı Adı:</label>
                    <input
                      type="text"
                      value={scrapeUsername}
                      onChange={(e) => setScrapeUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">Şifre:</label>
                    <input
                      type="password"
                      value={scrapePassword}
                      onChange={(e) => setScrapePassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Maksimum Çekilecek Ürün Limiti:</label>
                  <input
                    type="number"
                    value={scrapeMaxLimit}
                    onChange={(e) => setScrapeMaxLimit(e.target.value)}
                    placeholder="Boş Bırakılırsa Tüm 2.375 Ürün Çekilir"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    * Tüm ürünleri almak için bu alanı boş bırakabilirsiniz.
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Otomatik İşlem Kuralları:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                    <li>Ürünler doğrudan <strong>birebir net fiyatıyla (kâr marjı eklenmeden)</strong> aktarılır.</li>
                    <li>Kategoriler, markalar (Vestel, Embraco, Bosch vb.) otomatik eşleştirilir.</li>
                    <li>Ürün resimleri ve teknik özellikleri veritabanına bağlanır.</li>
                  </ul>
                </div>

                <div className="pt-2 flex gap-3">
                  {!isScrapingActive ? (
                    <button
                      type="submit"
                      className="flex-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      <span>Ürünleri Şimdi Çek</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleStopScraper}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-3 rounded-xl shadow-lg transition flex items-center justify-center gap-2"
                    >
                      <Square className="w-4 h-4 fill-white" />
                      <span>Botu Durdur</span>
                    </button>
                  )}
                </div>
              </form>
            </div>

            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isScrapingActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                    <h3 className="text-sm font-bold text-white">Canlı Bot Durumu & İlerleme</h3>
                  </div>
                  <span className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full ${
                    scraperProgress?.status === 'running' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                    scraperProgress?.status === 'completed' ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {scraperProgress?.status === 'running' ? 'Çalışıyor' :
                     scraperProgress?.status === 'completed' ? 'Tamamlandı' :
                     scraperProgress?.status === 'stopped' ? 'Durduruldu' : 'Hazır'}
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-medium">{scraperProgress?.currentStep || 'Beklemede'}</span>
                    <span className="font-mono font-bold text-amber-400">%{scraperProgress?.percent || 0}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-3 p-0.5 border border-slate-800 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${scraperProgress?.percent || 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Taranan Kategori</span>
                    <span className="text-base font-black text-white font-mono">{scraperProgress?.processedCategories || 0} / {scraperProgress?.totalCategories || 0}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Aktarılan Ürün</span>
                    <span className="text-base font-black text-emerald-400 font-mono">{scraperProgress?.importedProducts || 0}</span>
                  </div>
                  <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Hatalı/Atlanan</span>
                    <span className="text-base font-black text-slate-400 font-mono">{scraperProgress?.failedProducts || 0}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
                  <span>Terminal / Canlı Log Akışı:</span>
                  <span className="font-mono">{scraperProgress?.logs?.length || 0} satır</span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 h-52 overflow-y-auto font-mono text-[11px] space-y-1.5 text-slate-300">
                  {(!scraperProgress?.logs || scraperProgress.logs.length === 0) ? (
                    <div className="text-slate-600 italic">Henüz bir log kaydı yok. Botu başlattığınızda canlı işlem logları burada akacaktır.</div>
                  ) : (
                    scraperProgress.logs.map((l, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-slate-600 flex-shrink-0">[{l.timestamp}]</span>
                        <span className={
                          l.level === 'success' ? 'text-emerald-400 font-bold' :
                          l.level === 'error' ? 'text-rose-400 font-bold' :
                          l.level === 'warn' ? 'text-amber-300' : 'text-slate-300'
                        }>
                          {l.message}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PRODUCTS */}
      {activeTab === 'products' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <div className="flex items-center gap-3 flex-1">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Ürün adı veya SKU ile ara..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">Tüm Kategoriler ({dbProducts.length})</option>
                {dbCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={loadProducts}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                title="Yenile"
              >
                <RefreshCw className={`w-4 h-4 ${loadingProducts ? 'animate-spin text-sky-400' : ''}`} />
              </button>
              <button
                onClick={() => setIsNewProductModalOpen(true)}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-lg transition"
              >
                <Plus className="w-4 h-4" />
                <span>Yeni Ürün Ekle</span>
              </button>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            {loadingProducts ? (
              <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                <span>Ürünler veritabanından çekiliyor...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Package className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-white">Ürün Bulunamadı</h3>
                <p className="text-xs text-slate-400">
                  {productSearch ? 'Arama kriterlerinize uygun ürün yok.' : 'Henüz ürün eklenmemiş. Tedarikçi botu ile ürünleri içeri aktarabilirsiniz.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase font-bold text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3.5">Görsel</th>
                      <th className="p-3.5">Ürün Adı & Kategori</th>
                      <th className="p-3.5">SKU / Barkod</th>
                      <th className="p-3.5">Alış Fiyatı</th>
                      <th className="p-3.5">Satış Fiyatı (TL)</th>
                      <th className="p-3.5">Stok Adedi</th>
                      <th className="p-3.5 text-center">Durum</th>
                      <th className="p-3.5 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5">
                          {p.images && p.images.length > 0 ? (
                            <img src={p.images[0].url} alt="" className="w-10 h-10 object-cover rounded-lg bg-white p-0.5 border border-slate-700" />
                          ) : (
                            <div className="w-10 h-10 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">📦</div>
                          )}
                        </td>
                        <td className="p-3.5 max-w-sm">
                          <div className="font-bold text-white line-clamp-1">{p.name}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            {p.category?.name || 'Kategorisiz'} {p.brand?.name ? `• ${p.brand.name}` : ''}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono text-sky-300">
                          <div>{p.sku}</div>
                          {p.barcode && <div className="text-[10px] text-slate-500">{p.barcode}</div>}
                        </td>
                        <td className="p-3.5 font-mono text-slate-400">
                          {p.costPrice ? `${Number(p.costPrice).toFixed(2)} ₺` : '-'}
                        </td>
                        <td className="p-3.5">
                          <input
                            type="number"
                            step="0.1"
                            defaultValue={p.salePrice || 0}
                            onBlur={(e) => {
                              const val = parseFloat(e.target.value);
                              if (!isNaN(val) && val !== Number(p.salePrice)) {
                                handleUpdateProductInline(p.id, { salePrice: val });
                              }
                            }}
                            className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono font-bold text-emerald-400 text-xs focus:outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="p-3.5">
                          <input
                            type="number"
                            defaultValue={p.stockQty}
                            onBlur={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val !== p.stockQty) {
                                handleUpdateProductInline(p.id, { stockQty: val });
                              }
                            }}
                            className="w-20 bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 font-mono text-white text-xs focus:outline-none"
                          />
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => handleUpdateProductInline(p.id, { status: p.status === 'ACTIVE' ? 'DRAFT' : 'ACTIVE' })}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition ${
                              p.status === 'ACTIVE' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {p.status === 'ACTIVE' ? 'Aktif' : 'Taslak'}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => handleDeleteProduct(p.id, p.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                            title="Ürünü Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Yeni Kategori Ekle</span>
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Kategori Adı:</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Soğutma Kompresörleri"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Üst Kategori (Opsiyonel):</label>
                <select
                  value={newCatParent}
                  onChange={(e) => setNewCatParent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                >
                  <option value="">-- Ana Kategori (Üst Kategori Yok) --</option>
                  {dbCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2.5 rounded-xl transition"
              >
                Kategori Kaydet
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-purple-400" />
                <span>Kategori Hiyerarşisi ({dbCategories.length})</span>
              </h3>
              <button onClick={loadCategories} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingCategories ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingCategories ? (
              <div className="py-10 text-center text-slate-400">Yükleniyor...</div>
            ) : dbCategories.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                Kayıtlı kategori bulunamadı. Tedarikçi botu ile kategoriler otomatik içe aktarılacaktır.
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {dbCategories.map((c) => (
                  <div
                    key={c.id}
                    className="bg-slate-950 border border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition"
                  >
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{c.name}</span>
                        {c._count?.products !== undefined && (
                          <span className="text-[10px] bg-slate-800 text-sky-400 px-2 py-0.2 rounded-full font-mono">
                            {c._count.products} Ürün
                          </span>
                        )}
                      </div>
                      {c.parent && (
                        <span className="text-[10px] text-slate-500">Üst: {c.parent.name}</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteCategory(c.id, c.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg transition"
                      title="Kategoriyi Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ORDERS */}
      {activeTab === 'orders' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-sky-400" />
              <span>Bayi Sipariş Onay & Sevkiyat Yönetimi</span>
            </h2>
            <span className="text-xs text-slate-400">Toplam {orders.length} Sipariş</span>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto" />
              <p>Henüz verilmiş bir bayi siparişi bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-bold text-sky-400 text-sm">#{order.orderNumber}</span>
                      <span className="text-slate-400 text-[11px] ml-2">({order.date})</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      {formatCurrency(order.totalTRY)}
                    </span>
                  </div>

                  <div className="text-slate-300">
                    <strong>Kalemler:</strong> {order.items.map((i) => `${i.productName} (${i.quantity}x)`).join(', ')}
                  </div>

                  {order.orderNote && (
                    <div className="bg-slate-900 p-2 rounded text-[11px] text-amber-300">
                      <strong>Bayi Notu:</strong> {order.orderNote}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 gap-2 flex-wrap">
                    <span className="text-[11px] text-slate-400">Sipariş Durumu:</span>
                    <div className="flex gap-1.5 flex-wrap">
                      <button
                        onClick={() => updateOrderStatus(order.id, 'bekliyor')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          order.status === 'bekliyor' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Bekliyor
                      </button>

                      <button
                        onClick={() => updateOrderStatus(order.id, 'sevkiyatta')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          order.status === 'sevkiyatta' ? 'bg-sky-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Sevkiyatta (Yolda)
                      </button>

                      <button
                        onClick={() => updateOrderStatus(order.id, 'tamamlandi')}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                          order.status === 'tamamlandi' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        Teslim Edildi
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: DEALERS & APPLICATIONS */}
      {activeTab === 'dealers' && (
        <div className="space-y-8">
          
          {/* Section 1: Dealer Applications (Bayilik Başvuruları) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Gelen Bayilik Başvuruları</span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      {dealerApplications.filter(a => a.status === 'PENDING').length} Bekleyen Başvuru
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">Web sitesi üzerinden gelen yeni B2B bayi onay talepleri</p>
                </div>
              </div>
            </div>

            {dealerApplications.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-xs">
                Bekleyen yeni bayilik başvurusu bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Firma Ünvanı & Yetkili</th>
                      <th className="py-3 px-4">İletişim & Konum</th>
                      <th className="py-3 px-4">Vergi Bilgileri</th>
                      <th className="py-3 px-4">Başvuru Notu</th>
                      <th className="py-3 px-4">Tarih / Durum</th>
                      <th className="py-3 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {dealerApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{app.companyName}</div>
                          <div className="text-slate-400 text-[11px]">{app.contactPerson}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-mono text-sky-400">{app.phone}</div>
                          <div className="text-slate-400 text-[11px]">{app.city}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-300">{app.taxOffice}</div>
                          <div className="font-mono text-slate-400 text-[11px]">{app.taxNumber}</div>
                        </td>
                        <td className="py-3.5 px-4 max-w-xs truncate text-slate-300">
                          {app.notes || '—'}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-400 text-[11px]">{app.appliedAt}</div>
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mt-1 ${
                            app.status === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : app.status === 'APPROVED'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                              : 'bg-red-500/20 text-red-300 border border-red-500/40'
                          }`}>
                            {app.status === 'PENDING' ? 'İnceleme Bekliyor' : app.status === 'APPROVED' ? 'Onaylandı' : 'Reddedildi'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          {app.status === 'PENDING' ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/dealer-applications', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: app.id, status: 'APPROVED', assignedTier: 'Silver' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      showToast(`"${app.companyName}" başvurusu onaylandı ve veritabanına işlendi!`, 'success');
                                      loadDealerApplications();
                                    } else {
                                      showToast(data.error || 'Onaylama başarısız oldu.', 'error');
                                    }
                                  } catch {
                                    showToast('İşlem sırasında hata oluştu.', 'error');
                                  }
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 shadow"
                              >
                                <Check className="w-3.5 h-3.5" />
                                Onayla & Bayi Yap
                              </button>
                              <button
                                onClick={async () => {
                                  try {
                                    const res = await fetch('/api/dealer-applications', {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ id: app.id, status: 'REJECTED' })
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      showToast('Başvuru reddedildi.', 'info');
                                      loadDealerApplications();
                                    } else {
                                      showToast(data.error || 'Reddetme başarısız oldu.', 'error');
                                    }
                                  } catch {
                                    showToast('İşlem sırasında hata oluştu.', 'error');
                                  }
                                }}
                                className="px-2.5 py-1.5 bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-300 font-bold rounded-lg text-xs transition border border-slate-700"
                              >
                                Reddet
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">İşlem Tamamlandı</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 2: Registered Dealers Table & Management */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-400" />
                  <span>Kayıtlı Bayiler & Cari Yönetimi ({dealersList.length})</span>
                </h2>
                <p className="text-xs text-slate-400">Veritabanındaki gerçek bayileri, cari bakiyelerini, kredi limitlerini ve canlı sepetlerini yönetin</p>
              </div>
              <button
                onClick={loadDealers}
                disabled={loadingDealers}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingDealers ? 'animate-spin text-sky-400' : ''}`} />
                <span>Listeyi Yenile</span>
              </button>
            </div>

            {loadingDealers ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-sky-400 mx-auto mb-2" />
                <span>Bayiler yükleniyor...</span>
              </div>
            ) : dealersList.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800/80">
                Kayıtlı bayi bulunamadı. Yukarıdaki başvurulardan bayilik onaylayarak yeni bayi oluşturabilirsiniz.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Bayi Kodu & Ünvan</th>
                      <th className="py-3 px-4">Yetkili & İletişim</th>
                      <th className="py-3 px-4">Kademe</th>
                      <th className="py-3 px-4">Kredi Limiti</th>
                      <th className="py-3 px-4">Cari Bakiye</th>
                      <th className="py-3 px-4">Kullanılabilir Limit</th>
                      <th className="py-3 px-4">Siparişler</th>
                      <th className="py-3 px-4">Durum</th>
                      <th className="py-3 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {dealersList.map((dealer) => (
                      <tr key={dealer.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-sky-400">{dealer.dealerCode}</div>
                          <div className="font-bold text-white text-sm">{dealer.companyName}</div>
                          <div className="text-[10px] text-slate-500">Kayıt: {dealer.registeredAt}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-300 font-semibold">{dealer.contactPerson}</div>
                          <div className="text-slate-500 text-[11px]">{dealer.phone}</div>
                          <div className="text-slate-500 text-[10px]">{dealer.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-black text-[11px] ${
                            dealer.tier === 'Platinum'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                              : dealer.tier === 'Gold'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              : dealer.tier === 'Silver'
                              ? 'bg-slate-300/20 text-slate-200 border border-slate-400/40'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
                          }`}>
                            {dealer.tier} (%{dealer.discountRate})
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                          {formatCurrency(dealer.creditLimit)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold">
                          <span className={dealer.currentBalance > 0 ? 'text-rose-400' : 'text-slate-200'}>
                            {formatCurrency(dealer.currentBalance)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-cyan-400">
                          {formatCurrency(dealer.availableCredit)}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-white">{dealer.totalOrders} Sipariş</div>
                          <div className="text-slate-500 text-[10px]">Son: {dealer.lastOrderDate}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            dealer.status === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          }`}>
                            {dealer.status === 'ACTIVE' ? 'Aktif' : 'Askıda'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => openDealerDrawer(dealer.id)}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 ml-auto shadow"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Yönet & Cari</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 3: Interactive Dealer Details & Live Cart & Cari Modal */}
          {selectedDealerId && selectedDealerDetail && (
            <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm">
                      {selectedDealerDetail.legalName?.slice(0, 2).toUpperCase() || 'ER'}
                    </div>
                    <div>
                      <h2 className="text-base font-black text-white">{selectedDealerDetail.legalName}</h2>
                      <p className="text-xs text-slate-400 font-mono">
                        {selectedDealerDetail.user?.username} • {selectedDealerDetail.tier} Bayi • {selectedDealerDetail.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedDealerId(null);
                      setSelectedDealerDetail(null);
                    }}
                    className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Tabs Bar */}
                <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 gap-2">
                  {[
                    { id: 'info', label: 'Genel & Limit', icon: Building2 },
                    { id: 'finance', label: `Cari & Hareketler (${selectedDealerDetail.finance?.transactions?.length || 0})`, icon: CreditCard },
                    { id: 'cart', label: `Canlı Sepet (${selectedDealerDetail.cart?.items?.length || 0})`, icon: ShoppingBag },
                    { id: 'orders', label: `Sipariş Geçmişi (${selectedDealerDetail.orders?.length || 0})`, icon: FileText }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = dealerDrawerTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setDealerDrawerTab(tab.id as any)}
                        className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition ${
                          isActive
                            ? 'border-sky-500 text-sky-400'
                            : 'border-transparent text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                  
                  {/* TAB 1: INFO & LIMIT */}
                  {dealerDrawerTab === 'info' && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                          const res = await fetch(`/api/admin/dealers/${selectedDealerDetail.id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              legalName: editLegalName,
                              taxNo: editTaxNo,
                              taxOffice: editTaxOffice,
                              phone: editPhone,
                              email: editEmail,
                              status: editStatus,
                              tier: editTier,
                              creditLimit: parseFloat(editCreditLimit) || 0
                            })
                          });
                          const json = await res.json();
                          if (json.success) {
                            showToast('Bayi bilgileri ve limit başarıyla güncellendi!', 'success');
                            loadDealers();
                            openDealerDrawer(selectedDealerDetail.id);
                          } else {
                            showToast(json.error || 'Güncelleme başarısız', 'error');
                          }
                        } catch {
                          showToast('Hata oluştu', 'error');
                        }
                      }}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs"
                    >
                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Firma Resmi Ünvanı:</label>
                        <input
                          type="text"
                          required
                          value={editLegalName}
                          onChange={(e) => setEditLegalName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">İskonto Kademesi:</label>
                        <select
                          value={editTier}
                          onChange={(e) => setEditTier(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                        >
                          <option value="Standart">Standart (%20 İskonto)</option>
                          <option value="Silver">Silver (%30 İskonto)</option>
                          <option value="Gold">Gold (%40 İskonto)</option>
                          <option value="Platinum">Platinum (%50 İskonto)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Vergi Dairesi:</label>
                        <input
                          type="text"
                          value={editTaxOffice}
                          onChange={(e) => setEditTaxOffice(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Vergi No / T.C. Kimlik:</label>
                        <input
                          type="text"
                          value={editTaxNo}
                          onChange={(e) => setEditTaxNo(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Telefon Numarası:</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">E-posta Adresi:</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Tanımlı Kredi Limiti (TL):</label>
                        <input
                          type="number"
                          value={editCreditLimit}
                          onChange={(e) => setEditCreditLimit(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-400 mb-1 font-semibold">Hesap Durumu:</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                        >
                          <option value="ACTIVE">Aktif (Sipariş Verebilir)</option>
                          <option value="SUSPENDED">Askıda (Geçici Olarak Kapalı)</option>
                        </select>
                      </div>

                      <div className="md:col-span-2 pt-3 flex justify-end">
                        <button
                          type="submit"
                          className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl shadow-lg transition flex items-center gap-2"
                        >
                          <Save className="w-4 h-4" />
                          <span>Değişiklikleri Kaydet</span>
                        </button>
                      </div>
                    </form>
                  )}

                  {/* TAB 2: FINANCE & CARI */}
                  {dealerDrawerTab === 'finance' && (
                    <div className="space-y-6">
                      {/* Financial KPI Cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl">
                          <span className="text-slate-400 block mb-1">Cari Bakiye (Borç)</span>
                          <span className="text-base font-black text-rose-400 font-mono">
                            {formatCurrency(selectedDealerDetail.finance?.currentBalance || 0)}
                          </span>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl">
                          <span className="text-slate-400 block mb-1">Kredi Limiti</span>
                          <span className="text-base font-black text-emerald-400 font-mono">
                            {formatCurrency(selectedDealerDetail.finance?.creditLimit || 0)}
                          </span>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl">
                          <span className="text-slate-400 block mb-1">Kullanılabilir Limit</span>
                          <span className="text-base font-black text-cyan-400 font-mono">
                            {formatCurrency(selectedDealerDetail.finance?.availableCredit || 0)}
                          </span>
                        </div>
                        <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl">
                          <span className="text-slate-400 block mb-1">Toplam İşlem Adedi</span>
                          <span className="text-base font-black text-slate-200 font-mono">
                            {selectedDealerDetail.finance?.transactions?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Add Transaction Form */}
                      <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-2xl space-y-3">
                        <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                          <Plus className="w-4 h-4 text-emerald-400" />
                          <span>Yeni Cari Hareket Ekle (Borç / Tahsilat)</span>
                        </h4>

                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            if (!drawerAmount || parseFloat(drawerAmount) <= 0) {
                              showToast('Geçerli bir tutar giriniz', 'warning');
                              return;
                            }
                            setSubmittingCari(true);
                            try {
                              const res = await fetch(`/api/admin/dealers/${selectedDealerDetail.id}/cari-transaction`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  type: drawerDocType,
                                  amount: parseFloat(drawerAmount),
                                  docNo: drawerDocNo,
                                  note: drawerNote
                                })
                              });
                              const json = await res.json();
                              if (json.success) {
                                showToast(json.message, 'success');
                                setDrawerAmount('');
                                setDrawerDocNo('');
                                setDrawerNote('');
                                loadDealers();
                                openDealerDrawer(selectedDealerDetail.id);
                              } else {
                                showToast(json.error || 'İşlem başarısız', 'error');
                              }
                            } catch {
                              showToast('Hata oluştu', 'error');
                            } finally {
                              setSubmittingCari(false);
                            }
                          }}
                          className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
                        >
                          <div>
                            <label className="block text-slate-400 mb-1">İşlem Türü:</label>
                            <select
                              value={drawerDocType}
                              onChange={(e) => setDrawerDocType(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                            >
                              <option value="MANUAL_DEBIT">Manuel Borç (Fatura / Satış)</option>
                              <option value="MANUAL_CREDIT">Tahsilat / Ödeme (Alacak)</option>
                              <option value="CORRECTION">Bakiye Düzeltme</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">Tutar (TL):</label>
                            <input
                              type="number"
                              required
                              placeholder="0.00"
                              value={drawerAmount}
                              onChange={(e) => setDrawerAmount(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">Evrak / Dekont No:</label>
                            <input
                              type="text"
                              placeholder="Örn: DEK-2026-001"
                              value={drawerDocNo}
                              onChange={(e) => setDrawerDocNo(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-400 mb-1">Açıklama / Not:</label>
                            <input
                              type="text"
                              placeholder="Örn: Havale ile tahsilat"
                              value={drawerNote}
                              onChange={(e) => setDrawerNote(e.target.value)}
                              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                            />
                          </div>

                          <div className="sm:col-span-4 flex justify-end">
                            <button
                              type="submit"
                              disabled={submittingCari}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
                            >
                              <Check className="w-4 h-4" />
                              <span>{submittingCari ? 'İşleniyor...' : 'Cari Hareketi Kaydet'}</span>
                            </button>
                          </div>
                        </form>
                      </div>

                      {/* Transactions Table */}
                      <div className="overflow-x-auto border border-slate-800 rounded-2xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">Tarih</th>
                              <th className="py-2.5 px-3">Tür</th>
                              <th className="py-2.5 px-3">Evrak / Açıklama</th>
                              <th className="py-2.5 px-3 text-right">Tutar</th>
                              <th className="py-2.5 px-3 text-right">Son Bakiye</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {selectedDealerDetail.finance?.transactions?.map((t: any) => (
                              <tr key={t.id} className="hover:bg-slate-800/40">
                                <td className="py-2 px-3 text-slate-400 font-mono text-[11px]">
                                  {new Date(t.createdAt).toLocaleDateString('tr-TR')} {new Date(t.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="py-2 px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    t.type.includes('DEBIT') || t.type === 'ORDER_DEBIT'
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : 'bg-emerald-500/20 text-emerald-300'
                                  }`}>
                                    {t.type.includes('DEBIT') || t.type === 'ORDER_DEBIT' ? 'BORÇ' : 'TAHSİLAT/ALACAK'}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-slate-300 max-w-sm truncate">{t.note}</td>
                                <td className="py-2 px-3 text-right font-mono font-bold">
                                  <span className={t.type.includes('DEBIT') || t.type === 'ORDER_DEBIT' ? 'text-rose-400' : 'text-emerald-400'}>
                                    {formatCurrency(t.amount)}
                                  </span>
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-bold text-slate-200">
                                  {formatCurrency(t.balanceAfter)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: LIVE CART */}
                  {dealerDrawerTab === 'cart' && (
                    <div className="space-y-4 text-xs">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                        <span className="font-bold text-white">
                          Bayinin Aktif Veritabanı Sepeti ({selectedDealerDetail.cart?.items?.length || 0} Kalem)
                        </span>
                        <span className="font-mono text-emerald-400 font-bold text-sm">
                          {formatCurrency(selectedDealerDetail.cart?.items?.reduce((sum: number, i: any) => sum + (i.quantity * i.salePrice), 0) || 0)}
                        </span>
                      </div>

                      {!selectedDealerDetail.cart || selectedDealerDetail.cart.items.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                          Bayinin sepeti şu anda boş.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-2xl overflow-hidden">
                          {selectedDealerDetail.cart.items.map((item: any) => (
                            <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-800/40 transition">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 p-1 shrink-0 overflow-hidden">
                                  <img
                                    src={item.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'}
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'; }}
                                  />
                                </div>
                                <div>
                                  <div className="font-bold text-white text-xs">{item.name}</div>
                                  <div className="text-[10px] font-mono text-sky-400 mt-0.5">{item.sku}</div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">Birim: {formatCurrency(item.salePrice)} + KDV</div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                                  <button
                                    onClick={async () => {
                                      await fetch(`/api/admin/dealers/${selectedDealerDetail.id}/cart`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'update_qty', itemId: item.id, quantity: item.quantity - 1 })
                                      });
                                      openDealerDrawer(selectedDealerDetail.id);
                                    }}
                                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center font-mono font-bold text-white">{item.quantity}</span>
                                  <button
                                    onClick={async () => {
                                      await fetch(`/api/admin/dealers/${selectedDealerDetail.id}/cart`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'update_qty', itemId: item.id, quantity: item.quantity + 1 })
                                      });
                                      openDealerDrawer(selectedDealerDetail.id);
                                    }}
                                    className="w-6 h-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center font-bold"
                                  >
                                    +
                                  </button>
                                </div>

                                <div className="text-right min-w-[90px]">
                                  <div className="font-mono font-bold text-emerald-400 text-xs">
                                    {formatCurrency(item.quantity * item.salePrice)}
                                  </div>
                                </div>

                                <button
                                  onClick={async () => {
                                    await fetch(`/api/admin/dealers/${selectedDealerDetail.id}/cart`, {
                                      method: 'PUT',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ action: 'remove_item', itemId: item.id })
                                    });
                                    openDealerDrawer(selectedDealerDetail.id);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                                  title="Ürünü Sepetten Kaldır"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: ORDERS */}
                  {dealerDrawerTab === 'orders' && (
                    <div className="space-y-3 text-xs">
                      {selectedDealerDetail.orders.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-slate-950/40 rounded-2xl border border-slate-800">
                          Bu bayiye ait henüz sipariş kaydı bulunmuyor.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-2xl overflow-hidden">
                          {selectedDealerDetail.orders.map((order: any) => (
                            <div key={order.id} className="p-4 space-y-2 hover:bg-slate-800/30 transition">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="font-mono font-bold text-sky-400">{order.orderNo}</span>
                                  <span className="text-slate-500">•</span>
                                  <span className="text-slate-400">{new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="font-mono font-bold text-emerald-400">{formatCurrency(order.grandTotal)}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    order.status === 'DELIVERED'
                                      ? 'bg-emerald-500/20 text-emerald-300'
                                      : order.status === 'PENDING_LIMIT_APPROVAL'
                                      ? 'bg-rose-500/20 text-rose-300'
                                      : 'bg-amber-500/20 text-amber-300'
                                  }`}>
                                    {order.status}
                                  </span>
                                </div>
                              </div>
                              <div className="text-slate-400 text-[11px]">
                                {order.items.map((i: any) => `${i.name} (${i.quantity} ${i.unit})`).join(', ')}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* TAB 7: BANK ACCOUNTS & SETTINGS */}
      {activeTab === 'bank_accounts' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Yeni Banka Hesabı Ekle</span>
            </h3>

            <form onSubmit={handleCreateBankAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Banka Adı:</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Garanti BBVA"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Hesap Sahibi:</label>
                <input
                  type="text"
                  required
                  value={newAccountHolder}
                  onChange={(e) => setNewAccountHolder(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">IBAN Numarası:</label>
                <input
                  type="text"
                  required
                  placeholder="TR..."
                  value={newIban}
                  onChange={(e) => setNewIban(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sky-300 font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Şube:</label>
                  <input
                    type="text"
                    placeholder="Darıca Şubesi"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Para Birimi:</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">SWIFT Kodu (Opsiyonel):</label>
                <input
                  type="text"
                  placeholder="TGBAISX"
                  value={newSwift}
                  onChange={(e) => setNewSwift(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-lg"
              >
                Hesabı Kaydet
              </button>
            </form>
          </div>

          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-400" />
                <span>Tanımlı Banka Hesapları ({bankAccounts.length})</span>
              </h3>
              <button onClick={loadBankAccounts} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingBanks ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingBanks ? (
              <div className="py-10 text-center text-slate-400">Yükleniyor...</div>
            ) : bankAccounts.length === 0 ? (
              <div className="py-10 text-center text-slate-500 text-xs">
                Kayıtlı banka hesabı yok. Yan taraftaki formdan resmi IBAN ekleyebilirsiniz.
              </div>
            ) : (
              <div className="space-y-3">
                {bankAccounts.map((b) => (
                  <div
                    key={b.id}
                    className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{b.bankName}</span>
                        <span className="bg-slate-800 text-emerald-400 px-2 py-0.2 rounded font-mono font-bold text-[10px]">
                          {b.currency}
                        </span>
                      </div>
                      <div className="font-mono text-sky-300 text-[11px] select-all">{b.iban}</div>
                      <div className="text-[10px] text-slate-500">{b.accountHolder}</div>
                    </div>

                    <button
                      onClick={() => handleDeleteBankAccount(b.id)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                      title="Hesabı Sil"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: AUDIT LOGS & SECURITY */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Sistem Güvenlik & Audit Günlüğü</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40">
                    {auditLogs.length} Kayıt
                  </span>
                </h2>
                <p className="text-xs text-slate-400">Veritabanı sıfırlama, scraper çalıştırma, cari ve sipariş operasyonları logları</p>
              </div>
            </div>

            <button
              onClick={loadAuditLogs}
              disabled={loadingAuditLogs}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold px-3 py-2 rounded-xl transition border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ? 'animate-spin text-purple-400' : ''}`} />
              <span>Yenile</span>
            </button>
          </div>

          {loadingAuditLogs ? (
            <div className="py-12 text-center text-slate-400 text-xs">Audit kayıtları yükleniyor...</div>
          ) : auditLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              Henüz kayıtlı audit log bulunmuyor.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Tarih / Saat</th>
                    <th className="py-3 px-4">Kullanıcı & Rol</th>
                    <th className="py-3 px-4">İşlem / Eylem</th>
                    <th className="py-3 px-4">Hedef Nesne</th>
                    <th className="py-3 px-4">Detay / Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {log.createdAt}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-white">{log.actorName}</div>
                        <span className="text-[10px] text-sky-400 font-mono">{log.actorRole}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono ${
                          log.action.includes('CLEAN') || log.action.includes('DELETE')
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : log.action.includes('CREATE') || log.action.includes('START')
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-slate-300">{log.entityType}</span>
                        <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">{log.entityId}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="bg-slate-950 p-2 rounded-lg font-mono text-[11px] text-slate-300 max-w-md overflow-x-auto">
                          {log.afterJson ? JSON.stringify(log.afterJson) : log.beforeJson ? JSON.stringify(log.beforeJson) : '—'}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL: NEW PRODUCT */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Yeni Ürün Oluştur</h3>
              <button onClick={() => setIsNewProductModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ürün Adı:</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 2.5 kW Tavan Tipi Evaporatör"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Stok Kodu (SKU):</label>
                  <input
                    type="text"
                    required
                    placeholder="ERS-7010..."
                    value={newProductSku}
                    onChange={(e) => setNewProductSku(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-sky-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Kategori:</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none"
                  >
                    <option value="">-- Kategori Seçin --</option>
                    {dbCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Alış Fiyatı (TL):</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.00"
                    value={newProductCost}
                    onChange={(e) => setNewProductCost(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Satış Fiyatı (TL):</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.00"
                    value={newProductSale}
                    onChange={(e) => setNewProductSale(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-emerald-400 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-semibold mb-1">Stok Miktarı:</label>
                  <input
                    type="number"
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 font-mono text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Ürün Görsel URL'si:</label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={newProductImageUrl}
                  onChange={(e) => setNewProductImageUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono focus:outline-none"
                />
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs py-2.5 rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg transition"
                >
                  Ürünü Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
