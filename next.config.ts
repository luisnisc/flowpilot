/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  api: {
    bodyParser: false,
    // Aumentar el límite de tiempo para APIs
    responseLimit: false,
  },
  // Configuración específica para Socket.IO
  webpack: (config: any, { buildId, dev, isServer, defaultLoaders, webpack }: {
    buildId: string;
    dev: boolean;
    isServer: boolean;
    defaultLoaders: any;
    webpack: any;
  }) => {
    config.externals.push({
      bufferutil: "bufferutil",
      "utf-8-validate": "utf-8-validate",
    });
    return config;
  },
};

module.exports = nextConfig;
