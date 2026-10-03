import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ChipComponent, ChipTone } from '@pdz/shared/data/chip/chip.component';
import { CHANGELOG, ChangelogEntry } from './changelog.data';

const CATEGORY_TONES: Record<string, ChipTone> = {
  added: 'success',
  changed: 'info',
  fixed: 'warning',
  removed: 'danger',
};

@Component({
  selector: 'pdz-changelog-core',
  imports: [ChipComponent, TitleCasePipe],
  templateUrl: './changelog-core.component.html',
  styleUrl: './changelog-core.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChangelogCoreComponent {
  readonly changelog: ChangelogEntry[] = CHANGELOG;

  private readonly dateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return this.dateFormatter.format(date);
  }

  tone(type: string): ChipTone {
    return CATEGORY_TONES[type] ?? 'neutral';
  }
}
