/**
 * StarPay API Proxy
 * Proxies requests to StarPay API to avoid CORS issues
 *
 * SECURITY: API key is kept server-side only (no NEXT_PUBLIC_ prefix)
 */

import { NextRequest, NextResponse } from 'next/server';

const STARPAY_BASE_URL = 'https://www.starpay.cards/api/v1';
// Use server-side only env variable (no NEXT_PUBLIC_ prefix for security)
const API_KEY = process.env.STARPAY_API_KEY || '';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${STARPAY_BASE_URL}/${endpoint}${searchParams ? `?${searchParams}` : ''}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Key': API_KEY,
      },
      // Cache for 30 seconds
      next: { revalidate: 30 },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[StarPay Proxy] API Error:', response.status);
    }

    return NextResponse.json(data, { status: response.status });
  } catch {
    console.error('[StarPay Proxy] Request failed');
    return NextResponse.json(
      { error: 'Failed to fetch from StarPay API' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join('/');
  const url = `${STARPAY_BASE_URL}/${endpoint}`;

  try {
    const body = await request.json();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[StarPay Proxy] API Error:', response.status);
    }

    return NextResponse.json(data, { status: response.status });
  } catch {
    console.error('[StarPay Proxy] Request failed');
    return NextResponse.json(
      { error: 'Failed to fetch from StarPay API' },
      { status: 500 }
    );
  }
}
