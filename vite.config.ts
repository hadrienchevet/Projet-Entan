import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // PORT est fourni par l'outil de preview ; 5173 sinon (npm run dev classique).
  server: { port: Number(process.env.PORT) || 5173 },
});
