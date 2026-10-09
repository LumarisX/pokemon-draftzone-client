import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { safeStorage } from '@pdz/core/utils/storage';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { DialogRef } from '@pdz/shared/dialogs/dialog/dialog.service';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { Settings, SettingsService } from '@pdz/layout/top-navbar/settings.service';

type ThemeOption = { id: string; name: string; team1: string; team2: string };

const SPRITE_SETS = [
  {
    name: 'Pokemon Showdown - Home',
    id: 'home',
    creditLink: 'https://github.com/smogon/sprites',
  },
  { name: 'Serebii', id: 'serebii', creditLink: 'https://www.serebii.net/' },
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

@Component({
  selector: 'pdz-settings-dialog',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    CardComponent,
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
export class SettingsDialogComponent {
  private readonly settingsService = inject(SettingsService);
  protected readonly ref = inject(DialogRef) as DialogRef<void>;

  protected readonly example: DraftPokemon = {
    id: 'deoxysattack',
    name: 'Deoxys-Attack',
  };

  protected readonly spriteSets = SPRITE_SETS;

  protected readonly themes: ThemeOption[] = [
    { id: 'classic', name: 'Classic', team1: 'cyan', team2: 'orange' },
    { id: 'sunset', name: 'Sunset', team1: 'purple', team2: 'pink' },
    { id: 'fern', name: 'Fern', team1: 'jade', team2: 'blue' },
    {
      id: 'classic-reverse',
      name: 'Classic Reversed',
      team1: 'orange',
      team2: 'cyan',
    },
    ...(this.isShinyUnlocked()
      ? [{ id: 'shiny', name: 'Shiny', team1: 'mint', team2: 'yellow' }]
      : []),
  ];

  private original: Settings = structuredClone(
    this.settingsService.settingsData ?? {},
  );

  protected readonly settingsForm = inject(FormBuilder).nonNullable.group({
    theme: this.original.theme || 'classic',
    ldMode: this.original.ldMode || 'device',
    spriteSet: this.original.spriteSet || 'home',
  });

  protected readonly theme = toSignal(
    this.settingsForm.controls.theme.valueChanges,
    { initialValue: this.settingsForm.controls.theme.value },
  );
  protected readonly spriteSet = toSignal(
    this.settingsForm.controls.spriteSet.valueChanges,
    { initialValue: this.settingsForm.controls.spriteSet.value },
  );

  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);

  constructor() {
    this.settingsForm.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((value) => this.settingsService.setSettings(value));

    inject(DestroyRef).onDestroy(() => {
      this.settingsService.setSettings(this.original);
    });
  }

  protected swatch(hue: string): string {
    return `var(--pdz-color-${hue}-450)`;
  }

  protected selectTheme(themeId: string) {
    this.settingsForm.controls.theme.setValue(themeId);
  }

  protected creditLink(): string {
    return (
      this.spriteSets.find((set) => set.id === this.spriteSet())?.creditLink ??
      ''
    );
  }

  protected save() {
    this.saveError.set(null);
    this.saving.set(true);
    const next = this.settingsForm.getRawValue() as Settings;
    this.original = structuredClone(next);
    this.settingsService.setSettings(next);

    this.settingsService.saveToServer().subscribe({
      next: (response) => {
        this.saving.set(false);
        if (response) {
          this.settingsService.setSettings(response as Settings);
          this.original = structuredClone(response as Settings);
        }
        this.ref.close();
      },
      error: () => {
        this.saving.set(false);
        this.saveError.set('Failed to save settings. Please try again.');
      },
    });
  }

  private isShinyUnlocked(): boolean {
    return (
      !!safeStorage.get('shinyunlocked') ||
      !!this.settingsService.settingsData.shinyUnlock
    );
  }
}
