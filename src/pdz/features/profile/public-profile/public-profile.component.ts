import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SETTINGS_PATH, profileLink } from '@pdz/core/route-paths';
import { ApiError } from '@pdz/core/services/api-error';
import { ApiService } from '@pdz/core/services/api.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { map } from 'rxjs';
import { ProfileBodyComponent } from '../profile-body/profile-body.component';
import { PublicProfile } from '../profile.model';

type LoadState = 'loading' | 'ready' | 'missing' | 'error';

@Component({
  selector: 'pdz-public-profile',
  imports: [
    DatePipe,
    RouterLink,
    ButtonComponent,
    EmptyStateComponent,
    PageComponent,
    PageHeaderComponent,
    ProfileBodyComponent,
    SkeletonLayoutComponent,
  ],
  templateUrl: './public-profile.component.html',
  styleUrl: './public-profile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PublicProfileComponent {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly settingsLink = ['/', SETTINGS_PATH];

  protected readonly state = signal<LoadState>('loading');
  protected readonly data = signal<PublicProfile | null>(null);
  private requested = '';

  protected readonly title = computed(() => {
    const data = this.data();
    return data?.displayName || 'Profile';
  });

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('profileId') ?? ''),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((profileId) => {
        this.requested = profileId;
        this.load();
      });
  }

  protected load(): void {
    this.state.set('loading');
    this.data.set(null);
    this.api
      .get<PublicProfile>(`profiles/${encodeURIComponent(this.requested)}`, {
        errorHandlingOptions: { suppressStatuses: [404] },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          if (data.profileId && data.profileId !== this.requested) {
            void this.router.navigate(profileLink(data.profileId), {
              replaceUrl: true,
            });
            return;
          }
          this.data.set(data);
          this.state.set('ready');
        },
        error: (err) =>
          this.state.set(
            err instanceof ApiError && err.status === 404 ? 'missing' : 'error',
          ),
      });
  }
}
