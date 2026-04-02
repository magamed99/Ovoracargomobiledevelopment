import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],

  // 🚀 ОПТИМИЗАЦИЯ: Настройки производительности
  build: {
    // Минификация кода
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Удалить console.log в продакшене
        drop_debugger: true,
      },
    },
    // Разделение кода на чанки
    rollupOptions: {
      output: {
        manualChunks: {
          // Разделяем vendor библиотеки
          'react-vendor': ['react', 'react-dom', 'react-router'],
          'ui-vendor': ['lucide-react', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
          'map-vendor': ['react-yandex-maps'],
          'utils': ['date-fns', 'clsx', 'tailwind-merge'],
        },
      },
    },
    // Chunk size warnings
    chunkSizeWarningLimit: 1000,
  },

  // Оптимизация dev сервера
  server: {
    hmr: {
      overlay: false, // Отключить оверлей ошибок для скорости
    },
  },
})