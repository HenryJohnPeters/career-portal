import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Force Railway rebuild - 2026-03-13 20:35
export default defineConfig({
  plugins: [react()],
  server: { port: 4200 },
  resolve: {
    alias: {
      "@careerportal/shared/types/cv-templates": path.resolve(
        __dirname,
        "../../libs/shared/types/src/cv-templates.ts"
      ),
      "@careerportal/shared/types": path.resolve(
        __dirname,
        "../../libs/shared/types/src/index.ts"
      ),
      "@careerportal/web/data-access": path.resolve(
        __dirname,
        "../../libs/web/data-access/src/index.ts"
      ),
      "@careerportal/web/ui": path.resolve(
        __dirname,
        "../../libs/web/ui/src/index.tsx"
      ),
    },
  },
  build: {
    // Ensure React Query is treated as external/singleton
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Keep React Query in a single chunk to ensure one QueryClient instance
          'react-query': ['@tanstack/react-query'],
        },
      },
    },
  },
  optimizeDeps: {
    // Pre-bundle these to avoid duplication
    include: ['@tanstack/react-query', 'react', 'react-dom'],
  },
});
