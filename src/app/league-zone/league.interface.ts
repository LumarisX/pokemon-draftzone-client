export namespace League {
  export type Team = {
    teamName: string;
    coaches: string[];
    logo: string;
  };

  export type Pokemon = {
    name: string;
    id: string;
    tier: string | number;
  };
}
