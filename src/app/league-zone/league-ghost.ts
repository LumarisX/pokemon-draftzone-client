export const defenseData: {
  name: string;
  coaches: string[];
  logo: string;
  seed: number;
}[] = [
  {
    name: `Philadelphia Flygons`,
    coaches: ['02ThatOneGuy'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/1746565385237-Philadelphia_Flygons.png',
    seed: 1,
  },
  {
    name: `Mighty Murkrow`,
    coaches: ['hsoj'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1745097094680-Mighty Murkrow.png',
    seed: 5,
  },
  {
    name: `Fitchburg's Sun Chasers`,
    coaches: ['Feather'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/1746565484354-Fitchburgs_Sun_Chaser.png',
    seed: 2,
  },
  {
    name: `Chicago White Fox`,
    coaches: ['TheNotoriousABS'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/1746565596549-Chicago_Ninetales.png',
    seed: 8,
  },
  {
    name: `Deimos Deoxys`,
    coaches: ['Lumaris'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1744422916695-DeimosDeoxys.png',
    seed: 3,
  },
  {
    name: `Alpine Arcanines`,
    coaches: ['Lion'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/1746565450693-AlpineArcanines.png',
    seed: 4,
  },
  {
    name: `Victorious Vigoroths`,
    coaches: ['Speedy'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1745097393478-Victorious_Vigoroths.png',
    seed: 7,
  },
  {
    name: `Deep Sea Duskulls`,
    coaches: ['Emeglebon'],
    logo: '',
    seed: 9,
  },
  {
    name: `Twinleaf Tatsugiri`,
    coaches: ['Penic'],
    logo: '',
    seed: 10,
  },
  {
    name: `I like 'em THICC`,
    coaches: ['Kat'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/1746565503663-I_like_em_THICC.png',
    seed: 6,
  },
  {
    name: `London Vespiquens`,
    coaches: ['Jake W'],
    logo: '',
    seed: 11,
  },
  {
    name: `Tampa T-Chainz`,
    coaches: ['Spite'],
    logo: '',
    seed: 12,
  },
  {
    name: `Kalos Quagsires`,
    coaches: ['Caltech_'],
    logo: '',
    seed: 13,
  },
  {
    name: `Montreal Mean Mareanies`,
    coaches: ['Qofol'],
    logo: '',
    seed: 14,
  },
  {
    name: `Chicago Sky Attack`,
    coaches: ['Quincy'],
    logo: '',
    seed: 15,
  },
  {
    name: `Midnight Teddy's`,
    coaches: ['neb5'],
    logo: '',
    seed: 16,
  },
  {
    name: `Moochelin Star Chefs`,
    coaches: ['Rai'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/1746565579136-Moochelin_Star_Chefs.png',
    seed: 17,
  },
  {
    name: `Kalamazoo Komalas`,
    coaches: ['SuperSpiderPig'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/1746565551389-Kalamazoo_Komalas.png',
    seed: 18,
  },
  {
    name: `Jokic Lokix`,
    coaches: ['Dotexe'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/1746565520216-Jokic_Lokix.png',
    seed: 19,
  },
  {
    name: `Jimothy Jirachi Tomfoolery`,
    coaches: ['Jimothy J'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/1746565565925-Jimothy_Jirachi.png',
    seed: 20,
  },
  {
    name: `Memphis Bloodmoons`,
    coaches: ['Steven'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/1746565465031-Memphis_Bloodmoons.png',
    seed: 21,
  },
  {
    name: `F.C. Monterayquaza`,
    coaches: ['ChristianDeputy'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/1746565535075-F.C._Monterrayquaza.png',
    seed: 22,
  },
  {
    name: `Chicago White Sawks`,
    coaches: ['BR@D'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/1746565766076-Chicago_White_SawksBrad.png',
    seed: 23,
  },
  {
    name: `Bug Brigade`,
    coaches: ['TheNPC420'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/league-uploads/1746565423936-Bug_Brigade.png',
    seed: 24,
  },
  {
    name: `Minnesota Lycanrocs`,
    coaches: ['SpiralBB'],
    logo: '',
    seed: 25,
  },
  {
    name: `Seattle Supersonics`,
    coaches: ['AwesomenessGuy'],
    logo: '',
    seed: 26,
  },
  {
    name: `Fairview Floatzels`,
    coaches: ['Lupa'],
    logo: '',
    seed: 27,
  },
  {
    name: `McTesuda's`,
    coaches: ['Lewis'],
    logo: '',
    seed: 28,
  },
  {
    name: `Pacifidlog Pichus`,
    coaches: ['13Luken'],
    logo: '',
    seed: 29,
  },
  {
    name: `Mossdeep City Sharpedos`,
    coaches: ['Travis'],
    logo: '',
    seed: 30,
  },
  {
    name: `Texas Thousand`,
    coaches: ['CheesyBP'],
    logo: '',
    seed: 31,
  },
  {
    name: `Kommo-o Kommanders`,
    coaches: ['AnimaSean'],
    logo: '',
    seed: 32,
  },
];

export function getRandomTeamOrder() {
  return defenseData.sort((x, y) => Math.random() - Math.random());
}
