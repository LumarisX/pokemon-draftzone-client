export type StoredSide = 'side1' | 'side2';
export type TeamSlot = 'team1' | 'team2';

export type VersusSide<T> = {
  value: T;
  stored: StoredSide;
  slot: TeamSlot;
  you: boolean;
};

export type Versus<T> = {
  team1: VersusSide<T>;
  team2: VersusSide<T>;
  swapped: boolean;
  participating: boolean;
};

export function orderForViewer<T>(
  side1: T,
  side2: T,
  viewerSide: StoredSide | null | undefined,
): Versus<T> {
  const swapped = viewerSide === 'side2';
  const participating = viewerSide === 'side1' || viewerSide === 'side2';
  const first: VersusSide<T> = {
    value: swapped ? side2 : side1,
    stored: swapped ? 'side2' : 'side1',
    slot: 'team1',
    you: participating,
  };
  const second: VersusSide<T> = {
    value: swapped ? side1 : side2,
    stored: swapped ? 'side1' : 'side2',
    slot: 'team2',
    you: false,
  };
  return { team1: first, team2: second, swapped, participating };
}

export function storedKey(side: StoredSide): TeamSlot {
  return side === 'side1' ? 'team1' : 'team2';
}
