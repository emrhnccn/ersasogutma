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
  ShoppingCart,
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
  AlertCircle,
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
  Key,
  Sparkles,
  ArrowUpRight,
  Eye,
  SlidersHorizontal,
  CheckSquare,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { OrderStatus, BankAccount } from '@/types';
import { ScraperProgress, ScraperLog } from '@/lib/scrapers/types';
import { StockBadge } from '@/components/common/StockBadge';
import { ImageDropzone } from '@/components/common/ImageDropzone';

interface DBProduct {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  salePrice?: number;
  costPrice?: number;
  discountPercent?: number;
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
  sortOrder?: number;
  discountPercent?: number;
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
  const [activeTab, setActiveTab] = useState<'dashboard' | 'scraper' | 'products' | 'categories' | 'orders' | 'carts' | 'dealers' | 'bank_accounts' | 'audit'>('dashboard');

  // Live Carts State (Real PostgreSQL DB)
  const [adminCarts, setAdminCarts] = useState<any[]>([]);
  const [loadingAdminCarts, setLoadingAdminCarts] = useState(false);
  const [selectedAdminCart, setSelectedAdminCart] = useState<any | null>(null);
  const [cartSearchQuery, setCartSearchQuery] = useState('');

  // DB Products State (Paginated & Infinite Scroll)
  const [dbProducts, setDbProducts] = useState<DBProduct[]>([]);
  const [adminProductPage, setAdminProductPage] = useState(1);
  const [adminHasMoreProducts, setAdminHasMoreProducts] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [adminTotalProducts, setAdminTotalProducts] = useState(0);

  const [productSearch, setProductSearch] = useState('');
  const [productCategoryFilter, setProductCategoryFilter] = useState('ALL');
  const [productBrandFilter, setProductBrandFilter] = useState('ALL');
  const [adminMissingPriceFilter, setAdminMissingPriceFilter] = useState(false);
  const [adminBrandsList, setAdminBrandsList] = useState<any[]>([]);
  const [productSort, setProductSort] = useState('newest');

  const adminProductObserverTarget = React.useRef<HTMLDivElement>(null);

  // DB Orders State
  const [adminOrders, setAdminOrders] = useState<any[]>([]);
  const [loadingAdminOrders, setLoadingAdminOrders] = useState(false);
  const [adminOrderFilter, setAdminOrderFilter] = useState('ALL');

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
  const [newProductDiscount, setNewProductDiscount] = useState('0');
  const [newProductStock, setNewProductStock] = useState('10');
  const [newProductCategory, setNewProductCategory] = useState('');
  const [newProductImageUrl, setNewProductImageUrl] = useState('');

  // Edit Product Modal State
  const [editingProduct, setEditingProduct] = useState<DBProduct | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdSku, setEditProdSku] = useState('');
  const [editProdBarcode, setEditProdBarcode] = useState('');
  const [editProdCost, setEditProdCost] = useState('');
  const [editProdSale, setEditProdSale] = useState('');
  const [editProdDiscount, setEditProdDiscount] = useState('0');
  const [editProdStock, setEditProdStock] = useState('0');
  const [editProdCategory, setEditProdCategory] = useState('');
  const [editProdImageUrl, setEditProdImageUrl] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // New Category State
  const [newCatName, setNewCatName] = useState('');
  const [newCatParent, setNewCatParent] = useState('');
  const [newCatSortOrder, setNewCatSortOrder] = useState('0');
  const [newCatDiscount, setNewCatDiscount] = useState('0');

  // Edit Category Modal State
  const [editingCategory, setEditingCategory] = useState<DBCategory | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [editCatParent, setEditCatParent] = useState('');
  const [editCatSortOrder, setEditCatSortOrder] = useState('0');
  const [editCatDiscount, setEditCatDiscount] = useState('0');
  const [savingCategory, setSavingCategory] = useState(false);

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
  const [editCustomDiscount, setEditCustomDiscount] = useState('0');
  const [editCreditLimit, setEditCreditLimit] = useState('');

  // Dealer Drawer Manual Cari Form
  const [drawerDocNo, setDrawerDocNo] = useState('');
  const [drawerDocType, setDrawerDocType] = useState('MANUAL_DEBIT');
  const [drawerAmount, setDrawerAmount] = useState('');
  const [drawerNote, setDrawerNote] = useState('');
  const [submittingCari, setSubmittingCari] = useState(false);

  // Dealer Applications State (Başvurular)
  const [dealerApplications, setDealerApplications] = useState<any[]>([]);
  const [createdCredentialsModal, setCreatedCredentialsModal] = useState<{
    username: string;
    tempPassword: string;
    companyName: string;
    title: string;
  } | null>(null);

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
        setEditCustomDiscount(json.data.customDiscountPercent?.toString() || '0');
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

  // Fetch Live Carts from Real DB
  const loadAdminCarts = useCallback(async () => {
    setLoadingAdminCarts(true);
    try {
      const res = await fetch('/api/admin/carts');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAdminCarts(json.data);
      }
    } catch (err) {
      console.error('Failed to load admin carts:', err);
    } finally {
      setLoadingAdminCarts(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'carts') {
      loadAdminCarts();
    }
  }, [activeTab, loadAdminCarts]);

  // 1. Fetch Products (Paginated from Database)
  const loadAdminProducts = useCallback(async (targetPage: number, isNewFilter: boolean = false) => {
    if (isNewFilter) {
      setLoadingProducts(true);
    } else {
      setLoadingMoreProducts(true);
    }

    try {
      const params = new URLSearchParams();
      params.set('page', targetPage.toString());
      params.set('limit', '100');
      params.set('status', 'ALL');

      if (productCategoryFilter !== 'ALL') params.set('category', productCategoryFilter);
      if (productBrandFilter !== 'ALL') params.set('brand', productBrandFilter);
      if (productSearch.trim()) params.set('q', productSearch.trim());
      if (productSort) params.set('sort', productSort);
      if (adminMissingPriceFilter) params.set('missingPriceOnly', 'true');

      const res = await fetch(`/api/products?${params.toString()}`);
      const json = await res.json();

      if (json?.success && Array.isArray(json.data)) {
        setAdminTotalProducts(json.totalCount || 0);
        setAdminHasMoreProducts(Boolean(json.hasMore));
        setAdminProductPage(targetPage);

        setDbProducts((prev) => {
          if (isNewFilter || targetPage === 1) {
            return json.data;
          }
          const existingIds = new Set(prev.map((p) => p.id));
          const newItems = json.data.filter((p: any) => !existingIds.has(p.id));
          return [...prev, ...newItems];
        });
      }
    } catch (err) {
      console.error('Failed to load admin products:', err);
    } finally {
      setLoadingProducts(false);
      setLoadingMoreProducts(false);
    }
  }, [productCategoryFilter, productBrandFilter, productSearch, productSort, adminMissingPriceFilter]);

  // Fetch Brands for Admin Filtering
  const loadBrands = useCallback(async () => {
    try {
      const res = await fetch('/api/brands');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setAdminBrandsList(data.data);
      }
    } catch (err) {
      console.error('Brands load error:', err);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'products') {
      loadAdminProducts(1, true);
    }
  }, [activeTab, loadAdminProducts]);

  useEffect(() => {
    if (activeTab !== 'products' || !adminProductObserverTarget.current || !adminHasMoreProducts || loadingProducts || loadingMoreProducts) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && adminHasMoreProducts && !loadingProducts && !loadingMoreProducts) {
          loadAdminProducts(adminProductPage + 1, false);
        }
      },
      { rootMargin: '300px' }
    );

    observer.observe(adminProductObserverTarget.current);

    return () => {
      observer.disconnect();
    };
  }, [activeTab, adminHasMoreProducts, loadingProducts, loadingMoreProducts, adminProductPage, loadAdminProducts]);

  const loadProducts = useCallback(() => {
    return loadAdminProducts(1, true);
  }, [loadAdminProducts]);

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

  // 6. Fetch Live Database Orders
  const loadAdminOrders = useCallback(async () => {
    setLoadingAdminOrders(true);
    try {
      const res = await fetch('/api/b2b/orders?status=ALL');
      const data = await res.json();
      if (data?.success && Array.isArray(data.data)) {
        setAdminOrders(data.data);
      }
    } catch (err) {
      console.error('Failed to load admin orders:', err);
    } finally {
      setLoadingAdminOrders(false);
    }
  }, []);

  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/b2b/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.success) {
        showToast(`Sipariş durumu "${newStatus}" olarak güncellendi`, 'success');
        loadAdminOrders();
      } else {
        showToast(json.error || 'Sipariş güncellenemedi', 'error');
      }
    } catch {
      showToast('Bağlantı hatası', 'error');
    }
  };

  // 7. Poll Scraper Progress
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
    loadAdminOrders();
    loadBrands();
    checkScraperStatus();
  }, [loadProducts, loadCategories, loadBankAccounts, loadAuditLogs, loadDealerApplications, loadDealers, loadAdminOrders, loadBrands, checkScraperStatus]);

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

  // Handle Clean DB (P0 Security & Double Confirmation Guard)
  const handleCleanDatabase = async () => {
    const confirmation = window.prompt(
      'DİKKAT: Veritabanındaki tüm ürünler, kategoriler ve markalar kalıcı olarak SİLİNECEK.\n\nİşlemi onaylamak için lütfen "ERSA_RESET_CONFIRM_2026" yazın:'
    );

    if (confirmation !== 'ERSA_RESET_CONFIRM_2026') {
      showToast('Onay ifadesi hatalı veya iptal edildi. İşlem durduruldu.', 'warning');
      return;
    }

    const secondConfirm = window.confirm(
      'İKİNCİ ONAY: Bu işlem geri alınamaz ve tüm ilişkili verileri kalıcı olarak silecektir. Devam etmek istediğinize kesin olarak emin misiniz?'
    );
    if (!secondConfirm) {
      showToast('İkinci onay verilmedi. İşlem iptal edildi.', 'info');
      return;
    }

    setIsCleaningDb(true);
    try {
      const res = await fetch('/api/admin/clean-db', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmPhrase: 'ERSA_RESET_CONFIRM_2026',
          acknowledgedRisk: true
        })
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
          discountPercent: newProductDiscount ? parseFloat(newProductDiscount) : 0,
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
        setNewProductDiscount('0');
        setNewProductImageUrl('');
        loadAdminProducts(1, true);
      } else {
        showToast(data.error || 'Ürün eklenemedi.', 'error');
      }
    } catch {
      showToast('Bağlantı hatası.', 'error');
    }
  };

  // Open Edit Product Modal
  const openEditProductModal = (p: DBProduct) => {
    setEditingProduct(p);
    setEditProdName(p.name);
    setEditProdSku(p.sku);
    setEditProdBarcode(p.barcode || '');
    setEditProdCost(p.costPrice !== undefined && p.costPrice !== null ? p.costPrice.toString() : '');
    setEditProdSale(p.salePrice !== undefined && p.salePrice !== null ? p.salePrice.toString() : '');
    setEditProdDiscount(p.discountPercent !== undefined && p.discountPercent !== null ? p.discountPercent.toString() : '0');
    setEditProdStock(p.stockQty.toString());
    setEditProdCategory(p.category?.id || '');
    setEditProdImageUrl(p.images && p.images.length > 0 ? p.images[0].url : '');
  };

  // Handle Save Edit Product
  const handleSaveEditProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setSavingProduct(true);
    try {
      const res = await fetch(`/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editProdName,
          sku: editProdSku,
          barcode: editProdBarcode || null,
          costPrice: editProdCost ? parseFloat(editProdCost) : null,
          salePrice: editProdSale ? parseFloat(editProdSale) : null,
          discountPercent: editProdDiscount ? parseFloat(editProdDiscount) : 0,
          stockQty: parseInt(editProdStock, 10) || 0,
          categoryId: editProdCategory || null,
          imageUrl: editProdImageUrl || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Ürün bilgileri ve görseli başarıyla güncellendi!', 'success');
        setEditingProduct(null);
        loadAdminProducts(1, true);
      } else {
        showToast(data.error || 'Ürün güncellenemedi.', 'error');
      }
    } catch {
      showToast('Bağlantı hatası oluştu.', 'error');
    } finally {
      setSavingProduct(false);
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
          parentId: newCatParent || null,
          sortOrder: parseInt(newCatSortOrder, 10) || 0,
          discountPercent: parseFloat(newCatDiscount) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Kategori oluşturuldu.', 'success');
        setNewCatName('');
        setNewCatParent('');
        setNewCatSortOrder('0');
        setNewCatDiscount('0');
        loadCategories();
      }
    } catch {
      showToast('Hata oluştu.', 'error');
    }
  };

  // Open Edit Category Modal
  const openEditCategoryModal = (cat: DBCategory) => {
    setEditingCategory(cat);
    setEditCatName(cat.name);
    setEditCatParent(cat.parentId || '');
    setEditCatSortOrder((cat.sortOrder ?? 0).toString());
    setEditCatDiscount((cat.discountPercent ?? 0).toString());
  };

  // Handle Save Edit Category
  const handleSaveEditCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    setSavingCategory(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingCategory.id,
          name: editCatName,
          parentId: editCatParent || null,
          sortOrder: parseInt(editCatSortOrder, 10) || 0,
          discountPercent: parseFloat(editCatDiscount) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Kategori başarıyla güncellendi.', 'success');
        setEditingCategory(null);
        loadCategories();
      } else {
        showToast(data.error || 'Güncellenemedi.', 'error');
      }
    } catch {
      showToast('Hata oluştu.', 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  // Handle Move Category Up / Down
  const handleMoveCategory = async (catId: string, direction: 'up' | 'down') => {
    const idx = dbCategories.findIndex((c) => c.id === catId);
    if (idx === -1) return;
    if (direction === 'up' && idx === 0) return;
    if (direction === 'down' && idx === dbCategories.length - 1) return;

    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    const reordered = [...dbCategories];
    const [moved] = reordered.splice(idx, 1);
    reordered.splice(targetIdx, 0, moved);

    // Optimistic UI update with calculated sortOrders
    const payload = reordered.map((c, i) => ({ id: c.id, sortOrder: i + 1 }));
    setDbCategories(reordered.map((c, i) => ({ ...c, sortOrder: i + 1 })));

    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder: payload })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Kategori sıralaması kaydedildi.');
      } else {
        loadCategories();
      }
    } catch {
      showToast('Sıralama güncellenirken hata oluştu.', 'error');
      loadCategories();
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
      } else {
        showToast(data.error || 'Silinemedi.', 'error');
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

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-medium px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
              <span>B2B Yönetici Portalı</span>
            </span>
            <span className="text-emerald-600 text-xs font-semibold">v2.4 Canlı</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ersa Soğutma Yönetim Merkezi</h1>
          <p className="text-slate-500 text-xs max-w-2xl">
            Tedarikçi sitelerinden otomatik ürün çekin, ürün kataloğunu yönetin, siparişleri sevk edin ve bayi cari hesaplarını kontrol edin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchLiveRates(true)}
            disabled={isFetchingRates}
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingRates ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>Kurları Yenile</span>
          </button>

          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs transition"
          >
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            <span>Ziyaretçi Vitrini</span>
          </Link>

          <Link
            href="/bayi"
            target="_blank"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <UserCheck className="w-4 h-4" />
            <span>Bayi Portalı</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex bg-white border border-slate-200 p-1.5 rounded-2xl gap-1 overflow-x-auto shadow-xs scrollbar-thin">
        {[
          { id: 'dashboard', label: 'Genel Bakış', icon: Layers },
          { id: 'scraper', label: 'Tedarikçi Botu & Ürün Çekme', icon: Bot, highlight: true },
          { id: 'products', label: `Ürün Kataloğu (${adminTotalProducts > 0 ? adminTotalProducts.toLocaleString('tr-TR') : dbProducts.length})`, icon: Package },
          { id: 'categories', label: `Kategoriler (${dbCategories.length})`, icon: FolderTree },
          { id: 'orders', label: `Siparişler (${adminOrders.length})`, icon: ShoppingBag, highlight: adminOrders.some(o => o.status === 'PENDING_APPROVAL' || o.status === 'PENDING') },
          { id: 'carts', label: `Canlı Sepetler (${adminCarts.length})`, icon: ShoppingCart, highlight: adminCarts.length > 0 },
          { id: 'dealers', label: 'Bayi Cari & İskonto', icon: UserCheck },
          { id: 'bank_accounts', label: `Banka Hesapları (${bankAccounts.length})`, icon: Building2, highlight: bankAccounts.length === 0 },
          { id: 'audit', label: `Güvenlik & Audit Log (${auditLogs.length})`, icon: ShieldCheck }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : tab.highlight
                  ? 'text-amber-600 hover:bg-amber-50'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : tab.highlight ? 'text-amber-500' : 'text-slate-400'}`} />
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
          {/* Operational Alert Banner: Bank Accounts */}
          {bankAccounts.length === 0 && !loadingBanks && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-300 text-xs shadow-lg">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                <div>
                  <strong className="block text-white font-bold">Operasyonel Uyarı: Sistemde aktif banka hesabı tanımlı değil!</strong>
                  <span>Bayileriniz havale/EFT seçeneğiyle sipariş veremez. Lütfen şirket IBAN bilgilerinizi ekleyiniz.</span>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('bank_accounts')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl transition shrink-0 text-xs shadow-xs"
              >
                Hesap Ekle
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Veritabanındaki Ürün</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">
                  {adminTotalProducts > 0 ? adminTotalProducts.toLocaleString('tr-TR') : dbProducts.length} Adet
                </h3>
                <span className="text-[10px] text-emerald-600 font-medium">Aktif B2B Kataloğu</span>
              </div>
              <div className="w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600">
                <Package className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Tanımlı Kategori</span>
                <h3 className="text-2xl font-black text-slate-900 mt-1">{dbCategories.length} Grup</h3>
                <span className="text-[10px] text-blue-600 font-medium">Hiyerarşik Ağaç</span>
              </div>
              <div className="w-12 h-12 bg-purple-50 border border-purple-100 rounded-2xl flex items-center justify-center text-purple-600">
                <FolderTree className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">TCMB Dolar Kuru</span>
                <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">
                  {exchangeRates.USD_TRY ? `${exchangeRates.USD_TRY.toFixed(4)} ₺` : '...'}
                </h3>
                <span className="text-[10px] text-slate-500 font-mono">EUR: {exchangeRates.EUR_TRY?.toFixed(4)} ₺</span>
              </div>
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 uppercase font-bold tracking-wider">Bekleyen Sipariş</span>
                <h3 className="text-2xl font-black text-amber-600 mt-1">
                  {adminOrders.filter((o) => o.status === 'PENDING_APPROVAL' || o.status === 'PENDING').length} Sipariş
                </h3>
                <span className="text-[10px] text-slate-500">Toplam {adminOrders.length} Sipariş</span>
              </div>
              <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600">
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

            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs p-5 rounded-2xl shadow-xl space-y-3">
              <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
                <Package className="w-5 h-5" />
                <span>Ürün ve Stok Yönetimi</span>
              </div>
              <p className="text-xs text-slate-400">
                Ürünlerin fiyatlarını, kâr marjlarını ve stok durumlarını canlı olarak yönetin.
              </p>
              <button
                onClick={() => setActiveTab('products')}
                className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 font-bold text-xs py-2.5 rounded-xl transition flex items-center justify-center gap-2"
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
            <div className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                <Bot className="w-5 h-5 text-amber-400" />
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">Tedarikçi Botu & Ürün Çekme</h2>
                  <span className="text-[11px] text-slate-400">Modüler tedarikçi entegrasyonu</span>
                </div>
              </div>

              <form onSubmit={handleStartScraper} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Tedarikçi Kaynağı (URL):</label>
                  <div className="space-y-2">
                    <input
                      type="url"
                      required
                      placeholder="https://www.ersaticaret.com"
                      value={scrapeTargetUrl}
                      onChange={(e) => setScrapeTargetUrl(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-amber-500"
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
                            : 'bg-slate-50 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 border-slate-800 hover:text-white'
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
                            : 'bg-slate-50 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        girdap.com.tr
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Kullanıcı Adı:</label>
                    <input
                      type="text"
                      value={scrapeUsername}
                      onChange={(e) => setScrapeUsername(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Şifre:</label>
                    <input
                      type="password"
                      value={scrapePassword}
                      onChange={(e) => setScrapePassword(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Maksimum Çekilecek Ürün Limiti:</label>
                  <input
                    type="number"
                    value={scrapeMaxLimit}
                    onChange={(e) => setScrapeMaxLimit(e.target.value)}
                    placeholder="Boş Bırakılırsa Tüm 2.375 Ürün Çekilir"
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                  />
                  <span className="text-[10px] text-slate-500 block mt-1">
                    * Tüm ürünleri almak için bu alanı boş bırakabilirsiniz.
                  </span>
                </div>

                <div className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1">
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

            <div className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${isScrapingActive ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Canlı Bot Durumu & İlerleme</h3>
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
                  <div className="w-full bg-slate-100 dark:bg-slate-950 rounded-full h-3 p-0.5 border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${scraperProgress?.percent || 0}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Taranan Kategori</span>
                    <span className="text-base font-black text-slate-900 dark:text-white font-mono">{scraperProgress?.processedCategories || 0} / {scraperProgress?.totalCategories || 0}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-center">
                    <span className="text-[10px] text-slate-500 uppercase font-bold block">Aktarılan Ürün</span>
                    <span className="text-base font-black text-emerald-400 font-mono">{scraperProgress?.importedProducts || 0}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-3 rounded-xl text-center">
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
                <div className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl p-3 h-52 overflow-y-auto font-mono text-[11px] space-y-1.5 text-slate-300">
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

      {/* TAB 3: PRODUCTS (Paginated Database Infinite Scroll) */}
      {activeTab === 'products' && (
        <div className="space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs p-4 rounded-2xl shadow-lg">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Ürün adı, SKU veya barkod ile ara..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <select
                value={productCategoryFilter}
                onChange={(e) => setProductCategoryFilter(e.target.value)}
                className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">Tüm Kategoriler</option>
                {dbCategories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <select
                value={productBrandFilter}
                onChange={(e) => setProductBrandFilter(e.target.value)}
                className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">Tüm Markalar ({adminBrandsList.length})</option>
                {adminBrandsList.map((b) => (
                  <option key={b.id || b.name} value={b.name}>{b.name} ({b.productCount})</option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => setAdminMissingPriceFilter(!adminMissingPriceFilter)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                  adminMissingPriceFilter
                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Fiyatı Eksik Ürünler</span>
              </button>

              <select
                value={productSort}
                onChange={(e) => setProductSort(e.target.value)}
                className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              >
                <option value="newest">En Yeniler</option>
                <option value="price_asc">Fiyat: Düşükten Yükseğe</option>
                <option value="price_desc">Fiyat: Yüksekten Düşüğe</option>
                <option value="name_asc">İsim: A - Z</option>
                <option value="stock_desc">Stok: Çoktan Aza</option>
              </select>

              <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
                Toplam: <strong className="text-sky-400">{adminTotalProducts.toLocaleString('tr-TR')}</strong> Ürün
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadAdminProducts(1, true)}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition"
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

          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl shadow-xl overflow-hidden">
            {loadingProducts && dbProducts.length === 0 ? (
              <div className="py-20 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
                <span>Ürünler veritabanından çekiliyor...</span>
              </div>
            ) : dbProducts.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <Package className="w-12 h-12 text-slate-600 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Ürün Bulunamadı</h3>
                <p className="text-xs text-slate-400">
                  {productSearch ? 'Arama kriterlerinize uygun ürün yok.' : 'Henüz ürün eklenmemiş. Tedarikçi botu ile ürünleri içeri aktarabilirsiniz.'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left text-slate-300">
                  <thead className="bg-slate-50 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3.5">Görsel</th>
                      <th className="p-3.5">Ürün Adı & Kategori</th>
                      <th className="p-3.5">SKU / Barkod</th>
                      <th className="p-3.5">Alış Fiyatı</th>
                      <th className="p-3.5">Satış Fiyatı (TL)</th>
                      <th className="p-3.5">İskonto (%)</th>
                      <th className="p-3.5">Stok Adedi</th>
                      <th className="p-3.5 text-center">Durum</th>
                      <th className="p-3.5 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/60 font-medium">
                    {dbProducts.map((p) => {
                      const imgUrl = p.images && p.images.length > 0 ? p.images[0].url : '/placeholder.svg';
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                          <td className="p-3.5">
                            <img
                              src={imgUrl}
                              alt={p.name}
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/placeholder.svg';
                              }}
                              className="w-10 h-10 object-cover rounded-lg bg-white p-0.5 border border-slate-700"
                            />
                          </td>
                          <td className="p-3.5 max-w-sm">
                            <div className="font-bold text-slate-900 dark:text-white line-clamp-1">{p.name}</div>
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
                            <div className="flex items-center gap-1.5">
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
                                className={`w-24 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white px-2 py-1 font-mono font-bold text-xs focus:outline-none ${
                                  !p.salePrice || Number(p.salePrice) <= 0
                                    ? 'border-amber-500/60 text-amber-400 focus:border-amber-400'
                                    : 'border-slate-700 text-emerald-400 focus:border-emerald-500'
                                }`}
                              />
                              {(!p.salePrice || Number(p.salePrice) <= 0) && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-bold text-[9px] border border-amber-500/30 whitespace-nowrap">
                                  Fiyat Yok
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="1"
                                min="0"
                                max="100"
                                defaultValue={p.discountPercent || 0}
                                onBlur={(e) => {
                                  const val = parseFloat(e.target.value);
                                  if (!isNaN(val) && val !== Number(p.discountPercent)) {
                                    handleUpdateProductInline(p.id, { discountPercent: val });
                                  }
                                }}
                                className="w-16 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-mono font-bold text-rose-400 text-xs focus:outline-none focus:border-rose-500"
                              />
                              <span className="text-slate-500 text-[10px]">%</span>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                defaultValue={p.stockQty}
                                onBlur={(e) => {
                                  const val = parseInt(e.target.value, 10);
                                  if (!isNaN(val) && val !== p.stockQty) {
                                    handleUpdateProductInline(p.id, { stockQty: val });
                                  }
                                }}
                                className="w-16 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 font-mono text-slate-900 dark:text-white text-xs focus:outline-none"
                              />
                              <StockBadge stock={p.stockQty} size="sm" showIcon={false} />
                            </div>
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
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => openEditProductModal(p)}
                                className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition"
                                title="Ürünü Düzenle (İsim, Görsel, SKU, İskonto)"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id, p.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                                title="Ürünü Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Infinite Scroll Sentinel for Admin */}
                <div ref={adminProductObserverTarget} className="py-6 text-center border-t border-slate-200 dark:border-slate-800/40">
                  {loadingMoreProducts && (
                    <div className="inline-flex items-center gap-2 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 text-sky-400 text-xs font-bold px-4 py-2 rounded-xl shadow-lg animate-pulse">
                      <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                      <span>Daha fazla ürün yükleniyor...</span>
                    </div>
                  )}
                  {!adminHasMoreProducts && dbProducts.length > 0 && (
                    <div className="text-xs text-slate-500 font-medium">
                      Tüm ürünler listelendi ({dbProducts.length} / {adminTotalProducts})
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Yeni Kategori Ekle</span>
            </h3>

            <form onSubmit={handleCreateCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Kategori Adı:</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Soğutma Kompresörleri"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Üst Kategori (Opsiyonel):</label>
                <select
                  value={newCatParent}
                  onChange={(e) => setNewCatParent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Ana Kategori (Üst Kategori Yok) --</option>
                  {dbCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Sıra Numarası:</label>
                  <input
                    type="number"
                    placeholder="1, 2, 3..."
                    value={newCatSortOrder}
                    onChange={(e) => setNewCatSortOrder(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">İskonto Oranı (%):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="Örn: 20"
                    value={newCatDiscount}
                    onChange={(e) => setNewCatDiscount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-rose-400 font-bold focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2.5 rounded-xl transition shadow-lg"
              >
                Kategori Kaydet
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-purple-400" />
                  <span>Kategori Yönetimi & Sıralama ({dbCategories.length})</span>
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Ok butonları ile kategorilerin sıralamasını ayarlayabilir, düzenle butonu ile isim ve iskonto güncelleyebilirsiniz.
                </p>
              </div>
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
                {dbCategories.map((c, idx) => (
                  <div
                    key={c.id}
                    className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-200 dark:border-slate-800/80 p-3 rounded-xl flex items-center justify-between text-xs hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-3">
                      {/* Move Up / Down Buttons */}
                      <div className="flex flex-col gap-0.5">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveCategory(c.id, 'up')}
                          className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 rounded transition"
                          title="Yukarı Taşı"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === dbCategories.length - 1}
                          onClick={() => handleMoveCategory(c.id, 'down')}
                          className="p-1 text-slate-400 hover:text-sky-400 hover:bg-slate-800 disabled:opacity-30 disabled:hover:text-slate-400 rounded transition"
                          title="Aşağı Taşı"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-800">
                            #{c.sortOrder && c.sortOrder > 0 ? c.sortOrder : idx + 1}
                          </span>
                          <span>{c.name}</span>
                          {c.discountPercent !== undefined && Number(c.discountPercent) > 0 && (
                            <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-1.5 py-0.2 rounded-full font-bold">
                              %{c.discountPercent} İskonto
                            </span>
                          )}
                          {c._count?.products !== undefined && (
                            <span className="text-[10px] bg-slate-800 text-sky-400 px-2 py-0.2 rounded-full font-mono">
                              {c._count.products} Ürün
                            </span>
                          )}
                        </div>
                        {c.parent && (
                          <span className="text-[10px] text-slate-500">Üst Kategori: {c.parent.name}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditCategoryModal(c)}
                        className="p-1.5 text-slate-400 hover:text-sky-400 hover:bg-slate-800 rounded-lg transition"
                        title="Kategori İsmi ve İskontoyu Düzenle"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(c.id, c.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition"
                        title="Kategoriyi Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: ORDERS (Live PostgreSQL Database Orders) */}
      {activeTab === 'orders' && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-sky-400" />
                <span>Bayi Sipariş Onay & Sevkiyat Yönetimi</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Veritabanından canlı bayi siparişleri, ödeme türleri ve kargo sevkiyat durumları
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={adminOrderFilter}
                onChange={(e) => setAdminOrderFilter(e.target.value)}
                className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-sky-500"
              >
                <option value="ALL">Tüm Durumlar ({adminOrders.length})</option>
                <option value="PENDING_APPROVAL">⏳ Onay Bekleyenler</option>
                <option value="APPROVED">✅ Onaylananlar</option>
                <option value="SHIPPED">🚚 Sevkiyatta / Kargoda</option>
                <option value="DELIVERED">📦 Teslim Edilenler</option>
                <option value="CANCELLED">❌ İptal Edilenler</option>
              </select>

              <button
                onClick={loadAdminOrders}
                className="p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl border border-slate-200 dark:border-slate-700 transition"
                title="Yenile"
              >
                <RefreshCw className={`w-4 h-4 ${loadingAdminOrders ? 'animate-spin text-sky-400' : ''}`} />
              </button>
            </div>
          </div>

          {loadingAdminOrders && adminOrders.length === 0 ? (
            <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
              <span>Siparişler yükleniyor...</span>
            </div>
          ) : adminOrders.filter(o => adminOrderFilter === 'ALL' || o.status === adminOrderFilter).length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-700 mx-auto" />
              <p>Kriterlere uygun sipariş kaydı bulunmamaktadır.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {adminOrders
                .filter(o => adminOrderFilter === 'ALL' || o.status === adminOrderFilter)
                .map((order) => {
                  const isCari = order.paymentMethod === 'CARI';
                  const formattedDate = new Date(order.createdAt).toLocaleString('tr-TR');

                  return (
                    <div
                      key={order.id}
                      className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 text-xs hover:border-slate-700 transition shadow-lg"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800/80 pb-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono font-bold text-sky-400 text-sm">#{order.orderNumber}</span>
                            <span className="text-slate-400 text-[11px]">({formattedDate})</span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                              isCari ? 'bg-sky-500/10 text-sky-300 border-sky-500/20' : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                            }`}>
                              {isCari ? 'Cari Hesap Açık Hesap' : 'Kredi Kartı / Sanal POS (Peşin)'}
                            </span>
                          </div>
                          <div className="text-slate-300 font-semibold text-xs">
                            Bayi: <strong className="text-slate-900 dark:text-white">{order.companyName}</strong> ({order.userName})
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-slate-400 block text-[10px]">Genel Toplam (KDV Dahil):</span>
                          <span className="font-mono font-black text-emerald-400 text-base">
                            {formatCurrency(order.grandTotal)}
                          </span>
                        </div>
                      </div>

                      {/* Items */}
                      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-xl p-3 border border-slate-200 dark:border-slate-800/60 space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 block">Sipariş Kalemleri ({order.items?.length || 0} Ürün):</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {order.items?.map((item: any) => (
                            <div key={item.id} className="flex items-center gap-2.5 bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px]">
                              <img
                                src={item.image || '/placeholder.svg'}
                                alt=""
                                className="w-8 h-8 object-cover rounded bg-white p-0.5 border border-slate-700 flex-shrink-0"
                                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-semibold text-slate-900 dark:text-white truncate">{item.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">
                                  {item.sku} • {item.quantity} {item.unit || 'ADET'} × {formatCurrency(item.unitNetExVat)}
                                </div>
                              </div>
                              <div className="font-mono font-bold text-emerald-400 text-right">
                                {formatCurrency(item.lineGross)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {order.orderNote && (
                        <div className="bg-amber-50/50 dark:bg-slate-900 p-2.5 rounded-xl border border-amber-200 dark:border-slate-800 text-[11px] text-amber-800 dark:text-amber-300">
                          <strong>Bayi Sipariş Notu:</strong> {order.orderNote}
                        </div>
                      )}

                      {/* Actions & Status Bar */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-3 border-t border-slate-900 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-slate-400 font-semibold">Mevcut Durum:</span>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            order.status === 'APPROVED' || order.status === 'DELIVERED'
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                              : order.status === 'SHIPPED' || order.status === 'PREPARING'
                              ? 'bg-sky-500/20 text-sky-300 border-sky-500/30'
                              : order.status === 'CANCELLED'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                              : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {order.status}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'APPROVED')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              order.status === 'APPROVED' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            Onayla
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'SHIPPED')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              order.status === 'SHIPPED' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            Sevkiyata Ver
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'DELIVERED')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              order.status === 'DELIVERED' ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-300 hover:text-white'
                            }`}
                          >
                            Teslim Edildi
                          </button>

                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(order.id, 'CANCELLED')}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                              order.status === 'CANCELLED' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-rose-400 hover:bg-rose-950'
                            }`}
                          >
                            İptal Et
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}

      {/* TAB: LIVE CARTS (CANLI SEPETLER) */}
      {activeTab === 'carts' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Aktif Bayi Canlı Sepetleri</span>
                    <span className="text-xs bg-cyan-500/20 text-cyan-400 font-mono px-2 py-0.5 rounded-full border border-cyan-500/30">
                      {adminCarts.length} Aktif Sepet
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Bayilerin veritabanındaki canlı sepetleri, anlık adetler, bayiye özel hesaplanmış tutarlar ve stok uyarıları
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Bayi adı, kullanıcı veya ürün ara..."
                    value={cartSearchQuery}
                    onChange={(e) => setCartSearchQuery(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
                  />
                </div>
                <button
                  onClick={loadAdminCarts}
                  disabled={loadingAdminCarts}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAdminCarts ? 'animate-spin text-cyan-400' : ''}`} />
                  <span>Yenile</span>
                </button>
              </div>
            </div>

            {loadingAdminCarts ? (
              <div className="p-12 text-center text-xs text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400 mx-auto mb-2" />
                <span>Canlı sepet verileri yükleniyor...</span>
              </div>
            ) : adminCarts.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80">
                Şu anda sistemde ürün eklenmiş aktif bir bayi sepeti bulunmuyor.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Bayi Bilgisi</th>
                      <th className="py-3 px-4">İletişim</th>
                      <th className="py-3 px-4 text-center">Özel İskonto</th>
                      <th className="py-3 px-4 text-center">Ürün / Adet</th>
                      <th className="py-3 px-4 text-right">Sepet Toplamı</th>
                      <th className="py-3 px-4 text-center">Stok Durumu</th>
                      <th className="py-3 px-4 text-center">Son Güncelleme</th>
                      <th className="py-3 px-4 text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/60">
                    {adminCarts
                      .filter((c) => {
                        if (!cartSearchQuery.trim()) return true;
                        const q = cartSearchQuery.toLowerCase();
                        return (
                          c.dealer.companyName.toLowerCase().includes(q) ||
                          c.dealer.username.toLowerCase().includes(q) ||
                          c.items.some((i: any) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q))
                        );
                      })
                      .map((cart) => (
                        <tr key={cart.cartId} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group">
                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-sky-400">{cart.dealer.username}</div>
                            <div className="font-bold text-slate-900 dark:text-white text-sm">{cart.dealer.companyName}</div>
                            <div className="text-[10px] text-slate-500">VN: {cart.dealer.taxNo}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="text-slate-300 font-semibold">{cart.dealer.contactName}</div>
                            <div className="text-slate-500 text-[11px] font-mono">{cart.dealer.phone}</div>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                              %{cart.dealer.customDiscountPercent || 0}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono">
                            <span className="font-bold text-slate-900 dark:text-white">{cart.summary.distinctItemCount} Çeşit</span>
                            <span className="text-slate-500 block text-[10px]">Toplam {cart.summary.totalQuantity} Adet</span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="font-mono font-black text-emerald-400 text-sm">
                              {formatCurrency(cart.summary.totalAmountTRY)}
                            </div>
                            <span className="text-[10px] text-slate-500">+ KDV Dahil</span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {cart.summary.hasOverStock ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Stok Yetersiz</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Stoklar Uygun</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-[11px] text-slate-400">
                            {new Date(cart.updatedAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => setSelectedAdminCart(cart)}
                              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-lg text-xs transition flex items-center gap-1 ml-auto shadow cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Sepet Detayı</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Interactive Modal for Cart Details */}
          {selectedAdminCart && (
            <div className="fixed inset-0 z-50 bg-black/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-bold text-sm">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-slate-900 dark:text-white">{selectedAdminCart.dealer.companyName}</h3>
                      <p className="text-xs text-slate-400 font-mono">
                        {selectedAdminCart.dealer.username} • Özel İskonto: %{selectedAdminCart.dealer.customDiscountPercent || 0} • Tel: {selectedAdminCart.dealer.phone}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAdminCart(null)}
                    className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 space-y-4">
                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <span className="text-xs text-slate-400">Toplam Sepet Kalem / Adet:</span>
                      <div className="text-sm font-bold text-slate-900 dark:text-white font-mono">
                        {selectedAdminCart.summary.distinctItemCount} Çeşit • {selectedAdminCart.summary.totalQuantity} Adet
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400">Bayiye Özel Sepet Toplamı:</span>
                      <div className="text-xl font-black font-mono text-emerald-400">
                        {formatCurrency(selectedAdminCart.summary.totalAmountTRY)}
                      </div>
                    </div>
                  </div>

                  <div className="border border-slate-800 rounded-2xl overflow-hidden divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80">
                    {selectedAdminCart.items.map((item: any) => (
                      <div key={item.id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-xl object-cover bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 shrink-0"
                            onError={(e) => { (e.target as any).src = '/placeholder.svg'; }}
                          />
                          <div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">{item.name}</div>
                            <div className="text-[10px] font-mono text-sky-400 mt-0.5">SKU: {item.sku}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">
                              Liste: {formatCurrency(item.basePriceTRY)} • Bayi Fiyatı: <strong className="text-emerald-400">{formatCurrency(item.unitPriceTRY)}</strong>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                          <div className="text-center">
                            <span className="text-[10px] text-slate-400 block mb-0.5">Stok Durumu</span>
                            <StockBadge stock={item.stockQty} unit={item.unit} />
                          </div>

                          <div className="text-center font-mono">
                            <span className="text-[10px] text-slate-400 block mb-0.5">Sepetteki Adet</span>
                            <span className={`text-sm font-bold ${item.isOverStock ? 'text-rose-400' : 'text-white'}`}>
                              {item.quantity} {item.unit}
                            </span>
                            {item.isOverStock && (
                              <span className="text-[9px] text-rose-400 font-bold block">Stoktan Fazla!</span>
                            )}
                          </div>

                          <div className="text-right min-w-[100px]">
                            <span className="text-[10px] text-slate-400 block mb-0.5">Satır Toplamı</span>
                            <div className="font-mono font-black text-emerald-400 text-sm">
                              {formatCurrency(item.totalTRY)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex justify-end">
                  <button
                    onClick={() => setSelectedAdminCart(null)}
                    className="px-5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Kapat
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 7: DEALERS & APPLICATIONS */}
      {activeTab === 'dealers' && (
        <div className="space-y-8">
          
          {/* Section 1: Dealer Applications (Bayilik Başvuruları) */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
                  <thead className="bg-slate-50 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Firma Ünvanı & Yetkili</th>
                      <th className="py-3 px-4">İletişim & Konum</th>
                      <th className="py-3 px-4">Vergi Bilgileri</th>
                      <th className="py-3 px-4">Başvuru Notu</th>
                      <th className="py-3 px-4">Tarih / Durum</th>
                      <th className="py-3 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/60">
                    {dealerApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{app.companyName}</div>
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
                                      loadDealers();
                                      if (data.credentials) {
                                        setCreatedCredentialsModal({
                                          username: data.credentials.username,
                                          tempPassword: data.credentials.tempPassword,
                                          companyName: app.companyName,
                                          title: 'Yeni Bayi Hesabı Açıldı'
                                        });
                                      }
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
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-sky-400" />
                  <span>Kayıtlı Bayiler & Cari Yönetimi ({dealersList.length})</span>
                </h2>
                <p className="text-xs text-slate-400">Veritabanındaki gerçek bayileri, cari bakiyelerini, kredi limitlerini ve canlı sepetlerini yönetin</p>
              </div>
              <button
                onClick={loadDealers}
                disabled={loadingDealers}
                className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
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
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 dark:bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-200 dark:border-slate-800/80">
                Kayıtlı bayi bulunamadı. Yukarıdaki başvurulardan bayilik onaylayarak yeni bayi oluşturabilirsiniz.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Bayi Kodu & Ünvan</th>
                      <th className="py-3 px-4">Yetkili & İletişim</th>
                      <th className="py-3 px-4">Özel İskonto</th>
                      <th className="py-3 px-4">Kredi Limiti</th>
                      <th className="py-3 px-4">Cari Bakiye</th>
                      <th className="py-3 px-4">Kullanılabilir Limit</th>
                      <th className="py-3 px-4">Siparişler</th>
                      <th className="py-3 px-4">Durum</th>
                      <th className="py-3 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/60">
                    {dealersList.map((dealer) => (
                      <tr key={dealer.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-mono font-bold text-sky-400">{dealer.dealerCode}</div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">{dealer.companyName}</div>
                          <div className="text-[10px] text-slate-500">Kayıt: {dealer.registeredAt}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="text-slate-300 font-semibold">{dealer.contactPerson}</div>
                          <div className="text-slate-500 text-[11px]">{dealer.phone}</div>
                          <div className="text-slate-500 text-[10px]">{dealer.email}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-bold text-xs bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            %{dealer.customDiscountPercent || 0}
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
                          <div className="font-bold text-slate-900 dark:text-white">{dealer.totalOrders} Sipariş</div>
                          <div className="text-[10px] text-slate-500">Son: {dealer.lastOrderDate}</div>
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
            <div className="fixed inset-0 z-50 bg-black/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
                {/* Modal Header */}
                <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-bold text-sm">
                      {selectedDealerDetail.legalName?.slice(0, 2).toUpperCase() || 'ER'}
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 dark:text-white">{selectedDealerDetail.legalName}</h2>
                      <p className="text-xs text-slate-400 font-mono">
                        {selectedDealerDetail.user?.username} • Özel İskonto: %{selectedDealerDetail.customDiscountPercent || 0} • {selectedDealerDetail.phone}
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
                <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 px-5 gap-2">
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
                              customDiscountPercent: parseFloat(editCustomDiscount) || 0,
                              creditLimit: parseFloat(editCreditLimit) || 0
                            })
                          });
                          const json = await res.json();
                          if (json.success) {
                            showToast('Bayi bilgileri, iskonto ve limit başarıyla güncellendi!', 'success');
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
                      <div className="md:col-span-2 bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <span className="text-slate-400 block text-[11px] font-semibold">Bayi Giriş Kullanıcı Adı:</span>
                          <span className="text-sm font-mono font-bold text-sky-400">
                            {selectedDealerDetail.user?.username || selectedDealerDetail.dealerCode}
                          </span>
                          <span className="text-[10px] text-slate-500 block mt-0.5">
                            Giriş Rolü: {selectedDealerDetail.user?.role || 'B2B_DEALER'} • Son Giriş: {selectedDealerDetail.user?.lastLoginAt ? new Date(selectedDealerDetail.user.lastLoginAt).toLocaleString('tr-TR') : 'Henüz Giriş Yapılmadı'}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            try {
                              const res = await fetch(`/api/admin/dealers/${selectedDealerDetail.id}/reset-password`, {
                                method: 'POST'
                              });
                              const json = await res.json();
                              if (json.success) {
                                setCreatedCredentialsModal({
                                  username: json.username,
                                  tempPassword: json.tempPassword,
                                  companyName: selectedDealerDetail.legalName,
                                  title: 'Yeni Geçici Şifre Oluşturuldu'
                                });
                              } else {
                                showToast(json.error || 'Şifre sıfırlanamadı', 'error');
                              }
                            } catch {
                              showToast('İşlem sırasında hata oluştu', 'error');
                            }
                          }}
                          className="px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 shadow"
                        >
                          <Key className="w-3.5 h-3.5" />
                          <span>Yeni Geçici Şifre Üret</span>
                        </button>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 mb-1 font-semibold">Firma Resmi Ünvanı:</label>
                        <input
                          type="text"
                          required
                          value={editLegalName}
                          onChange={(e) => setEditLegalName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 mb-1 font-semibold">Bayi Özel İskonto Oranı (%):</label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            placeholder="0.00"
                            value={editCustomDiscount}
                            onChange={(e) => setEditCustomDiscount(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl pl-3 pr-8 py-2 text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                          />
                          <span className="absolute right-3 top-2 text-slate-500 font-bold">%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">Bayiye özel uygulanacak net indirim yüzdesi (0.00 - 100.00)</p>
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 mb-1 font-semibold">Vergi Dairesi:</label>
                        <input
                          type="text"
                          value={editTaxOffice}
                          onChange={(e) => setEditTaxOffice(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 mb-1 font-semibold">Vergi No / T.C. Kimlik:</label>
                        <input
                          type="text"
                          value={editTaxNo}
                          onChange={(e) => setEditTaxNo(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 mb-1 font-semibold">Telefon Numarası:</label>
                        <input
                          type="text"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 mb-1 font-semibold">E-posta Adresi:</label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => setEditEmail(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 mb-1 font-semibold">Tanımlı Kredi Limiti (TL):</label>
                        <input
                          type="number"
                          value={editCreditLimit}
                          onChange={(e) => setEditCreditLimit(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 mb-1 font-semibold">Hesap Durumu:</label>
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
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
                        <div className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
                          <span className="text-slate-400 block mb-1">Cari Bakiye (Borç)</span>
                          <span className="text-base font-black text-rose-400 font-mono">
                            {formatCurrency(selectedDealerDetail.finance?.currentBalance || 0)}
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
                          <span className="text-slate-400 block mb-1">Kredi Limiti</span>
                          <span className="text-base font-black text-emerald-400 font-mono">
                            {formatCurrency(selectedDealerDetail.finance?.creditLimit || 0)}
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
                          <span className="text-slate-400 block mb-1">Kullanılabilir Limit</span>
                          <span className="text-base font-black text-cyan-400 font-mono">
                            {formatCurrency(selectedDealerDetail.finance?.availableCredit || 0)}
                          </span>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
                          <span className="text-slate-400 block mb-1">Toplam İşlem Adedi</span>
                          <span className="text-base font-black text-slate-200 font-mono">
                            {selectedDealerDetail.finance?.transactions?.length || 0}
                          </span>
                        </div>
                      </div>

                      {/* Add Transaction Form */}
                      <div className="bg-slate-50 dark:bg-[#0B1120]/60 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl space-y-3">
                        <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
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
                            <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 mb-1">İşlem Türü:</label>
                            <select
                              value={drawerDocType}
                              onChange={(e) => setDrawerDocType(e.target.value)}
                              className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                            >
                              <option value="MANUAL_DEBIT">Manuel Borç (Fatura / Satış)</option>
                              <option value="MANUAL_CREDIT">Tahsilat / Ödeme (Alacak)</option>
                              <option value="CORRECTION">Bakiye Düzeltme</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 mb-1">Tutar (TL):</label>
                            <input
                              type="number"
                              required
                              placeholder="0.00"
                              value={drawerAmount}
                              onChange={(e) => setDrawerAmount(e.target.value)}
                              className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl px-3 py-2 text-emerald-400 font-mono font-bold focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 mb-1">Evrak / Dekont No:</label>
                            <input
                              type="text"
                              placeholder="Örn: DEK-2026-001"
                              value={drawerDocNo}
                              onChange={(e) => setDrawerDocNo(e.target.value)}
                              className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 mb-1">Açıklama / Not:</label>
                            <input
                              type="text"
                              placeholder="Örn: Havale ile tahsilat"
                              value={drawerNote}
                              onChange={(e) => setDrawerNote(e.target.value)}
                              className="w-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 shadow-xs rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
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
                          <thead className="bg-slate-50 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="py-2.5 px-3">Tarih</th>
                              <th className="py-2.5 px-3">Tür</th>
                              <th className="py-2.5 px-3">Evrak / Açıklama</th>
                              <th className="py-2.5 px-3 text-right">Tutar</th>
                              <th className="py-2.5 px-3 text-right">Son Bakiye</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/60">
                            {selectedDealerDetail.finance?.transactions?.map((t: any) => (
                              <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
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
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Bayinin Aktif Veritabanı Sepeti ({selectedDealerDetail.cart?.items?.length || 0} Kalem)
                        </span>
                        <span className="font-mono text-emerald-400 font-bold text-sm">
                          {formatCurrency(selectedDealerDetail.cart?.items?.reduce((sum: number, i: any) => sum + (i.quantity * i.salePrice), 0) || 0)}
                        </span>
                      </div>

                      {!selectedDealerDetail.cart || selectedDealerDetail.cart.items.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-800">
                          Bayinin sepeti şu anda boş.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 border border-slate-800 rounded-2xl overflow-hidden">
                          {selectedDealerDetail.cart.items.map((item: any) => (
                            <div key={item.id} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-1 shrink-0 overflow-hidden">
                                  <img
                                    src={item.image || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'}
                                    alt={item.name}
                                    className="w-full h-full object-cover rounded-lg"
                                    onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80'; }}
                                  />
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 dark:text-white text-xs">{item.name}</div>
                                  <div className="text-[10px] font-mono text-sky-400 mt-0.5">{item.sku}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-slate-400">Birim: {formatCurrency(item.salePrice)} + KDV</span>
                                    <StockBadge stock={item.stockQty} unit={item.unit} size="sm" />
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-lg p-1">
                                  <button
                                    onClick={async () => {
                                      await fetch(`/api/admin/dealers/${selectedDealerDetail.id}/cart`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'update_qty', itemId: item.id, quantity: item.quantity - 1 })
                                      });
                                      openDealerDrawer(selectedDealerDetail.id);
                                    }}
                                    className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold"
                                  >
                                    -
                                  </button>
                                  <span className="w-8 text-center font-mono font-bold text-slate-900 dark:text-white">{item.quantity}</span>
                                  <button
                                    onClick={async () => {
                                      await fetch(`/api/admin/dealers/${selectedDealerDetail.id}/cart`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ action: 'update_qty', itemId: item.id, quantity: item.quantity + 1 })
                                      });
                                      openDealerDrawer(selectedDealerDetail.id);
                                    }}
                                    className="w-6 h-6 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 flex items-center justify-center font-bold"
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
                        <div className="p-8 text-center text-slate-500 bg-slate-50 dark:bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-800">
                          Bu bayiye ait henüz sipariş kaydı bulunmuyor.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/80 border border-slate-800 rounded-2xl overflow-hidden">
                          {selectedDealerDetail.orders.map((order: any) => (
                            <div key={order.id} className="p-4 space-y-2 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition">
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
          <div className="lg:col-span-5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs p-5 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <Plus className="w-4 h-4 text-emerald-400" />
              <span>Yeni Banka Hesabı Ekle</span>
            </h3>

            <form onSubmit={handleCreateBankAccount} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Banka Adı:</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Garanti BBVA"
                  value={newBankName}
                  onChange={(e) => setNewBankName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Hesap Sahibi:</label>
                <input
                  type="text"
                  required
                  value={newAccountHolder}
                  onChange={(e) => setNewAccountHolder(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">IBAN Numarası:</label>
                <input
                  type="text"
                  required
                  placeholder="TR..."
                  value={newIban}
                  onChange={(e) => setNewIban(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sky-300 font-mono font-bold focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Şube:</label>
                  <input
                    type="text"
                    placeholder="Darıca Şubesi"
                    value={newBranch}
                    onChange={(e) => setNewBranch(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Para Birimi:</label>
                  <select
                    value={newCurrency}
                    onChange={(e) => setNewCurrency(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="TRY">TRY (₺)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">SWIFT Kodu (Opsiyonel):</label>
                <input
                  type="text"
                  placeholder="TGBAISX"
                  value={newSwift}
                  onChange={(e) => setNewSwift(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white font-mono focus:outline-none"
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

          <div className="lg:col-span-7 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs p-5 rounded-2xl shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
                    className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center justify-between text-xs gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">{b.bankName}</span>
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
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold px-3 py-2 rounded-xl transition border border-slate-700"
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
                <thead className="bg-slate-50 dark:bg-[#0B1120] text-slate-600 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Tarih / Saat</th>
                    <th className="py-3 px-4">Kullanıcı & Rol</th>
                    <th className="py-3 px-4">İşlem / Eylem</th>
                    <th className="py-3 px-4">Hedef Nesne</th>
                    <th className="py-3 px-4">Detay / Payload</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-200 dark:divide-slate-800/60">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-mono text-slate-400 whitespace-nowrap">
                        {log.createdAt}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 dark:text-white">{log.actorName}</div>
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
                        <div className="bg-slate-100 dark:bg-slate-950 p-2 rounded-lg font-mono text-[11px] text-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-800 max-w-md overflow-x-auto">
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
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Yeni Ürün Oluştur</h3>
              <button onClick={() => setIsNewProductModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Ürün Adı:</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: 2.5 kW Tavan Tipi Evaporatör"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Stok Kodu (SKU):</label>
                  <input
                    type="text"
                    required
                    placeholder="ERS-7010..."
                    value={newProductSku}
                    onChange={(e) => setNewProductSku(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-sky-300 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Kategori:</label>
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="">-- Kategori Seçin --</option>
                    {dbCategories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Alış Fiyatı (TL):</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.00"
                    value={newProductCost}
                    onChange={(e) => setNewProductCost(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Satış Fiyatı (TL):</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.00"
                    value={newProductSale}
                    onChange={(e) => setNewProductSale(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-emerald-400 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">İskonto (%):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={newProductDiscount}
                    onChange={(e) => setNewProductDiscount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-rose-400 font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Stok Miktarı:</label>
                  <input
                    type="number"
                    value={newProductStock}
                    onChange={(e) => setNewProductStock(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Drag and Drop Image Uploader */}
              <ImageDropzone
                value={newProductImageUrl}
                onChange={setNewProductImageUrl}
                label="Ürün Görseli (Bilgisayardan Sürükleyin veya Dosya Seçin)"
              />

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs py-2.5 rounded-xl transition"
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

      {/* MODAL: EDIT PRODUCT */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit className="w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Ürünü Düzenle</h3>
              </div>
              <button onClick={() => setEditingProduct(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Ürün Adı:</label>
                <input
                  type="text"
                  required
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Stok Kodu (SKU):</label>
                  <input
                    type="text"
                    required
                    value={editProdSku}
                    onChange={(e) => setEditProdSku(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-sky-300 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Barkod (Opsiyonel):</label>
                  <input
                    type="text"
                    value={editProdBarcode}
                    onChange={(e) => setEditProdBarcode(e.target.value)}
                    placeholder="8690000000000"
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-300 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Kategori:</label>
                <select
                  value={editProdCategory}
                  onChange={(e) => setEditProdCategory(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="">-- Kategori Seçin --</option>
                  {dbCategories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Alış Fiyatı (TL):</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.00"
                    value={editProdCost}
                    onChange={(e) => setEditProdCost(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Satış Fiyatı (TL):</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0.00"
                    value={editProdSale}
                    onChange={(e) => setEditProdSale(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Ürün İskonto (%):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    placeholder="0"
                    value={editProdDiscount}
                    onChange={(e) => setEditProdDiscount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Stok Miktarı:</label>
                  <input
                    type="number"
                    value={editProdStock}
                    onChange={(e) => setEditProdStock(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Image Drag and Drop Uploader */}
              <ImageDropzone
                value={editProdImageUrl}
                onChange={setEditProdImageUrl}
                label="Ürün Görseli (Bilgisayardan Sürükleyin veya Seçin)"
              />

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs py-2.5 rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  {savingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <span>Değişiklikleri Kaydet</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT CATEGORY */}
      {editingCategory && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderTree className="w-4 h-4 text-purple-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-base">Kategoriyi Düzenle</h3>
              </div>
              <button onClick={() => setEditingCategory(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditCategory} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Kategori Adı:</label>
                <input
                  type="text"
                  required
                  value={editCatName}
                  onChange={(e) => setEditCatName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Üst Kategori:</label>
                <select
                  value={editCatParent}
                  onChange={(e) => setEditCatParent(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="">-- Ana Kategori (Üst Kategori Yok) --</option>
                  {dbCategories
                    .filter((c) => c.id !== editingCategory.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">Sıra Numarası:</label>
                  <input
                    type="number"
                    value={editCatSortOrder}
                    onChange={(e) => setEditCatSortOrder(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-400 font-semibold mb-1">İskonto Oranı (%):</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={editCatDiscount}
                    onChange={(e) => setEditCatDiscount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 font-mono text-rose-400 font-bold focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs py-2.5 rounded-xl transition"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  disabled={savingCategory}
                  className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
                >
                  {savingCategory ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <span>Kategoriyi Güncelle</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Dealer Credentials / Temporary Password */}
      {createdCredentialsModal && (
        <div className="fixed inset-0 z-50 bg-black/60 dark:bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>{createdCredentialsModal.title}</span>
              </div>
              <button
                onClick={() => setCreatedCredentialsModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              <strong className="text-slate-900 dark:text-white">{createdCredentialsModal.companyName}</strong> için güvenli giriş bilgileri başarıyla oluşturuldu.
            </p>

            <div className="bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 space-y-3 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                <span className="text-slate-400">Kullanıcı Adı:</span>
                <span className="text-sky-400 font-bold text-sm">{createdCredentialsModal.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Geçici Şifre:</span>
                <span className="text-emerald-400 font-bold text-sm bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white">
                  {createdCredentialsModal.tempPassword}
                </span>
              </div>
            </div>

            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-300">
              <strong>Önemli Güvenlik Notu:</strong> Bu geçici şifre veritabanında plain-text olarak tutulmaz, yalnızca bcrypt hash'i saklanır. Lütfen şifreyi şimdi kopyalayarak bayinizle paylaşınız.
            </div>

            <div className="pt-2 flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Ersa Soğutma B2B Bayi Girişi\nKullanıcı Adı: ${createdCredentialsModal.username}\nGeçici Şifre: ${createdCredentialsModal.tempPassword}\nGiriş URL: https://ersasogutma.vercel.app/bayi/login`);
                  showToast('Giriş bilgileri panoya kopyalandı!', 'success');
                }}
                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs py-2.5 rounded-xl shadow-lg transition flex items-center justify-center gap-1.5"
              >
                <Layers className="w-4 h-4" />
                <span>Bilgileri Kopyala</span>
              </button>
              <button
                onClick={() => setCreatedCredentialsModal(null)}
                className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition"
              >
                Tamam
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
