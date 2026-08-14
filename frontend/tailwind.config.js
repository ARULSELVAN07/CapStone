/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bmw: {
          blue: '#1C69D4',
          darkblue: '#0653B6',
          navy: '#0F172A',
          onyx: '#111827',
          silver: '#94A3B8',
          lightgray: '#F8FAFC',
          red: '#E11D48',
          green: '#10B981',
          amber: '#F59E0B'
        }
      }
    },
  },
  plugins: [],
}
