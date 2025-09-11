import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react'
import federation from '@originjs/vite-plugin-federation'

const sharedDependencies = [
  'react',
  'react-dom',
  'react-router-dom',
  'lucide-react'
]
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
        plugins: [
           react(),
            federation({
                exposes: {
                    './App': './App.tsx',
                },
                filename: 'remoteEntry.js',
                name: 'auth',
                shared: sharedDependencies,
            })
    ],
          build: {
              cssCodeSplit: false,
              minify: false,
              modulePreload: false,
              target: 'esnext'
          }

    };
});
