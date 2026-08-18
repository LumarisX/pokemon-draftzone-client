import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { PageComponent } from '@pdz/shared/layout/page/page.component';

@Component({
  selector: 'pdz-tools',
  imports: [RouterModule, PageComponent],
  templateUrl: './tools.component.html',
  styleUrl: './tools.component.scss',
})
export class ToolsComponent {
  tools: { title: string; link: string }[] = [
    {
      title: 'Replay Analyzer',
      link: 'replay-analyzer',
    },
    {
      title: 'Time Converter',
      link: 'time-converter',
    },
    {
      title: 'Pokemon Search',
      link: 'pokemon-search',
    },
    {
      title: 'Quick Matchup',
      link: 'quick-matchup',
    },
    {
      title: 'Random Draft',
      link: 'random-draft',
    },
    {
      title: 'Wheel Randomizer',
      link: 'wheel',
    },
  ];

  constructor() {}
}
