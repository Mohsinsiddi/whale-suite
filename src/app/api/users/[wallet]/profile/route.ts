import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/database/mongodb';
import { User } from '@/lib/database/models';
import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/[wallet]/profile
 * Get user profile settings (public endpoint for shareable profiles)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    await connectDB();
    const { wallet } = await params;

    // Fetch user and calculate rank in parallel
    const [user, rank] = await Promise.all([
      User.findOne({ wallet }).select(
        'wallet userNumber badgeTier points privacyScore streak profile stats createdAt'
      ).lean(),
      // Calculate rank (users with more points + 1)
      User.findOne({ wallet }).then(async (u) => {
        if (!u) return null;
        const higherCount = await User.countDocuments({ points: { $gt: u.points } });
        return higherCount + 1;
      }),
    ]);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Get total users for percentile calculation
    const totalUsers = await User.countDocuments();
    const percentile = totalUsers > 0 ? Math.round(((totalUsers - (rank || 1)) / totalUsers) * 100) : 0;

    // Default profile settings (merge with existing to fill missing fields)
    const defaultVisibleStats = {
      points: true,
      privacyScore: true,
      streak: true,
      rank: true,
      badges: true,
      transactions: false,
      hiddenVolume: false,
      memberSince: true,
      activity: false,
    };

    const profileData = {
      isPublic: user.profile?.isPublic ?? false,
      avatarUrl: user.profile?.avatarUrl,
      displayName: user.profile?.displayName,
      visibleStats: {
        ...defaultVisibleStats,
        ...(user.profile?.visibleStats || {}),
      },
    };

    return NextResponse.json({
      success: true,
      profile: profileData,
      user: {
        wallet: user.wallet,
        userNumber: user.userNumber,
        badgeTier: user.badgeTier,
        points: user.points,
        privacyScore: user.privacyScore,
        streak: user.streak,
        stats: user.stats,
        createdAt: user.createdAt,
        // Include rank data for public profiles
        rank: rank,
        totalUsers: totalUsers,
        percentile: percentile,
      },
    });
  } catch (error) {
    console.error('Profile GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch profile' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/[wallet]/profile
 * Update user profile settings
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    await connectDB();
    const { wallet } = await params;
    const body = await request.json();

    const { isPublic, displayName, visibleStats } = body;

    // Build update object
    const updateFields: Record<string, unknown> = {};

    if (typeof isPublic === 'boolean') {
      updateFields['profile.isPublic'] = isPublic;
    }

    if (displayName !== undefined) {
      // Validate display name (max 30 chars, no special chars except space/underscore)
      if (displayName && (displayName.length > 30 || !/^[a-zA-Z0-9_ ]*$/.test(displayName))) {
        return NextResponse.json(
          { success: false, error: 'Invalid display name' },
          { status: 400 }
        );
      }
      updateFields['profile.displayName'] = displayName || null;
    }

    if (visibleStats && typeof visibleStats === 'object') {
      const validStats = ['points', 'privacyScore', 'streak', 'rank', 'badges', 'transactions', 'hiddenVolume', 'memberSince', 'activity'];
      for (const [key, value] of Object.entries(visibleStats)) {
        if (validStats.includes(key) && typeof value === 'boolean') {
          updateFields[`profile.visibleStats.${key}`] = value;
        }
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    console.log('Profile PATCH - updateFields:', JSON.stringify(updateFields));

    const user = await User.findOneAndUpdate(
      { wallet },
      { $set: updateFields },
      { new: true }
    ).select('profile').lean();

    console.log('Profile PATCH - updated user.profile:', JSON.stringify(user?.profile));

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Merge with defaults to ensure all fields are present
    const defaultVisibleStats = {
      points: true,
      privacyScore: true,
      streak: true,
      rank: true,
      badges: true,
      transactions: false,
      hiddenVolume: false,
      memberSince: true,
      activity: false,
    };

    const profileData = {
      isPublic: user.profile?.isPublic ?? false,
      avatarUrl: user.profile?.avatarUrl,
      displayName: user.profile?.displayName,
      visibleStats: {
        ...defaultVisibleStats,
        ...(user.profile?.visibleStats || {}),
      },
    };

    return NextResponse.json({
      success: true,
      profile: profileData,
    });
  } catch (error) {
    console.error('Profile PATCH error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update profile' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/users/[wallet]/profile
 * Upload avatar image to Cloudinary
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ wallet: string }> }
) {
  try {
    await connectDB();
    const { wallet } = await params;

    // Check if user exists
    const user = await User.findOne({ wallet });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'File too large (max 5MB)' },
        { status: 400 }
      );
    }

    // Convert to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(dataUri, {
      folder: 'whale-suite/avatars',
      public_id: `avatar_${wallet.slice(0, 8)}`,
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { width: 256, height: 256, crop: 'fill', gravity: 'face' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    // Update user profile with new avatar URL
    await User.findOneAndUpdate(
      { wallet },
      { $set: { 'profile.avatarUrl': result.secure_url } }
    );

    return NextResponse.json({
      success: true,
      avatarUrl: result.secure_url,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
