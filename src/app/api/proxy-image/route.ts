import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Fast PNG placeholder if remote image is unreachable (prevents html2canvas SVG delays)
const FALLBACK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAINSURBVHhe7ZjZboMwEEXz/79WRV2UrVnLEpYEQsjStE+uBomIehLKZpOK+3AEkm2hOdgztnuWF89Mby+6iL2J3R69xOfvTkKxQwAEQAAEsIauAAEQAAEQAAEQAAEQwBq6AgRAAARAgBYBm+gkvPCYPOW2NlEuIDpexGjpiaehcWUwd8V2f2Z920C5gMHC/RV8yut0LaLTF+uvG6UCvN2RBZ7F3sZsjG6UCjC8HQs6y3IdsjG6USrACQ4s6CymH7ExulEqgNb4y7vNAif6I1OEhwsboxulAgjKA88TiwVv++q+WQblAggqhR/OLlnz9HyEP5+iRcAjAwEQ0KKAR8gFrQmg6tAfW8lTbtNJKwKC+DMJnkpi22cC7QKoJFLQ2X3B1NiyfrrQKoD+9L3TYZGDkYqcoVUA/Wk58OvucGzlBkgXKbSDpEsVua0O2gSsnJAFLUOzQx5H0LJJzxQkinKI3KcqWgTQvl8O9h4kSh4vL5u3mdNY4lQuICl3I5MFeo9kmmdK49wOWB9iYmzYt6qgVEC23JUhLY1/zRw6WMnfLIsyAbfKXRnGK7/QzKmbFJUIyCt3TVM3KSoRkFfuVFAnKTYuoEi5y6XAtL9F1aTYqABa93TrU5WFHYjhwmXMrC3re4sqS6FRAf8RCIAACIAACIAACIAA1tAVIAACIAACIKDzAix/f6GXLmL5sfgBYjpcUQFC8ZEAAAAASUVORK5CYII=',
  'base64'
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
      return new NextResponse(FALLBACK_PNG, {
        status: 200,
        headers: {
          'Content-Type': 'image/png',
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
    return new NextResponse(FALLBACK_PNG, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
