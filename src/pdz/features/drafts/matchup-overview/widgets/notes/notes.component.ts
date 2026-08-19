import {
  Component,
  HostListener,
  inject,
  input,
  model,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { MarkdownComponent } from 'ngx-markdown';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  Subscription,
} from 'rxjs';
import { MatchupService } from '../../matchup.service';

@Component({
  selector: 'pdz-matchup-notes',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MarkdownComponent,
    IconComponent,
  ],
  templateUrl: './notes.component.html',
  styleUrls: ['../../matchup.scss', './notes.component.scss'],
})
export class MatchupNotesComponent implements OnInit, OnDestroy {
  readonly matchupId = input.required<string>();
  readonly notes = model.required<string>();
  readonly mode = input.required<'view-only' | 'editable'>();
  previewMode: boolean = false;

  matchupService = inject(MatchupService);

  private notesChange$ = new Subject<string>();
  private sub?: Subscription;
  private lastSaved: string = '';

  ngOnInit(): void {
    this.sub = this.notesChange$
      .pipe(debounceTime(3000), distinctUntilChanged())
      .subscribe((value) => {
        this.matchupService
          .updateNotes(this.matchupId(), value)
          .subscribe((response) => {
            console.log('Note saved');
          });
        this.lastSaved = value;
      });
  }

  onNotesChange(value: string) {
    this.notes.set(value);
    this.notesChange$.next(value);
  }

  private flushNotes(): void {
    const notes = this.notes();
    if (notes !== this.lastSaved) {
      this.matchupService
        .updateNotes(this.matchupId(), notes)
        .subscribe((response) => {
          console.log('Note saved');
        });
      this.lastSaved = notes;
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    this.flushNotes();
  }

  ngOnDestroy(): void {
    this.flushNotes();
    this.sub?.unsubscribe();
  }

  isPreview(): boolean {
    return this.previewMode || this.mode() === 'view-only';
  }
}
