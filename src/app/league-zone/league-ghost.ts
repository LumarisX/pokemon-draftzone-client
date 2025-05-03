export const defenseData: {
  teamName: string;
  coaches: string[];
  logo: string;
  seed: number;
}[] = [
  {
    teamName: `Philadelphia Flygons`,
    coaches: ['02ThatOneGuy'],
    logo: '',
    seed: 1,
  },
  {
    teamName: `Mighty Murkrow`,
    coaches: ['hsoj'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1745097094680-Mighty Murkrow.png',
    seed: 5,
  },
  {
    teamName: `Fitchburg's Sun Chasers`,
    coaches: ['Feather'],
    logo: '',
    seed: 2,
  },
  {
    teamName: `Chicago White Fox`,
    coaches: ['TheNotoriousABS'],
    logo: '',
    seed: 8,
  },
  {
    teamName: `Deimos Deoxys`,
    coaches: ['Lumaris'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1744422916695-DeimosDeoxys.png',
    seed: 3,
  },
  {
    teamName: `Alpine Arcanines`,
    coaches: ['Lion'],
    logo: '',
    seed: 4,
  },
  {
    teamName: `Victorious Vigoroths`,
    coaches: ['Speedy'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1745097393478-Victorious_Vigoroths.png',
    seed: 7,
  },
  {
    teamName: `Deep Sea Duskulls`,
    coaches: ['Emeglebon'],
    logo: '',
    seed: 9,
  },
  {
    teamName: `Twinleaf Tatsugiri`,
    coaches: ['Penic'],
    logo: '',
    seed: 10,
  },
  {
    teamName: `I like 'em THICC`,
    coaches: ['Kat'],
    logo: '',
    seed: 6,
  },
  {
    teamName: `London Vespiquens`,
    coaches: ['Jake W'],
    logo: '',
    seed: 11,
  },
  {
    teamName: `Tampa T-Chainz`,
    coaches: ['Spite'],
    logo: '',
    seed: 12,
  },
  {
    teamName: `Kalos Quagsires`,
    coaches: ['Caltech_'],
    logo: '',
    seed: 13,
  },
  {
    teamName: `Montreal Mean Mareanies`,
    coaches: ['Qofol'],
    logo: '',
    seed: 14,
  },
  {
    teamName: `Chicago Sky Attack`,
    coaches: ['Quincy'],
    logo: '',
    seed: 15,
  },
  {
    teamName: `Midnight Teddy's`,
    coaches: ['neb5'],
    logo: '',
    seed: 16,
  },
];

export const attackData: {
  teamName: string;
  coaches: string[];
  logo: string;
  seed: number;
}[] = [
  {
    teamName: `Moochelin Star Chefs`,
    coaches: ['Rai'],
    logo: '',
    seed: 1,
  },
  {
    teamName: `Kalamazoo Komalas`,
    coaches: ['SuperSpiderPig'],
    logo: '',
    seed: 2,
  },
  {
    teamName: `Jokic Lokix`,
    coaches: ['Dotexe'],
    logo: '',
    seed: 3,
  },
  {
    teamName: `Jimothy Jirachi Tomfoolery`,
    coaches: ['Jimothy J'],
    logo: '',
    seed: 4,
  },
  {
    teamName: `Memphis Bloodmoons`,
    coaches: ['Steven'],
    logo: '',
    seed: 5,
  },
  {
    teamName: `F.C. Monterayquaza`,
    coaches: ['ChristianDeputy'],
    logo: '',
    seed: 6,
  },
  {
    teamName: `Chicago White Sawks`,
    coaches: ['BR@D'],
    logo: '',
    seed: 7,
  },
  {
    teamName: `Bug Brigade`,
    coaches: ['TheNPC420'],
    logo: '',
    seed: 8,
  },
  {
    teamName: `Minnesota Lycanrocs`,
    coaches: ['SpiralBB'],
    logo: '',
    seed: 9,
  },
  {
    teamName: `Seattle Supersonics`,
    coaches: ['AwesomenessGuy'],
    logo: '',
    seed: 10,
  },
  {
    teamName: `Fairview Floatzels`,
    coaches: ['Lupa'],
    logo: '',
    seed: 12,
  },
  {
    teamName: `McTesuda's`,
    coaches: ['Lewis'],
    logo: '',
    seed: 13,
  },
  {
    teamName: `Pacifidlog Pichus`,
    coaches: ['13Luken'],
    logo: '',
    seed: 14,
  },
  {
    teamName: `Mossdeep City Sharpedos`,
    coaches: ['Travis'],
    logo: '',
    seed: 15,
  },
  {
    teamName: `Texas Thousand`,
    coaches: ['CheesyBP'],
    logo: '',
    seed: 11,
  },
  {
    teamName: `Kommo-o Kommanders`,
    coaches: ['AnimaSean'],
    logo: '',
    seed: 16,
  },
];

export function getRandomTeamOrder() {
  return defenseData.sort((x, y) => Math.random() - Math.random());
}
