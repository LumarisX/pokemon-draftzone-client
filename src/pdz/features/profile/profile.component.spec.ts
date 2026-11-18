import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ApiService } from '@pdz/core/services/api.service';
import { provideAuthStub } from '@pdz/core/testing/auth-stub';
import { Observable, of, throwError } from 'rxjs';
import { FULL_PROFILE } from './profile-fixtures';
import { ProfileComponent } from './profile.component';

describe('ProfileComponent', () => {
  let fixture: ComponentFixture<ProfileComponent>;
  let get: jest.Mock;

  function create(response: Observable<unknown>): void {
    get = jest.fn(() => response);
    TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        provideAuthStub(),
        { provide: ApiService, useValue: { get } },
      ],
    });
    fixture = TestBed.createComponent(ProfileComponent);
    fixture.detectChanges();
  }

  it('loads its own profile and renders the body under a plain header', () => {
    create(of(FULL_PROFILE));
    expect(get).toHaveBeenCalledWith('profile');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('pdz-profile-body')).not.toBeNull();
    expect(el.querySelector('pdz-page-header')?.textContent).toContain(
      'Profile',
    );
    expect(el.textContent).toContain('Pallet Owls');
  });

  it('shows a retryable error', () => {
    create(throwError(() => new Error('down')));
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('pdz-empty-state')).not.toBeNull();
    expect(el.querySelector('pdz-profile-body')).toBeNull();
  });
});
