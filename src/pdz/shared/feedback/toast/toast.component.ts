import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  input,
  numberAttribute,
  output,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { ToastTone } from './toast.service';

const TONE_ICONS: Record<ToastTone, string> = {
  success: 'check_circle',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

@Component({
  selector: 'pdz-toast',
  imports: [ButtonComponent, IconComponent],
  template: `
    <pdz-icon
      class="pdz-toast__icon"
      aria-hidden="true"
      [name]="icon()"
      size="sm"
    />
    <div class="pdz-toast__body">
      @if (heading()) {
        <p class="pdz-toast__heading">{{ heading() }}</p>
      }
      @if (message()) {
        <p class="pdz-toast__message">{{ message() }}</p>
      }
      <ng-content />
    </div>
    @if (actionLabel()) {
      <button
        pdz-button
        class="pdz-toast__action"
        variant="ghost"
        color="neutral"
        size="sm"
        (click)="action.emit()"
      >
        {{ actionLabel() }}
      </button>
    }
    @if (dismissible()) {
      <button
        pdz-button
        class="pdz-toast__close"
        variant="ghost"
        color="neutral"
        size="sm"
        iconOnly
        pill
        [attr.aria-label]="dismissLabel()"
        (click)="dismissed.emit()"
      >
        @if (countdown()) {
          <svg class="pdz-toast__timer" viewBox="0 0 24 24" aria-hidden="true">
            <circle class="pdz-toast__timer-track" cx="12" cy="12" r="10.5" />
            <circle
              class="pdz-toast__timer-sweep"
              cx="12"
              cy="12"
              r="10.5"
              [style.animation-duration.ms]="duration()"
            />
          </svg>
        }
        <pdz-icon name="xmark" [size]="12" />
      </button>
    }
  `,
  styleUrl: './toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'pdz-toast',
    '[attr.data-tone]': 'tone()',
    '[class.pdz-toast--leaving]': 'leaving()',
    '[attr.role]': 'assertive() ? "alert" : "status"',
  },
})
export class ToastComponent {
  tone = input<ToastTone>('info');
  heading = input<string>();
  message = input<string>();
  actionLabel = input<string>();
  dismissible = input(true, { transform: booleanAttribute });
  leaving = input(false, { transform: booleanAttribute });
  duration = input(0, { transform: numberAttribute });

  action = output<void>();
  dismissed = output<void>();

  protected icon = computed(() => TONE_ICONS[this.tone()]);
  protected assertive = computed(
    () => this.tone() === 'error' || this.tone() === 'warning',
  );
  protected countdown = computed(() => this.duration() > 0 && !this.leaving());
  protected dismissLabel = computed(() =>
    this.countdown()
      ? 'Dismiss notification, dismisses automatically'
      : 'Dismiss notification',
  );
}
