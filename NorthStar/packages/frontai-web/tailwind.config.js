/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx,html}'],
  theme: {
    extend: {
      colors: {
        'eye-care-bg': '#F7F6F2',
        'eye-care-card': '#FDFCF8',
        'eye-care-border': '#EBE9E0',
      },
    },
  },
  plugins: [],
};
