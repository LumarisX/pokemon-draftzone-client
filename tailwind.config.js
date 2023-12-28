/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      spacing: {
        '128': '32rem'
      },
      width: {
        '1/8': '12.5%'
      }
    },
  },
  plugins: [],
}

