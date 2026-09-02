'use client';

import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackText?: string;
}

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80';

export function ProductImage({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackText
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const cleanSrc = src && src.trim() !== '' ? src : null;

  if (!cleanSrc || hasError) {
    return (
      <div className={`flex flex-col items-center justify-center bg-slate-800/80 text-slate-400 p-2 text-center rounded ${className}`}>
        <Package className="w-6 h-6 text-slate-500 mb-1" />
        <span className="text-[10px] font-medium line-clamp-1">
          {fallbackText || alt || 'Görsel Hazırlanıyor'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 bg-slate-800 animate-pulse flex items-center justify-center">
          <Package className="w-5 h-5 text-slate-600" />
        </div>
      )}
      <img
        src={cleanSrc}
        alt={alt}
        className={`${className} ${loaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-200`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setHasError(true);
        }}
      />
    </div>
  );
}
