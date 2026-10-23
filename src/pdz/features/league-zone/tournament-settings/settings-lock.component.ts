import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SectionLock } from './settings-schema';

@Component({
  selector: 'pdz-settings-lock',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent],
  template: `
    <div class="lock" [class.lock--open]="!locked()">
      <pdz-icon
        class="lock__icon"
        [name]="locked() ? 'lock' : 'lock_open'"
        [size]="20"
        aria-hidden="true"
      />
      <p class="lock__text">
        {{ locked() ? spec().reason : spec().unlockedNote }}
      </p>
      @if (locked()) {
        <button
          pdz-button
          type="button"
          size="sm"
          variant="outlined"
          color="neutral"
          icon="lock_open"
          (click)="unlock.emit()"
        >
          Unlock
        </button>
      }
    </div>
  `,
  styleUrl: './settings-lock.component.scss',
})
export class SettingsLockComponent {
  readonly spec = input.required<SectionLock>();
  readonly locked = input.required<boolean>();
  readonly unlock = output<void>();
}
