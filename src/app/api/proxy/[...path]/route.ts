import { NextRequest, NextResponse } from "next/server";

// 백엔드 URL
const BACKEND_URL = "https://prod.bssm-dev.com";

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
    // 호스트 헤더는 백엔드에 맞게 제거하거나 변경해야 함
    headers.delete("host");
    headers.delete("connection");

    const body = request.method !== "GET" && request.method !== "HEAD" ? await request.blob() : undefined;

    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      // 중요: 백엔드와의 통신에서 리다이렉트를 수동으로 처리하지 않음 (브라우저가 알아서 하도록)
      redirect: "manual",
    });

    const responseHeaders = new Headers(backendResponse.headers);

    // [중요] Set-Cookie 헤더 처리
    // 백엔드가 Domain 설정을 해서 보내면 localhost에서 쿠키가 무시되므로, Domain 속성을 제거하여 재설정
    const setCookie = responseHeaders.get("set-cookie");
    if (setCookie) {
      // 여러 쿠키가 콤마로 연결되어 있을 수 있음 (단, set-cookie 헤더는 배열로 처리하는게 좋음)
      // fetch API에서 headers.get('set-cookie')는 모든 쿠키를 하나로 합쳐서 줄 수 있음.
      // Next.js NextResponse에서는 개별 처리가 필요할 수 있음.

      // Domain=... 부분을 제거
      const newSetCookie = setCookie.replace(/Domain=[^;]+;?/gi, "");
      responseHeaders.set("set-cookie", newSetCookie);
    }

    // CORS 관련 헤더 처리 (필요하다면)
    // 로컬 프록시이므로 Access-Control-Allow-Origin 등은 로컬에서 처리됨

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
