import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Force Railway rebuild - 2026-03-13 20:40
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
    // Deduplicate React Query - force single instance
    dedupe: ['@tanstack/react-query', 'react', 'react-dom'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Force ALL React Query code into the main vendor chunk
          if (id.includes('@tanstack/react-query')) {
            return 'vendor';
          }
          // Keep React in vendor chunk too
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['@tanstack/react-query', 'react', 'react-dom'],
    // Force these to be pre-bundled and deduplicated
    force: true,
  },
});
