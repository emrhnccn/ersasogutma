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
          '/bayi',
          '/bayi/*',
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
    sitemap: 'https://www.ersasogutma.com.tr/sitemap.xml'
  };
}
