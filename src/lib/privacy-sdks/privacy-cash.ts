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

// Fee constants (in SOL)
export const PRIVACY_FEES = {
  WITHDRAWAL_FEE: 0.006, // ~6,000,000 lamports - relay fee for ZK withdrawal
  DEPOSIT_FEE: 0, // No deposit fee from Privacy Cash (only minimal network fee)
  MIN_DEPOSIT: 0.001, // Minimum deposit amount
  MIN_WITHDRAWAL: 0.007, // Minimum withdrawal (must be > fee to receive something)
  RECOMMENDED_MIN_BALANCE: 0.01, // Recommended minimum for withdrawals
};

// Common token mints
export const TOKEN_MINTS = {
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  USD1: 'USD1ttGY1N17NEEHLmELoaybftRBUSErhqYiQzvEmuB', // World Liberty Financial USD
};

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
  balance: number; // in SOL
  lamports: number;
  lastUpdated: number;
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
   * Get private (shielded) SOL balance
   */
  async getPrivateBalance(
    publicKey: PublicKey,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
  ): Promise<PrivateBalance> {
    try {
      const encryptionService = await this.initEncryption(signMessage);

      const utxos = await getUtxos({
        publicKey,
        connection: this.connection,
        encryptionService,
        storage: getStorage(),
      });

      const { lamports } = getBalanceFromUtxos(utxos);

      return {
        balance: lamports / LAMPORTS_PER_SOL,
        lamports,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error('Error fetching private balance:', error);
      return {
        balance: 0,
        lamports: 0,
        lastUpdated: Date.now(),
      };
    }
  }

  /**
   * Deposit SOL into the privacy pool (shield funds)
   */
  async deposit(
    publicKey: PublicKey,
    amountInSOL: number,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>,
    signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>,
    referrer?: string
  ): Promise<PrivacyTxResult> {
    try {
      const encryptionService = await this.initEncryption(signMessage);
      const wasm = await initLightWasm();

      const amountInLamports = Math.floor(amountInSOL * LAMPORTS_PER_SOL);

      const result = await deposit({
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

      // Get updated balance
      const newBalance = await this.getPrivateBalance(publicKey, signMessage);

      return {
        success: true,
        signature: result?.tx || 'success',
        action: 'deposit',
        amount: amountInSOL,
        newPrivateBalance: newBalance.balance,
      };
    } catch (error) {
      console.error('Privacy deposit error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deposit failed',
        action: 'deposit',
        amount: amountInSOL,
      };
    }
  }

  /**
   * Withdraw SOL from privacy pool (unshield funds)
   */
  async withdraw(
    publicKey: PublicKey,
    amountInSOL: number,
    recipientAddress: string,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>,
    referrer?: string
  ): Promise<PrivacyTxResult> {
    try {
      const encryptionService = await this.initEncryption(signMessage);
      const wasm = await initLightWasm();

      const amountInLamports = Math.floor(amountInSOL * LAMPORTS_PER_SOL);

      const result = await withdraw({
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

      // Get updated balance
      const newBalance = await this.getPrivateBalance(publicKey, signMessage);

      return {
        success: true,
        signature: result?.tx || 'success',
        action: 'withdraw',
        amount: amountInSOL,
        newPrivateBalance: newBalance.balance,
      };
    } catch (error) {
      console.error('Privacy withdraw error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Withdrawal failed',
        action: 'withdraw',
        amount: amountInSOL,
      };
    }
  }

  /**
   * Deposit SPL token (USDC, USDT) into privacy pool
   * @param amount - Amount in token units (e.g., 1.5 USDC)
   */
  async depositSPL(
    publicKey: PublicKey,
    amount: number,
    mintAddress: string,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>,
    signTransaction: (tx: VersionedTransaction) => Promise<VersionedTransaction>,
    referrer?: string
  ): Promise<PrivacyTxResult> {
    try {
      const encryptionService = await this.initEncryption(signMessage);
      const wasm = await initLightWasm();

      const result = await depositSPL({
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
        mintAddress,
        referrer: referrer || '',
      });

      return {
        success: true,
        signature: result?.tx || 'success',
        action: 'deposit',
        amount: amount,
      };
    } catch (error) {
      console.error('Privacy SPL deposit error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SPL Deposit failed',
        action: 'deposit',
        amount: amount,
      };
    }
  }

  /**
   * Withdraw SPL token from privacy pool
   * @param amount - Amount in token units (e.g., 1.5 USDC)
   */
  async withdrawSPL(
    publicKey: PublicKey,
    amount: number,
    mintAddress: string,
    recipientAddress: string,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>,
    referrer?: string
  ): Promise<PrivacyTxResult> {
    try {
      const encryptionService = await this.initEncryption(signMessage);
      const wasm = await initLightWasm();

      const result = await withdrawSPL({
        connection: this.connection,
        encryptionService,
        keyBasePath: CIRCUIT_BASE_PATH,
        publicKey: publicKey,
        storage: getStorage(),
        recipient: new PublicKey(recipientAddress),
        lightWasm: wasm,
        mintAddress,
        amount,
        referrer: referrer || '',
      });

      return {
        success: true,
        signature: result?.tx || 'success',
        action: 'withdraw',
        amount: amount,
      };
    } catch (error) {
      console.error('Privacy SPL withdraw error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'SPL Withdrawal failed',
        action: 'withdraw',
        amount: amount,
      };
    }
  }

  /**
   * Get private balance for SPL token
   */
  async getPrivateBalanceSPL(
    publicKey: PublicKey,
    mintAddress: string,
    signMessage: (message: Uint8Array) => Promise<Uint8Array>
  ): Promise<{ amount: number; baseUnits: number }> {
    try {
      const encryptionService = await this.initEncryption(signMessage);

      const utxos = await getUtxosSPL({
        publicKey,
        connection: this.connection,
        encryptionService,
        storage: getStorage(),
        mintAddress,
      });

      const { base_units, amount } = getBalanceFromUtxosSPL(utxos);

      return { amount, baseUnits: base_units };
    } catch (error) {
      console.error('Error fetching private SPL balance:', error);
      return { amount: 0, baseUnits: 0 };
    }
  }

  /**
   * Estimate fees for privacy operations
   */
  estimateFee(action: PrivacyAction): number {
    if (action === 'withdraw') {
      return PRIVACY_FEES.WITHDRAWAL_FEE;
    }
    return PRIVACY_FEES.DEPOSIT_FEE;
  }

  /**
   * Validate withdrawal parameters
   * @param amountFromBalance - The amount to withdraw FROM the private balance (not what user receives)
   * @param privateBalanceSOL - Current private balance
   */
  validateWithdrawal(amountFromBalance: number, privateBalanceSOL: number): ValidationResult {
    const fee = PRIVACY_FEES.WITHDRAWAL_FEE;

    // Use lamports for precise integer comparison (avoid floating point issues)
    const balanceLamports = Math.round(privateBalanceSOL * LAMPORTS_PER_SOL);
    const amountLamports = Math.round(amountFromBalance * LAMPORTS_PER_SOL);

    if (amountFromBalance <= 0) {
      return {
        valid: false,
        error: 'Withdrawal amount must be greater than 0',
      };
    }

    if (amountFromBalance <= fee) {
      return {
        valid: false,
        error: `Amount must be greater than the relay fee (${fee} SOL). You would receive nothing.`,
      };
    }

    if (balanceLamports < amountLamports) {
      return {
        valid: false,
        error: `Insufficient balance. You have ${privateBalanceSOL.toFixed(4)} SOL but trying to withdraw ${amountFromBalance.toFixed(4)} SOL`,
        details: {
          required: amountFromBalance,
          available: privateBalanceSOL,
          fee,
        },
      };
    }

    return {
      valid: true,
      details: {
        required: amountFromBalance,
        available: privateBalanceSOL,
        fee,
      }
    };
  }

  /**
   * Calculate what user receives after fee
   */
  calculateReceiveAmount(amountFromBalance: number): number {
    const receiveLamports = Math.round(amountFromBalance * LAMPORTS_PER_SOL) - Math.round(PRIVACY_FEES.WITHDRAWAL_FEE * LAMPORTS_PER_SOL);
    return Math.max(0, receiveLamports / LAMPORTS_PER_SOL);
  }

  /**
   * Validate deposit parameters
   */
  validateDeposit(amountInSOL: number, walletBalanceSOL: number): ValidationResult {
    const fee = PRIVACY_FEES.DEPOSIT_FEE;
    const totalRequired = amountInSOL + fee;

    // Use lamports for precise integer comparison
    const balanceLamports = Math.round(walletBalanceSOL * LAMPORTS_PER_SOL);
    const requiredLamports = Math.round(totalRequired * LAMPORTS_PER_SOL);

    if (amountInSOL <= 0) {
      return {
        valid: false,
        error: 'Deposit amount must be greater than 0',
      };
    }

    if (amountInSOL < PRIVACY_FEES.MIN_DEPOSIT) {
      return {
        valid: false,
        error: `Minimum deposit is ${PRIVACY_FEES.MIN_DEPOSIT} SOL`,
      };
    }

    if (balanceLamports < requiredLamports) {
      return {
        valid: false,
        error: `Insufficient wallet balance. You need ${totalRequired.toFixed(4)} SOL (${amountInSOL} + ~${fee} fee), but only have ${walletBalanceSOL.toFixed(4)} SOL`,
        details: {
          required: totalRequired,
          available: walletBalanceSOL,
          fee,
        },
      };
    }

    return { valid: true };
  }

  /**
   * Get maximum amount that can be withdrawn FROM balance
   * Returns the full balance (user can withdraw all, will receive balance - fee)
   */
  getMaxWithdrawable(privateBalanceSOL: number): number {
    // User can withdraw their entire balance
    // They will receive (balance - fee)
    return privateBalanceSOL;
  }

  /**
   * Check if balance is withdrawable (greater than fee)
   */
  canWithdraw(privateBalanceSOL: number): boolean {
    const balanceLamports = Math.round(privateBalanceSOL * LAMPORTS_PER_SOL);
    const feeLamports = Math.round(PRIVACY_FEES.WITHDRAWAL_FEE * LAMPORTS_PER_SOL);
    return balanceLamports > feeLamports;
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
