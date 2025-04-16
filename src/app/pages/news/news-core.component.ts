import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatDividerModule } from '@angular/material/divider';

@Component({
  selector: 'news-core',
  standalone: true,
  imports: [CommonModule, MatDividerModule],
  template: ` <div class="space-y-1">
      <h2 class="w-full text-large font-nasa">
        Matchup Redesign - April 3rd 2025
      </h2>
      <div class="space-y-1">
        <div class="space-y-2 grid grid-cols-1 order-2 lg:order-1">
          <div>
            <div>
              Another major redesign released! This new matchup design not only
              looks more appealing but has also been optimized to make the data
              easily visible. The Speed Tier graph has also been changed to
              group adjacent speed tiers of the team team together. Simply click
              to group to toggle viewing the tiers in the group. Finally, this
              change also fixes the compatibility issues on Apple devices!
            </div>
          </div>
        </div>
        <div class="w-full flex md:flex-row flex-col md:space-x-2 items-start">
          <div class="w-full md:w-1/2">
            <strong>Old</strong>
            <img src="../../../assets/screenshots/about/matchup1.webp" />
            <img src="../../../assets/screenshots/about/matchup2.webp" />
          </div>
          <div class="w-full md:w-1/2">
            <strong>New</strong>
            <img src="../../../assets/screenshots/about/matchup_2.webp" />
          </div>
        </div>
      </div>
    </div>
    <mat-divider></mat-divider>
    <div class="space-y-1">
      <h2 class="w-full text-large font-nasa">
        Planner Redesign - March 5th 2025
      </h2>
      <div class="space-y-1">
        <div class="space-y-2 grid grid-cols-1 order-2 lg:order-1">
          <div>
            <div>
              The first of many redesigns coming to the site, the planner has
              completely rebuilt from the ground up! Not only is it less buggy,
              but its is also much cleaner and easier to see your team's stats!
            </div>
          </div>
        </div>
        <div class="w-full flex md:flex-row flex-col md:space-x-2 items-start">
          <div class="w-full md:w-1/2">
            <strong>Old</strong>
            <img src="../../../assets/screenshots/about/planner.webp" />
          </div>
          <div class="w-full md:w-1/2">
            <strong>New</strong>
            <img src="../../../assets/screenshots/about/planner2.webp" />
          </div>
        </div>
      </div>
    </div>
    <mat-divider></mat-divider>

    <div class="space-y-1">
      <h2 class="w-full text-xl font-nasa text-center">
        Pokémon DraftZone Battle League (PDBL)
      </h2>
      <div
        class="grid grid-cols-1 gap-2 lg:grid-cols-2 items-center justify-items-center"
      >
        <div class="space-y-2 grid grid-cols-1 order-2 lg:order-1">
          <div>
            <div>
              Our very own draft league is finally here and it's called the
              Pokémon DraftZone Battle League!
            </div>
            <div>
              <h2 class="font-bold">League Details</h2>
              <ul class="pl-3">
                <li><strong>Format:</strong> Singles</li>
                <li><strong>Ruleset:</strong> Gen 9 National Dex</li>
                <li>
                  <strong>Open to:</strong> Everyone - whether you're a seasoned
                  veteran, an eager newcomer, or just here for the thrill!
                </li>
                <li><strong>Prizes:</strong> A prize pool for the victors!</li>
              </ul>
            </div>
            <div>
              Look forward to intense battles and epic strategies from our
              community of passionate coaches. The PDBL is where legends will be
              made!
            </div>
            <div>
              Sign ups close Febuary 12th and drafting starts shortly after. See
              you there!
            </div>
          </div>
        </div>
        <div class="order-1 lg:order-2 space-y-4">
          <img
            class="max-w-60"
            src="../../../assets/images/battle-zone/pdbl.png"
          />
          <div class="space-x-2 w-full flex justify-center">
            <button
              class="pdblbutton"
              routerLink="/battle-zone/pdbl"
              mat-flat-button
            >
              More Details
            </button>
            <button
              class="pdblbutton"
              routerLink="/battle-zone/pdbl/sign-up"
              mat-flat-button
              disabled
            >
              Sign Up
            </button>
          </div>
        </div>
      </div>
    </div>
    <ul class="space-y-3">
      <li class="ng-star-inserted">
        <span class="text-xl font-semibold ng-star-inserted">
          Quick Matchups</span
        >
        -
        <!--container--><span class="text-lg font-semibold">
          December 12th, 2024
        </span>
        <h3 class="pl-4">
          <div>
            Need a one-time matchup for a tournament or when subbing for a
            friend? Use the new
            <a
              href="https://pokemondraftzone.com/tools/quick-matchup"
              class="font-semibold text-blue-500 hover:text-blue-600"
            >
              Quick Matchup</a
            >
            to efficiently show the matchup details between two teams! Also look
            forward to a new feature releasing this week that uses this new
            tool!
          </div>
          <!--container-->
        </h3>
      </li>
      <li class="ng-star-inserted">
        <!--container--><span class="text-lg font-semibold">
          October 4th, 2024
        </span>
        <h3 class="pl-4">
          <div>
            Looking for a new draft league to join? Check out the
            <a
              href="https://pokemondraftzone.com/league-list"
              class="font-semibold text-blue-500 hover:text-blue-600"
            >
              Find A League</a
            >
            page for a list of draft leagues and tournaments currently looking
            for participants! Quickly filter to find the perfect league for your
            skill level and interests. Want to advertise your own upcoming
            draft? Easily fill out a form and share with the DraftZone
            community.
          </div>
          <!--container-->
        </h3>
      </li>
      <li class="ng-star-inserted">
        <!--container--><span class="text-lg font-semibold">
          August 29th, 2024
        </span>
        <h3 class="pl-4">
          <div>
            The
            <a
              href="https://pokemondraftzone.com/tools/Pokémon-search"
              class="font-semibold text-blue-500 hover:text-blue-600"
            >
              Pokémon Search tool</a
            >
            has been added in the planner and as its own separate tool. This is
            the perfect tool for when you are searching for that special Pokémon
            that fits all your needs!
          </div>
          <!--container-->
        </h3>
      </li>
      <li class="ng-star-inserted">
        <!--container--><span class="text-lg font-semibold">
          August 15th, 2024
        </span>
        <h3 class="pl-4">
          <div>
            Thank you for all the support! We have had a lot of new members
            recently; word's definitely getting out. As a happy result, the
            server's been taking longer than wanted to create matchup pages. I
            have been rewriting the server code to speed things up and will
            continue over the next week. Once things get rolling smooth again, I
            have several new features to be implemented, so stay tuned!
          </div>
          <!--container-->
        </h3>
      </li>
      <li class="ng-star-inserted">
        <!--container--><span class="text-lg font-semibold">
          July 8th, 2024
        </span>
        <h3 class="pl-4">
          <div>
            New customization settings! Click your username in the top right
            corner to access the settings menu.
          </div>
          <ul class="ml-5 list-disc ng-star-inserted">
            <li class="ng-star-inserted">
              Dark Mode: You can now use DraftZone in your bed without burning
              your eyes.
            </li>
            <li class="ng-star-inserted">
              Themes: A colorblind-friendly grayscale theme has been added and
              more fun themes are planned to come. Also unlock a secret hidden
              theme if you're lucky enough.
            </li>
            <li class="ng-star-inserted">
              Sprite Sets: Used to seeing Pokémon Showdown's sprites? Now you
              can change between a few options of sprites. Also more to come.
            </li>
            <!--container-->
          </ul>
          <!--container-->
        </h3>
      </li>
      <li class="ng-star-inserted">
        <!--container--><span class="text-lg font-semibold">
          July 3rd, 2024
        </span>
        <h3 class="pl-4">
          <div>
            Match scoring has been overhauled!
            <ul class="ml-5 list-disc">
              <li>
                VGC coaches rejoice! Record the scores of
                <i>multiple</i> games that occur in a series.
              </li>
              <li>
                Analyze match replays to quickly input the stats of the match.
                (This is not 100% accurate so please double check)
              </li>
              <li></li>
              Highlights when stats do not line up to ensure accuracy.
            </ul>
            <h2>
              The <b class="font-semibold">Other Tools</b> tab has also been
              added which contains separate replay analyzer and time conversion
              tools. The replay analyzer will slowly be updated to include more
              match details and better visuals over the next few updates. More
              tools are planned to be added to the tab in the future as well so
              stay tuned.
            </h2>
          </div>
          <!--container-->
        </h3>
      </li>
      <li class="ng-star-inserted">
        <!--container--><span class="text-lg font-semibold">
          June 3rd, 2024
        </span>
        <h3 class="pl-4">
          <div>
            The match scheduler is now released in beta! Plan and compare times
            in both time zones to see what time works best. Save the date and
            time so you can easily check when your match is. Your game time is
            also easily visible on the matchup page for anyone you share with!
            Email reminders will also be included as an option in the upcoming
            updates! <br />
            I will be adding to and fixing the planner in the next few updates.
            Thank you all for being patient with the planner and letting me know
            the bugs you are finding!
          </div>
          <!--container-->
        </h3>
      </li>
      <li class="ng-star-inserted">
        <!--container--><span class="text-lg font-semibold">
          May 25th, 2024
        </span>
        <h3 class="pl-4">
          <div>
            The project is now fully open source! You can explore and access the
            code for both the
            <a
              href="https://github.com/LumarisX/Pokémon-draftzone-client"
              class="font-semibold text-blue-500"
            >
              client</a
            >
            and the
            <a
              href="https://github.com/LumarisX/Pokémon-draftzone-server"
              class="font-semibold text-blue-500"
            >
              server</a
            >. We encourage you to review the code, report any issues you find,
            and contribute your own ideas and improvements. Join our community
            of developers and help us enhance the project together!
          </div>
          <!--container-->
        </h3>
      </li>
      <li class="ng-star-inserted">
        <!--container--><span class="text-lg font-semibold">
          May 15th, 2024
        </span>
        <h3 class="pl-4">
          <div>
            Introducing the
            <a
              href="https://pokemondraftzone.com/planner"
              class="font-semibold text-blue-500"
            >
              Draft Planner</a
            >! You can now plan out your drafts by viewing the details of your
            team quickly and easily. Swap Pokémon to immediately see how your
            team changes to create the best draft. There are many additional
            features that I have planned for it in the future, including charts,
            recommended picks, and custom filters, that will be implemented in
            the next few weeks. Please let me know of any bugs or issues that
            you experience when using it.
          </div>
          <!--container-->
        </h3>
      </li>
      <li class="ng-star-inserted">
        <!--container--><span class="text-lg font-semibold">
          April 1st, 2024
        </span>
        <h3 class="pl-4">
          <div>
            Happy April Fools' Day! Significant effort has been invested in
            enhancing stability and addressing bugs on the backend. Now, you
            have the ability to import Pokémon from your clipboard for new
            drafts and teams. The draft planner is nearing completion and is
            scheduled for release in the coming weeks. Thanks everyone for the
            continued support!
          </div>
          <!--container-->
        </h3>
      </li>
      <li class="ng-star-inserted">
        <!--container--><span class="text-lg font-semibold">
          March 12th, 2024
        </span>
        <h3 class="pl-4">
          <div>
            Got a couple of updates to share this week. Firstly, the mobile
            experience should be significantly improved. I've revamped the
            layouts to ensure nothing gets cut off when using a mobile device.
            Secondly, there's an update with the speedchart. You can now filter
            speed by modifiers. Simply look for the icon in the top right corner
            to adjust the visible speed modifiers as needed.
          </div>
          <!--container-->
        </h3>
      </li>
      <li class="ng-star-inserted">
        <!--container--><span class="text-lg font-semibold">
          March 3rd, 2024
        </span>
        <h3 class="pl-4">
          <div>
            Thank you everyone for this first round of feedback and bug
            reporting. While there are still some bugs to be fixed, the major
            ones have been squashed at this point. I also got the Score button
            working so you can add the score, replay, pastes, and Pokémon
            statistics to each match. While there's no way to view kill
            leaderboards right now, I plan on adding it in the near future. Keep
            the feedback coming and thanks for a great first weekend!
          </div>
          <!--container-->
        </h3>
      </li>
      <li class="ng-star-inserted">
        <!--container--><span class="text-lg font-semibold">
          February 29th, 2024
        </span>
        <h3 class="pl-4">
          <div>
            Welcome Pokémon Draftzone! I am thrilled to announce the launch of
            our beta testing phase! Explore the site, share feedback, and report
            any bugs you encounter to our
            <a
              href="https://discord.gg/sQUEBW4UVx"
              class="font-semibold text-blue-500"
              >Discord</a
            >. Let's work together to create the ultimate Pokémon Draft
            experience.
          </div>
        </h3>
      </li>
    </ul>`,
})
export class OldNewsCoreComponent {}
