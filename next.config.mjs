import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Mark mongoose/mongodb as external to prevent bundling issues
    serverComponentsExternalPackages: ['mongoose', 'mongodb'],
  },

  // Webpack configuration
  webpack: (config, { isServer, webpack }) => {
    // Use NormalModuleReplacementPlugin to replace anchor with our shim
    // Only when imported by pnp-sdk
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /@coral-xyz\/anchor$/,
        (resource) => {
          // Replace anchor with our shim that includes Wallet
          resource.request = path.resolve(__dirname, 'src/lib/anchor-shim.mjs');
        }
      )
    );

    if (!isServer) {
      // Don't resolve mongodb/mongoose on client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }

    // Ignore mongodb native addons
    config.externals = [...(config.externals || [])];
    if (isServer) {
      config.externals.push({
        'mongodb-client-encryption': 'commonjs mongodb-client-encryption',
        '@mongodb-js/zstd': 'commonjs @mongodb-js/zstd',
        'kerberos': 'commonjs kerberos',
        '@aws-sdk/credential-providers': 'commonjs @aws-sdk/credential-providers',
        'snappy': 'commonjs snappy',
      });
    }

    // Suppress critical dependency warnings from ffjavascript/web-worker
    // These are false positives from dynamic imports in ZK proof libraries
    config.module = {
      ...config.module,
      exprContextCritical: false,
    };

    // Ignore the web-worker warnings specifically
    config.ignoreWarnings = [
      ...(config.ignoreWarnings || []),
      {
        module: /web-worker/,
        message: /Critical dependency/,
      },
      {
        module: /ffjavascript/,
        message: /Critical dependency/,
      },
    ];

    return config;
  },
};

export default nextConfig;
