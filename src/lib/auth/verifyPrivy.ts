/**
 * Privy Server-Side Auth Verification
 *
 * Best Practice Pattern:
 * 1. Frontend sends Privy access token in Authorization header
 * 2. API route verifies JWT on every request
 * 3. Extract user info from verified claims
 *
 * @see https://docs.privy.io/guide/server/authorization/verification
 */

import { PrivyClient } from '@privy-io/server-auth';

// Initialize Privy client (singleton)
const privy = new PrivyClient(
  process.env.NEXT_PUBLIC_PRIVY_APP_ID!,
  process.env.PRIVY_APP_SECRET!
);

export interface VerifiedUser {
  userId: string;
  wallet?: string;
  email?: string;
}

/**
 * Verify Privy access token from request
 *
 * Usage in API route:
 * ```ts
 * const user = await verifyPrivyToken(request);
 * if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
 * ```
 */
export async function verifyPrivyToken(request: Request): Promise<VerifiedUser | null> {
  try {
    // Extract token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.log('No Bearer token in Authorization header');
      return null;
    }

    const token = authHeader.slice(7);

    // Verify the JWT with Privy
    // This validates signature, expiration, issuer, and audience
    const verifiedClaims = await privy.verifyAuthToken(token);

    // Get full user details to extract wallet address
    const user = await privy.getUser(verifiedClaims.userId);

    // Extract wallet address from user
    let wallet: string | undefined;

    // Check embedded wallet first
    if (user.wallet?.address) {
      wallet = user.wallet.address;
    }

    // Then check linked Solana wallets
    if (!wallet && user.linkedAccounts) {
      const solanaWallet = user.linkedAccounts.find(
        (acc): acc is typeof acc & { address: string } =>
          acc.type === 'wallet' &&
          'chainType' in acc &&
          acc.chainType === 'solana' &&
          'address' in acc
      );
      if (solanaWallet) {
        wallet = solanaWallet.address;
      }
    }

    return {
      userId: verifiedClaims.userId,
      wallet,
      email: user.email?.address,
    };
  } catch (error) {
    console.error('Privy token verification failed:', error);
    return null;
  }
}

/**
 * Require authenticated user with wallet
 * Returns user or error response
 *
 * Usage:
 * ```ts
 * const auth = await requireWallet(request);
 * if ('error' in auth) return auth.error;
 * // auth.user.wallet is guaranteed to exist
 * ```
 */
export async function requireWallet(request: Request): Promise<
  { user: VerifiedUser & { wallet: string } } | { error: Response }
> {
  const user = await verifyPrivyToken(request);

  if (!user) {
    return {
      error: Response.json(
        { error: 'Unauthorized', message: 'Invalid or missing access token' },
        { status: 401 }
      ),
    };
  }

  if (!user.wallet) {
    return {
      error: Response.json(
        { error: 'No wallet', message: 'Please connect a Solana wallet' },
        { status: 400 }
      ),
    };
  }

  return { user: user as VerifiedUser & { wallet: string } };
}

/**
 * Require any authenticated user (wallet optional)
 */
export async function requireAuth(request: Request): Promise<
  { user: VerifiedUser } | { error: Response }
> {
  const user = await verifyPrivyToken(request);

  if (!user) {
    return {
      error: Response.json(
        { error: 'Unauthorized', message: 'Invalid or missing access token' },
        { status: 401 }
      ),
    };
  }

  return { user };
}
