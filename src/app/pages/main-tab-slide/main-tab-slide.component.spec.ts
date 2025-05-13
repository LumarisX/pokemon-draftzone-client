import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MainTabSlideComponent } from './main-tab-slide.component';

describe('MainTabSlideComponent', () => {
  let component: MainTabSlideComponent;
  let fixture: ComponentFixture<MainTabSlideComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MainTabSlideComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MainTabSlideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
