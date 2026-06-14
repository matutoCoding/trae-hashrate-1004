/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: '1rem',
    },
    extend: {
      colors: {
        paper: {
          50: '#FBF8F0',
          100: '#F5F0E6',
          200: '#E8DFC7',
          300: '#D4C49A',
          400: '#B8A37A',
          500: '#9E8A5E',
          600: '#7D6B48',
          700: '#5A4D33',
          800: '#3D3422',
          900: '#2C1810',
        },
        ink: {
          50: '#F0EBE6',
          100: '#D4CCC4',
          200: '#A89B8D',
          300: '#7C6A56',
          400: '#50403F',
          500: '#3D2E2C',
          600: '#2C1810',
          700: '#1F120B',
          800: '#140C07',
          900: '#0A0604',
        },
        seal: {
          50: '#FBEAE6',
          100: '#F3C5BC',
          200: '#E89A8D',
          300: '#DC6F5E',
          400: '#D1442F',
          500: '#C83C23',
          600: '#A0301C',
          700: '#782415',
          800: '#50180E',
          900: '#280C07',
        },
        azure: {
          50: '#E6EEF5',
          100: '#B8CFE3',
          200: '#8AB1D1',
          300: '#5C93BF',
          400: '#3E75AD',
          500: '#2E4A62',
          600: '#243B4E',
          700: '#1A2C3A',
          800: '#101D27',
          900: '#080E13',
        },
        bamboo: {
          50: '#EEF5E6',
          100: '#D6E6BC',
          200: '#BED792',
          300: '#A6C868',
          400: '#8EB93E',
          500: '#6B8E23',
          600: '#56721C',
          700: '#405615',
          800: '#2B3A0E',
          900: '#151E07',
        },
        warning: {
          wood: '#D4A017',
          mold: '#6B6B6B',
        }
      },
      fontFamily: {
        song: ['"Noto Serif SC"', '"Source Han Serif SC"', '"SimSun"', 'serif'],
        hei: ['"Noto Sans SC"', '"Source Han Sans SC"', '"Microsoft YaHei"', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
      },
      backgroundImage: {
        'paper-texture': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
        'rice-grid': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 20h40M20 0v40M0 0l40 40M40 0L0 40' stroke='%23D4C49A' stroke-width='0.3' fill='none' opacity='0.3'/%3E%3C/svg%3E\")",
      },
      boxShadow: {
        'scroll': '0 2px 8px rgba(44, 24, 16, 0.08), 0 8px 24px rgba(44, 24, 16, 0.06)',
        'scroll-hover': '0 4px 12px rgba(44, 24, 16, 0.12), 0 16px 48px rgba(44, 24, 16, 0.08)',
        'seal': '0 0 0 1px rgba(200, 60, 35, 0.3), 0 2px 4px rgba(200, 60, 35, 0.2)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'breathe': 'breathe 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        breathe: {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};
