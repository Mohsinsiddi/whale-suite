import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { User, Transaction } from '@/lib/database/models';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[wallet]/activity
 * Get user's recent activity for public profile (if enabled)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    await connectDB();
    const { wallet } = await params;
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '5'), 10);

    // Check if user exists and has activity sharing enabled
    const user = await User.findOne({ wallet }).select('profile').lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if profile is public and activity/transactions is visible
    const isActivityVisible = user.profile?.visibleStats?.activity || user.profile?.visibleStats?.transactions;
    if (!user.profile?.isPublic || !isActivityVisible) {
      return NextResponse.json(
        { success: false, error: 'Activity not visible' },
        { status: 403 }
      );
    }

    // Fetch recent transactions
    const transactions = await Transaction.find({
      wallet,
      status: 'confirmed'
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .select('type amount token createdAt metadata')
      .lean();

    // Format activities for display (hide sensitive amounts)
    const activities = transactions.map(tx => {
      let description = '';
      let displayType: string = tx.type;

      switch (tx.type) {
        case 'shadow_transfer':
          description = 'Private transfer completed';
          displayType = 'transfer';
          break;
        case 'privacy_deposit':
          description = 'Shielded balance';
          displayType = 'deposit';
          break;
        case 'privacy_withdraw':
          description = 'Unshielded balance';
          displayType = 'withdraw';
          break;
        case 'jupiter_swap':
          description = 'Swapped tokens';
          displayType = 'swap';
          break;
        case 'pnp_bet':
          description = 'Placed prediction';
          displayType = 'bet';
          break;
        case 'badge_purchase':
          description = 'Purchased badge';
          displayType = 'badge';
          break;
        case 'subscription_payment':
          description = 'Premium subscription';
          displayType = 'subscription';
          break;
        case 'referral_payout':
          description = 'Referral reward';
          displayType = 'referral';
          break;
        case 'card_order':
          description = 'Ordered card';
          displayType = 'card';
          break;
        default:
          description = 'Transaction completed';
      }

      return {
        type: displayType,
        description,
        timestamp: tx.createdAt,
        // Only show points if available in metadata
        points: tx.metadata?.pointsEarned || null,
      };
    });

    return NextResponse.json({
      success: true,
      activities,
    });
  } catch (error) {
    console.error('Activity API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
