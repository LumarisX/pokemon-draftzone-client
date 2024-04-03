import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { Pokemon } from '../interfaces/draft';

@Component({
  selector: 'tera',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="relative flex justify-center items-center"
      (mouseover)="terasShowing = true"
      (mouseleave)="terasShowing = false"
    >
      <ng-container
        *ngIf="
          terasShowing &&
            pokemon.capt &&
            pokemon.capt.tera &&
            pokemon.capt.tera.length > 0;
          else types
        "
      >
        <div
          class="absolute flex flex-col items-center max-h-36 overflow-y-auto scrollbar-tera"
        >
          <img
            *ngFor="let type of pokemon.capt?.tera"
            src="../../../assets/icons/tera_types/Tera{{ type }}.png"
            alt="{{ type }}"
          />
        </div>
      </ng-container>
      <ng-template #types>
        <img src="../../../assets/icons/tera.svg" />
      </ng-template>
    </div>
  `,
})
export class TeraComponent {
  @Input() pokemon!: Pokemon;
  terasShowing: boolean = false;

  showTeras() {
    this.terasShowing = true;
    setTimeout(() => {
      this.terasShowing = false;
    }, 1000);
  }
}
