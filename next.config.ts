import type { NextConfig } from 'next';

// Tipado correcto para la configuración de Next.js
const nextConfig: NextConfig = {
  reactStrictMode: true,

  // Configura CORS para Socket.IO endpoints
  async headers() {
    return [
      {
        source: "/api/socket/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,POST,OPTIONS" },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version",
          },
        ],
      },
    ];
  },

  // Configuración experimental para Turbopack
  experimental: {
    turbo: {
      // Configuración de Turbopack para manejar Socket.IO
      resolveAlias: {
        // Define alias si son necesarios
      },
      loaders: {
        // Configuración de loaders específicos si son necesarios
      },
    },
  },

  // Mantener configuración de webpack como fallback para entornos que no soporten Turbopack
  webpack: (config) => {
    if (config.externals) {
      config.externals.push({
        bufferutil: "bufferutil",
        "utf-8-validate": "utf-8-validate",
      });
    }
    return config;
  },
};

export default nextConfig;