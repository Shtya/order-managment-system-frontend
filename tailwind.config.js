/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'], // ← هنا فقط

  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        secondary: '#22c55e',
      },
      borderRadius: {
        xl: '1rem',
      },
    },
  },
 
}
