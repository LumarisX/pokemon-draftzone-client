import { Component, Input } from '@angular/core';

export const BALLHEX: {
  [key: string]: {
    top?: string;
    bottom?: string;
    inner?: string;
    outer?: string;
  };
} = {
  plain: { top: '#4F4F4F' },
  premier: { outer: '#F00' },
  poke: { top: '#d84444' },
  great: { top: '#006bff' },
  ultra: { top: '#EEE635' },
  luxury: {
    top: '#000',
    bottom: '#000',
    outer: '#FACC15',
    inner: '#FACC15',
  },
  master: { top: '#DD10DD' },
};

@Component({
  selector: 'ball-svg',
  standalone: true,
  template: `<svg
    viewBox="0 0 24 24"
    fill="#fff"
    stroke="#000"
    xmlns="http://www.w3.org/2000/svg"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width=".5"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      [attr.fill]="BALLHEX[ballType].outer || '#000'"
    />
    <path
      d="M21.9012 13H16.8506C16.3873 15.2822 14.3696 17 11.9506 17C9.53167 17 7.51391 15.2822 7.05064 13H2C2.50172 18.0533 6.76528 22 11.9506 22C17.136 22 21.3995 18.0533 21.9012 13Z"
      [attr.fill]="BALLHEX[ballType].bottom || '#FFF'"
    />
    <path
      d="M21.9012 11C21.3995 5.94668 17.136 2 11.9506 2C6.76528 2 2.50172 5.94668 2 11H7.05064C7.51391 8.71776 9.53167 7 11.9506 7C14.3696 7 16.3873 8.71776 16.8506 11H21.9012Z"
      [attr.fill]="BALLHEX[ballType].top || '#FFF'"
    />
    <circle
      cx="12"
      cy="12"
      r="3.2"
      [attr.fill]="BALLHEX[ballType].inner || '#FFF'"
    />
  </svg> `,
})
export class BallSVG {
  @Input()
  ballType: keyof typeof BALLHEX = 'plain';
  BALLHEX = BALLHEX;
}
