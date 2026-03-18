import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#f0f4ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        exp: '#f59e0b',
      },
      animation: {
        'card-flip': 'flip 0.4s ease-in-out',
        'bounce-in': 'bounceIn 0.3s ease-out',
        'hand-raise': 'handRaise 0.2s ease-out',
      },
      keyframes: {
        flip: { '0%': { transform: 'rotateY(0)' }, '100%': { transform: 'rotateY(180deg)' } },
        bounceIn: { '0%': { transform: 'scale(0.8)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        handRaise: { '0%': { transform: 'translateY(0)' }, '100%': { transform: 'translateY(-8px)' } },
      },
    },
  },
  plugins: [],
}
export default config
