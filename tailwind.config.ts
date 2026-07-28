import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",

    // Or if using `src` directory:
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0f7f2',
          100: '#d9eedd',
          200: '#b3ddba',
          300: '#80c88e',
          400: '#4dab5e',
          500: '#2d8a3e',
          600: '#1a6b30',
          700: '#145225',
          800: '#0d3d1a',
          900: '#082b12',
          950: '#041a0a',
        },
      },
    },
  },
  plugins: [],
};

export default config;
