'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { MessageSquarePlus, Send, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function FeedbackPage() {
  const { showToast, profile } = useStore();
  const [feedbackType, setFeedbackType] = useState('Öneride Bulunmak İstiyorum');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      showToast('Lütfen mesajınızı yazınız.', 'warning');
      return;
    }

    setIsSent(true);
    showToast('Talebiniz Ersa Soğutma Yönetimine iletilmiştir. Teşekkür ederiz.', 'success');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
          <MessageSquarePlus className="w-4 h-4" />
          <span>Geri Bildirim & Müşteri Deneyimi</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">Öneri / İstek / Şikayet Bildirimi</h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Ersa Soğutma ürün ve hizmet kalitesini artırmak için görüşlerinizi yönetimimizle doğrudan paylaşın
        </p>
      </div>

      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6">
        {isSent ? (
          <div className="text-center py-10 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">Bildiriminiz Başarıyla Alındı</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Talebiniz Ersa Soğutma Genel Müdürlüğü ve Kalite Birimine iletilmiştir. İlgili yetkili en kısa sürede sizinle iletişime geçecektir.
            </p>
            <button
              onClick={() => {
                setIsSent(false);
                setMessage('');
                setSubject('');
              }}
              className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition"
            >
              Yeni Bildirim Gönder
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                Bildirim Türünü Seçiniz:
              </label>
              <select
                value={feedbackType}
                onChange={(e) => setFeedbackType(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              >
                <option value="Öneride Bulunmak İstiyorum">Öneride Bulunmak İstiyorum (Yeni Ürün / Geliştirme)</option>
                <option value="İstekte Bulunmak İstiyorum">İstekte Bulunmak İstiyorum (Katalog / Özel Fiyat Talebi)</option>
                <option value="Şikayette Bulunmak İstiyorum">Şikayette Bulunmak İstiyorum (Lojistik / Hasarlı Koli / Hizmet)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                Konu Başlığı:
              </label>
              <input
                type="text"
                required
                placeholder="Örn: Yeni Soğuk Oda Gaz Stokları Hakkında"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                Mesajınız & Açıklama:
              </label>
              <textarea
                rows={6}
                required
                placeholder="Lütfen detayları belirtiniz..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 resize-none leading-relaxed"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-6 py-3 rounded-xl shadow-lg shadow-purple-900/30 transition flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Bildirimi Gönder</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
