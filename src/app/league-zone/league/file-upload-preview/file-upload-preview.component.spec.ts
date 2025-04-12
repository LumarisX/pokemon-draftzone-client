import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileUploadPreviewComponent } from './file-upload-preview.component';

describe('FileUploadPreviewComponent', () => {
  let component: FileUploadPreviewComponent;
  let fixture: ComponentFixture<FileUploadPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileUploadPreviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FileUploadPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
