import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [vue(), dts()],
  build: {
    outDir: 'dist',
    lib: {
      entry: 'src/index.ts',
      name: 'Y2kfundCore',
      formats: ['es'],
      fileName: 'index'
    },
    rollupOptions: {
      external: ['vue', '@tanstack/vue-query', '@supabase/supabase-js']
    }
  }
})
