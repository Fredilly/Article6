/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: { brand: { dark: '#006738' } },
      fontFamily: { sans: ['Inter', 'ui-sans-serif'] },
    },
  },
  plugins: [],
};
