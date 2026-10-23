import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
  signal,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DIALOG_DATA } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TierListLegality } from '../tier-list.model';
import { TierListService } from '../tier-list.service';

export type LegalityDialogData = { slug: string };

@Component({
  selector: 'pdz-tier-list-legality',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, EmptyStateComponent, IconComponent, PokemonComponent, SkeletonLayoutComponent],
  templateUrl: './tier-list-legality.component.html',
  styleUrl: './tier-list-legality.component.scss',
})
export class TierListLegalityComponent implements OnInit {
  private readonly tierLists = inject(TierListService);
  private readonly dialogData = inject<LegalityDialogData | null>(DIALOG_DATA, { optional: true });

  readonly report = input<TierListLegality | null>(null);

  protected readonly loaded = signal<TierListLegality | null>(null);
  protected readonly failed = signal(false);
  protected readonly showLeftOff = signal(false);

  protected readonly current = computed(() => this.report() ?? this.loaded());

  protected readonly unusedBans = computed(() => {
    const report = this.current();
    return report
      ? [...report.unusedBans.moves, ...report.unusedBans.abilities].join(', ')
      : '';
  });

  protected readonly leftOffNames = computed(
    () => this.current()?.leftOff.map((pokemon) => pokemon.name).join(', ') ?? '',
  );

  protected readonly clean = computed(() => {
    const report = this.current();
    return (
      !!report &&
      !report.notInRuleset.length &&
      !report.unusedBans.moves.length &&
      !report.unusedBans.abilities.length &&
      !report.emptyTiers.length &&
      !report.unpricedTiers.length
    );
  });

  ngOnInit(): void {
    if (this.dialogData?.slug && !this.report()) this.load();
  }

  protected load(): void {
    this.failed.set(false);
    this.tierLists.legality(this.dialogData!.slug).subscribe({
      next: (report) => this.loaded.set(report),
      error: () => this.failed.set(true),
    });
  }
}
