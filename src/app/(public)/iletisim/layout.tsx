import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'İletişim | Ersa Soğutma — Bize Ulaşın',
  description: 'Ersa Soğutma ile iletişime geçin. Bayilik başvurusu, teknik destek ve sipariş bilgileri için bize ulaşabilirsiniz.',
  openGraph: {
    title: 'İletişim | Ersa Soğutma',
    description: 'Ersa Soğutma iletişim bilgileri ve bayilik başvurusu.',
  },
};

export default function IletisimLayout({ children }: { children: React.ReactNode }) {
  return children;
}
