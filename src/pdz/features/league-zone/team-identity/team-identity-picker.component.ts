import { HttpEventType, HttpResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  Injector,
  OnInit,
  afterNextRender,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { UploadService } from '@pdz/core/services/upload.service';
import { getTeamLogoSrc } from '@pdz/features/league-zone/league.util';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TeamLogoComponent } from '@pdz/shared/images/team-logo/team-logo.component';
import {
  FieldErrorDirective,
  FieldHintDirective,
} from '@pdz/shared/inputs/field/field-message.directive';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ToastService } from '@pdz/shared/feedback/toast/toast.service';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { catchError, of, switchMap, tap } from 'rxjs';
import {
  IdentityPack,
  SavedIdentity,
  StockIdentity,
  TeamIdentityChoice,
  isStockLogo,
  sameIdentity,
} from './team-identity.model';
import { TeamIdentityService } from './team-identity.service';

const MAX_LOGO_BYTES = 5 * 1024 * 1024;
const LOGO_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const TEAM_NAME_LIMIT = 64;
const CUSTOM_SECTION = 'custom';

interface CustomDraft {
  key: number;
  name: string;
  logo: string | null;
}

function isBlank(draft: CustomDraft): boolean {
  return !draft.name.trim() && !draft.logo;
}

@Component({
  selector: 'pdz-team-identity-picker',
  imports: [
    ButtonComponent,
    DisclosureComponent,
    EmptyStateComponent,
    FieldComponent,
    FieldErrorDirective,
    FieldHintDirective,
    IconComponent,
    InputDirective,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    SkeletonLayoutComponent,
    TeamComponent,
    TeamLogoComponent,
  ],
  templateUrl: './team-identity-picker.component.html',
  styleUrl: './team-identity-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamIdentityPickerComponent implements OnInit {
  readonly value = model<TeamIdentityChoice | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly showSaved = input(true, { transform: booleanAttribute });
  readonly nameLimit = input(TEAM_NAME_LIMIT);

  private readonly identities = inject(TeamIdentityService);
  private readonly uploads = inject(UploadService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly dialogs = inject(DialogService);
  private readonly toast = inject(ToastService);

  private readonly nameInput =
    viewChild<ElementRef<HTMLInputElement>>('nameInput');
  private readonly renameInput =
    viewChild<ElementRef<HTMLInputElement>>('renameInput');

  protected readonly renaming = signal<{
    id: string;
    name: string;
    saving: boolean;
    error: string | null;
  } | null>(null);

  protected readonly customSection = CUSTOM_SECTION;
  protected readonly logoTypes = LOGO_TYPES.join(',');
  protected readonly logoSrc = getTeamLogoSrc;

  protected readonly packs = signal<IdentityPack[] | null>(null);
  protected readonly packsFailed = signal(false);
  private readonly saved = signal<SavedIdentity[] | null>(null);

  protected readonly loading = computed(
    () => this.saved() === null || (this.packs() === null && !this.packsFailed()),
  );

  private readonly stock = computed(() =>
    (this.packs() ?? []).flatMap((pack) =>
      pack.identities.map((identity) => ({ pack, identity })),
    ),
  );

  protected readonly savedCustom = computed(() =>
    (this.saved() ?? []).filter(
      (identity) =>
        !this.stock().some((stock) => sameIdentity(stock.identity, identity)),
    ),
  );

  private nextDraftKey = 0;
  private readonly drafts = signal<CustomDraft[]>([]);
  protected readonly editingKey = signal<number | null>(null);

  protected readonly editing = computed(
    () =>
      this.drafts().find((draft) => draft.key === this.editingKey()) ?? null,
  );

  protected readonly visibleDrafts = computed(() =>
    this.drafts().filter(
      (draft) => draft.key === this.editingKey() || !this.isKnown(draft),
    ),
  );

  protected readonly pickedSection = computed<string | null>(() => {
    const choice = this.value();
    if (!choice?.name.trim()) return null;
    const stock = this.stock().find(({ identity }) =>
      sameIdentity(choice, identity),
    );
    if (stock) return stock.pack.id;
    return CUSTOM_SECTION;
  });

  private readonly toggled = signal<ReadonlyMap<string, boolean>>(new Map());

  private readonly openByDefault = computed(() => {
    const picked = this.pickedSection();
    if (picked) return new Set([picked]);
    const first = this.packs()?.[0]?.id;
    return new Set(first ? [CUSTOM_SECTION, first] : [CUSTOM_SECTION]);
  });

  protected readonly uploading = signal(false);
  protected readonly progress = signal(0);
  protected readonly uploadError = signal<string | null>(null);

  protected readonly summary = computed(() => {
    const choice = this.value();
    if (!choice?.name.trim()) return null;
    return {
      name: choice.name.trim(),
      logo: getTeamLogoSrc(choice.logo),
      detail: this.detailFor(choice),
    };
  });

  ngOnInit(): void {
    const start = this.value();
    if (
      start?.source === 'custom' &&
      (start.name.trim() || start.logo) &&
      !isStockLogo(start.logo)
    ) {
      this.drafts.set([
        { key: this.nextDraftKey++, name: start.name, logo: start.logo },
      ]);
    }
    this.loadPacks();
    if (!this.showSaved()) {
      this.saved.set([]);
      return;
    }
    this.identities
      .mine()
      .pipe(
        catchError(() => of<SavedIdentity[]>([])),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((saved) => this.saved.set(saved));
  }

  protected loadPacks(): void {
    this.packsFailed.set(false);
    this.identities
      .packs()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (packs) => this.packs.set(packs),
        error: () => this.packsFailed.set(true),
      });
  }

  protected isOpen(section: string): boolean {
    return this.toggled().get(section) ?? this.openByDefault().has(section);
  }

  protected setOpen(section: string, open: boolean): void {
    this.toggled.update((current) => new Map(current).set(section, open));
  }

  protected isPicked(option: { name: string; logo: string | null }): boolean {
    return sameIdentity(this.value(), option);
  }

  protected isDraftPicked(draft: CustomDraft): boolean {
    const choice = this.value();
    return (
      choice?.source === 'custom' &&
      sameIdentity(choice, draft) &&
      (draft.key === this.editingKey() || !this.isKnown(draft))
    );
  }

  protected pickStock(pack: IdentityPack, identity: StockIdentity): void {
    this.stopEditing();
    this.renaming.set(null);
    this.value.set({
      source: 'pack',
      pack: pack.id,
      id: identity.id,
      name: identity.name,
      logo: identity.logo,
    });
  }

  protected pickSaved(identity: SavedIdentity): void {
    this.stopEditing();
    if (this.renaming()?.id !== identity.id) this.renaming.set(null);
    this.value.set({
      source: 'saved',
      id: identity.id,
      name: identity.name,
      logo: identity.logo,
    });
  }

  protected startRename(identity: SavedIdentity): void {
    this.stopEditing();
    this.renaming.set({
      id: identity.id,
      name: identity.name,
      saving: false,
      error: null,
    });
    afterNextRender(() => this.renameInput()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  protected setRenameName(event: Event): void {
    const name = (event.target as HTMLInputElement).value;
    this.renaming.update((current) =>
      current ? { ...current, name, error: null } : current,
    );
  }

  protected cancelRename(): void {
    this.renaming.set(null);
  }

  protected saveRename(event?: Event): void {
    event?.preventDefault();
    const current = this.renaming();
    if (!current || current.saving) return;
    const name = current.name.trim();
    if (!name) {
      this.renaming.set({ ...current, error: 'Give the team a name.' });
      return;
    }
    this.renaming.set({ ...current, saving: true, error: null });
    this.identities
      .rename(current.id, name)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (renamed) => {
          this.replaceSaved(renamed);
          this.renaming.set(null);
        },
        error: (err) =>
          this.renaming.update((state) =>
            state
              ? {
                  ...state,
                  saving: false,
                  error: apiErrorMessage(err, 'Could not rename that team.'),
                }
              : state,
          ),
      });
  }

  protected async deleteSaved(identity: SavedIdentity): Promise<void> {
    const confirmed = await this.dialogs.confirm(`Delete ${identity.name}?`, {
      message:
        'It leaves your list, and teams still playing stop following it. Every team keeps the name and logo it has now.',
      confirmLabel: 'Delete',
      confirmColor: 'danger',
    });
    if (!confirmed) return;
    this.identities
      .remove(identity.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          if (this.renaming()?.id === identity.id) this.renaming.set(null);
          this.saved.update((saved) =>
            (saved ?? []).filter((entry) => entry.id !== identity.id),
          );
          const choice = this.value();
          if (choice?.source === 'saved' && choice.id === identity.id)
            this.value.set(null);
        },
        error: (err) =>
          this.toast.error(apiErrorMessage(err, 'Could not delete that team.')),
      });
  }

  private replaceSaved(renamed: SavedIdentity): void {
    this.saved.update((saved) =>
      (saved ?? []).map((entry) => (entry.id === renamed.id ? renamed : entry)),
    );
    const choice = this.value();
    if (choice?.source === 'saved' && choice.id === renamed.id)
      this.value.set({ ...choice, name: renamed.name });
  }

  protected addDraft(): void {
    const key = this.nextDraftKey++;
    this.drafts.update((drafts) => [
      ...drafts.filter(
        (draft) => draft.key !== this.editingKey() || !isBlank(draft),
      ),
      { key, name: '', logo: null },
    ]);
    this.editDraft(key);
  }

  protected editDraft(key: number): void {
    this.renaming.set(null);
    if (this.editingKey() !== key) this.uploadError.set(null);
    this.editingKey.set(key);
    this.useDraft(key);
    afterNextRender(() => this.nameInput()?.nativeElement.focus(), {
      injector: this.injector,
    });
  }

  protected setCustomName(event: Event): void {
    const key = this.editingKey();
    if (key === null) return;
    const name = (event.target as HTMLInputElement).value;
    this.updateDraft(key, { name });
  }

  private updateDraft(key: number, change: Partial<CustomDraft>): void {
    this.drafts.update((drafts) =>
      drafts.map((draft) =>
        draft.key === key ? { ...draft, ...change } : draft,
      ),
    );
    if (this.editingKey() === key) this.useDraft(key);
  }

  private useDraft(key: number): void {
    const draft = this.drafts().find((candidate) => candidate.key === key);
    if (!draft) return;
    this.value.set({ source: 'custom', name: draft.name, logo: draft.logo });
  }

  private stopEditing(): void {
    const key = this.editingKey();
    this.editingKey.set(null);
    this.uploadError.set(null);
    this.drafts.update((drafts) =>
      drafts.filter((draft) => draft.key !== key || !isBlank(draft)),
    );
  }

  private isKnown(identity: { name: string; logo: string | null }): boolean {
    return (
      this.savedCustom().some((saved) => sameIdentity(saved, identity)) ||
      this.stock().some((stock) => sameIdentity(stock.identity, identity))
    );
  }

  protected selectLogo(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const file = element.files?.[0];
    element.value = '';
    const key = this.editingKey();
    if (!file || key === null) return;

    if (!LOGO_TYPES.includes(file.type)) {
      this.uploadError.set('Use a PNG, JPEG, WebP or GIF image.');
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      this.uploadError.set('Logos must be 5 MB or smaller.');
      return;
    }

    this.uploadError.set(null);
    this.uploading.set(true);
    this.progress.set(0);

    this.uploads
      .getPresignedUploadUrl(file.name, file.type, 'team-logos')
      .pipe(
        switchMap((presigned) =>
          this.uploads.uploadToS3(presigned, file).pipe(
            tap((event) => {
              if (event.type === HttpEventType.UploadProgress && event.total) {
                this.progress.set(Math.round((100 * event.loaded) / event.total));
              } else if (event instanceof HttpResponse && event.ok) {
                this.updateDraft(key, { logo: presigned.key });
              }
            }),
          ),
        ),
        catchError((err) => {
          this.uploadError.set(
            apiErrorMessage(err, 'The logo did not upload. Please try again.'),
          );
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({ complete: () => this.uploading.set(false) });
  }

  private detailFor(choice: TeamIdentityChoice): string {
    const stock = this.stock().find(({ identity }) =>
      sameIdentity(choice, identity),
    );
    if (stock) return stock.pack.name;
    return choice.logo ? 'Your own logo' : 'No logo yet';
  }
}
