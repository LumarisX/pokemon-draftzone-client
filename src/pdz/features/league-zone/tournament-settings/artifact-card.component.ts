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
import { LeagueZoneService } from '../league-zone.service';
import { ArtifactSlot, ArtifactState } from './settings-schema';
import { TournamentSettingsStore } from './tournament-settings.store';

interface Fact {
  label: string;
  value: string;
}

interface ArtifactSpec {
  icon: string;
  path: (base: string[]) => string[];
  blurb: string;
  present: (artifacts: ArtifactState) => boolean;
  headline: (artifacts: ArtifactState) => string;
  facts: (artifacts: ArtifactState) => Fact[];
  emptyLabel: string;
  editLabel: string;
  viewLabel: string;
}

const SPECS: Record<ArtifactSlot, ArtifactSpec> = {
  'tier-list': {
    icon: 'format_list_numbered',
    path: (base) => [...base, 'tier-list', 'edit'],
    blurb:
      'Attach a published list or build your own. The format, ruleset and every cost come from here.',
    present: (a) => a.tierList.name !== null,
    headline: (a) => a.tierList.name ?? 'No tier list yet',
    facts: (a) => [
      { label: 'Format', value: a.tierList.format },
      { label: 'Ruleset', value: a.tierList.ruleset },
      { label: 'Pokémon', value: `${a.tierList.pokemonCount}` },
      { label: 'Tiers', value: `${a.tierList.tiers.length}` },
    ],
    emptyLabel: 'Build a tier list',
    editLabel: 'Edit tier list',
    viewLabel: 'View tier list',
  },
  schedule: {
    icon: 'calendar_month',
    path: (base) => [...base, 'manage', 'schedule'],
    blurb:
      'Stages, rounds and matchups. Teams cannot play until this exists.',
    present: (a) => a.schedule.matchupCount > 0,
    headline: (a) =>
      a.schedule.matchupCount > 0
        ? `${a.schedule.stageCount} stages`
        : 'No schedule yet',
    facts: (a) => [
      { label: 'Stages', value: `${a.schedule.stageCount}` },
      { label: 'Rounds', value: `${a.schedule.roundCount}` },
      { label: 'Matchups', value: `${a.schedule.matchupCount}` },
    ],
    emptyLabel: 'Build the schedule',
    editLabel: 'Open schedule builder',
    viewLabel: 'View schedule',
  },
  rules: {
    icon: 'menu_book',
    path: (base) => [...base, 'manage', 'rules'],
    blurb:
      'What coaches agree to when they sign up. Published on the tournament page.',
    present: (a) => a.rules.sectionCount > 0,
    headline: (a) =>
      a.rules.sectionCount > 0
        ? `${a.rules.sectionCount} ${a.rules.sectionCount === 1 ? 'section' : 'sections'}`
        : 'No rules yet',
    facts: (a) => [
      { label: 'Sections', value: `${a.rules.sectionCount}` },
      { label: 'Words', value: `${a.rules.wordCount}` },
    ],
    emptyLabel: 'Write the rules',
    editLabel: 'Edit rules',
    viewLabel: 'View rules',
  },
};

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

  private readonly store = inject(TournamentSettingsStore);
  private readonly league = inject(LeagueZoneService);

  private readonly spec = computed(() => SPECS[this.slot()]);

  protected readonly route = computed(() => {
    const leagueSlug = this.league.leagueSlug();
    const tournamentSlug = this.league.tournamentSlug();
    if (!leagueSlug || !tournamentSlug) return [];
    return this.spec().path([
      '/leagues',
      leagueSlug,
      'tournaments',
      tournamentSlug,
    ]);
  });

  protected readonly icon = computed(() => this.spec().icon);
  protected readonly blurb = computed(() => this.spec().blurb);

  protected readonly present = computed(() =>
    this.spec().present(this.store.artifacts()),
  );

  protected readonly headline = computed(() =>
    this.spec().headline(this.store.artifacts()),
  );

  protected readonly facts = computed<Fact[]>(() =>
    this.present() ? this.spec().facts(this.store.artifacts()) : [],
  );

  protected readonly primaryLabel = computed(() =>
    this.present() ? this.spec().editLabel : this.spec().emptyLabel,
  );

  protected readonly lockedLabel = computed(() => this.spec().viewLabel);
}
