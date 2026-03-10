import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconComponent } from '../../images/icon/icon.component';
import { NewsCoreComponent } from '../news-core/news-core.component';

@Component({
  selector: 'pdz-homepage',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    NewsCoreComponent,
    IconComponent,
  ],
  styleUrl: './homepage.component.scss',
  templateUrl: './homepage.component.html',
})
export class HomeComponent {
  iconSize: number = 64;
}
