import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, logAuditAction } from '@/lib/auth-guard';
import { ScrapeJobSchema } from '@/lib/validations';
import { scraperRegistry } from '@/lib/scrapers/scraperRegistry';

export const dynamic = 'force-dynamic';

export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const scrapers = scraperRegistry.getAllScrapers();
  const progress = scraperRegistry.getProgress();

  return NextResponse.json({
    success: true,
    scrapers,
    progress
  });
}

export async function POST(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  const { user } = guard;

  try {
    const body = await request.json();
    const parsed = ScrapeJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { action, providerId, options = {} } = parsed.data;

    if (action === 'stop') {
      scraperRegistry.stopScrape(providerId);

      await logAuditAction({
        actorId: user.id,
        action: 'SCRAPER_STOP',
        entityType: 'SupplierScraper',
        entityId: providerId,
        afterJson: { stoppedAt: new Date().toISOString() }
      });

      return NextResponse.json({
        success: true,
        message: `${providerId} için ürün çekme işlemi durduruldu.`
      });
    }

    const started = await scraperRegistry.startScrape(providerId, options);
    if (!started) {
      return NextResponse.json(
        { success: false, error: 'Zaten çalışan bir çekme işlemi var.' },
        { status: 409 }
      );
    }

    await logAuditAction({
      actorId: user.id,
      action: 'SCRAPER_START',
      entityType: 'SupplierScraper',
      entityId: providerId,
      afterJson: { options, startedAt: new Date().toISOString() }
    });

    return NextResponse.json({
      success: true,
      message: `${providerId} için ürün çekme işlemi başlatıldı.`
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
