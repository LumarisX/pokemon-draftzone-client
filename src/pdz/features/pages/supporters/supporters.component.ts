import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { PageHeaderComponent } from '@pdz/shared/layout/page-header/page-header.component';
import { PageComponent } from '@pdz/shared/layout/page/page.component';

interface SupportLink {
  name: string;
  href: string;
  iconSrc: string;
}

interface Supportee {
  name: string;
  description: string;
  links: SupportLink[];
}

@Component({
  selector: 'pdz-supporters',
  imports: [CardComponent, PageComponent, PageHeaderComponent],
  templateUrl: './supporters.component.html',
  styleUrl: './supporters.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SupportersComponent {
  readonly supportees: Supportee[] = [
    {
      name: 'Pokémon DraftZone',
      description: 'Merch and memberships that keep the site running.',
      links: [
        {
          name: 'Fourthwall',
          href: 'https://shop.pokemondraftzone.com/pages/join-support',
          iconSrc: '/assets/icons/media/fourthwall.svg',
        },
      ],
    },
    {
      name: 'Lumaris',
      description: 'Tip the developer directly.',
      links: [
        {
          name: 'Venmo',
          href: 'https://venmo.com/u/lumarisx',
          iconSrc: '/assets/icons/media/venmo-icon.svg',
        },
        {
          name: 'Buy Me a Coffee',
          href: 'https://buymeacoffee.com/xlumarisxu',
          iconSrc: '/assets/icons/media/bmc-logo.svg',
        },
      ],
    },
  ];
}
