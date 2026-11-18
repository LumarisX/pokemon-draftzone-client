import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { of } from 'rxjs';
import { ChatReport } from '@pdz/features/league-zone/league-chat/league-chat.model';
import { AdminService } from '../admin.service';
import { AdminChatReportsComponent } from './admin-chat-reports.component';

const REPORT: ChatReport = {
  id: 'r1',
  messageId: 'm1',
  channel: 'tournament',
  reason: 'Threats',
  createdAt: '2026-11-15T12:00:00.000Z',
  reporter: { name: 'Misty', profileId: 'a1b2c3d4e5f6a1b2c3d4e5f6' },
  author: { name: 'Oak', profileId: 'b1b2c3d4e5f6a1b2c3d4e5f6' },
  text: 'Bad words',
  messageExists: true,
  league: { name: 'Kanto League', slug: 'kanto' },
  tournament: { name: 'Spring Cup', slug: 'spring' },
};

describe('AdminChatReportsComponent', () => {
  let admin: { getChatReports: jest.Mock; resolveChatReport: jest.Mock };

  function render() {
    admin = {
      getChatReports: jest.fn(() => of({ reports: [REPORT] })),
      resolveChatReport: jest.fn(() => of({ resolved: true })),
    };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AdminService, useValue: admin },
        {
          provide: DialogService,
          useValue: { confirm: jest.fn().mockResolvedValue(true) },
        },
        { provide: ToastService, useValue: { error: jest.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(AdminChatReportsComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('lists escalated reports with the league and tournament linked', () => {
    const fixture = render();
    const link = fixture.nativeElement.querySelector(
      'pdz-chat-report-row a.report__where',
    ) as HTMLAnchorElement;
    expect(link.textContent).toContain('Kanto League');
    expect(link.textContent).toContain('Spring Cup');
    expect(link.getAttribute('href')).toBe(
      '/leagues/kanto/tournaments/spring',
    );
    expect(fixture.nativeElement.textContent).toContain('Oak');
  });

  it('resolves through the admin endpoints', async () => {
    const fixture = render();
    const dismiss = Array.from(
      fixture.nativeElement.querySelectorAll('pdz-chat-report-row button'),
    ).find((b) => (b as HTMLElement).textContent?.includes('Dismiss')) as HTMLElement;
    dismiss.click();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(admin.resolveChatReport).toHaveBeenCalledWith('r1', 'dismiss');
    expect(
      fixture.nativeElement.querySelectorAll('pdz-chat-report-row'),
    ).toHaveLength(0);
  });
});
