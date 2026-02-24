import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, of, shareReplay } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BooleanInput } from '@angular/cdk/coercion';

@Component({
  selector: 'pdz-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hasSvg) {
      <div
        [innerHTML]="svgIcon$ | async"
        class="icon-wrapper"
        [style.width.px]="computedWidth"
        [style.height.px]="computedHeight"
      ></div>
    } @else {
      <span
        class="material-symbols-outlined"
        [style.fontSize.px]="computedHeight ?? 24"
        [style.fontVariationSettings]="fontSettings"
        [attr.aria-label]="ariaLabel"
      >
        {{ name }}
      </span>
    }
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        vertical-align: middle;

        &[size='xs'] {
          --icon-size: 16px;
        }

        &[size='sm'] {
          --icon-size: 20px;
        }

        &[size='md'] {
          --icon-size: 24px;
        }

        &[size='lg'] {
          --icon-size: 32px;
        }

        &[size='xl'] {
          --icon-size: 48px;
        }
      }

      .icon-wrapper {
        display: inline-flex;
        align-items: center;
        justify-content: center;

        svg {
          display: block;
        }
      }
    `,
  ],
})
export class IconComponent implements OnChanges {
  private static svgCache = new Map<string, Observable<string>>();
  private readonly localSvgIcons = new Set<string>([
    'logo',
    'logo-small',
    'unknown',
    'tera',
  ]);

  @Input({ required: true }) name!: string;
  @Input() size: number | 'sm' | 'md' | 'lg' | 'xl' = 24;
  @Input() width?: number | 'sm' | 'md' | 'lg' | 'xl';
  @Input() height?: number | 'sm' | 'md' | 'lg' | 'xl';
  @Input() square: BooleanInput = false;

  @Input() weight: number = 400;
  @Input() fill: BooleanInput = false;
  @Input() grade: -25 | 0 | 200 = 0;
  @Input() opticalSize: number = 24;
  @Input() ariaLabel?: string;

  svgIcon$?: Observable<SafeHtml>;

  @ViewChild('svgContainer', { read: ViewContainerRef })
  svgContainer?: ViewContainerRef;

  get hasSvg(): boolean {
    return this.localSvgIcons.has(this.name);
  }

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) {}

  get computedWidth(): number | undefined {
    if (this.width !== undefined) {
      if (typeof this.width === 'number') return this.width;
      const sizeMap: Record<string, number> = {
        xs: 16,
        sm: 20,
        md: 24,
        lg: 32,
        xl: 48,
      };
      return sizeMap[this.width] || 24;
    }
    if (this.height !== undefined) {
      if (this.square) {
        if (typeof this.height === 'number') return this.height;
        const sizeMap: Record<string, number> = {
          xs: 16,
          sm: 20,
          md: 24,
          lg: 32,
          xl: 48,
        };
        return sizeMap[this.height] || 24;
      }
      return undefined;
    }
    if (typeof this.size === 'number') return this.size;
    const sizeMap: Record<string, number> = {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 32,
      xl: 48,
    };
    return sizeMap[this.size] || 24;
  }

  get computedHeight(): number | undefined {
    if (this.height !== undefined) {
      if (typeof this.height === 'number') return this.height;
      const sizeMap: Record<string, number> = {
        xs: 16,
        sm: 20,
        md: 24,
        lg: 32,
        xl: 48,
      };
      return sizeMap[this.height] || 24;
    }
    if (this.width !== undefined) {
      if (this.square) {
        if (typeof this.width === 'number') return this.width;
        const sizeMap: Record<string, number> = {
          xs: 16,
          sm: 20,
          md: 24,
          lg: 32,
          xl: 48,
        };
        return sizeMap[this.width] || 24;
      }
      return undefined;
    }
    if (typeof this.size === 'number') return this.size;
    const sizeMap: Record<string, number> = {
      xs: 16,
      sm: 20,
      md: 24,
      lg: 32,
      xl: 48,
    };
    return sizeMap[this.size] || 24;
  }

  get fontSettings(): string {
    return `'OPSZ' ${this.opticalSize}, 'wght' ${this.weight}, 'FILL' ${this.fill ? 1 : 0}, 'GRAD' ${this.grade}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['name'] && this.name) {
      if (this.hasSvg) {
        this.loadSvg();
      }
    }
  }

  private loadSvg(): void {
    const iconPath = `assets/icons/${this.name}.svg`;
    let svgSource$ = IconComponent.svgCache.get(this.name);
    if (!svgSource$) {
      svgSource$ = this.http
        .get(iconPath, { responseType: 'text' })
        .pipe(shareReplay(1));
      IconComponent.svgCache.set(this.name, svgSource$);
    }

    this.svgIcon$ = svgSource$.pipe(
      map((svg) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(svg, 'image/svg+xml');
        const svgElement = doc.querySelector('svg');

        if (svgElement) {
          if (this.computedWidth !== undefined) {
            svgElement.setAttribute('width', `${this.computedWidth}`);
          }
          if (this.computedHeight !== undefined) {
            svgElement.setAttribute('height', `${this.computedHeight}`);
          }
          svg = new XMLSerializer().serializeToString(svgElement);
        }

        return this.sanitizer.bypassSecurityTrustHtml(svg);
      }),
      catchError((err) => {
        console.error(`Could not load SVG icon: ${this.name}`, err);
        return of(this.sanitizer.bypassSecurityTrustHtml('<svg></svg>'));
      }),
    );
  }
}
