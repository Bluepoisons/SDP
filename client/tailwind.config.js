/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
  ],
  theme: {
    extend: {
      backdropBlur: {
        '2xl': '40px',
      },
      dropShadow: {
        'glow': '0 0 10px rgba(168, 85, 247, 0.5)',
        'text-strong': '0 2px 2px rgba(0,0,0,0.8)',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.1)' },
        }
      }
    },
  },
  plugins: [],
}
