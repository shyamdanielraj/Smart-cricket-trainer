/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        neon: {
          green: '#00FFAB',
          cyan: '#00E5FF',
        },
        ink: {
          950: '#0A0A0A',
          900: '#0B1F3A',
        },
      },
      boxShadow: {
        glow: '0 0 25px rgba(0, 255, 171, 0.25), 0 0 50px rgba(0, 229, 255, 0.10)',
      },
      backdropBlur: {
        glass: '18px',
      },
    },
  },
  plugins: [],
}

