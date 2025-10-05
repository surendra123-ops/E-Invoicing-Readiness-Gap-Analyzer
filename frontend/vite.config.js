const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')

// https://vite.dev/config/
module.exports = defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: false,
        ws: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false, // Disable sourcemap for production
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          http: ['axios']
        }
      }
    }
  },
  base: './' // Use relative paths for assets
})
