/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#6C63FF',
          dark: '#4C46B9',
          light: '#A7A2FF',
        },
        accent: '#FF8A5B',
        ink: '#0F172A',
        muted: '#94A3B8',
      },
      boxShadow: {
        glass: '0 25px 60px -25px rgba(15, 23, 42, 0.4)',
      },
      backgroundImage: {
        'grid-light':
          'radial-gradient(circle at 1px 1px, rgba(148, 163, 184, 0.35) 1px, transparent 0)',
      },
    },
  },
  plugins: [],
}
