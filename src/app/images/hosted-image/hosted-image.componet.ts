import { CommonModule } from '@angular/common'; // Needed for [src], [alt] etc. if standalone
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'pdz-hosted-image',
  imports: [CommonModule],
  template: `<img
    [src]="hasError ? fallbackImageUrl : imageUrl"
    [alt]="effectiveAlt"
    [attr.width]="width"
    [attr.height]="height"
    [attr.loading]="loading"
    [class]="cssClass"
    (error)="handleError()"
  />`,
  styles: `
    :host {
      display: inline-block;
      line-height: 0;
    }

    img {
      display: block;
      max-width: 100%;
      height: auto;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HostedImageComponent {
  @Input({ required: true }) key!: string;
  @Input() alt: string = '';
  @Input() width?: string | number;
  @Input() height?: string | number;
  @Input() cssClass?: string;
  @Input() loading: 'eager' | 'lazy' = 'lazy';

  private readonly imageBaseUrl = environment.bucketUrl;
  public hasError = false;
  public fallbackImageUrl = 'assets/images/placeholder.png'; //TODO add later

  get imageUrl(): string {
    if (!this.key) {
      this.handleError();
      return '';
    }
    return `${this.imageBaseUrl}/${this.key}`;
  }

  get effectiveAlt(): string {
    return this.alt || `Image for ${this.key}`;
  }

  handleError(): void {
    this.hasError = true;
    console.warn(`Failed to load image from: ${this.imageUrl}`);
  }
}
