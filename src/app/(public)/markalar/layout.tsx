import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Markalar | Ersa Soğutma — Distribütör Markaları',
  description: 'Embraco, Danfoss, Tecumseh, Copeland ve daha fazlası. Ersa Soğutma distribütörlük ve bayilik ağında yer alan global markalar.',
  openGraph: {
    title: 'Markalar | Ersa Soğutma',
    description: 'Ersa Soğutma distribütörlük ağındaki global soğutma markaları.',
  },
};

export default function MarkalarLayout({ children }: { children: React.ReactNode }) {
  return children;
}
