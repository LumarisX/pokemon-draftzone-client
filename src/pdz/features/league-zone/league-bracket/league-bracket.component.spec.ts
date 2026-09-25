import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventStreamService } from '@pdz/core/services/event-stream.service';
import { EMPTY } from 'rxjs';

import { LeagueBracketComponent } from './league-bracket.component';

describe('LeagueBracketComponent', () => {
  let component: LeagueBracketComponent;
  let fixture: ComponentFixture<LeagueBracketComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeagueBracketComponent],
      providers: [
        {
          provide: EventStreamService,
          useValue: { open: () => {}, close: () => {}, on: () => EMPTY },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LeagueBracketComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
