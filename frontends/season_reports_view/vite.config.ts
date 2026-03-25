import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import federation from '@originjs/vite-plugin-federation'
import {defineConfig, loadEnv} from 'vite';


const sharedDependencies = [
  'react',
  'react-dom',
  'lucide-react',
  'react-router-dom'
]


export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
      base: "/seasonal_report",
    plugins: [
        react(), tailwindcss(),
          federation({
            exposes: {
              './App': './src/App.tsx',
            },
            filename: 'remoteEntry.js',
            name: 'reports_view',
            shared: sharedDependencies,
         })
    ],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
        cssCodeSplit: false,
        minify: false,
        modulePreload: false,
        target: 'esnext'
    },
  };
});
