import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Vercel එකේ ෆයිල් පාරවල් හරියටම පේන්න මේක අනිවාර්යයි
  base: './', 
  
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },

  // API Key එක ගන්න ක්‍රමය අපි Vercel එකේදී කෙලින්ම Environment Variable එකෙන් ගමු
});