export const teamData: {
  teamName: string;
  coaches: string[];
  logo?: string;
}[] = [
  {
    teamName: `Philadelphia Flygons`,
    coaches: ['02ThatOneGuy'],
  },
  {
    teamName: `Mighty Murkrow`,
    coaches: ['hsoj'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1745097094680-Mighty Murkrow.png',
  },
  {
    teamName: `Fitchburg's Sun Chasers`,
    coaches: ['Feather'],
  },
  {
    teamName: `Chicago White Fox`,
    coaches: ['TheNotoriousABS'],
  },
  {
    teamName: `Deimos Deoxys`,
    coaches: ['Lumaris'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1744422916695-DeimosDeoxys.png',
  },
  {
    teamName: `Alpine Arcanines`,
    coaches: ['Lion'],
  },
  {
    teamName: `Victorious Vigoroths`,
    coaches: ['Speedy'],
    logo: 'https://pokemondraftzone-public.s3.us-east-2.amazonaws.com/user-uploads/1745097393478-Victorious_Vigoroths.png',
  },
  {
    teamName: `Deep Sea Duskulls`,
    coaches: ['Emeglebon'],
  },
  {
    teamName: `Twinleaf Tatsugiri`,
    coaches: ['Penic'],
  },
  {
    teamName: `I like 'em THICC`,
    coaches: ['Kat'],
  },
  {
    teamName: `London Vespiquens`,
    coaches: ['Jake W'],
  },
  {
    teamName: `Tampa T-Chainz`,
    coaches: ['Spite'],
  },
  {
    teamName: `Kalos Quagsires`,
    coaches: ['Caltech_'],
  },
  {
    teamName: `Montreal Mean Mareanies`,
    coaches: ['Qofol'],
  },
  {
    teamName: `Chicago Sky Attack`,
    coaches: ['Quincy'],
  },
  {
    teamName: `Midnight Teddy's`,
    coaches: ['neb5'],
  },
];

export function getRandomTeamOrder() {
  return teamData.sort((x, y) => Math.random() - Math.random());
}
