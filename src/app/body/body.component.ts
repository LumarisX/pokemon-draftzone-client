
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ErrorComponent } from '../error/error.component';

@Component({
  selector: 'pdz-body',
  standalone: true,
  imports: [RouterModule, ErrorComponent],
  templateUrl: './body.component.html',
})
export class BodyComponent {
  constructor() {}
}
