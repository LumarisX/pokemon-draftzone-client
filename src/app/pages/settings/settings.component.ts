import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Settings, SettingsService } from './settings.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SpriteComponent } from '../../images/sprite/sprite.component';
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

  example: Pokemon = { id: 'deoxysattack', name: 'Deoxys-Attack' };

  themes: { id: string; name: string }[] = [
    { id: 'classic', name: 'Classic' },
    { id: 'christmas', name: 'Christmas' },
    { id: 'graymode', name: 'Grayscale' },
  ];

  spriteSets: { name: string; id: string; creditLink: string }[] = [
    {
      name: 'Pokemon Home',
      id: 'home',
      creditLink: 'https://home.pokemon.com/en-us/',
    },
    {
      name: 'Serebii',
      id: 'serebii',
      creditLink: 'https://www.serebii.net/',
    },
    {
      name: 'Pokemon Showdown - SV',
      id: 'sv',
      creditLink: 'https://github.com/smogon/sprites',
    },
    {
      name: 'Pokemon Showdown - BW',
      id: 'bw',
      creditLink: 'https://github.com/smogon/sprites',
    },
    {
      name: 'Pokemon Showdown - AFD',
      id: 'afd',
      creditLink: 'https://github.com/smogon/sprites',
    },
    {
      name: 'Pokemon Showdown - Animated',
      id: 'ani',
      creditLink: 'https://github.com/smogon/sprites',
    },
    {
      name: 'PMD Sprite Project',
      id: 'pmd',
      creditLink: 'https://sprites.pmdcollab.org/#/Contributors',
    },
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

  getCreditLink() {
    const value: string | null = this.settingsForm.get('spriteSet')?.value;
    return this.spriteSets.find((set) => set.id === value)?.creditLink ?? '';
  }
}
