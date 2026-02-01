import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { Badge, User } from '@/lib/database/models';

export const dynamic = 'force-dynamic';

// Badge tier definitions
const BADGE_TIERS = {
  bronze: {
    id: 'bronze',
    name: 'Bronze Ghost',
    price: 0.5,
    color: '#CD7F32',
    icon: 'B',
    benefits: [
      '1 year premium access',
      '+10% privacy score boost',
      'Bronze badge NFT',
      '5% affiliate commission',
    ],
    requirements: {
      privacyScore: 50,
    },
  },
  silver: {
    id: 'silver',
    name: 'Silver Shadow',
    price: 2,
    color: '#C0C0C0',
    icon: 'S',
    benefits: [
      '1 year premium access',
      '+25% privacy score boost',
      'Silver badge NFT',
      '10% affiliate commission',
      'Silver Lounge access',
    ],
    requirements: {
      privacyScore: 150,
    },
  },
  gold: {
    id: 'gold',
    name: 'Gold Phantom',
    price: 5,
    color: '#FFD700',
    icon: 'G',
    benefits: [
      '1 year premium access',
      '+50% privacy score boost',
      'Gold badge NFT',
      '15% affiliate commission',
      'Custom themes',
      'Priority support',
    ],
    requirements: {
      privacyScore: 300,
    },
  },
  diamond: {
    id: 'diamond',
    name: 'Diamond Whale',
    price: 10,
    color: '#B9F2FF',
    icon: 'D',
    benefits: [
      '1 year premium access',
      '+100% privacy score boost',
      'Diamond badge NFT',
      '20% affiliate commission',
      'Whale Club access',
      'Feature voting rights',
    ],
    requirements: {
      privacyScore: 500,
      previousBadge: 'gold',
    },
  },
  legendary: {
    id: 'legendary',
    name: 'Legendary Titan',
    price: 25,
    color: '#FF00FF',
    icon: 'L',
    benefits: [
      '1 year premium access',
      '+200% privacy score boost',
      'Legendary badge NFT',
      '25% affiliate commission',
      '1% lifetime revenue share',
      'Hall of Fame',
    ],
    requirements: {
      privacyScore: 1000,
      previousBadge: 'diamond',
    },
  },
};

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get('wallet');

    await connectDB();

    interface BadgeDocument {
      _id?: { toString: () => string };
      tier: string;
      mintAddress: string;
      purchasePrice: number;
      status: string;
      purchasedAt: Date;
      metadata: Record<string, unknown>;
    }

    // Get user's current badge if wallet provided
    let userBadge = null;
    let userBadges: BadgeDocument[] = [];

    if (wallet) {
      const user = await User.findOne({ wallet });
      if (user) {
        userBadge = user.badgeTier;

        // Get all user's badges
        const badges = await Badge.find({ wallet })
          .sort({ purchasedAt: -1 })
          .lean();
        userBadges = badges as unknown as BadgeDocument[];
      }
    }

    const response = NextResponse.json({
      success: true,
      tiers: Object.values(BADGE_TIERS),
      userCurrentTier: userBadge,
      userBadges: userBadges.map((b) => ({
        id: b._id?.toString(),
        tier: b.tier,
        mintAddress: b.mintAddress,
        purchasePrice: b.purchasePrice,
        status: b.status,
        purchasedAt: b.purchasedAt,
        metadata: b.metadata,
      })),
    });

    // Only cache static tier definitions (no wallet param) - 5 minutes
    // User-specific badge data should not be cached
    if (!wallet) {
      response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    }
    return response;
  } catch (error) {
    console.error('Badges error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
