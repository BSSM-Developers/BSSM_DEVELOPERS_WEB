import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
}

const FORWARD_HEADER_KEYS = [
  "authorization",
  "cookie",
  "content-type",
  "accept",
  "x-requested-with",
  "x-csrf-token",
] as const;

const buildForwardHeaders = (requestHeaders: Headers): Headers => {
  const headers = new Headers();

  for (const key of FORWARD_HEADER_KEYS) {
    const value = requestHeaders.get(key);
    if (!value) {
      continue;
    }
    headers.set(key, value);
  }

  return headers;
};

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  return handleProxy(request, await params);
}

async function handleProxy(request: NextRequest, params: { path: string[] }) {
  const path = params.path.join("/");
  const query = request.nextUrl.search;
  const normalizedBaseUrl = BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  const targetUrl = `${normalizedBaseUrl}/${path}${query}`;

  try {
    const headers = buildForwardHeaders(request.headers);
    const body = request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined;

    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      redirect: "manual",
    });

    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.delete("set-cookie");

    const getSetCookie = (backendResponse.headers as Headers & {
      getSetCookie?: () => string[];
    }).getSetCookie;

    const setCookies = typeof getSetCookie === "function" ? getSetCookie.call(backendResponse.headers) : [];

    for (const cookie of setCookies) {
      const sanitizedCookie = cookie.replace(/Domain=[^;]+;?/gi, "");
      responseHeaders.append("set-cookie", sanitizedCookie);
    }

    if (setCookies.length === 0) {
      const mergedSetCookie = backendResponse.headers.get("set-cookie");
      if (mergedSetCookie) {
        responseHeaders.append("set-cookie", mergedSetCookie.replace(/Domain=[^;]+;?/gi, ""));
      }
    }

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    const message = error instanceof Error ? error.message : "Unknown proxy error";
    return NextResponse.json({ error: "Proxy Failed", reason: message }, { status: 500 });
  }
}
