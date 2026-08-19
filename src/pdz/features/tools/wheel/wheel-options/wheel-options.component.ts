import {
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Output,
  signal,
  ViewChild,
  input,
} from '@angular/core';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { WheelStorageService } from '../wheel-storage.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import {
  clampRimArc,
  clampSpinSeconds,
  clampTurns,
  MAX_RIM_ARC,
  MAX_SPIN_SECONDS,
  MAX_TURNS,
  MIN_RIM_ARC,
  MIN_SPIN_SECONDS,
  MIN_TURNS,
  StoredWheelItem,
  WheelOptions,
} from '../wheel.model';

@Component({
  selector: 'pdz-wheel-options',
  imports: [IconComponent, ButtonComponent],
  templateUrl: './wheel-options.component.html',
  styleUrl: './wheel-options.component.scss',
})
export class WheelOptionsComponent {
  private readonly storage = inject(WheelStorageService);

  readonly options = input.required<WheelOptions>();
  readonly items = input<StoredWheelItem[]>([]);

  @Output() optionsChange = new EventEmitter<WheelOptions>();
  @Output() itemsImport = new EventEmitter<StoredWheelItem[]>();

  @ViewChild('dialog') private dialog!: ElementRef<HTMLDialogElement>;

  protected readonly minSeconds = MIN_SPIN_SECONDS;
  protected readonly maxSeconds = MAX_SPIN_SECONDS;
  protected readonly minTurns = MIN_TURNS;
  protected readonly maxTurns = MAX_TURNS;
  protected readonly minRimArc = MIN_RIM_ARC;
  protected readonly maxRimArc = MAX_RIM_ARC;

  readonly json = signal('');
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  open(): void {
    this.json.set(this.storage.serialize(this.items()));
    this.error.set(null);
    this.notice.set(null);
    this.dialog.nativeElement.showModal();
  }

  close(): void {
    this.dialog.nativeElement.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === this.dialog.nativeElement) this.close();
  }

  setSpinSeconds(raw: string): void {
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return;
    this.optionsChange.emit({
      ...this.options(),
      spinSeconds: clampSpinSeconds(parsed),
    });
  }

  setTurns(raw: string): void {
    const parsed = Number.parseInt(raw, 10);
    if (!Number.isFinite(parsed)) return;
    this.optionsChange.emit({
      ...this.options(),
      minTurns: clampTurns(parsed),
    });
  }

  setRimArc(raw: string): void {
    const parsed = Number.parseFloat(raw);
    if (!Number.isFinite(parsed)) return;
    this.optionsChange.emit({
      ...this.options(),
      rimArc: clampRimArc(parsed),
    });
  }

  refreshJson(): void {
    this.json.set(this.storage.serialize(this.items()));
    this.error.set(null);
    this.notice.set(null);
  }

  applyJson(): void {
    try {
      const parsed = this.storage.parse(this.json());
      this.itemsImport.emit(parsed);
      this.error.set(null);
      this.notice.set(
        `Imported ${parsed.length} item${parsed.length === 1 ? '' : 's'}.`,
      );
    } catch (cause) {
      this.notice.set(null);
      this.error.set((cause as Error).message);
    }
  }

  async copyJson(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.json());
      this.error.set(null);
      this.notice.set('Copied to clipboard.');
    } catch {
      this.notice.set(null);
      this.error.set('Could not reach the clipboard — copy the text manually.');
    }
  }

  download(): void {
    const blob = new Blob([this.storage.serialize(this.items())], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'wheel-items.json';
    link.click();
    URL.revokeObjectURL(url);
  }

  async upload(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.json.set(await file.text());
    this.applyJson();
  }
}
