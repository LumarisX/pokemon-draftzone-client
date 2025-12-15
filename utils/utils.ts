export const range = (start: number, end: number): number[] => {
  return [...Array(end - start).keys()].map((el) => el + start);
};

export const pluck = <T, K extends keyof T>(
  elements: T[],
  field: K,
): T[K][] => {
  return elements.map((el) => el[field]);
};

function trimName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[-.'\s]/g, '');
}

export function includeName(name: string, partial: string) {
  return trimName(name).includes(trimName(partial));
}

export function matchName(name1: string, name2: string) {
  return trimName(name1) === trimName(name2);
}
