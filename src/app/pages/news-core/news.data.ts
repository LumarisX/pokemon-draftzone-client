import { News } from '../../services/news.service';

export const NEWS: News[] = [
  {
    title: 'New designs just in time for summer!',
    createdAt: '2026-05-22T19:09:00.000Z',
    sections: [
      {
        type: 'images',
        images: [
          {
            imageUrl: '../../../assets/images/battle-zone/merch2.png',
            size: 'large',
          },
        ],
      },
      {
        type: 'buttons',
        buttons: [
          {
            text: 'Check out the Shop',
            href: 'https://shop.pokemondraftzone.com',
            newWindow: true,
          },
        ],
      },
      {
        type: 'para',
        description:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse venenatis molestie velit sit amet interdum. Aenean sit amet ultrices tortor. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Pellentesque porta magna sit amet risus suscipit condimentum. Proin accumsan ante sed aliquet posuere. Aliquam congue, dui eget rutrum scelerisque, nibh sapien posuere felis, non tempor arcu sem vitae nisl. Ut fermentum, nibh sit amet pulvinar condimentum, mi nisi varius quam, eu iaculis justo massa sit amet nibh. Nulla ullamcorper gravida augue nec pulvinar. Sed eget volutpat dui. Phasellus non erat sed lacus egestas placerat nec sed magna. Donec nec dui at tellus dapibus porttitor. In interdum neque ac iaculis rhoncus. Ut ac lectus tincidunt, faucibus sem at, ultricies velit. Maecenas sit amet lorem nisl. Nunc scelerisque justo aliquam augue rhoncus elementum. Sed elementum consectetur justo, id tempus velit porta vitae. Vivamus pretium, risus a fermentum lobortis, est justo gravida velit, eget venenatis sapien ante blandit tellus. ',
      },
    ],
  },
  {
    title: 'Pokémon DraftZone Battle League (PDBL) Season 3',
    createdAt: '2026-02-07T18:24:15.266Z',
    sections: [
      {
        type: 'images',
        images: [
          {
            imageUrl: '../../../assets/images/battle-zone/pdbl.png',
            size: 'medium',
          },
        ],
      },
      {
        type: 'buttons',
        buttons: [
          { link: '/leagues/pdbl/tournaments/s3-singles', text: 'Singles' },
          { link: '/leagues/pdbl/tournaments/s3-vgc', text: 'VGC' },
        ],
      },
      {
        type: 'para',
        description:
          "Its time to kick off our third season of PDBL and we'll now be running TWO leagues! Our discord members voted and Paldea Dex Singles and Reg H VGC will be the formats for this season!",
      },
      {
        type: 'para',
        description:
          'Look forward to more intense battles and epic strategies from our community of passionate coaches. The PDBL is where legends will be made!',
      },
      {
        type: 'para',
        description:
          'Sign-ups close February 16th and drafting starts shortly after. See you there!',
      },
    ],
  },
  {
    title: 'Teambuilder Saving and Opposite Day!',
    createdAt: '2026-01-25T18:00:00.000Z',
    sections: [
      {
        type: 'markdown',
        description:
          "### Teambuilder Saving\nWe heard you loud and clear and we've made it happen. Building in your teambuilder now saves your progress on your device so you can come back to it whenever you feel like it! Have other suggestions for the site? Make sure to join our Discord server so we can hear your voice!\n### Happy Opposite Day!\nSome things on the site are looking a bit off this Opposite Day. But I can't quite put my finger on what it is...",
      },
    ],
  },
  {
    title: 'Happy Teambuilder and More!',
    createdAt: '2025-12-24T19:09:00.000Z',
    sections: [
      {
        type: 'markdown',
        description:
          "### Merry Christmas! \nI hope you all have a fantastic Christmas and holiday season! Now here's your present!\n### Teambuilder added to matchup\nI've added a teambuilder to the matchup page, no more need to switch between Showdown and DraftZone while you're prepping! Look in the bottom right corner for a tag to pull out the panel. Currently I've implemented the essentials but don't worry! I have big plans coming for the teambuilder so expect many more updates for it! This first exciting feature is that you can drag and drop you Pokémon into its desired speed tier to quickly place it without calcing EVs and IVs. And of course, when you are done building, you can export the team into showdown by pasting the team code as normal.\n### CST added to Summary\nIn my experience, I've found BST isn't a great evaluation to the viability of a Pokémon. For example, depending on the distribution, two mons with a BST of 600 may be completely different viably. So I've added my own formula called the Competitive Stat Total (CST). Most Pokémon's CST are similar to their BST but with a few adjustments to correct for how viable they are and break ties.",
      },
    ],
  },
  {
    title: 'Draftzone merch shop is here!',
    createdAt: '2025-10-17T19:09:00.000Z',
    sections: [
      {
        type: 'images',
        images: [
          {
            imageUrl: '../../../assets/images/battle-zone/merch.png',
            size: 'large',
          },
        ],
      },
      {
        type: 'buttons',
        buttons: [
          {
            text: 'Check out the Shop',
            href: 'https://shop.pokemondraftzone.com',
            newWindow: true,
          },
        ],
      },
      {
        type: 'para',
        description:
          'This has been a long time in the making and a testament to all of you who have shown your support through using the site, sharing it with friends, engaging with the community, and generously donating to help development. With this site comes an opportunity to give back to you all both with now revamped membership perks, and of course - Sweet Merch to Rock!',
      },
      {
        type: 'para',
        description:
          "We wanted to show our appreciation for you all in a tangible way and thanks to the kickass designs made by our very our own Mr. Twang! We think we've made something you will love!",
      },
      {
        type: 'para',
        description:
          'Thank you for continuing this journey with us and we hope you are as excited as we are!',
      },
    ],
  },
  {
    title: 'Pokémon DraftZone Battle League (PDBL) Season 2',
    createdAt: '2025-09-05T19:09:00.000Z',
    sections: [
      {
        type: 'images',
        images: [
          {
            imageUrl: '../../../assets/images/battle-zone/pdbls2.png',
            size: 'medium',
          },
        ],
      },
      {
        type: 'buttons',
        buttons: [
          { link: '/leagues/pdbls2', text: 'More Details' },
          { link: '/leagues/pdbls2/sign-up', text: 'Draft Sign Up' },
        ],
      },
      {
        type: 'para',
        description:
          'After our resounded success of our first draft league, PDBL is back for round 2! This time our discord members voted and chose to do a Low Tier format so this is your time to make your favorite niche Pokemon shine!',
      },
      {
        type: 'heading',
        headingText: 'League Details',
      },
      {
        type: 'list',
        items: [
          'Format: Singles',
          'Ruleset: Gen 9 National Dex',
          "Open to: Everyone - whether you're a seasoned veteran, an eager newcomer, or just here for the thrill!",
          'Prizes: A prize pool for the victors!  All of our prizes are from donations so please consider donating.',
        ],
      },
      {
        type: 'para',
        description:
          'Look forward to intense battles and epic strategies from our community of passionate coaches. The PDBL is where legends will be made!',
      },
      {
        type: 'para',
        description:
          'Sign-ups close September 20th and drafting starts shortly after. See you there!',
      },
    ],
  },
  {
    title: 'Matches Page Redesign',
    createdAt: '2025-06-26T18:14:37.000Z',
    sections: [
      {
        type: 'para',
        description:
          "The Matches page has gotten a redesign! Everything is much more compact and I've included even more info about your matchups to see at a glance. Your draft's statistics has also been added right onto this page! You can see both the new and old versions in the images attached.",
      },
      {
        type: 'heading',
        headingText: 'Other Updates',
      },
      {
        type: 'list',
        items: [
          'Adding a drafted pokemon now defaults to the Captain tab',
          "Fixed accidental caching (matchups and other pages weren't refreshing automatically)",
          'Nat Dex Number now works in the Finder',
          'Water types no longer say they have the ??? type on the Finder',
          'Find a League has been temporarilly disabled. In the meantime I suggest checking our discord for League Ads',
          'Fixed Coach Name not saving on a new matchup',
          'Added LGPE starters',
        ],
      },
    ],
  },
  {
    title: 'Quick Draft',
    createdAt: '2025-05-21T18:14:37.000Z',
    sections: [
      {
        type: 'para',
        description:
          "Love playing draft with your friends but can't commit to a multiweek draft? Introducing our own Quick Draft! Quickly generate a draft spanning across multiple current showdown tiers in any of  your favorite generations. Once you have selected the perfect team, send it to PokePaste for easy sharing or importing into Showdown, and then send it right to a Quick Matchup so you can get right into prepping to take down your opponent!",
      },
      {
        type: 'heading',
        headingText: 'Other Updates',
      },
      {
        type: 'list',
        items: [
          'Fixed bugs with sprites facing the wrong way',
          'Freed basculin-blue-stripe from fish jail',
        ],
      },
    ],
  },
  {
    title: 'Web App Update',
    createdAt: '2025-04-18T03:30:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          'The convience of DraftZone is now one click away. DraftZone is now available as an install web app on all devices! No need to use an app store, you can install it by looking for the "Install" or "Add to Home" button.',
      },
      {
        type: 'heading',
        headingText: 'Other Updates',
      },
      {
        type: 'list',
        items: [
          'Added ability toggle for Coverage widget',
          "Updated homepage's theme",
          'Settings now sync across devices',
          'Unread news now shows a badge on the logo',
          'Server improvements',
        ],
      },
      {
        type: 'heading',
        headingText: 'Bug Fixes',
      },
      {
        type: 'list',
        items: [
          'Move names added back to Coverage widget',
          'Typechart stats update with ability toggle',
          'Settings now sync across devices',
          'Speedtier reset button fixed',
        ],
      },
    ],
  },
  {
    title: 'Matchup Redesign',
    createdAt: '2025-04-03T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          'Another major redesign released! This new matchup design not only looks more appealing but has also been optimized to make the data easily visible. The Speed Tier graph has also been changed to group adjacent speed tiers of the same team together. Simply click to group to toggle viewing the tiers in the group. Finally, this change also fixes the compatibility issues on Apple devices!',
      },
      {
        type: 'images',
        images: [
          {
            title: 'Old',
            imageUrl: '../../../assets/screenshots/about/matchup1.webp',
          },
          {
            title: 'New',
            imageUrl: '../../../assets/screenshots/about/matchup_2.webp',
          },
        ],
      },
    ],
  },
  {
    title: 'Planner Redesign',
    createdAt: '2025-03-05T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          "The first of many redesigns coming to the site, the planner has completely rebuilt from the ground up! Not only is it less buggy, but its is also much cleaner and easier to see your team's stats!",
      },
      {
        type: 'images',
        images: [
          {
            title: 'Old',
            imageUrl: '../../../assets/screenshots/about/planner.webp',
          },
          {
            title: 'New',
            imageUrl: '../../../assets/screenshots/about/planner2.webp',
          },
        ],
      },
    ],
  },
  {
    title: 'Pokémon DraftZone Battle League (PDBL)',
    createdAt: '2025-01-20T12:00:00.000Z',
    sections: [
      {
        type: 'images',
        images: [
          {
            imageUrl: '../../../assets/images/battle-zone/pdbl.png',
            size: 'medium',
          },
        ],
      },
      {
        type: 'buttons',
        buttons: [
          { link: '/battle-zone/pdbl', text: 'More Details' },
          {
            link: '/battle-zone/pdbl/sign-up',
            text: 'Sign Up',
            disabled: true,
          },
        ],
      },
      {
        type: 'para',
        description:
          "Our very own draft league is finally here and it's called the Pokémon DraftZone Battle League!",
      },
      {
        type: 'heading',
        headingText: 'League Details',
      },
      {
        type: 'list',
        items: [
          'Format: Singles',
          'Ruleset: Gen 9 National Dex',
          "Open to: Everyone - whether you're a seasoned veteran, an eager newcomer, or just here for the thrill!",
          'Prizes: A prize pool for the victors!',
        ],
      },
      {
        type: 'para',
        description:
          'Look forward to intense battles and epic strategies from our community of passionate coaches. The PDBL is where legends will be made!',
      },
      {
        type: 'para',
        description:
          'Sign ups close Febuary 12th and drafting starts shortly after. See you there!',
      },
    ],
  },
  {
    title: 'Quick Matchups',
    createdAt: '2024-12-12T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          'Need a one-time matchup for a tournament or when subbing for a friend? Use the new Quick Matchup tool to efficiently show the matchup details between two teams! Also look forward to a new feature releasing this week that uses this new tool!',
      },
    ],
  },
  {
    title: 'Find A League',
    createdAt: '2024-10-04T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          'Looking for a new draft league to join? Check out the Find A League page for a list of draft leagues and tournaments currently looking for participants! Quickly filter to find the perfect league for your skill level and interests. Want to advertise your own upcoming draft? Easily fill out a form and share with the DraftZone community.',
      },
    ],
  },
  {
    title: 'Pokémon Search Tool',
    createdAt: '2024-08-29T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          'The Pokémon Search tool has been added in the planner and as its own separate tool. This is the perfect tool for when you are searching for that special Pokémon that fits all your needs!',
      },
    ],
  },
  {
    title: 'Server Improvements',
    createdAt: '2024-08-15T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          "Thank you for all the support! We have had a lot of new members recently; word's definitely getting out. As a happy result, the server's been taking longer than wanted to create matchup pages. I have been rewriting the server code to speed things up and will continue over the next week. Once things get rolling smooth again, I have several new features to be implemented, so stay tuned!",
      },
    ],
  },
  {
    title: 'New Customization Settings!',
    createdAt: '2024-07-08T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          'New customization settings! Click your username in the top right corner to access the settings menu.',
      },
      {
        type: 'list',
        items: [
          'Dark Mode: You can now use DraftZone in your bed without burning your eyes.',
          "Themes: A colorblind-friendly grayscale theme has been added and more fun themes are planned to come. Also unlock a secret hidden theme if you're lucky enough.",
          "Sprite Sets: Used to seeing Pokémon Showdown's sprites? Now you can change between a few options of sprites. Also more to come.",
        ],
      },
    ],
  },
  {
    title: 'Match Scoring Overhaul!',
    createdAt: '2024-07-03T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description: 'Match scoring has been overhauled!',
      },
      {
        type: 'list',
        items: [
          'VGC coaches rejoice! Record the scores of multiple games that occur in a series.',
          'Analyze match replays to quickly input the stats of the match. (This is not 100% accurate so please double check)',
          'Highlights when stats do not line up to ensure accuracy.',
        ],
      },
      {
        type: 'para',
        description:
          'The Other Tools tab has also been added which contains separate replay analyzer and time conversion tools. The replay analyzer will slowly be updated to include more match details and better visuals over the next few updates. More tools are planned to be added to the tab in the future as well so stay tuned.',
      },
    ],
  },
  {
    title: 'Match Scheduler Beta',
    createdAt: '2024-06-03T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          'The match scheduler is now released in beta! Plan and compare times in both time zones to see what time works best. Save the date and time so you can easily check when your match is. Your game time is also easily visible on the matchup page for anyone you share with! Email reminders will also be included as an option in the upcoming updates!',
      },
      {
        type: 'para',
        description:
          'I will be adding to and fixing the planner in the next few updates. Thank you all for being patient with the planner and letting me know the bugs you are finding!',
      },
    ],
  },
  {
    title: 'Project Now Open Source!',
    createdAt: '2024-05-25T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          'The project is now fully open source! You can explore and access the code for both the client and the server. We encourage you to review the code, report any issues you find, and contribute your own ideas and improvements. Join our community of developers and help us enhance the project together!',
      },
    ],
  },
  {
    title: 'Introducing the Draft Planner!',
    createdAt: '2024-05-15T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          'Introducing the Draft Planner! You can now plan out your drafts by viewing the details of your team quickly and easily. Swap Pokémon to immediately see how your team changes to create the best draft. There are many additional features that I have planned for it in the future, including charts, recommended picks, and custom filters, that will be implemented in the next few weeks. Please let me know of any bugs or issues that you experience when using it.',
      },
    ],
  },
  {
    title: "April Fools' & Backend Updates",
    createdAt: '2024-04-01T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          "Happy April Fools' Day! Significant effort has been invested in enhancing stability and addressing bugs on the backend. Now, you have the ability to import Pokémon from your clipboard for new drafts and teams. The draft planner is nearing completion and is scheduled for release in the coming weeks. Thanks everyone for the continued support!",
      },
    ],
  },
  {
    title: 'Mobile & Speedchart Updates',
    createdAt: '2024-03-12T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          "Got a couple of updates to share this week. Firstly, the mobile experience should be significantly improved. I've revamped the layouts to ensure nothing gets cut off when using a mobile device.",
      },
      {
        type: 'para',
        description:
          "Secondly, there's an update with the speedchart. You can now filter speed by modifiers. Simply look for the icon in the top right corner to adjust the visible speed modifiers as needed.",
      },
    ],
  },
  {
    title: 'Feedback & Score Button Update',
    createdAt: '2024-03-12T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          "Thank you everyone for this first round of feedback and bug reporting. While there are still some bugs to be fixed, the major ones have been squashed at this point. I also got the Score button working so you can add the score, replay, pastes, and Pokémon statistics to each match. While there's no way to view kill leaderboards right now, I plan on adding it in the near future. Keep the feedback coming and thanks for a great first weekend!",
      },
    ],
  },
  {
    title: 'Welcome to Pokémon Draftzone!',
    createdAt: '2024-02-29T12:00:00.000Z',
    sections: [
      {
        type: 'para',
        description:
          "Welcome to Pokémon Draftzone! I am thrilled to announce the launch of our beta testing phase! Explore the site, share feedback, and report any bugs you encounter to our Discord. Let's work together to create the ultimate Pokémon Draft experience.",
      },
    ],
  },
];
