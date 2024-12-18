import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Settings, SettingsService } from './settings.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SpriteComponent } from '../../images/sprite.component';
import { Pokemon } from '../../interfaces/draft';
@Component({
  selector: 'settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SpriteComponent],
  templateUrl: './settings.component.html',
})
export class SettingsComponent implements OnInit {
  constructor(
    private settingsService: SettingsService,
    private fb: FormBuilder,
  ) {}

  settingsData!: Settings;
  example: Pokemon = { id: 'deoxysattack', name: 'Deoxys-Attack' };

  themes: { id: string; name: string }[] = [
    { id: 'classic', name: 'Classic' },
    { id: 'christmas', name: 'Christmas' },
    { id: 'graymode', name: 'Grayscale' },
  ];

  settingsForm!: FormGroup;

  ngOnInit(): void {
    let form = this.fb.group({
      theme: this.settingsService.settingsData.theme || 'classic',
      ldMode: this.settingsService.settingsData.ldMode || 'device',
      spriteSet: this.settingsService.settingsData.spriteSet || 'home',
    });
    form.valueChanges.subscribe((value: any) => {
      this.settingsService.settingsData = value;
      localStorage.setItem('user-settings', JSON.stringify(value));
      this.example = { id: 'deoxysattack', name: 'Deoxys-Attack' };
    });
    form.get('ldMode')?.valueChanges.subscribe((value: string | null) => {
      if (value) this.settingsService.updateLDMode(value);
    });
    this.settingsForm = form;
    if (localStorage.getItem('shinyunlocked')) {
      this.themes.push({ id: 'shiny', name: 'Shiny' });
    }
  }
}
