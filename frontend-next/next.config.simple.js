/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  
  // Configuración simple de webpack
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
  },
  
  // Configuración básica
  compress: true,
  poweredByHeader: false,
};

module.exports = nextConfig;