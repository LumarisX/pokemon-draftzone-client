import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TeamLogoComponent } from '@pdz/shared/images/team-logo/team-logo.component';

@Component({
  selector: 'li[pdz-dashboard-row]',
  imports: [RouterLink, IconComponent, TeamLogoComponent],
  template: `
    <a class="row__link" [routerLink]="link()">
      @if (showLogo()) {
        <pdz-team-logo decorative size="sm" [src]="logo()" [name]="name()" />
      }
      <span class="row__text">
        <span class="row__name">{{ name() }}</span>
        @if (meta(); as meta) {
          <span class="row__meta">{{ meta }}</span>
        }
      </span>
      @if (status(); as status) {
        <span class="row__status">{{ status }}</span>
      }
      @if (chevron()) {
        <pdz-icon
          class="row__chevron"
          name="chevron_right"
          size="sm"
          aria-hidden="true"
        />
      }
    </a>
    <ng-content />
  `,
  styleUrl: './dashboard-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardRowComponent {
  readonly name = input.required<string>();
  readonly link = input.required<unknown[]>();
  readonly meta = input<string | null>(null);
  readonly status = input<string | null>(null);
  readonly logo = input<string | null | undefined>();
  readonly showLogo = input(false, { transform: booleanAttribute });
  readonly chevron = input(true, { transform: booleanAttribute });
}
