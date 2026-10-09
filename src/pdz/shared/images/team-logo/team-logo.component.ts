import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  linkedSignal,
} from '@angular/core';

export type TeamLogoSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
export type TeamLogoShape = 'rounded' | 'circle';

export const DEFAULT_TEAM_LOGO = '/assets/images/battle-zone/default_logo.png';

@Component({
  selector: 'pdz-team-logo',
  template: `
    <img
      class="pdz-team-logo__img"
      loading="lazy"
      decoding="async"
      [src]="resolvedSrc()"
      [alt]="decorative() ? '' : label()"
      (error)="failed.set(true)"
    />
  `,
  styleUrl: './team-logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-team-logo',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
  },
})
export class TeamLogoComponent {
  readonly src = input<string | null | undefined>();
  readonly name = input('');
  readonly size = input<TeamLogoSize>('md');
  readonly shape = input<TeamLogoShape>('rounded');
  readonly decorative = input(false, { transform: booleanAttribute });

  protected readonly failed = linkedSignal({
    source: this.src,
    computation: () => false,
  });

  protected readonly resolvedSrc = computed(() => {
    const src = this.src();
    return src && !this.failed() ? src : DEFAULT_TEAM_LOGO;
  });

  protected readonly label = computed(() =>
    this.name() ? `${this.name()} logo` : 'Logo',
  );
}
