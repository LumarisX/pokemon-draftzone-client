import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';
import { LogoSmallSVG } from '../../images/svg-components/logo-small.component';
import { NewsCoreComponent } from '../news-core/news-core.component';

@Component({
  selector: 'homepage',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LogoSmallSVG,
    MatExpansionModule,
    MatButtonModule,
    MatDividerModule,
    NewsCoreComponent,
  ],
  styleUrl: './homepage.component.scss',
  templateUrl: './homepage.component.html',
})
export class HomeComponent {
  constructor() {}
}
