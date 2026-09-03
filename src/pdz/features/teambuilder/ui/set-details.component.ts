import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TERATYPES, toID } from '@pdz/sets';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { SlideToggleComponent } from '@pdz/shared/inputs/slide-toggle/slide-toggle.component';
import { TeamStore } from '../state/team-store';

@Component({
  selector: 'pdz-set-details',
  templateUrl: './set-details.component.html',
  styleUrl: './set-details.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    FieldComponent,
    InputDirective,
    SelectComponent,
    SelectOptionComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SlideToggleComponent,
  ],
})
export class SetDetailsComponent {
  protected readonly store = inject(TeamStore);

  protected readonly teraTypes = computed(() => {
    const forced = this.store.activeSpecies()?.teraType;
    return forced ? [forced] : [...TERATYPES];
  });

  protected readonly abilities = computed(() =>
    (this.store.activeSpecies()?.abilities ?? []).map((name) => ({
      id: toID(name),
      name,
    })),
  );

  protected readonly items = computed(
    () => this.store.activeSpecies()?.items ?? [],
  );

  protected readonly genderOptions = computed(() => {
    const genders = this.store.activeSpecies()?.genders ?? [];
    if (genders.length === 0) return [];
    if (genders.length === 1) {
      return [{ value: genders[0], icon: iconFor(genders[0]) }];
    }
    return [
      { value: 'M' as const, icon: 'male' },
      { value: 'F' as const, icon: 'female' },
    ];
  });

  protected setNickname(value: string): void {
    const nickname = value.trim();
    this.store.updateActive((set) => ({
      ...set,
      nickname: nickname || undefined,
    }));
  }

  protected setLevel(value: string): void {
    const level = Number.parseInt(value, 10);
    if (Number.isNaN(level)) return;
    this.store.updateActive((set) => ({
      ...set,
      level: Math.min(Math.max(level, 1), 100),
    }));
  }

  protected setAbility(ability: unknown): void {
    this.store.updateActive((set) => ({ ...set, ability: ability as string }));
  }

  protected setItem(item: unknown): void {
    this.store.updateActive((set) => ({
      ...set,
      item: (item as string) || undefined,
    }));
  }

  protected setTeraType(teraType: unknown): void {
    this.store.updateActive((set) => ({
      ...set,
      teraType: teraType as string,
    }));
  }

  protected setGender(gender: unknown): void {
    this.store.updateActive((set) => ({
      ...set,
      gender: (gender ?? '') as '' | 'M' | 'F',
    }));
  }

  protected setShiny(shiny: boolean): void {
    this.store.updateActive((set) => ({ ...set, shiny }));
  }

  protected setHappiness(value: string): void {
    const happiness = Number.parseInt(value, 10);
    if (Number.isNaN(happiness)) return;
    this.store.updateActive((set) => ({
      ...set,
      happiness: Math.min(Math.max(happiness, 0), 255),
    }));
  }
}

function iconFor(gender: 'M' | 'F'): string {
  return gender === 'M' ? 'male' : 'female';
}
