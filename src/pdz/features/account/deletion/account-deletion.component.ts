import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { DASHBOARD_PATH } from '@pdz/core/route-paths';
import { ApiService, apiErrorMessage } from '@pdz/core/services/api.service';
import { AuthService } from '@pdz/core/services/auth0.service';
import { RoleService } from '@pdz/core/services/role.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { finalize, map, switchMap } from 'rxjs';

@Component({
  selector: 'pdz-account-deletion',
  templateUrl: './account-deletion.component.html',
  styleUrl: './account-deletion.component.scss',
  imports: [
    DatePipe,
    ButtonComponent,
    CardComponent,
    PageComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountDeletionComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly roleService = inject(RoleService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly scheduledFor = toSignal(
    this.roleService.me$.pipe(map((me) => me?.deletionScheduledFor ?? null)),
    { initialValue: null },
  );
  protected readonly keeping = signal(false);
  protected readonly error = signal<string | null>(null);

  protected keep(): void {
    if (this.keeping()) return;
    this.keeping.set(true);
    this.error.set(null);
    this.api
      .delete<{ scheduledFor: null }>('users/me/deletion')
      .pipe(
        switchMap(() => this.roleService.reload()),
        finalize(() => this.keeping.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => void this.router.navigate(['/', DASHBOARD_PATH]),
        error: (err) =>
          this.error.set(apiErrorMessage(err, 'Could not keep your account.')),
      });
  }

  protected logout(): Promise<void> {
    return this.auth.logout();
  }
}
