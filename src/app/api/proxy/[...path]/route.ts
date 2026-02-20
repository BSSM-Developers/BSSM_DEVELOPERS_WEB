import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL;
if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
}

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
  const targetUrl = `${BACKEND_URL}/${path}${query}`;

  try {
    const headers = new Headers(request.headers);
    headers.delete("host");
    headers.delete("connection");

    const body = request.method !== "GET" && request.method !== "HEAD" ? await request.blob() : undefined;

    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      redirect: "manual",
    });

    const responseHeaders = new Headers(backendResponse.headers);

    const setCookie = responseHeaders.get("set-cookie");
    if (setCookie) {
      const newSetCookie = setCookie.replace(/Domain=[^;]+;?/gi, "");
      responseHeaders.set("set-cookie", newSetCookie);
    }

    return new NextResponse(backendResponse.body, {
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Proxy Error:", error);
    return NextResponse.json({ error: "Proxy Failed" }, { status: 500 });
  }
}
