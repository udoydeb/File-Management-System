import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleAPIRoute } from './server_routes.js';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

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

// Serve production static files from /dist
const distPath = path.join(process.cwd(), 'dist');
app.use(express.static(distPath));

// Support SPA UI state routing by routing unmatched paths to the UI
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.5', () => { // Wait, standard binding is 0.0.0.0
});

// Correct binding
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Daffodil central webserver running cleanly on port http://localhost:${PORT}`);
});
