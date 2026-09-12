'use client';

import React from 'react';
import Link from 'next/link';

interface BrandLogoProps {
  variant?: 'auto' | 'light' | 'dark' | 'app-icon';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showSubtitle?: boolean;
  subtitle?: string;
  badge?: string;
  href?: string;
  className?: string;
}

export function BrandEmblem({
  size = 'md',
  variant = 'auto',
  className = ''
}: {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'auto' | 'light' | 'dark' | 'app-icon';
  className?: string;
}) {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  if (variant === 'app-icon') {
    return (
      <div className={`rounded-xl overflow-hidden shadow-xs flex-shrink-0 ${sizeMap[size]} ${className}`}>
        <img
          src="/images/logo/app-icon.png"
          alt="Ersa Soğutma"
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className={`relative flex-shrink-0 ${sizeMap[size]} ${className}`}>
      {variant === 'dark' ? (
        <img
          src="/images/logo/brand-emblem-dark.png"
          alt="Ersa Soğutma"
          className="w-full h-full object-contain"
        />
      ) : variant === 'light' ? (
        <img
          src="/images/logo/brand-emblem-light.png"
          alt="Ersa Soğutma"
          className="w-full h-full object-contain"
        />
      ) : (
        <>
          {/* Light theme emblem */}
          <img
            src="/images/logo/brand-emblem-light.png"
            alt="Ersa Soğutma"
            className="w-full h-full object-contain dark:hidden"
          />
          {/* Dark theme app icon emblem */}
          <img
            src="/images/logo/app-icon.png"
            alt="Ersa Soğutma"
            className="w-full h-full object-cover rounded-xl hidden dark:block shadow-xs"
          />
        </>
      )}
    </div>
  );
}

export function BrandLogo({
  variant = 'auto',
  size = 'md',
  showSubtitle = true,
  subtitle,
  badge = 'BAYİ PORTALI',
  href,
  className = ''
}: BrandLogoProps) {
  const textSizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
    xl: 'text-2xl'
  };

  const badgeSizeMap = {
    xs: 'text-[8px] px-1 py-0.1',
    sm: 'text-[9px] px-1.5 py-0.2',
    md: 'text-[9px] px-2 py-0.5',
    lg: 'text-[10px] px-2.5 py-0.5',
    xl: 'text-xs px-3 py-1'
  };

  const content = (
    <div className={`flex items-center gap-2.5 group select-none ${className}`}>
      <BrandEmblem size={size} variant={variant === 'app-icon' ? 'app-icon' : 'auto'} />
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`font-black tracking-tight uppercase leading-none ${textSizeMap[size]} text-slate-900 dark:text-white`}>
            ERSA <span className="text-orange-600 dark:text-orange-500">SOĞUTMA</span>
          </span>
          {badge && (
            <span
              className={`font-bold rounded-md uppercase font-mono tracking-wider leading-none bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800/60 ${badgeSizeMap[size]}`}
            >
              {badge}
            </span>
          )}
        </div>
        {showSubtitle && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5 font-medium font-mono truncate">
            {subtitle || 'bayi.ersasogutma.com.tr'}
          </span>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center transition hover:opacity-95">
        {content}
      </Link>
    );
  }

  return content;
}
