/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Mark mongoose/mongodb as external to prevent bundling issues
    serverComponentsExternalPackages: ['mongoose', 'mongodb'],
  },

  // Webpack configuration
  webpack: (config, { isServer }) => {
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

    return config;
  },
};

export default nextConfig;
