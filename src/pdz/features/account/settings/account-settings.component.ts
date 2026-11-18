import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { profileLink } from '@pdz/core/route-paths';
import { SlideToggleComponent } from '@pdz/shared/inputs/slide-toggle/slide-toggle.component';
import { GuardsUnsavedChanges } from '@pdz/core/guards/unsaved-changes/unsaved-changes.guard';
import { ApiError } from '@pdz/core/services/api-error';
import { ApiService, apiErrorMessage } from '@pdz/core/services/api.service';
import { AuthService } from '@pdz/core/services/auth0.service';
import { Me, RoleService } from '@pdz/core/services/role.service';
import { SaveBarComponent } from '@pdz/shared/feedback/save-bar/save-bar.component';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import {
  PageSection,
  PageSectionsComponent,
} from '@pdz/shared/layout/page-sections/page-sections.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import {
  Observable,
  catchError,
  finalize,
  map,
  of,
  take,
  tap,
} from 'rxjs';
import { AppearanceSettingsComponent } from '../appearance/appearance-settings.component';
import {
  DISCORD_NAME_MAX,
  DISPLAY_NAME_ERROR,
  DISPLAY_NAME_MAX,
  GAME_NAME_MAX,
  validDisplayName,
} from '../display-name-rules';
import { signInMethodLabel } from '../sign-in-method';

type LoadState = 'loading' | 'ready' | 'error';
type ProfileField = 'displayName' | 'discordName' | 'gameName' | 'timezone';
type TextPatch = Partial<Record<ProfileField, string | null>>;
type ProfilePatch = TextPatch & { privateProfile?: boolean };

const SECTIONS: PageSection[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'league-defaults', label: 'League Defaults' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'account', label: 'Account' },
];

@Component({
  selector: 'pdz-account-settings',
  templateUrl: './account-settings.component.html',
  styleUrl: './account-settings.component.scss',
  imports: [
    FormsModule,
    RouterLink,
    AppearanceSettingsComponent,
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    FieldComponent,
    InputDirective,
    PageComponent,
    PageHeaderComponent,
    PageSectionsComponent,
    SaveBarComponent,
    SelectComponent,
    SlideToggleComponent,
    SelectOptionComponent,
    SkeletonLayoutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountSettingsComponent implements OnInit, GuardsUnsavedChanges {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly roleService = inject(RoleService);
  private readonly dialog = inject(DialogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fragment = toSignal(inject(ActivatedRoute).fragment);

  protected readonly sections = SECTIONS;
  protected readonly nameMax = DISPLAY_NAME_MAX;
  protected readonly discordMax = DISCORD_NAME_MAX;
  protected readonly gameMax = GAME_NAME_MAX;
  protected readonly timezones = Intl.supportedValuesOf('timeZone');

  protected readonly loadState = signal<LoadState>('loading');
  protected readonly saved = signal<Me | null>(null);
  protected readonly displayName = signal('');
  protected readonly discordName = signal('');
  protected readonly gameName = signal('');
  protected readonly timezone = signal('');
  protected readonly submitted = signal(false);
  protected readonly saving = signal(false);
  protected readonly saveError = signal<string | null>(null);
  protected readonly privateProfile = signal(false);
  protected readonly profileLink = computed(() => {
    const id = this.saved()?.profileId;
    return id ? profileLink(id) : null;
  });
  protected readonly fieldErrors = signal<TextPatch>({});

  protected readonly signInMethod = toSignal(
    this.auth.user$.pipe(map((user) => signInMethodLabel(user?.sub))),
    { initialValue: 'Signed in' },
  );

  protected readonly profilePatch = computed<ProfilePatch>(() => {
    const me = this.saved();
    if (!me) return {};
    const patch: ProfilePatch = {};
    const name = this.displayName().trim();
    if (name !== me.displayName) patch.displayName = name;
    const discord = this.discordName().trim();
    if (discord !== (me.profile.discordName ?? '')) {
      patch.discordName = discord || null;
    }
    const game = this.gameName().trim();
    if (game !== (me.profile.gameName ?? '')) patch.gameName = game || null;
    const zone = this.timezone();
    if (zone !== (me.profile.timezone ?? '')) patch.timezone = zone || null;
    if (this.privateProfile() !== me.privateProfile) {
      patch.privateProfile = this.privateProfile();
    }
    return patch;
  });

  protected readonly dirtyCount = computed(
    () => Object.keys(this.profilePatch()).length,
  );

  protected readonly nameError = computed(() => {
    const server = this.fieldErrors().displayName;
    if (server) return server;
    const touched = this.submitted() || 'displayName' in this.profilePatch();
    return touched && !validDisplayName(this.displayName())
      ? DISPLAY_NAME_ERROR
      : null;
  });

  protected readonly blocked = computed(
    () =>
      'displayName' in this.profilePatch() &&
      !validDisplayName(this.displayName()),
  );

  constructor() {
    effect(() => {
      const target = this.fragment();
      if (this.loadState() !== 'ready' || !target) return;
      setTimeout(() =>
        document
          .getElementById(target)
          ?.scrollIntoView({ block: 'start', behavior: 'auto' }),
      );
    });
  }

  ngOnInit(): void {
    this.roleService.me$
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe((me) => this.begin(me));
  }

  protected retry(): void {
    this.loadState.set('loading');
    this.roleService
      .reload()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((me) => this.begin(me));
  }

  protected onField(field: ProfileField, value: unknown): void {
    const text = typeof value === 'string' ? value : '';
    this.saveError.set(null);
    this.fieldErrors.update((errors) => ({ ...errors, [field]: undefined }));
    switch (field) {
      case 'displayName':
        this.displayName.set(text);
        break;
      case 'discordName':
        this.discordName.set(text);
        break;
      case 'gameName':
        this.gameName.set(text);
        break;
      case 'timezone':
        this.timezone.set(text);
        break;
    }
  }

  protected onPrivate(value: boolean): void {
    this.saveError.set(null);
    this.privateProfile.set(value);
  }

  protected revert(): void {
    const me = this.saved();
    if (me) this.fill(me);
  }

  protected logout(): Promise<void> {
    return this.auth.logout();
  }

  protected save(): void {
    this.submitted.set(true);
    if (this.saving() || this.blocked()) return;
    const patch = this.profilePatch();
    if (Object.keys(patch).length === 0) return;

    this.saving.set(true);
    this.saveError.set(null);
    this.fieldErrors.set({});
    this.saveProfile(patch)
      .pipe(
        finalize(() => this.saving.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  private saveProfile(patch: ProfilePatch): Observable<boolean> {
    return this.api.patch<Me>('users/profile', patch).pipe(
      tap((me) => this.accept(me)),
      map(() => true),
      catchError((err) => {
        this.reportProfileError(err, patch);
        return of(false);
      }),
    );
  }

  async canDeactivate(): Promise<boolean> {
    if (!this.dirtyCount()) return true;
    const leave = await this.dialog.confirm('Leave without saving?', {
      message: 'Your changes to these settings will be lost.',
      confirmLabel: 'Discard Changes',
      confirmColor: 'danger',
    });
    if (leave) this.revert();
    return leave;
  }

  private begin(me: Me | null): void {
    if (!me) {
      this.loadState.set('error');
      return;
    }
    this.saved.set(me);
    this.fill(me);
    this.loadState.set('ready');
  }

  private fill(me: Me): void {
    this.displayName.set(me.displayName);
    this.discordName.set(me.profile.discordName ?? '');
    this.gameName.set(me.profile.gameName ?? '');
    this.timezone.set(me.profile.timezone ?? '');
    this.privateProfile.set(me.privateProfile);
    this.submitted.set(false);
    this.saveError.set(null);
    this.fieldErrors.set({});
  }

  private accept(me: Me): void {
    this.roleService.setMe(me);
    this.saved.set(me);
  }

  private reportProfileError(err: unknown, patch: ProfilePatch): void {
    const message = apiErrorMessage(err, 'Could not save your settings.');
    const fields = Object.keys(patch).filter(
      (key) => key !== 'privateProfile',
    ) as ProfileField[];
    if (
      err instanceof ApiError &&
      err.status === 400 &&
      fields.length === 1 &&
      !('privateProfile' in patch)
    ) {
      this.fieldErrors.set({ [fields[0]]: message });
      return;
    }
    this.saveError.set(message);
  }
}
