import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { targetUrl, method } = await request.json();

    if (!targetUrl || !method) {
      return NextResponse.json(
        { error: "targetUrl and method are required" },
        { status: 400 }
      );
    }

    const backendResponse = await fetch(targetUrl, {
      method,
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
