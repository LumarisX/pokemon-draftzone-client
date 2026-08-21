import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { DialogRef } from '@pdz/shared/dialogs/dialog/dialog.service';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { Settings, SettingsService } from '../settings.service';

@Component({
  selector: 'pdz-settings-dialog',
  imports: [
    NgClass,
    ReactiveFormsModule,
    ButtonComponent,
    FieldComponent,
    IconComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SelectComponent,
    SelectOptionComponent,
    SpriteComponent,
  ],
  templateUrl: './settings-dialog.component.html',
  styleUrl: './settings-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsDialogComponent implements OnDestroy {
  private readonly settingsService = inject(SettingsService);
  private readonly fb = inject(FormBuilder);
  protected readonly ref = inject(DialogRef) as DialogRef<void>;

  protected readonly example: DraftPokemon = {
    id: 'deoxysattack',
    name: 'Deoxys-Attack',
  };

  protected readonly themes: { id: string; name: string }[] = [
    { id: 'classic', name: 'Classic' },
    { id: 'sunset', name: 'Sunset' },
    { id: 'fern', name: 'Fern' },
    { id: 'classic-reverse', name: 'Classic Reversed' },
    ...(this.isShinyUnlocked() ? [{ id: 'shiny', name: 'Shiny' }] : []),
  ];

  protected readonly spriteSets: {
    name: string;
    id: string;
    creditLink: string;
  }[] = [
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
    {
      name: 'PokeAPI - Official Artwork',
      id: 'pokeapi',
      creditLink: 'https://github.com/PokeAPI/sprites',
    },
  ];

  private orgSettings: Settings = JSON.parse(
    JSON.stringify(this.settingsService.settingsData || {}),
  );

  protected readonly settingsForm = this.fb.group({
    theme: this.orgSettings.theme || 'classic',
    ldMode: this.orgSettings.ldMode || 'device',
    spriteSet: this.orgSettings.spriteSet || 'home',
  });

  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  constructor() {
    this.settingsForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value: Settings) => {
        this.settingsService.setSettings(value, { source: 'local' });
      });

    this.settingsForm.controls.ldMode.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => {
        if (value) this.settingsService.updateLDMode(value);
      });
  }

  ngOnDestroy(): void {
    this.settingsService.setSettings(this.orgSettings, { source: 'local' });
  }

  protected isShinyUnlocked() {
    return (
      localStorage.getItem('shinyunlocked') ||
      this.settingsService.settingsData.shinyUnlock
    );
  }

  protected selectTheme(themeId: string) {
    this.settingsForm.controls.theme.setValue(themeId);
  }

  protected getCreditLink() {
    const value = this.settingsForm.controls.spriteSet.value;
    return this.spriteSets.find((set) => set.id === value)?.creditLink ?? '';
  }

  protected save() {
    this.saveError.set(null);
    this.saving.set(true);
    const newSettings = this.settingsForm.value as Settings;
    this.orgSettings = JSON.parse(JSON.stringify(newSettings));

    this.settingsService.setSettings(newSettings, { source: 'local' });

    this.settingsService.saveToServer().subscribe({
      next: (resp) => {
        this.saving.set(false);
        if (resp) {
          try {
            this.settingsService.setSettings(resp as Settings, {
              source: 'server',
            });
            this.orgSettings = JSON.parse(JSON.stringify(resp));
          } catch (e) {}
        }
        this.ref.close();
      },
      error: (err) => {
        this.saving.set(false);
        this.saveError.set('Failed to save settings. Please try again.');
        console.error('Settings save failed', err);
      },
    });
  }
}
