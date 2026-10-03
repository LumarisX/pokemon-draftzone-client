import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PageComponent } from '@pdz/shared/layout/page/page.component';

@Component({
  selector: 'pdz-tier-list-shell',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PageComponent, RouterOutlet],
  template: `<pdz-page width="full" fill><router-outlet /></pdz-page>`,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
        min-height: 0;
      }
    `,
  ],
})
export class TierListShellComponent {}
