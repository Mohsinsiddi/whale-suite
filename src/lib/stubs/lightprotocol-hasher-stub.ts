/**
 * Stub module for @lightprotocol/hasher.rs
 * The actual WASM is loaded at runtime from CDN to avoid webpack parsing issues
 */

// This will be replaced at runtime with the real module from esm.sh
export class WasmFactory {
  static async getInstance() {
    throw new Error('WasmFactory stub - use initLightWasm() from privacy-cash.ts instead');
  }

  static async loadModule(_options?: unknown) {
    throw new Error('WasmFactory stub - use initLightWasm() from privacy-cash.ts instead');
  }
}

export default { WasmFactory };
