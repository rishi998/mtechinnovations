import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        ds: {
          primary: '#0A0A0A',
          surface: '#1A1A1A',
          border: '#2B2B2B',
          'text-primary': '#FFFFFF',
          'text-secondary': '#A8A8A8',
          accent: '#FF4C00',
          light: '#F5F5F5',
        },
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
        secondary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
          950: '#450a0a',
        },
        accent: {
          orange: '#ea580c',
          'orange-light': '#fb923c',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        hero: ['64px', { lineHeight: '1', letterSpacing: '-0.5px' }],
        section: ['36px', { lineHeight: '1.2' }],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        ripple: 'ripple 650ms ease-out forwards',
        'hero-enter':
          'heroEnter 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'hero-enter-delayed':
          'heroEnter 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.15s both',
        'cart-bump': 'cartBump 420ms cubic-bezier(0.22, 1, 0.36, 1) both',
        'btn-success-pop': 'btnSuccessPop 200ms ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        ripple: {
          '0%': { transform: 'translate(-50%, -50%) scale(0)', opacity: '0.35' },
          '100%': { transform: 'translate(-50%, -50%) scale(1)', opacity: '0' },
        },
        heroEnter: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        cartBump: {
          '0%, 100%': { transform: 'scale(1)' },
          '35%': { transform: 'scale(1.12)' },
          '70%': { transform: 'scale(0.98)' },
        },
        btnSuccessPop: {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        },
      },
      transitionDuration: {
        '180': '180ms',
        '200': '200ms',
        '250': '250ms',
        '600': '600ms',
      },
    },
  },
  plugins: [],
}
export default config
