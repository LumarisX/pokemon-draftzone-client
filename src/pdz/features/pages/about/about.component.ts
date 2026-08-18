import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PageComponent } from '@pdz/shared/layout/page/page.component';

@Component({
  selector: 'pdz-about',
  imports: [RouterModule, PageComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
})
export class AboutComponent {
  constructor() {}
}
