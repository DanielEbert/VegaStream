module.exports = {
  content: [
    './src/renderer/**/*.{js,jsx,ts,tsx}',
    './node_modules/react-tailwindcss-datepicker/dist/index.esm.js',
  ],
  theme: {
    fontFamily: {
      sans: ['Helvetica', 'Arial', 'sans-serif'],
    },
    extend: {
      colors: {
        'bg-visu': '#F5F5F5',
      },
    },
  },
  variants: {},
  plugins: [],
};
