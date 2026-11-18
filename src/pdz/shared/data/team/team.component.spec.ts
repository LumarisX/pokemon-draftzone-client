import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TeamComponent } from './team.component';

describe('TeamComponent', () => {
  let fixture: ComponentFixture<TeamComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(TeamComponent);
    fixture.componentRef.setInput('name', 'Team Rocket');
    fixture.componentRef.setInput('coach', 'Jessie');
  });

  it('shows the coach name under the team name', () => {
    fixture.detectChanges();
    const coach = fixture.nativeElement.querySelector('.pdz-team__coach');
    expect(coach.textContent).toContain('Jessie');
  });

  it('hides the coach on the inline size', () => {
    fixture.componentRef.setInput('size', 'inline');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.pdz-team__coach')).toBeNull();
  });
});
