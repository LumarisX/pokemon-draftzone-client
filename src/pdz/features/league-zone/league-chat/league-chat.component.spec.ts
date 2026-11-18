import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '@pdz/core/services/auth0.service';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { of } from 'rxjs';
import { LeagueZoneService } from '../league-zone.service';
import { LeagueChatComponent } from './league-chat.component';
import { ChatMessage } from './league-chat.model';
import { ReportMessageDialogComponent } from './report-message-dialog.component';

function message(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    id: 'm1',
    author: 'Misty',
    authorProfileId: 'a1b2c3d4e5f6a1b2c3d4e5f6',
    role: 'coach',
    text: 'Hello there',
    createdAt: '2026-11-15T12:00:00.000Z',
    isViewer: false,
    canDelete: false,
    ...overrides,
  };
}

describe('LeagueChatComponent', () => {
  let open: jest.Mock;

  function render(messages: ChatMessage[], signedIn: boolean) {
    open = jest.fn();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { isAuthenticated$: of(signedIn) } },
        { provide: DialogService, useValue: { open } },
        {
          provide: LeagueZoneService,
          useValue: {
            getChatMessages: () =>
              of({ channel: 'matchup', canPost: false, messages }),
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(LeagueChatComponent);
    fixture.componentRef.setInput('channel', 'matchup');
    fixture.detectChanges();
    return fixture;
  }

  function reportItems(root: HTMLElement): HTMLElement[] {
    return Array.from(root.querySelectorAll('.pdz-menu-item')).filter(
      (item) =>
        item.querySelector('.pdz-menu-item__label')?.textContent?.trim() ===
        'Report',
    ) as HTMLElement[];
  }

  it('links an author to their profile when the message has an id', () => {
    const fixture = render(
      [
        message({ id: 'm1', author: 'Misty' }),
        message({ id: 'm2', author: 'Brock', authorProfileId: undefined }),
      ],
      true,
    );
    const links = Array.from(
      fixture.nativeElement.querySelectorAll('.chat__meta a.chat__author'),
    ).map((element) => (element as HTMLElement).getAttribute('href'));
    expect(links).toEqual(['/profile/a1b2c3d4e5f6a1b2c3d4e5f6']);
  });

  it('offers Report on other people messages when signed in', () => {
    const fixture = render([message({ id: 'm1' })], true);
    expect(reportItems(fixture.nativeElement)).toHaveLength(1);
  });

  it('offers no Report on your own message', () => {
    const fixture = render([message({ id: 'm1', isViewer: true })], true);
    expect(reportItems(fixture.nativeElement)).toHaveLength(0);
  });

  it('offers no Report to a signed-out reader', () => {
    const fixture = render([message({ id: 'm1' })], false);
    expect(reportItems(fixture.nativeElement)).toHaveLength(0);
  });

  it('opens the report dialog with the message', () => {
    const fixture = render([message({ id: 'm9', text: 'Rude words' })], true);
    reportItems(fixture.nativeElement)[0].click();
    expect(open).toHaveBeenCalledWith(
      ReportMessageDialogComponent,
      expect.objectContaining({
        data: { messageId: 'm9', text: 'Rude words' },
      }),
    );
  });
});
