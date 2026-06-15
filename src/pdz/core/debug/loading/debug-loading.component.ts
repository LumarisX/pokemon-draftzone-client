import { Component } from '@angular/core';
import { LoadingComponent } from '@pdz/shared/images/loading/loading.component';

@Component({
  selector: 'pdz-debug-loading',
  templateUrl: './debug-loading.component.html',
  styleUrl: './debug-loading.component.scss',

  imports: [LoadingComponent],
})
export class DebugLoadingComponent {}
