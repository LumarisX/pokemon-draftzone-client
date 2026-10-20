import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  LEAGUE_ADMIN_INVITE_PATH,
  LEAGUE_ZONE_PATH,
} from '@pdz/core/route-paths';
import { ApiError } from '@pdz/core/services/api-error';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { League } from '@pdz/features/league-zone/league.interface';
import {
  ORGANIZER_NAME_MAX,
  isValidOrganizerName,
} from '@pdz/features/league-zone/league.util';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { forkJoin } from 'rxjs';

type LoadState = 'loading' | 'ready' | 'forbidden' | 'error';

@Component({
  selector: 'pdz-league-admins',
  templateUrl: './league-admins.component.html',
  styleUrl: './league-admins.component.scss',
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    FieldComponent,
    IconComponent,
    InputDirective,
    PageComponent,
    PageHeaderComponent,
    SkeletonLayoutComponent,
    TooltipDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueAdminsComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leagueService = inject(LeagueZoneService);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly leagueSlug =
    this.route.snapshot.paramMap.get('leagueSlug') ?? '';
  protected readonly leagueLink = ['/', LEAGUE_ZONE_PATH, this.leagueSlug];

  protected readonly state = signal<LoadState>('loading');
  protected readonly leagueName = signal<string | null>(null);
  protected readonly canEdit = signal(false);
  protected readonly ownerIsYou = signal(false);
  protected readonly admins = signal<League.LeagueAdmin[]>([]);
  protected readonly invites = signal<League.OrganizerInvite[]>([]);
  protected readonly busyId = signal<string | null>(null);
  protected readonly creatingInvite = signal(false);
  protected readonly createdLink = signal<{ id: string; url: string } | null>(
    null,
  );

  protected readonly editingSub = signal<string | null>(null);
  protected readonly inviteName = signal('');
  protected readonly draftName = signal('');

  protected readonly nameMax = ORGANIZER_NAME_MAX;
  protected readonly isValidName = isValidOrganizerName;

  ngOnInit(): void {
    this.load();
  }

  protected load(): void {
    this.state.set('loading');
    forkJoin({
      league: this.leagueService.getLeague(this.leagueSlug),
      admins: this.leagueService.getLeagueAdmins(this.leagueSlug),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ league, admins }) => {
          this.leagueName.set(league.name);
          this.setState(admins);
          this.state.set('ready');
        },
        error: (err) =>
          this.state.set(
            err instanceof ApiError && err.status === 403
              ? 'forbidden'
              : 'error',
          ),
      });
  }

  protected canRename(admin: League.LeagueAdmin): boolean {
    return admin.isYou || this.canEdit();
  }

  protected startRename(admin: League.LeagueAdmin): void {
    this.draftName.set(admin.name);
    this.editingSub.set(admin.sub);
  }

  protected cancelRename(): void {
    this.editingSub.set(null);
  }

  protected saveRename(admin: League.LeagueAdmin): void {
    const name = this.draftName();
    if (!isValidOrganizerName(name)) return;
    this.busyId.set(admin.sub);
    this.leagueService
      .renameLeagueAdmin(this.leagueSlug, admin.sub, name.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.editingSub.set(null);
          this.applyResult(result, 'Name saved.');
        },
        error: (err) => this.fail(err, 'Could not save that name.'),
      });
  }

  protected async remove(admin: League.LeagueAdmin): Promise<void> {
    const leaving = admin.isYou;
    const confirmed = await this.dialogs.confirm(
      leaving ? 'Leave League' : 'Remove Admin',
      {
        message: leaving
          ? `You'll no longer be able to start tournaments or edit ${this.leagueName() ?? 'this league'}. Tournaments you organize stay yours.`
          : `${admin.name} will no longer be able to start tournaments or edit the league. Tournaments they organize keep them as an organizer.`,
        confirmLabel: leaving ? 'Leave' : 'Remove',
        confirmColor: 'danger',
      },
    );
    if (!confirmed) return;

    this.busyId.set(admin.sub);
    this.leagueService
      .removeLeagueAdmin(this.leagueSlug, admin.sub)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if ('left' in result) {
            this.toast.success(
              `You left ${this.leagueName() ?? 'the league'}.`,
            );
            this.router.navigate(this.leagueLink);
            return;
          }
          this.applyResult(result, 'Admin removed.');
        },
        error: (err) => this.fail(err, 'Could not remove that admin.'),
      });
  }

  protected createInvite(): void {
    const name = this.inviteName();
    if (!isValidOrganizerName(name)) return;
    this.creatingInvite.set(true);
    this.leagueService
      .createLeagueAdminInvite(this.leagueSlug, name.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.creatingInvite.set(false);
          this.inviteName.set('');
          this.createdLink.set({
            id: result.created.id,
            url: this.inviteUrl(result.created.token),
          });
          this.applyResult(result, 'Invite link created.');
        },
        error: (err) => {
          this.creatingInvite.set(false);
          this.toast.error(
            apiErrorMessage(err, 'Could not create an invite link.'),
          );
        },
      });
  }

  protected revokeInvite(invite: League.OrganizerInvite): void {
    this.busyId.set(invite.id);
    this.leagueService
      .revokeLeagueAdminInvite(this.leagueSlug, invite.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (this.createdLink()?.id === invite.id) this.createdLink.set(null);
          this.applyResult(result, 'Invite revoked.');
        },
        error: (err) => this.fail(err, 'Could not revoke that invite.'),
      });
  }

  protected async copyLink(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      this.toast.success('Invite link copied.');
    } catch {
      this.toast.error('Could not copy the link.');
    }
  }

  private inviteUrl(token: string): string {
    return `${window.location.origin}/${LEAGUE_ZONE_PATH}/${this.leagueSlug}/${LEAGUE_ADMIN_INVITE_PATH}?token=${token}`;
  }

  private applyResult(result: League.LeagueAdmins, message: string): void {
    this.setState(result);
    this.busyId.set(null);
    this.toast.success(message);
  }

  private setState(result: League.LeagueAdmins): void {
    this.admins.set(result.admins);
    this.invites.set(result.invites);
    this.canEdit.set(result.canEdit);
    this.ownerIsYou.set(result.ownerIsYou);
  }

  private fail(err: unknown, message: string): void {
    this.busyId.set(null);
    this.toast.error(apiErrorMessage(err, message));
  }
}
