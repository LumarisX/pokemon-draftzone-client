import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';

interface Tool {
  title: string;
  description: string;
  icon: string;
  link: string;
}

@Component({
  selector: 'pdz-tools',
  imports: [
    CardComponent,
    IconComponent,
    PageComponent,
    PageHeaderComponent,
    RouterLink,
  ],
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToolsComponent {
  readonly tools: Tool[] = [
    {
      title: 'Replay Analyzer',
      description: 'Break down a Showdown replay into kills, deaths and damage.',
      icon: 'movie',
      link: 'replay-analyzer',
    },
    {
      title: 'Time Converter',
      description: 'Line up a match time across time zones.',
      icon: 'schedule',
      link: 'time-converter',
    },
    {
      title: 'Pokémon Search',
      description: 'Filter Pokémon by type, stats, abilities and moves.',
      icon: 'search',
      link: 'pokemon-search',
    },
    {
      title: 'Quick Matchup',
      description: 'Compare two teams without creating a draft.',
      icon: 'compare_arrows',
      link: 'quick-matchup',
    },
    {
      title: 'Random Draft',
      description: 'Roll a random team from a tier list.',
      icon: 'casino',
      link: 'random-draft',
    },
    {
      title: 'Wheel Randomizer',
      description: 'Spin a wheel to pick a name, a team or anything else.',
      icon: 'cyclone',
      link: 'wheel',
    },
  ];
}
