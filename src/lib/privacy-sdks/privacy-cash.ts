/**
 * Privacy Cash Service
 * Integration with Privacy Cash SDK for private balance management
 *
 * Features:
 * - Deposit SOL to shielded pool (ZK proofs)
 * - Withdraw SOL from shielded pool
 * - SPL token support (USDC, USDT)
 *
 * @see https://github.com/Privacy-Cash/privacy-cash-sdk
 */

import {
  Connection,
  PublicKey,
  VersionedTransaction,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

// Privacy Cash SDK - Frontend utilities
import {
  deposit,
  withdraw,
  depositSPL,
  withdrawSPL,
  EncryptionService,
  getBalanceFromUtxos,
  getUtxos,
  getBalanceFromUtxosSPL,
  getUtxosSPL,
} from 'privacycash/utils';

const HELIUS_API_KEY = process.env.NEXT_PUBLIC_HELIUS_API_KEY;
const HELIUS_RPC = `https://mainnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`;

// Circuit files path (served from public folder)
// SDK appends .wasm and .zkey to this path
const CIRCUIT_BASE_PATH = '/circuit2/transaction2';

// Fee constants (in SOL) - Default for SOL, use getTokenFees() for other tokens
export const PRIVACY_FEES = {
  WITHDRAWAL_FEE: 0.006, // ~6,000,000 lamports - relay fee for ZK withdrawal
  DEPOSIT_FEE: 0, // No deposit fee from Privacy Cash (only minimal network fee)
  MIN_DEPOSIT: 0.001, // Minimum deposit amount
  MIN_WITHDRAWAL: 0.007, // Minimum withdrawal (must be > fee to receive something)
  RECOMMENDED_MIN_BALANCE: 0.01, // Recommended minimum for withdrawals
};

// Get fees for a specific token
export function getTokenFees(tokenSymbol: PrivacyCashTokenSymbol = 'SOL') {
  const token = getPrivacyCashToken(tokenSymbol);
  if (!token) {
    return PRIVACY_FEES;
  }
  return {
    WITHDRAWAL_FEE: token.withdrawalFee,
    DEPOSIT_FEE: 0,
    MIN_DEPOSIT: token.minDeposit,
    MIN_WITHDRAWAL: token.minWithdrawal,
    RECOMMENDED_MIN_BALANCE: token.minWithdrawal * 1.5,
  };
}

// Import from centralized token config
import {
  PRIVACY_CASH_TOKENS,
  getPrivacyCashToken,
  getPrivacyCashWithdrawalFee,
  getPrivacyCashMinDeposit,
  getPrivacyCashMinWithdrawal,
  type PrivacyCashTokenSymbol,
  type PrivacyCashToken,
} from '@/lib/tokens';

// Re-export for convenience
export { PRIVACY_CASH_TOKENS, getPrivacyCashToken, type PrivacyCashTokenSymbol, type PrivacyCashToken };

export type PrivacyAction = 'deposit' | 'withdraw';

export interface ValidationResult {
  valid: boolean;
  error?: string;
  details?: {
    required: number;
    available: number;
    fee: number;
  };
}

export interface PrivacyTxResult {
  success: boolean;
  signature?: string;
  error?: string;
  action: PrivacyAction;
  amount: number;
  newPrivateBalance?: number;
}

export interface PrivateBalance {
  balance: number; // in token units (e.g., SOL, USDC)
  baseUnits: number; // in smallest units (lamports for SOL, etc.)
  lastUpdated: number;
  token: PrivacyCashTokenSymbol;
}

// Multi-token balance map
export interface PrivateBalances {
  [token: string]: PrivateBalance;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let lightWasm: any = null;

/**
 * Get localStorage safely (returns a mock for SSR)
 */
function getStorage(): Storage {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  // Return a mock storage for SSR - operations will fail gracefully
  return {
    length: 0,
    clear: () => {},
    getItem: () => null,
    key: () => null,
    removeItem: () => {},
    setItem: () => {},
  };
}

/**
 * Initialize the Light Protocol WASM module
 * Note: Requires postinstall script to copy WASM files to browser-fat/es/
 */
async function initLightWasm() {
  if (lightWasm) return lightWasm;

  try {
    const { WasmFactory } = await import('@lightprotocol/hasher.rs');
    lightWasm = await WasmFactory.getInstance();
    return lightWasm;
  } catch (error) {
    console.error('Failed to initialize Light WASM:', error);
    throw new Error('Failed to initialize privacy module');
  }
}

/**
 * Get wallet signature for encryption key derivation
 */
async function getWalletSignature(
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<Uint8Array> {
  const encodedMessage = new TextEncoder().encode('Privacy Money account sign in');

  try {
    let signature = await signMessage(encodedMessage);

    // Handle case where signMessage returns an object
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((signature as any).signature) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      signature = (signature as any).signature;
    }

    if (!(signature instanceof Uint8Array)) {
      throw new Error('Signature is not a Uint8Array');
    }

    return signature;
  } catch (error) {
    if (error instanceof Error && error.message?.toLowerCase().includes('user rejected')) {
      throw new Error('User rejected the signature request');
    }
    throw error;
  }
}

class PrivacyCashService {
  private connection: Connection;
  private encryptionService: EncryptionService | null = null;

  constructor() {
    this.connection = new Connection(HELIUS_RPC, 'confirmed');
  }

  /**
   * Initialize encryption service with wallet signature
   */
  async initEncryption(
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
  ): Promise<EncryptionService> {
    if (this.encryptionService) {
      return this.encryptionService;
    }

    const signature = await getWalletSignature(signMessage);
    this.encryptionService = new EncryptionService();
    this.encryptionService.deriveEncryptionKeyFromSignature(signature);

    return this.encryptionService;
  }

  /**
   * Get private (shielded) balance for SOL or SPL token
   */
  async getPrivateBalance(
    publicKey: PublicKey,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>,
    tokenSymbol: PrivacyCashTokenSymbol = 'SOL'
  ): Promise<PrivateBalance> {
    try {
      const encryptionService = await this.initEncryption(signMessage);
      const token = getPrivacyCashToken(tokenSymbol);

      if (!token) {
        throw new Error(`Unknown token: ${tokenSymbol}`);
      }

      if (tokenSymbol === 'SOL') {
        // Native SOL balance
        const utxos = await getUtxos({
          publicKey,
          connection: this.connection,
          encryptionService,
          storage: getStorage(),
        });

        const { lamports } = getBalanceFromUtxos(utxos);

        return {
          balance: lamports / LAMPORTS_PER_SOL,
          baseUnits: lamports,
          lastUpdated: Date.now(),
          token: 'SOL',
        };
      } else {
        // SPL token balance
        const utxos = await getUtxosSPL({
          publicKey,
          connection: this.connection,
          encryptionService,
          storage: getStorage(),
          mintAddress: token.mint,
        });

        const { base_units, amount } = getBalanceFromUtxosSPL(utxos);

        return {
          balance: amount,
          baseUnits: base_units,
          lastUpdated: Date.now(),
          token: tokenSymbol,
        };
      }
    } catch (error) {
      console.error(`Error fetching private ${tokenSymbol} balance:`, error);
      return {
        balance: 0,
        baseUnits: 0,
        lastUpdated: Date.now(),
        token: tokenSymbol,
      };
    }
  }

  /**
   * Get all private balances for all supported tokens
   */
  async getAllPrivateBalances(
    publicKey: PublicKey,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
  ): Promise<PrivateBalances> {
    const balances: PrivateBalances = {};

    // Fetch all balances in parallel
    const results = await Promise.all(
      PRIVACY_CASH_TOKENS.map(async (token) => {
        const balance = await this.getPrivateBalance(publicKey, signMessage, token.symbol as PrivacyCashTokenSymbol);
        return { symbol: token.symbol, balance };
      })
    );

    results.forEach(({ symbol, balance }) => {
      balances[symbol] = balance;
    });

    return balances;
  }

  /**
   * Deposit SOL or SPL token into the privacy pool (shield funds)
   */
  async deposit(
    publicKey: PublicKey,
    amount: number,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>,
    signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>,
    tokenSymbol: PrivacyCashTokenSymbol = 'SOL',
    referrer?: string
  ): Promise<PrivacyTxResult> {
    try {
      const encryptionService = await this.initEncryption(signMessage);
      const wasm = await initLightWasm();
      const token = getPrivacyCashToken(tokenSymbol);

      if (!token) {
        throw new Error(`Unknown token: ${tokenSymbol}`);
      }

      let result;

      if (tokenSymbol === 'SOL') {
        // Native SOL deposit
        const amountInLamports = Math.floor(amount * LAMPORTS_PER_SOL);

        result = await deposit({
          lightWasm: wasm,
          connection: this.connection,
          amount_in_lamports: amountInLamports,
          keyBasePath: CIRCUIT_BASE_PATH,
          publicKey: publicKey,
          transactionSigner: async (tx: VersionedTransaction) => {
            return await signTransaction(tx);
          },
          storage: getStorage(),
          encryptionService,
          referrer: referrer || '',
        });
      } else {
        // SPL token deposit
        result = await depositSPL({
          lightWasm: wasm,
          connection: this.connection,
          amount: amount,
          keyBasePath: CIRCUIT_BASE_PATH,
          publicKey: publicKey,
          transactionSigner: async (tx: VersionedTransaction) => {
            return await signTransaction(tx);
          },
          storage: getStorage(),
          encryptionService,
          mintAddress: token.mint,
          referrer: referrer || '',
        });
      }

      // Get updated balance
      const newBalance = await this.getPrivateBalance(publicKey, signMessage, tokenSymbol);

      return {
        success: true,
        signature: result?.tx || 'success',
        action: 'deposit',
        amount: amount,
        newPrivateBalance: newBalance.balance,
      };
    } catch (error) {
      console.error(`Privacy ${tokenSymbol} deposit error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deposit failed',
        action: 'deposit',
        amount: amount,
      };
    }
  }

  /**
   * Withdraw SOL or SPL token from privacy pool (unshield funds)
   */
  async withdraw(
    publicKey: PublicKey,
    amount: number,
    recipientAddress: string,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>,
    tokenSymbol: PrivacyCashTokenSymbol = 'SOL',
    referrer?: string
  ): Promise<PrivacyTxResult> {
    try {
      const encryptionService = await this.initEncryption(signMessage);
      const wasm = await initLightWasm();
      const token = getPrivacyCashToken(tokenSymbol);

      if (!token) {
        throw new Error(`Unknown token: ${tokenSymbol}`);
      }

      let result;

      if (tokenSymbol === 'SOL') {
        // Native SOL withdraw
        const amountInLamports = Math.floor(amount * LAMPORTS_PER_SOL);

        result = await withdraw({
          amount_in_lamports: amountInLamports,
          connection: this.connection,
          encryptionService,
          keyBasePath: CIRCUIT_BASE_PATH,
          publicKey: publicKey,
          storage: getStorage(),
          recipient: new PublicKey(recipientAddress),
          lightWasm: wasm,
          referrer: referrer || '',
        });
      } else {
        // SPL token withdraw
        result = await withdrawSPL({
          connection: this.connection,
          encryptionService,
          keyBasePath: CIRCUIT_BASE_PATH,
          publicKey: publicKey,
          storage: getStorage(),
          recipient: new PublicKey(recipientAddress),
          lightWasm: wasm,
          mintAddress: token.mint,
          amount: amount,
          referrer: referrer || '',
        });
      }

      // Get updated balance
      const newBalance = await this.getPrivateBalance(publicKey, signMessage, tokenSymbol);

      return {
        success: true,
        signature: result?.tx || 'success',
        action: 'withdraw',
        amount: amount,
        newPrivateBalance: newBalance.balance,
      };
    } catch (error) {
      console.error(`Privacy ${tokenSymbol} withdraw error:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Withdrawal failed',
        action: 'withdraw',
        amount: amount,
      };
    }
  }


  /**
   * Estimate fees for privacy operations
   */
  estimateFee(action: PrivacyAction, tokenSymbol: PrivacyCashTokenSymbol = 'SOL'): number {
    const fees = getTokenFees(tokenSymbol);
    if (action === 'withdraw') {
      return fees.WITHDRAWAL_FEE;
    }
    return fees.DEPOSIT_FEE;
  }

  /**
   * Validate withdrawal parameters
   * @param amountFromBalance - The amount to withdraw FROM the private balance (not what user receives)
   * @param privateBalance - Current private balance
   * @param tokenSymbol - Token symbol
   */
  validateWithdrawal(
    amountFromBalance: number,
    privateBalance: number,
    tokenSymbol: PrivacyCashTokenSymbol = 'SOL'
  ): ValidationResult {
    const fees = getTokenFees(tokenSymbol);
    const token = getPrivacyCashToken(tokenSymbol);
    const decimals = token?.decimals || 9;
    const multiplier = Math.pow(10, decimals);

    // Use smallest units for precise integer comparison (avoid floating point issues)
    const balanceUnits = Math.round(privateBalance * multiplier);
    const amountUnits = Math.round(amountFromBalance * multiplier);
    const feeUnits = Math.round(fees.WITHDRAWAL_FEE * multiplier);

    if (amountFromBalance <= 0) {
      return {
        valid: false,
        error: 'Withdrawal amount must be greater than 0',
      };
    }

    if (amountUnits <= feeUnits) {
      return {
        valid: false,
        error: `Amount must be greater than the relay fee (${fees.WITHDRAWAL_FEE} ${tokenSymbol}). You would receive nothing.`,
      };
    }

    if (balanceUnits < amountUnits) {
      return {
        valid: false,
        error: `Insufficient balance. You have ${privateBalance.toFixed(4)} ${tokenSymbol} but trying to withdraw ${amountFromBalance.toFixed(4)} ${tokenSymbol}`,
        details: {
          required: amountFromBalance,
          available: privateBalance,
          fee: fees.WITHDRAWAL_FEE,
        },
      };
    }

    return {
      valid: true,
      details: {
        required: amountFromBalance,
        available: privateBalance,
        fee: fees.WITHDRAWAL_FEE,
      }
    };
  }

  /**
   * Calculate what user receives after fee
   */
  calculateReceiveAmount(amountFromBalance: number, tokenSymbol: PrivacyCashTokenSymbol = 'SOL'): number {
    const fees = getTokenFees(tokenSymbol);
    const token = getPrivacyCashToken(tokenSymbol);
    const decimals = token?.decimals || 9;
    const multiplier = Math.pow(10, decimals);

    const receiveUnits = Math.round(amountFromBalance * multiplier) - Math.round(fees.WITHDRAWAL_FEE * multiplier);
    return Math.max(0, receiveUnits / multiplier);
  }

  /**
   * Validate deposit parameters
   */
  validateDeposit(
    amount: number,
    walletBalance: number,
    tokenSymbol: PrivacyCashTokenSymbol = 'SOL'
  ): ValidationResult {
    const fees = getTokenFees(tokenSymbol);
    const token = getPrivacyCashToken(tokenSymbol);
    const decimals = token?.decimals || 9;
    const multiplier = Math.pow(10, decimals);
    const totalRequired = amount + fees.DEPOSIT_FEE;

    // Use smallest units for precise integer comparison
    const balanceUnits = Math.round(walletBalance * multiplier);
    const requiredUnits = Math.round(totalRequired * multiplier);

    if (amount <= 0) {
      return {
        valid: false,
        error: 'Deposit amount must be greater than 0',
      };
    }

    if (amount < fees.MIN_DEPOSIT) {
      return {
        valid: false,
        error: `Minimum deposit is ${fees.MIN_DEPOSIT} ${tokenSymbol}`,
      };
    }

    if (balanceUnits < requiredUnits) {
      return {
        valid: false,
        error: `Insufficient wallet balance. You need ${totalRequired.toFixed(4)} ${tokenSymbol}, but only have ${walletBalance.toFixed(4)} ${tokenSymbol}`,
        details: {
          required: totalRequired,
          available: walletBalance,
          fee: fees.DEPOSIT_FEE,
        },
      };
    }

    return { valid: true };
  }

  /**
   * Get maximum amount that can be withdrawn FROM balance
   * Returns the full balance (user can withdraw all, will receive balance - fee)
   */
  getMaxWithdrawable(privateBalance: number): number {
    // User can withdraw their entire balance
    // They will receive (balance - fee)
    return privateBalance;
  }

  /**
   * Check if balance is withdrawable (greater than fee)
   */
  canWithdraw(privateBalance: number, tokenSymbol: PrivacyCashTokenSymbol = 'SOL'): boolean {
    const fees = getTokenFees(tokenSymbol);
    const token = getPrivacyCashToken(tokenSymbol);
    const decimals = token?.decimals || 9;
    const multiplier = Math.pow(10, decimals);

    const balanceUnits = Math.round(privateBalance * multiplier);
    const feeUnits = Math.round(fees.WITHDRAWAL_FEE * multiplier);
    return balanceUnits > feeUnits;
  }

  /**
   * Get connection instance
   */
  getConnection(): Connection {
    return this.connection;
  }

  /**
   * Clear local cache (useful for debugging)
   */
  clearCache(): void {
    if (typeof window !== 'undefined') {
      // Clear Privacy Cash related localStorage items
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('zkcash-') || key.startsWith('privacy-cash-')) {
          localStorage.removeItem(key);
        }
      });
    }
    this.encryptionService = null;
  }
}

// Export singleton instance
export const privacyCashService = new PrivacyCashService();
export default privacyCashService;
