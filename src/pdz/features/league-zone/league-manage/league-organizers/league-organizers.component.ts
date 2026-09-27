import { DatePipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import {
  LEAGUE_ZONE_PATH,
  ORGANIZER_INVITE_PATH,
} from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';
import { isValidOrganizerName, ORGANIZER_NAME_MAX } from '../../league.util';

@Component({
  selector: 'pdz-league-organizers',
  templateUrl: './league-organizers.component.html',
  styleUrl: './league-organizers.component.scss',
  imports: [
    DatePipe,
    FormsModule,
    ButtonComponent,
    EmptyStateComponent,
    IconComponent,
    LoadingComponent,
    FieldComponent,
    InputDirective,
    PageHeaderComponent,
    TooltipDirective,
  ],
})
export class LeagueOrganizersComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly canEdit = signal(false);
  protected readonly organizers = signal<League.TournamentOrganizer[]>([]);
  protected readonly invites = signal<League.OrganizerInvite[]>([]);
  protected readonly candidates = signal<League.OrganizerCandidate[]>([]);
  protected readonly busyId = signal<string | null>(null);
  protected readonly creatingInvite = signal(false);
  protected readonly createdLink = signal<{ id: string; url: string } | null>(
    null,
  );

  protected readonly editingSub = signal<string | null>(null);

  protected inviteName = '';
  protected draftName = '';
  protected readonly nameMax = ORGANIZER_NAME_MAX;
  protected readonly isValidName = isValidOrganizerName;

  ngOnInit(): void {
    this.load();
  }

  protected promote(candidate: League.OrganizerCandidate): void {
    this.busyId.set(candidate.coachId);
    this.leagueService
      .addOrganizer({ coachId: candidate.coachId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.applyResult(result, 'Organizer added.'),
        error: () => this.fail('Could not add that organizer.'),
      });
  }

  protected remove(organizer: League.TournamentOrganizer): void {
    this.busyId.set(organizer.sub);
    this.leagueService
      .removeOrganizer(organizer.sub)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.applyResult(result, 'Organizer removed.'),
        error: () => this.fail('Could not remove that organizer.'),
      });
  }

  protected canRename(organizer: League.TournamentOrganizer): boolean {
    return organizer.isYou || this.canEdit();
  }

  protected startRename(organizer: League.TournamentOrganizer): void {
    this.draftName = organizer.name ?? '';
    this.editingSub.set(organizer.sub);
  }

  protected cancelRename(): void {
    this.editingSub.set(null);
  }

  protected saveRename(organizer: League.TournamentOrganizer): void {
    if (!isValidOrganizerName(this.draftName)) return;
    this.busyId.set(organizer.sub);
    this.leagueService
      .renameOrganizer(organizer.sub, this.draftName.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.editingSub.set(null);
          this.applyResult(result, 'Name saved.');
        },
        error: () => this.fail('Could not save that name.'),
      });
  }

  protected createInvite(): void {
    if (!isValidOrganizerName(this.inviteName)) return;
    this.creatingInvite.set(true);
    this.leagueService
      .createOrganizerInvite(this.inviteName.trim())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.creatingInvite.set(false);
          this.inviteName = '';
          this.createdLink.set({
            id: result.created.id,
            url: this.inviteUrl(result.created.token),
          });
          this.applyResult(result, 'Invite link created.');
        },
        error: (err) => {
          this.creatingInvite.set(false);
          this.toast.error(
            err?.error?.error?.message ?? 'Could not create an invite link.',
          );
        },
      });
  }

  protected revokeInvite(invite: League.OrganizerInvite): void {
    this.busyId.set(invite.id);
    this.leagueService
      .revokeOrganizerInvite(invite.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (this.createdLink()?.id === invite.id) this.createdLink.set(null);
          this.applyResult(result, 'Invite revoked.');
        },
        error: () => this.fail('Could not revoke that invite.'),
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

  protected label(organizer: League.TournamentOrganizer): string {
    if (organizer.name) return organizer.name;
    return organizer.isOwner ? 'Tournament owner' : 'Unnamed organizer';
  }

  protected note(organizer: League.TournamentOrganizer): string {
    return [organizer.isOwner && 'Owner', organizer.isYou && 'You']
      .filter(Boolean)
      .join(' · ');
  }

  private inviteUrl(token: string): string {
    const leagueSlug = this.leagueService.leagueSlug();
    const tournamentSlug = this.leagueService.tournamentSlug();
    return `${window.location.origin}/${LEAGUE_ZONE_PATH}/${leagueSlug}/tournaments/${tournamentSlug}/${ORGANIZER_INVITE_PATH}?token=${token}`;
  }

  private applyResult(
    result: League.TournamentOrganizers,
    message: string,
  ): void {
    this.setState(result);
    this.busyId.set(null);
    this.toast.success(message);
  }

  private setState(result: League.TournamentOrganizers): void {
    this.organizers.set(result.organizers);
    this.invites.set(result.invites);
    this.candidates.set(result.candidates);
    this.canEdit.set(result.canEdit);
  }

  private fail(message: string): void {
    this.busyId.set(null);
    this.toast.error(message);
  }

  private load(): void {
    this.leagueService
      .getOrganizers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.setState(result);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
