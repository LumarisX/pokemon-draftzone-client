import { DatePipe } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { catchError, debounceTime, of, Subject, switchMap } from 'rxjs';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { LeagueZoneService } from '../../league-zone.service';
import { League } from '../../league.interface';

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
  ],
})
export class LeagueOrganizersComponent implements OnInit {
  private readonly leagueService = inject(LeagueZoneService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly canEdit = signal(false);
  protected readonly organizers = signal<League.TournamentOrganizer[]>([]);
  protected readonly coaches = signal<League.LeagueSignUp[]>([]);
  protected readonly candidates = signal<League.OrganizerCandidate[]>([]);
  protected readonly searching = signal(false);
  protected readonly busySub = signal<string | null>(null);

  protected query = '';
  private readonly query$ = new Subject<string>();

  protected readonly promotableCoaches = computed(() =>
    this.coaches().filter((coach) => coach.status !== 'denied'),
  );

  ngOnInit(): void {
    this.load();

    this.query$
      .pipe(
        debounceTime(250),
        switchMap((query) => {
          if (query.trim().length < 2) {
            this.searching.set(false);
            return of<League.OrganizerCandidate[]>([]);
          }
          this.searching.set(true);
          return this.leagueService
            .searchOrganizerCandidates(query)
            .pipe(catchError(() => of<League.OrganizerCandidate[]>([])));
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((results) => {
        this.searching.set(false);
        this.candidates.set(results);
      });
  }

  protected onQueryChange(value: string): void {
    this.query = value;
    this.query$.next(value);
  }

  protected addBySub(candidate: League.OrganizerCandidate): void {
    this.busySub.set(candidate.sub);
    this.leagueService
      .addOrganizer({ sub: candidate.sub })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.applyResult(result, 'Organizer added.'),
        error: () => this.fail('Could not add that organizer.'),
      });
  }

  protected addByCoach(coach: League.LeagueSignUp): void {
    this.busySub.set(coach.id);
    this.leagueService
      .addOrganizer({ coachId: coach.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.applyResult(result, 'Organizer added.'),
        error: () => this.fail('Could not add that organizer.'),
      });
  }

  protected remove(organizer: League.TournamentOrganizer): void {
    this.busySub.set(organizer.sub);
    this.leagueService
      .removeOrganizer(organizer.sub)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => this.applyResult(result, 'Organizer removed.'),
        error: () => this.fail('Could not remove that organizer.'),
      });
  }

  protected label(organizer: League.TournamentOrganizer): string {
    return organizer.username ?? organizer.sub;
  }

  private applyResult(
    result: League.TournamentOrganizers,
    message: string,
  ): void {
    this.organizers.set(result.organizers);
    this.canEdit.set(result.canEdit);
    this.candidates.set([]);
    this.query = '';
    this.busySub.set(null);
    this.toast.success(message);
  }

  private fail(message: string): void {
    this.busySub.set(null);
    this.toast.error(message);
  }

  private load(): void {
    this.leagueService
      .getOrganizers()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          this.organizers.set(result.organizers);
          this.canEdit.set(result.canEdit);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });

    this.leagueService
      .getSignUps()
      .pipe(
        catchError(() => of({ signups: [], drafts: [] })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((data) => this.coaches.set(data.signups));
  }
}
