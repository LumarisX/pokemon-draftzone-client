
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

interface DevLink {
  name: string;
  href: string;
  iconSrc: string;
}

interface Developer {
  name: string;
  links: DevLink[];
}

@Component({
  selector: 'supporters',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './supporters.component.html',
  styleUrl: './supporters.component.scss',
})
export class SupportersComponent implements OnInit {
  developers: Developer[] = [
    {
      name: 'Lumaris',
      links: [
        {
          name: 'Buy Me a Coffee',
          href: 'https://buymeacoffee.com/xlumarisxu',
          iconSrc: '../../../assets/icons/media/bmc-logo.svg',
        },
        {
          name: 'Patreon',
          href: 'https://www.patreon.com/LumarisCreations',
          iconSrc: '../../../assets/icons/media/patreon.svg',
        },
        {
          name: 'Venmo',
          href: 'https://venmo.com/u/lumarisx',
          iconSrc: '../../../assets/icons/media/venmo-icon.svg',
        },
      ],
    },
  ];

  constructor() {}

  ngOnInit(): void {}
}
