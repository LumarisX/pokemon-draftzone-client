import { Component, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { svgIconPaths } from '@pdz/shared/images/icon/icon.component';
import { ErrorComponent } from './layout/error/error.component';
import { TopNavbarComponent } from './layout/top-navbar/top-navbar.component';
import { TooltipComponent } from './shared/tooltip/tooltip.component';

@Component({
  selector: 'pdz-root',
  templateUrl: './pdz.component.html',
  styleUrl: './pdz.component.scss',
  imports: [RouterOutlet, TopNavbarComponent, ErrorComponent, TooltipComponent],
})
export class PDZComponent {
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);
  constructor() {
    const matIconRegistry = this.matIconRegistry;
    const domSanitizer = this.domSanitizer;

    Object.entries(svgIconPaths).forEach(([name, path]) => {
      matIconRegistry.addSvgIcon(
        name,
        domSanitizer.bypassSecurityTrustResourceUrl(path),
      );
    });
    matIconRegistry.setDefaultFontSetClass('material-symbols-outlined');
  }
}
