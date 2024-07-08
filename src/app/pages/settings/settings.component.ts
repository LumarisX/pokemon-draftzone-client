import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Settings, SettingsService } from './settings.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  constructor(private settingsService: SettingsService) {}

  settingsData!: Settings;

  themes: { id: string; name: string }[] = [
    { id: 'device', name: 'Device' },
    { id: 'light', name: 'Light' },
    { id: 'dark', name: 'Dark' },
  ];
  colorblind: { id: string; name: string }[] = [
    { id: 'none', name: 'None' },
    { id: 'grayscale', name: 'Grayscale' },
  ];

  ngOnInit(): void {
    this.settingsData = this.settingsService.settingsData;
    if (localStorage.getItem('shinyunlocked')) {
      this.themes.push(
        { id: 'shiny', name: 'Shiny' },
        { id: 'darkshiny', name: 'Dark Shiny' }
      );
    }
  }
}
