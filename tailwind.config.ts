/** @type {import('tailwindcss').Config} */

import { createThemes } from 'tw-colors';
import colors from 'tailwindcss/colors';

export default {
  content: ['./src/**/*.{html,ts,tsx,jsx}'],
  theme: {
    fontFamily: {
      nasa: ['Nasalization RG', 'sans-serif'],
    },
    extend: {
      spacing: {
        128: '32rem',
        192: '48rem',
      },
      width: {
        '1/8': '12.5%',
      },
      colors: {
        slate: {
          150: '#EAEFF5',
          250: '#D7DFE9',
          350: '#B0BCCC',
        },
        cyan: {
          150: '#BAF7FD',
          250: '#86EEFB',
          350: '#45DEF4',
          450: '#14C5E1',
          550: '#07A4C3',
          650: '#0B83A1',
          750: '#126983',
          850: '#16566C',
        },
        red: {
          150: '#FED6D6',
          250: '#FDB8B8',
          350: '#FA8B8B',
          450: '#F45B5B',
          550: '#E63535',
          650: '#CB2121',
          750: '#A91C1C',
          850: '#8C1C1C',
        },
        deoxys: {
          red: '#F15B42',
          cyan: '#0FB6CD',
          purple: '#9B65AA',
        },
        bug: '#b0c435',
        dark: '#6d5b50',
        dragon: '#7a6fb2',
        electric: '#eec74f',
        fairy: '#ff6ddc',
        fighting: '#a4573e',
        fire: '#fd5538',
        flying: '#a5ace4',
        ghost: '#3f3874',
        grass: '#83cc59',
        ground: '#c6af81',
        ice: '#58c7e0',
        normal: '#a5a39c',
        poison: '#9c7593',
        psychic: '#d4869e',
        rock: '#bea255',
        steel: '#a9aaba',
        water: '#399eff',
      },
      fontSize: {
        '2xs': '.5rem',
      },
    },
  },
  plugins: [
    createThemes(
      {
        light: {
          page: colors.white,
          aTeam: colors.cyan,
          bTeam: colors.red,
          menu: colors.slate,
          symbolColor: {
            main: colors.black,
          },
          spriteBorder: colors.slate[500],
          scale: {
            positive: {
              1: colors.emerald[200],
              2: colors.emerald[300],
              3: colors.emerald[400],
              4: colors.emerald[500],
              5: colors.emerald[600],
              6: colors.emerald[700],
              7: colors.emerald[800],
            },
            negative: {
              1: colors.rose[200],
              2: colors.rose[300],
              3: colors.rose[400],
              4: colors.rose[500],
              5: colors.rose[600],
              6: colors.rose[700],
              7: colors.rose[800],
            },
          },
          caution: colors.yellow[200],
        },
        dark: {
          page: colors.slate[900],
          aTeam: {
            100: '#07A4C3',
            200: colors.cyan[600],
            300: '#0B83A1',
            400: colors.cyan[700],
            500: '#126983',
            600: colors.cyan[800],
            700: '#16566C',
            800: colors.cyan[950],
          },
          bTeam: {
            100: '#E63535',
            200: colors.red[600],
            300: '#CB2121',
            400: colors.red[700],
            500: '#A91C1C',
            600: colors.red[800],
            700: '#8C1C1C',
            800: colors.red[950],
          },
          menu: {
            100: colors.slate[800],
            200: colors.slate[700],
            300: colors.slate[600],
            400: colors.slate[500],
            500: colors.slate[400],
            600: colors.slate[300],
            700: colors.slate[200],
            800: colors.slate[100],
          },
          symbolColor: {
            main: colors.gray[200],
          },
          spriteBorder: colors.slate[400],
          scale: {
            positive: {
              1: colors.emerald[900],
              2: colors.emerald[800],
              3: colors.emerald[700],
              4: colors.emerald[600],
              5: colors.emerald[500],
              6: colors.emerald[400],
              7: colors.emerald[300],
            },
            negative: {
              1: colors.rose[900],
              2: colors.rose[800],
              3: colors.rose[700],
              4: colors.rose[600],
              5: colors.rose[500],
              6: colors.rose[400],
              7: colors.rose[300],
            },
          },
          caution: colors.yellow[600],
        },
        shiny: {
          page: colors.white,
          aTeam: colors.teal,
          bTeam: colors.yellow,
          menu: colors.slate,
          symbolColor: {
            main: colors.black,
          },
          spriteBorder: colors.slate[500],
          scale: {
            positive: {
              1: colors.emerald[200],
              2: colors.emerald[300],
              3: colors.emerald[400],
              4: colors.emerald[500],
              5: colors.emerald[600],
              6: colors.emerald[700],
              7: colors.emerald[800],
            },
            negative: {
              1: colors.rose[200],
              2: colors.rose[300],
              3: colors.rose[400],
              4: colors.rose[500],
              5: colors.rose[600],
              6: colors.rose[700],
              7: colors.rose[800],
            },
          },
          caution: colors.green[200],
        },
      },
      {
        defaultTheme: {
          light: 'light',
          dark: 'dark',
        },
      }
    ),
  ],
};
