import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RouterModule } from '@angular/router';
import { PokemonSelectComponent } from '../../util/pokemon-select/pokemon-select.component';

@Component({
  selector: 'debug-components',
  standalone: true,
  templateUrl: './debug-components.component.html',
  styleUrl: './debug-component.component.scss',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatButtonModule,
    RouterModule,
    PokemonSelectComponent,
  ],
})
export class DebugComponentsComponent {
  constructor() {}
}
