import { CommonModule } from '@angular/common';
import { Component, EventEmitter, OnDestroy, OnInit, Output, inject } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { Settings, SettingsService } from './settings.service';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
@Component({
  selector: 'settings',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SpriteComponent,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit, OnDestroy {
  private settingsService = inject(SettingsService);
  private fb = inject(FormBuilder);


  example: Pokemon = { id: 'deoxysattack', name: 'Deoxys-Attack' };

  @Output()
  closeSettings = new EventEmitter();
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

  settingsForm!: FormGroup<{
    theme: FormControl<string | null>;
    ldMode: FormControl<string | null>;
    spriteSet: FormControl<string | null>;
  }>;

  orgSettings!: Settings;

  ngOnInit(): void {
    this.orgSettings = { ...this.settingsService.settingsData };
    const form: FormGroup<{
      theme: FormControl<string | null>;
      ldMode: FormControl<string | null>;
      spriteSet: FormControl<string | null>;
    }> = this.fb.group({
      theme: this.orgSettings.theme || 'classic',
      ldMode: this.orgSettings.ldMode || 'device',
      spriteSet: this.orgSettings.spriteSet || 'home',
    });
    form.valueChanges.subscribe((value: Settings) => {
      this.settingsService.setSettings(value);
      this.example = { id: 'deoxysattack', name: 'Deoxys-Attack' };
    });
    form.get('ldMode')?.valueChanges.subscribe((value: string | null) => {
      if (value) this.settingsService.updateLDMode(value);
    });
    this.settingsForm = form;
  }

  isShinyUnlocked() {
    return (
      localStorage.getItem('shinyunlocked') ||
      this.settingsService.settingsData.shinyUnlock
    );
  }

  ngOnDestroy(): void {
    this.settingsService.setSettings(this.orgSettings);
  }

  getCreditLink() {
    const value: string | null | undefined =
      this.settingsForm.get('spriteSet')?.value;
    return this.spriteSets.find((set) => set.id === value)?.creditLink ?? '';
  }

  save() {
    this.orgSettings = this.settingsForm.value;
    this.settingsService.setSettings(this.orgSettings);
    this.settingsService.updateSettings();
  }

  close() {
    this.closeSettings.emit();
  }
}
