/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}", // Если есть папка components
    "./components/*.{js,ts,jsx,tsx}", // Если есть папка components
    "./pages/**/*.{js,ts,jsx,tsx}",      // Если есть папка pages
    "./App.tsx"
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      colors: {
        // 1. Твои фирменные цвета
        'brand-primary': '#3E66F4',
        'brand-secondary': '#2842D5',
        'brand-background': '#F5F8FA',
        'brand-surface': '#FFFFFF',
        'brand-on-primary': '#FFFFFF',
        'brand-on-surface-primary': '#1A202C',
        'brand-on-surface-secondary': '#718096',
        'brand-positive': '#48BB78',
        'brand-negative': '#E53E3E',
        plugins: [],
      }
    }
  }
}