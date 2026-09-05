import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, maskSensitiveAuditData } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/audit-logs - Get paginated & filtered audit logs with export support
export async function GET(request: NextRequest) {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const action = searchParams.get('action');
    const entityType = searchParams.get('entityType');
    const q = searchParams.get('q')?.trim();
    const exportFormat = searchParams.get('export'); // 'csv' or null

    const where: Record<string, any> = {};

    if (action && action !== 'ALL') {
      where.action = action;
    }

    if (entityType && entityType !== 'ALL') {
      where.entityType = entityType;
    }

    if (q) {
      where.OR = [
        { action: { contains: q, mode: 'insensitive' } },
        { entityType: { contains: q, mode: 'insensitive' } },
        { entityId: { contains: q, mode: 'insensitive' } },
        { actor: { name: { contains: q, mode: 'insensitive' } } },
        { actor: { username: { contains: q, mode: 'insensitive' } } },
        { actor: { email: { contains: q, mode: 'insensitive' } } }
      ];
    }

    const [totalCount, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        take: exportFormat === 'csv' ? 5000 : limit,
        skip: exportFormat === 'csv' ? 0 : (page - 1) * limit,
        orderBy: { createdAt: 'desc' },
        include: {
          actor: {
            select: { id: true, name: true, username: true, email: true, role: true }
          }
        }
      })
    ]);

    const mapped = logs.map((l) => {
      let beforeObj = null;
      let afterObj = null;
      try {
        if (l.beforeJson) beforeObj = maskSensitiveAuditData(JSON.parse(l.beforeJson));
      } catch {}
      try {
        if (l.afterJson) afterObj = maskSensitiveAuditData(JSON.parse(l.afterJson));
      } catch {}

      return {
        id: l.id,
        actorName: l.actor?.name || l.actor?.username || l.actor?.email || 'Sistem',
        actorEmail: l.actor?.email || '-',
        actorRole: l.actor?.role || 'SYSTEM',
        action: l.action,
        entityType: l.entityType,
        entityId: l.entityId,
        beforeJson: beforeObj,
        afterJson: afterObj,
        createdAt: l.createdAt.toLocaleString('tr-TR'),
        rawDate: l.createdAt.toISOString()
      };
    });

    if (exportFormat === 'csv') {
      const headers = ['ID', 'Tarih', 'Kullanıcı', 'Rol', 'İşlem', 'Varlık Tipi', 'Varlık ID'];
      const rows = mapped.map(l => [
        `"${l.id}"`,
        `"${l.createdAt}"`,
        `"${l.actorName} (${l.actorEmail})"`,
        `"${l.actorRole}"`,
        `"${l.action}"`,
        `"${l.entityType}"`,
        `"${l.entityId}"`
      ]);

      const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="audit_logs_${Date.now()}.csv"`
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: mapped,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error: unknown) {
    console.error('GET /api/admin/audit-logs error:', error);
    const message = error instanceof Error ? error.message : 'Audit loglar yüklenemedi.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
