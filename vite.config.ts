import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import dts from 'vite-plugin-dts'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(), 
    dts({
      insertTypesEntry: true,
      exclude: ['vite.config.ts']
    })
  ],
  build: {
    outDir: 'dist',
    lib: {
      entry: {
        index: resolve(__dirname, 'src/core.ts'), // Main entry point
        nlvMargin: resolve(__dirname, 'src/nlvMargin.ts') // New entry point
      },
      name: 'Y2kfundCore',
      formats: ['es']
    },
    rollupOptions: {
      external: ['vue', '@tanstack/vue-query', '@supabase/supabase-js'],
      output: {
        globals: {
          vue: 'Vue'
        }
      }
    }
  }
})