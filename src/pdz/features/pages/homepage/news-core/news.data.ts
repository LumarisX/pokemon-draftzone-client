import { News } from './news.service';

export const NEWS: News[] = [
  {
    title: 'New Champions M-B VGC Draft Tournament!',
    date: '2026-07-03T15:00:00-07:00',
    sections: [
      {
        type: 'para',
        description: `We are hosting a Champions M-B draft tournament! In this tournament you will be able to register a team of Pokemon from our draft board without having to worry about other people sniping your choices. Just put together the best roster you can and compete head to head with other coaches in a double elimination bracket. Having Champions is completely optional so if you are looking to try drafting some fun combinations in M-B, this is the place to be!`,
      },
      {
        type: 'images',
        images: [
          {
            imageUrl: `https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/Champions_MB_Open_Draft.png`,
            size: 'large',
          },
        ],
      },
      {
        type: 'buttons',
        buttons: [
          {
            text: 'Sign up',
            href: 'https://pokemondraftzone.com/leagues/dods/tournaments/cup-1',
            newWindow: true,
          },
          {
            text: 'Rules',
            href: 'https://pokemondraftzone.com/leagues/dods/tournaments/cup-1/rules',
            newWindow: true,
          },
        ],
      },
    ],
  },
  {
    title: 'New designs just in time for summer!',
    date: '2026-06-02T10:00:00-07:00',
    sections: [
      {
        type: 'para',
        description: `We are proud to announce that our second line of merch is now live! We hope you love these designs as much as we do. We wanted to make sure you get something awesome to show for your support.`,
      },
      {
        type: 'images',
        images: [
          {
            imageUrl: '/assets/images/battle-zone/merch2.png',
            size: 'large',
          },
        ],
      },
      {
        type: 'buttons',
        buttons: [
          {
            text: 'Check out our Shop',
            href: 'https://shop.pokemondraftzone.com',
            newWindow: true,
          },
        ],
      },
      {
        type: 'columns',
        columns: [
          [
            {
              type: 'para',
              description: `If clothing isn't your thing but you still want to help out, please consider donating or becoming a member.`,
            },
            {
              type: 'buttons',
              buttons: [
                {
                  text: 'Donate or Become a Member',
                  href: 'https://shop.pokemondraftzone.com/pages/join-support',
                  newWindow: true,
                },
              ],
            },
          ],
          [
            {
              type: 'para',
              description: `As a bonus, we are also running a giveaway to win any classic/soft tee of your choice including member designs! Check the #announcments channel in our discord for more details! We'll pick a winner on June 9th.`,
            },
            {
              type: 'buttons',
              buttons: [
                {
                  text: 'Join the Giveaway',
                  href: 'https://discord.gg/sQUEBW4UVx',
                  newWindow: true,
                },
              ],
            },
          ],
        ],
      },
      {
        type: 'para',
        description: `Thank you so much for all the continued support! We are so glad you all are enjoying the site and the designs as much as we do.`,
      },
    ],
  },
  {
    title: 'Pokémon DraftZone Battle League (PDBL) Season 3',
    date: '2026-02-07T12:00:00-08:00',
    sections: [
      {
        type: 'images',
        images: [
          {
            imageUrl: '/assets/images/battle-zone/pdbl.png',
            size: 'medium',
          },
        ],
      },
      {
        type: 'buttons',
        buttons: [
          { link: '/leagues/pdbl/tournaments/s3-singles', text: 'Singles' },
          { link: '/leagues/pdbl/tournaments/s3-vgc', text: 'VGC' },
        ],
      },
      {
        type: 'para',
        description:
          "It's time to kick off our third season of PDBL and we'll now be running TWO leagues! Our discord members voted and Paldea Dex Singles and Reg H VGC will be the formats for this season!",
      },
      {
        type: 'para',
        description:
          'Look forward to more intense battles and epic strategies from our community of passionate coaches. The PDBL is where legends will be made!',
      },
      {
        type: 'para',
        description:
          'Sign-ups close February 16th and drafting starts shortly after. See you there!',
      },
    ],
  },
];
