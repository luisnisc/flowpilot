/** @type {import('next').NextConfig} */

const nextConfig = {
  reactStrictMode: false, // Desactivar para evitar dobles conexiones en desarrollo
  
  // Configuración importante para Socket.IO
  async headers() {
    return [
      {
        // Esto es crucial: configurar los headers para la ruta de socket.io
        source: '/socket.io/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;