export function binderFileName(
  name: string,
  suffix: string,
  extension: string,
  date = new Date(),
): string {
  const slug =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'binder';
  return `${slug}${suffix ? `-${suffix}` : ''}-${date.toISOString().slice(0, 10)}.${extension}`;
}

export function downloadFile(
  contents: string,
  fileName: string,
  type: string,
): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
