import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command, mode }) => {
  const jamstack = mode === 'jamstack';
  const env = loadEnv(mode, root, 'VITE_');
  if (
    command === 'build' &&
    jamstack &&
    !(process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL)
  ) {
    throw new Error(
      'VITE_API_BASE_URL must point to the public API origin for the Jamstack build.',
    );
  }
  return {
    plugins: [react()],
    build: jamstack
      ? {
          outDir: 'jamstack-dist',
          rollupOptions: { input: resolve(root, 'jamstack.html') },
        }
      : undefined,
    server: {
      port: 5173,
      strictPort: true,
      proxy: { '/api': process.env.API_PROXY_TARGET || 'http://127.0.0.1:8000' },
      watch: { usePolling: process.env.VITE_USE_POLLING === 'true' },
    },
  };
});
