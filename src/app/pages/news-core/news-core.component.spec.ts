import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NewsCoreComponent } from './news-core.component';

describe('NewsCoreComponent', () => {
  let component: NewsCoreComponent;
  let fixture: ComponentFixture<NewsCoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsCoreComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NewsCoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
