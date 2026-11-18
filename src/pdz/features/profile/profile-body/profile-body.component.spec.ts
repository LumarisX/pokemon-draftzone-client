import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY_PROFILE, FULL_PROFILE } from '../profile-fixtures';
import { ProfileBodyComponent } from './profile-body.component';

describe('ProfileBodyComponent', () => {
  let fixture: ComponentFixture<ProfileBodyComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProfileBodyComponent],
      providers: [provideRouter([])],
    });
    fixture = TestBed.createComponent(ProfileBodyComponent);
  });

  function text(): string {
    return fixture.nativeElement.textContent.replace(/\s+/g, ' ');
  }

  it('renders the career strip, achievements and completed seasons', () => {
    fixture.componentRef.setInput('profile', FULL_PROFILE);
    fixture.detectChanges();
    expect(text()).toContain('All-Time Record');
    expect(text()).toContain('9–3');
    expect(text()).toContain('75%');
    expect(text()).toContain('1st of 8');
    expect(text()).toContain('Achievements');
    expect(text()).toContain('Completed Seasons');
    expect(text()).toContain('Pallet Owls');
    expect(text()).toContain('Kanto League · Season One');
    expect(
      fixture.nativeElement.querySelector('pdz-achievement-badge'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('a.season')).not.toBeNull();
  });

  it('speaks to the owner when there are no seasons', () => {
    fixture.componentRef.setInput('profile', EMPTY_PROFILE);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('pdz-empty-state'),
    ).not.toBeNull();
    expect(text()).toContain('No seasons yet');
    expect(text()).toContain('Your record');
  });

  it('does not say you to a visitor', () => {
    fixture.componentRef.setInput('profile', EMPTY_PROFILE);
    fixture.componentRef.setInput('isYou', false);
    fixture.detectChanges();
    expect(text()).toContain('No seasons yet');
    expect(text()).not.toContain('Your');
    expect(text()).toContain('Their record');
  });
});
