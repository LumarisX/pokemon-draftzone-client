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
}
