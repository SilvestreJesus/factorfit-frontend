import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    allowedHosts: true,     // permite CUALQUIER host
    host: true,
    port: 5000
  }
});
