import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { ChangelogCoreComponent } from './changelog-core/changelog-core.component';
import { NewsCoreComponent } from './news-core/news-core.component';

@Component({
  selector: 'pdz-homepage',
  imports: [
    RouterModule,
    ReactiveFormsModule,
    NewsCoreComponent,
    ChangelogCoreComponent,
    IconComponent,
  ],
  styleUrl: './homepage.component.scss',
  templateUrl: './homepage.component.html',
})
export class HomeComponent {
  iconSize: number = 64;
}
