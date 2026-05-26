import { Component } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { CHANGELOG, ChangelogEntry } from './changelog.data';

@Component({
  selector: 'pdz-changelog-core',
  imports: [TitleCasePipe],
  templateUrl: './changelog-core.component.html',
  styleUrl: './changelog-core.component.scss',
})
export class ChangelogCoreComponent {
  readonly changelog: ChangelogEntry[] = CHANGELOG;
  private readonly laDateFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    month: '2-digit',
    day: '2-digit',
    year: 'numeric',
  });

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return this.laDateFormatter.format(date);
  }
}
