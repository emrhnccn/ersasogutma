import { NextRequest, NextResponse } from 'next/server';
import { requireDealer } from '@/lib/auth-guard';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/b2b/messages - Get dealer messages
export async function GET() {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user, companyId } = guard;

  try {
    const whereClause: any = user.role === 'ADMIN' ? {} : { companyId };
    const messages = await prisma.portalMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ success: true, data: messages });
  } catch (error: unknown) {
    console.error('GET /api/b2b/messages error:', error);
    const message = error instanceof Error ? error.message : 'Mesajlar yüklenemedi.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

// POST /api/b2b/messages - Send message
export async function POST(request: NextRequest) {
  const guard = await requireDealer();
  if (guard instanceof NextResponse) return guard;

  const { user, companyId } = guard;

  try {
    const body = await request.json();
    const { department = 'GENEL', subject, content } = body;

    if (!subject || !content) {
      return NextResponse.json({ success: false, error: 'Konu ve mesaj içeriği zorunludur.' }, { status: 400 });
    }

    const message = await prisma.portalMessage.create({
      data: {
        senderId: user.id,
        companyId,
        department,
        subject,
        content,
        isRead: false
      }
    });

    return NextResponse.json({
      success: true,
      data: message,
      message: 'Mesajınız başarıyla iletildi.'
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('POST /api/b2b/messages error:', error);
    const message = error instanceof Error ? error.message : 'Mesaj gönderilemedi.';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
