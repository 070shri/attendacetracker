/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'monospace']
      },
      colors: {
        accent: {
          DEFAULT: '#3457D5',
          soft: '#5B7CF0',
          dim: '#22304F'
        },
        ok: { DEFAULT: '#1E9E6B', soft: '#16321F' },
        warn: { DEFAULT: '#C98A17', soft: '#3A2C10' },
        bad: { DEFAULT: '#D14343', soft: '#3A1B1B' },
        surface: {
          light: '#FAFAF9',
          card: '#FFFFFF',
          border: '#E7E5E2',
          darkbg: '#0B0D12',
          darkcard: '#12151C',
          darkborder: '#232833'
        },
        ink: {
          light: '#14161A',
          mutedlight: '#63666E',
          dark: '#ECEEF2',
          muteddark: '#8A8F9C'
        }
      },
      borderRadius: { xl2: '14px' },
      boxShadow: {
        card: '0 1px 2px rgba(20,22,26,0.04), 0 1px 8px rgba(20,22,26,0.03)',
        cardDark: '0 1px 2px rgba(0,0,0,0.3), 0 1px 8px rgba(0,0,0,0.25)'
      }
    }
  },
  plugins: []
}
