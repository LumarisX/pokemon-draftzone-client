import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OverlayRef } from '@angular/cdk/overlay';
import { FileUploadPreviewComponent, FILE_PREVIEW_DATA_TOKEN } from './file-upload-preview.component';

describe('FileUploadPreviewComponent', () => {
  let component: FileUploadPreviewComponent;
  let fixture: ComponentFixture<FileUploadPreviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ FileUploadPreviewComponent ],
      providers: [
        { provide: OverlayRef, useValue: {} },
        { provide: FILE_PREVIEW_DATA_TOKEN, useValue: {} }
      ]
    });
    fixture = TestBed.createComponent(FileUploadPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});