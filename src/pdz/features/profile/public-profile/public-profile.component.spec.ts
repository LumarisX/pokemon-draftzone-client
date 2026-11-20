import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  Router,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { ApiError } from '@pdz/core/services/api-error';
import { ApiService } from '@pdz/core/services/api.service';
import { provideAuthStub } from '@pdz/core/testing/auth-stub';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { EMPTY_PROFILE, FULL_PROFILE } from '../profile-fixtures';
import { PublicProfile } from '../profile.model';
import { PublicProfileComponent } from './public-profile.component';

const PROFILE_ID = 'a1b2c3d4e5f6a1b2c3d4e5f6';

const PERSON: PublicProfile = {
  displayName: 'Ash Ketchum',
  joined: '2026-01-15T00:00:00.000Z',
  private: false,
  isYou: false,
  profile: FULL_PROFILE,
};

function apiError(status: number): ApiError {
  return new ApiError(
    new HttpErrorResponse({
      status,
      error: { error: { message: 'x' } },
    }),
  );
}

describe('PublicProfileComponent', () => {
  let fixture: ComponentFixture<PublicProfileComponent>;
  let get: jest.Mock;
  let params: BehaviorSubject<ReturnType<typeof convertToParamMap>>;

  function el(): HTMLElement {
    return fixture.nativeElement;
  }

  let navigate: jest.SpyInstance;

  function create(response: Observable<unknown>, profileId = PROFILE_ID): void {
    get = jest.fn(() => response);
    params = new BehaviorSubject(convertToParamMap({ profileId }));
    TestBed.configureTestingModule({
      imports: [PublicProfileComponent],
      providers: [
        provideRouter([]),
        provideAuthStub(),
        { provide: ApiService, useValue: { get } },
        { provide: ActivatedRoute, useValue: { paramMap: params } },
      ],
    });
    navigate = jest
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    fixture = TestBed.createComponent(PublicProfileComponent);
    fixture.detectChanges();
  }

  it('replaces the url when the profile belongs to a different id', () => {
    create(of({ ...PERSON, profileId: 'bbbbbbbbbbbbbbbbbbbbbbbb' }));
    expect(navigate).toHaveBeenCalledWith(
      ['/', 'profile', 'bbbbbbbbbbbbbbbbbbbbbbbb'],
      { replaceUrl: true },
    );
    expect(el().querySelector('pdz-profile-body')).toBeNull();
  });

  it('does not redirect when the profile id matches', () => {
    create(of({ ...PERSON, profileId: PROFILE_ID }));
    expect(navigate).not.toHaveBeenCalled();
  });

  it('renders a loaded profile with its header', () => {
    create(of(PERSON));
    expect(get.mock.calls[0][0]).toBe(`profiles/${PROFILE_ID}`);
    expect(el().querySelector('pdz-profile-body')).not.toBeNull();
    const header = el().querySelector('pdz-page-header')!.textContent!;
    expect(header).toContain('Ash Ketchum');
    expect(header).toContain('Joined January 2026');
    expect(header).not.toContain('Edit Profile');
    expect(el().querySelector('pdz-empty-state')).toBeNull();
  });

  it('shows the no-access state and no body for a private profile', () => {
    create(of({ ...PERSON, private: true, profile: null }));
    expect(el().querySelector('pdz-profile-body')).toBeNull();
    expect(el().querySelector('pdz-empty-state')!.textContent).toContain(
      'private',
    );
    expect(el().textContent).not.toContain('Edit Profile');
  });

  it('lets the owner see the body, Edit Profile and the private note', () => {
    create(of({ ...PERSON, private: true, isYou: true }));
    expect(el().querySelector('pdz-profile-body')).not.toBeNull();
    const edit = Array.from(el().querySelectorAll('a')).find(
      (anchor) => anchor.textContent?.includes('Edit Profile'),
    )!;
    expect(edit.getAttribute('href')).toBe('/settings#profile');
    expect(el().textContent).toContain(
      'Only you can see this. Your profile is private.',
    );
  });

  it('does not show the private note to the owner of a public profile', () => {
    create(of({ ...PERSON, isYou: true }));
    expect(el().textContent).toContain('Edit Profile');
    expect(el().textContent).not.toContain('Only you can see this');
  });

  it('words an empty profile for a visitor', () => {
    create(of({ ...PERSON, profile: EMPTY_PROFILE }));
    expect(el().textContent).toContain('No seasons yet');
    expect(el().textContent).not.toContain('Your record');
  });

  it('says no one has an unknown profile', () => {
    create(throwError(() => apiError(404)), 'ffffffffffffffffffffffff');
    expect(el().querySelector('pdz-page-header')!.textContent).toContain(
      'Profile',
    );
    expect(el().querySelector('pdz-empty-state')!.textContent).toContain(
      'No one has that profile',
    );
  });

  it('shows a retryable error for any other failure', () => {
    create(throwError(() => apiError(500)));
    expect(el().querySelector('pdz-empty-state')!.textContent).toContain(
      'Could not load this profile',
    );
    get.mockReturnValue(of(PERSON));
    const retry = Array.from(el().querySelectorAll('button')).find(
      (button) => button.textContent?.includes('Try Again'),
    )!;
    retry.click();
    fixture.detectChanges();
    expect(el().querySelector('pdz-profile-body')).not.toBeNull();
  });
});
