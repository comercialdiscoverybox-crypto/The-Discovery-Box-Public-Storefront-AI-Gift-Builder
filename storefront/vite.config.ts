import path from 'node:path';
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const directory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.join(directory, 'client'),
  plugins: [react()],
  publicDir: path.join(directory, '..', 'public'),
  build: {
    outDir: path.join(directory, '..', 'dist', 'storefront', 'client'),
    emptyOutDir: true,
  },
});
