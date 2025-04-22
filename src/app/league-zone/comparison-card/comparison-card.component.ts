import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export interface ComparisonEntity {
  logoUrl: string;
  primaryName: string;
  secondaryName?: string;
  defaultLogo?: string;
}

export interface StatusEntity {
  label: string;
  active?: boolean;
  link?: string;
}

@Component({
  selector: 'pdz-comparison-card',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './comparison-card.component.html',
  styleUrls: ['./comparison-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComparisonCardComponent implements OnInit {
  @Input({ required: true }) entityLeft!: ComparisonEntity;
  @Input({ required: true }) entityRight!: ComparisonEntity;
  @Input() entityLeftLogoClasses: string | Record<string, boolean> = {};
  @Input() entityRightLogoClasses: string | Record<string, boolean> = {};
  @Input() centerText: string | null = null;
  @Input() centerIcon: string | null = null;
  @Input() allowToggle: boolean = true;
  @Input() initiallyOpen: boolean = false;
  @Input() status?: StatusEntity;

  private _isOpen = signal<boolean>(false);
  isOpen = this._isOpen.asReadonly();

  ngOnInit(): void {
    this._isOpen.set(this.initiallyOpen);
  }

  toggleOpen(): void {
    if (this.allowToggle) {
      this._isOpen.update((open) => !open);
    }
  }

  getLogo(entity: ComparisonEntity): string {
    return entity.logoUrl || entity.defaultLogo || '';
  }

  stopPropagation(event: Event): void {
    event.stopPropagation();
  }
}
