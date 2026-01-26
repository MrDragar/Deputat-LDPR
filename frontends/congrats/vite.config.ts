import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import federation from '@originjs/vite-plugin-federation'

const sharedDependencies = [
  'react',
  'react-dom',
  'lucide-react',
]

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/congrats/',

      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.SERVER_URL': JSON.stringify(env.SERVER_URL),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      plugins: [
          react(),
          federation({
            exposes: {
              './App': './App.tsx',
            },
            filename: 'remoteEntry.js',
            name: 'dashboard',
            shared: sharedDependencies,
         })
      ],
      build: {
          cssCodeSplit: false,
          minify: false,
          modulePreload: false,
          target: 'esnext'
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
