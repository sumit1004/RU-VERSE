import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

// Ensure droid_tri_fighter.glb physically exists in models/planets/
const planetsDir = path.resolve(__dirname, 'src/public/models/planets');
const shipSource = path.join(planetsDir, 'ship.glb');
const triFighterTarget = path.join(planetsDir, 'droid_tri_fighter.glb');

if (fs.existsSync(shipSource) && !fs.existsSync(triFighterTarget)) {
  try {
    fs.copyFileSync(shipSource, triFighterTarget);
    console.log('[RU VERSE] Created droid_tri_fighter.glb from ship.glb');
  } catch (err) {
    console.warn('[RU VERSE] Could not copy ship file:', err);
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'model-path-rewriter',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (
            req.url &&
            (req.url === '/models/planets/droid_tri_fighter.glb' ||
              req.url === '/models/ships/droid_tri_fighter.glb' ||
              req.url === '/models/ship/droid_tri_fighter.glb')
          ) {
            const shipPath = fs.existsSync(triFighterTarget) ? triFighterTarget : shipSource;
            if (fs.existsSync(shipPath)) {
              res.setHeader('Content-Type', 'model/gltf-binary');
              return fs.createReadStream(shipPath).pipe(res);
            }
          }
          next();
        });
      },
    },
  ],
  publicDir: 'src/public',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
