import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ApiError } from '@pdz/core/services/api-error';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { of, throwError } from 'rxjs';
import { LeagueZoneService } from '../league-zone.service';
import { ReportMessageDialogComponent } from './report-message-dialog.component';

describe('ReportMessageDialogComponent', () => {
  let report: jest.Mock;
  let close: jest.Mock;
  let toast: { success: jest.Mock };

  function render() {
    close = jest.fn();
    toast = { success: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        { provide: DialogRef, useValue: { close } },
        { provide: DIALOG_DATA, useValue: { messageId: 'm1', text: 'Rude' } },
        { provide: LeagueZoneService, useValue: { reportChatMessage: report } },
        { provide: ToastService, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(ReportMessageDialogComponent);
    fixture.detectChanges();
    return fixture;
  }

  function type(fixture: ReturnType<typeof render>, value: string) {
    const textarea = fixture.nativeElement.querySelector('textarea');
    textarea.value = value;
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(fixture: ReturnType<typeof render>) {
    const buttons = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    ) as HTMLButtonElement[];
    buttons.find((b) => b.textContent?.includes('Send Report'))?.click();
    fixture.detectChanges();
  }

  it('quotes the message and caps the reason at 300 characters', () => {
    report = jest.fn();
    const fixture = render();
    expect(fixture.nativeElement.querySelector('blockquote').textContent).toContain(
      'Rude',
    );
    expect(
      fixture.nativeElement.querySelector('textarea').getAttribute('maxlength'),
    ).toBe('300');
  });

  it('requires a reason before sending', () => {
    report = jest.fn();
    const fixture = render();
    submit(fixture);
    expect(report).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain(
      'Tell the organizers what is wrong',
    );
  });

  it('posts the reason, toasts and closes', () => {
    report = jest.fn(() => of({ id: 'r1', status: 'open', createdAt: '' }));
    const fixture = render();
    type(fixture, '  Slurs  ');
    submit(fixture);
    expect(report).toHaveBeenCalledWith('m1', 'Slurs');
    expect(toast.success).toHaveBeenCalledWith('Report sent.');
    expect(close).toHaveBeenCalledWith(true);
  });

  it('shows a server error inline and stays open', () => {
    report = jest.fn(() =>
      throwError(
        () =>
          new ApiError(
            new HttpErrorResponse({
              status: 400,
              error: {
                error: {
                  code: 'CH-005',
                  message: "You can't report your own message",
                },
              },
            }),
          ),
      ),
    );
    const fixture = render();
    type(fixture, 'Slurs');
    submit(fixture);
    expect(fixture.nativeElement.textContent).toContain(
      "You can't report your own message",
    );
    expect(close).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
  });
});
