/** @type {import('tailwindcss').Config} */

import colors from 'tailwindcss/colors';
import { createThemes } from 'tw-colors';

//get rid of ? in time
type ColorScale = {
  50?: string;
  100: string;
  150?: string;
  200: string;
  250?: string;
  300: string;
  350?: string;
  400: string;
  450?: string;
  500: string;
  550?: string;
  600: string;
  650?: string;
  700: string;
  750?: string;
  800: string;
  850?: string;
  900?: string;
  950?: string;
};

type Theme = {
  logo: {
    top: string;
    bottom: string;
    background: string;
    core: {
      1: string;
      2: string;
    };
    ring: {
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
      6: string;
      7: string;
    };
  };
  page: string;
  aTeam: ColorScale;
  bTeam: ColorScale;
  menu: ColorScale;
  symbolColor: {
    main: string;
    sub: string;
    disabled: string;
    inverted: string;
  };
  spriteBorder: string;
  scale: {
    positive: {
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
      6: string;
      7: string;
      text: string;
    };
    negative: {
      1: string;
      2: string;
      3: string;
      4: string;
      5: string;
      6: string;
      7: string;
      text: string;
    };
    neutral: string;
  };
  caution: string;
  required: string;
};

const ClassicTheme: Theme = {
  logo: {
    top: '#0fb6cd',
    bottom: '#f15b42',
    background: colors.white,
    core: {
      1: '#FFF',
      2: '#9c65aa',
    },
    ring: {
      1: '#fff',
      2: '#fbd8d2',
      3: '#f7ab9f',
      4: '#f48876',
      5: '#f26f59',
      6: '#f16048',
      7: '#f15b42',
    },
  },
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
    sub: colors.neutral[700],
    disabled: colors.neutral[500],
    inverted: colors.white,
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
      text: colors.black,
    },
    negative: {
      1: colors.rose[200],
      2: colors.rose[300],
      3: colors.rose[400],
      4: colors.rose[500],
      5: colors.rose[600],
      6: colors.rose[700],
      7: colors.rose[800],
      text: colors.black,
    },
    neutral: colors.slate[300],
  },
  caution: colors.yellow[200],
  required: colors.red[500],
};

const ClassicDark: Theme = {
  logo: {
    top: '#0fb6cd',
    bottom: '#f15b42',
    background: '#3D4B5F',
    core: {
      1: '#FFF',
      2: '#71497C',
    },
    ring: {
      1: '#000',
      2: '#33130E',
      3: '#66271C',
      4: '#993A2A',
      5: '#B64532',
      6: '#D4503A',
      7: '#f15b42',
    },
  },
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
    100: '#172033',
    200: colors.slate[800],
    300: '#293548',
    400: colors.slate[700],
    500: '#3D4B5F',
    600: colors.slate[600],
    700: '#56657A',
    800: colors.slate[500],
  },
  symbolColor: {
    main: colors.neutral[200],
    sub: colors.neutral[400],
    disabled: colors.neutral[600],
    inverted: colors.neutral[200],
  },
  spriteBorder: colors.slate[500],
  scale: {
    positive: {
      1: colors.emerald[900],
      2: colors.emerald[800],
      3: colors.emerald[700],
      4: colors.emerald[600],
      5: colors.emerald[500],
      6: colors.emerald[400],
      7: colors.emerald[300],
      text: colors.black,
    },
    negative: {
      1: colors.rose[900],
      2: colors.rose[800],
      3: colors.rose[700],
      4: colors.rose[600],
      5: colors.rose[500],
      6: colors.rose[400],
      7: colors.rose[300],
      text: colors.black,
    },
    neutral: colors.slate[700],
  },
  caution: colors.yellow[600],
  required: colors.red[500],
};

const Grayscale: Theme = {
  logo: {
    top: '#0fb6cd',
    bottom: '#f15b42',
    background: colors.slate[100],
    core: {
      1: '#FFF',
      2: '#9c65aa',
    },
    ring: {
      1: '#fff',
      2: '#fbd8d2',
      3: '#f7ab9f',
      4: '#f48876',
      5: '#f26f59',
      6: '#f16048',
      7: '#f15b42',
    },
  },
  page: colors.white,
  aTeam: {
    100: colors.gray[50],
    200: colors.gray[100],
    300: colors.gray[200],
    400: colors.gray[300],
    500: colors.gray[400],
    600: colors.gray[500],
    700: colors.gray[600],
    800: colors.gray[700],
    900: colors.gray[800],
  },
  bTeam: {
    100: colors.gray[50],
    200: colors.gray[100],
    300: colors.gray[200],
    400: colors.gray[300],
    500: colors.gray[400],
    600: colors.gray[500],
    700: colors.gray[600],
    800: colors.gray[700],
    900: colors.gray[800],
  },
  menu: colors.slate,
  symbolColor: {
    main: colors.black,
    sub: colors.neutral[800],
    disabled: colors.neutral[500],
    inverted: colors.white,
  },
  spriteBorder: colors.slate[500],
  scale: {
    positive: {
      1: colors.zinc[500],
      2: '#62626B',
      3: colors.zinc[600],
      4: '#494951',
      5: colors.zinc[700],
      6: '#333338',
      7: colors.zinc[800],
      text: colors.white,
    },
    negative: {
      1: colors.zinc[400],
      2: '#BBBBC1',
      3: colors.zinc[300],
      4: '#DCDCE0',
      5: colors.zinc[200],
      6: '#ECECEE',
      7: colors.zinc[100],
      text: colors.black,
    },
    neutral: '#898992',
  },
  caution: colors.yellow[200],
  required: colors.red[500],
};

const Blackscale: Theme = {
  logo: {
    top: '#0fb6cd',
    bottom: '#f15b42',
    background: colors.slate[600],
    core: {
      1: '#FFF',
      2: '#9c65aa',
    },
    ring: {
      1: '#fff',
      2: '#fbd8d2',
      3: '#f7ab9f',
      4: '#f48876',
      5: '#f26f59',
      6: '#f16048',
      7: '#f15b42',
    },
  },
  page: colors.slate[900],
  aTeam: {
    100: colors.gray[800],
    200: colors.gray[700],
    300: colors.gray[600],
    400: colors.gray[500],
    500: colors.gray[400],
    600: colors.gray[300],
    700: colors.gray[200],
    800: colors.gray[100],
    900: colors.gray[50],
  },
  bTeam: {
    100: colors.gray[800],
    200: colors.gray[700],
    300: colors.gray[600],
    400: colors.gray[500],
    500: colors.gray[400],
    600: colors.gray[300],
    700: colors.gray[200],
    800: colors.gray[100],
    900: colors.gray[50],
  },
  menu: {
    100: '#172033',
    200: colors.slate[800],
    300: '#293548',
    400: colors.slate[700],
    500: '#3D4B5F',
    600: colors.slate[600],
    700: '#56657A',
    800: colors.slate[500],
  },
  symbolColor: {
    main: colors.neutral[100],
    sub: colors.neutral[300],
    disabled: colors.neutral[400],
    inverted: colors.neutral[200],
  },
  spriteBorder: colors.slate[400],
  scale: {
    positive: {
      1: colors.zinc[400],
      2: '#BBBBC1',
      3: colors.zinc[300],
      4: '#DCDCE0',
      5: colors.zinc[200],
      6: '#ECECEE',
      7: colors.zinc[100],
      text: colors.black,
    },
    negative: {
      1: colors.zinc[500],
      2: '#62626B',
      3: colors.zinc[600],
      4: '#494951',
      5: colors.zinc[700],
      6: '#333338',
      7: colors.zinc[800],
      text: colors.white,
    },
    neutral: '#898992',
  },
  caution: colors.yellow[600],
  required: colors.red[500],
};

const Shiny: Theme = {
  logo: {
    top: colors.teal[400],
    bottom: '#E9CA32',
    background: colors.white,
    core: {
      1: '#FFF',
      2: '#9c65aa',
    },
    ring: {
      1: '#fff',
      2: '#FBF5D9',
      3: '#F7EBB3',
      4: '#F3E18D',
      5: '#EFD767',
      6: '#EACE41',
      7: '#E6C41B',
    },
  },
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
    sub: colors.neutral[800],
    disabled: colors.neutral[500],
    inverted: colors.white,
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
      text: colors.black,
    },
    negative: {
      1: colors.rose[200],
      2: colors.rose[300],
      3: colors.rose[400],
      4: colors.rose[500],
      5: colors.rose[600],
      6: colors.rose[700],
      7: colors.rose[800],
      text: colors.black,
    },
    neutral: colors.slate[300],
  },
  caution: colors.green[200],
  required: colors.red[500],
};

const ShinyDark: Theme = {
  logo: {
    top: '#11A697',
    bottom: '#D2B004',
    background: '#3D4B5F',
    core: {
      1: '#FFF',
      2: '#71497C',
    },
    ring: {
      1: '#000',
      2: '#292301',
      3: '#514501',
      4: '#7A6802',
      5: '#978003',
      6: '#B59803',
      7: '#D2B004',
    },
  },
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
    100: '#172033',
    200: colors.slate[800],
    300: '#293548',
    400: colors.slate[700],
    500: '#3D4B5F',
    600: colors.slate[600],
    700: '#56657A',
    800: colors.slate[500],
  },
  symbolColor: {
    main: colors.neutral[100],
    sub: colors.neutral[300],
    disabled: colors.neutral[400],
    inverted: colors.neutral[200],
  },
  spriteBorder: colors.slate[500],
  scale: {
    positive: {
      1: colors.emerald[900],
      2: colors.emerald[800],
      3: colors.emerald[700],
      4: colors.emerald[600],
      5: colors.emerald[500],
      6: colors.emerald[400],
      7: colors.emerald[300],
      text: colors.black,
    },
    negative: {
      1: colors.rose[900],
      2: colors.rose[800],
      3: colors.rose[700],
      4: colors.rose[600],
      5: colors.rose[500],
      6: colors.rose[400],
      7: colors.rose[300],
      text: colors.black,
    },
    neutral: colors.slate[700],
  },
  caution: colors.green[600],
  required: colors.red[500],
};

export default {
  content: ['./src/**/*.{html,ts,tsx,jsx}'],
  darkMode: 'selector',
  theme: {
    fontFamily: {
      nasa: ['Nasalization RG', 'sans-serif'],
      nunito: ['Nunito', 'sans-serif'],
    },
    extend: {
      spacing: {
        128: '32rem',
        160: '40rem',
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
          650: '#3D4B5F',
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
        classic: ClassicTheme,
        darkclassic: ClassicDark,
        graycolorblind: Grayscale,
        darkcolorblind: Blackscale,
        shiny: Shiny,
        darkshiny: ShinyDark,
      },
      {
        defaultTheme: {
          light: 'classic',
          dark: 'darkclassic',
        },
      }
    ),
  ],
};
