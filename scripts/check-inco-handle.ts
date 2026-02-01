/**
 * Quick script to check if an INCO handle exists in the network
 * Run: npx ts-node scripts/check-inco-handle.ts <handle>
 */

const INCO_COVALIDATOR_URL = 'https://grpc.solana-devnet.alpha.devnet.inco.org';

async function checkHandle(handle: string) {
  console.log('🔍 Checking INCO handle:', handle);
  console.log('📡 Covalidator:', INCO_COVALIDATOR_URL);
  console.log('');

  try {
    // Try to fetch ciphertext info
    const response = await fetch(`${INCO_COVALIDATOR_URL}/crypto/getCiphertext`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle }),
    });

    console.log('Response status:', response.status);
    const data = await response.text();
    console.log('Response:', data);

    if (response.ok) {
      console.log('\n✅ Handle EXISTS in INCO network!');
    } else {
      console.log('\n❌ Handle NOT FOUND in INCO network');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

// Get handle from command line or use the Diamond proof handle
const handle = process.argv[2] || '288804414013741759444497767001555145505';
checkHandle(handle);
