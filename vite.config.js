import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  envPrefix: ['VITE_', 'NEXT_PUBLIC_', 'PHAZEE_', 'DEV_'],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    assetsInlineLimit: 0, // Don't inline images
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        assetFileNames: (assetInfo) => {
          // Keep original image names and quality
          if (/\.(jpg|jpeg|png|gif|webp)$/i.test(assetInfo.name)) {
            return 'assets/[name]-[hash][extname]'
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  },
  server: {
    port: 4000,
    host: '0.0.0.0'
  }
})

