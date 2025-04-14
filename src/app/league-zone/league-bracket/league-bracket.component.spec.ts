import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeagueBracketComponent } from './league-bracket.component';

describe('LeagueBracketComponent', () => {
  let component: LeagueBracketComponent;
  let fixture: ComponentFixture<LeagueBracketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueBracketComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeagueBracketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
