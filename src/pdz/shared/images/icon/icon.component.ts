import { CommonModule } from '@angular/common';
import {
  booleanAttribute,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ViewContainerRef,
  input,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, of, shareReplay } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

const svgIconPaths: Readonly<Record<string, string>> = {
  logo: 'assets/icons/logo.svg',
  'logo-small': 'assets/icons/logo-small.svg',
  unknown: 'assets/icons/unknown.svg',
  tera: 'assets/icons/tera.svg',
  z: 'assets/icons/z.svg',
  shiny: 'assets/icons/shiny.svg',
  capt: 'assets/icons/capt.svg',
  dmax: 'assets/icons/dmax.svg',
  pokeball: 'assets/icons/pokeball.svg',
  xmark: 'assets/icons/xmark.svg',
  'right-arrow': 'assets/icons/right-arrow.svg',
  gear: 'assets/icons/gear.svg',
  gearalt: 'assets/icons/gearalt.svg',
  pdollar: 'assets/icons/pdollar.svg',
  discord: 'assets/icons/media/discord-mark-blue.svg',
  github: 'assets/icons/media/github-mark.svg',
  'type-bug': 'assets/icons/types/gen9icon/Bug.svg',
  'type-dark': 'assets/icons/types/gen9icon/Dark.svg',
  'type-dragon': 'assets/icons/types/gen9icon/Dragon.svg',
  'type-electric': 'assets/icons/types/gen9icon/Electric.svg',
  'type-fairy': 'assets/icons/types/gen9icon/Fairy.svg',
  'type-fighting': 'assets/icons/types/gen9icon/Fighting.svg',
  'type-fire': 'assets/icons/types/gen9icon/Fire.svg',
  'type-flying': 'assets/icons/types/gen9icon/Flying.svg',
  'type-ghost': 'assets/icons/types/gen9icon/Ghost.svg',
  'type-grass': 'assets/icons/types/gen9icon/Grass.svg',
  'type-ground': 'assets/icons/types/gen9icon/Ground.svg',
  'type-ice': 'assets/icons/types/gen9icon/Ice.svg',
  'type-normal': 'assets/icons/types/gen9icon/Normal.svg',
  'type-poison': 'assets/icons/types/gen9icon/Poison.svg',
  'type-psychic': 'assets/icons/types/gen9icon/Psychic.svg',
  'type-rock': 'assets/icons/types/gen9icon/Rock.svg',
  'type-steel': 'assets/icons/types/gen9icon/Steel.svg',
  'type-water': 'assets/icons/types/gen9icon/Water.svg',
  physical: 'assets/icons/moves/physical.svg',
  special: 'assets/icons/moves/special.svg',
  status: 'assets/icons/moves/status.svg',
};

export type IconSizeName = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
export type IconSize = number | IconSizeName;

const SIZE_MAP: Readonly<Record<IconSizeName, number>> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
  xl: 48,
};

const DEFAULT_SIZE = SIZE_MAP.md;

function toPixels(size: IconSize): number {
  return typeof size === 'number' ? size : (SIZE_MAP[size] ?? DEFAULT_SIZE);
}

@Component({
  selector: 'pdz-icon',
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
        [attr.aria-label]="ariaLabel()"
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
  private static readonly localSvgIconPaths = svgIconPaths;

  private _name!: string;
  @Input({ required: true })
  set name(value: string) {
    this._name = value.toLowerCase();
  }

  get name(): string {
    return this._name;
  }

  readonly size = input<IconSize>(24);
  readonly width = input<IconSize>();
  readonly height = input<IconSize>();
  readonly square = input(false, { transform: booleanAttribute });

  readonly weight = input<number>(400);
  readonly fill = input(false, { transform: booleanAttribute });
  readonly grade = input<-25 | 0 | 200>(0);
  readonly opticalSize = input<number>(24);
  readonly ariaLabel = input<string>();

  svgIcon$?: Observable<SafeHtml>;

  @ViewChild('svgContainer', { read: ViewContainerRef })
  svgContainer?: ViewContainerRef;

  get hasSvg(): boolean {
    return IconComponent.localSvgIconPaths[this.name] !== undefined;
  }

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer,
  ) {}

  get computedWidth(): number | undefined {
    return this.resolveAxis(this.width(), this.height());
  }

  get computedHeight(): number | undefined {
    return this.resolveAxis(this.height(), this.width());
  }

  private resolveAxis(own?: IconSize, other?: IconSize): number | undefined {
    if (own !== undefined) return toPixels(own);
    if (other !== undefined) {
      return this.square() ? toPixels(other) : undefined;
    }
    return toPixels(this.size());
  }

  get fontSettings(): string {
    return `'OPSZ' ${this.opticalSize()}, 'wght' ${this.weight()}, 'FILL' ${this.fill() ? 1 : 0}, 'GRAD' ${this.grade()}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['name'] && this.name) {
      if (this.hasSvg) {
        this.loadSvg();
      }
    }
  }

  private loadSvg(): void {
    const iconPath = IconComponent.localSvgIconPaths[this.name];
    if (!iconPath) {
      return;
    }

    let svgSource$ = IconComponent.svgCache.get(iconPath);
    if (!svgSource$) {
      svgSource$ = this.http
        .get(iconPath, { responseType: 'text' })
        .pipe(shareReplay(1));
      IconComponent.svgCache.set(iconPath, svgSource$);
    }

    this.svgIcon$ = svgSource$.pipe(
      map((svg) => this.applySize(svg)),
      catchError((err) => {
        console.error(`Could not load SVG icon: ${this.name}`, err);
        return of(this.sanitizer.bypassSecurityTrustHtml('<svg></svg>'));
      }),
    );
  }

  private applySize(svg: string): SafeHtml {
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
  }
}
