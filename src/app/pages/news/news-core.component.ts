import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'news-core',
  standalone: true,
  imports: [CommonModule],
  template: `<ul class="space-y-3">
    @for (newsItem of newsItems; track $index) {
      <li>
        @if (newsItem.title) {
          <span class="text-xl font-semibold "> {{ newsItem.title }}</span>
          -
        }
        <span class="text-lg font-semibold">
          {{ newsItem.date }}
        </span>

        <h3 class="pl-4">
          <div [innerHTML]="newsItem.content"></div>
          @if (newsItem.list) {
            <ul class="ml-5 list-disc">
              @for (item of newsItem.list; track $index) {
                <li [innerHTML]="item"></li>
              }
            </ul>
          }
        </h3>
      </li>
    }
  </ul>`,
})
export class NewsCoreComponent {
  newsItems: {
    date: string;
    title?: string;
    content: string;
    list?: string[];
  }[] = [
    {
      date: 'December 12th, 2024',
      title: 'Quick Matchups',
      content: `Need a one-time matchup for a tournament or when subbing for a friend? Use the new 
        <a href="https://pokemondraftzone.com/tools/quick-matchup" class="font-semibold text-blue-500 hover:text-blue-600">
        Quick Matchup</a> to efficiently show the matchup details between two teams! Also look forward to a new feature releasing this week that uses this new tool!`,
    },
    {
      date: 'October 4th, 2024',
      content: `Looking for a new draft league to join? Check out the
        <a href="https://pokemondraftzone.com/league-list" class="font-semibold text-blue-500 hover:text-blue-600">
        Find A League</a> page for a list of draft leagues and tournaments currently looking for participants! Quickly filter to find the perfect league for your skill level and interests. Want to advertise your own upcoming draft? Easily fill out a form and share with the DraftZone community.`,
    },
    {
      date: 'August 29th, 2024',
      content: `The <a href="https://pokemondraftzone.com/tools/pokemon-search" class="font-semibold text-blue-500 hover:text-blue-600">
        Pokemon Search tool</a> has been added in the planner and as its own separate tool. This is the perfect tool for when you are searching for that special Pokemon that fits all your needs!`,
    },
    {
      date: 'August 15th, 2024',
      content: `Thank you for all the support! We have had a lot of new members recently; word's definitely getting out. As a happy result, the server's been taking longer than wanted to create matchup pages. I have been rewriting the server code to speed things up and will continue over the next week. Once things get rolling smooth again, I have several new features to be implemented, so stay tuned!`,
    },
    {
      date: 'July 8th, 2024',
      content: `New customization settings! Click your username in the top right corner to access the settings menu.`,
      list: [
        `Dark Mode: You can now use DraftZone in your bed without burning your eyes.`,
        `Themes: A colorblind-friendly grayscale theme has been added and more fun themes are planned to come. Also unlock a secret hidden theme if you're lucky enough.`,
        `Sprite Sets: Used to seeing Pokemon Showdown's sprites? Now you can change between a few options of sprites. Also more to come.`,
      ],
    },
    {
      date: 'July 3rd, 2024',
      content: `Match scoring has been overhauled!<ul class="ml-5 list-disc"><li>VGC coaches rejoice! Record the scores of <i>multiple</i> games that occur in a series.</li><li>Analyze match replays to quickly input the stats of the match. (This is not 100% accurate so please double check)</li><li></li>Highlights when stats do not line up to ensure accuracy.</ul><h2>The <b class="font-semibold">Other Tools</b> tab has also been added which contains separate replay analyzer and time conversion tools. The replay analyzer will slowly be updated to include more match details and better visuals over the next few updates. More tools are planned to be added to the tab in the future as well so stay tuned.</h2>`,
    },
    {
      date: 'June 3rd, 2024',
      content: `The match scheduler is now released in beta! Plan and compare times in both time zones to see what time works best. Save the date and time so you can easily check when your match is. Your game time is also easily visible on the matchup page for anyone you share with! Email reminders will also be included as an option in the upcoming updates! <br />
        I will be adding to and fixing the planner in the next few updates. Thank you all for being patient with the planner and letting me know the bugs you are finding!`,
    },
    {
      date: 'May 25th, 2024',
      content: `The project is now fully open source! You can explore and access the code for both the
        <a href="https://github.com/LumarisX/pokemon-draftzone-client" class="font-semibold text-blue-500">
        client</a> and the
        <a href="https://github.com/LumarisX/pokemon-draftzone-server" class="font-semibold text-blue-500">
        server</a>. We encourage you to review the code, report any issues you find, and contribute your own ideas and improvements. Join our community of developers and help us enhance the project together!`,
    },
    {
      date: 'May 15th, 2024',
      content: `Introducing the <a href="https://pokemondraftzone.com/planner" class="font-semibold text-blue-500">
        Draft Planner</a>! You can now plan out your drafts by viewing the details of your team quickly and easily. Swap Pokemon to immediately see how your team changes to create the best draft. There are many additional features that I have planned for it in the future, including charts, recommended picks, and custom filters, that will be implemented in the next few weeks. Please let me know of any bugs or issues that you experience when using it.`,
    },
    {
      date: 'April 1st, 2024',
      content: `Happy April Fools' Day! Significant effort has been invested in enhancing stability and addressing bugs on the backend. Now, you have the ability to import Pokémon from your clipboard for new drafts and teams. The draft planner is nearing completion and is scheduled for release in the coming weeks. Thanks everyone for the continued support!`,
    },
    {
      date: 'March 12th, 2024',
      content: `Got a couple of updates to share this week. Firstly, the mobile experience should be significantly improved. I've revamped the layouts to ensure nothing gets cut off when using a mobile device. Secondly, there's an update with the speedchart. You can now filter speed by modifiers. Simply look for the icon in the top right corner to adjust the visible speed modifiers as needed.`,
    },
    {
      date: 'March 3rd, 2024',
      content: `Thank you everyone for this first round of feedback and bug reporting. While there are still some bugs to be fixed, the major ones have been squashed at this point. I also got the Score button working so you can add the score, replay, pastes, and Pokémon statistics to each match. While there's no way to view kill leaderboards right now, I plan on adding it in the near future. Keep the feedback coming and thanks for a great first weekend!`,
    },
    {
      date: 'February 29th, 2024',
      content: `Welcome Pokemon Draftzone! I am thrilled to announce the launch of our beta testing phase! Explore the site, share feedback, and report any bugs you encounter to our
        <a href="https://discord.gg/sQUEBW4UVx" class="font-semibold text-blue-500">Discord</a>. Let's work together to create the ultimate Pokemon Draft experience.`,
    },
  ];
}
