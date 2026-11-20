import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { safeStorage } from '@pdz/core/utils/storage';
import { DraftPokemon } from '@pdz/features/drafts/draft.model';
import { Settings, SettingsService } from '@pdz/layout/top-navbar/settings.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteComponent } from '@pdz/shared/images/sprite/sprite.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { EMPTY, catchError, debounceTime, switchMap, tap } from 'rxjs';

type ThemeOption = { id: string; name: string; team1: string; team2: string };

const SAVE_DELAY_MS = 600;

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
  selector: 'pdz-appearance-settings',
  imports: [
    ReactiveFormsModule,
    ButtonComponent,
    CheckComponent,
    ChoiceDirective,
    FieldComponent,
    IconComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SelectComponent,
    SelectOptionComponent,
    SpriteComponent,
  ],
  templateUrl: './appearance-settings.component.html',
  styleUrl: './appearance-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppearanceSettingsComponent {
  private readonly settingsService = inject(SettingsService);

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

  private readonly initial: Settings = this.settingsService.settingsData ?? {};

  protected readonly settingsForm = inject(FormBuilder).nonNullable.group({
    theme: this.initial.theme || 'classic',
    ldMode: this.initial.ldMode || 'device',
    spriteSet: this.initial.spriteSet || 'home',
  });

  protected readonly spriteSet = toSignal(
    this.settingsForm.controls.spriteSet.valueChanges,
    { initialValue: this.settingsForm.controls.spriteSet.value },
  );

  protected readonly saveError = signal<string | null>(null);

  constructor() {
    this.settingsForm.valueChanges
      .pipe(
        tap((value) => {
          this.saveError.set(null);
          this.settingsService.setSettings(value);
        }),
        debounceTime(SAVE_DELAY_MS),
        switchMap(() =>
          this.settingsService.saveToServer().pipe(
            catchError((err) => {
              this.saveError.set(
                apiErrorMessage(err, 'Could not save your appearance.'),
              );
              return EMPTY;
            }),
          ),
        ),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  protected swatch(hue: string): string {
    return `var(--pdz-color-${hue}-450)`;
  }

  protected creditLink(): string {
    return (
      this.spriteSets.find((set) => set.id === this.spriteSet())?.creditLink ??
      ''
    );
  }

  private isShinyUnlocked(): boolean {
    return (
      !!safeStorage.get('shinyunlocked') ||
      !!this.settingsService.settingsData.shinyUnlock
    );
  }
}
