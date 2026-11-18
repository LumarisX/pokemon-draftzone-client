import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  ChatReportsListComponent,
  ChatReportsSource,
} from '@pdz/features/league-zone/chat-reports/chat-reports-list.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { AdminNavComponent } from '../admin-nav.component';
import { AdminService } from '../admin.service';

@Component({
  selector: 'pdz-admin-chat-reports',
  imports: [
    AdminNavComponent,
    ChatReportsListComponent,
    PageComponent,
    PageHeaderComponent,
  ],
  template: `
    <pdz-page type="detail">
      <pdz-page-header
        title="Chat Reports"
        eyebrow="Admin"
        subtitle="Reports about a tournament's own organizers. The organizers do not see these."
      >
        <pdz-admin-nav />
      </pdz-page-header>
      <pdz-chat-reports-list [source]="source" />
    </pdz-page>
  `,
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminChatReportsComponent {
  private readonly admin = inject(AdminService);

  protected readonly source: ChatReportsSource = {
    load: () => this.admin.getChatReports(),
    resolve: (reportId, action) => this.admin.resolveChatReport(reportId, action),
  };
}
