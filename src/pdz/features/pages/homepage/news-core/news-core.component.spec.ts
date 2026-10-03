import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { NewsCoreComponent } from './news-core.component';

describe('NewsCoreComponent', () => {
  let component: NewsCoreComponent;
  let fixture: ComponentFixture<NewsCoreComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NewsCoreComponent],
      providers: [provideRouter([]), provideMarkdown()],
    }).compileComponents();

    fixture = TestBed.createComponent(NewsCoreComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
