import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { RiskSpec } from './settings-schema';

@Component({
  selector: 'pdz-risk-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  template: `
    @if (risk(); as spec) {
      <div class="risk" [class.risk--block]="spec.effect === 'block'">
        <pdz-icon
          [name]="spec.effect === 'block' ? 'warning' : 'info'"
          [size]="20"
          aria-hidden="true"
        />
        <div class="risk__body">
          <p class="risk__title">
            {{
              spec.effect === "block"
                ? "These settings are live"
                : "Heads up"
            }}
          </p>
          <p class="risk__because">{{ spec.because }}</p>
        </div>
      </div>
    }
  `,
  styleUrl: './risk-banner.component.scss',
})
export class RiskBannerComponent {
  readonly risk = input<RiskSpec | null>(null);
}
