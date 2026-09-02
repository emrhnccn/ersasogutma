import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ürünler | Ersa Soğutma — Soğutma Yedek Parça ve Ekipmanları',
  description: 'Kompresörler, soğutucu gazlar, fan motorları, servis ekipmanları ve daha fazlası. Ersa Soğutma profesyonel soğutma yedek parça kataloğu.',
  openGraph: {
    title: 'Ürünler | Ersa Soğutma',
    description: 'Profesyonel soğutma sistemleri yedek parça ve ekipman kataloğu.',
  },
};

export default function UrunlerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
