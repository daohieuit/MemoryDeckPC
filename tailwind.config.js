/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'selector',
  content: [
    "./index.html",
    "./App.tsx",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./hooks/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.html",
  ],
  theme: {
    extend: {
      dropShadow: {
        'vibrant-red-glow': '0 0 5px #FF4D4D', // Strong red glow
      }
    },
  },
  plugins: [],
}
