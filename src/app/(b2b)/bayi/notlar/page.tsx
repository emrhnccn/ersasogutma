'use client';

import React, { useState } from 'react';
import { useStore } from '@/context/StoreContext';
import { StickyNote, Plus, Trash2, Search } from 'lucide-react';

export default function NotesPage() {
  const { notes, addNote, deleteNote } = useStore();
  const [search, setSearch] = useState('');
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [showModal, setShowModal] = useState(false);

  const filteredNotes = notes.filter((n) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase().trim();
    return n.title.toLowerCase().includes(q) || n.description.toLowerCase().includes(q);
  });

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addNote({ title, description: desc });
    setTitle('');
    setDesc('');
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-yellow-400 text-xs font-bold uppercase tracking-wider mb-1">
            <StickyNote className="w-4 h-4" />
            <span>Kişisel Bayi Araçları</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Notlarım</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Siparişleriniz, müşteri talepleriniz ve parça listelerinizle ilgili özel notlar
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 bg-yellow-500 hover:bg-yellow-400 text-slate-950 font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-yellow-950/40 transition self-start"
        >
          <Plus className="w-4 h-4" />
          <span>Yeni Not Ekle</span>
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-4 shadow-xl">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Notlarda arayın..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-yellow-500"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Notes Grid */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl p-12 text-center text-slate-500 text-sm">
          Henüz kayıtlı bir notunuz bulunmamaktadır.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs hover:border-yellow-500/40 rounded-2xl p-5 shadow-xl transition flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2 mb-2">
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">{note.title}</h3>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                    title="Notu Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">
                  {note.description}
                </p>
              </div>

              <div className="text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-200 dark:border-slate-800/80 flex justify-between">
                <span>Oluşturulma:</span>
                <span>{note.date}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 dark:bg-slate-950/85 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Yeni Not Ekle</h3>
            <form onSubmit={handleAdd} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Başlık:</label>
                <input
                  type="text"
                  required
                  placeholder="Not başlığı..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-yellow-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Açıklama:</label>
                <textarea
                  rows={4}
                  placeholder="Notunuzun detayları..."
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-yellow-500 resize-none"
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
                  className="px-4 py-2 rounded-xl font-bold text-slate-950 bg-yellow-500 hover:bg-yellow-400 shadow-md shadow-yellow-950/40"
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
