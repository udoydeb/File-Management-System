import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { handleAPIRoute } from './server_routes.js';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      {
        name: 'full-stack-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url || '';
            if (url.startsWith('/api/')) {
              try {
                const handled = await handleAPIRoute(req, res, next);
                if (handled) return;
              } catch (err) {
                console.error('API Middleware failed in dev:', err);
                res.statusCode = 500;
                res.end(JSON.stringify({ error: 'Internal Dev API Middleware Fault' }));
                return;
              }
            }
            next();
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(path.dirname(''), '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
