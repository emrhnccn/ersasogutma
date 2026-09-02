import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kategoriler | Ersa Soğutma — Ürün Grupları',
  description: 'Soğutma ve iklimlendirme sektörüne yönelik tüm yedek parça ve ekipman kategorileri. Kompresörler, gazlar, fan motorları ve daha fazlası.',
  openGraph: {
    title: 'Kategoriler | Ersa Soğutma',
    description: 'Soğutma yedek parça ve ekipman kategorileri.',
  },
};

export default function KategorilerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
