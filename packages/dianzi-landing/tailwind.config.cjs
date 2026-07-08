/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: '#F5F0E8',
        ink: '#1A1816',
        violetTrace: '#A78BFA'
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          'PingFang SC',
          'Microsoft YaHei',
          'Segoe UI',
          'sans-serif'
        ],
        serif: ['Noto Serif SC', 'Songti SC', 'STSong', 'serif']
      }
    }
  },
  plugins: []
};
