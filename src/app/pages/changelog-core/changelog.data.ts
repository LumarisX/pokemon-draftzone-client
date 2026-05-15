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
    date: '2026-02-07',
    title: 'Pokémon DraftZone Battle League (PDBL) Season 3',
    description:
      'PDBL is back with two leagues this season! Discord members voted for Paldea Dex Singles and Reg H VGC. Sign-ups close February 16th.',
    categories: [
      {
        type: 'added',
        items: [
          'PDBL Season 3 with two simultaneous leagues',
          'Paldea Dex Singles league',
          'Reg H VGC league',
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
    date: '2025-10-17',
    title: 'DraftZone Merch Shop',
    description:
      'The official DraftZone merch shop is live with designs by Mr. Twang, plus revamped membership perks.',
    categories: [
      {
        type: 'added',
        items: [
          'Official merch shop at shop.pokemondraftzone.com',
          'Revamped membership perks',
        ],
      },
    ],
  },
  {
    date: '2025-09-05',
    title: 'Pokémon DraftZone Battle League (PDBL) Season 2',
    description:
      'PDBL returns for Season 2 with a Low Tier format — make your favorite niche Pokémon shine! Sign-ups close September 20th.',
    categories: [
      {
        type: 'added',
        items: ['PDBL Season 2 (Gen 9 National Dex Low Tier Singles)'],
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
    description:
      'DraftZone is now installable as a web app on any device — no app store needed.',
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
      'Major matchup redesign with better data visibility, grouped speed tiers, and fixed Apple device compatibility.',
    categories: [
      {
        type: 'changed',
        items: [
          'Matchup page fully redesigned',
          'Speed tier graph now groups adjacent tiers of the same team',
        ],
      },
      {
        type: 'fixed',
        items: ['Compatibility issues on Apple devices'],
      },
    ],
  },
  {
    date: '2025-03-05',
    title: 'Planner Redesign',
    description:
      'The planner has been completely rebuilt from the ground up — cleaner, less buggy, and easier to read your team stats.',
    categories: [
      {
        type: 'changed',
        items: ['Planner fully rebuilt with a new design'],
      },
    ],
  },
  {
    date: '2025-01-20',
    title: 'Pokémon DraftZone Battle League (PDBL)',
    description:
      'Our very own draft league is finally here! Gen 9 National Dex Singles open to everyone. Sign-ups close February 12th.',
    categories: [
      {
        type: 'added',
        items: ['Pokémon DraftZone Battle League (Gen 9 National Dex Singles)'],
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
        items: ['Quick Matchup tool for one-time matchups'],
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
      'Improved mobile layouts, speedchart modifier filters, and the Score button is now working for adding replays and stats.',
    categories: [
      {
        type: 'added',
        items: [
          'Speed filter by modifiers in speedchart',
          'Score button for replays, pastes, and Pokémon stats',
        ],
      },
      {
        type: 'fixed',
        items: [
          'Mobile layout and display improvements',
          'Various bugs from initial launch',
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
