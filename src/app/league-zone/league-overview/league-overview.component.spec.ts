import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { LeagueOverviewComponent } from './league-overview.component';

describe('LeagueOverviewComponent', () => {
  let component: LeagueOverviewComponent;
  let fixture: ComponentFixture<LeagueOverviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ LeagueOverviewComponent ],
      providers: [
        { 
          provide: ActivatedRoute, 
          useValue: { snapshot: { paramMap: { get: () => '123' } } } 
        }
      ]
    });
    fixture = TestBed.createComponent(LeagueOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});