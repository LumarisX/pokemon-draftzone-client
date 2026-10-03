import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UnreadService } from '@pdz/features/pages/homepage/unread.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { MarkdownModule } from 'ngx-markdown';
import { NEWS } from './news.data';

const LA_DATE = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/Los_Angeles',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
});

@Component({
  selector: 'pdz-news-core',
  imports: [NgTemplateOutlet, RouterLink, MarkdownModule, ButtonComponent],
  templateUrl: './news-core.component.html',
  styleUrl: './news-core.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsCoreComponent {
  readonly news = NEWS;

  constructor() {
    inject(UnreadService).markNewsRead();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return Number.isNaN(date.getTime()) ? dateString : LA_DATE.format(date);
  }
}
