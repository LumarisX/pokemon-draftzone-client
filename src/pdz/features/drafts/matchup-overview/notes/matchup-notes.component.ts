import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { MarkdownComponent } from 'ngx-markdown';
import {
  Subject,
  Subscription,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';
import { MatchupNotesTarget, MatchupService } from '../matchup.service';

type SaveStatus = 'idle' | 'unsaved' | 'saving' | 'saved' | 'error';

const SAVE_DEBOUNCE_MS = 1500;

@Component({
  selector: 'pdz-matchup-notes',
  templateUrl: './matchup-notes.component.html',
  styleUrl: './matchup-notes.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonComponent,
    EmptyStateComponent,
    FormsModule,
    IconComponent,
    MarkdownComponent,
    TooltipDirective,
  ],
})
export class MatchupNotesComponent implements OnDestroy {
  readonly target = input.required<MatchupNotesTarget>();
  readonly notes = input<string>('');
  readonly closed = output<void>();

  private readonly matchupService = inject(MatchupService);

  protected readonly draft = signal('');
  protected readonly preview = signal(false);
  protected readonly status = signal<SaveStatus>('idle');

  protected readonly statusLabel = computed(() => {
    switch (this.status()) {
      case 'unsaved':
        return 'Unsaved';
      case 'saving':
        return 'Saving…';
      case 'saved':
        return 'Saved';
      case 'error':
        return 'Save failed';
      default:
        return '';
    }
  });

  private readonly typed = new Subject<string>();
  private readonly sub: Subscription;
  private saved = '';

  constructor() {
    effect(() => {
      const incoming = this.notes();
      untracked(() => {
        this.saved = incoming;
        this.draft.set(incoming);
        this.status.set('idle');
      });
    });

    this.sub = this.typed
      .pipe(debounceTime(SAVE_DEBOUNCE_MS), distinctUntilChanged())
      .subscribe((value) => this.save(value));
  }

  protected onInput(value: string): void {
    this.draft.set(value);
    this.status.set(value === this.saved ? 'idle' : 'unsaved');
    this.typed.next(value);
  }

  protected togglePreview(): void {
    this.flush();
    this.preview.update((previous) => !previous);
  }

  protected close(): void {
    this.flush();
    this.closed.emit();
  }

  private save(value: string): void {
    if (value === this.saved) return;
    this.status.set('saving');
    this.matchupService.saveNotes(this.target(), value).subscribe({
      next: () => {
        this.saved = value;
        this.status.set(this.draft() === value ? 'saved' : 'unsaved');
      },
      error: () => this.status.set('error'),
    });
  }

  private flush(): void {
    this.save(this.draft());
  }

  @HostListener('window:beforeunload')
  onBeforeUnload(): void {
    this.flush();
  }

  ngOnDestroy(): void {
    this.flush();
    this.sub.unsubscribe();
  }
}
