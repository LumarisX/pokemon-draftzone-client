import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CommonModule } from '@angular/common';

@Component({
  imports: [CommonModule],
  selector: 'pdz-icon',
  template: `<div [innerHTML]="svgIcon$ | async" class="icon-wrapper"></div>`,
  styles: [
    `
      :host {
        display: inline-flex;

        align-items: center;
        justify-content: center;

        width: 24px;
        height: 24px;
      }
      .icon-wrapper {
        display: contents;
      }
    `,
  ],
})
export class IconComponent implements OnChanges {
  @Input({ required: true }) name!: string;
  svgIcon$?: Observable<SafeHtml>;

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['name'] && this.name) {
      const iconPath = `assets/icons/${this.name}.svg`;
      this.svgIcon$ = this.http.get(iconPath, { responseType: 'text' }).pipe(
        map((svg) => this.sanitizer.bypassSecurityTrustHtml(svg)),
        catchError((err) => {
          console.error(`Could not load SVG icon: ${this.name}`, err);
          return of(this.sanitizer.bypassSecurityTrustHtml('<svg></svg>'));
        }),
      );
    }
  }
}
