import { Component } from '@angular/core';

@Component({
  selector: 'icon',
  standalone: true,
  imports: [],
  template: `<span class="material-symbols-outlined"><ng-content /></span>`,
  styleUrl: './icon.component.scss',
})
export class IconComponent {}
