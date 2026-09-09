'use client';

import React, { useState, useRef } from 'react';
import { UploadCloud, X, Image as ImageIcon, Loader2, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

interface ImageDropzoneProps {
  value: string;
  onChangeAction?: (url: string) => void;
  onChange?: (url: string) => void;
  label?: string;
  description?: string;
}

// Client-side image compression: resizes to max 1200x1200px and converts to WebP
async function compressImage(file: File): Promise<{ blob: Blob; dataUrl: string }> {
  // SVG or GIF should stay as-is
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ blob: file, dataUrl: reader.result as string });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 1200;
      let width = img.naturalWidth || img.width;
      let height = img.naturalHeight || img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        const reader = new FileReader();
        reader.onload = () => resolve({ blob: file, dataUrl: reader.result as string });
        reader.readAsDataURL(file);
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      const targetMime = 'image/webp';
      const dataUrl = canvas.toDataURL(targetMime, 0.85);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, dataUrl });
          } else {
            resolve({ blob: file, dataUrl });
          }
        },
        targetMime,
        0.85
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = () => resolve({ blob: file, dataUrl: reader.result as string });
      reader.readAsDataURL(file);
    };

    img.src = objectUrl;
  });
}

export function ImageDropzone({
  value,
  onChange,
  onChangeAction,
  label = 'Ürün Görseli',
  description = 'PNG, JPG, WEBP veya SVG (Otomatik optimize edilir)'
}: ImageDropzoneProps) {
  const triggerChange = (url: string) => {
    if (onChangeAction) onChangeAction(url);
    if (onChange) onChange(url);
  };
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadFile = async (file: File) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Lütfen geçerli bir görsel dosyası seçin (JPG, PNG, WEBP, GIF, SVG).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setErrorMessage('Dosya boyutu çok yüksek. Maksimum 15MB seçebilirsiniz.');
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);

    try {
      // 1. Compress image in browser (reduces megabytes down to ~50-100KB)
      const { blob, dataUrl } = await compressImage(file);

      // 2. Prepare upload payload
      const formData = new FormData();
      const ext = file.type === 'image/svg+xml' ? 'svg' : file.type === 'image/gif' ? 'gif' : 'webp';
      const cleanFileName = `${file.name.replace(/\.[^/.]+$/, '')}.${ext}`;
      formData.append('file', blob, cleanFileName);

      // 3. Try to upload to server API
      try {
        const res = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const json = await res.json();
          if (json.success && json.url) {
            triggerChange(json.url);
            return;
          }
        }
      } catch (networkErr) {
        console.warn('Sunucuya yükleme başarısız oldu, optimize edilmiş veri kullanılıyor:', networkErr);
      }

      // 4. Resilient Fallback: if server write failed or server is read-only (Vercel),
      // client-compressed WebP data URL ensures immediate success without blocking the user!
      triggerChange(dataUrl);
    } catch (err: any) {
      console.error('Görsel işleme hatası:', err);
      setErrorMessage(err?.message || 'Görsel işlenirken bir sorun oluştu.');
    } finally {
      setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUploadFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-slate-400 font-semibold text-xs">{label}</label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1 transition"
        >
          <LinkIcon className="w-3 h-3" />
          <span>{showUrlInput ? 'Sürükle-Bırak' : 'Direkt URL Gir'}</span>
        </button>
      </div>

      {showUrlInput ? (
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="https://... veya data:image/..."
            value={value}
            onChange={(e) => triggerChange(e.target.value)}
            className="flex-1 bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-sky-500 font-mono"
          />
          {value && (
            <button
              type="button"
              onClick={() => triggerChange('')}
              className="p-2 text-rose-400 hover:bg-rose-950/40 rounded-xl transition"
              title="Temizle"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      ) : value ? (
        <div className="relative group bg-slate-50 dark:bg-[#0B1120] border border-slate-200 dark:border-slate-700 rounded-xl p-2 flex items-center gap-3">
          <div className="w-16 h-16 rounded-lg bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center overflow-hidden flex-shrink-0">
            <img
              src={value}
              alt="Önizleme"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Görsel Yüklendi ve Hazır</span>
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
              {value.startsWith('data:') ? 'Yerleşik Optimize Görsel (WebP)' : value}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-[11px] text-sky-400 hover:text-sky-300 font-semibold transition"
              >
                Görseli Değiştir
              </button>
              <span className="text-slate-600">•</span>
              <button
                type="button"
                onClick={() => triggerChange('')}
                className="text-[11px] text-rose-400 hover:text-rose-300 font-semibold transition"
              >
                Kaldır
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-sky-500 bg-sky-500/10'
              : 'border-slate-800 bg-slate-50 dark:bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/60'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
              <span className="text-xs text-sky-300 font-medium">Görsel yükleniyor...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-full bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-center text-slate-400 group-hover:text-sky-400 transition">
                <UploadCloud className="w-5 h-5 text-sky-400" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-200">
                  <span className="text-sky-400 underline">Bilgisayardan dosya seçin</span> veya buraya sürükleyin
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">{description}</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {errorMessage && (
        <p className="text-[11px] text-rose-400 font-medium">{errorMessage}</p>
      )}
    </div>
  );
}
