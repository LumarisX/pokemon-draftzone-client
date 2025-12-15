import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ColorBoxComponent } from './color-box.component';

describe('ColorPaletteComponent', () => {
  let component: ColorBoxComponent;
  let fixture: ComponentFixture<ColorBoxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ColorBoxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ColorBoxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
