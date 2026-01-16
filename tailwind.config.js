/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        accent: '#00ff94',
        dark: '#0a0a0f',
      },
      fontFamily: {
        sans: ['Space Mono', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'gradient': 'gradient 3s ease infinite',
        'pulse': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        'glow': '0 0 30px rgba(0, 255, 148, 0.3)',
        'glow-lg': '0 0 60px rgba(0, 255, 148, 0.4)',
      },
    },
  },
  plugins: [],
}