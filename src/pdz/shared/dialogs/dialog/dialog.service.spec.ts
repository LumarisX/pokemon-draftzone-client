import { ApplicationRef, Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DIALOG_DATA, DialogRef, DialogService } from './dialog.service';

@Component({
  selector: 'pdz-retitling-dialog',
  template: `<button type="button" (click)="rename()">rename</button>`,
})
class RetitlingDialogComponent {
  private readonly ref = inject(DialogRef) as DialogRef<string>;
  readonly data = inject<{ name: string }>(DIALOG_DATA);

  constructor() {
    this.ref.update({ heading: this.data.name });
  }

  rename() {
    this.ref.update({ heading: 'Renamed' });
  }
}

describe('DialogService', () => {
  let service: DialogService;
  let appRef: ApplicationRef;

  const heading = () =>
    document.querySelector('.pdz-dialog__heading')?.textContent?.trim();

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DialogService);
    appRef = TestBed.inject(ApplicationRef);
  });

  afterEach(() => {
    document
      .querySelectorAll('pdz-dialog-host')
      .forEach((host) => host.remove());
  });

  it('renders the heading a hosted component sets while it is constructed', () => {
    service.open<RetitlingDialogComponent, string, { name: string }>(
      RetitlingDialogComponent,
      { data: { name: 'Deoxys' } },
    );
    appRef.tick();

    expect(heading()).toBe('Deoxys');
  });

  it('re-renders the heading when the hosted component updates it', () => {
    service.open<RetitlingDialogComponent, string, { name: string }>(
      RetitlingDialogComponent,
      { data: { name: 'Deoxys' } },
    );
    appRef.tick();

    document
      .querySelector<HTMLButtonElement>('pdz-retitling-dialog button')!
      .click();
    appRef.tick();

    expect(heading()).toBe('Renamed');
  });

  it('resolves `closed` with the result passed to close()', async () => {
    const ref = service.open<
      RetitlingDialogComponent,
      string,
      { name: string }
    >(RetitlingDialogComponent, { data: { name: 'Deoxys' } });
    appRef.tick();

    ref.close('picked');

    await expect(ref.closed).resolves.toBe('picked');
  });
});
