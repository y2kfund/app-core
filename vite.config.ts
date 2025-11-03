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
        index: resolve(__dirname, 'src/core.ts'),
        nlvMargin: resolve(__dirname, 'src/nlvMargin.ts'),
        trades: resolve(__dirname, 'src/trades.ts'),
        tasks: resolve(__dirname, 'src/tasks.ts'),
        cashTransactions: resolve(__dirname, 'src/cashTransactions.ts'),
        transfers: resolve(__dirname, 'src/transfers.ts')
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