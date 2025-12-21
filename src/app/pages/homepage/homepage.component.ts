
import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../images/icon/icon.component';
import { NewsCoreComponent } from '../news-core/news-core.component';

@Component({
  selector: 'homepage',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    MatExpansionModule,
    MatButtonModule,
    MatDividerModule,
    NewsCoreComponent,
    IconComponent
],
  styleUrl: './homepage.component.scss',
  templateUrl: './homepage.component.html',
})
export class HomeComponent {
  constructor() {}
}
