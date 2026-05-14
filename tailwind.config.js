/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { cyan: '#00BFFF', dark: '#0A0E17' },
        compliance: { red: '#FF0000', amber: '#FFA500', green: '#22C55E', blue: '#3B82F6' },
      },
    },
  },
  plugins: [],
};
