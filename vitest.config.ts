import { defineConfig } from 'vitest/config'
import path from 'path'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Deno npm: specifiers — резолвим на обычные npm-пакеты для тестов.
      // Сама edge function в проде продолжает использовать "npm:jose" как есть.
      'npm:jose': 'jose',
    },
  },
  test: {
    // По умолчанию 'node' — большинству юнит-тестов DOM не нужен, а jose
    // под jsdom падает на webcrypto. Для тестов React-компонентов добавляй
    // `// @vitest-environment jsdom` первой строкой файла.
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}', 'supabase/**/*.test.{ts,tsx}'],
  },
})
