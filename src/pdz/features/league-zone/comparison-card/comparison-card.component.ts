import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  signal,
  input,
} from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { getLogoUrl } from '../league.util';

export interface ComparisonEntity {
  logoUrl?: string;
  primaryName: string;
  secondaryName?: string;
}

export interface StatusEntity {
  label: string;
  active?: boolean;
  link?: string;
}

@Component({
  selector: 'pdz-comparison-card',
  imports: [CommonModule, IconComponent],
  templateUrl: './comparison-card.component.html',
  styleUrls: ['./comparison-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparisonCardComponent implements OnInit {
  readonly entityLeft = input.required<ComparisonEntity>();
  readonly entityRight = input.required<ComparisonEntity>();
  readonly entityLeftLogoClasses = input<string | Record<string, boolean>>({});
  readonly entityRightLogoClasses = input<string | Record<string, boolean>>({});
  readonly centerText = input<string | null>(null);
  readonly centerIcon = input<string | null>(null);
  readonly allowToggle = input<boolean>(true);
  readonly initiallyOpen = input<boolean>(false);
  readonly status = input<StatusEntity>();

  private _isOpen = signal<boolean>(false);
  isOpen = this._isOpen.asReadonly();

  ngOnInit(): void {
    this._isOpen.set(this.initiallyOpen());
  }

  toggleOpen(): void {
    if (this.allowToggle()) {
      this._isOpen.update((open) => !open);
    }
  }

  getLogo(entity: ComparisonEntity): string {
    return getLogoUrl(entity.logoUrl);
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
