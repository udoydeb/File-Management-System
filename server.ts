import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { handleAPIRoute } from './server_routes.js';
import { pullFromSupabase, saveChanges } from './server_db.js';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

// Resolve paths safely for both standard ES Modules (tsx in dev) and bundled CJS (node in production)
let _filename = '';
let _dirname = '';
try {
  if (typeof __filename !== 'undefined') {
    _filename = __filename;
  } else {
    _filename = fileURLToPath(import.meta.url);
  }
} catch (e) {
  _filename = '';
}

try {
  if (typeof __dirname !== 'undefined') {
    _dirname = __dirname;
  } else if (_filename) {
    _dirname = path.dirname(_filename);
  } else {
    _dirname = process.cwd();
  }
} catch (e) {
  _dirname = process.cwd();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Synchronise system state with Supabase cloud database on startup
  try {
    console.log('Initiating boot-time sync with Supabase cloud database...');
    pullFromSupabase().then((cloudData) => {
      if (cloudData) {
        saveChanges(cloudData);
        console.log('DIU system state synchronized successfully with Supabase Cloud!');
      } else {
        console.log('DIU system state running on local cache (Supabase database table is empty or does not exist yet).');
      }
    }).catch((err: any) => {
      console.warn('Supabase initial fetch failed. Falling back to local database.', err.message);
    });
  } catch (err) {
    console.error('Supabase boot-up controller encountered an exception:', err);
  }

  // Set up body parsing middlewares
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Route API endpoints
  app.all('/api/*', async (req, res, next) => {
    try {
      const handled = await handleAPIRoute(req, res, next);
      if (!handled) {
        res.status(404).json({ error: 'Endpoint matching not established.' });
      }
    } catch (err) {
      console.error('Core Express Router matching failed:', err);
      res.status(500).json({ error: 'Core server fault.' });
    }
  });

  // Vite middleware for development or fallback static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    // Serve and transform index.html for any remaining UI routing in dev mode
    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await fs.promises.readFile(path.join(process.cwd(), 'index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });
  } else {
    // Serve production static files from /dist
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));

    // Support SPA UI state routing by routing unmatched paths to the UI
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Daffodil central webserver running cleanly on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start DIU Smart Archive Server:', err);
});
