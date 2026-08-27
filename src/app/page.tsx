'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/context/StoreContext';
import {
  ShoppingBag,
  CreditCard,
  Layers,
  Sparkles,
  ArrowRight,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  FileSpreadsheet,
  Calculator,
  ShieldCheck,
  Snowflake,
  Flame,
  AlertCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { BANK_ACCOUNTS } from '@/data/bankAccounts';

export default function DashboardPage() {
  const {
    orders,
    profile,
    cariSummary,
    notes,
    addNote,
    deleteNote,
    reminders,
    toggleReminder,
    deleteReminder,
    addReminder,
    products,
    addToCart,
    showToast
  } = useStore();

  const [copiedIban, setCopiedIban] = useState<string | null>(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteDesc, setNewNoteDesc] = useState('');
  const [showNoteModal, setShowNoteModal] = useState(false);

  const [newRemTitle, setNewRemTitle] = useState('');
  const [newRemDate, setNewRemDate] = useState('');
  const [showRemModal, setShowRemModal] = useState(false);

  const pendingOrders = orders.filter((o) => o.status === 'bekliyor');
  const checkedOrders = orders.filter((o) => o.status === 'onaysiz');

  const copyToClipboard = (iban: string) => {
    navigator.clipboard.writeText(iban.replace(/\s+/g, ''));
    setCopiedIban(iban);
    showToast('IBAN panoya kopyalandı!');
    setTimeout(() => setCopiedIban(null), 2500);
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteTitle.trim()) return;
    addNote({ title: newNoteTitle, description: newNoteDesc });
    setNewNoteTitle('');
    setNewNoteDesc('');
    setShowNoteModal(false);
  };

  const handleCreateReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRemTitle.trim()) return;
    addReminder({
      title: newRemTitle,
      description: '',
      reminderDate: newRemDate || new Date().toISOString().split('T')[0],
      days: ['Hergün']
    });
    setNewRemTitle('');
    setNewRemDate('');
    setShowRemModal(false);
  };

  // Opportunity / High demand products for cold storage & HVAC
  const featuredProducts = products.filter((p) => p.isOpportunity || p.isNew).slice(0, 4);

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-sky-900 via-slate-900 to-slate-950 border border-sky-800/50 p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Snowflake className="w-4 h-4 text-cyan-400" />
              <span>Ersa Soğutma B2B Bayi Portalı</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Hoş Geldiniz, <span className="text-sky-300">{profile.companyName}</span>
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Bayi kodunuz: <span className="font-mono text-sky-400 font-bold">{profile.dealerCode}</span> • 
              Tanımlı İskontonuz: <span className="text-emerald-400 font-bold">%{profile.discountRate * 100} ({profile.tier} Bayi)</span> • 
              Yetkili: <span className="text-white font-medium">{profile.contactPerson}</span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/urunler/toplu"
              className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition transform hover:-translate-y-0.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Toplu / Hızlı Sipariş</span>
            </Link>
            <Link
              href="/finans/online-odeme"
              className="flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-900/30 transition transform hover:-translate-y-0.5"
            >
              <CreditCard className="w-4 h-4" />
              <span>Sanal POS ile Öde</span>
            </Link>
          </div>
        </div>

        {/* Subtle background glow decoration */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 Main KPI Cards (Matching and elevating Girdap Bayi widgets) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Kontrol Edilen Siparişler */}
        <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-2xl p-5 text-white shadow-xl shadow-amber-950/20 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl sm:text-4xl font-black font-mono">{checkedOrders.length}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-amber-100 mt-1">
                KONTROL EDİLEN SİPARİŞLER
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition">
              <ShoppingBag className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <Link href="/siparisler" className="text-amber-100 hover:text-white font-medium flex items-center gap-1">
              <span>Tümünü Gör</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-[11px] text-amber-200">Onay bekleyenler</span>
          </div>
        </div>

        {/* Card 2: Bekleyen Siparişler */}
        <div className="bg-gradient-to-br from-orange-600 to-amber-600 rounded-2xl p-5 text-white shadow-xl shadow-orange-950/20 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-3xl sm:text-4xl font-black font-mono">{pendingOrders.length}</div>
              <div className="text-xs font-bold uppercase tracking-wider text-orange-100 mt-1">
                BEKLEYEN SİPARİŞLER
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <Link href="/siparisler/bekleyen" className="text-orange-100 hover:text-white font-medium flex items-center gap-1">
              <span>Tümünü Gör</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-[11px] text-orange-200">Hazırlık aşamasında</span>
          </div>
        </div>

        {/* Card 3: Cari Bakiye */}
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-2xl p-5 text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono">
                {formatCurrency(cariSummary.balance)} ({cariSummary.balanceType})
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-100 mt-1">
                CARİ BAKİYE (ALACAKLI)
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition">
              <span className="text-2xl font-black">₺</span>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <Link href="/cari" className="text-emerald-100 hover:text-white font-medium flex items-center gap-1">
              <span>Ekstre & Detaylar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-[11px] text-emerald-200 font-medium">Risk Durumu: Güvenli</span>
          </div>
        </div>

        {/* Card 4: Kredi Limiti & Vade Durumu */}
        <div className="bg-gradient-to-br from-sky-700 to-indigo-800 rounded-2xl p-5 text-white shadow-xl shadow-indigo-950/20 relative overflow-hidden group">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono">
                {formatCurrency(profile.creditLimit)}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-sky-100 mt-1">
                TANIMLI KREDİ LİMİTİ
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
            <Link href="/finans/valor-vade" className="text-sky-100 hover:text-white font-medium flex items-center gap-1">
              <span>Valör / Vade Hesapla</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <span className="text-[11px] text-sky-200 font-medium">Ortalama Vade: 60 Gün</span>
          </div>
        </div>

      </div>

      {/* 3 Interactive B2B Widgets: Notlar | Hatırlatmalar | Banka Hesap Bilgileri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Widget 1: Notlar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>Notlarım</span>
              </h2>
              <button
                onClick={() => setShowNoteModal(true)}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Not Ekle</span>
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Henüz bir notunuz bulunmuyor.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {notes.map((n) => (
                  <div
                    key={n.id}
                    className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-start justify-between gap-2"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-200">{n.title}</div>
                      <div className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{n.description}</div>
                      <div className="text-[10px] text-slate-500 mt-1">{n.date}</div>
                    </div>
                    <button
                      onClick={() => deleteNote(n.id)}
                      className="text-slate-500 hover:text-rose-400 p-1 transition"
                      title="Notu Sil"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 text-center">
            <Link href="/notlar" className="text-xs text-slate-400 hover:text-sky-400 font-medium">
              Tüm Notları Göster →
            </Link>
          </div>
        </div>

        {/* Widget 2: Hatırlatmalar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>Hatırlatmalar</span>
              </h2>
              <button
                onClick={() => setShowRemModal(true)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ekle</span>
              </button>
            </div>

            {reminders.length === 0 ? (
              <div className="text-center py-6 text-slate-500 text-xs">
                Henüz kayıtlı hatırlatmanız yok.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                {reminders.map((r) => (
                  <div
                    key={r.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition ${
                      r.isCompleted
                        ? 'bg-slate-900/50 border-slate-800 text-slate-500 line-through'
                        : 'bg-slate-800/80 border-slate-700/60 text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={r.isCompleted}
                        onChange={() => toggleReminder(r.id)}
                        className="rounded border-slate-700 text-emerald-500 focus:ring-0 cursor-pointer"
                      />
                      <div>
                        <div className="text-xs font-semibold">{r.title}</div>
                        <div className="text-[10px] text-slate-400">Vade: {r.reminderDate}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => deleteReminder(r.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 text-center">
            <Link href="/hatirlatmalar" className="text-xs text-slate-400 hover:text-emerald-400 font-medium">
              Tüm Hatırlatmaları Gör →
            </Link>
          </div>
        </div>

        {/* Widget 3: Banka Hesap Bilgileri (Hızlı Kopyalama) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>Banka Hesap Bilgileri</span>
              </h2>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-semibold">
                Tek Tıkla Kopyala
              </span>
            </div>

            <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
              {BANK_ACCOUNTS.slice(0, 2).map((bank) => (
                <div
                  key={bank.id}
                  className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 space-y-1"
                >
                  <div className="flex justify-between items-center text-xs font-bold text-slate-200">
                    <span className="flex items-center gap-1.5">
                      <span>{bank.bankLogo}</span>
                      <span>{bank.bankName}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{bank.currency}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between font-mono bg-slate-900/80 px-2 py-1 rounded">
                    <span className="truncate">{bank.iban}</span>
                    <button
                      onClick={() => copyToClipboard(bank.iban)}
                      className="ml-2 p-1 text-slate-400 hover:text-white"
                      title="IBAN Kopyala"
                    >
                      {copiedIban === bank.iban ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-slate-800 text-center">
            <Link href="/iletisim/banka-hesaplari" className="text-xs text-slate-400 hover:text-amber-400 font-medium">
              Tüm Banka Hesaplarını Gör ({BANK_ACCOUNTS.length} Banka) →
            </Link>
          </div>
        </div>

      </div>

      {/* Featured / Opportunity Products Showcase */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4 mb-5">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
              <Flame className="w-4 h-4 text-orange-400" />
              <span>Fırsat & Çok Satan Soğutma Parçaları</span>
            </div>
            <h3 className="text-lg font-black text-white">Öne Çıkan Stoklar & Hızlı Sipariş</h3>
          </div>
          <Link
            href="/urunler"
            className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
          >
            <span>Tüm Kataloğu İncele ({products.length} Ürün)</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {featuredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-slate-900 border border-slate-800 hover:border-sky-500/50 rounded-xl p-4 flex flex-col justify-between transition group shadow-lg"
            >
              <div>
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-slate-950 mb-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                  {product.isNew && (
                    <span className="absolute top-2 left-2 bg-emerald-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded shadow">
                      YENİ ÜRÜN
                    </span>
                  )}
                  {product.isOpportunity && (
                    <span className="absolute top-2 right-2 bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded shadow">
                      FIRSAT
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-slate-400 font-mono mb-0.5">Kod: {product.code}</div>
                <h4 className="text-xs font-bold text-white line-clamp-2 mb-2 group-hover:text-sky-300 transition">
                  {product.name}
                </h4>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                  <span>Marka: <strong className="text-slate-200">{product.brand}</strong></span>
                  <span>PİM: <strong className="text-sky-400">{product.pim} Adet</strong></span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <div className="text-xs text-slate-400 font-medium">Liste Fiyatı</div>
                  <div className="text-sm font-black font-mono text-emerald-400">
                    {formatCurrency(product.priceTRY)}
                  </div>
                </div>

                <button
                  onClick={() => addToCart(product, product.pim || 1)}
                  className="bg-sky-600 hover:bg-sky-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md shadow-sky-600/30 transition flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sepete Ekle</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Orders Table (Matching Girdap Bayi "Son Siparişler" list) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div>
            <h3 className="text-base font-black text-white">Son Sipariş Hareketleri</h3>
            <p className="text-xs text-slate-400 mt-0.5">En son oluşturulan bayi siparişleriniz ve durumları</p>
          </div>
          <Link
            href="/siparisler"
            className="text-xs text-sky-400 hover:text-sky-300 font-bold flex items-center gap-1"
          >
            <span>Tüm Siparişleri Gör</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {orders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Sipariş bulunamadı.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider bg-slate-950/40">
                  <th className="py-3 px-4">Sipariş Tarihi</th>
                  <th className="py-3 px-4">Sipariş Numarası</th>
                  <th className="py-3 px-4">Sipariş Türü</th>
                  <th className="py-3 px-4">Tutar</th>
                  <th className="py-3 px-4">Sipariş Durumu</th>
                  <th className="py-3 px-4 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {orders.slice(0, 5).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-800/50 transition">
                    <td className="py-3.5 px-4 font-mono text-slate-400">{order.date}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-sky-400">
                      #{order.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
                        {order.orderType}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      {formatCurrency(order.totalTRY)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          order.status === 'tamamlandi'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : order.status === 'sevkiyatta'
                            ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                            : order.status === 'bekliyor'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {order.status === 'tamamlandi' && <CheckCircle2 className="w-3 h-3" />}
                        {order.status === 'sevkiyatta' && <Truck className="w-3 h-3" />}
                        {order.status === 'bekliyor' && <Clock className="w-3 h-3" />}
                        <span>{order.statusText}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/siparisler/${order.orderNumber}`}
                        className="inline-flex items-center gap-1 bg-sky-600/20 hover:bg-sky-600 text-sky-300 hover:text-white px-3 py-1 rounded-lg font-bold text-xs transition"
                      >
                        <span>İncele</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-4">Yeni Bayi Notu Ekle</h3>
            <form onSubmit={handleCreateNote} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Not Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Pazartesi Gaz Teslimatı"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Açıklama</label>
                <textarea
                  rows={3}
                  placeholder="Not detayları..."
                  value={newNoteDesc}
                  onChange={(e) => setNewNoteDesc(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-md shadow-sky-600/30"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reminder Modal */}
      {showRemModal && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-base font-bold text-white mb-4">Yeni Hatırlatma Ekle</h3>
            <form onSubmit={handleCreateReminder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hatırlatma Başlığı</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Çek Vadesi Kontrolü"
                  value={newRemTitle}
                  onChange={(e) => setNewRemTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Hatırlatma Tarihi</label>
                <input
                  type="date"
                  value={newRemDate}
                  onChange={(e) => setNewRemDate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRemModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md shadow-emerald-600/30"
                >
                  Hatırlatıcı Oluştur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
