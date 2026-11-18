export function signInMethodLabel(sub: string | null | undefined): string {
  if (!sub) return 'Signed in';
  if (sub.startsWith('google-oauth2|')) return 'Signed in with Google';
  if (sub.startsWith('oauth2|discord|')) return 'Signed in with Discord';
  if (sub.startsWith('auth0|')) return 'Signed in with Email';
  return 'Signed in';
}
