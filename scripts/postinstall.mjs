#!/usr/bin/env node

/**
 * Postinstall script for Privacy SDKs
 * Copies required WASM and circuit files to the public folder
 */

import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const projectRoot = join(__dirname, '..');
const publicDir = join(projectRoot, 'public');
const wasmDir = join(publicDir, 'wasm');
const circuitDir = join(publicDir, 'circuit2');
const darklakeCircuitDir = join(publicDir, 'circuits'); // For Darklake ZK circuits

// Source directories
const hasherDir = join(projectRoot, 'node_modules', '@lightprotocol', 'hasher.rs', 'dist');
const privacyCashCircuitDir = join(projectRoot, 'node_modules', 'privacycash', 'circuit2');
const darklakeSrcCircuitDir = join(projectRoot, 'node_modules', '@darklakefi', 'ts-sdk-on-chain', 'dist', 'zk', 'circuits');

// Ensure directories exist
for (const dir of [wasmDir, circuitDir, darklakeCircuitDir]) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    console.log(`Created ${dir.replace(projectRoot, '')}`);
  }
}

// ===== Copy WASM files to browser-fat/es/ (REQUIRED for Next.js) =====
console.log('\nCopying WASM files to browser-fat/es/ for Next.js compatibility...');

const browserFatEsDir = join(hasherDir, 'browser-fat', 'es');

const wasmFiles = [
  'hasher_wasm_simd_bg.wasm',
  'light_wasm_hasher_bg.wasm',
];

for (const file of wasmFiles) {
  const src = join(hasherDir, file);

  // Copy to browser-fat/es/ (required for Next.js webpack)
  if (existsSync(src) && existsSync(browserFatEsDir)) {
    try {
      const destBrowserFat = join(browserFatEsDir, file);
      copyFileSync(src, destBrowserFat);
      console.log(`  Copied ${file} -> browser-fat/es/`);
    } catch (error) {
      console.error(`  Failed to copy ${file} to browser-fat/es/:`, error.message);
    }
  }

  // Also copy to public/wasm/ for fallback
  const destPublic = join(wasmDir, file);
  if (existsSync(src)) {
    try {
      copyFileSync(src, destPublic);
      console.log(`  Copied ${file} -> public/wasm/`);
    } catch (error) {
      console.error(`  Failed to copy ${file} to public/wasm/:`, error.message);
    }
  } else {
    console.warn(`  Source file not found: ${file}`);
  }
}

// ===== Copy circuit files from privacycash =====
console.log('\nCopying circuit files from privacycash...');

if (existsSync(privacyCashCircuitDir)) {
  const circuitFiles = readdirSync(privacyCashCircuitDir);

  for (const file of circuitFiles) {
    const src = join(privacyCashCircuitDir, file);
    const dest = join(circuitDir, file);

    try {
      copyFileSync(src, dest);
      console.log(`  Copied ${file}`);
    } catch (error) {
      console.error(`  Failed to copy ${file}:`, error.message);
    }
  }
} else {
  console.warn('  Circuit directory not found in privacycash package');
}

// ===== Copy Darklake ZK circuit files =====
console.log('\nCopying Darklake ZK circuit files...');

if (existsSync(darklakeSrcCircuitDir)) {
  const darklakeFiles = readdirSync(darklakeSrcCircuitDir);

  for (const file of darklakeFiles) {
    const src = join(darklakeSrcCircuitDir, file);
    const dest = join(darklakeCircuitDir, file);

    try {
      copyFileSync(src, dest);
      console.log(`  Copied ${file}`);
    } catch (error) {
      console.error(`  Failed to copy ${file}:`, error.message);
    }
  }
} else {
  console.warn('  Darklake circuit directory not found');
}

console.log('\nPrivacy SDKs setup complete!');
