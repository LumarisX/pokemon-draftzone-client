import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { discordTimestamp } from '../timezone';

@Component({
  selector: 'pdz-discord-timestamp',
  imports: [ButtonComponent, IconComponent],
  template: `
    <pdz-icon name="discord" [size]="18"></pdz-icon>
    <code class="pdz-discord-timestamp__code">{{ stamp() }}</code>
    <button
      pdz-button
      iconOnly
      size="sm"
      variant="ghost"
      color="neutral"
      class="pdz-discord-timestamp__copy"
      [disabled]="!stamp()"
      [attr.aria-label]="copied() ? 'Copied' : 'Copy Discord timestamp'"
      (click)="copy()"
    >
      <pdz-icon [name]="copied() ? 'check' : 'content_copy'" [size]="18" />
    </button>
  `,
  styleUrl: './discord-timestamp.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pdz-discord-timestamp' },
})
export class DiscordTimestampComponent implements OnDestroy {
  private readonly host = inject(ElementRef<HTMLElement>);

  readonly value = input<string | Date | null>(null);
  readonly style = input<'f' | 'F' | 'R' | 't' | 'T' | 'd' | 'D'>('f');

  readonly copied = signal(false);
  private resetTimer?: ReturnType<typeof setTimeout>;

  readonly stamp = computed(() => {
    const value = this.value();
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
      ? ''
      : discordTimestamp(date, this.style());
  });

  async copy(): Promise<void> {
    const stamp = this.stamp();
    if (!stamp) return;
    try {
      await navigator.clipboard.writeText(stamp);
    } catch {
      if (!this.copyWithSelection(stamp)) return;
    }
    this.flash();
  }

  private copyWithSelection(stamp: string): boolean {
    const textarea = document.createElement('textarea');
    textarea.value = stamp;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    this.host.nativeElement.appendChild(textarea);
    textarea.select();
    try {
      return document.execCommand('copy');
    } catch {
      return false;
    } finally {
      textarea.remove();
    }
  }

  private flash(): void {
    this.copied.set(true);
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => this.copied.set(false), 1500);
  }

  ngOnDestroy(): void {
    clearTimeout(this.resetTimer);
  }
}
