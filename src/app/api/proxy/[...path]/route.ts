import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "";
if (!BACKEND_URL) {
  throw new Error("NEXT_PUBLIC_API_URL is not defined in environment variables");
}

const FORWARD_HEADER_KEYS = [
  "authorization",
  "content-type",
  "accept",
  "x-requested-with",
  "x-csrf-token",
] as const;

const parseCookieHeader = (cookieHeader: string): Array<{ name: string; value: string }> => {
  return cookieHeader
    .split(";")
    .map((chunk) => chunk.trim())
    .filter(Boolean)
    .map((chunk) => {
      const separatorIndex = chunk.indexOf("=");
      if (separatorIndex < 0) {
        return { name: chunk, value: "" };
      }
      const name = chunk.slice(0, separatorIndex).trim();
      const value = chunk.slice(separatorIndex + 1).trim();
      return { name, value };
    })
    .filter(({ name }) => name.length > 0);
};

const extractCookieValue = (request: NextRequest, key: string): string | null => {
  const rawCookieHeader = request.headers.get("cookie");
  if (rawCookieHeader) {
    const rawPairs = parseCookieHeader(rawCookieHeader);
    const matched = rawPairs.filter((item) => item.name === key);
    const latest = matched.at(-1)?.value;
    if (latest) {
      return latest;
    }
  }

  const fromParsed = request.cookies.get(key)?.value;
  if (fromParsed) {
    return fromParsed;
  }

  return null;
};

const buildForwardHeaders = (request: NextRequest, path: string): Headers => {
  const headers = new Headers();
  const isRefreshPath = path === "auth/refresh" || path.startsWith("auth/refresh/");

  for (const key of FORWARD_HEADER_KEYS) {
    const value = request.headers.get(key);
    if (!value) {
      continue;
    }
    headers.set(key, value);
  }

  if (isRefreshPath) {
    const refreshToken = extractCookieValue(request, "refresh_token");
    if (refreshToken) {
      headers.set("cookie", `refresh_token=${refreshToken}`);
    }
    return headers;
  }

  const rawCookieHeader = request.headers.get("cookie");
  if (rawCookieHeader) {
    headers.set("cookie", rawCookieHeader);
    return headers;
  }

  const parsedCookies = request.cookies.getAll();
  if (parsedCookies.length > 0) {
    const cookieHeader = parsedCookies.map(({ name, value }) => `${name}=${value}`).join("; ");
    headers.set("cookie", cookieHeader);
  }

  return headers;
};

const normalizeSetCookie = (cookie: string): string => {
  return cookie.replace(/;\s*Domain=[^;]*/gi, "");
};

const splitSetCookieHeader = (headerValue: string): string[] => {
  const result: string[] = [];
  let start = 0;
  let inExpires = false;

  for (let i = 0; i < headerValue.length; i += 1) {
    const current = headerValue[i];
    const next = headerValue.slice(i, i + 8).toLowerCase();

    if (next === "expires=") {
      inExpires = true;
      continue;
    }

    if (inExpires && current === ";") {
      inExpires = false;
    }

    if (!inExpires && current === ",") {
      const chunk = headerValue.slice(start, i).trim();
      if (chunk) {
        result.push(chunk);
      }
      start = i + 1;
    }
  }

  const tail = headerValue.slice(start).trim();
  if (tail) {
    result.push(tail);
  }

  return result;
};

const extractSetCookies = (headers: Headers): string[] => {
  const headerWithGetSetCookie = headers as Headers & {
    getSetCookie?: () => string[];
    raw?: () => Record<string, string[]>;
  };

  if (typeof headerWithGetSetCookie.getSetCookie === "function") {
    const cookies = headerWithGetSetCookie.getSetCookie();
    if (cookies.length > 0) {
      return cookies;
    }
  }

  if (typeof headerWithGetSetCookie.raw === "function") {
    const rawHeaders = headerWithGetSetCookie.raw();
    const cookies = rawHeaders["set-cookie"] ?? rawHeaders["Set-Cookie"];
    if (cookies && cookies.length > 0) {
      return cookies;
    }
  }

  const merged = headers.get("set-cookie");
  if (!merged) {
    return [];
  }

  return splitSetCookieHeader(merged);
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
  const isRefreshPath = path === "auth/refresh" || path.startsWith("auth/refresh/");
  const isSignUpPath = path === "signup" || path === "signup/me" || path.startsWith("signup/");
  const query = request.nextUrl.search;
  const normalizedBaseUrl = BACKEND_URL.endsWith("/") ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  const targetUrl = `${normalizedBaseUrl}/${path}${query}`;

  try {
    const headers = buildForwardHeaders(request, path);
    const body = request.method !== "GET" && request.method !== "HEAD" ? await request.text() : undefined;

    const backendResponse = await fetch(targetUrl, {
      method: request.method,
      headers: headers,
      body: body,
      credentials: "include",
      cache: "no-store",
      redirect: "manual",
    });

    const responseHeaders = new Headers(backendResponse.headers);
    responseHeaders.delete("set-cookie");
    responseHeaders.delete("content-encoding");
    responseHeaders.delete("content-length");
    responseHeaders.delete("transfer-encoding");

    const setCookies = extractSetCookies(backendResponse.headers);

    for (const cookie of setCookies) {
      responseHeaders.append("set-cookie", normalizeSetCookie(cookie));
    }

    if (isRefreshPath || !isSignUpPath) {
      responseHeaders.append(
        "set-cookie",
        "signup_token=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None"
      );
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
