/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Dark navy background layers
        navy: {
          950: '#060e1f',
          900: '#0a1628',
          800: '#0d1f3c',
          700: '#112240',
          600: '#1a2f4e',
          500: '#1e3a5f',
          400: '#2a4a72',
        },
        // Bright green accent
        accent: {
          50:  '#e6fff5',
          100: '#b3ffe0',
          200: '#66ffbc',
          300: '#00f090',
          400: '#00d084',
          500: '#00b873',
          600: '#009960',
          700: '#007a4d',
          800: '#005c3a',
          900: '#003d27',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(0, 208, 132, 0.15)',
        'glow-lg': '0 0 40px rgba(0, 208, 132, 0.2)',
      },
    },
  },
  plugins: [],
}
