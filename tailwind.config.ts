/** @type {import('tailwindcss').Config} */

import colors, { yellow } from 'tailwindcss/colors';
import { createThemes } from 'tw-colors';

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
        yellow: {
          50: '#FFFDE6',
          100: '#FFFBCC',
          150: '#FFF9B3',
          200: '#FFF799',
          250: '#FFF580',
          300: '#FFF266',
          350: '#FFF04D',
          400: '#FFEE33',
          450: '#FFEC1A',
          500: '#FFEA00',
          550: '#EEDA00',
          600: '#DDCB00',
          650: '#CCBB00',
          700: '#BBAC00',
          750: '#AA9C00',
          800: '#998D00',
          850: '#887D00',
          900: '#776E00',
          950: '665E00',
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
          bTeam: {
            50: '#FCE1D1',
            100: '#FAD1B9',
            150: '#F8C2A2',
            200: '#F6B38B',
            250: '#F5A474',
            300: '#F3955D',
            350: '#F18646',
            400: '#EF762E',
            450: '#EE6717',
            500: '#EC5800',
            550: '#D75000',
            600: '#C14800',
            650: '#AC4000',
            700: '#963800',
            750: '#813000',
            800: '#6B2800',
            850: '#562000',
            900: '#401800',
            950: '#2B1000',
          },
          menu: colors.slate,
          symbolColor: {
            main: colors.black,
            sub: colors.gray[800],
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
          deoxys: {
            accent: '#F15B42',
            main: '#0FB6CD',
            core: '#9B65AA',
          },
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
            800: colors.cyan[900],
          },
          bTeam: {
            100: '#CB4C00',
            200: '#BA4500',
            300: '#A93F00',
            400: '#993900',
            500: '#883300',
            600: '#772C00',
            700: '#672600',
            800: '#562000',
          },
          menu: {
            100: colors.slate[900],
            200: colors.slate[800],
            300: colors.slate[700],
            400: colors.slate[600],
            500: colors.slate[500],
            600: colors.slate[400],
            700: colors.slate[300],
            800: colors.slate[200],
          },
          symbolColor: {
            main: colors.gray[200],
            sub: colors.gray[300],
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
          deoxys: {
            accent: '#F15B42',
            main: '#0FB6CD',
            core: '#9B65AA',
          },
        },
        shiny: {
          page: colors.white,
          aTeam: colors.teal,
          bTeam: {
            50: '#FAF3D1',
            100: '#F8EDBB',
            150: '#F5E7A4',
            200: '#F3E18D',
            250: '#F0DC76',
            300: '#EED65F',
            350: '#EBD048',
            400: '#E9CA32',
            450: '#E6C41B',
            500: '#E4BE04',
            550: '#D2B004',
            600: '#C1A103',
            650: '#AF9303',
            700: '#9D8502',
            750: '#8C7702',
            800: '#7A6802',
            850: '#685A01',
            900: '#564C01',
            950: '#453D00',
          },
          menu: colors.slate,
          symbolColor: {
            main: colors.black,
            sub: colors.gray[800],
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
          deoxys: {
            main: colors.teal[400],
            accent: '#E9CA32',
            core: '#9B65AA',
          },
        },
        darkshiny: {
          page: colors.slate[900],
          aTeam: {
            100: '#11A697',
            200: colors.teal[600],
            300: '#0E857B',
            400: colors.teal[700],
            500: '#106A64',
            600: colors.teal[800],
            700: '#125652',
            800: colors.teal[900],
          },
          bTeam: {
            100: '#D2B004',
            200: '#C1A103',
            300: '#AF9303',
            400: '#9D8502',
            500: '#8C7702',
            600: '#7A6802',
            700: '#685A01',
            800: '#564C01',
          },
          menu: {
            100: colors.slate[900],
            200: colors.slate[800],
            300: colors.slate[700],
            400: colors.slate[600],
            500: colors.slate[500],
            600: colors.slate[400],
            700: colors.slate[300],
            800: colors.slate[200],
          },
          symbolColor: {
            main: colors.gray[200],
            sub: colors.gray[300],
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
          caution: colors.green[600],
          deoxys: {
            main: colors.teal[400],
            accent: '#E9CA32',
            core: '#9B65AA',
          },
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
