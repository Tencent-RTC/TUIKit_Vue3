import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  resolve: {
    dedupe: ['vue'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
      pinia: path.resolve(__dirname, './node_modules/pinia'),
    }
  },
  plugins: [vue()],
})
