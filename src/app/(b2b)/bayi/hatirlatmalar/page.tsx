'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { Bell, Plus, Trash2, CheckCircle2, Clock } from 'lucide-react';

export default function RemindersPage() {
  const { reminders, addReminder, toggleReminder, deleteReminder } = useStore();
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [date, setDate] = useState('');
  const [showModal, setShowModal] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addReminder({
      title,
      description: desc,
      reminderDate: date || new Date().toISOString().split('T')[0],
      days: ['Hergün']
    });
    setTitle('');
    setDesc('');
    setDate('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Bell className="w-4 h-4" />
            <span>Kişisel Bayi Araçları</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Hatırlatmalar</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Yaklaşan çek vadeleriniz, müşteri montaj randevularınız ve periyodik takipler
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-cyan-950/40 transition self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Hatırlatma Ekle</span>
        </button>
      </div>

      {/* Reminders List */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl space-y-4">
        {reminders.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">
            Kayıtlı bir hatırlatmanız bulunmamaktadır.
          </div>
        ) : (
          <div className="space-y-3">
            {reminders.map((r) => (
              <div
                key={r.id}
                className={`p-4 rounded-xl border flex items-start justify-between gap-4 transition ${
                  r.isCompleted
                    ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-800 text-slate-500'
                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={r.isCompleted}
                    onChange={() => toggleReminder(r.id)}
                    className="mt-1 rounded border-slate-700 text-cyan-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <h3 className={`font-bold text-sm ${r.isCompleted ? 'line-through text-slate-500' : 'text-white'}`}>
                      {r.title}
                    </h3>
                    {r.description && (
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{r.description}</p>
                    )}
                    <div className="text-[11px] text-cyan-400 font-mono mt-1.5 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Hatırlatma Tarihi: {r.reminderDate}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => deleteReminder(r.id)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 transition rounded-lg hover:bg-rose-950/30"
                  title="Hatırlatmayı Sil"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 shadow-xs rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Yeni Hatırlatma Ekle</h3>
            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Başlık:</label>
                <input
                  type="text"
                  required
                  placeholder="Örn: Gültekin Şarküteri Montaj Kontrolü"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Tarih:</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">Detay / Açıklama:</label>
                <textarea
                  rows={3}
                  placeholder="Açıklama..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white bg-slate-800"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl font-bold text-slate-900 dark:text-white bg-cyan-600 hover:bg-cyan-500 shadow-md shadow-cyan-950/40"
                >
                  Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
