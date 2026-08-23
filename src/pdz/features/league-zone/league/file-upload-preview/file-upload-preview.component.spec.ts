import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  DIALOG_DATA,
  DialogRef,
} from '@pdz/shared/dialogs/dialog/dialog.service';
import { FileUploadPreviewComponent } from './file-upload-preview.component';

describe('FileUploadPreviewComponent', () => {
  let fixture: ComponentFixture<FileUploadPreviewComponent>;
  let ref: DialogRef<boolean>;

  const file = new File(['hello'], 'logo.png', { type: 'image/png' });

  beforeEach(() => {
    ref = new DialogRef<boolean>({}, () => {});

    TestBed.configureTestingModule({
      imports: [FileUploadPreviewComponent],
      providers: [
        { provide: DialogRef, useValue: ref },
        { provide: DIALOG_DATA, useValue: { file } },
      ],
    });
    fixture = TestBed.createComponent(FileUploadPreviewComponent);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('shows the file name and size', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('logo.png');
    expect(text).toContain('5 Bytes');
  });

  it('closes with true when confirmed', async () => {
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    buttons.find((b) => b.textContent?.includes('Upload'))?.click();

    await expect(ref.closed).resolves.toBe(true);
  });

  it('closes with false when cancelled', async () => {
    const buttons: HTMLButtonElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('button'),
    );
    buttons.find((b) => b.textContent?.includes('Cancel'))?.click();

    await expect(ref.closed).resolves.toBe(false);
  });
});
