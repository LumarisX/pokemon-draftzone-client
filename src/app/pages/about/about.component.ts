
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'about',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './about.component.html',
})
export class AboutComponent {
  constructor() {}
}
