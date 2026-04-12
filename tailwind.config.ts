/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/components/**/*.{vue,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
  ],
  theme: {
    extend: {
      colors: {
        coral: '#FF6B6B',
        lavender: '#9B5DE5',
        mint: '#00F5D4',
        'warm-bg': '#FFF8F0',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
