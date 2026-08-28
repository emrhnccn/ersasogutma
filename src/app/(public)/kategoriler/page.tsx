'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Layers, ArrowRight, Package } from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  _count?: { products: number };
}

export default function PublicCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoading(true);
        const res = await fetch('/api/categories');
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setCategories(json.data);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">Ürün Kategorileri</h1>
          <p className="text-slate-600 text-lg">
            Soğutma ve iklimlendirme sektörüne yönelik tüm yedek parça ve ekipman grupları.
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-32"></div>
            ))}
          </div>
        ) : categories.length === 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[
              'Kompresörler',
              'Soğutucu Gazlar',
              'Fan Motorları & Pervaneler',
              'Termostatlar & Kontrol Cihazları',
              'Bakır Borular & Ek Parçalar',
              'Servis Ekipmanları & Manometreler',
              'Kondenser & Evaporatör Grupları',
              'Drayer & Filtreler',
            ].map((cat, i) => (
              <Link
                key={i}
                href={`/urunler`}
                className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center font-bold">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors text-lg">
                    {cat}
                  </h3>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Kataloğu Görüntüle</span>
                  <ArrowRight className="w-4 h-4 text-sky-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/urunler`}
                className="group bg-white p-6 rounded-2xl border border-slate-200 hover:border-sky-300 hover:shadow-xl transition-all flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center font-bold">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 group-hover:text-sky-600 transition-colors text-base">
                      {cat.name}
                    </h3>
                    {cat._count?.products !== undefined && (
                      <span className="text-xs text-slate-400 font-medium">
                        {cat._count.products} Ürün
                      </span>
                    )}
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between text-xs font-semibold text-slate-400">
                  <span>Ürünleri İncele</span>
                  <ArrowRight className="w-4 h-4 text-sky-600 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
