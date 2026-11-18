import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiError } from '@pdz/core/services/api-error';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { of, throwError } from 'rxjs';
import { AdminService } from '../admin.service';
import {
  ResetDisplayNameComponent,
  extractProfileId,
} from './reset-display-name.component';

const ID = 'a1b2c3d4e5f6a1b2c3d4e5f6';

describe('extractProfileId', () => {
  it('accepts a bare id', () => {
    expect(extractProfileId(` ${ID} `)).toBe(ID);
  });

  it('pulls the id out of a pasted profile link', () => {
    expect(
      extractProfileId(`https://pokemondraftzone.com/profile/${ID}?x=1`),
    ).toBe(ID);
  });

  it('returns null when there is no id', () => {
    expect(extractProfileId('misty_w')).toBeNull();
  });
});

describe('ResetDisplayNameComponent', () => {
  let resetDisplayName: jest.Mock;
  let confirm: jest.Mock;
  let toast: { success: jest.Mock };

  async function render(confirmed = true) {
    confirm = jest.fn().mockResolvedValue(confirmed);
    toast = { success: jest.fn() };
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AdminService, useValue: { resetDisplayName } },
        { provide: DialogService, useValue: { confirm } },
        { provide: ToastService, useValue: toast },
      ],
    });
    const fixture = TestBed.createComponent(ResetDisplayNameComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture;
  }

  function fill(
    fixture: Awaited<ReturnType<typeof render>>,
    profile: string,
    note: string,
  ) {
    const input = fixture.nativeElement.querySelector(
      'input[name=profile]',
    ) as HTMLInputElement;
    input.value = profile;
    input.dispatchEvent(new Event('input'));
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    textarea.value = note;
    textarea.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function submit(fixture: Awaited<ReturnType<typeof render>>) {
    fixture.nativeElement.querySelector('button[type="submit"]').click();
  }

  function notFound(): ApiError {
    return new ApiError(
      new HttpErrorResponse({
        status: 404,
        error: { error: { message: 'No account has that profile' } },
      }),
    );
  }

  it('keeps the button off until a profile id and a note are given', async () => {
    resetDisplayName = jest.fn();
    const fixture = await render();
    const button = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    fill(fixture, 'not an id', 'Impersonation');
    expect(button.disabled).toBe(true);
    fill(fixture, ID, 'Impersonation');
    expect(button.disabled).toBe(false);
  });

  it('does nothing when the confirm is declined', async () => {
    resetDisplayName = jest.fn();
    const fixture = await render(false);
    fill(fixture, ID, 'Impersonation');
    submit(fixture);
    await fixture.whenStable();
    expect(confirm).toHaveBeenCalledWith(
      'Reset Display Name',
      expect.objectContaining({ confirmColor: 'danger' }),
    );
    expect(resetDisplayName).not.toHaveBeenCalled();
  });

  it('resets from a pasted link, clears the form and toasts', async () => {
    resetDisplayName = jest.fn(() => of({ reset: true }));
    const fixture = await render();
    fill(fixture, `https://example.com/profile/${ID}`, ' Impersonation ');
    submit(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(resetDisplayName).toHaveBeenCalledWith(ID, 'Impersonation');
    expect(toast.success).toHaveBeenCalledWith('Display name reset.');
    expect(
      (fixture.nativeElement.querySelector('input[name=profile]') as HTMLInputElement).value,
    ).toBe('');
    expect(
      (fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement).value,
    ).toBe('');
  });

  it('shows a missing account at the profile field', async () => {
    resetDisplayName = jest.fn(() => throwError(() => notFound()));
    const fixture = await render();
    fill(fixture, ID, 'Impersonation');
    submit(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'No account has that profile',
    );
    expect(toast.success).not.toHaveBeenCalled();
  });
});
