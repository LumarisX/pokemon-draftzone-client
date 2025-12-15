import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  inject,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { SpriteComponent } from '../../images/sprite/sprite.component';
import { Pokemon } from '../../interfaces/draft';
import { Settings, SettingsService } from './settings.service';
@Component({
  selector: 'settings',
  imports: [CommonModule, ReactiveFormsModule, SpriteComponent],
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
    { id: 'sunset', name: 'Sunset' },
  ];

  dropdownOpen: null | 'theme' | 'ld' | 'sprite' = null;

  getThemeClass(themeId?: string | null) {
    switch (themeId) {
      case 'sunset':
        return 'sunset';
      case 'shiny':
        return 'shiny';
      case 'classic':
      default:
        return 'classic';
    }
  }

  getThemeName(themeId?: string | null) {
    if (!themeId) return 'Classic';
    if (themeId === 'shiny') return 'Shiny';
    const found = this.themes.find((t) => t.id === themeId);
    return found?.name ?? 'Theme';
  }

  toggleDropdown(dropdown: null | 'ld' | 'theme' | 'sprite') {
    this.dropdownOpen = this.dropdownOpen === dropdown ? null : dropdown;
  }

  selectLdMode(mode: 'device' | 'light' | 'dark') {
    this.settingsForm.get('ldMode')?.setValue(mode);
    this.dropdownOpen = null;
    this.settingsService.updateLDMode(mode);
  }

  getLdModeLabel(mode?: string | null) {
    switch (mode) {
      case 'light':
        return 'Light';
      case 'dark':
        return 'Dark';
      default:
        return 'Device';
    }
  }

  onLdModeKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') this.dropdownOpen = null;
  }

  selectTheme(themeId: string) {
    this.settingsForm.get('theme')?.setValue(themeId);
    this.dropdownOpen = null;
  }

  onThemeKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.dropdownOpen = null;
    }
  }

  selectSprite(id: string) {
    this.settingsForm.get('spriteSet')?.setValue(id);
    this.dropdownOpen = null;
  }

  getSpriteSetName(id?: string | null) {
    if (!id) return 'Default';
    const found = this.spriteSets.find((s) => s.id === id);
    return found?.name ?? 'Sprite';
  }

  onSpriteKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') this.dropdownOpen = null;
  }

  spriteSets: { name: string; id: string; creditLink: string }[] = [
    {
      name: 'Pokemon Showdown - Home',
      id: 'home',
      creditLink: 'https://github.com/smogon/sprites',
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
  saving = false;
  saveError: string | null = null;

  ngOnInit(): void {
    this.orgSettings = JSON.parse(
      JSON.stringify(this.settingsService.settingsData || {}),
    );
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
      this.settingsService.setSettings(value, { source: 'local' });
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
    this.settingsService.setSettings(this.orgSettings, { source: 'local' });
  }

  getCreditLink() {
    const value: string | null | undefined =
      this.settingsForm.get('spriteSet')?.value;
    return this.spriteSets.find((set) => set.id === value)?.creditLink ?? '';
  }

  save() {
    this.saveError = null;
    this.saving = true;
    const newSettings = this.settingsForm.value as Settings;
    this.orgSettings = JSON.parse(JSON.stringify(newSettings));

    this.settingsService.setSettings(newSettings, { source: 'local' });

    this.settingsService.saveToServer().subscribe({
      next: (resp) => {
        this.saving = false;
        if (resp) {
          try {
            this.settingsService.setSettings(resp as Settings, {
              source: 'server',
            });
          } catch (e) {}
        }
      },
      error: (err) => {
        this.saving = false;
        this.saveError = 'Failed to save settings. Please try again.';
        console.error('Settings save failed', err);
      },
    });
  }

  close() {
    this.closeSettings.emit();
  }
}
