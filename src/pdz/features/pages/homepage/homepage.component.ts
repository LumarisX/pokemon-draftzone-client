import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ABOUT_PATH } from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { CardComponent } from '@pdz/shared/data/card/card.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { ChangelogCoreComponent } from './changelog-core/changelog-core.component';
import { NewsCoreComponent } from './news-core/news-core.component';

interface HomeLink {
  label: string;
  icon: string;
  href: string;
  fill?: boolean;
}

@Component({
  selector: 'pdz-homepage',
  imports: [
    ButtonComponent,
    CardComponent,
    ChangelogCoreComponent,
    IconComponent,
    NewsCoreComponent,
    RouterLink,
  ],
  templateUrl: './homepage.component.html',
  styleUrl: './homepage.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  readonly aboutPath = ABOUT_PATH;

  readonly links: HomeLink[] = [
    {
      label: 'Join Our Discord',
      icon: 'discord',
      href: 'https://discord.gg/sQUEBW4UVx',
    },
    {
      label: 'Shop Merch',
      icon: 'apparel',
      href: 'https://shop.pokemondraftzone.com',
      fill: true,
    },
    {
      label: 'Support DraftZone',
      icon: 'favorite',
      href: 'https://shop.pokemondraftzone.com/pages/join-support',
      fill: true,
    },
    {
      label: 'GitHub',
      icon: 'github',
      href: 'https://github.com/LumarisX/pokemon-draftzone-client',
    },
  ];
}
