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
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { BooleanInput } from '@angular/cdk/coercion';

@Component({
  selector: 'pdz-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (hasSvg) {
      <div [innerHTML]="svgIcon$ | async" class="icon-wrapper"></div>
    } @else {
      <span
        class="material-symbols-outlined"
        [style.fontSize.px]="computedSize"
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
        display: contents;
      }
    `,
  ],
})
export class IconComponent implements OnChanges {
  /**
   * List of available local SVG icon names
   */
  private readonly localSvgIcons = new Set<string>([
    'logo',
    'logo-small',
    'unknown',
  ]);

  /**
   * Icon name (Material Symbol name or custom SVG key)
   */
  @Input({ required: true }) name!: string;

  /**
   * Icon size in pixels. Can also use preset sizes: 'sm' (16px), 'md' (24px), 'lg' (32px), 'xl' (48px)
   * @default 24
   */
  @Input() size: number | 'sm' | 'md' | 'lg' | 'xl' = 24;

  /**
   * Font weight for Material Symbols (100-700)
   * @default 400
   */
  @Input() weight: number = 400;

  /**
   * Fill for Material Symbols (0 or 1)
   * @default 0
   */
  @Input() fill: BooleanInput = false;

  /**
   * Grade for Material Symbols (-25, 0, 200)
   * @default 0
   */
  @Input() grade: -25 | 0 | 200 = 0;

  /**
   * Optical size for Material Symbols (20-48)
   * @default 24
   */
  @Input() opticalSize: number = 24;

  /**
   * ARIA label for accessibility
   */
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

  get computedSize(): number {
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
    this.svgIcon$ = this.http.get(iconPath, { responseType: 'text' }).pipe(
      map((svg) => this.sanitizer.bypassSecurityTrustHtml(svg)),
      catchError((err) => {
        console.error(`Could not load SVG icon: ${this.name}`, err);
        return of(this.sanitizer.bypassSecurityTrustHtml('<svg></svg>'));
      }),
    );
  }
}
