import { ChangeDetectionStrategy, Component, input } from '@angular/core';

let nextId = 0;

@Component({
  selector: 'pdz-dashboard-section',
  template: `
    <section class="section" [attr.aria-labelledby]="headingId">
      <div class="section__header">
        <h2 class="section__title" [id]="headingId">
          {{ heading() }}
          @if (count() !== null) {
            <span class="section__count">{{ count() }}</span>
          }
        </h2>
        <ng-content select="[pdz-dashboard-section-action]" />
      </div>
      <ng-content />
    </section>
  `,
  styleUrl: './dashboard-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DashboardSectionComponent {
  readonly heading = input.required<string>();
  readonly count = input<number | null>(null);

  protected readonly headingId = `pdz-dashboard-section-${nextId++}`;
}
