import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  const apiTarget = env.VITE_API_URL || 'http://localhost:3001'

  return {
    plugins: [react()],
    server: {
      port: 5173,
      host: '0.0.0.0',
      strictPort: true,
      hmr: {
        port: 5173,
        host: 'localhost'
      },
      watch: {
        usePolling: true,
        interval: 1000
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            ui: ['@chakra-ui/react', '@chakra-ui/icons']
          }
        }
      }
    },
    define: {
      'process.env': {}
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@chakra-ui/react', '@chakra-ui/icons']
    }
  }
})
