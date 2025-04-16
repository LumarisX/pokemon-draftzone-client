import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { ApiService } from './api.service';

export const newsPath = 'news';

export type Section =
  | {
      type: 'para';
      description: string;
    }
  | { type: 'list'; listTitle?: string; items: string[]; ordered?: boolean }
  | { type: 'heading'; headingText: string }
  | {
      type: 'buttons';
      buttons: {
        text: string;
        disabled?: boolean;
        link: string;
        newWindow?: boolean;
      }[];
    }
  | {
      type: 'images';
      images: { title?: string; imageUrl: string; size?: 'small' | 'medium' }[];
    };
export type News = {
  title: string;
  sections: Section[];
  createdAt: string;
};
@Injectable({
  providedIn: 'root',
})
export class NewsService {
  constructor(private api: ApiService) {}

  getNews(): Observable<News[]> {
    return of([
      {
        title: 'Matchup Redesign',
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
        createdAt: '2025-04-03T12:00:00.000Z',
      },
      {
        title: 'Planner Redesign',
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
        createdAt: '2025-03-05T12:00:00.000Z',
      },
      {
        title: 'Pokémon DraftZone Battle League (PDBL)',
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
              {
                link: '/battle-zone/pdbl',
                text: 'More Details',
              },
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
        createdAt: '2025-01-20T12:00:00.000Z',
      },
      {
        title: 'Quick Matchups',
        sections: [
          {
            type: 'para',
            description:
              'Need a one-time matchup for a tournament or when subbing for a friend? Use the new Quick Matchup tool to efficiently show the matchup details between two teams! Also look forward to a new feature releasing this week that uses this new tool!',
          },
        ],
        createdAt: '2024-12-12T12:00:00.000Z',
      },
      {
        title: 'Find A League',
        sections: [
          {
            type: 'para',
            description:
              'Looking for a new draft league to join? Check out the Find A League page for a list of draft leagues and tournaments currently looking for participants! Quickly filter to find the perfect league for your skill level and interests. Want to advertise your own upcoming draft? Easily fill out a form and share with the DraftZone community.',
          },
        ],
        createdAt: '2024-10-04T12:00:00.000Z',
      },
      {
        title: 'Pokémon Search Tool',
        sections: [
          {
            type: 'para',
            description:
              'The Pokémon Search tool has been added in the planner and as its own separate tool. This is the perfect tool for when you are searching for that special Pokémon that fits all your needs!',
          },
        ],
        createdAt: '2024-08-29T12:00:00.000Z',
      },
      {
        title: 'Server Improvements',
        sections: [
          {
            type: 'para',
            description:
              "Thank you for all the support! We have had a lot of new members recently; word's definitely getting out. As a happy result, the server's been taking longer than wanted to create matchup pages. I have been rewriting the server code to speed things up and will continue over the next week. Once things get rolling smooth again, I have several new features to be implemented, so stay tuned!",
          },
        ],
        createdAt: '2024-08-15T12:00:00.000Z',
      },
      {
        title: 'New Customization Settings!',
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
        createdAt: '2024-07-08T12:00:00.000Z',
      },
      {
        title: 'Match Scoring Overhaul!',
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
        createdAt: '2024-07-03T12:00:00.000Z',
      },
      {
        title: 'Match Scheduler Beta',
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
        createdAt: '2024-06-03T12:00:00.000Z',
      },
      {
        title: 'Project Now Open Source!',
        sections: [
          {
            type: 'para',
            description:
              'The project is now fully open source! You can explore and access the code for both the client and the server. We encourage you to review the code, report any issues you find, and contribute your own ideas and improvements. Join our community of developers and help us enhance the project together!',
          },
        ],
        createdAt: '2024-05-25T12:00:00.000Z',
      },
      {
        title: 'Introducing the Draft Planner!',
        sections: [
          {
            type: 'para',
            description:
              'Introducing the Draft Planner! You can now plan out your drafts by viewing the details of your team quickly and easily. Swap Pokémon to immediately see how your team changes to create the best draft. There are many additional features that I have planned for it in the future, including charts, recommended picks, and custom filters, that will be implemented in the next few weeks. Please let me know of any bugs or issues that you experience when using it.',
          },
        ],
        createdAt: '2024-05-15T12:00:00.000Z',
      },
      {
        title: "April Fools' & Backend Updates",
        description:
          "Happy April Fools' Day! Significant effort has been invested in enhancing stability and addressing bugs on the backend. Now, you have the ability to import Pokémon from your clipboard for new drafts and teams. The draft planner is nearing completion and is scheduled for release in the coming weeks. Thanks everyone for the continued support!",
        sections: [
          {
            type: 'para',
            description:
              "Happy April Fools' Day! Significant effort has been invested in enhancing stability and addressing bugs on the backend. Now, you have the ability to import Pokémon from your clipboard for new drafts and teams. The draft planner is nearing completion and is scheduled for release in the coming weeks. Thanks everyone for the continued support!",
          },
        ],
        createdAt: '2024-04-01T12:00:00.000Z',
      },
      {
        title: 'Mobile & Speedchart Updates',
        description:
          "Got a couple of updates to share this week. Firstly, the mobile experience should be significantly improved. I've revamped the layouts to ensure nothing gets cut off when using a mobile device. Secondly, there's an update with the speedchart. You can now filter speed by modifiers. Simply look for the icon in the top right corner to adjust the visible speed modifiers as needed.",
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
        createdAt: '2024-03-12T12:00:00.000Z',
      },
      {
        title: 'Feedback & Score Button Update',
        description:
          "Thank you everyone for this first round of feedback and bug reporting. While there are still some bugs to be fixed, the major ones have been squashed at this point. I also got the Score button working so you can add the score, replay, pastes, and Pokémon statistics to each match. While there's no way to view kill leaderboards right now, I plan on adding it in the near future. Keep the feedback coming and thanks for a great first weekend!",
        sections: [
          {
            type: 'para',
            description:
              "Thank you everyone for this first round of feedback and bug reporting. While there are still some bugs to be fixed, the major ones have been squashed at this point. I also got the Score button working so you can add the score, replay, pastes, and Pokémon statistics to each match. While there's no way to view kill leaderboards right now, I plan on adding it in the near future. Keep the feedback coming and thanks for a great first weekend!",
          },
        ],
        createdAt: '2024-03-12T12:00:00.000Z',
      },
      {
        title: 'Welcome Pokémon Draftzone!',
        sections: [
          {
            type: 'para',
            description:
              "Welcome Pokémon Draftzone! I am thrilled to announce the launch of our beta testing phase! Explore the site, share feedback, and report any bugs you encounter to our Discord. Let's work together to create the ultimate Pokémon Draft experience.",
          },
        ],
        createdAt: '2024-02-29T12:00:00.000Z',
      },
    ]);
    // return this.api.get([newsPath], false);
  }
}
