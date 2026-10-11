import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import {
  ButtonColor,
  ButtonComponent,
  ButtonSize,
  ButtonVariant,
} from '@pdz/shared/buttons/button/button.component';
import {
  BadgeTone,
  BadgeVariant,
} from '@pdz/shared/data/badge/badge.component';
import {
  CardColor,
  CardComponent,
  CardPadding,
  CardTone,
} from '@pdz/shared/data/card/card.component';
import { MenuComponent } from '@pdz/shared/menu/menu.component';
import { MenuItemComponent } from '@pdz/shared/menu/menu-item.component';
import { MenuTriggerDirective } from '@pdz/shared/menu/menu-trigger.directive';
import { SkeletonComponent } from '@pdz/shared/data/skeleton/skeleton.component';
import { SegmentedComponent } from '@pdz/shared/inputs/segmented/segmented.component';
import { SegmentedOptionComponent } from '@pdz/shared/inputs/segmented/segmented-option.component';
import { DisclosureComponent } from '@pdz/shared/layout/disclosure/disclosure.component';
import { TabNavComponent } from '@pdz/shared/layout/tab-nav/tab-nav.component';
import { TabNavLinkComponent } from '@pdz/shared/layout/tab-nav/tab-nav-link.component';
import { RouterLink, RouterLinkActive } from '@angular/router';
import {
  DialogComponent,
  DialogSize,
} from '@pdz/shared/dialogs/dialog/dialog.component';
import { DialogService } from '@pdz/shared/dialogs/dialog/dialog.service';
import {
  SpriteComponent,
  SpriteSize,
} from '@pdz/shared/images/sprite/sprite.component';
import { TeamPhotoComponent } from '@pdz/shared/images/team-photo/team-photo.component';
import { RosterPatternComponent } from '@pdz/shared/images/roster-pattern/roster-pattern.component';
import { SeasonMvpComponent } from '@pdz/shared/data/season-mvp/season-mvp.component';
import {
  PodiumComponent,
  PodiumPlace,
} from '@pdz/shared/data/podium/podium.component';
import { EmptyStateComponent } from '@pdz/shared/feedback/empty-state/empty-state.component';
import {
  MatchupComponent,
  MatchupTeam,
} from '@pdz/shared/data/matchup/matchup.component';
import { PokemonComponent } from '@pdz/shared/data/pokemon/pokemon.component';
import { TeamComponent } from '@pdz/shared/data/team/team.component';
import { TooltipDirective } from '@pdz/shared/tooltip/tooltip.directive';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';
import { WidgetComponent } from '@pdz/shared/layout/widget/widget.component';
import { SlideToggleComponent } from '@pdz/shared/inputs/slide-toggle/slide-toggle.component';
import {
  SliderComponent,
  SliderTickTone,
} from '@pdz/shared/inputs/slider/slider.component';
import { TooltipPosition } from '@pdz/shared/tooltip/tooltip-placement';
import {
  ToastService,
  ToastTone,
} from '@pdz/shared/feedback/toast/toast.service';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { CheckComponent } from '@pdz/shared/inputs/choice/check.component';
import { ChoiceDirective } from '@pdz/shared/inputs/choice/choice.directive';
import { FieldComponent } from '@pdz/shared/inputs/field/field.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { SortHeaderComponent } from '@pdz/shared/data/sort/sort-header.component';
import { Sort, SortDirective } from '@pdz/shared/data/sort/sort.directive';
import { SelectOptionComponent } from '@pdz/shared/dropdowns/select/select-option.component';
import { SelectComponent } from '@pdz/shared/dropdowns/select/select.component';
import {
  PokemonTypeComponent,
  PokemonTypeSize,
  PokemonTypeVariant,
} from '@pdz/shared/data/pokemon-type/pokemon-type.component';
import {
  ChipComponent,
  ChipTone,
  ChipVariant,
} from '@pdz/shared/data/chip/chip.component';
import { RecordComponent } from '@pdz/shared/data/record/record.component';
import {
  TeamLogoComponent,
  TeamLogoSize,
} from '@pdz/shared/images/team-logo/team-logo.component';
import { ScoreEntryGameComponent } from '@pdz/shared/widgets/score-entry/score-entry-game.component';
import { ScoreEntryMatchComponent } from '@pdz/shared/widgets/score-entry/score-entry-match.component';
import { confirmScoreEntry } from '@pdz/shared/widgets/score-entry/score-entry-warnings-dialog.component';
import {
  buildGameEntry,
  buildMatchEntry,
} from '@pdz/shared/widgets/score-entry/score-entry.form';
import { ScoreEntrySide } from '@pdz/shared/widgets/score-entry/score-entry.model';
import { CountdownComponent } from '@pdz/shared/time/countdown/countdown.component';
import { DiscordTimestampComponent } from '@pdz/shared/time/discord-timestamp/discord-timestamp.component';
import { TimeConverterComponent } from '@pdz/shared/time/time-converter/time-converter.component';

const THEME_ATTR = 'pdz-theme';
const MODE_ATTR = 'pdz-theme-mode';

@Component({
  selector: 'pdz-debug-components',
  imports: [
    ButtonComponent,
    IconComponent,
    FieldComponent,
    InputDirective,
    FormsModule,
    ReactiveFormsModule,
    CheckComponent,
    ChoiceDirective,
    CardComponent,
    MenuComponent,
    MenuItemComponent,
    MenuTriggerDirective,
    SkeletonComponent,
    SegmentedComponent,
    SegmentedOptionComponent,
    DisclosureComponent,
    TabNavComponent,
    TabNavLinkComponent,
    RouterLink,
    RouterLinkActive,
    TooltipDirective,
    DialogComponent,
    WidgetComponent,
    PageComponent,
    PageHeaderComponent,
    SlideToggleComponent,
    SliderComponent,
    SortDirective,
    SortHeaderComponent,
    SelectComponent,
    SelectOptionComponent,
    ChipComponent,
    PokemonTypeComponent,
    SpriteComponent,
    TeamPhotoComponent,
    RosterPatternComponent,
    SeasonMvpComponent,
    PodiumComponent,
    EmptyStateComponent,
    TeamComponent,
    PokemonComponent,
    MatchupComponent,
    ScoreEntryGameComponent,
    ScoreEntryMatchComponent,
    CountdownComponent,
    DiscordTimestampComponent,
    TimeConverterComponent,
    TeamLogoComponent,
    RecordComponent,
  ],
  templateUrl: './debug-components.component.html',
  styleUrl: './debug-components.component.scss',
})
export class DebugComponentsComponent {
  protected readonly countdownSamples = [
    { label: 'Days out', target: isoIn(3 * 24 * 60 + 240) },
    { label: 'Hours out', target: isoIn(5 * 60 + 20) },
    { label: 'Inside the hour', target: isoIn(35) },
    { label: 'Starting now', target: isoIn(-10) },
    { label: 'Already played', target: isoIn(-5 * 24 * 60) },
  ];

  protected readonly converterValue = signal<string | null>(
    this.countdownSamples[0].target,
  );

  protected readonly pageTypes = [
    { type: 'hub', width: 'default 64rem', header: 'full', pages: 'My Drafts, league and tournament home, pool, tools list' },
    { type: 'index', width: 'wide 96rem', header: 'compact', pages: 'Teams, standings, schedule, trades, results, lists' },
    { type: 'detail', width: 'default 64rem', header: 'full', pages: 'One team, matchup, rules, settings sections, draft and score forms' },
    { type: 'workspace', width: 'full, fills the height', header: 'compact', pages: 'Planner, drafting room, tier list and its editor, stage builder' },
    { type: 'tool', width: 'default 64rem', header: 'full', pages: 'Quick draft, random draft, wheel, time converter' },
    { type: 'form', width: 'narrow 40rem', header: 'full', pages: 'Create league or tournament, sign up, organizers, rules editor' },
    { type: 'dashboard', width: 'wide 96rem', header: 'full', pages: 'Draft page, matchup breakdowns, draft stats, replay analyzer, Pokémon search' },
  ];
  protected readonly spriteBasic = { id: 'charizard', name: 'Charizard' };
  protected readonly spriteSizes: SpriteSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  protected readonly nestTeams = [
    { name: 'Ruin Valley Ravagers', coach: 'Cal' },
    { name: 'Tidepool Tyrants', coach: 'Mira' },
    { name: 'Neon Nightshades', coach: 'Jett' },
    { name: 'Granite Gale', coach: 'Oak' },
  ];
  protected readonly versusTeams = [
    [
      { id: 'tyranitar', name: 'Tyranitar' },
      { id: 'rotomheat', name: 'Rotom-Heat' },
      { id: 'klefki', name: 'Klefki' },
      { id: 'starmie', name: 'Starmie' },
    ],
    [
      { id: 'gholdengo', name: 'Gholdengo' },
      { id: 'houndoom', name: 'Houndoom' },
      { id: 'samurott', name: 'Samurott' },
      { id: 'torterra', name: 'Torterra' },
    ],
  ];
  protected readonly spriteShiny = {
    id: 'charizard',
    name: 'Charizard',
    shiny: true,
  };
  protected readonly spriteShinyGrounded = {
    id: 'garchomp',
    name: 'Garchomp',
    shiny: true,
  };
  protected readonly photoTeam = [
    { id: 'garchomp', name: 'Garchomp' },
    { id: 'rotomheat', name: 'Rotom-Heat' },
    { id: 'sableye', name: 'Sableye' },
    { id: 'hawlucha', name: 'Hawlucha' },
    { id: 'florges', name: 'Florges' },
    { id: 'skarmory', name: 'Skarmory' },
    { id: 'toxapex', name: 'Toxapex' },
    { id: 'weavile', name: 'Weavile' },
    { id: 'amoonguss', name: 'Amoonguss' },
    { id: 'kingambit', name: 'Kingambit' },
    { id: 'clefable', name: 'Clefable' },
    { id: 'gholdengo', name: 'Gholdengo' },
    { id: 'corviknight', name: 'Corviknight' },
    { id: 'tinglu', name: 'Ting-Lu' },
    { id: 'dragapult', name: 'Dragapult' },
    { id: 'rillaboom', name: 'Rillaboom' },
    { id: 'volcarona', name: 'Volcarona' },
    { id: 'greattusk', name: 'Great Tusk' },
    { id: 'primarina', name: 'Primarina' },
  ];
  protected readonly lockupCaptain = {
    id: 'garchomp',
    name: 'Garchomp',
    capt: { tera: ['Steel', 'Fire'] },
  };
  protected readonly lockupShiny = {
    id: 'kingambit',
    name: 'Kingambit',
    shiny: true,
    capt: { z: [], dmax: true },
  };
  protected readonly lockupLong = {
    id: 'urshifurapidstrike',
    name: 'Urshifu-Rapid-Strike-Gmax With A Long Name',
  };
  protected readonly mvpTypes = ['Dragon', 'Ground'];
  protected readonly mvpStats = [
    { label: 'Games', value: 4 },
    { label: 'Fainted', value: 2 },
    { label: 'KOs/Game', value: '2.3' },
    { label: 'Team KOs', value: '39%' },
  ];
  protected readonly photoCounts = [12, 8, 5, 13, 10, 14].map((count) =>
    this.photoTeam.slice(0, count),
  );
  protected readonly podiumPlaces: PodiumPlace[] = [
    {
      name: 'Inglorious Surfers',
      coach: 'aaronmarshall',
      wins: 9,
      losses: 2,
      pokemon: this.photoTeam[0],
      you: true,
    },
    {
      name: 'Viridian Vipers',
      coach: 'misty',
      wins: 8,
      losses: 3,
      pokemon: this.photoTeam[11],
    },
    {
      name: 'Neon Nightshades With A Long Name',
      coach: 'brock',
      wins: 7,
      losses: 4,
      pokemon: this.photoTeam[4],
    },
  ];
  protected readonly teamLogoSample =
    'https://play.pokemonshowdown.com/sprites/trainers/cynthia.png';
  protected readonly matchupHero: { team1: MatchupTeam; team2: MatchupTeam } = {
    team1: {
      name: 'Inglorious Surfers',
      coach: 'aaronmarshall',
      you: true,
      score: 4,
      result: 'win',
      link: ['.'],
      pokemon: this.photoTeam.slice(0, 10),
    },
    team2: {
      name: 'Viridian Vipers',
      coach: 'misty',
      logo: this.teamLogoSample,
      score: 2,
      result: 'loss',
      link: ['.'],
      pokemon: [
        { id: 'dragonite', name: 'Dragonite' },
        { id: 'pelipper', name: 'Pelipper' },
        { id: 'barraskewda', name: 'Barraskewda' },
        { id: 'ferrothorn', name: 'Ferrothorn' },
        { id: 'heatran', name: 'Heatran' },
        { id: 'tapulele', name: 'Tapu Lele' },
        { id: 'excadrill', name: 'Excadrill' },
        { id: 'blissey', name: 'Blissey' },
        { id: 'zapdos', name: 'Zapdos' },
        { id: 'scizor', name: 'Scizor' },
      ],
    },
  };
  protected readonly matchupUpcoming: { team1: MatchupTeam; team2: MatchupTeam } = {
    team1: { ...this.matchupHero.team1, score: null, result: null },
    team2: {
      name: 'Neon Nightshades',
      coach: 'brock',
      link: ['.'],
      pokemon: this.matchupHero.team2.pokemon?.slice(0, 8),
    },
  };
  protected readonly matchupPending: { team1: MatchupTeam; team2: MatchupTeam } = {
    team1: { name: 'Viridian Vipers', coach: 'misty', logo: this.teamLogoSample },
    team2: { name: 'Winner of QF 2', pending: true, selectable: true },
  };
  protected readonly podiumPlacesNoActors = this.podiumPlaces.map(
    (place) => ({ ...place, pokemon: null, you: false }),
  );
  protected readonly photoDrafting = [
    { id: 'dragonite', name: 'Dragonite' },
    { id: 'swampert', name: 'Swampert' },
    { id: 'tauros', name: 'Tauros' },
  ];
  protected readonly spriteBordered = { id: 'greninja', name: 'Greninja' };
  protected readonly spriteFormes = {
    id: 'charizard',
    name: 'Charizard',
    draftFormes: [
      { id: 'charizardmegax', name: 'Mega Charizard X' },
      { id: 'charizardmegay', name: 'Mega Charizard Y' },
      { id: 'charizardgmax', name: 'Charizard-Gmax' },
    ],
  };
  protected readonly spriteUnreleased = {
    id: 'magearnaoriginalmega',
    name: 'Mega Magearna-Original',
  };
  protected readonly spriteUnknown = { id: 'notapokemon', name: 'Unknown' };
  protected readonly sliderPlain = signal(48);
  protected readonly sliderTicked = signal(6);
  protected readonly sliderDense = signal(32);
  protected readonly sliderToned = signal(4);
  protected readonly sliderSnapped = signal(12);
  protected readonly sliderSnaps = [0, 4, 12, 28, 60, 124, 252];
  protected readonly sliderTones: SliderTickTone[] = [
    'bad',
    'bad',
    'neutral',
    'neutral',
    'good',
    'neutral',
    'neutral',
    'good',
    'bad',
  ];
  protected readonly spriteDisabled = signal(false);
  protected readonly spriteFormeIndex = signal(0);

  readonly variants: ButtonVariant[] = [
    'filled',
    'tonal',
    'outlined',
    'ghost',
    'link',
  ];
  readonly colors: ButtonColor[] = [
    'primary',
    'secondary',
    'neutral',
    'danger',
    'success',
  ];
  readonly sizes: ButtonSize[] = ['xs', 'sm', 'md', 'lg'];
  readonly themes = ['classic', 'classic-reverse', 'fern', 'shiny', 'sunset'];

  readonly tableRows = [
    { name: 'Iron Valiant', brought: 9, kills: 14, deaths: 6, kdr: '2.33' },
    { name: 'Great Tusk', brought: 11, kills: 8, deaths: 9, kdr: '0.89' },
    { name: 'Gholdengo', brought: 7, kills: 111, deaths: 3, kdr: '37.00' },
    { name: 'Dragapult', brought: 12, kills: 21, deaths: 11, kdr: '1.91' },
  ];

  readonly tableDensities = ['compact', 'default', 'relaxed'];

  readonly sortState = signal<Sort>({ active: 'kills', direction: 'desc' });

  readonly sortedTableRows = computed(() => {
    const { active, direction } = this.sortState();
    if (!direction) return this.tableRows;

    const factor = direction === 'asc' ? 1 : -1;
    return [...this.tableRows].sort((a, b) => {
      if (active === 'name') return a.name.localeCompare(b.name) * factor;
      if (active === 'kdr')
        return (Number(a.kdr) - Number(b.kdr)) * factor;
      const key = active as 'brought' | 'kills' | 'deaths';
      return (a[key] - b[key]) * factor;
    });
  });

  readonly tableTotals = {
    brought: 39,
    kills: 154,
    deaths: 29,
  };

  readonly tableRowsLong = [
    ...this.tableRows,
    ...this.tableRows,
    ...this.tableRows,
  ];

  reportMode = signal<unknown>('standard');
  winner = signal<unknown>('side1');
  secondOpen = signal(true);
  abilities = signal(true);

  theme = signal('classic');
  mode = signal<'light' | 'dark'>('light');
  loadingDemo = signal(false);

  constructor() {
    const root = document.documentElement;
    const previous = {
      theme: root.getAttribute(THEME_ATTR),
      mode: root.getAttribute(MODE_ATTR),
    };

    effect(() => {
      root.setAttribute(THEME_ATTR, this.theme());
      root.setAttribute(MODE_ATTR, this.mode());
    });

    inject(DestroyRef).onDestroy(() => {
      this.restore(root, THEME_ATTR, previous.theme);
      this.restore(root, MODE_ATTR, previous.mode);
    });
  }

  private restore(root: HTMLElement, attr: string, value: string | null) {
    if (value === null) {
      root.removeAttribute(attr);
    } else {
      root.setAttribute(attr, value);
    }
  }

  readonly requiredCtrl = new FormControl('', Validators.required);

  touchRequired() {
    this.requiredCtrl.markAsTouched();
  }

  readonly selectValue = signal<unknown>('ou');

  readonly selectOptions = [
    { value: 'ou', label: 'OU' },
    { value: 'uu', label: 'UU' },
    { value: 'ru', label: 'RU' },
    { value: 'nu', label: 'NU' },
  ];

  readonly searchableOptions = [
    {
      group: 'Fire',
      value: 'charizard',
      label: 'Charizard',
      description: 'Fire · Flying',
    },
    {
      group: 'Fire',
      value: 'arcanine',
      label: 'Arcanine',
      description: 'Fire',
    },
    {
      group: 'Water',
      value: 'blastoise',
      label: 'Blastoise',
      description: 'Water',
    },
    {
      group: 'Water',
      value: 'gyarados',
      label: 'Gyarados',
      description: 'Water · Flying',
    },
    {
      group: 'Grass',
      value: 'venusaur',
      label: 'Venusaur',
      description: 'Grass · Poison',
    },
    {
      group: 'Grass',
      value: 'sceptile',
      label: 'Sceptile',
      description: 'Grass',
    },
  ];

  readonly chipTones: ChipTone[] = [
    'neutral',
    'primary',
    'secondary',
    'success',
    'warning',
    'danger',
    'info',
  ];
  readonly chipVariants: ChipVariant[] = ['soft', 'solid', 'outline'];

  readonly typeSizes: PokemonTypeSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  readonly typeVariants: PokemonTypeVariant[] = ['solid', 'soft', 'outline'];
  readonly sampleTypes = [
    'Fire',
    'Water',
    'Grass',
    'Fighting',
    'Ghost',
    'Steel',
    'Stellar',
  ];
  readonly selectedType = signal('Fire');

  private readonly allChips = ['Stealth Rock', 'Spikes', 'Toxic'];
  readonly demoChips = signal(this.allChips);
  readonly activeChip = signal<string | null>(null);

  dropChip(chip: string) {
    this.demoChips.update((chips) => chips.filter((c) => c !== chip));
  }

  resetChips() {
    this.demoChips.set(this.allChips);
  }

  readonly selectedCard = signal('swiss');

  readonly selectableCards = [
    { id: 'swiss', name: 'Swiss', detail: 'Pairs on record, no elimination.' },
    { id: 'rr', name: 'Round robin', detail: 'Everyone plays everyone.' },
    { id: 'single', name: 'Single elim', detail: 'One loss and you are out.' },
  ];

  readonly elevationRoles = [
    'inset',
    'ground',
    'raised',
    'raised-high',
    'overlay',
    'floating',
  ];
  readonly tones: CardTone[] = ['raised', 'raised-high'];
  readonly logoSizes: TeamLogoSize[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  readonly cardColors: CardColor[] = ['danger', 'warning', 'info', 'success'];
  readonly paddings: CardPadding[] = ['none', 'sm', 'md', 'lg'];

  indeterminate = true;

  setIndeterminate(el: HTMLInputElement) {
    el.indeterminate = this.indeterminate;
  }

  toggleLoading() {
    this.loadingDemo.update((v) => !v);
  }

  private readonly toast = inject(ToastService);

  readonly toastTones: ToastTone[] = ['success', 'error', 'warning', 'info'];

  fireToast(tone: ToastTone) {
    this.toast.show({ tone, message: TOAST_SAMPLES[tone] });
  }

  fireWithTitle() {
    this.toast.success('Trade with Team Rocket is now pending approval.', {
      title: 'Trade submitted',
    });
  }

  fireWithAction() {
    this.toast.warning('Gholdengo was removed from your draft.', {
      title: 'Pick removed',
      action: { label: 'Undo', run: () => this.toast.info('Pick restored.') },
    });
  }

  fireSticky() {
    this.toast.error(
      'Could not reach the server. Your changes were not saved.',
      {
        title: 'Save failed',
        duration: 0,
        action: { label: 'Retry', run: () => this.toast.success('Saved.') },
      },
    );
  }

  fireUndismissable() {
    this.toast.info('Syncing standings…', { dismissible: false });
  }

  fireBurst() {
    for (let i = 1; i <= 6; i++) {
      this.toast.info(`Queued notification ${i} of 6.`, { duration: 6000 });
    }
  }

  clearToasts() {
    this.toast.clear();
  }

  readonly badgeTones: BadgeTone[] = [
    'neutral',
    'primary',
    'success',
    'warning',
    'danger',
    'info',
  ];
  readonly badgeVariants: BadgeVariant[] = ['solid', 'soft', 'outline'];

  readonly plannerTab = signal(0);

  private readonly dialogs = inject(DialogService);

  readonly generations = ['Gen 7', 'Gen 8', 'Gen 9'];
  readonly generation = signal<string | undefined>(undefined);

  readonly formats = [
    { id: 'singles', name: 'Singles', group: 'Battle style' },
    { id: 'doubles', name: 'Doubles', group: 'Battle style' },
    { id: 'vgc', name: 'VGC', group: 'Battle style', disabled: true },
    { id: 'snake', name: 'Snake', group: 'Draft style' },
    { id: 'auction', name: 'Auction', group: 'Draft style' },
  ];
  readonly format = signal<string | undefined>('doubles');

  readonly rulesets = ['Standard', 'No restricted', 'Anything goes'];
  readonly rulesetCtrl = new FormControl<string | null>(
    null,
    Validators.required,
  );

  readonly mon = signal<string | undefined>(undefined);
  readonly manyOptions = [
    'Iron Valiant',
    'Great Tusk',
    'Gholdengo',
    'Dragapult',
    'Kingambit',
    'Landorus-Therian',
    'Rotom-Wash',
    'Ting-Lu',
    'Zamazenta',
    'Ogerpon',
    'Rillaboom',
    'Urshifu',
    'Volcarona',
    'Garganacl',
    'Corviknight',
  ];

  readonly dialogSizes: DialogSize[] = ['sm', 'md', 'lg', 'full'];
  readonly sizeDialogOpen = signal(false);
  readonly lockedDialogOpen = signal(false);
  readonly dialogSize = signal<DialogSize>('md');
  readonly dialogResult = signal('—');
  readonly dialogFormat = signal<string | undefined>(undefined);

  openSize(size: DialogSize) {
    this.dialogSize.set(size);
    this.sizeDialogOpen.set(true);
  }

  toastFromOpenDialog() {
    this.toast.success('Saved while the dialog is still open.');
  }

  openLocked() {
    this.lockedDialogOpen.set(true);
  }

  async openConfirm() {
    const ok = await this.dialogs.confirm('Reset the draft board?', {
      message: 'Every pick is cleared. This cannot be undone.',
      confirmLabel: 'Reset',
    });
    this.dialogResult.set(ok ? 'confirmed' : 'cancelled');
  }

  async openDestructive() {
    const ok = await this.dialogs.confirm('Delete this tournament?', {
      message: 'All teams, matchups and standings go with it.',
      confirmLabel: 'Delete',
      confirmColor: 'danger',
    });
    this.dialogResult.set(ok ? 'deleted' : 'cancelled');
    if (ok) this.toast.success('Tournament deleted.');
  }

  async openToastFromDialog() {
    const ok = await this.dialogs.confirm('Save these settings?', {
      message:
        'Confirm, and a toast fires while the dialog is still closing — it must land above the backdrop.',
      confirmLabel: 'Save',
    });
    if (ok) this.toast.success('Settings saved.');
    this.dialogResult.set(ok ? 'saved' : 'cancelled');
  }

  readonly tooltipPositions: TooltipPosition[] = [
    'above',
    'below',
    'before',
    'after',
    'left',
    'right',
  ];

  readonly tooltipLong =
    'Picks lock once the draft starts. Ask the host to unlock the board if you still need to swap something out.';

  readonly tooltipMultiline =
    'Fire, Water, Grass\nElectric, Psychic, Dark\nSteel, Fairy';

  readonly tooltipActions = [
    { icon: 'undo', label: 'Undo', tip: 'Undo (Ctrl+Z)' },
    { icon: 'redo', label: 'Redo', tip: 'Redo (Ctrl+Y)' },
    { icon: 'save', label: 'Save', tip: 'Save changes (Ctrl+S)' },
    { icon: 'delete', label: 'Delete Tier', tip: 'Delete tier' },
  ];

  readonly tooltipDialogOpen = signal(false);

  readonly scoreEntrySideNames: Record<ScoreEntrySide, string> = {
    side1: 'Alolan Exiles',
    side2: 'Rocket Grunts',
  };

  readonly scoreEntryGame = buildGameEntry(
    inject(FormBuilder),
    {
      side1: ['charizard', 'greninja', 'garchomp'],
      side2: ['gengar', 'snorlax', 'dragapult'],
    },
    {
      link: 'replay.pokemonshowdown.com/gen9draft-2200000001',
      winner: 'side1',
      side1: {
        charizard: { kills: { direct: 2 }, status: 'survived' },
        greninja: { kills: { indirect: 1 }, status: 'fainted' },
        garchomp: { status: 'brought' },
      },
      side2: {
        gengar: { kills: { direct: 1 }, status: 'fainted' },
        snorlax: { status: 'fainted' },
      },
    },
  );

  readonly scoreEntryMatch = buildMatchEntry(inject(FormBuilder), {
    side1Paste: 'pokepast.es/alolan-exiles',
    winner: 'side1',
  });

  readonly scoreEntryNotes = new FormControl('', { nonNullable: true });

  openScoreEntryChecks(): void {
    confirmScoreEntry(this.dialogs, [
      {
        where: 'Game 2',
        messages: [
          'No winner is picked.',
          'Alolan Exiles brought 5 of 6 Pokemon.',
          'Alolan Exiles is credited with 2 KOs but Rocket Grunts lost 4 Pokemon.',
        ],
      },
      {
        where: 'Match result',
        messages: [
          'Rocket Grunts is set as the winner but has the lower score.',
        ],
      },
    ]);
  }

  readonly manyTabs = [
    'Overview',
    'Roster',
    'Trades',
    'Schedule',
    'Standings',
    'Statistics',
    'Draft board',
    'Power rankings',
    'Chat',
    'Settings',
  ];
}

const TOAST_SAMPLES: Record<string, string> = {
  success: 'Draft saved.',
  error: 'Could not save your draft.',
  warning: 'Two picks are over the point limit.',
  info: 'Standings refresh every five minutes.',
};

function isoIn(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}
