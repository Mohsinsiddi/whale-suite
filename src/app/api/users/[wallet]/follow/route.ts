import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { Follow, User, getFollowerCount, getFollowingCount, isFollowing } from '@/lib/database/models';

interface RouteParams {
  params: Promise<{ wallet: string }>;
}

// GET - Get follow status and counts
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { wallet } = await params;
    const { searchParams } = new URL(request.url);
    const viewerWallet = searchParams.get('viewer');

    await connectDB();

    // Get counts
    const [followers, following] = await Promise.all([
      getFollowerCount(wallet),
      getFollowingCount(wallet),
    ]);

    // Check if viewer is following this wallet
    let isFollowingUser = false;
    if (viewerWallet && viewerWallet !== wallet) {
      isFollowingUser = await isFollowing(viewerWallet, wallet);
    }

    return NextResponse.json({
      success: true,
      followers,
      following,
      isFollowing: isFollowingUser,
    });
  } catch (error) {
    console.error('Failed to get follow status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Follow a user
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { wallet: targetWallet } = await params;
    const body = await request.json();
    const { followerWallet } = body;

    if (!followerWallet) {
      return NextResponse.json(
        { success: false, error: 'Follower wallet required' },
        { status: 400 }
      );
    }

    if (followerWallet === targetWallet) {
      return NextResponse.json(
        { success: false, error: 'Cannot follow yourself' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if target user exists
    const targetUser = await User.findOne({ wallet: targetWallet });
    if (!targetUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if already following
    const existingFollow = await Follow.findOne({
      followerWallet,
      followingWallet: targetWallet,
    });

    if (existingFollow) {
      if (existingFollow.isActive) {
        return NextResponse.json({
          success: true,
          message: 'Already following',
          isFollowing: true,
        });
      } else {
        // Reactivate follow
        existingFollow.isActive = true;
        existingFollow.followedAt = new Date();
        await existingFollow.save();

        return NextResponse.json({
          success: true,
          message: 'Followed',
          isFollowing: true,
        });
      }
    }

    // Create new follow
    await Follow.create({
      followerWallet,
      followingWallet: targetWallet,
      isActive: true,
      followedAt: new Date(),
    });

    // Get updated counts
    const followers = await getFollowerCount(targetWallet);

    return NextResponse.json({
      success: true,
      message: 'Followed',
      isFollowing: true,
      followers,
    });
  } catch (error) {
    console.error('Failed to follow user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE - Unfollow a user
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { wallet: targetWallet } = await params;
    const { searchParams } = new URL(request.url);
    const followerWallet = searchParams.get('follower');

    if (!followerWallet) {
      return NextResponse.json(
        { success: false, error: 'Follower wallet required' },
        { status: 400 }
      );
    }

    await connectDB();

    // Find and deactivate follow
    const follow = await Follow.findOne({
      followerWallet,
      followingWallet: targetWallet,
      isActive: true,
    });

    if (!follow) {
      return NextResponse.json({
        success: true,
        message: 'Not following',
        isFollowing: false,
      });
    }

    follow.isActive = false;
    await follow.save();

    // Get updated counts
    const followers = await getFollowerCount(targetWallet);

    return NextResponse.json({
      success: true,
      message: 'Unfollowed',
      isFollowing: false,
      followers,
    });
  } catch (error) {
    console.error('Failed to unfollow user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
