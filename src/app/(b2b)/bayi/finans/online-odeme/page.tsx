'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/context/StoreContext';
import { formatCurrency } from '@/lib/utils';
import { calculateInstallmentsForAmount } from '@/data/posBanks';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Building2,
  Smartphone
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function OnlinePaymentPage() {
  const router = useRouter();
  const { profile, addPosSlip, showToast } = useStore();

  // Wizard Steps: 1 = Tutar & Şartlar, 2 = Kart Bilgileri & Taksit Seçimi, 3 = 3D Secure Doğrulama
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Form State
  const [amount, setAmount] = useState<string>('0');
  const [agreedTerms, setAgreedTerms] = useState<boolean>(true);
  const [liveFinance, setLiveFinance] = useState<{
    cariBakiye: number;
    bakiyeYonu: 'BORC' | 'ALACAK';
    balanceType: 'B' | 'A';
    odenecekTutar: number;
    krediLimiti: number;
    kullanilabilirLimit: number;
    gecikenBorc: number;
    companyName: string;
  } | null>(null);
  const [loadingFinance, setLoadingFinance] = useState(true);

  useEffect(() => {
    async function loadFinance() {
      try {
        setLoadingFinance(true);
        const res = await fetch('/api/b2b/finance/summary');
        const json = await res.json();
        if (json?.success && json?.data) {
          setLiveFinance(json.data);
          if (json.data.odenecekTutar > 0) {
            setAmount(json.data.odenecekTutar.toString());
          } else {
            setAmount('1000');
          }
        }
      } catch (err) {
        console.error('Failed to load live finance summary:', err);
      } finally {
        setLoadingFinance(false);
      }
    }
    loadFinance();
  }, []);

  // Card Form State
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(profile.contactPerson || 'AFFAN EMIRHAN');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');
  const [selectedBank, setSelectedBank] = useState<string>('garanti-bonus');
  const [selectedInstallment, setSelectedInstallment] = useState<number>(1);

  // Review modal state for explicit confirmation before debiting
  const [showReviewModal, setShowReviewModal] = useState(false);

  // 3D Secure simulation
  const [smsCode, setSmsCode] = useState('123456');
  const [isProcessing, setIsProcessing] = useState(false);

  const numericAmount = parseFloat(amount) || 0;
  const banksWithInstallments = calculateInstallmentsForAmount(numericAmount);
  const currentBank = banksWithInstallments.find((b) => b.id === selectedBank) || banksWithInstallments[0];
  const currentInstallmentOption = currentBank?.installments.find((i) => i.installment === selectedInstallment) || currentBank?.installments[0];

  // Card number formatting
  const handleCardNumberChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.match(/.{1,4}/g)?.join(' ') || cleaned;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (val: string) => {
    const cleaned = val.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      setExpiryDate(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setExpiryDate(cleaned);
    }
  };

  const handleProceedToCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (numericAmount < 100) {
      showToast('Minimum ödeme tutarı 100.00 TL olmalıdır.', 'warning');
      return;
    }
    if (!agreedTerms) {
      showToast('Lütfen ödeme şartlarını onaylayınız.', 'warning');
      return;
    }
    setStep(2);
  };

  const handleProceedTo3D = (e: React.FormEvent) => {
    e.preventDefault();
    if (cardNumber.replace(/\s/g, '').length < 16) {
      showToast('Lütfen 16 haneli geçerli kart numarasını giriniz.', 'warning');
      return;
    }
    if (!cardHolder.trim() || !expiryDate || !cvc) {
      showToast('Lütfen tüm kart bilgilerini eksiksiz doldurunuz.', 'warning');
      return;
    }
    setStep(3);
  };

  const handleComplete3DSecure = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    const masked = `${cardNumber.slice(0, 4)} **** **** ${cardNumber.slice(-4)}`;
    const refCode = `SANPOS-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const finalAmount = currentInstallmentOption?.totalAmount || numericAmount;

    try {
      const response = await fetch('/api/b2b/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-idempotency-key': refCode
        },
        body: JSON.stringify({
          amount: finalAmount,
          bankName: currentBank.name,
          installmentCount: selectedInstallment,
          smsCode,
          cardHolder: cardHolder.toUpperCase(),
          cardNumberMasked: masked,
          idempotencyKey: refCode
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        showToast(resData.error || 'Ödeme işlemi banka tarafından reddedildi.', 'error');
        setIsProcessing(false);
        return;
      }

      setIsProcessing(false);
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      const now = new Date();
      const dateStr = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      addPosSlip({
        date: dateStr,
        referenceCode: resData.data?.referenceCode || refCode,
        cardNumberMasked: masked,
        cardHolder: cardHolder.toUpperCase(),
        bankName: currentBank.name,
        installmentCount: selectedInstallment,
        amount: finalAmount,
        status: 'Başarılı',
        authCode: `AUTH-${Math.floor(100000 + Math.random() * 899999)}`,
        terminalId: `TRM-${Math.floor(10000 + Math.random() * 89999)}`,
        responseMessage: 'İşlem Başarılı (00 - Onaylandı - Cari İşlendi)',
        dealerName: profile.companyName
      });

      showToast(`Ödeme başarıyla gerçekleşti ve cariye işlendi! Referans: ${refCode}`, 'success');
      router.push('/bayi/finans/slipler');
    } catch (err: any) {
      console.error('Payment execution error:', err);
      showToast('Ödeme sunucu bağlantı hatası nedeniyle tamamlanamadı.', 'error');
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>256-Bit SSL Şifreli Güvenli B2B Sanal POS</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Online Kredi Kartı ile Ödeme</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Cari hesap bakiyenizi tüm banka kartlarıyla tek çekim veya taksitli olarak güvenle ödeyin
        </p>
      </div>

      {/* Wizard Steps Stepper */}
      <div className="flex items-center justify-between bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-4 shadow-xl">
        <div className={`flex items-center gap-2 text-xs font-bold ${step >= 1 ? 'text-sky-400' : 'text-slate-500'}`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black ${step >= 1 ? 'bg-sky-600 text-white' : 'bg-slate-800'}`}>
            1
          </div>
          <span>Tutar & Onay</span>
        </div>

        <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-sky-500' : 'bg-slate-800'}`}></div>

        <div className={`flex items-center gap-2 text-xs font-bold ${step >= 2 ? 'text-sky-400' : 'text-slate-500'}`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black ${step >= 2 ? 'bg-sky-600 text-white' : 'bg-slate-800'}`}>
            2
          </div>
          <span>Kart Bilgisi & Taksit</span>
        </div>

        <div className={`flex-1 h-0.5 mx-4 ${step >= 3 ? 'bg-sky-500' : 'bg-slate-800'}`}></div>

        <div className={`flex items-center gap-2 text-xs font-bold ${step === 3 ? 'text-sky-400' : 'text-slate-500'}`}>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black ${step === 3 ? 'bg-emerald-600 text-white' : 'bg-slate-800'}`}>
            3
          </div>
          <span>3D Secure Onayı</span>
        </div>
      </div>

      {/* STEP 1: Amount & Terms Form (Matching Girdap Step 1) */}
      {step === 1 && (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl space-y-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3">
            Ödeme Tutarı ve Bilgileri
          </h2>

          <form onSubmit={handleProceedToCard} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Ödenecek Tutar (TL):
              </label>
              <div className="relative max-w-xs">
                <input
                  type="number"
                  step="any"
                  min="100"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl pl-4 pr-12 py-3 text-lg font-mono font-black text-emerald-400 focus:outline-none focus:border-sky-500"
                />
                <span className="absolute right-4 top-3.5 text-sm font-black text-slate-400">TL</span>
              </div>
              <div className="text-[11px] text-slate-400 mt-2 flex flex-wrap items-center gap-2">
                <span>Güncel Cari Durumunuz:</span>
                {liveFinance ? (
                  <>
                    <strong className={liveFinance.bakiyeYonu === 'BORC' ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                      {formatCurrency(liveFinance.cariBakiye)} ({liveFinance.bakiyeYonu === 'BORC' ? 'Borçlu - B' : 'Alacaklı - A'})
                    </strong>
                    {liveFinance.odenecekTutar > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowReviewModal(true)}
                        className="text-[10px] bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/30 px-2.5 py-1 rounded-lg transition font-semibold"
                      >
                        Net Borcu Kapat ({formatCurrency(liveFinance.odenecekTutar)})
                      </button>
                    )}
                  </>
                ) : (
                  <strong className="text-slate-300">{formatCurrency(profile.currentBalance)} ({profile.balanceType})</strong>
                )}
              </div>
            </div>

            {/* Terms Agreement Box (Exact requirement on Girdap) */}
            <div className="bg-slate-50 dark:bg-[#0B1120] p-4 rounded-xl border border-slate-200 dark:border-slate-800 border border-slate-800 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-700 text-sky-600 focus:ring-0 cursor-pointer"
                />
                <span className="text-xs text-slate-300 leading-relaxed">
                  Ersa Soğutma B2B Sanal POS ile kredi kartımdan tahsil edilecek tutarın cari hesabıma alacak olarak kaydedilmesini, ödeme ve iade şartlarını okuduğumu ve kabul ettiğimi beyan ederim.
                </span>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-sky-600/30 transition flex items-center gap-2"
              >
                <span>Kart Bilgilerine Geç</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* STEP 2: Card Info & Installment Table (Matching Girdap Step 2) */}
      {step === 2 && (
        <div className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Left: Card Input Form */}
            <div className="md:col-span-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl space-y-5">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">Kredi Kartı Bilgileri</h2>
                <span className="text-xs font-mono font-bold text-emerald-400">
                  Tutar: {formatCurrency(numericAmount)}
                </span>
              </div>

              {/* Visual Card Mockup */}
              <div className="bg-gradient-to-tr from-slate-900 via-sky-900 to-indigo-900 rounded-2xl p-5 border border-sky-500/30 shadow-2xl text-white relative overflow-hidden space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs tracking-widest text-sky-300 uppercase">ERSA B2B POS</span>
                  <span className="text-xl font-bold">{currentBank.logo} {currentBank.cardBrand}</span>
                </div>
                <div className="font-mono text-lg tracking-widest text-center py-2 font-bold">
                  {cardNumber || '•••• •••• •••• ••••'}
                </div>
                <div className="flex justify-between text-[11px] font-mono text-slate-300">
                  <div>
                    <span className="block text-[9px] text-slate-400">KART SAHİBİ</span>
                    <span className="font-bold">{cardHolder || 'AD SOYAD'}</span>
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400">SON KULLANMA</span>
                    <span className="font-bold">{expiryDate || 'AA/YY'}</span>
                  </div>
                </div>
              </div>

              <form id="cardForm" onSubmit={handleProceedTo3D} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Kart Numarası:</label>
                  <input
                    type="text"
                    required
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    onChange={(e) => handleCardNumberChange(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Kart Üzerindeki İsim:</label>
                  <input
                    type="text"
                    required
                    placeholder="Ad Soyad"
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-white uppercase focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Son Kullanma (AA/YY):</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={expiryDate}
                      onChange={(e) => handleExpiryChange(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">CVC / Güvenlik No:</label>
                    <input
                      type="password"
                      maxLength={4}
                      required
                      placeholder="•••"
                      value={cvc}
                      onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 font-mono text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 text-center"
                    />
                  </div>
                </div>
              </form>
            </div>

            {/* Right: Bank Brand Selector & Installment Options */}
            <div className="md:col-span-6 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">
                Kart Programı & Taksit Seçenekleri
              </h2>

              {/* Bank Card Selector */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {banksWithInstallments.map((b) => {
                  const isSelected = selectedBank === b.id;
                  return (
                    <button
                      type="button"
                      key={b.id}
                      onClick={() => {
                        setSelectedBank(b.id);
                        setSelectedInstallment(1);
                      }}
                      className={`p-2 rounded-xl border text-center transition ${
                        isSelected
                          ? 'bg-sky-600/30 border-sky-500 text-white font-bold'
                          : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="text-base mb-0.5">{b.logo}</div>
                      <div className="text-[10px] truncate">{b.cardBrand}</div>
                    </button>
                  );
                })}
              </div>

              {/* Installment Rates Table */}
              <div className="border border-slate-800 rounded-xl overflow-hidden mt-3">
                <div className="bg-slate-100 dark:bg-slate-950 px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-300 flex justify-between border-b border-slate-200 dark:border-slate-800">
                  <span>{currentBank.name} Taksit Tablosu</span>
                  <span className="text-emerald-400 font-mono">Net Tutar</span>
                </div>
                <div className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {currentBank.installments.map((inst) => {
                    const isSelected = selectedInstallment === inst.installment;
                    return (
                      <label
                        key={inst.installment}
                        className={`p-3 flex items-center justify-between cursor-pointer transition ${
                          isSelected ? 'bg-sky-950/40 text-white font-bold' : 'hover:bg-slate-800/50 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="installmentRadio"
                            checked={isSelected}
                            onChange={() => setSelectedInstallment(inst.installment)}
                            className="rounded-full text-sky-600 focus:ring-0"
                          />
                          <div>
                            <span>{inst.installment === 1 ? 'Tek Çekim' : `${inst.installment} Taksit`}</span>
                            {inst.rate > 0 && (
                              <span className="text-[10px] text-amber-400 ml-2 font-normal">
                                (+%{(inst.rate * 100).toFixed(1)} vade farkı)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right">
                          <div className="font-mono text-emerald-400 font-bold">
                            {formatCurrency(inst.totalAmount)}
                          </div>
                          {inst.installment > 1 && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              {inst.installment} × {formatCurrency(inst.monthlyAmount)}
                            </div>
                          )}
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>

          </div>

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 transition flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Geri Dön</span>
            </button>

            <button
              type="submit"
              form="cardForm"
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-6 py-3 rounded-xl shadow-lg shadow-emerald-900/40 transition flex items-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>3D SECURE İLE ÖDE ({formatCurrency(currentInstallmentOption?.totalAmount || numericAmount)})</span>
            </button>
          </div>

        </div>
      )}

      {/* STEP 3: 3D Secure Simulation Modal */}
      {step === 3 && (
        <div className="fixed inset-0 bg-black/60 dark:bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 shadow-xs rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 text-center space-y-4">
            
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center mx-auto">
              <Smartphone className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                3D Secure Doğrulama Şifresi
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                <strong>{profile.phoneGsm}</strong> numaralı cep telefonunuza gönderilen 6 haneli doğrulama kodunu giriniz.
              </p>
            </div>

            <div className="bg-slate-50 dark:bg-[#0B1120] p-3 rounded-xl border border-slate-200 dark:border-slate-800 border border-slate-800 text-xs text-left space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>İşyeri:</span>
                <span className="font-bold text-slate-900 dark:text-white">ERSA SOĞUTMA ISITMA LTD. ŞTİ.</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Ödeme Tutarı:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {formatCurrency(currentInstallmentOption?.totalAmount || numericAmount)}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Taksit:</span>
                <span className="font-bold text-sky-400">
                  {selectedInstallment === 1 ? 'Tek Çekim' : `${selectedInstallment} Taksit`}
                </span>
              </div>
            </div>

            <form onSubmit={handleComplete3DSecure} className="space-y-4">
              <div>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={smsCode}
                  onChange={(e) => setSmsCode(e.target.value)}
                  className="w-40 mx-auto text-center font-mono font-black text-xl tracking-widest bg-slate-50 dark:bg-slate-950 border border-sky-500 text-slate-900 dark:text-white rounded-xl py-2 focus:outline-none"
                />
                <span className="block text-[10px] text-slate-500 mt-1">Test onay kodu: 123456</span>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800"
                >
                  İptal
                </button>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2"
                >
                  {isProcessing ? 'Onaylanıyor...' : 'Doğrula & Öde'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Explicit Debt Review Modal before debiting */}
      {showReviewModal && liveFinance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center font-black">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Cari Borç Kapatma Onayı</h3>
                <p className="text-xs text-slate-400">Tahsilat öncesi tutar ve hesap özeti doğrulama</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/80 rounded-xl p-4 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Bayi / Firma:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{liveFinance.companyName || profile.companyName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Mevcut Cari Borç:</span>
                <span className="font-bold text-rose-500 font-mono">{formatCurrency(liveFinance.cariBakiye)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Tahsil Edilecek Tutar:</span>
                <span className="font-bold text-emerald-400 font-mono text-sm">{formatCurrency(liveFinance.odenecekTutar)}</span>
              </div>
              <div className="flex justify-between text-xs pt-2 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-400">İşlem Sonrası Kalan:</span>
                <span className="font-bold text-sky-400 font-mono">0,00 TL</span>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2.5 items-start">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-300 leading-relaxed">
                Bu tutar kartınızdan doğrudan çekilmez. Onayladığınızda kart bilgisi girişine ve banka 3D Secure SMS doğrulama adımına yönlendirileceksiniz.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-100 dark:bg-slate-800 transition"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  setAmount(liveFinance.odenecekTutar.toString());
                  setShowReviewModal(false);
                  setStep(2);
                }}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-500 shadow-lg shadow-sky-600/30 transition flex items-center gap-2"
              >
                <span>Tutarı Onayla & Devam Et</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
