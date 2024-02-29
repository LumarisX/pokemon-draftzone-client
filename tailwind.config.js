/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts,tsx,jsx}"],
  theme: {
    extend: {
      spacing: {
        128: "32rem",
        192: "48rem",
      },
      width: {
        "1/8": "12.5%",
      },
    },
  },
  plugins: [],
};
