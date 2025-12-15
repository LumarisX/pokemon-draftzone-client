import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { MatIconModule } from '@angular/material/icon';
import { generate } from '@k-vyn/coloralgorithm';

type Curve = string;

type Props = {
  steps: number;
  hue: {
    start: number; // 0 - 359
    end: number; // 0 - 359
    curve: Curve;
  };
  saturation: {
    start: number; // 0 - 1
    end: number; // 0 - 1
    curve: Curve;
    rate: number; // 1 is default
  };
  brightness: {
    start: number; // 0 - 1
    end: number; // 0 - 1
    curve: Curve;
  };
};
type Options = {
  minorSteps?: number[];
  lockHex?: string; // hex value
  provideInverted?: boolean;
  lockHexInverted?: string; // hex value
  rotation?: 'clockwise' | 'counterclockwise' | 'cw' | 'ccw';
  name?: string;
};

type Config = {
  properties: Props;
  options: Options;
};

type ColorSet = {
  inverted: boolean;
  colors: {
    step: number;
    hue: number;
    saturation: number;
    brightness: number;
    isMajor: boolean;
    isLocked: boolean;
    hex: any;
    hsl: any;
    hsv: any;
    lab: any;
    rgbString: any;
    rgbArray: any;
    rgbaString: any;
    rgbaArray: any;
  }[];
  name: string | undefined;
};

type ColorPalette = Config & {
  set?: ColorSet[];
  copied?: boolean;
};

@Component({
  selector: 'pdz-color-box',
  imports: [CommonModule, MatIconModule],
  templateUrl: './color-box.component.html',
  styleUrl: './color-box.component.scss',
})
export class ColorBoxComponent implements AfterViewInit {
  cdr = inject(ChangeDetectorRef);
  clipboard = inject(Clipboard);
  colorPalettes: ColorPalette[] = [
    {
      properties: {
        steps: 19,
        hue: {
          start: 0,
          end: 0,
          curve: 'linear',
        },
        saturation: {
          start: 0.05,
          end: 1,
          rate: 0,
          curve: 'linear',
        },
        brightness: {
          start: 0.975,
          end: 0.025,
          curve: 'linear',
        },
      },
      options: {
        minorSteps: [],
        name: 'Gray',
        lockHex: '',
        provideInverted: true,
        rotation: 'counterclockwise',
      },
    },
    {
      properties: {
        steps: 19,
        hue: {
          start: 337,
          end: 351,
          curve: 'easeInOutSine',
        },
        saturation: {
          start: 0.05,
          end: 0.75,
          rate: 1.25,
          curve: 'easeOutQuad',
        },
        brightness: {
          start: 1,
          end: 0.2,
          curve: 'easeInCubic',
        },
      },
      options: {
        minorSteps: [],
        name: 'Pink',
        lockHex: '',
        provideInverted: true,
        rotation: 'clockwise',
      },
    },
    {
      properties: {
        steps: 19,
        hue: {
          start: 355,
          end: 359,
          curve: 'easeInOutSine',
        },
        saturation: {
          start: 0.05,
          end: 1,
          rate: 0.8,
          curve: 'easeOutQuad',
        },
        brightness: {
          start: 1,
          end: 0.2,
          curve: 'easeInCubic',
        },
      },
      options: {
        minorSteps: [],
        name: 'Rose',
        lockHex: '',
        provideInverted: true,
        rotation: 'clockwise',
      },
    },
    {
      properties: {
        steps: 19,
        hue: {
          start: 0,
          end: 0,
          curve: 'easeInOutSine',
        },
        saturation: {
          start: 0.05,
          end: 1,
          rate: 1,
          curve: 'easeOutQuad',
        },
        brightness: {
          start: 1,
          end: 0.2,
          curve: 'easeInCubic',
        },
      },
      options: {
        minorSteps: [],
        name: 'Red',
        lockHex: '',
        provideInverted: true,
        rotation: 'counterclockwise',
      },
    },
    {
      properties: {
        steps: 19,
        hue: {
          start: 25,
          end: 10,
          curve: 'easeInOutSine',
        },
        saturation: {
          start: 0.05,
          end: 1,
          rate: 1,
          curve: 'easeOutQuad',
        },
        brightness: {
          start: 1,
          end: 0.2,
          curve: 'easeInCubic',
        },
      },
      options: {
        minorSteps: [],
        name: 'Orange',
        lockHex: '',
        provideInverted: true,
        rotation: 'counterclockwise',
      },
    },
    {
      properties: {
        steps: 19,
        hue: {
          start: 46,
          end: 39,
          curve: 'easeInOutSine',
        },
        saturation: {
          start: 0.05,
          end: 1,
          rate: 1,
          curve: 'easeOutQuad',
        },
        brightness: {
          start: 1,
          end: 0.2,
          curve: 'easeInCubic',
        },
      },
      options: {
        minorSteps: [],
        name: 'Amber',
        lockHex: '',
        provideInverted: true,
        rotation: 'counterclockwise',
      },
    },
    {
      properties: {
        steps: 19,
        hue: {
          start: 49,
          end: 56,
          curve: 'easeInOutSine',
        },
        saturation: {
          start: 0.05,
          end: 1,
          rate: 1,
          curve: 'easeOutQuad',
        },
        brightness: {
          start: 1,
          end: 0.2,
          curve: 'easeInCubic',
        },
      },
      options: {
        minorSteps: [],
        name: 'Yellow',
        lockHex: '',
        provideInverted: true,
        rotation: 'clockwise',
      },
    },
    {
      properties: {
        steps: 19,
        hue: {
          start: 136,
          end: 104,
          curve: 'easeInOutSine',
        },
        saturation: {
          start: 0.05,
          end: 1,
          rate: 1,
          curve: 'easeOutQuad',
        },
        brightness: {
          start: 1,
          end: 0.2,
          curve: 'easeInCubic',
        },
      },
      options: {
        minorSteps: [],
        name: 'Lime',
        lockHex: '',
        provideInverted: true,
        rotation: 'counterclockwise',
      },
    },
    {
      properties: {
        steps: 19,
        hue: {
          start: 140,
          end: 140,
          curve: 'easeInOutSine',
        },
        saturation: {
          start: 0.05,
          end: 1,
          rate: 1,
          curve: 'easeOutQuad',
        },
        brightness: {
          start: 1,
          end: 0.2,
          curve: 'easeInCubic',
        },
      },
      options: {
        minorSteps: [],
        name: 'Green',
        lockHex: '',
        provideInverted: true,
        rotation: 'counterclockwise',
      },
    },
    {
      properties: {
        steps: 19,
        hue: {
          start: 140,
          end: 171,
          curve: 'easeInOutSine',
        },
        saturation: {
          start: 0.05,
          end: 1,
          rate: 0.8,
          curve: 'easeOutQuad',
        },
        brightness: {
          start: 1,
          end: 0.2,
          curve: 'easeInCubic',
        },
      },
      options: {
        minorSteps: [],
        name: 'Mint',
        lockHex: '',
        provideInverted: true,
        rotation: 'clockwise',
      },
    },
    {
      properties: {
        steps: 19,
        hue: {
          start: 183,
          end: 214,
          curve: 'easeInOutSine',
        },
        saturation: {
          start: 0.05,
          end: 1,
          rate: 1,
          curve: 'easeOutQuad',
        },
        brightness: {
          start: 1,
          end: 0.2,
          curve: 'easeInCubic',
        },
      },
      options: {
        minorSteps: [],
        name: 'Cyan',
        lockHex: '',
        provideInverted: true,
        rotation: 'clockwise',
      },
    },
    {
      properties: {
        steps: 19,
        hue: {
          start: 202,
          end: 233,
          curve: 'easeInOutSine',
        },
        saturation: {
          start: 0.05,
          end: 1,
          rate: 1,
          curve: 'easeOutQuad',
        },
        brightness: {
          start: 1,
          end: 0.2,
          curve: 'easeInCubic',
        },
      },
      options: {
        minorSteps: [],
        name: 'Blue',
        lockHex: '',
        provideInverted: true,
        rotation: 'clockwise',
      },
    },
    {
      properties: {
        steps: 19,
        hue: {
          start: 259,
          end: 268,
          curve: 'easeInOutSine',
        },
        saturation: {
          start: 0.05,
          end: 1,
          rate: 1,
          curve: 'easeOutQuad',
        },
        brightness: {
          start: 1,
          end: 0.2,
          curve: 'easeInCubic',
        },
      },
      options: {
        minorSteps: [],
        name: 'Purple',
        lockHex: '',
        provideInverted: true,
        rotation: 'clockwise',
      },
    },
  ];

  ngAfterViewInit(): void {
    this.generateColorPalettes();
  }

  generateColorPalettes() {
    this.colorPalettes.forEach(
      (config) => (config.set = generate(config.properties, config.options)),
    );
  }

  paletteToString(palette: ColorPalette): string {
    let paletteString = ``;
    palette.set?.forEach((mode, index) => {
      paletteString += `//${palette.options.name}${index > 0 ? ' Dark' : ''}\n`;
      mode.colors.forEach((color) => {
        paletteString += `"${index > 0 ? 'dark-' : ''}${palette.options.name?.toLowerCase()}-${(color.step + 1) * 50}": ${color.hex},\n`;
      });
      paletteString += `\n`;
    });
    return paletteString;
  }

  copyPalette(palette: ColorPalette) {
    const pending = this.clipboard.beginCopy(this.paletteToString(palette));
    let remainingAttempts = 3;
    const attempt = () => {
      const result = pending.copy();
      if (!result && --remainingAttempts) {
        palette.copied = true;
        setTimeout(attempt);
      } else {
        palette.copied = false;
        pending.destroy();
      }
    };
    attempt();
  }

  copyAll() {
    let allString = '';
    for (let palette of this.colorPalettes) {
      allString += this.paletteToString(palette) + '\n';
    }
    const pending = this.clipboard.beginCopy(allString);
    let remainingAttempts = 3;
    const attempt = () => {
      const result = pending.copy();
      if (!result && --remainingAttempts) {
        setTimeout(attempt);
      } else {
        pending.destroy();
      }
    };
    attempt();
  }

  export() {
    const json = JSON.stringify(
      this.colorPalettes.map((palette) => ({
        ...palette,
        copied: undefined,
        set: undefined,
      })),
    );
    const pending = this.clipboard.beginCopy(json);
    let remainingAttempts = 3;
    const attempt = () => {
      const result = pending.copy();
      if (!result && --remainingAttempts) {
        setTimeout(attempt);
      } else {
        pending.destroy();
      }
    };
    attempt();
  }
}
