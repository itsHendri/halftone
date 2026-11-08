import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

// cloudflare() runs worker/index.ts inside the dev server (the real Workers runtime), so /api works in `npm run dev`
// and `npm run preview` exactly as it will once deployed.
export default defineConfig({
  plugins: [react(), tailwindcss(), cloudflare()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
});
