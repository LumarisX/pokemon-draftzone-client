import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import {
  ChatReportsListComponent,
  ChatReportsSource,
} from './chat-reports-list.component';

@Component({
  selector: 'pdz-chat-reports-page',
  imports: [ChatReportsListComponent, PageComponent, PageHeaderComponent],
  template: `
    <pdz-page type="detail">
      <pdz-page-header
        title="Reports"
        subtitle="Chat messages that people in this tournament have reported. A report stays here until you dismiss it or remove the message."
      />
      <pdz-chat-reports-list [source]="source" />
    </pdz-page>
  `,
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatReportsPageComponent {
  private readonly service = inject(LeagueZoneService);

  protected readonly source: ChatReportsSource = {
    load: () => this.service.getChatReports(),
    resolve: (reportId, action) =>
      this.service.resolveChatReport(reportId, action),
  };
}
