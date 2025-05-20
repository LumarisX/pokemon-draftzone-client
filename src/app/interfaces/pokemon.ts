export type Pokemon<T extends { [key: string]: any } = {}> = {
  name: string;
  id: string;
} & T;

export type DraftOptions = Partial<{
  shiny: boolean;
  nickname: string;
  draftFormes: Pokemon[];
  modifiers: {
    moves?: string[];
    abilities?: string[];
  };
  capt: {
    tera?: string[];
    z?: string[];
    dmax?: boolean;
  };
}>;
