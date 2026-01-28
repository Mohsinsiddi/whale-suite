/**
 * StarPay API Proxy
 * Proxies requests to StarPay API to avoid CORS issues
 */

import { NextRequest, NextResponse } from 'next/server';

const STARPAY_BASE_URL = 'https://www.starpay.cards/api/v1';
const API_KEY = process.env.NEXT_PUBLIC_STARPAY_API_KEY || process.env.STARPAY_API_KEY || '';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const endpoint = path.join('/');
  const searchParams = request.nextUrl.searchParams.toString();
  const url = `${STARPAY_BASE_URL}/${endpoint}${searchParams ? `?${searchParams}` : ''}`;

  console.log('[StarPay Proxy] GET:', url);

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Key': API_KEY,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[StarPay Proxy] Error:', data);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[StarPay Proxy] Error:', error);
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

  console.log('[StarPay Proxy] POST:', url);

  try {
    const body = await request.json();
    console.log('[StarPay Proxy] Body:', body);

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
      console.error('[StarPay Proxy] Error:', data);
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error('[StarPay Proxy] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from StarPay API' },
      { status: 500 }
    );
  }
}
