
import {defineConfig, loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
  plugins: [
    react(),
    federation({
      name: 'host-app',
      remotes: {
        auth: `/auth/assets/remoteEntry.js`,
        registration_form: '/registration_form/assets/remoteEntry.js',
      },
      // Shared dependencies to avoid loading them multiple times.
      shared: ['react', 'react-dom'],
    }),
  ],
  // Recommended build options for module federation to work smoothly.
  build: {
    modulePreload: false,
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  }
}})
