/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          dark: '#080c10',
          darker: '#04070a',
          terminal: '#0d151c',
          border: '#1b2c3f',
          green: '#00ff66',
          greenDim: '#00aa44',
          cyan: '#00e5ff',
          red: '#ff3366',
          yellow: '#ffcc00',
          purple: '#b827fc',
          muted: '#52718e'
        }
      },
      fontFamily: {
        mono: ['Fira Code', 'Courier New', 'monospace']
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' }
        }
      }
    },
  },
  plugins: [],
}
