import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SpriteService } from '@pdz/core/services/sprite.service';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { ChipComponent } from '@pdz/shared/data/chip/chip.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { SpriteImageComponent } from '@pdz/shared/images/sprite-image/sprite-image.component';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { BinderPrintDialogComponent } from './binder-print-dialog.component';
import {
  BinderCard,
  BinderSlot,
  BinderStore,
  CARDS_PER_SHEET,
  COSMETIC_COUNT,
  MAX_POCKET_AXIS,
  MIN_POCKET_AXIS,
  SORT_MODES,
  SortMode,
} from './binder-store';

export type EntryMode = 'jump' | 'mark' | 'add';

export type EntryLog = {
  seq: number;
  text: string;
  tone: 'ok' | 'warn' | 'error';
  undoId?: string;
};

const PRINT_STYLES = `
  @page { size: 8.5in 11in; margin: 6mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: system-ui, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet {
    display: grid;
    grid-template-columns: repeat(3, 63mm);
    grid-template-rows: repeat(3, 88mm);
    justify-content: center;
    align-content: start;
    height: 265mm;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .sheet:last-child { page-break-after: auto; break-after: auto; }
  .card {
    width: 63mm;
    height: 88mm;
    page-break-inside: avoid;
    break-inside: avoid;
    border: 1px dashed #9aa0a6;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1.5mm;
    padding: 3mm;
    text-align: center;
    overflow: hidden;
  }
  .card img {
    width: 40mm;
    height: 40mm;
    object-fit: contain;
  }
  .card .name {
    font-size: 11pt;
    font-weight: 700;
    line-height: 1.15;
  }
  .card .slot {
    font-size: 8pt;
    color: #5f6368;
    letter-spacing: 0.04em;
    text-transform: uppercase;
  }
`;

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char]!,
  );
}

@Component({
  selector: 'pdz-binder',
  templateUrl: './binder.component.html',
  styleUrl: './binder.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onKeydown($event)',
  },
  imports: [
    ButtonComponent,
    CdkDrag,
    CdkDragHandle,
    CdkDropList,
    CheckComponent,
    ChipComponent,
    ChoiceDirective,
    DisclosureComponent,
    FieldComponent,
    FormsModule,
    IconComponent,
    InputDirective,
    PageComponent,
    PageHeaderComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    SelectComponent,
    SelectOptionComponent,
    SpriteImageComponent,
  ],
})
export class BinderComponent {
  protected readonly store = inject(BinderStore);
  private readonly spriteService = inject(SpriteService);
  private readonly dialog = inject(DialogService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly printFrame =
    viewChild<ElementRef<HTMLIFrameElement>>('printFrame');

  protected readonly search = signal('');
  protected readonly highlighted = signal<number | null>(null);
  protected readonly notFound = signal(false);
  protected readonly mode = signal<EntryMode>('jump');
  protected readonly entryLog = signal<EntryLog[]>([]);
  protected readonly candidates = signal<BinderCard[]>([]);

  protected readonly jumpStatus = signal('');

  private readonly anchor = signal<number | null>(null);
  private anchorState = false;
  private logSeq = 0;
  private jumpTerm = '';
  private jumpCursor = -1;

  protected readonly sortModes = SORT_MODES;
  protected readonly cosmeticCount = COSMETIC_COUNT;
  protected readonly minAxis = MIN_POCKET_AXIS;
  protected readonly maxAxis = MAX_POCKET_AXIS;

  protected readonly entryLabel = computed(
    () =>
      ({
        jump: 'Find a Pokémon',
        mark: 'Type a card, press Enter',
        add: 'Add a card to the binder',
      })[this.mode()],
  );

  protected readonly entryIcon = computed(
    () => ({ jump: 'search', mark: 'check', add: 'add' })[this.mode()],
  );

  protected readonly entryAction = computed(
    () => ({ jump: 'Jump', mark: 'Mark', add: 'Add' })[this.mode()],
  );

  protected readonly autoColumns = computed(
    () =>
      `${Array(this.store.cols()).fill('var(--binder-card-w)').join(' ')} var(--binder-gutter)`,
  );

  protected readonly templateRows = computed(
    () => `repeat(${this.store.rows()}, auto)`,
  );

  protected readonly entryHint = computed(() => {
    if (this.mode() === 'add') return this.addHint();
    if (this.mode() === 'jump') return this.jumpStatus() || undefined;
    return undefined;
  });

  protected readonly addHint = computed(() => {
    const anchor = this.highlighted();
    if (anchor === null) return 'Goes on the end';
    const slot = this.store.slots()[anchor];
    if (!slot) return 'Goes on the end';
    return `Goes after ${slot.card?.name ?? 'the blank'} (page ${slot.page}, pocket ${slot.pocket})`;
  });

  protected newBinder(): void {
    const name = prompt('Name the new binder:', `Binder ${this.store.binders().length + 1}`);
    if (name === null) return;
    const copy =
      this.store.stats().cards > 0 &&
      confirm('Start it as a copy of the current binder? Cancel for a fresh one.');
    this.store.createBinder(name, copy);
    this.resetEntryState();
  }

  protected renameBinder(): void {
    const name = prompt('Rename this binder:', this.store.activeName());
    if (name === null) return;
    this.store.renameBinder(name);
  }

  protected deleteBinder(): void {
    if (this.store.binders().length < 2) {
      alert('This is your only binder — make another one first.');
      return;
    }
    if (
      !confirm(
        `Delete “${this.store.activeName()}” and everything marked in it? This cannot be undone.`,
      )
    ) {
      return;
    }
    this.store.deleteBinder(this.store.activeId());
    this.resetEntryState();
  }

  protected switchBinder(id: string): void {
    this.store.switchTo(id);
    this.resetEntryState();
  }

  private resetEntryState(): void {
    this.highlighted.set(null);
    this.candidates.set([]);
    this.entryLog.set([]);
    this.anchor.set(null);
    this.notFound.set(false);
    this.resetJumpCursor();
  }

  private resetJumpCursor(): void {
    this.jumpTerm = '';
    this.jumpCursor = -1;
    this.jumpStatus.set('');
  }

  protected setSort(mode: SortMode): void {
    if (mode === this.store.sort()) return;
    const needsWarning =
      mode !== 'custom' &&
      (this.store.sort() === 'custom' || this.store.stats().blanks > 0);
    if (needsWarning) {
      const blanks = this.store.stats().blanks;
      const loses = blanks
        ? `${blanks} blank ${blanks === 1 ? 'pocket' : 'pockets'} and your hand-arranged order`
        : 'your hand-arranged order';
      if (!confirm(`Re-sorting discards ${loses}. You can undo this.`)) return;
    }
    this.store.setSort(mode);
    this.anchor.set(null);
    this.resetJumpCursor();
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (!event.ctrlKey && !event.metaKey) return;
    const target = event.target as HTMLElement | null;
    const tag = target?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || target?.isContentEditable) {
      return;
    }

    const key = event.key.toLowerCase();
    if (key === 'z' && !event.shiftKey) {
      event.preventDefault();
      this.store.undo();
    } else if ((key === 'z' && event.shiftKey) || key === 'y') {
      event.preventDefault();
      this.store.redo();
    }
  }

  protected drop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) return;
    this.store.move(event.previousIndex, event.currentIndex);
    this.anchor.set(null);
  }

  protected onCardClick(slot: BinderSlot, event: MouseEvent): void {
    const card = slot.card;
    if (!card) return;

    const anchor = this.anchor();
    if (event.shiftKey && anchor !== null && anchor !== slot.index) {
      this.store.setRangeOwned(anchor, slot.index, this.anchorState);
      return;
    }

    this.store.toggleOwned(slot.key);
    this.anchor.set(slot.index);
    this.anchorState = this.store.isOwned(slot.key);
  }

  protected submit(): void {
    if (this.mode() === 'mark') this.markEntry();
    else if (this.mode() === 'add') this.addEntry();
    else this.jump();
  }

  private addEntry(): void {
    const term = this.search().trim();
    if (!term) return;

    const matches = this.store.findCards(term);
    if (!matches.length) {
      this.candidates.set([]);
      this.pushLog(`“${term}” — no match`, 'error');
      return;
    }
    if (matches.length > 1 && matches[0].name.toLowerCase() !== term.toLowerCase()) {
      this.candidates.set(matches);
      this.pushLog(`“${term}” matches ${matches.length} cards`, 'warn');
      return;
    }
    this.insertCard(matches[0]);
  }

  private insertCard(card: BinderCard): void {
    const anchor = this.highlighted();
    const at = anchor === null ? undefined : anchor + 1;
    const key = this.store.addCard(card.id, at);
    if (!key) return;

    this.candidates.set([]);
    this.search.set('');
    const index = this.store.slots().findIndex((slot) => slot.key === key);
    const copies = this.store.slots()[index]?.copies ?? 1;
    this.pushLog(
      copies > 1 ? `${card.name} — added (copy ${copies})` : `${card.name} — added`,
      'ok',
    );
    if (index >= 0) {
      this.highlighted.set(index);
      this.scrollTo(index);
    }
  }

  private markEntry(): void {
    const term = this.search().trim();
    if (!term) return;

    const result = this.store.markByName(term);
    this.candidates.set(result.status === 'ambiguous' ? result.matches : []);

    switch (result.status) {
      case 'marked':
        this.pushLog(`${result.card.name} — marked owned`, 'ok', result.key);
        this.search.set('');
        this.focusKey(result.key);
        break;
      case 'already':
        this.pushLog(`${result.card.name} — already owned`, 'warn');
        this.search.set('');
        this.focusKey(result.key);
        break;
      case 'ambiguous':
        this.pushLog(`“${term}” matches ${result.matches.length} cards`, 'warn');
        break;
      case 'missing':
        this.pushLog(`“${term}” — no match`, 'error');
        break;
    }
  }

  protected chooseCandidate(card: BinderCard): void {
    if (this.mode() === 'add') {
      this.insertCard(card);
      return;
    }
    const result = this.store.markByName(card.name);
    this.candidates.set([]);
    this.search.set('');
    if (result.status === 'marked') {
      this.pushLog(`${card.name} — marked owned`, 'ok', result.key);
      this.focusKey(result.key);
    } else if (result.status === 'already') {
      this.pushLog(`${card.name} — already owned`, 'warn');
      this.focusKey(result.key);
    }
  }

  protected undo(entry: EntryLog): void {
    if (!entry.undoId) return;
    this.store.setOwned(entry.undoId, false);
    this.entryLog.update((log) =>
      log.map((item) =>
        item.seq === entry.seq
          ? { ...item, text: `${item.text} (undone)`, tone: 'warn' as const, undoId: undefined }
          : item,
      ),
    );
  }

  private pushLog(text: string, tone: EntryLog['tone'], undoId?: string): void {
    this.entryLog.update((log) =>
      [{ seq: ++this.logSeq, text, tone, undoId }, ...log].slice(0, 6),
    );
  }

  private focusKey(key: string): void {
    const index = this.store.slots().findIndex((slot) => slot.key === key);
    if (index < 0) return;
    this.highlighted.set(index);
    this.scrollTo(index);
  }

  protected setMode(mode: EntryMode): void {
    this.mode.set(mode);
    this.candidates.set([]);
    this.notFound.set(false);
    this.resetJumpCursor();
  }

  protected async openPrintOptions(): Promise<void> {
    const ref = this.dialog.open<BinderPrintDialogComponent, boolean>(
      BinderPrintDialogComponent,
      {
        heading: 'Print placeholders',
        subheading: 'Cut-out cards for the pockets you have not filled yet.',
        size: 'md',
      },
    );
    if ((await ref.closed) === true) this.print();
  }

  protected jump(): void {
    const term = this.search().trim();
    if (!term) return;

    const matches = this.store.findMatches(term);
    if (!matches.length) {
      this.notFound.set(true);
      this.jumpStatus.set('');
      this.jumpTerm = '';
      this.jumpCursor = -1;
      return;
    }

    this.notFound.set(false);
    const needle = term.toLowerCase();
    if (needle === this.jumpTerm) {
      this.jumpCursor = (this.jumpCursor + 1) % matches.length;
    } else {
      this.jumpTerm = needle;
      this.jumpCursor = 0;
    }

    const index = matches[this.jumpCursor];
    this.highlighted.set(index);
    this.scrollTo(index);
    this.jumpStatus.set(
      matches.length > 1
        ? `Match ${this.jumpCursor + 1} of ${matches.length} — Enter for the next`
        : '',
    );
  }

  protected jumpToPage(value: string): void {
    const page = Number(value);
    if (!Number.isFinite(page) || page < 1) return;
    const index = Math.min(
      (page - 1) * 16,
      Math.max(this.store.slots().length - 1, 0),
    );
    this.highlighted.set(null);
    this.scrollTo(index);
  }

  private scrollTo(index: number): void {
    requestAnimationFrame(() => {
      const element = (
        this.host.nativeElement as HTMLElement
      ).querySelector<HTMLElement>(`[data-slot-index="${index}"]`);
      element?.scrollIntoView({
        block: 'center',
        inline: 'center',
        behavior: 'smooth',
      });
    });
  }

  protected resetLayout(): void {
    if (!confirm('Reset the binder back to pokédex order? Blanks and removed cards are discarded. Your owned marks are kept.')) return;
    this.store.resetLayout();
  }

  protected clearOwned(): void {
    if (!confirm('Clear every owned mark? This cannot be undone.')) return;
    this.store.clearOwned();
  }

  protected removeBlanks(): void {
    if (!this.store.stats().blanks) return;
    if (!confirm('Remove every blank pocket? Cards close back up in order.')) {
      return;
    }
    this.store.removeBlanks();
  }

  protected exportJson(): void {
    const blob = new Blob([this.store.exportJson()], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `binder-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  protected importJson(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (
      !confirm(
        `Replace the current binder with “${file.name}”? Everything saved here is overwritten.`,
      )
    ) {
      return;
    }

    file
      .text()
      .then((text) => {
        if (!this.store.importJson(text)) {
          alert('That file is not a binder export.');
        }
      })
      .catch(() => alert('Could not read that file.'));
  }

  protected print(): void {
    const sheets = this.store.sheets();
    if (!sheets.length) {
      alert('Nothing to print for the current print options.');
      return;
    }

    const frame = this.printFrame()?.nativeElement;
    const doc = frame?.contentDocument;
    if (!frame || !doc) return;

    doc.open();
    doc.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>Binder placeholders</title><style>${PRINT_STYLES}</style></head><body>${sheets
        .map(
          (sheet) =>
            `<section class="sheet">${sheet
              .map((slot) => this.cardHtml(slot))
              .join('')}</section>`,
        )
        .join('')}</body></html>`,
    );
    doc.close();

    const images = Array.from(doc.images);
    Promise.all(
      images.map((image) =>
        image.complete
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              image.addEventListener('load', () => resolve(), { once: true });
              image.addEventListener('error', () => resolve(), { once: true });
            }),
      ),
    ).then(() => {
      frame.contentWindow?.focus();
      frame.contentWindow?.print();
    });
  }

  private cardHtml(slot: BinderSlot): string {
    const card = slot.card!;
    const sprite = this.spriteService.getSpriteData({
      id: card.id,
      shiny: false,
    });
    const src = sprite?.path ?? '';
    return (
      `<article class="card">` +
      (src ? `<img src="${escapeHtml(src)}" alt="">` : '') +
      `<span class="name">${escapeHtml(card.name)}</span>` +
      `<span class="slot">#${card.num} &middot; page ${slot.page} &middot; pocket ${slot.pocket}</span>` +
      `</article>`
    );
  }

  protected readonly sheetSize = CARDS_PER_SHEET;
}
