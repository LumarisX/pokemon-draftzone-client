import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  inject,
} from '@angular/core';
import { select, zoom, zoomIdentity, type ZoomBehavior } from 'd3';
import { getLogoUrl } from '../../league.util';
import {
  GeneratedBracket,
  addMatchToRound,
  deleteMatch,
  moveMatch,
  setMatchSlot,
} from '../bracket-generator';
import {
  BracketSlotFlex,
  BracketTeamFlex,
  FlexBracketData,
  FlexBracketMatch,
  FlexBracketSectionConfig,
} from '../bracket.model';
import {
  BracketInteractionState,
  BracketViewTransform,
  renderBracket,
} from './bracket-canvas-renderer';
import {
  HitRegion,
  buildHitRegions,
  hitTestConnector,
  queryHitRegion,
} from './bracket-hit-test';
import {
  COL_GAP,
  COL_W,
  CanvasLayout,
  MATCH_GAP,
  computeBracketLayout,
} from './bracket-layout';
import { BracketTheme, resolveBracketTheme } from './bracket-theme-colors';
import {
  MAX_SCALE,
  MIN_SCALE,
  fitToContent,
  screenToWorld,
  worldToScreen,
} from './bracket-transform';

const EMPTY_LAYOUT: CanvasLayout = {
  width: 0,
  height: 0,
  sections: [],
  matches: [],
  connectors: [],
  matchLabelById: new Map(),
  addMatchButtons: [],
  addRoundButtons: [],
};

/** Screen-pixel movement before a pointerdown on a card becomes a drag. */
const DRAG_THRESHOLD = 5;

type SlotMode = 'empty' | 'seed' | 'winner' | 'loser';

interface EditorSlot {
  mode: SlotMode;
  seed: number;
  from: string;
}

interface MatchEditor {
  matchId: string;
  autoLabel: string;
  label: string;
  slots: [EditorSlot, EditorSlot];
  seedOptions: { seed: number; label: string }[];
  matchOptions: { id: string; label: string }[];
}

interface TitleOverlay {
  section: string;
  round: number;
  x: number;
  y: number;
  w: number;
  h: number;
  value: string;
}

interface ReplayOverlay {
  href: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

interface PointerSession {
  pointerId: number;
  startScreenX: number;
  startScreenY: number;
  startWorldX: number;
  startWorldY: number;
  region: HitRegion;
  dragging: boolean;
  dropTarget: {
    section: string;
    round: number;
    index: number;
  } | null;
}

/**
 * Canvas-based bracket renderer with pan/zoom.
 *
 * Read-only mode: bind `bracketData`.
 *
 * Edit mode (`editable`): the component owns a local draft of the bracket
 * wiring — add/move/delete matches, rewire slots, rename rounds, add sections.
 * Nothing leaves the component until the user hits Save, which emits the whole
 * draft as one `saveRequested` event. Bind `teams` for seed resolution and
 * optionally `initialMatches`/`initialSections` to edit an existing bracket.
 */
@Component({
  selector: 'pdz-league-bracket-canvas',
  imports: [CommonModule],
  templateUrl: './league-bracket-canvas.component.html',
  styleUrl: './league-bracket-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueBracketCanvasComponent
  implements OnChanges, AfterViewInit, OnDestroy
{
  @Input() componentTitle: string = 'Playoff Bracket';
  /** Read-only bracket to display (ignored in edit mode). */
  @Input() bracketData?: FlexBracketData;
  /** Enables the organizer bracket builder. */
  @Input() editable = false;
  /** Edit mode: participating teams, in seed order (index 0 = seed 1). */
  @Input() teams: BracketTeamFlex[] = [];
  /**
   * Edit mode: how many seeds exist when team identities are hidden
   * (certified-random seeding). Ignored when `teams` is non-empty.
   */
  @Input() seedCount?: number;
  /** Edit mode: seeds the draft. Changing identity resets any unsaved work. */
  @Input() initialMatches?: FlexBracketMatch[];
  @Input() initialSections?: FlexBracketSectionConfig[];

  /** Emits the complete draft (matches + sections) when the user hits Save. */
  @Output() saveRequested = new EventEmitter<GeneratedBracket>();

  @ViewChild('host') private hostRef!: ElementRef<HTMLElement>;
  @ViewChild('canvasEl') private canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('titleInput') private titleInputRef?: ElementRef<HTMLInputElement>;
  @ViewChild('sectionInput')
  private sectionInputRef?: ElementRef<HTMLInputElement>;

  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);

  hostHeight = 420;
  matchEditor: MatchEditor | null = null;
  titleOverlay: TitleOverlay | null = null;
  replayOverlay: ReplayOverlay | null = null;
  sectionPromptOpen = false;

  private draftMatches: FlexBracketMatch[] = [];
  private draftSections: FlexBracketSectionConfig[] = [{ key: 'main', order: 0 }];

  private ctx: CanvasRenderingContext2D | null = null;
  private layout: CanvasLayout = EMPTY_LAYOUT;
  private hitRegions: HitRegion[] = [];
  private theme: BracketTheme | null = null;
  private transform: BracketViewTransform = { x: 24, y: 24, k: 1 };
  private state: BracketInteractionState = {};
  private dpr = 1;
  private viewW = 0;
  private viewH = 0;
  private rafHandle = 0;
  private resizeRaf = 0;
  private hasAutoFit = false;
  private pointer: PointerSession | null = null;

  private zoomBehavior?: ZoomBehavior<HTMLCanvasElement, unknown>;
  private resizeObserver?: ResizeObserver;
  private themeObserver?: MutationObserver;
  private readonly images = new Map<string, HTMLImageElement | null>();

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialMatches'] || changes['initialSections']) {
      this.draftMatches = this.initialMatches ? [...this.initialMatches] : [];
      this.draftSections = this.initialSections?.length
        ? [...this.initialSections]
        : [{ key: 'main', order: 0 }];
    }
    this.recomputeLayout();
    this.scheduleRender();
  }

  ngAfterViewInit(): void {
    this.ctx = this.canvasRef.nativeElement.getContext('2d');
    this.theme = resolveBracketTheme();

    this.ngZone.runOutsideAngular(() => {
      this.setupResizeObserver();
      this.setupThemeObserver();
      this.setupZoom();
      this.setupPointerHandlers();
      // Repaint once web fonts (Nasalization RG, Nunito) finish loading.
      document.fonts?.ready.then(() => this.scheduleRender());
      this.resizeCanvas();
      this.autoFitIfPending();
      this.scheduleRender();
    });
  }

  ngOnDestroy(): void {
    if (this.rafHandle) cancelAnimationFrame(this.rafHandle);
    if (this.resizeRaf) cancelAnimationFrame(this.resizeRaf);
    this.resizeObserver?.disconnect();
    this.themeObserver?.disconnect();
  }

  // ─── Draft state ────────────────────────────────────────────────────────────

  private effectiveData(): FlexBracketData | undefined {
    if (this.editable) {
      return {
        format: 'custom',
        teams: this.teams ?? [],
        matches: this.draftMatches,
        sections: this.draftSections,
      };
    }
    return this.bracketData;
  }

  /** Applies a draft mutation from a pointer handler: re-enters the zone so
   *  template bindings (hostHeight, overlays) update, then repaints. */
  private applyDraft(mutate: () => void): void {
    this.ngZone.run(() => {
      mutate();
      this.recomputeLayout();
      this.cdr.markForCheck();
    });
    this.scheduleRender();
  }

  get canSave(): boolean {
    return this.draftMatches.length > 0;
  }

  onSaveClick(): void {
    this.saveRequested.emit({
      matches: this.draftMatches,
      sections: this.draftSections,
    });
  }

  /** Wipes the draft back to a single empty section — a from-scratch canvas. */
  clearDraft(): void {
    if (this.draftMatches.length === 0 && this.draftSections.length <= 1) {
      return;
    }
    if (
      !confirm(
        'Clear the entire bracket? All matchups, rounds, and sections will be removed.',
      )
    ) {
      return;
    }
    this.draftMatches = [];
    this.draftSections = [{ key: 'main', order: 0 }];
    this.recomputeLayout();
    this.scheduleRender();
  }

  // ─── Layout / render pipeline ──────────────────────────────────────────────

  private recomputeLayout(): void {
    const data = this.effectiveData();
    this.layout = data
      ? computeBracketLayout(data, this.editable)
      : EMPTY_LAYOUT;
    this.hitRegions = buildHitRegions(this.layout, this.editable);
    // Give the builder generous working room; both modes may grow with the
    // bracket up to most of the viewport instead of a hard 720px cap.
    const minHeight = this.editable ? 560 : 420;
    const maxHeight = Math.max(
      minHeight,
      Math.round(window.innerHeight * 0.8),
    );
    this.hostHeight = Math.max(
      minHeight,
      Math.min(this.layout.height + 48, maxHeight),
    );
    this.autoFitIfPending();
  }

  private autoFitIfPending(): void {
    if (this.hasAutoFit || !this.layout.matches.length) return;
    if (this.viewW <= 0 || this.viewH <= 0) return;
    this.hasAutoFit = true;
    this.applyTransform(
      fitToContent(this.layout.width, this.layout.height, this.viewW, this.viewH),
    );
  }

  private scheduleRender(): void {
    if (this.rafHandle) return;
    this.ngZone.runOutsideAngular(() => {
      this.rafHandle = requestAnimationFrame(() => {
        this.rafHandle = 0;
        this.drawFrame();
      });
    });
  }

  private drawFrame(): void {
    if (!this.ctx || !this.theme || this.viewW <= 0 || this.viewH <= 0) return;
    renderBracket(this.ctx, {
      layout: this.layout,
      theme: this.theme,
      transform: this.transform,
      dpr: this.dpr,
      viewWidth: this.viewW,
      viewHeight: this.viewH,
      editable: this.editable,
      state: this.state,
      resolveImage: this.resolveImage,
    });
  }

  private readonly resolveImage = (
    logo: string | undefined,
  ): HTMLImageElement | null => {
    const url = getLogoUrl(logo);
    const cached = this.images.get(url);
    if (cached !== undefined) return cached;
    this.images.set(url, null);
    const img = new Image();
    img.onload = () => {
      this.images.set(url, img);
      this.scheduleRender();
    };
    img.src = url;
    return null;
  };

  // ─── Canvas sizing ─────────────────────────────────────────────────────────

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      // Coalesce bursts to one resize per frame.
      if (this.resizeRaf) return;
      this.resizeRaf = requestAnimationFrame(() => {
        this.resizeRaf = 0;
        this.resizeCanvas();
        this.autoFitIfPending();
        this.drawFrame();
      });
    });
    this.resizeObserver.observe(this.hostRef.nativeElement);
  }

  private resizeCanvas(): void {
    const host = this.hostRef.nativeElement;
    const canvas = this.canvasRef.nativeElement;
    this.viewW = host.clientWidth;
    this.viewH = host.clientHeight;
    this.dpr = window.devicePixelRatio || 1;
    canvas.width = Math.max(1, Math.round(this.viewW * this.dpr));
    canvas.height = Math.max(1, Math.round(this.viewH * this.dpr));
    canvas.style.width = `${this.viewW}px`;
    canvas.style.height = `${this.viewH}px`;
  }

  // ─── Theming ───────────────────────────────────────────────────────────────

  private setupThemeObserver(): void {
    this.themeObserver = new MutationObserver(() => {
      this.theme = resolveBracketTheme();
      this.scheduleRender();
    });
    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['pdz-theme', 'pdz-theme-mode', 'class'],
    });
  }

  // ─── Zoom / pan ────────────────────────────────────────────────────────────

  private setupZoom(): void {
    const canvas = this.canvasRef.nativeElement;

    this.zoomBehavior = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([MIN_SCALE, MAX_SCALE])
      .filter((event: any) => {
        // Mirror d3's default gating (primary button, allow ctrl+wheel pinch).
        if (event.type === 'wheel') return true;
        if (event.button) return false;
        const region = this.regionAtEvent(event);
        if (!region) return true;
        // Read-only cards aren't interactive, so panning may start on them.
        return !this.editable && region.kind === 'match-card';
      })
      .on('zoom', (event) => {
        this.transform = {
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k,
        };
        // Anchored overlays live in screen space; close rather than chase the
        // gesture. (The match editor is a centered modal — it stays open.)
        if (this.replayOverlay || this.titleOverlay) {
          this.ngZone.run(() => {
            this.replayOverlay = null;
            this.titleOverlay = null;
            this.cdr.markForCheck();
          });
        }
        this.scheduleRender();
      });

    select(canvas).call(this.zoomBehavior).on('dblclick.zoom', null);
  }

  private applyTransform(t: BracketViewTransform): void {
    this.transform = t;
    if (this.zoomBehavior) {
      select(this.canvasRef.nativeElement).call(
        this.zoomBehavior.transform,
        zoomIdentity.translate(t.x, t.y).scale(t.k),
      );
    }
    this.scheduleRender();
  }

  resetView(): void {
    this.applyTransform(
      fitToContent(this.layout.width, this.layout.height, this.viewW, this.viewH),
    );
  }

  private regionAtEvent(event: {
    clientX?: number;
    clientY?: number;
    touches?: TouchList;
  }): HitRegion | null {
    const p = event.touches?.[0] ?? (event as { clientX: number; clientY: number });
    if (p.clientX === undefined) return null;
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const w = screenToWorld(
      p.clientX - rect.left,
      p.clientY! - rect.top,
      this.transform,
    );
    return queryHitRegion(w.x, w.y, this.hitRegions);
  }

  // ─── Pointer interactions ──────────────────────────────────────────────────

  private setupPointerHandlers(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointermove', this.onPointerMove);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointercancel', this.onPointerCancel);
    canvas.addEventListener('pointerleave', this.onPointerLeave);
  }

  private toWorld(event: PointerEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return screenToWorld(
      event.clientX - rect.left,
      event.clientY - rect.top,
      this.transform,
    );
  }

  private readonly onPointerDown = (event: PointerEvent): void => {
    if (event.button !== 0) return;
    const w = this.toWorld(event);
    const region = queryHitRegion(w.x, w.y, this.hitRegions);
    if (!region) return;
    if (!this.editable && region.kind === 'match-card') return; // pan territory
    this.pointer = {
      pointerId: event.pointerId,
      startScreenX: event.clientX,
      startScreenY: event.clientY,
      startWorldX: w.x,
      startWorldY: w.y,
      region,
      dragging: false,
      dropTarget: null,
    };
  };

  private readonly onPointerMove = (event: PointerEvent): void => {
    const w = this.toWorld(event);

    if (this.pointer && this.pointer.pointerId === event.pointerId) {
      const session = this.pointer;
      const canDrag =
        this.editable &&
        (session.region.kind === 'match-card' ||
          session.region.kind === 'slot') &&
        session.region.matchId !== undefined;

      if (!session.dragging && canDrag) {
        const dist = Math.hypot(
          event.clientX - session.startScreenX,
          event.clientY - session.startScreenY,
        );
        if (dist > DRAG_THRESHOLD) {
          session.dragging = true;
          this.canvasRef.nativeElement.setPointerCapture(event.pointerId);
          this.setCursor('grabbing');
        }
      }

      if (session.dragging) {
        const target = this.findDropTarget(w.x, w.y, session.region.matchId!);
        session.dropTarget = target
          ? { section: target.section, round: target.round, index: target.index }
          : null;
        this.state = {
          ...this.state,
          drag: {
            matchId: session.region.matchId!,
            dx: w.x - session.startWorldX,
            dy: w.y - session.startWorldY,
            targetSection: target?.section,
            targetRound: target?.round,
            insertY: target?.insertY ?? null,
            targetColX: target?.colX ?? null,
          },
        };
        this.scheduleRender();
        return;
      }
    }

    this.updateHover(w.x, w.y);
  };

  private readonly onPointerUp = (event: PointerEvent): void => {
    const session = this.pointer;
    this.pointer = null;
    if (!session || session.pointerId !== event.pointerId) return;

    if (session.dragging) {
      this.canvasRef.nativeElement.releasePointerCapture(event.pointerId);
      const target = session.dropTarget;
      this.state = { ...this.state, drag: null };
      this.setCursor('');
      if (target) {
        this.applyDraft(() => {
          this.draftMatches = moveMatch(
            this.draftMatches,
            session.region.matchId!,
            target.section,
            target.round,
            target.index,
          );
        });
      } else {
        this.scheduleRender();
      }
      return;
    }

    // Plain click: dispatch by the region under the pointer now.
    const w = this.toWorld(event);
    const region = queryHitRegion(w.x, w.y, this.hitRegions);
    if (!region || !this.editable) return;

    switch (region.kind) {
      case 'delete-icon': {
        const matchId = region.matchId!;
        this.ngZone.run(() => {
          if (
            !confirm(
              'Delete this match? Any slot pointing to it will become unassigned.',
            )
          ) {
            return;
          }
          this.draftMatches = deleteMatch(this.draftMatches, matchId);
          this.recomputeLayout();
          this.cdr.markForCheck();
        });
        this.scheduleRender();
        break;
      }
      case 'add-match-btn':
      case 'add-round-btn':
        this.applyDraft(() => {
          this.draftMatches = addMatchToRound(
            this.draftMatches,
            region.section!,
            region.round!,
          );
        });
        break;
      case 'slot':
      case 'edit-icon':
        this.openMatchEditor(region.matchId!);
        break;
      case 'round-title':
        this.openTitleOverlay(region);
        break;
    }
  };

  private readonly onPointerCancel = (): void => {
    if (this.pointer?.dragging) {
      this.state = { ...this.state, drag: null };
      this.scheduleRender();
    }
    this.pointer = null;
    this.setCursor('');
  };

  private readonly onPointerLeave = (): void => {
    if (this.pointer?.dragging) return; // pointer capture keeps the drag alive
    this.clearHover();
  };

  // ─── Hover ─────────────────────────────────────────────────────────────────

  private updateHover(wx: number, wy: number): void {
    const region = queryHitRegion(wx, wy, this.hitRegions);
    // Cards and buttons take priority; only probe connector lines on empty
    // canvas. Tolerance is ~7 screen px regardless of zoom.
    const hoveredConnectorIndex = region
      ? null
      : hitTestConnector(wx, wy, this.layout.connectors, 7 / this.transform.k);
    const prev = this.state;
    const next: BracketInteractionState = {
      ...prev,
      hoveredMatchId: region?.matchId ?? null,
      hoveredKind: region?.kind ?? null,
      hoveredSlotIndex: region?.slotIndex ?? null,
      hoveredButtonKey:
        region &&
        (region.kind === 'add-match-btn' ||
          region.kind === 'add-round-btn' ||
          region.kind === 'round-title')
          ? `${region.section}::${region.round}`
          : null,
      hoveredConnectorIndex,
    };

    const changed =
      prev.hoveredMatchId !== next.hoveredMatchId ||
      prev.hoveredKind !== next.hoveredKind ||
      prev.hoveredSlotIndex !== next.hoveredSlotIndex ||
      prev.hoveredButtonKey !== next.hoveredButtonKey ||
      (prev.hoveredConnectorIndex ?? null) !== hoveredConnectorIndex;
    if (!changed) return;

    this.state = next;
    this.setCursor(this.cursorFor(region));
    this.syncReplayOverlay(region);
    this.scheduleRender();
  }

  private clearHover(): void {
    if (
      !this.state.hoveredKind &&
      !this.state.hoveredMatchId &&
      this.state.hoveredConnectorIndex == null
    ) {
      return;
    }
    this.state = {
      ...this.state,
      hoveredMatchId: null,
      hoveredKind: null,
      hoveredSlotIndex: null,
      hoveredButtonKey: null,
      hoveredConnectorIndex: null,
    };
    this.setCursor('');
    this.scheduleRender();
  }

  private cursorFor(region: HitRegion | null): string {
    if (!region) return '';
    switch (region.kind) {
      case 'match-card':
        return this.editable ? 'grab' : '';
      case 'round-title':
        return this.editable ? 'text' : '';
      case 'edit-icon':
      case 'delete-icon':
      case 'add-match-btn':
      case 'add-round-btn':
      case 'slot':
      case 'replay-link':
        return 'pointer';
    }
  }

  private setCursor(cursor: string): void {
    this.canvasRef.nativeElement.style.cursor = cursor;
  }

  /**
   * Keeps a real <a> positioned over the hovered replay pill so native link
   * behaviors (middle-click, ctrl+click, status bar, new tab) keep working.
   */
  private syncReplayOverlay(region: HitRegion | null): void {
    const wantsOverlay = !this.editable && region?.kind === 'replay-link';
    if (!wantsOverlay) {
      if (this.replayOverlay) {
        this.ngZone.run(() => {
          this.replayOverlay = null;
          this.cdr.markForCheck();
        });
      }
      return;
    }
    const match = this.layout.matches.find((m) => m.id === region!.matchId);
    if (!match?.replay) return;
    const tl = worldToScreen(region!.x, region!.y, this.transform);
    this.ngZone.run(() => {
      this.replayOverlay = {
        href: match.replay!,
        x: tl.x,
        y: tl.y,
        w: region!.w * this.transform.k,
        h: region!.h * this.transform.k,
      };
      this.cdr.markForCheck();
    });
  }

  onReplayOverlayLeave(): void {
    this.replayOverlay = null;
    this.clearHover();
  }

  // ─── Drag drop-target resolution ───────────────────────────────────────────

  private findDropTarget(
    wx: number,
    wy: number,
    excludeId: string,
  ): {
    section: string;
    round: number;
    index: number;
    colX: number;
    insertY: number;
  } | null {
    for (const section of this.layout.sections) {
      if (wy < section.y - MATCH_GAP || wy > section.bottom + MATCH_GAP) {
        continue;
      }
      for (const col of section.columns) {
        if (wx < col.x - COL_GAP / 2 || wx > col.x + COL_W + COL_GAP / 2) {
          continue;
        }
        const cards = this.layout.matches
          .filter(
            (m) =>
              m.section === col.section &&
              m.round === col.round &&
              m.id !== excludeId,
          )
          .sort((a, b) => a.y - b.y);
        let index = cards.length;
        for (let i = 0; i < cards.length; i++) {
          if (wy < cards[i].y + cards[i].h / 2) {
            index = i;
            break;
          }
        }
        const insertY = !cards.length
          ? col.cardsTop
          : index === 0
            ? cards[0].y - MATCH_GAP / 2
            : index === cards.length
              ? cards[cards.length - 1].y + cards[cards.length - 1].h + MATCH_GAP / 2
              : (cards[index - 1].y + cards[index - 1].h + cards[index].y) / 2;
        return {
          section: col.section,
          round: col.round,
          index,
          colX: col.x,
          insertY,
        };
      }
    }
    return null;
  }

  // ─── Match editor dialog ───────────────────────────────────────────────────

  private openMatchEditor(matchId: string): void {
    const match = this.draftMatches.find((m) => m.id === matchId);
    if (!match) return;

    const seedTotal = Math.max(this.teams?.length ?? 0, this.seedCount ?? 0);
    const teamBySeed = new Map((this.teams ?? []).map((t) => [t.seed, t]));
    const seedOptions = Array.from({ length: seedTotal }, (_, i) => {
      const seed = i + 1;
      const team = teamBySeed.get(seed);
      return {
        seed,
        label: team ? `Seed ${seed} — ${team.teamName}` : `Seed ${seed}`,
      };
    });

    const matchOptions = [...this.layout.matchLabelById]
      .filter(([id]) => id !== matchId)
      .map(([id, label]) => ({ id, label }));

    const toEditorSlot = (slot: BracketSlotFlex): EditorSlot => {
      switch (slot.type) {
        case 'seed':
        case 'bye':
          return { mode: 'seed', seed: slot.seed, from: '' };
        case 'winner':
          return { mode: 'winner', seed: 1, from: slot.from };
        case 'loser':
          return { mode: 'loser', seed: 1, from: slot.from };
        default:
          return { mode: 'empty', seed: 1, from: '' };
      }
    };

    const autoLabel = this.layout.matchLabelById.get(matchId) ?? 'Match';
    const editor: MatchEditor = {
      matchId,
      autoLabel,
      label: match.label ?? '',
      slots: [toEditorSlot(match.a), toEditorSlot(match.b)],
      seedOptions,
      matchOptions,
    };

    this.ngZone.run(() => {
      this.matchEditor = editor;
      this.cdr.markForCheck();
    });
  }

  onEditorModeChange(slotIndex: 0 | 1, mode: string): void {
    const slot = this.matchEditor?.slots[slotIndex];
    if (!slot) return;
    slot.mode = mode as SlotMode;
    if (
      (slot.mode === 'winner' || slot.mode === 'loser') &&
      !slot.from &&
      this.matchEditor!.matchOptions.length
    ) {
      slot.from = this.matchEditor!.matchOptions[0].id;
    }
  }

  onEditorSeedChange(slotIndex: 0 | 1, seed: string): void {
    const slot = this.matchEditor?.slots[slotIndex];
    if (slot) slot.seed = Number(seed);
  }

  onEditorFromChange(slotIndex: 0 | 1, from: string): void {
    const slot = this.matchEditor?.slots[slotIndex];
    if (slot) slot.from = from;
  }

  applyMatchEditor(labelValue: string): void {
    const editor = this.matchEditor;
    if (!editor) return;
    this.matchEditor = null;

    const toSlot = (s: EditorSlot): BracketSlotFlex => {
      switch (s.mode) {
        case 'seed':
          return { type: 'seed', seed: s.seed };
        case 'winner':
          return s.from ? { type: 'winner', from: s.from } : { type: 'empty' };
        case 'loser':
          return s.from ? { type: 'loser', from: s.from } : { type: 'empty' };
        default:
          return { type: 'empty' };
      }
    };

    let matches = setMatchSlot(
      this.draftMatches,
      editor.matchId,
      0,
      toSlot(editor.slots[0]),
    );
    matches = setMatchSlot(matches, editor.matchId, 1, toSlot(editor.slots[1]));

    const label = labelValue.trim();
    matches = matches.map((m) =>
      m.id === editor.matchId ? { ...m, label: label || undefined } : m,
    );

    this.draftMatches = matches;
    this.recomputeLayout();
    this.scheduleRender();
  }

  cancelMatchEditor(): void {
    this.matchEditor = null;
  }

  // ─── Round-title editing ───────────────────────────────────────────────────

  private openTitleOverlay(region: HitRegion): void {
    const section = this.layout.sections.find(
      (s) => s.key === region.section,
    );
    const column = section?.columns.find((c) => c.round === region.round);
    if (!column) return;

    const tl = worldToScreen(region.x, region.y, this.transform);
    const overlay: TitleOverlay = {
      section: region.section!,
      round: region.round!,
      x: tl.x,
      y: tl.y,
      w: region.w * this.transform.k,
      h: Math.max(region.h * this.transform.k, 28),
      value: column.title,
    };

    this.ngZone.run(() => {
      this.titleOverlay = overlay;
      this.cdr.markForCheck();
    });
    setTimeout(() => {
      const el = this.titleInputRef?.nativeElement;
      el?.focus();
      el?.select();
    });
  }

  commitTitleOverlay(value: string): void {
    const overlay = this.titleOverlay;
    if (!overlay) return;
    this.titleOverlay = null;

    const title = value.trim();
    const sections = [...this.draftSections];
    let idx = sections.findIndex((s) => s.key === overlay.section);
    if (idx === -1) {
      sections.push({ key: overlay.section, order: sections.length });
      idx = sections.length - 1;
    }
    const cfg = { ...sections[idx] };
    const titles = { ...(cfg.roundTitles ?? {}) };
    if (title) {
      titles[overlay.round] = title;
    } else {
      // Clearing the input reverts to the automatic title.
      delete titles[overlay.round];
    }
    cfg.roundTitles = titles;
    sections[idx] = cfg;
    this.draftSections = sections;

    this.recomputeLayout();
    this.scheduleRender();
  }

  cancelTitleOverlay(): void {
    this.titleOverlay = null;
  }

  // ─── Section creation ──────────────────────────────────────────────────────

  toggleSectionPrompt(): void {
    this.sectionPromptOpen = !this.sectionPromptOpen;
    if (this.sectionPromptOpen) {
      setTimeout(() => this.sectionInputRef?.nativeElement?.focus());
    }
  }

  commitAddSection(name: string): void {
    const title = name.trim();
    if (!title) {
      this.sectionPromptOpen = false;
      return;
    }
    let key = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!key) key = 'section';
    let unique = key;
    let n = 2;
    while (this.draftSections.some((s) => s.key === unique)) {
      unique = `${key}-${n++}`;
    }
    this.draftSections = [
      ...this.draftSections,
      { key: unique, title, order: this.draftSections.length },
    ];
    this.sectionPromptOpen = false;
    this.recomputeLayout();
    this.scheduleRender();
  }

  cancelSectionPrompt(): void {
    this.sectionPromptOpen = false;
  }
}
