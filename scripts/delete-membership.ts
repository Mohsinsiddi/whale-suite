/**
 * Delete a channel membership to test fresh join
 * Run: npx ts-node scripts/delete-membership.ts
 */

import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/whale-suite';

async function deleteMembership() {
  const wallet = process.argv[2];
  const channelSlug = process.argv[3] || 'diamond-vault';

  if (!wallet) {
    console.log('Usage: npx ts-node scripts/delete-membership.ts <wallet> [channel-slug]');
    console.log('Example: npx ts-node scripts/delete-membership.ts ABC123... diamond-vault');
    process.exit(1);
  }

  console.log('🗑️  Deleting membership...');
  console.log('   Wallet:', wallet);
  console.log('   Channel:', channelSlug);

  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  if (!db) {
    console.log('❌ Database connection not established');
    process.exit(1);
  }

  // Find channel
  const channel = await db.collection('channels').findOne({ slug: channelSlug });
  if (!channel) {
    console.log('❌ Channel not found:', channelSlug);
    process.exit(1);
  }

  // Delete membership
  const result = await db.collection('channelmemberships').deleteOne({
    wallet,
    channelId: channel._id,
  });

  if (result.deletedCount > 0) {
    console.log('✅ Membership deleted!');

    // Decrement member count
    await db.collection('channels').updateOne(
      { _id: channel._id },
      { $inc: { memberCount: -1 } }
    );
    console.log('✅ Channel member count updated');
  } else {
    console.log('⚠️  No membership found to delete');
  }

  await mongoose.disconnect();
}

deleteMembership().catch(console.error);
