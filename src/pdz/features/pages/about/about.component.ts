import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PLANNER_PATH } from '@pdz/core/route-paths';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';

interface Feature {
  id: string;
  heading: string;
  intro: string;
  items: { term: string; text: string }[];
  image: string;
  alt: string;
  tall?: boolean;
  plannerLink?: boolean;
}

@Component({
  selector: 'pdz-about',
  imports: [CardComponent, PageComponent, PageHeaderComponent, RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  readonly plannerLink = ['/', PLANNER_PATH];

  readonly features: Feature[] = [
    {
      id: 'drafts',
      heading: 'Drafts',
      intro:
        "Keep every draft in one place. Whether you're mid-season or looking back at an archived league, DraftZone keeps your teams and progress organized.",
      items: [
        {
          term: 'Current and archived drafts',
          text: 'Open a live draft or revisit an old one. Everything you need for an upcoming match or a look back at past results is in one place.',
        },
        {
          term: 'Team statistics',
          text: 'See which Pokémon carry your team and which ones need a rethink, with kills, deaths and usage tracked across the season.',
        },
        {
          term: 'Every generation and format',
          text: 'From older generations to the latest VGC rules, including National Dex, in Singles or Doubles.',
        },
      ],
      image: '/assets/screenshots/about/draftoverview.webp',
      alt: 'The draft overview page listing current drafts',
    },
    {
      id: 'opponents',
      heading: 'Track Opponents',
      intro:
        "Follow your opponents' teams week by week, from their draft picks to your recorded results.",
      items: [
        {
          term: 'Match overview',
          text: 'See upcoming matches and past results at a glance, with scores, teams and outcomes.',
        },
        {
          term: 'Scores and results',
          text: 'Record scores, kills, deaths and pastes to track how you perform across the league.',
        },
        {
          term: 'Scheduled match times',
          text: 'Set match times, convert them across time zones and get reminders so nothing slips.',
        },
      ],
      image: '/assets/screenshots/about/oppoverview.webp',
      alt: 'The opponent overview page with a list of matchups',
    },
    {
      id: 'prepare',
      heading: 'Prepare for Matches',
      intro:
        'The matchup page gathers the tools you need to plan for your next opponent.',
      items: [
        {
          term: 'Overview',
          text: "Compare your team's makeup with your opponent's and spot where each side is strong or thin.",
        },
        {
          term: 'Summary',
          text: 'Dig into base stats, typing and abilities for every Pokémon on both teams.',
        },
        {
          term: 'Speed chart',
          text: 'See how natures, Choice Scarf, Tailwind and other effects change who moves first.',
        },
        {
          term: 'Defensive type chart',
          text: "Find each team's weak spots, and toggle Pokémon on and off to see how coverage shifts.",
        },
        {
          term: 'Learned moves',
          text: 'Spot setup, hazard control and status moves so you can plan around them.',
        },
        {
          term: 'Move coverage',
          text: "See which moves each Pokémon brings, and which targets your chosen moves can't hit well.",
        },
        {
          term: 'Share your matchup',
          text: "Send a link to teammates or friends so they can review the matchup, even without a DraftZone account.",
        },
      ],
      image: '/assets/screenshots/about/matchup_2.webp',
      alt: 'The matchup page showing both teams side by side',
      tall: true,
    },
    {
      id: 'plan',
      heading: 'Plan Your Draft',
      intro: 'Organize your picks and strategy before the draft begins.',
      items: [
        {
          term: 'Draft planning',
          text: "Build a draft board, rank Pokémon and know what you'll take in each round.",
        },
        {
          term: 'Team building',
          text: 'Try different combinations, simulate draft scenarios and line up backup plans.',
        },
      ],
      image: '/assets/screenshots/about/planner2.webp',
      alt: 'The draft planner with a team in progress',
      plannerLink: true,
    },
  ];
}
