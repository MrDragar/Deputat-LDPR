import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const version = Date.now();

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
          react(),
          federation({
                name: 'host-app',
                remotes: {
                reports: `/reports/assets/remoteEntry.js?v=${version}`,
                dashboard: `/dashboard/assets/remoteEntry.js?v=${version}`,
                congrats: `/congrats/assets/remoteEntry.js?v=${version}`,
                add_deputy: `/add_deputy/assets/remoteEntry.js?v=${version}`,
              },
              shared: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'recharts'],
          }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      }
,
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
          modulePreload: false,
          target: 'esnext',
          minify: false,
          cssCodeSplit: false
      }
    };
});