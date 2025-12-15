import { Component } from '@angular/core';
import { LoadingComponent } from '../../images/loading/loading.component';

@Component({
  selector: 'debug-loading',
  templateUrl: './debug-loading.component.html',
  styleUrl: './debug-loading.component.scss',

  imports: [LoadingComponent],
})
export class DebugLoadingComponent {}
