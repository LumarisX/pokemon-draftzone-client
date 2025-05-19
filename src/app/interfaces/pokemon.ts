export type Pokemon<T extends { [key: string]: any } = {}> = {
  name: string;
  id: string;
} & T;
