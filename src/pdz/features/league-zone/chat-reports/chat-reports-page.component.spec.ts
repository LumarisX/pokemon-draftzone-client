import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiError } from '@pdz/core/services/api-error';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { Observable, of, throwError } from 'rxjs';
import { LeagueZoneService } from '../league-zone.service';
import { ChatReport } from '../league-chat/league-chat.model';
import { ChatReportsPageComponent } from './chat-reports-page.component';

function report(overrides: Partial<ChatReport>): ChatReport {
  return {
    id: 'r1',
    messageId: 'm1',
    channel: 'matchup',
    reason: 'Slurs',
    createdAt: '2026-11-15T12:00:00.000Z',
    reporter: { name: 'Misty', profileId: 'a1b2c3d4e5f6a1b2c3d4e5f6' },
    author: { name: 'Gary' },
    text: 'Bad words',
    messageExists: true,
    ...overrides,
  };
}

describe('ChatReportsPageComponent', () => {
  let service: { getChatReports: jest.Mock; resolveChatReport: jest.Mock };
  let confirm: jest.Mock;
  let toast: { error: jest.Mock };

  function render(
    list: Observable<{ reports: ChatReport[] }>,
    confirmed = true,
  ) {
    service = {
      getChatReports: jest.fn(() => list),
      resolveChatReport: jest.fn(() => of({ resolved: true })),
    };
    confirm = jest.fn().mockResolvedValue(confirmed);
    toast = { error: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: LeagueZoneService, useValue: service },
        { provide: DialogService, useValue: { confirm } },
        { provide: ToastService, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(ChatReportsPageComponent);
    fixture.detectChanges();
    return fixture;
  }

  function rows(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll('pdz-chat-report-row'));
  }

  function press(row: HTMLElement, label: string) {
    const buttons = Array.from(row.querySelectorAll('button'));
    buttons.find((b) => b.textContent?.includes(label))?.click();
  }

  it('lists reports with both people, reason and message', () => {
    const fixture = render(
      of({ reports: [report({ id: 'r1' }), report({ id: 'r2', messageId: 'm2' })] }),
    );
    const list = rows(fixture.nativeElement);
    expect(list).toHaveLength(2);
    const text = list[0].textContent ?? '';
    expect(text).toContain('Match chat');
    expect(text).toContain('Misty');
    expect(
      list[0].querySelector('a.report__name')?.getAttribute('href'),
    ).toBe('/profile/a1b2c3d4e5f6a1b2c3d4e5f6');
    expect(text).toContain('Gary');
    expect(text).toContain('Slurs');
    expect(text).toContain('Bad words');
  });

  it('marks a message that was already deleted', () => {
    const fixture = render(
      of({ reports: [report({ messageExists: false })] }),
    );
    expect(fixture.nativeElement.textContent).toContain(
      'This message was already deleted.',
    );
  });

  it('dismisses without a confirm and drops only that row', async () => {
    const fixture = render(
      of({
        reports: [report({ id: 'r1' }), report({ id: 'r2', messageId: 'm1' })],
      }),
    );
    press(rows(fixture.nativeElement)[0], 'Dismiss');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(confirm).not.toHaveBeenCalled();
    expect(service.resolveChatReport).toHaveBeenCalledWith('r1', 'dismiss');
    expect(rows(fixture.nativeElement)).toHaveLength(1);
  });

  it('removes after a danger confirm and drops every row about that message', async () => {
    const fixture = render(
      of({
        reports: [
          report({ id: 'r1', messageId: 'm1' }),
          report({ id: 'r2', messageId: 'm1' }),
          report({ id: 'r3', messageId: 'm2' }),
        ],
      }),
    );
    press(rows(fixture.nativeElement)[0], 'Remove Message');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(confirm).toHaveBeenCalledWith(
      'Remove Message',
      expect.objectContaining({ confirmColor: 'danger' }),
    );
    expect(service.resolveChatReport).toHaveBeenCalledWith('r1', 'remove');
    const left = rows(fixture.nativeElement);
    expect(left).toHaveLength(1);
    expect(left[0].textContent).toContain('Slurs');
  });

  it('keeps the row when the confirm is cancelled', async () => {
    const fixture = render(of({ reports: [report({})] }), false);
    press(rows(fixture.nativeElement)[0], 'Remove Message');
    await fixture.whenStable();
    fixture.detectChanges();
    expect(service.resolveChatReport).not.toHaveBeenCalled();
    expect(rows(fixture.nativeElement)).toHaveLength(1);
  });

  it('shows the empty state', () => {
    const fixture = render(of({ reports: [] }));
    expect(fixture.nativeElement.textContent).toContain('No open reports');
    expect(rows(fixture.nativeElement)).toHaveLength(0);
  });

  it('shows an error state that can retry', () => {
    const fixture = render(
      throwError(
        () =>
          new ApiError(
            new HttpErrorResponse({ status: 500, statusText: 'Server Error' }),
          ),
      ),
    );
    expect(fixture.nativeElement.textContent).toContain(
      'Could not load reports',
    );
    expect(fixture.nativeElement.textContent).toContain('Try Again');
  });
});
