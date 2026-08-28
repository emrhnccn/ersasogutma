import { NextRequest, NextResponse } from 'next/server';
import { scraperRegistry } from '@/lib/scrapers/scraperRegistry';

export const dynamic = 'force-dynamic';

export async function GET() {
  const scrapers = scraperRegistry.getAllScrapers();
  const progress = scraperRegistry.getProgress();

  return NextResponse.json({
    success: true,
    scrapers,
    progress
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action = 'start', options = {} } = body;
    let providerId = body.providerId || 'ersaticaret';

    if (options?.targetUrl) {
      if (options.targetUrl.includes('girdap')) {
        providerId = 'girdap';
      } else {
        providerId = 'ersaticaret';
      }
    }

    if (action === 'stop') {
      scraperRegistry.stopScrape(providerId);
      return NextResponse.json({
        success: true,
        message: 'Ürün çekme işlemi durduruldu.'
      });
    }

    const started = await scraperRegistry.startScrape(providerId, options);
    if (!started) {
      return NextResponse.json(
        { success: false, error: 'Zaten çalışan bir çekme işlemi var.' },
        { status: 409 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${providerId} için ürün çekme işlemi arka planda başlatıldı.`
    });
  } catch (error: unknown) {
    console.error('Scrape API error:', error);
    const message = error instanceof Error ? error.message : 'İşlem başlatılırken hata oluştu.';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
