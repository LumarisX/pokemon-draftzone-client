import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDividerModule } from '@angular/material/divider';
import { RouterModule } from '@angular/router';
import { LogoSmallSVG } from '../../images/svg-components/logo-small.component';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';
import { NewsCoreComponent } from '../news/news-core.component';

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
