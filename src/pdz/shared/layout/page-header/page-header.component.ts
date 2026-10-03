import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TeamLogoComponent } from '@pdz/shared/images/team-logo/team-logo.component';

export type PageHeaderTone = 'panel' | 'plain';

@Component({
  selector: 'pdz-page-header',
  imports: [RouterLink, IconComponent, TeamLogoComponent],
  template: `
    <div class="pdz-page-header__bar">
      @if (logo(); as src) {
        <pdz-team-logo
          class="pdz-page-header__logo"
          size="lg"
          decorative
          [src]="src"
          [name]="title()"
        />
      }

      <div class="pdz-page-header__text">
        @if (backLink(); as link) {
          <a
            class="pdz-page-header__eyebrow pdz-page-header__eyebrow--link"
            [routerLink]="link"
          >
            <pdz-icon name="arrow_back" [size]="14" aria-hidden="true" />
            <span>{{ backLabel() }}</span>
          </a>
        } @else if (eyebrow(); as eyebrow) {
          <span class="pdz-page-header__eyebrow">{{ eyebrow }}</span>
        }
        <h1 class="pdz-page-header__title">{{ title() }}</h1>
        <div class="pdz-page-header__detail">
          <ng-content select="[pdz-page-header-detail]" />
        </div>
        @if (subtitle(); as subtitle) {
          <p class="pdz-page-header__subtitle">{{ subtitle }}</p>
        }
      </div>

      <div class="pdz-page-header__center">
        <ng-content select="[pdz-page-header-center]" />
      </div>

      <div class="pdz-page-header__meta">
        <ng-content select="[pdz-page-header-meta]" />
      </div>

      <div class="pdz-page-header__actions">
        <ng-content select="[pdz-page-header-actions]" />
      </div>
    </div>

    <div class="pdz-page-header__extra">
      <ng-content />
    </div>
  `,
  styleUrl: './page-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-page-header',
    '[attr.data-tone]': 'tone()',
    '[class.pdz-page-header--compact]': 'compact()',
    '[class.pdz-page-header--wash]': 'wash()',
  },
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly eyebrow = input<string>();
  readonly subtitle = input<string>();

  readonly backLink = input<string | unknown[]>();
  readonly backLabel = input('Back');

  readonly logo = input<string>();

  readonly tone = input<PageHeaderTone>('plain');
  readonly compact = input(false, { transform: booleanAttribute });
  readonly wash = input(false, { transform: booleanAttribute });
}
