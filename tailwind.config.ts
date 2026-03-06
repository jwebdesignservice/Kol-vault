import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    './hooks/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0A0010',
          surface: '#100020',
          elevated: '#15002E',
        },
        accent: {
          DEFAULT: '#7B2FBE',
          bright: '#A855F7',
          glow: '#C084FC',
        },
        border: {
          DEFAULT: '#2D0E5A',
          active: '#7B2FBE',
          muted: '#1A0035',
        },
        text: {
          primary: '#F0E6FF',
          secondary: '#9B7EC8',
          muted: '#4A3566',
        },
        positive: '#22D3A0',
        negative: '#FF4466',
        warning: '#F59E0B',
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '0px',
        md: '0px',
        lg: '0px',
        xl: '0px',
        '2xl': '0px',
        '3xl': '0px',
        full: '0px',
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
        body: ['var(--font-body)', 'sans-serif'],
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        pulse_dot: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.3' },
        },
        fadeInDown: {
          '0%': { opacity: '0', transform: 'translateY(-8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.5s infinite',
        ticker: 'ticker 30s linear infinite',
        pulse_dot: 'pulse_dot 1.5s ease-in-out infinite',
        fadeInDown: 'fadeInDown 0.2s ease',
      },
    },
  },
  plugins: [],
}

export default config
