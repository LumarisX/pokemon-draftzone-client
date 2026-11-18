import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DASHBOARD_PATH } from '@pdz/core/route-paths';
import { ApiService } from '@pdz/core/services/api.service';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { ProfileBodyComponent } from './profile-body/profile-body.component';
import { Profile } from './profile.model';

@Component({
  selector: 'pdz-profile',
  imports: [
    EmptyStateComponent,
    PageComponent,
    PageHeaderComponent,
    ProfileBodyComponent,
    SkeletonLayoutComponent,
  ],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfileComponent {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly dashboardLink = ['/', DASHBOARD_PATH];

  protected readonly profile = signal<Profile | null>(null);
  protected readonly failed = signal(false);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.failed.set(false);
    this.profile.set(null);
    this.api
      .get<Profile>('profile')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (profile) => this.profile.set(profile),
        error: () => this.failed.set(true),
      });
  }
}
