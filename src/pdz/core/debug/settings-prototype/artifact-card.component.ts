import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { ArtifactSlot } from './settings-schema';
import { SettingsWorkbenchStore } from './settings-workbench.store';

interface Fact {
  label: string;
  value: string;
}

@Component({
  selector: 'pdz-artifact-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent, RouterLink],
  templateUrl: './artifact-card.component.html',
  styleUrl: './artifact-card.component.scss',
})
export class ArtifactCardComponent {
  readonly slot = input.required<ArtifactSlot>();
  readonly locked = input(false);

  private readonly store = inject(SettingsWorkbenchStore);

  protected readonly route = computed(() =>
    this.slot() === 'tier-list' ? ['tier-list'] : ['schedule'],
  );

  protected readonly icon = computed(() =>
    this.slot() === 'tier-list' ? 'format_list_numbered' : 'calendar_month',
  );

  protected readonly present = computed(() => {
    const artifacts = this.store.artifacts();
    return this.slot() === 'tier-list'
      ? artifacts.tierList.name !== null
      : artifacts.schedule.matchupCount > 0;
  });

  protected readonly headline = computed(() => {
    const artifacts = this.store.artifacts();
    if (this.slot() === 'tier-list') {
      return artifacts.tierList.name ?? 'No tier list yet';
    }
    return artifacts.schedule.matchupCount > 0
      ? `${artifacts.schedule.stageCount} stages`
      : 'No schedule yet';
  });

  protected readonly blurb = computed(() =>
    this.slot() === 'tier-list'
      ? 'Attach a published list or build your own. The format, ruleset and every cost come from here.'
      : 'Stages, rounds and matchups. Teams cannot play until this exists.',
  );

  protected readonly facts = computed<Fact[]>(() => {
    const artifacts = this.store.artifacts();
    if (!this.present()) return [];

    if (this.slot() === 'tier-list') {
      return [
        { label: 'Format', value: artifacts.tierList.format },
        { label: 'Ruleset', value: artifacts.tierList.ruleset },
        { label: 'Pokémon', value: `${artifacts.tierList.pokemonCount}` },
        { label: 'Tiers', value: `${artifacts.tierList.tiers.length}` },
      ];
    }

    return [
      { label: 'Stages', value: `${artifacts.schedule.stageCount}` },
      { label: 'Rounds', value: `${artifacts.schedule.roundCount}` },
      { label: 'Matchups', value: `${artifacts.schedule.matchupCount}` },
    ];
  });

  protected readonly primaryLabel = computed(() => {
    if (this.present()) {
      return this.slot() === 'tier-list'
        ? 'Edit tier list'
        : 'Open schedule builder';
    }
    return this.slot() === 'tier-list'
      ? 'Build a tier list'
      : 'Build the schedule';
  });

  protected readonly lockedLabel = computed(() =>
    this.slot() === 'tier-list' ? 'View tier list' : 'View schedule',
  );
}
