import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/OpenClawwww-test/',
  server: {
    port: 5173
  }
})
