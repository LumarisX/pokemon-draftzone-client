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
      <img *ngIf="!terasShowing" src="../../../assets/icons/tera.svg" />
      <div
        *ngIf="terasShowing"
        class="absolute flex flex-col items-center max-h-36 overflow-y-auto scrollbar-tera"
      >
        <img
          *ngFor="let type of pokemon.capt?.tera"
          src="../../../assets/icons/tera_types/Tera{{ type }}.png"
          alt="{{ type }}"
        />
      </div>
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
