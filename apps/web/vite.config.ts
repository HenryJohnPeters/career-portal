import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

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
});
