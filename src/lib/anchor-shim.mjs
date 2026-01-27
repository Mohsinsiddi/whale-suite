/**
 * Anchor Shim (ESM)
 *
 * This shim re-exports everything from @coral-xyz/anchor
 * and adds the Wallet class that's normally only exported in Node.js.
 */

// Re-export everything from anchor's ESM build
export * from '@coral-xyz/anchor/dist/esm/index.js';

// Import what we need for Wallet
import { Keypair, VersionedTransaction } from '@solana/web3.js';

/**
 * Wallet class for Anchor compatibility
 * Anchor only exports this in Node.js (!isBrowser), so we provide it here
 */
export class Wallet {
  constructor(payer) {
    this.payer = payer;
  }

  get publicKey() {
    return this.payer.publicKey;
  }

  async signTransaction(tx) {
    if (tx instanceof VersionedTransaction) {
      tx.sign([this.payer]);
    } else {
      tx.partialSign(this.payer);
    }
    return tx;
  }

  async signAllTransactions(txs) {
    return Promise.all(txs.map((tx) => this.signTransaction(tx)));
  }

  static local() {
    return new Wallet(Keypair.generate());
  }
}
