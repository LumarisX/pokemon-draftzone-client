import {
  Component,
  HostListener,
  inject,
  Input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MarkdownComponent } from 'ngx-markdown';
import {
  debounceTime,
  distinctUntilChanged,
  Subject,
  Subscription,
} from 'rxjs';
import { MatchupService } from '../../../../services/matchup.service';

@Component({
  selector: 'pdz-matchup-notes',
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatSlideToggleModule,
    MatIcon,
    MarkdownComponent,
  ],
  templateUrl: './notes.component.html',
  styleUrls: ['../../matchup.scss', './notes.component.scss'],
})
export class MatchupNotesComponent implements OnInit, OnDestroy {
  @Input({ required: true })
  matchupId!: string;
  @Input({ required: true })
  notes!: string;
  @Input({ required: true })
  mode!: 'view-only' | 'editable';
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
          .updateNotes(this.matchupId, value)
          .subscribe((response) => {
            console.log('Note saved');
          });
        this.lastSaved = value;
      });
  }

  onNotesChange(value: string) {
    this.notesChange$.next(value);
  }

  private flushNotes(): void {
    if (this.notes !== this.lastSaved) {
      this.matchupService
        .updateNotes(this.matchupId, this.notes)
        .subscribe((response) => {
          console.log('Note saved');
        });
      this.lastSaved = this.notes;
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
    return this.previewMode || this.mode === 'view-only';
  }
}
