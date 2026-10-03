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
export type TeamLogoTeam = 'team1' | 'team2';

@Component({
  selector: 'pdz-team-logo',
  template: `
    @if (src() && !failed()) {
      <img
        class="pdz-team-logo__img"
        loading="lazy"
        decoding="async"
        [src]="src()"
        [alt]="decorative() ? '' : label()"
        (error)="failed.set(true)"
      />
    } @else {
      <span
        class="pdz-team-logo__initials"
        [attr.role]="decorative() ? null : 'img'"
        [attr.aria-label]="decorative() ? null : label()"
        [attr.aria-hidden]="decorative() ? 'true' : null"
        >{{ initials() }}</span
      >
    }
  `,
  styleUrl: './team-logo.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-team-logo',
    '[attr.data-size]': 'size()',
    '[attr.data-shape]': 'shape()',
    '[attr.data-team]': 'team()',
  },
})
export class TeamLogoComponent {
  readonly src = input<string | null | undefined>();
  readonly name = input('');
  readonly size = input<TeamLogoSize>('md');
  readonly shape = input<TeamLogoShape>('rounded');
  readonly decorative = input(false, { transform: booleanAttribute });
  readonly team = input<TeamLogoTeam | null>(null);

  protected readonly failed = linkedSignal({
    source: this.src,
    computation: () => false,
  });

  protected readonly label = computed(() =>
    this.name() ? `${this.name()} logo` : 'Logo',
  );

  protected readonly initials = computed(() => {
    const words = this.name().trim().split(/\s+/).filter(Boolean);
    if (!words.length) return '?';
    const letters =
      words.length === 1 ? words[0].slice(0, 2) : words[0][0] + words[1][0];
    return letters.toUpperCase();
  });
}
