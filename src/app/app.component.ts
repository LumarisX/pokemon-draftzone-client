import { Component, inject } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { svgIcons } from './images/icons';

@Component({
  selector: 'pdz-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  standalone: false,
})
export class AppComponent {
  private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);
  constructor() {
    const matIconRegistry = this.matIconRegistry;
    const domSanitizer = this.domSanitizer;

    Object.entries(svgIcons).forEach(([name, data]) => {
      matIconRegistry.addSvgIconLiteral(
        name,
        domSanitizer.bypassSecurityTrustHtml(data),
      );
      matIconRegistry.setDefaultFontSetClass('material-symbols-outlined');
    });
  }
}
