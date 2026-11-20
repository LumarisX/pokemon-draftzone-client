import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ApiError } from '@pdz/core/services/api-error';
import { ApiService } from '@pdz/core/services/api.service';
import { AuthService } from '@pdz/core/services/auth0.service';
import { Me, RoleService } from '@pdz/core/services/role.service';
import { of, throwError } from 'rxjs';
import { AccountDeletionComponent } from './account-deletion.component';

const scheduled = { deletionScheduledFor: '2026-12-20T12:00:00.000Z' } as Me;

describe('AccountDeletionComponent', () => {
  let fixture: ComponentFixture<AccountDeletionComponent>;
  let api: { delete: jest.Mock };
  let roleService: { me$: unknown; reload: jest.Mock };
  let logout: jest.Mock;
  let navigate: jest.SpyInstance;

  function el(): HTMLElement {
    return fixture.nativeElement;
  }

  function button(label: string): HTMLButtonElement {
    return Array.from(el().querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.includes(label),
    ) as HTMLButtonElement;
  }

  function create(): void {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: ApiService, useValue: api },
        { provide: RoleService, useValue: roleService },
        { provide: AuthService, useValue: { logout } },
      ],
    });
    navigate = jest
      .spyOn(TestBed.inject(Router), 'navigate')
      .mockResolvedValue(true);
    fixture = TestBed.createComponent(AccountDeletionComponent);
    fixture.detectChanges();
  }

  async function settle(): Promise<void> {
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(() => {
    logout = jest.fn(() => Promise.resolve());
    api = { delete: jest.fn(() => of({ scheduledFor: null })) };
    roleService = {
      me$: of(scheduled),
      reload: jest.fn(() => of({ deletionScheduledFor: null })),
    };
  });

  it('shows the title and the deletion date', () => {
    create();
    expect(el().textContent).toContain('Account Scheduled for Deletion');
    expect(el().textContent).toContain('December 20, 2026');
  });

  it('cancels the deletion, reloads Me and opens the dashboard', async () => {
    create();
    button('Keep My Account').click();
    await settle();
    expect(api.delete).toHaveBeenCalledWith('users/me/deletion');
    expect(roleService.reload).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith(['/', 'dashboard']);
  });

  it('shows a failure and stays on the page', async () => {
    api.delete.mockReturnValue(
      throwError(
        () => new ApiError(new HttpErrorResponse({ status: 500 })),
      ),
    );
    create();
    button('Keep My Account').click();
    await settle();
    expect(el().querySelector('.deletion__error')?.textContent).toContain(
      'Could not keep your account.',
    );
    expect(navigate).not.toHaveBeenCalled();
  });

  it('logs out', () => {
    create();
    button('Log Out').click();
    expect(logout).toHaveBeenCalledTimes(1);
    expect(api.delete).not.toHaveBeenCalled();
  });
});
