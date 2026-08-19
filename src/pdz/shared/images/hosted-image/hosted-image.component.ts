// Needed for [src], [alt] etc. if standalone
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { environment } from '@pdz/environments/environment';

@Component({
  selector: 'pdz-hosted-image',
  imports: [],
  template: `<img
    [src]="hasError ? fallbackImageUrl : imageUrl"
    [alt]="effectiveAlt"
    [attr.width]="width()"
    [attr.height]="height()"
    [attr.loading]="loading()"
    [class]="cssClass()"
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
  readonly key = input.required<string>();
  readonly alt = input<string>('');
  readonly width = input<string | number>();
  readonly height = input<string | number>();
  readonly cssClass = input<string>();
  readonly loading = input<'eager' | 'lazy'>('lazy');

  private readonly imageBaseUrl = environment.bucketUrl;
  public hasError = false;
  public fallbackImageUrl = 'assets/images/placeholder.png'; //TODO add later

  get imageUrl(): string {
    const key = this.key();
    if (!key) {
      this.handleError();
      return '';
    }
    return `${this.imageBaseUrl}/${key}`;
  }

  get effectiveAlt(): string {
    return this.alt() || `Image for ${this.key()}`;
  }

  handleError(): void {
    this.hasError = true;
    console.warn(`Failed to load image from: ${this.imageUrl}`);
  }
}
