import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SETTINGS_PATH } from '@pdz/core/route-paths';
import { toApiError } from '@pdz/core/services/api-error';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { RoleService } from '@pdz/core/services/role.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ChoiceCardComponent } from '@pdz/shared/inputs/choice-cards/choice-card.component';
import { ChoiceCardsComponent } from '@pdz/shared/inputs/choice-cards/choice-cards.component';
import { finalize } from 'rxjs';
import { SkeletonLayoutComponent } from '@pdz/shared/data/skeleton/skeleton-layout.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import {
  DISCORD_ERROR,
  DiscordConnectionService,
  DiscordHolder,
  AccountSummary,
  MergeKeep,
  MergeOffer,
} from '../discord-connection.service';

interface Failure {
  kind: 'error' | 'no-access';
  heading: string;
  message: string;
}

const HOLDER_WAY: Record<DiscordHolder, string> = {
  discord: 'the DraftZone account you sign in to with Discord',
  google: 'a DraftZone account you sign in to with Google',
  email: 'a DraftZone account you sign in to with email',
  other: 'another DraftZone account',
};

const HOLDER_ADVICE: Record<DiscordHolder, string> = {
  discord: 'Sign in that way instead.',
  google: 'Sign in with Google instead.',
  email: 'Sign in with email instead.',
  other: 'Sign in to that account instead.',
};

const FALLBACK: Failure = {
  kind: 'error',
  heading: "Couldn't Connect Discord",
  message: 'Something went wrong connecting Discord. Try again from Settings.',
};

function holderOf(value: unknown): DiscordHolder {
  return value === 'discord' || value === 'google' || value === 'email'
    ? value
    : 'other';
}

const SIGN_IN_LABEL: Record<DiscordHolder, string> = {
  discord: 'Signs in with Discord',
  google: 'Signs in with Google',
  email: 'Signs in with email',
  other: 'Signs in another way',
};

const COUNT_LABELS: [keyof AccountSummary['counts'], string, string][] = [
  ['teams', 'team', 'teams'],
  ['leagues', 'league', 'leagues'],
  ['tournaments', 'tournament', 'tournaments'],
  ['drafts', 'external draft', 'external drafts'],
  ['tierLists', 'tier list', 'tier lists'],
  ['plans', 'planner plan', 'planner plans'],
];

export interface AccountView {
  summary: AccountSummary;
  signIn: string;
  holdings: string[];
  signedInNow: boolean;
}

function total(account: AccountSummary): number {
  return Object.values(account.counts).reduce((sum, n) => sum + n, 0);
}

function viewOf(account: AccountSummary, signedInNow: boolean): AccountView {
  return {
    summary: account,
    signIn: SIGN_IN_LABEL[holderOf(account.signInMethod)],
    holdings: COUNT_LABELS.filter(([key]) => account.counts[key] > 0).map(
      ([key, one, many]) =>
        `${account.counts[key]} ${account.counts[key] === 1 ? one : many}`,
    ),
    signedInNow,
  };
}

function isOffer(value: unknown): value is MergeOffer {
  if (!value || typeof value !== 'object') return false;
  const offer = value as Partial<MergeOffer>;
  return (
    typeof offer.token === 'string' && !!offer.current && !!offer.other
  );
}

@Component({
  selector: 'pdz-discord-callback',
  templateUrl: './discord-callback.component.html',
  styleUrl: './discord-callback.component.scss',
  imports: [
    DatePipe,
    RouterLink,
    ButtonComponent,
    CardComponent,
    ChoiceCardComponent,
    ChoiceCardsComponent,
    EmptyStateComponent,
    PageComponent,
    PageHeaderComponent,
    SkeletonLayoutComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DiscordCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly discord = inject(DiscordConnectionService);
  private readonly dialog = inject(DialogService);
  private readonly roleService = inject(RoleService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly settingsLink = ['/', SETTINGS_PATH];
  protected readonly failure = signal<Failure | null>(null);
  protected readonly offer = signal<MergeOffer | null>(null);
  protected readonly keep = signal<MergeKeep>('current');
  protected readonly merging = signal(false);
  protected readonly connecting = signal(false);
  protected readonly offerExpired = signal(false);
  protected readonly blockers = signal<string[]>([]);

  protected readonly accounts = computed(() => {
    const offer = this.offer();
    if (!offer) return [];
    return [viewOf(offer.current, true), viewOf(offer.other, false)];
  });

  protected readonly canMerge = computed(
    () => !!this.offer() && this.blockers().length === 0,
  );

  protected setKeep(value: MergeKeep | null): void {
    if (value) this.keep.set(value);
  }

  ngOnInit(): void {
    const params = this.route.snapshot.queryParamMap;
    const error = params.get('error');
    const code = params.get('code');
    const state = params.get('state');

    if (error === 'access_denied') {
      void this.router.navigate(this.settingsLink, { replaceUrl: true });
      return;
    }
    if (error || !code || !state) {
      this.failure.set(this.describe(DISCORD_ERROR.stateInvalid));
      return;
    }

    this.discord
      .complete(code, state)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ returnTo }) =>
          void this.router.navigateByUrl(returnTo, { replaceUrl: true }),
        error: (err) => {
          const apiError = toApiError(err);
          const offer = apiError?.details?.['mergeOffer'];
          if (apiError?.code === DISCORD_ERROR.alreadyConnected && isOffer(offer)) {
            this.offer.set(offer);
            this.blockers.set(offer.blockers ?? []);
            this.keep.set(total(offer.other) > total(offer.current) ? 'other' : 'current');
            return;
          }
          this.failure.set(
            this.describe(apiError?.code, apiError?.details?.['heldBy']),
          );
        },
      });
  }

  protected async merge(): Promise<void> {
    const offer = this.offer();
    if (!offer || this.merging() || !this.canMerge()) return;
    const confirmed = await this.dialog.confirm('Merge these accounts?', {
      message:
        "Only an admin can undo this. Everything from both accounts is combined, and both ways of signing in will open the merged account.",
      confirmLabel: 'Merge Accounts',
    });
    if (!confirmed) return;
    this.merging.set(true);
    this.discord
      .merge(offer.token, this.keep())
      .pipe(
        finalize(() => this.merging.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: ({ me }) => {
          this.roleService.setMe(me);
          void this.router.navigate(this.settingsLink, { replaceUrl: true });
        },
        error: (err) => this.mergeFailed(err),
      });
  }

  protected connectAgain(): void {
    if (this.connecting()) return;
    this.connecting.set(true);
    this.discord
      .begin(`/${SETTINGS_PATH}`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ url }) => this.discord.go(url),
        error: (err) => {
          this.connecting.set(false);
          this.offer.set(null);
          this.offerExpired.set(false);
          this.failure.set({
            kind: 'error',
            heading: "Couldn't Connect Discord",
            message: apiErrorMessage(
              err,
              'Could not start connecting Discord.',
            ),
          });
        },
      });
  }

  private mergeFailed(err: unknown): void {
    const apiError = toApiError(err);
    if (apiError?.code === DISCORD_ERROR.mergeOfferInvalid) {
      this.offerExpired.set(true);
      return;
    }
    if (apiError?.code === DISCORD_ERROR.mergeBlocked) {
      const list = apiError.details?.['blockers'];
      this.blockers.set(
        Array.isArray(list) ? list.map((item) => String(item)) : [],
      );
      if (this.blockers().length) return;
    }
    this.offer.set(null);
    this.failure.set({
      kind: 'error',
      heading: "Couldn't Merge Accounts",
      message: apiErrorMessage(err, 'Could not merge these accounts.'),
    });
  }

  private describe(code: string | undefined, heldBy?: unknown): Failure {
    switch (code) {
      case DISCORD_ERROR.alreadyConnected: {
        const holder = holderOf(heldBy);
        return {
          kind: 'no-access',
          heading: 'Discord Already Connected',
          message: `That Discord account is already connected to ${HOLDER_WAY[holder]}. ${HOLDER_ADVICE[holder]}`,
        };
      }
      case DISCORD_ERROR.stateInvalid:
        return {
          kind: 'error',
          heading: 'That Approval Expired',
          message:
            "That Discord approval expired or didn't start from this account. Start again from Settings.",
        };
      case DISCORD_ERROR.exchangeFailed:
        return {
          kind: 'error',
          heading: "Discord Didn't Confirm",
          message:
            "Discord didn't confirm the connection. Try again from Settings.",
        };
      case DISCORD_ERROR.notConfigured:
        return {
          kind: 'error',
          heading: 'Discord Is Not Available',
          message: "Connecting Discord isn't set up on this server yet.",
        };
      default:
        return FALLBACK;
    }
  }
}
