import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LogoSmallSVG } from '../../images/svg-components/logo-small.component';
import { NewsCoreComponent } from '../news/news-core.component';

@Component({
  selector: 'homepage',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    LogoSmallSVG,
    NewsCoreComponent,
  ],
  templateUrl: './homepage.component.html',
})
export class HomeComponent {
  constructor() {}
}
