// tailwind.config.js
import path from 'path'; // Importa el módulo path

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.resolve(__dirname, './index.html'), // Ruta absoluta al index.html
    path.resolve(__dirname, './src/**/*.{js,ts,jsx,tsx}'), // Ruta absoluta a los archivos de src
  ],
  theme: {
    extend: {
      colors: {
        'sapphire': '#082F6D',
        'mint': '#50E3C2',
        'light-gray': '#F0F0F0',
      }
    },
  },
  plugins: [],
}