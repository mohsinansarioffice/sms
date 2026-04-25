import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/** Rolldown may emit asset names without a full `src/.../icon/` path, so we match the known set in `src/assets/icon`. */
function isBundledAppIconFile(name) {
  const base = String(name)
    .split(/[/\\]/)
    .pop()
    ?.split('?')[0]
  if (!base) return false
  if (base === 'manifest.json' || base === 'browserconfig.xml') return true
  return /^(favicon|android-icon|ms-icon|apple-icon)/.test(base)
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    // Keep browserconfig + small icons as file URLs, not data: (tile logos break otherwise).
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? assetInfo.name
          if (isBundledAppIconFile(String(name))) {
            const base = String(name)
              .split(/[/\\]/)
              .pop()
              ?.split('?')[0]
            if (base) {
              return `assets/icon/${base}`
            }
          }
          return 'assets/[name]-[hash][extname]'
        }
      }
    }
  }
})
