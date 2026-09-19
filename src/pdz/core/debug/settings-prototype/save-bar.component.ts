import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';

@Component({
  selector: 'pdz-save-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, IconComponent],
  template: `
    @if (count()) {
      <div class="bar">
        <span class="bar__status">
          <pdz-icon name="edit" [size]="16" aria-hidden="true" />
          {{ count() }} unsaved {{ count() === 1 ? "change" : "changes" }}
        </span>
        <div class="bar__actions">
          <button
            pdz-button
            type="button"
            size="sm"
            variant="ghost"
            color="neutral"
            (click)="revert.emit()"
          >
            Revert
          </button>
          <button
            pdz-button
            type="button"
            size="sm"
            [disabled]="blocked()"
            (click)="save.emit()"
          >
            {{ label() }}
          </button>
        </div>
      </div>
    }
  `,
  styleUrl: './save-bar.component.scss',
})
export class SaveBarComponent {
  readonly count = input(0);
  readonly blocked = input(false);
  readonly label = input('Save changes');

  readonly save = output<void>();
  readonly revert = output<void>();
}
