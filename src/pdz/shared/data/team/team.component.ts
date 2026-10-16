import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  TeamLogoComponent,
  TeamLogoSize,
} from '@pdz/shared/images/team-logo/team-logo.component';

export type TeamSize = 'inline' | 'row' | 'card' | 'hero';
export type TeamAlign = 'start' | 'end';

const LOGO_SIZES: Record<TeamSize, TeamLogoSize> = {
  inline: 'xs',
  row: 'sm',
  card: 'lg',
  hero: 'xl',
};

@Component({
  selector: 'pdz-team',
  imports: [RouterLink, TeamLogoComponent],
  template: `
    @if (showLogo()) {
      <pdz-team-logo
        class="pdz-team__logo"
        decorative
        [size]="logoSize()"
        [src]="logo()"
        [name]="name()"
      />
    }
    <span class="pdz-team__text">
      <span
        class="pdz-team__title"
        [attr.role]="headingLevel() ? 'heading' : null"
        [attr.aria-level]="headingLevel()"
      >
        @if (link(); as link) {
          <a
            class="pdz-team__name pdz-team__name--link"
            [routerLink]="link"
            [title]="name()"
            >{{ name() }}</a
          >
        } @else {
          <span class="pdz-team__name" [title]="name()">{{ name() }}</span>
        }
      </span>
      @if (coach() && size() !== 'inline') {
        <span class="pdz-team__coach">{{ coach() }}</span>
      }
      <ng-content select="[pdz-team-meta]" />
    </span>
  `,
  styleUrl: './team.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-team',
    '[attr.data-size]': 'size()',
    '[attr.data-align]': 'align()',
  },
})
export class TeamComponent {
  readonly name = input.required<string>();
  readonly logo = input<string | null | undefined>();
  readonly showLogo = input(true, { transform: booleanAttribute });
  readonly coach = input<string | null | undefined>();
  readonly link = input<readonly unknown[] | string | null | undefined>();
  readonly size = input<TeamSize>('row');
  readonly align = input<TeamAlign>('start');
  readonly headingLevel = input<2 | 3 | 4 | null>(null);

  protected readonly logoSize = computed(() => LOGO_SIZES[this.size()]);
}
