'use client';

import React, { useState, useRef, useEffect } from 'react';
import { TURKISH_PROVINCES, Province } from '@/lib/constants/provinces';
import { ChevronDown, Search, Check, MapPin, X } from 'lucide-react';

interface ProvinceSelectProps {
  value: string;
  onValueChange?: (city: string) => void;
  onChange?: (city: string) => void;
  error?: string | null;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ProvinceSelect({
  value,
  onValueChange,
  onChange,
  error,
  placeholder = 'İl Seçiniz (81 İl)',
  required = false,
  disabled = false,
  className = ''
}: ProvinceSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter provinces based on search query
  const filteredProvinces = TURKISH_PROVINCES.filter((p) => {
    const q = searchQuery.toLocaleLowerCase('tr-TR').trim();
    if (!q) return true;
    return (
      p.name.toLocaleLowerCase('tr-TR').includes(q) ||
      p.plateCode.includes(q)
    );
  });

  // Selected province object
  const selectedProvince = TURKISH_PROVINCES.find(
    (p) => p.name.toLocaleLowerCase('tr-TR') === value.toLocaleLowerCase('tr-TR')
  );

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const triggerChange = (val: string) => {
    if (onValueChange) {
      onValueChange(val);
    } else if (onChange) {
      onChange(val);
    }
  };

  const handleSelect = (province: Province) => {
    triggerChange(province.name);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    triggerChange('');
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3.5 py-3 text-left rounded-xl border transition-all text-sm font-medium ${
          error
            ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-400 text-rose-900 dark:text-rose-200'
            : isOpen
            ? 'border-sky-500 ring-2 ring-sky-500/20 bg-white dark:bg-[#111827]'
            : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B1120] text-slate-800 dark:text-slate-100 hover:border-slate-300 dark:hover:border-slate-600'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <div className="flex items-center gap-2.5 truncate">
          <MapPin className={`w-4 h-4 shrink-0 ${value ? 'text-sky-500' : 'text-slate-400'}`} />
          {selectedProvince ? (
            <div className="flex items-center gap-2 truncate">
              <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-900/50 text-sky-700 dark:text-sky-300 font-mono text-xs font-bold shrink-0">
                {selectedProvince.plateCode}
              </span>
              <span className="truncate font-semibold text-slate-900 dark:text-white">
                {selectedProvince.name}
              </span>
            </div>
          ) : value ? (
            <span className="truncate font-semibold text-slate-900 dark:text-white">{value}</span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">{placeholder} {required && '*'}</span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {value && !disabled && (
            <div
              role="button"
              onClick={handleClear}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Temizle"
            >
              <X className="w-3.5 h-3.5" />
            </div>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-sky-500' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150">
          {/* Search Bar */}
          <div className="p-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-[#0B1120]/80">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="İl adı veya plaka kodu ile ara (Örn: 34, Kocaeli)..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-[#151d30] border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Provinces List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/40 p-1 text-xs">
            {filteredProvinces.length === 0 ? (
              <div className="p-6 text-center text-slate-400 dark:text-slate-500">
                &ldquo;{searchQuery}&rdquo; ile eşleşen il bulunamadı.
              </div>
            ) : (
              filteredProvinces.map((province) => {
                const isSelected =
                  value.toLocaleLowerCase('tr-TR') === province.name.toLocaleLowerCase('tr-TR');

                return (
                  <button
                    key={province.id}
                    type="button"
                    onClick={() => handleSelect(province)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition text-left ${
                      isSelected
                        ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-300 font-bold'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-5 flex items-center justify-center rounded font-mono text-[11px] font-bold ${
                          isSelected
                            ? 'bg-sky-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {province.plateCode}
                      </span>
                      <span>{province.name}</span>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer count indicator */}
          <div className="px-3.5 py-2 bg-slate-50 dark:bg-[#0B1120] border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Toplam 81 İl</span>
            <span>{filteredProvinces.length} gösteriliyor</span>
          </div>
        </div>
      )}
    </div>
  );
}
