/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Configuración de webpack para resolver paths
  webpack: (config, { dev, isServer }) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
    };
    
    return config;
  },
  
  // Configuración experimental básica
  experimental: {
    serverComponentsExternalPackages: [],
  },
  
  // Configuración del compilador
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn']
    } : false,
  },
  
  // Configuración de imágenes
  images: {
    domains: ['localhost', '127.0.0.1', '178.156.179.129'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8080',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
        port: '8080',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: '178.156.179.129',
        port: '8080',
        pathname: '/media/**',
      }
    ],
  },
  
  // Configuración de rewrites para API
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
    
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
      {
        source: '/media/:path*',
        destination: `${apiUrl}/media/:path*`,
      },
    ];
  },
  
  // Configuración básica de producción
  output: 'standalone',
  compress: true,
  trailingSlash: false,
  poweredByHeader: false,
  swcMinify: true,
  generateEtags: false,
};

module.exports = nextConfig;