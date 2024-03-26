import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'speed-modifier-icon',
  standalone: true,
  template: `<img
    *ngIf="modifiers.hasOwnProperty(modifier)"
    class="h-full border rounded-full bg-slate-200 border-slate-700"
    src="{{ modifiers[modifier].path }}"
    title="{{ modifiers[modifier].title }}"
    alt="{{ modifiers[modifier].alt }}"
  />`,
  imports: [CommonModule],
})
export class SpeedModifierIconComponent {
  @Input() modifier: string = '';

  modifiers: {
    [key: string]: { path: string; title: string; alt: string };
  } = {
    '252': {
      path: '../../../../assets/icons/speedchart/252.svg',
      title: '252 evs',
      alt: '252',
    },
    '0': {
      path: '../../../../assets/icons/speedchart/0.svg',
      title: '0 evs',
      alt: '0',
    },
    Positive: {
      path: '../../../../assets/icons/speedchart/plus.svg',
      title: '+ Nature',
      alt: '+',
    },
    Negative: {
      path: '../../../../assets/icons/speedchart/minus.svg',
      title: '- Nature',
      alt: '-',
    },
    'Stage 1': {
      path: '../../../../assets/icons/speedchart/plus1.svg',
      title: '+1 Stage',
      alt: 'Stage 1',
    },
    'Stage 2': {
      path: '../../../../assets/icons/speedchart/plus2.svg',
      title: '+2 Stage',
      alt: 'Stage 2',
    },
    'Stage -1': {
      path: '../../../../assets/icons/speedchart/minus1.svg',
      title: '-1 Stage',
      alt: 'Stage -1',
    },
    'Choice Scarf': {
      path: '../../../../assets/icons/speedchart/scarf.svg',
      title: 'Choice Scarf',
      alt: 'Choice Scarf',
    },
    Tailwind: {
      path: '../../../../assets/icons/speedchart/tailwind.svg',
      title: 'Tailwind',
      alt: 'Tailwind',
    },
    Paralyzed: {
      path: '../../../../assets/icons/speedchart/paralyzed.svg',
      title: 'Paralyzed',
      alt: 'Paralyzed',
    },
    'Quark Drive': {
      path: '../../../../assets/icons/speedchart/booster.svg',
      title: 'Quark Drive',
      alt: 'Quark Drive',
    },
    Protosynthesis: {
      path: '../../../../assets/icons/speedchart/booster.svg',
      title: 'Protosynthesis',
      alt: 'Protosynthesis',
    },
    'Sand Rush': {
      path: '../../../../assets/icons/speedchart/sand.svg',
      title: 'Sand Rush',
      alt: 'Sand Rush',
    },
    'Swift Swim': {
      path: '../../../../assets/icons/speedchart/rain.svg',
      title: 'Swift Swim',
      alt: 'Swift Swim',
    },
    Chlorophyll: {
      path: '../../../../assets/icons/speedchart/sun.svg',
      title: 'Chlorophyll',
      alt: 'Chlorophyll',
    },
    'Slush Rush': {
      path: '../../../../assets/icons/speedchart/snow.svg',
      title: 'Slush Rush',
      alt: 'Slush Rush',
    },

    'Iron Ball': {
      path: '../../../../assets/icons/speedchart/ironball.svg',
      title: 'Iron Ball',
      alt: 'Iron Ball',
    },
  };

  constructor() {}
}
