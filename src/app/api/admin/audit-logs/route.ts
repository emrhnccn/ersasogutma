import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/admin/audit-logs - Get recent audit logs
export async function GET() {
  const guard = await requireAdmin();
  if (guard instanceof NextResponse) return guard;

  try {
    const logs = await prisma.auditLog.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        actor: {
          select: { id: true, name: true, username: true, email: true, role: true }
        }
      }
    });

    const mapped = logs.map((l) => ({
      id: l.id,
      actorName: l.actor?.name || l.actor?.username || l.actor?.email || 'Sistem',
      actorRole: l.actor?.role || 'SYSTEM',
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId,
      beforeJson: l.beforeJson ? JSON.parse(l.beforeJson) : null,
      afterJson: l.afterJson ? JSON.parse(l.afterJson) : null,
      createdAt: l.createdAt.toLocaleString('tr-TR')
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error: unknown) {
    console.error('GET /api/admin/audit-logs error:', error);
    const message = error instanceof Error ? error.message : 'Audit loglar yüklenemedi.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
