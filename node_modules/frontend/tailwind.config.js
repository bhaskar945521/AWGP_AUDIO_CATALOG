/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        saffron: {
          50:  '#fff9f0',
          100: '#ffe9cc',
          200: '#ffd199',
          300: '#fac27a',
          400: '#f7a84d',
          500: '#f09838',
          600: '#d48a2a',
          700: '#b85c00',
          800: '#8f4800',
          900: '#663300',
          DEFAULT: '#f7a84d',
        },
        golden: {
          50:  '#fffdf0',
          100: '#fff8cc',
          200: '#fff099',
          300: '#ffe566',
          400: '#ffd700',
          500: '#e6c200',
          DEFAULT: '#ffd700',
        },
        primary: {
          light: '#fac27a',
          DEFAULT: '#f7a84d',
          dark: '#d48a2a',
        },
        secondary: {
          light: '#6EE7B7',
          DEFAULT: '#10B981',
          dark: '#047857',
        },
        accent: {
          light: '#C7D2FE',
          DEFAULT: '#6366F1',
          dark: '#4338CA',
        },
        bg: {
          main: '#ffffff',
          sidebar: '#fff9f0',
          card: '#ffffff',
        },
        text: {
          main: '#1a1a2e',
          muted: '#6b7280',
          light: '#9ca3af',
        },
        border: {
          DEFAULT: '#E2E8F0',
        },
        cat: {
          spirituality: { bg: '#EFE4FF', text: '#6B46C1' },
          wisdom: { bg: '#E6FFFA', text: '#2C7A7B' },
          discourses: { bg: '#FFFBEB', text: '#B7791F' },
          bhajans: { bg: '#FFF5F5', text: '#C53030' },
          pravachans: { bg: '#EBF8FF', text: '#2B6CB0' },
          others: { bg: '#FFF0F6', text: '#B83280' },
        },
        lightRed: '#FFCCCC',
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 12px 0 rgba(247,168,77,0.10)',
        'card-hover': '0 8px 32px 0 rgba(247,168,77,0.18)',
        'nav': '0 2px 16px 0 rgba(0,0,0,0.07)',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.25rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
