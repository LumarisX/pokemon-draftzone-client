export function isPartialMatch(a: any, b: any): boolean {
  if (typeof a != typeof b) return false;
  if (typeof a === 'object') {
    function checkSubset(
      subset: { [key: string]: any },
      superset: { [key: string]: any },
    ) {
      for (let key in subset) {
        if (superset.hasOwnProperty(key)) {
          if (subset[key] != superset[key]) return false;
        }
      }
      return true;
    }
    return checkSubset(a, b) || checkSubset(b, a);
  }
  return a === b;
}

export function compare(
  a: number | string,
  b: number | string,
  isAsc: boolean,
) {
  return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
}

export function ensureString(value: any): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function ensureNumber(value: any): number | undefined {
  return typeof value === 'number' ? value : undefined;
}
