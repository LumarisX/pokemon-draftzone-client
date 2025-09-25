import colors from 'tailwindcss/colors';

export type RGB = [number, number, number];
export type HSL = [number, number, number];

export type ColorScale = {
  0: string;
  50: string;
  100: string;
  150: string;
  200: string;
  250: string;
  300: string;
  350: string;
  400: string;
  450: string;
  500: string;
  550: string;
  600: string;
  650: string;
  700: string;
  750: string;
  800: string;
  850: string;
  900: string;
  950: string;
};

export type Theme = {
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

export function rgbToHsl(rgb: RGB): HSL {
  const r = rgb[0] / 255;
  const g = rgb[1] / 255;
  const b = rgb[2] / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = l < 0.5 ? delta / (max + min) : delta / (2 - max - min);
    switch (max) {
      case r:
        h = (g - b) / delta + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / delta + 2;
        break;
      case b:
        h = (r - g) / delta + 4;
        break;
    }
    h /= 6;
  }
  return [h * 360, s * 100, l * 100];
}

export function hslToRgb(hsl: HSL): RGB {
  const h = hsl[0] % 360;
  const s = hsl[1] / 100;
  const l = hsl[2] / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - chroma / 2;

  let r = 0,
    g = 0,
    b = 0;

  if (h < 60) {
    r = chroma;
    g = x;
  } else if (h < 120) {
    r = x;
    g = chroma;
  } else if (h < 180) {
    g = chroma;
    b = x;
  } else if (h < 240) {
    g = x;
    b = chroma;
  } else if (h < 300) {
    r = x;
    b = chroma;
  } else {
    r = chroma;
    b = x;
  }
  r = Math.round((r + m) * 255);
  g = Math.round((g + m) * 255);
  b = Math.round((b + m) * 255);
  return [r, g, b];
}

function numberToRgb(hexNumber: number): RGB {
  hexNumber = hexNumber & 0xffffff;
  const r = (hexNumber >> 16) & 0xff;
  const g = (hexNumber >> 8) & 0xff;
  const b = hexNumber & 0xff;
  return [r, g, b];
}

export function rgbToHexString(rgb: RGB): string {
  const [r, g, b] = rgb;
  const red = r.toString(16).padStart(2, '0');
  const green = g.toString(16).padStart(2, '0');
  const blue = b.toString(16).padStart(2, '0');
  return `#${red}${green}${blue}`.toUpperCase();
}

export function generateColorScale(hexNumber: number): RGB[] {
  let hsl = rgbToHsl(numberToRgb(hexNumber));
  const scale = [];
  for (let i = 0; i < 21; i++) {
    hsl[2] = (100 / (21 - 1)) * i;
    scale.push(hslToRgb(hsl));
  }
  return scale;
}

export function generateDarkColorScale(hexNumber: number): RGB[] {
  let hsl = rgbToHsl(numberToRgb(hexNumber));
  const scale = [];
  const count = 41;
  for (let i = 0; i < count; i++) {
    hsl[2] = (100 / (count - 1)) * i;
    scale.push(hslToRgb(hsl));
  }
  return scale.slice(0, 21);
}

export class ThemeBuilder {
  constructor(
    private aTeam: number,
    private bTeam: number,
  ) {
    this.aTeam = aTeam;
    this.bTeam = bTeam;
  }

  toLight(): Theme {
    const aScale: ColorScale = Object.fromEntries(
      generateColorScale(this.aTeam)
        .reverse()
        .map((color, index) => [index * 50, rgbToHexString(color)]),
    ) as ColorScale;
    const bScale: ColorScale = Object.fromEntries(
      generateColorScale(this.bTeam)
        .reverse()
        .map((color, index) => [index * 50, rgbToHexString(color)]),
    ) as ColorScale;
    const menuScale: ColorScale = {
      0: '#FFFFFF',
      50: '#F0F2F4',
      100: '#E1E5EA',
      150: '#D3D8DF',
      200: '#C4CBD4',
      250: '#B5BDCA',
      300: '#A6B0BF',
      350: '#97A3B4',
      400: '#8896AA',
      450: '#7A899F',
      500: '#6B7C94',
      550: '#606F85',
      600: '#556377',
      650: '#4B5768',
      700: '#404A59',
      750: '#353E4A',
      800: '#2B323B',
      850: '#20252C',
      900: '#15191E',
      950: '#0B0C0F',
    };
    console.log(bScale);
    return {
      logo: {
        top: aScale[500],
        bottom: bScale[500],
        background: menuScale[50],
        core: {
          1: '#FFF',
          2: '#9c65aa',
        },
        ring: {
          1: bScale[200],
          2: bScale[250],
          3: bScale[300],
          4: bScale[350],
          5: bScale[450],
          6: bScale[500],
          7: bScale[550],
        },
      },
      aTeam: aScale,
      bTeam: bScale,
      page: colors.white,
      menu: menuScale,
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
  }

  toDark(): Theme {
    const aScale: ColorScale = Object.fromEntries(
      generateDarkColorScale(this.aTeam)
        .reverse()
        .map((color, index) => [index * 50, rgbToHexString(color)]),
    ) as ColorScale;
    const bScale: ColorScale = Object.fromEntries(
      generateDarkColorScale(this.bTeam)
        .reverse()
        .map((color, index) => [index * 50, rgbToHexString(color)]),
    ) as ColorScale;
    const menuScale: ColorScale = {
      0: '#6A7C95',
      50: '#66768D',
      100: '#607085',
      150: '#5B697E',
      200: '#566376',
      250: '#505D6F',
      300: '#4B5768',
      350: '#465160',
      400: '#404A59',
      450: '#3B4451',
      500: '#353E4A',
      550: '#303843',
      600: '#2B323B',
      650: '#252B34',
      700: '#20252C',
      750: '#1B1F25',
      800: '#15191E',
      850: '#101316',
      900: '#0B0C0F',
      950: '#050607',
    };
    return {
      logo: {
        top: aScale[100],
        bottom: bScale[100],
        background: menuScale[500],
        core: {
          1: '#fff',
          2: '#71497C',
        },
        ring: {
          1: bScale[0],
          2: bScale[100],
          3: bScale[150],
          4: bScale[200],
          5: bScale[250],
          6: bScale[300],
          7: bScale[350],
        },
      },
      aTeam: Object.fromEntries(
        generateDarkColorScale(this.aTeam)
          .reverse()
          .map((color, index) => [index * 50, rgbToHexString(color)]),
      ) as ColorScale,
      bTeam: Object.fromEntries(
        generateDarkColorScale(this.bTeam)
          .reverse()
          .map((color, index) => [index * 50, rgbToHexString(color)]),
      ) as ColorScale,
      page: colors.slate[900],
      menu: menuScale,
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
  }
}
