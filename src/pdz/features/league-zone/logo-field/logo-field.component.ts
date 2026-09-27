import { HttpEventType, HttpResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { catchError, of, switchMap, tap } from 'rxjs';
import { apiErrorMessage } from '@pdz/core/services/api.service';
import { UploadService } from '@pdz/core/services/upload.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { getLeagueLogoUrl } from '../league.util';

export type LogoFolder = 'tournament-logos' | 'league-logos';

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
];

@Component({
  selector: 'pdz-logo-field',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent, FieldComponent, IconComponent],
  template: `
    <div pdz-field [label]="label()">
      <div class="logo">
        <div class="logo__preview">
          @if (url(); as src) {
            <img class="logo__image" [src]="src" [alt]="label()" />
          } @else {
            <pdz-icon name="image" [size]="32" aria-hidden="true" />
          }
        </div>

        <div class="logo__actions">
          <label pdz-button color="neutral" [class.logo__busy]="uploading()">
            <pdz-icon name="upload" [size]="18" aria-hidden="true" />
            {{ uploading() ? progress() + "%" : "Upload logo" }}
            <input
              class="logo__input"
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              [disabled]="disabled() || uploading()"
              (change)="select($event)"
            />
          </label>

          @if (key()) {
            <button
              pdz-button
              type="button"
              variant="ghost"
              color="danger"
              [disabled]="disabled() || uploading()"
              (click)="clear()"
            >
              Remove
            </button>
          }
        </div>
      </div>

      @if (error(); as message) {
        <p class="logo__error">
          <pdz-icon name="error" [size]="16" aria-hidden="true" />
          {{ message }}
        </p>
      }
    </div>
  `,
  styleUrl: './logo-field.component.scss',
})
export class LogoFieldComponent {
  readonly value = input<string | null | undefined>(null);
  readonly folder = input.required<LogoFolder>();
  readonly label = input('Logo');
  readonly disabled = input(false);
  readonly valueChange = output<string | null>();

  private readonly uploads = inject(UploadService);

  protected readonly uploading = signal(false);
  protected readonly progress = signal(0);
  protected readonly error = signal<string | null>(null);

  protected readonly key = computed(() => this.value());

  protected readonly url = computed(() => {
    const key = this.key();
    return key ? getLeagueLogoUrl(key) : undefined;
  });

  protected clear(): void {
    this.error.set(null);
    this.valueChange.emit(null);
  }

  protected select(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const file = element.files?.[0];
    element.value = '';
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.includes(file.type)) {
      this.error.set(`Invalid file type. Allowed: ${ALLOWED_LOGO_TYPES.join(', ')}`);
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      this.error.set(
        `File size exceeds maximum (${MAX_LOGO_SIZE / 1024 / 1024}MB)`,
      );
      return;
    }

    this.error.set(null);
    this.uploading.set(true);
    this.progress.set(0);

    this.uploads
      .getPresignedUploadUrl(file.name, file.type, this.folder())
      .pipe(
        switchMap((response) =>
          this.uploads.uploadToS3(response, file).pipe(
            tap((event) => {
              if (event.type === HttpEventType.UploadProgress && event.total) {
                this.progress.set(
                  Math.round((100 * event.loaded) / event.total),
                );
              } else if (event instanceof HttpResponse && event.ok) {
                this.valueChange.emit(response.key);
              }
            }),
          ),
        ),
        catchError((err) => {
          this.error.set(
            apiErrorMessage(err, 'Failed to upload logo. Please try again.'),
          );
          return of(null);
        }),
      )
      .subscribe({
        complete: () => this.uploading.set(false),
      });
  }
}
