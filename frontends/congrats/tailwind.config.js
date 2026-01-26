/** @type {import('tailwindcss').Config} */
const colors = require('tailwindcss/colors')

export default {
  content: [
    "./index.html",
    // "./components/**/*.{js,ts,jsx,tsx}", // Если есть папка components
    "./components/*.{js,ts,jsx,tsx}", // Если есть папка components
    "./pages/**/*.{js,ts,jsx,tsx}",      // Если есть папка pages
    "./App.tsx"
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#1E40AF',
        'brand-secondary': '#DBEAFE',
        'brand-light': '#EFF6FF',
        'brand-dark': '#1E3A8A',
      },
    },
  },
  plugins: [],
}

