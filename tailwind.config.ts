import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      colors: {
        gold: {
          50: '#FDF8E7',
          100: '#FAF0C8',
          200: '#F5E190',
          300: '#F0D258',
          400: '#E6C325',
          500: '#D4AF37', // Ana altın rengi
          600: '#B8960D',
          700: '#97790B',
          800: '#7A6109',
          900: '#5C4907',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
