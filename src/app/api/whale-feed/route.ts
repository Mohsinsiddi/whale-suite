import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { WhaleFeed } from '@/lib/database/models';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);
    const eventType = searchParams.get('eventType');
    const timeRange = searchParams.get('timeRange'); // 24h, 7d, 30d

    await connectDB();

    // Build query
    const query: Record<string, unknown> = {};

    if (eventType && eventType !== 'all') {
      query.eventType = eventType;
    }

    if (timeRange) {
      const now = Date.now();
      let startTime: number;

      switch (timeRange) {
        case '24h':
          startTime = now - 24 * 60 * 60 * 1000;
          break;
        case '7d':
          startTime = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case '30d':
          startTime = now - 30 * 24 * 60 * 60 * 1000;
          break;
        default:
          startTime = 0;
      }

      if (startTime > 0) {
        query.blockTime = { $gte: Math.floor(startTime / 1000) };
      }
    }

    const [events, total] = await Promise.all([
      WhaleFeed.find(query)
        .sort({ blockTime: -1 })
        .skip(offset)
        .limit(limit)
        .lean(),
      WhaleFeed.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      events: events.map((event) => ({
        id: event._id?.toString(),
        whaleId: event.whaleId,
        eventType: event.eventType,
        amount: event.amount,
        token: event.token,
        usdValue: event.usdValue,
        displayText: event.displayText,
        signature: event.signature,
        blockTime: event.blockTime,
        createdAt: event.createdAt,
      })),
      total,
      hasMore: offset + events.length < total,
    });
  } catch (error) {
    console.error('Whale feed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
