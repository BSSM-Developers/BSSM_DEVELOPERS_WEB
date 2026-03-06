import { NextRequest, NextResponse } from "next/server";

const ALLOWED_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);

const isPrivateIpv4Host = (hostname: string): boolean => {
  const parts = hostname.split(".").map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => Number.isNaN(part) || part < 0 || part > 255)) {
    return false;
  }

  const [a, b] = parts;
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
};

const isLocalOrPrivateHost = (hostname: string): boolean => {
  const normalized = hostname.trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  if (
    normalized === "localhost" ||
    normalized === "0.0.0.0" ||
    normalized === "127.0.0.1" ||
    normalized === "::1" ||
    normalized.endsWith(".local")
  ) {
    return true;
  }

  if (normalized.includes(":")) {
    return normalized === "::1" || normalized.startsWith("fc") || normalized.startsWith("fd") || normalized.startsWith("fe80:");
  }

  return isPrivateIpv4Host(normalized);
};

const isSameOriginRequest = (request: NextRequest): boolean => {
  const expectedOrigin = request.nextUrl.origin;
  const originHeader = request.headers.get("origin");
  if (originHeader) {
    return originHeader === expectedOrigin;
  }

  const refererHeader = request.headers.get("referer");
  if (!refererHeader) {
    return false;
  }

  try {
    return new URL(refererHeader).origin === expectedOrigin;
  } catch {
    return false;
  }
};

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json(
      { error: "forbidden" },
      { status: 403 }
    );
  }

  try {
    const { targetUrl, method } = await request.json() as { targetUrl?: string; method?: string };

    if (!targetUrl || !method) {
      return NextResponse.json(
        { error: "targetUrl and method are required" },
        { status: 400 }
      );
    }

    const normalizedMethod = method.toUpperCase();
    if (!ALLOWED_METHODS.has(normalizedMethod)) {
      return NextResponse.json(
        { error: "unsupported method" },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(targetUrl);
    } catch {
      return NextResponse.json(
        { error: "invalid targetUrl" },
        { status: 400 }
      );
    }

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return NextResponse.json(
        { error: "targetUrl must use http or https" },
        { status: 400 }
      );
    }

    if (parsedUrl.username || parsedUrl.password) {
      return NextResponse.json(
        { error: "targetUrl must not include credentials" },
        { status: 400 }
      );
    }

    if (isLocalOrPrivateHost(parsedUrl.hostname)) {
      return NextResponse.json(
        { error: "private or local network targets are not allowed" },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(parsedUrl.toString(), {
      method: normalizedMethod,
      headers: {
        Accept: "application/json",
      },
      redirect: "manual",
    });

    return NextResponse.json(
      {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch from target URL" },
      { status: 500 }
    );
  }
}
