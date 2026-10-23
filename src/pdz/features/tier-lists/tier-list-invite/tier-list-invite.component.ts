import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TIER_LIST_PATH } from '@pdz/core/route-paths';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { TierListService } from '../tier-list.service';

type InvitePreview = {
  tierList: { slug: string; name: string; authorName: string | null; format: string; ruleset: string };
  role: 'editor' | 'viewer';
  expiresAt: string;
  alreadyMember: boolean;
};

export const MEMBER_NAME_MAX = 40;

@Component({
  selector: 'pdz-tier-list-invite',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonComponent,
    EmptyStateComponent,
    FieldComponent,
    InputDirective,
    PageComponent,
    PageHeaderComponent,
    SkeletonLayoutComponent,
  ],
  template: `
    <pdz-page type="form">
      <pdz-page-header title="Tier List Invite" />

      @if (loading()) {
        <pdz-skeleton-layout layout="text" [count]="1" />
      } @else if (preview(); as invite) {
        @if (invite.alreadyMember) {
          <pdz-empty-state
            bordered
            icon="format_list_numbered"
            heading="You already have this list"
            [message]="invite.tierList.name + ' is already yours or shared with you.'"
          >
            <a pdz-empty-state-actions pdz-button [routerLink]="['/', path, invite.tierList.slug]">
              Open It
            </a>
          </pdz-empty-state>
        } @else {
          <pdz-empty-state
            bordered
            icon="format_list_numbered"
            [heading]="'You were invited to ' + (invite.role === 'editor' ? 'edit ' : 'view ') + invite.tierList.name"
            [message]="
              invite.tierList.format + ' · ' + invite.tierList.ruleset +
              (invite.tierList.authorName ? ' · by ' + invite.tierList.authorName : '')
            "
          >
            <form id="accept-tier-list-invite" class="invite__form" (ngSubmit)="accept()">
              <label
                pdz-field
                label="Your Name on This List"
                hint="What others on this list see. Your account name stays private."
                required
              >
                <input
                  pdz-input
                  name="memberName"
                  [maxlength]="nameMax"
                  [ngModel]="name()"
                  (ngModelChange)="name.set($event)"
                />
              </label>
            </form>
            <p class="invite__expiry">This invite expires {{ invite.expiresAt | date: 'MMM d, h:mm a' }}.</p>
            <button
              pdz-empty-state-actions
              pdz-button
              type="submit"
              form="accept-tier-list-invite"
              [loading]="accepting()"
              [disabled]="!name().trim()"
            >
              Accept
            </button>
            <a pdz-empty-state-actions pdz-button variant="outlined" [routerLink]="['/', path]">
              Not Now
            </a>
          </pdz-empty-state>
        }
      } @else {
        <pdz-empty-state
          bordered
          kind="no-access"
          heading="This invite can't be used"
          message="It may have expired, been revoked, or been used up. Ask the list's owner for a new link."
        >
          <a pdz-empty-state-actions pdz-button variant="outlined" [routerLink]="['/', path]">
            Find Tier Lists
          </a>
        </pdz-empty-state>
      }
    </pdz-page>
  `,
  styleUrl: './tier-list-invite.component.scss',
})
export class TierListInviteComponent implements OnInit {
  private readonly tierLists = inject(TierListService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly toasts = inject(ToastService);

  protected readonly path = TIER_LIST_PATH;
  protected readonly nameMax = MEMBER_NAME_MAX;
  private readonly token = this.route.snapshot.paramMap.get('token') ?? '';

  protected readonly loading = signal(true);
  protected readonly preview = signal<InvitePreview | null>(null);
  protected readonly name = signal('');
  protected readonly accepting = signal(false);

  ngOnInit(): void {
    this.tierLists.previewInvite(this.token).subscribe({
      next: (preview) => {
        this.preview.set(preview);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  protected accept(): void {
    const preview = this.preview();
    if (!preview || !this.name().trim() || this.accepting()) return;
    this.accepting.set(true);
    this.tierLists.acceptInvite(this.token, this.name().trim()).subscribe({
      next: ({ slug }) => {
        this.toasts.success(`You're on ${preview.tierList.name}.`);
        this.router.navigate(
          ['/', TIER_LIST_PATH, slug, ...(preview.role === 'editor' ? ['edit'] : [])],
        );
      },
      error: (err) => {
        this.accepting.set(false);
        this.toasts.error(apiErrorMessage(err, 'Could not accept the invite.'));
      },
    });
  }
}
