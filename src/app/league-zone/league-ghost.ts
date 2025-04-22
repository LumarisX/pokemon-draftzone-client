export const teamData: {
  teamName: string;
  coaches: string[];
  logo: string;
}[] = [
  {
    teamName: `Philadelphia Flygons`,
    coaches: ['02ThatOneGuy'],
    logo: '',
  },
  {
    teamName: `Mighty Murkrow`,
    coaches: ['hsoj'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1745097094680-Mighty Murkrow.png',
  },
  {
    teamName: `Fitchburg's Sun Chasers`,
    coaches: ['Feather'],
    logo: '',
  },
  {
    teamName: `Chicago White Fox`,
    coaches: ['TheNotoriousABS'],
    logo: '',
  },
  {
    teamName: `Deimos Deoxys`,
    coaches: ['Lumaris'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1744422916695-DeimosDeoxys.png',
  },
  {
    teamName: `Alpine Arcanines`,
    coaches: ['Lion'],
    logo: '',
  },
  {
    teamName: `Victorious Vigoroths`,
    coaches: ['Speedy'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1745097393478-Victorious_Vigoroths.png',
  },
  {
    teamName: `Deep Sea Duskulls`,
    coaches: ['Emeglebon'],
    logo: '',
  },
  {
    teamName: `Twinleaf Tatsugiri`,
    coaches: ['Penic'],
    logo: '',
  },
  {
    teamName: `I like 'em THICC`,
    coaches: ['Kat'],
    logo: '',
  },
  {
    teamName: `London Vespiquens`,
    coaches: ['Jake W'],
    logo: '',
  },
  {
    teamName: `Tampa T-Chainz`,
    coaches: ['Spite'],
    logo: '',
  },
  {
    teamName: `Kalos Quagsires`,
    coaches: ['Caltech_'],
    logo: '',
  },
  {
    teamName: `Montreal Mean Mareanies`,
    coaches: ['Qofol'],
    logo: '',
  },
  {
    teamName: `Chicago Sky Attack`,
    coaches: ['Quincy'],
    logo: '',
  },
  {
    teamName: `Midnight Teddy's`,
    coaches: ['neb5'],
    logo: '',
  },
];

export function getRandomTeamOrder() {
  return teamData.sort((x, y) => Math.random() - Math.random());
}
