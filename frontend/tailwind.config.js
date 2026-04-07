/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2563EB', // Vibrant Blue
          hover: '#1D4ED8',
          light: '#DBEAFE',
          glass: 'rgba(37, 99, 235, 0.15)',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#0F172A',     // Deep Slate
          glass: 'rgba(255, 255, 255, 0.7)',
          darkGlass: 'rgba(15, 23, 42, 0.7)',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'glow': '0 0 20px rgba(37, 99, 235, 0.4)',
        'subtle': '0 2px 10px rgba(0, 0, 0, 0.02)',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      }
    },
  },
  plugins: [],
}
