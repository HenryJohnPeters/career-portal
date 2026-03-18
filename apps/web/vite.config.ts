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
    dedupe: ['@tanstack/react-query', 'react', 'react-dom', 'three'],
  },
  build: {
    commonjsOptions: {
      include: [/node_modules/],
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('@tanstack/react-query')) return 'vendor';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor';
          // Avatar / TTS libs are lazy-imported — keep them in their own chunks
          if (id.includes('@met4citizen/talkinghead') || id.includes('talkinghead.mjs')) return 'avatar-talkinghead';
          if (id.includes('@met4citizen/headtts') || id.includes('headtts.mjs')) return 'avatar-headtts';
          if (id.includes('node_modules/three')) return 'avatar-three';
        },
      },
    },
  },
  optimizeDeps: {
    include: ['@tanstack/react-query', 'react', 'react-dom'],
    // @met4citizen packages are native ESM — do NOT pre-bundle them
    exclude: ['@met4citizen/talkinghead', '@met4citizen/headtts'],
    force: true,
  },
});
