import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// SVG placeholder if remote image is unreachable
const FALLBACK_SVG = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect width="64" height="64" rx="8" fill="#F1F5F9"/>
    <path d="M20 44L28 34L34 40L40 32L46 44H20Z" fill="#CBD5E1"/>
    <circle cx="26" cy="26" r="3" fill="#CBD5E1"/>
  </svg>`,
  'utf8'
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse('Missing "url" parameter', { status: 400 });
  }

  // Only allow valid HTTP / HTTPS targets
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    return new NextResponse('Invalid URL protocol', { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 800); // Fast 800ms timeout

    const remoteRes = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        Referer: targetUrl,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!remoteRes.ok) {
      console.warn(`[proxy-image] Remote fetch returned ${remoteRes.status} for ${targetUrl}`);
      return new NextResponse(FALLBACK_SVG, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=3600',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const contentType = remoteRes.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await remoteRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
      },
    });
  } catch (err: any) {
    console.warn(`[proxy-image] Error proxying ${targetUrl}:`, err?.message || err);
    return new NextResponse(FALLBACK_SVG, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
