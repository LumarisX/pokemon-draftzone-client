export const DISPLAY_NAME_MIN = 2;
export const DISPLAY_NAME_MAX = 24;
export const DISCORD_NAME_MAX = 37;
export const GAME_NAME_MAX = 32;

const DISPLAY_NAME_PATTERN = /^[\p{L}\p{N}](?:[\p{L}\p{N} _\-.']*[\p{L}\p{N}])?$/u;

export const DISPLAY_NAME_ERROR = `Use ${DISPLAY_NAME_MIN} to ${DISPLAY_NAME_MAX} letters, numbers, spaces, dots, dashes, underscores or apostrophes.`;

export function validDisplayName(value: string): boolean {
  const trimmed = value.trim();
  return (
    trimmed.length >= DISPLAY_NAME_MIN &&
    trimmed.length <= DISPLAY_NAME_MAX &&
    DISPLAY_NAME_PATTERN.test(trimmed)
  );
}
