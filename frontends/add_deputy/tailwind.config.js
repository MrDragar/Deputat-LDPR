/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

export default {
  important: '#add-deputy-root',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",      // Если есть папка pages
  ],
  theme: {
    extend: {
    },
  },
  plugins: [],
}

