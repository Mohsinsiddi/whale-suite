/**
 * PNP Proxy API Route
 * Proxies requests to the PNP market oracle API to avoid CORS issues
 */

import { NextRequest, NextResponse } from "next/server";

const PNP_PROXY_URL = process.env.PNP_PROXY_URL ||
                      "https://proxyserver-production-f61b.up.railway.app";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join("/");
    const url = `${PNP_PROXY_URL}/${pathString}`;

    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
      // Cache for 30 seconds to reduce load on upstream
      next: { revalidate: 30 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Upstream error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("PNP proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch from PNP API" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;
    const pathString = path.join("/");
    const url = `${PNP_PROXY_URL}/${pathString}`;
    const body = await request.json();

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: `Upstream error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("PNP proxy error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch from PNP API" },
      { status: 500 }
    );
  }
}
