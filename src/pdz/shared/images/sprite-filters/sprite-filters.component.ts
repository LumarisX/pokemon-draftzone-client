import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'pdz-sprite-filters',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg width="0" height="0" aria-hidden="true" focusable="false">
      <defs>
        <filter id="borderFilter">
          <feMorphology
            operator="dilate"
            radius=".5"
            in="SourceAlpha"
            result="border"
          />
          <feFlood flood-color="#64748b" result="borderColor" />
          <feComposite
            in="borderColor"
            in2="border"
            operator="in"
            result="coloredBorder"
          />
          <feMerge>
            <feMergeNode in="coloredBorder" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id="silhouetteOutlineFilter">
          <feMorphology
            operator="dilate"
            radius="1"
            in="SourceAlpha"
            result="dilated"
          />
          <feComposite
            operator="out"
            in="dilated"
            in2="SourceAlpha"
            result="ring"
          />
          <feFlood flood-color="#64748b" result="color" />
          <feComposite
            in="color"
            in2="ring"
            operator="in"
            result="coloredRing"
          />
          <feComposite
            in="color"
            in2="SourceAlpha"
            operator="in"
            result="coloredFill"
          />
          <feComponentTransfer in="coloredFill" result="subtleFill">
            <feFuncA type="linear" slope="0.2" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="subtleFill" />
            <feMergeNode in="coloredRing" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  `,
  styles: `
    :host {
      position: absolute;
      width: 0;
      height: 0;
    }
  `,
})
export class SpriteFiltersComponent {}
