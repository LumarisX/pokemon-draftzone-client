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
      colors: {
        slate: {
          350: "#B0BCCC",
        },
        bug: "#b0c435",
        dark: "#6d5b50",
        dragon: "#7a6fb2",
        electric: "#eec74f",
        fairy: "#ff6ddc",
        fighting: "#a4573e",
        fire: "#fd5538",
        flying: "#a5ace4",
        ghost: "#3f3874",
        grass: "#83cc59",
        ground: "#c6af81",
        ice: "#58c7e0",
        normal: "#a5a39c",
        poison: "#9c7593",
        psychic: "#d4869e",
        rock: "#bea255",
        steel: "#a9aaba",
        water: "#399eff",
      },
    },
  },
  plugins: [],
};
