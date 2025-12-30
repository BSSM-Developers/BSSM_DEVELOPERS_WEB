import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dev.bssm-dev.com';

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const pathStr = path.join('/');
  const url = `${BACKEND_URL}/${pathStr}${request.nextUrl.search}`;

  console.log(`[Proxy] ${request.method} ${url}`);

  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('connection');

  try {
    const body = request.body; // Stream

    const response = await fetch(url, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? body : undefined,
      // @ts-ignore - duplex is needed for streaming bodies in some environments, though standard fetch might not need it
      duplex: 'half',
    });

    const responseHeaders = new Headers(response.headers);

    // Rewrite Set-Cookie header
    const setCookie = responseHeaders.get('set-cookie');
    if (setCookie) {
      // Remove Domain attribute to allow localhost to save it
      const newSetCookie = setCookie.replace(/Domain=[^;]+;?/g, '');
      responseHeaders.set('set-cookie', newSetCookie);
      console.log(`[Proxy] Rewrote cookie: ${newSetCookie}`);
    }

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error('[Proxy] Error:', error);
    return NextResponse.json({ message: 'Proxy Error', error: String(error) }, { status: 500 });
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const HEAD = proxy;
export const OPTIONS = proxy;
