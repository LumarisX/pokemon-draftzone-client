import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'settings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent {
  constructor() {}
}
