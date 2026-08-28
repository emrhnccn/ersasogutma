import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin',
          '/admin/*',
          '/cari',
          '/cari/*',
          '/finans',
          '/finans/*',
          '/siparisler',
          '/siparisler/*',
          '/teklifler',
          '/teklifler/*',
          '/profil',
          '/profil/*',
          '/garanti/*',
          '/iletisim/mesajlar',
          '/api/*'
        ]
      }
    ],
    sitemap: 'https://bayi.ersasogutma.com.tr/sitemap.xml'
  };
}
