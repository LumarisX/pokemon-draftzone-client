import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  AchievementBadgeComponent,
  RARITY_LABELS,
  RARITY_ORDER,
} from '@pdz/shared/data/achievement/achievement-badge.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { TeamLogoComponent } from '@pdz/shared/images/team-logo/team-logo.component';
import { League } from '../league.interface';
import { getTeamLogoSrc } from '../league.util';

const HOLDERS_SHOWN = 3;

const rank = (rarity: League.AchievementRarity) => RARITY_ORDER.indexOf(rarity);

@Component({
  selector: 'pdz-achievement-wall',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    AchievementBadgeComponent,
    CardComponent,
    EmptyStateComponent,
    SelectComponent,
    SelectOptionComponent,
    TeamLogoComponent,
  ],
  templateUrl: './achievement-wall.component.html',
  styleUrl: './achievement-wall.component.scss',
})
export class AchievementWallComponent {
  readonly catalog = input.required<League.AchievementDefinition[]>();
  readonly earned = input.required<League.EarnedAchievement[]>();
  readonly leagueLink = input.required<readonly string[]>();

  protected readonly season = signal('');
  protected readonly rarityLabels = RARITY_LABELS;

  protected readonly seasons = computed(() => {
    const seen = new Map<string, string>();
    for (const entry of this.earned())
      seen.set(entry.tournamentSlug, entry.tournamentName);
    return [...seen].map(([slug, name]) => ({ slug, name }));
  });

  private readonly filtered = computed(() => {
    const season = this.season();
    return season
      ? this.earned().filter((entry) => entry.tournamentSlug === season)
      : this.earned();
  });

  protected readonly tiles = computed(() => {
    const earned = this.filtered();
    return this.catalog()
      .map((definition) => {
        const holders = earned
          .filter((entry) => entry.achievementId === definition.id)
          .sort(
            (a, b) =>
              rank(b.rarity) - rank(a.rarity) ||
              (a.earnedAt ?? '').localeCompare(b.earnedAt ?? ''),
          );
        const top = holders[0]?.rarity ?? null;
        return {
          definition,
          top,
          tiers: definition.tiers.map((tier) => ({
            ...tier,
            holders: holders.filter((entry) => rank(entry.rarity) >= rank(tier.rarity))
              .length,
          })),
          holders: holders.slice(0, HOLDERS_SHOWN).map((entry) => ({
            ...entry,
            logoSrc: getTeamLogoSrc(entry.team.logo),
            link: [
              ...this.leagueLink(),
              'tournaments',
              entry.tournamentSlug,
              'teams',
              entry.team.teamSlug,
            ],
          })),
          more: Math.max(0, holders.length - HOLDERS_SHOWN),
          total: holders.length,
        };
      })
      .filter((tile) => tile.total || !tile.definition.hidden)
      .sort((a, b) => {
        if (!a.top || !b.top) return a.top ? -1 : b.top ? 1 : 0;
        return rank(b.top) - rank(a.top) || a.total - b.total;
      });
  });

  protected readonly earnedCount = computed(
    () => this.tiles().filter((tile) => tile.top).length,
  );
}
