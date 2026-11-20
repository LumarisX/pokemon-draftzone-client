import { TestBed } from '@angular/core/testing';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { CoachEditDialogComponent } from './coach-edit-dialog.component';

describe('CoachEditDialogComponent', () => {
  function create(close = jest.fn()) {
    TestBed.configureTestingModule({
      imports: [CoachEditDialogComponent],
      providers: [
        { provide: DialogRef, useValue: { close } },
        {
          provide: DIALOG_DATA,
          useValue: {
            name: 'Ash',
            gameName: 'AshK',
            timezone: 'Asia/Tokyo',
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(CoachEditDialogComponent);
    fixture.detectChanges();
    return { fixture, close };
  }

  it('has no Discord field', () => {
    const { fixture } = create();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).not.toContain('Discord');
    expect(el.querySelector('input[formControlName=discordName]')).toBeNull();
  });

  it('closes with only name, Showdown name and time zone', () => {
    const { fixture, close } = create();
    (fixture.componentInstance as unknown as { onSave(): void }).onSave();
    expect(close).toHaveBeenCalledWith({
      name: 'Ash',
      gameName: 'AshK',
      timezone: 'Asia/Tokyo',
    });
  });
});
