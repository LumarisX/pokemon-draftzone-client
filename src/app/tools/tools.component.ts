
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'tools',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './tools.component.html',
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
  ];

  constructor() {}
}
