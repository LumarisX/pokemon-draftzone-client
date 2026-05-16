export type ChangelogCategory = 'added' | 'changed' | 'fixed' | 'removed';

export type ChangelogEntry = {
  date: string;
  title: string;
  description?: string;
  categories: {
    type: ChangelogCategory;
    items: string[];
  }[];
};

export const CHANGELOG: ChangelogEntry[] = [
  {
    date: '2026-03-10',
    title: 'Homepage & Replay Analyzer Update',
    description:
      'The homepage has been updated with easier access to important links, and the replay analyzer has been redesigned with a compact at-a-glance layout.',
    categories: [
      {
        type: 'changed',
        items: [
          'Homepage updated with quick-access links to important resources',
          'Replay analyzer redesigned with compact layout',
          'Show Details button reveals full stat breakdown in replay analyzer',
        ],
      },
    ],
  },
  {
    date: '2026-01-25',
    title: 'Teambuilder Saving and Opposite Day!',
    description:
      'Teambuilder progress now saves to your device. Also, something looks a bit off for Opposite Day...',
    categories: [
      {
        type: 'added',
        items: ['Teambuilder now saves progress locally on your device'],
      },
    ],
  },
  {
    date: '2026-01-04',
    title: 'Pokémon ZA DLC Pokémon',
    description:
      'DLC Pokémon from Pokémon ZA are now available on the site under the ZA National Dex ruleset, with placeholder sprites while official ones are pending.',
    categories: [
      {
        type: 'added',
        items: ['ZA DLC Pokémon added under the ZA National Dex ruleset'],
      },
    ],
  },
  {
    date: '2025-12-24',
    title: 'Teambuilder in Matchup & CST',
    description:
      'A teambuilder panel has been added directly to the matchup page, and a new Competitive Stat Total (CST) metric has been added to the summary.',
    categories: [
      {
        type: 'added',
        items: [
          'Teambuilder panel added to the matchup page',
          'Drag and drop Pokémon into speed tiers without calcing EVs/IVs',
          'Export team directly to Showdown from the teambuilder',
          'Competitive Stat Total (CST) added to the summary page',
        ],
      },
    ],
  },
  {
    date: '2025-12-15',
    title: 'Find a League Returns & Matchup Notes',
    description:
      'Find a League is back with format and ruleset filters. Matchup notes with full Markdown support have also been added to every matchup.',
    categories: [
      {
        type: 'added',
        items: [
          'Find a League restored with format and ruleset filters',
          'Matchup notes with Markdown support (lists, headers, bold, italics, etc.)',
        ],
      },
    ],
  },
  {
    date: '2025-11-01',
    title: 'ZA National Dex Format',
    description:
      'A new ZA National Dex format has been added, including all the new Mega Evolutions from Pokémon ZA.',
    categories: [
      {
        type: 'added',
        items: ['ZA National Dex format with all new Mega Evolutions'],
      },
    ],
  },
  {
    date: '2025-10-17',
    title: 'Sunset Theme',
    description:
      'Themes are back and better than ever with a completely reworked theming system. Check out the new Sunset theme in your settings.',
    categories: [
      {
        type: 'added',
        items: ['Sunset theme'],
      },
      {
        type: 'changed',
        items: [
          'Theme system reworked for easier maintenance and future themes',
        ],
      },
    ],
  },
  {
    date: '2025-10-03',
    title: 'Homepage & My Drafts Redesign',
    description:
      'Both the homepage and the My Drafts page have received a fresh new look.',
    categories: [
      {
        type: 'changed',
        items: ['Homepage redesigned', 'My Drafts page redesigned'],
      },
    ],
  },
  {
    date: '2025-06-26',
    title: 'Matches Page Redesign',
    description:
      'The Matches page has been redesigned with a more compact layout, more matchup info at a glance, and draft statistics built right in.',
    categories: [
      {
        type: 'changed',
        items: [
          'Matches page redesigned for compactness and clarity',
          'Draft statistics added to the Matches page',
          'Adding a drafted Pokémon now defaults to the Captain tab',
        ],
      },
      {
        type: 'added',
        items: [
          'Nat Dex number now works in the Finder',
          'LGPE starters added',
        ],
      },
      {
        type: 'fixed',
        items: [
          'Accidental caching on matchups and other pages',
          'Water types no longer show ??? type in the Finder',
          'Coach name not saving on a new matchup',
        ],
      },
      {
        type: 'removed',
        items: ['Find a League temporarily disabled'],
      },
    ],
  },
  {
    date: '2025-05-21',
    title: 'Quick Draft',
    description:
      'Quickly generate a draft across multiple Showdown tiers, export to PokePaste, and jump straight into a Quick Matchup.',
    categories: [
      {
        type: 'added',
        items: ['Quick Draft tool for fast friend drafts'],
      },
      {
        type: 'fixed',
        items: [
          'Sprites facing the wrong direction',
          'Basiculin-Blue-Stripe sprite issue',
        ],
      },
    ],
  },
  {
    date: '2025-04-17',
    title: 'Web App (PWA)',
    description: 'DraftZone is now installable as a web app on any device.',
    categories: [
      {
        type: 'added',
        items: [
          'DraftZone installable as a PWA on all devices',
          'Ability toggle for Coverage widget',
          'Unread news badge on the logo',
        ],
      },
      {
        type: 'changed',
        items: ['Updated homepage theme', 'Settings now sync across devices'],
      },
      {
        type: 'fixed',
        items: [
          'Move names added back to Coverage widget',
          'Typechart stats update with ability toggle',
          'Speed tier reset button',
        ],
      },
    ],
  },
  {
    date: '2025-04-03',
    title: 'Matchup Redesign',
    description:
      'Major matchup redesign with better data visibility, grouped speed tiers, and redesigned opponent/draft forms.',
    categories: [
      {
        type: 'changed',
        items: [
          'Matchup page fully redesigned',
          'Speed tier graph now groups adjacent tiers of the same team',
          'Opponent and draft forms redesigned with more Pokémon options',
        ],
      },
      {
        type: 'fixed',
        items: [
          'Compatibility issues on Apple devices',
          'Form layout issues on mobile',
        ],
      },
    ],
  },
  {
    date: '2025-03-05',
    title: 'Planner Redesign',
    description:
      'The planner has been completely rebuilt tab by tab. Draft statistics, movechart, summary, typechart, and coverage all received new designs. Ruleset and format dropdowns are now grouped for clarity.',
    categories: [
      {
        type: 'changed',
        items: [
          'Planner team view fully rebuilt',
          'Draft statistics page redesigned',
          'Movechart redesigned',
          'Summary redesigned (now iOS compatible)',
          'Typechart redesigned',
          'Coverage chart redesigned',
          'Ruleset and format dropdowns now use a grouped layout',
        ],
      },
      {
        type: 'fixed',
        items: ['Various planner bugs reported during redesign rollout'],
      },
    ],
  },
  {
    date: '2025-02-11',
    title: 'New League Notification Badge',
    description:
      'A badge icon now appears on the logo when new leagues have been posted.',
    categories: [
      {
        type: 'added',
        items: ['Badge icon on logo for new league notifications'],
      },
    ],
  },
  {
    date: '2025-02-06',
    title: 'Time Converter Redesign',
    description:
      'The time converter has been redesigned to be more intuitive, with a new slider for easier time selection.',
    categories: [
      {
        type: 'changed',
        items: ['Time converter redesigned with a slider for easier use'],
      },
    ],
  },
  {
    date: '2025-01-30',
    title: 'Typechart Ability Toggle',
    description:
      'A toggle has been added to the typechart to turn abilities on or off when calculating type matchups.',
    categories: [
      {
        type: 'added',
        items: ['Ability toggle for the typechart'],
      },
    ],
  },
  {
    date: '2025-01-10',
    title: 'Supporters Page',
    description:
      'A new Supporters page has been added to show appreciation to everyone who supports the site.',
    categories: [
      {
        type: 'added',
        items: ['Supporters page'],
      },
    ],
  },
  {
    date: '2024-12-18',
    title: 'Theme System Rework',
    description:
      'The theming system has been completely reworked, making it much easier to create new themes. A Christmas theme was added to celebrate the season.',
    categories: [
      {
        type: 'added',
        items: ['Christmas theme'],
      },
      {
        type: 'changed',
        items: [
          'Theme system rebuilt (reduced from 100+ manual color values to just 2 base colors)',
        ],
      },
    ],
  },
  {
    date: '2024-12-13',
    title: 'Random Draft Tool',
    description:
      'Instantly generate a random draft team across any generation. Add it directly to a new league or Quick Matchup with one click.',
    categories: [
      {
        type: 'added',
        items: [
          'Random Draft tool',
          'One-click export to Quick Matchup or new league from Random Draft',
        ],
      },
    ],
  },
  {
    date: '2024-12-12',
    title: 'Quick Matchups',
    description:
      'Need a one-time matchup for a tournament or sub? The new Quick Matchup tool gives instant team vs. team breakdowns.',
    categories: [
      {
        type: 'added',
        items: [
          'Quick Matchup tool for one-time matchups',
          'BST added to Pokémon stats',
        ],
      },
    ],
  },
  {
    date: '2024-11-30',
    title: 'Replay Analyzer, Cache & UX Fixes',
    description:
      'Replay analyzer rewritten to handle more battle events, cache now clears immediately on edit, and several form and UI improvements.',
    categories: [
      {
        type: 'changed',
        items: [
          'Replay analyzer rewritten to better handle Illusion and other battle events',
          'Adding a Pokémon now uses a dropdown instead of a separate add button',
          'Draft and opponent forms cleaned up for clarity',
        ],
      },
      {
        type: 'fixed',
        items: [
          'Edits now clear the cache immediately (previously took up to 15 minutes)',
        ],
      },
    ],
  },
  {
    date: '2024-10-22',
    title: 'New Dropdowns',
    description:
      'Dropdowns across the site have been replaced with a new component that is more mobile-friendly and easier to use.',
    categories: [
      {
        type: 'changed',
        items: [
          'Dropdown components replaced site-wide with a more mobile-friendly design',
        ],
      },
    ],
  },
  {
    date: '2024-10-04',
    title: 'Find A League',
    description:
      'Browse draft leagues and tournaments looking for participants. Filter by skill level and advertise your own league.',
    categories: [
      {
        type: 'added',
        items: [
          'Find A League page with filters',
          'League advertisement submission form',
        ],
      },
    ],
  },
  {
    date: '2024-08-29',
    title: 'Pokémon Search Tool',
    description:
      'A Pokémon search tool is now available in the planner and as a standalone tool for finding the perfect pick.',
    categories: [
      {
        type: 'added',
        items: ['Pokémon Search tool in the planner and as a standalone page'],
      },
    ],
  },
  {
    date: '2024-08-15',
    title: 'Server Improvements',
    description:
      'Backend rewrite to improve matchup page generation speed following rapid growth in new members.',
    categories: [
      {
        type: 'changed',
        items: ['Server code rewritten for improved performance and stability'],
      },
    ],
  },
  {
    date: '2024-07-08',
    title: 'Customization Settings',
    description:
      'New settings menu accessible from your username. Includes dark mode, themes, and sprite set options.',
    categories: [
      {
        type: 'added',
        items: [
          'Dark mode',
          'Colorblind-friendly grayscale theme',
          'Sprite set options including Showdown sprites',
        ],
      },
    ],
  },
  {
    date: '2024-07-03',
    title: 'Match Scoring Overhaul',
    description:
      'Match scoring rebuilt with VGC series support, replay analysis for quick stat input, and a new Other Tools tab.',
    categories: [
      {
        type: 'changed',
        items: ['Match scoring overhauled', 'Other Tools tab added'],
      },
      {
        type: 'added',
        items: [
          'VGC multi-game series scoring',
          'Replay analyzer for quick stat entry',
        ],
      },
    ],
  },
  {
    date: '2024-06-03',
    title: 'Match Scheduler Beta',
    description:
      'Plan and compare match times across time zones, save your scheduled time, and see it on the matchup page.',
    categories: [
      {
        type: 'added',
        items: [
          'Match scheduler with time zone comparison',
          'Scheduled time visible on matchup page',
        ],
      },
    ],
  },
  {
    date: '2024-05-25',
    title: 'Project Now Open Source',
    description:
      'Both the client and server code are now fully open source. Explore, report issues, and contribute!',
    categories: [
      {
        type: 'changed',
        items: ['Project fully open sourced (client and server)'],
      },
    ],
  },
  {
    date: '2024-05-15',
    title: 'Draft Planner',
    description:
      'Introducing the Draft Planner! View your team details quickly, swap Pokémon to compare options, and plan the perfect draft.',
    categories: [
      {
        type: 'added',
        items: ['Draft Planner with team stat views and Pokémon swapping'],
      },
    ],
  },
  {
    date: '2024-04-01',
    title: "April Fools' & Backend Updates",
    description:
      'Significant backend stability improvements. Pokémon can now be imported from clipboard for new drafts.',
    categories: [
      {
        type: 'added',
        items: ['Import Pokémon from clipboard for new drafts'],
      },
      {
        type: 'changed',
        items: ['Backend stability improvements and bug fixes'],
      },
    ],
  },
  {
    date: '2024-03-12',
    title: 'Mobile, Speedchart & Score Button',
    description:
      'Improved mobile layouts, overhauled speedchart, scoring with replays/pastes/stats, and several quality-of-life fixes.',
    categories: [
      {
        type: 'added',
        items: [
          'Score button for adding replays, PokéPastes, and Pokémon stats per match',
          'Match score summary header',
          'Speed modifier filter in speedchart',
          "Toggle visibility for each team's speed tiers in speedchart",
          'Base speeds now shown visually on the left of the speedchart',
          'Matchup details panel (league name, stage, ruleset, format level)',
          'Archaludon and Indigo Disk Pokémon sprites',
          'Loading indicator for page load states',
        ],
      },
      {
        type: 'fixed',
        items: [
          'Mobile layout and display improvements',
          'Tera type selection significantly improved',
          'Typechart borders added for improved readability',
          'Move Coverage widget size corrected',
          "Farfetch'd and Flabébé names displaying incorrectly",
          'Speedchart no longer shows Choice Scarf/Iron Ball tiers for Pokémon that must hold a specific item (e.g. Megas, Ogerpon)',
        ],
      },
    ],
  },
  {
    date: '2024-02-29',
    title: 'Welcome to Pokémon DraftZone!',
    description:
      'The beta is live! Explore the site, share feedback, and report bugs to our Discord.',
    categories: [
      {
        type: 'added',
        items: ['Beta launch of Pokémon DraftZone'],
      },
    ],
  },
];
