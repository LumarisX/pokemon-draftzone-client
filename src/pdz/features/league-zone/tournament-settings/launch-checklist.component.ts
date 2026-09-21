import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TournamentSettingsStore } from './tournament-settings.store';

@Component({
  selector: 'pdz-launch-checklist',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CardComponent, IconComponent, RouterLink],
  template: `
    <pdz-card padding="lg" tone="lowest">
      <div class="checklist__head">
        <div>
          <h2 class="checklist__title">Getting set up</h2>
          <p class="checklist__sub">
            {{ doneCount() }} of {{ totalCount() }} done
          </p>
        </div>
        <div
          class="checklist__meter"
          [attr.aria-label]="doneCount() + ' of ' + totalCount() + ' complete'"
        >
          <span class="checklist__meter-fill" [style.width.%]="percent()"></span>
        </div>
      </div>

      @for (group of groups(); track group.milestone) {
        <section
          class="checklist__group"
          [class.checklist__group--done]="group.complete"
        >
          <h3 class="checklist__group-title">
            @if (group.complete) {
              <pdz-icon name="check_circle" [size]="18" aria-hidden="true" />
            }
            {{ group.label }}
          </h3>
          <ul class="checklist__items">
            @for (item of group.items; track item.id) {
              <li
                class="checklist__item"
                [class.checklist__item--done]="item.done"
              >
                <pdz-icon
                  [name]="item.done ? 'check_circle' : 'radio_button_unchecked'"
                  [size]="18"
                  aria-hidden="true"
                />
                <a [routerLink]="item.path" [fragment]="item.fragment">
                  {{ item.label }}
                </a>
              </li>
            }
          </ul>
        </section>
      }
    </pdz-card>
  `,
  styleUrl: './launch-checklist.component.scss',
})
export class LaunchChecklistComponent {
  private readonly store = inject(TournamentSettingsStore);

  protected readonly groups = computed(() => this.store.checklist());

  private readonly allItems = computed(() =>
    this.groups().flatMap((group) => group.items),
  );

  protected readonly totalCount = computed(() => this.allItems().length);
  protected readonly doneCount = computed(
    () => this.allItems().filter((item) => item.done).length,
  );
  protected readonly percent = computed(() =>
    this.totalCount() ? (this.doneCount() / this.totalCount()) * 100 : 0,
  );
}
