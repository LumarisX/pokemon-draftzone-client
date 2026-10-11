import { AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Observable, of, shareReplay } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
const svgCache = new Map<string, Observable<string>>();

function toPixels(size: IconSize): number {
  return typeof size === 'number' ? size : (SIZE_MAP[size] ?? DEFAULT_SIZE);
}

@Component({
  selector: 'pdz-icon',
  imports: [AsyncPipe],
  template: `
    @if (svg(); as svg$) {
      <span
        class="pdz-icon__svg"
        [innerHTML]="svg$ | async"
        [style.width.px]="width()"
        [style.height.px]="height()"
        [attr.role]="ariaLabel() ? 'img' : null"
        [attr.aria-label]="ariaLabel() ?? null"
        [attr.aria-hidden]="ariaLabel() ? null : 'true'"
      ></span>
    } @else {
      <span
        class="material-symbols-outlined pdz-icon__glyph"
        [style.fontSize.px]="height() ?? DEFAULT_SIZE"
        [attr.role]="ariaLabel() ? 'img' : null"
        [attr.aria-label]="ariaLabel() ?? null"
        [attr.aria-hidden]="ariaLabel() ? null : 'true'"
        >{{ name() }}</span
      >
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
    }

    .pdz-icon__svg {
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .pdz-icon__svg svg {
      display: block;
    }

    .pdz-icon__glyph {
      font-variation-settings:
        'FILL' var(--pdz-icon-fill, 0),
        'wght' var(--pdz-icon-weight, 400),
        'GRAD' var(--pdz-icon-grade, 0);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[style.--pdz-icon-fill]': 'fill() ? 1 : null',
    '[style.--pdz-icon-weight]': 'weight() ?? null',
    '[style.--pdz-icon-grade]': 'grade() ?? null',
  },
})
export class IconComponent {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);
  protected readonly DEFAULT_SIZE = DEFAULT_SIZE;

  readonly name = input.required<string, string>({
    transform: (value) => value.toLowerCase(),
  });
  readonly size = input<IconSize>(24);
  readonly widthInput = input<IconSize | undefined>(undefined, {
    alias: 'width',
  });
  readonly heightInput = input<IconSize | undefined>(undefined, {
    alias: 'height',
  });
  readonly square = input(false, { transform: booleanAttribute });
  readonly weight = input<number>();
  readonly fill = input(false, { transform: booleanAttribute });
  readonly grade = input<-25 | 0 | 200>();
  readonly ariaLabel = input<string>();

  protected readonly width = computed(() =>
    this.resolveAxis(this.widthInput(), this.heightInput()),
  );
  protected readonly height = computed(() =>
    this.resolveAxis(this.heightInput(), this.widthInput()),
  );

  protected readonly svg = computed(() => {
    const path = svgIconPaths[this.name()];
    if (!path) return null;
    const width = this.width();
    const height = this.height();
    return this.source(path).pipe(
      map((svg) => this.applySize(svg, width, height)),
      catchError(() =>
        of(this.sanitizer.bypassSecurityTrustHtml('<svg></svg>')),
      ),
    );
  });

  private resolveAxis(own?: IconSize, other?: IconSize): number | undefined {
    if (own !== undefined) return toPixels(own);
    if (other !== undefined) {
      return this.square() ? toPixels(other) : undefined;
    }
    return toPixels(this.size());
  }

  private source(path: string): Observable<string> {
    let source$ = svgCache.get(path);
    if (!source$) {
      source$ = this.http
        .get(path, { responseType: 'text' })
        .pipe(shareReplay(1));
      svgCache.set(path, source$);
    }
    return source$;
  }

  private applySize(
    svg: string,
    width: number | undefined,
    height: number | undefined,
  ): SafeHtml {
    const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
    const element = doc.querySelector('svg');
    if (element) {
      if (width !== undefined) element.setAttribute('width', `${width}`);
      if (height !== undefined) element.setAttribute('height', `${height}`);
      svg = new XMLSerializer().serializeToString(element);
    }
    return this.sanitizer.bypassSecurityTrustHtml(svg);
  }
}
