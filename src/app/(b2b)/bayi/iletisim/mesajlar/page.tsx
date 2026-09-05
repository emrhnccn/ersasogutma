'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { STAFF_RECIPIENTS } from '@/data/messages';
import { PortalMessage } from '@/types';
import {
  Mail,
  Inbox,
  Send,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  User,
  Building,
  Paperclip,
  ArrowRight
} from 'lucide-react';

export default function MessagesPage() {
  const { messages, sendMessage, markMessageRead, showToast, profile } = useStore();

  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'new'>('inbox');
  const [selectedMessage, setSelectedMessage] = useState<PortalMessage | null>(null);

  // New Message Form State
  const [recipient, setRecipient] = useState(STAFF_RECIPIENTS[0].name);
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');

  const inboxMessages = messages.filter((m) => m.type === 'inbox');
  const sentMessages = messages.filter((m) => m.type === 'sent');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      showToast('Lütfen konu ve mesaj metnini doldurunuz.', 'warning');
      return;
    }

    const recObj = STAFF_RECIPIENTS.find((s) => s.name === recipient);
    sendMessage({
      recipient,
      subject,
      content,
      department: recObj?.role
    });

    setSubject('');
    setContent('');
    setActiveTab('sent');
  };

  const handleOpenMessage = (msg: PortalMessage) => {
    setSelectedMessage(msg);
    if (!msg.isRead) {
      markMessageRead(msg.id);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-sky-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Mail className="w-4 h-4" />
            <span>Ersa Soğutma Müşteri Temsilcisi Hattı</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Mesajlar & Destek</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Finans, satış ve lojistik temsilcilerinizle doğrudan mesajlaşın
          </p>
        </div>

        <button
          onClick={() => {
            setSelectedMessage(null);
            setActiveTab('new');
          }}
          className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-600/30 transition self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Mesaj Gönder</span>
        </button>
      </div>

      {/* Main Mailbox Layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        
        {/* Navigation Tabs (Left 3 cols) */}
        <div className="md:col-span-3 space-y-2">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-3 shadow-xl space-y-1 text-xs">
            <button
              onClick={() => {
                setActiveTab('inbox');
                setSelectedMessage(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition ${
                activeTab === 'inbox' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Inbox className="w-4 h-4" />
                <span>Gelen Kutusu</span>
              </div>
              <span className="font-mono text-[10px] bg-slate-50 dark:bg-slate-950/60 px-1.5 py-0.5 rounded">
                {inboxMessages.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('sent');
                setSelectedMessage(null);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition ${
                activeTab === 'sent' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4" />
                <span>Giden Kutusu</span>
              </div>
              <span className="font-mono text-[10px] bg-slate-50 dark:bg-slate-950/60 px-1.5 py-0.5 rounded">
                {sentMessages.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('new');
                setSelectedMessage(null);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition ${
                activeTab === 'new' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Plus className="w-4 h-4 text-emerald-300" />
              <span>Yeni Mesaj Yaz</span>
            </button>
          </div>

          {/* Quick Rep Directory */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-4 shadow-xl text-xs space-y-2.5 hidden md:block">
            <div className="font-bold text-slate-300 text-[11px] uppercase tracking-wider">
              Temsilci Rehberi
            </div>
            <div className="space-y-2">
              {STAFF_RECIPIENTS.map((s) => (
                <div key={s.id} className="p-2 rounded-lg bg-slate-50 dark:bg-[#0B1120]/60 border border-slate-200 dark:border-slate-200 dark:border-slate-800/80">
                  <div className="font-bold text-slate-900 dark:text-white text-[11px]">{s.name}</div>
                  <div className="text-[10px] text-slate-400">{s.role}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content Area (Right 9 cols) */}
        <div className="md:col-span-9">
          
          {/* TAB 1: New Message Form */}
          {activeTab === 'new' && (
            <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in">
              <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-3 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                <span>Ersa Yetkilisine Mesaj Gönder</span>
              </h2>

              <form onSubmit={handleSendMessage} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                    Mesaj Atılacak Kişiyi / Birimi Seçiniz:
                  </label>
                  <select
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  >
                    {STAFF_RECIPIENTS.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} ({s.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                    Konu:
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Mesaj konusu (Örn: Ek Iskonto Talebi, Sevkiyat Durumu...)"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-700 dark:text-slate-300 font-semibold mb-1.5">
                    Mesaj Metni:
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Mesajınızı buraya yazınız..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 resize-none leading-relaxed"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-900/30 transition flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Mesajı Gönder</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2 & 3: Inbox / Sent List OR Single Message Viewer */}
          {activeTab !== 'new' && (
            selectedMessage ? (
              /* Single Message Viewer */
              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-6 shadow-xl space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <button
                      onClick={() => setSelectedMessage(null)}
                      className="text-xs text-sky-400 hover:text-sky-300 font-semibold mb-2 block"
                    >
                      ← Mesaj Listesine Dön
                    </button>
                    <h2 className="text-base font-black text-white">{selectedMessage.subject}</h2>
                    <div className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                      <span>Kod: <strong className="font-mono text-sky-400">{selectedMessage.code}</strong></span>
                      <span>•</span>
                      <span>Kimden: <strong className="text-white">{selectedMessage.sender}</strong></span>
                      <span>•</span>
                      <span>Tarih: <strong className="font-mono text-slate-300">{selectedMessage.date}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 leading-relaxed min-h-[160px] whitespace-pre-line">
                  {selectedMessage.content}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setRecipient(selectedMessage.sender.split('(')[0].trim());
                      setSubject(`Re: ${selectedMessage.subject}`);
                      setActiveTab('new');
                      setSelectedMessage(null);
                    }}
                    className="bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Yanıtla</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Message List Table */
              <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden shadow-2xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider bg-slate-50 dark:bg-slate-950/60">
                        <th className="py-3.5 px-4 w-32">Mesaj Kodu</th>
                        <th className="py-3.5 px-4 w-44">{activeTab === 'inbox' ? 'Gönderen' : 'Alıcı'}</th>
                        <th className="py-3.5 px-4">Konu</th>
                        <th className="py-3.5 px-4 w-32">Tarih</th>
                        <th className="py-3.5 px-4 text-right w-20">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-slate-200">
                      {(activeTab === 'inbox' ? inboxMessages : sentMessages).map((msg) => (
                        <tr
                          key={msg.id}
                          onClick={() => handleOpenMessage(msg)}
                          className={`hover:bg-slate-800/60 transition cursor-pointer ${
                            !msg.isRead && activeTab === 'inbox' ? 'bg-sky-950/30 font-bold text-slate-900 dark:text-white' : ''
                          }`}
                        >
                          <td className="py-3 px-4 font-mono font-bold text-sky-400">
                            {msg.code}
                          </td>
                          <td className="py-3 px-4 truncate max-w-[160px]">
                            {activeTab === 'inbox' ? msg.sender : msg.recipient}
                          </td>
                          <td className="py-3 px-4">
                            <span className="line-clamp-1">{msg.subject}</span>
                          </td>
                          <td className="py-3 px-4 font-mono text-slate-400">
                            {msg.date}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-sky-400 font-semibold hover:underline">
                              Oku →
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )
          )}

        </div>

      </div>

    </div>
  );
}
