/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./components/**/*.{js,ts,jsx,tsx}", // Если есть папка components
    "./pages/**/*.{js,ts,jsx,tsx}",      // Если есть папка pages
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}