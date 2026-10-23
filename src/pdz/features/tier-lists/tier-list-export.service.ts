import { inject, Injectable } from '@angular/core';
import { SpriteService } from '@pdz/core/services/sprite.service';

export type ExportTier = {
  name: string;
  cost?: number;
  pokemon: { id: string; name: string }[];
};

export type ExportList = {
  name: string;
  format?: string;
  ruleset?: string;
  tiers: ExportTier[];
  banned: { id: string; name: string }[];
};

const IMAGE = {
  width: 1200,
  padding: 32,
  titleHeight: 72,
  labelWidth: 150,
  sprite: 64,
  gap: 6,
  rowGap: 12,
};

function csvCell(value: string): string {
  return /[,"\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function tierHeading(tier: { name: string; cost?: number }): string {
  return tier.cost === undefined || tier.cost === null
    ? tier.name
    : `${tier.name} (${tier.cost})`;
}

export function toCsv(list: ExportList): string {
  const columns: { heading: string; names: string[] }[] = [];
  if (list.banned.length)
    columns.push({ heading: 'Banned', names: list.banned.map((p) => p.name) });
  for (const tier of list.tiers)
    columns.push({
      heading: tierHeading(tier),
      names: tier.pokemon.map((p) => p.name),
    });

  const rows = Math.max(0, ...columns.map((column) => column.names.length));
  const lines = [columns.map((column) => csvCell(column.heading)).join(',')];
  for (let row = 0; row < rows; row++)
    lines.push(
      columns.map((column) => csvCell(column.names[row] ?? '')).join(','),
    );
  return lines.join('\n');
}

export function fileName(name: string, extension: string): string {
  const base = name.trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-') || 'tier-list';
  return `${base}.${extension}`;
}

function cssColor(name: string, fallback: string): string {
  const value = getComputedStyle(document.body)
    .getPropertyValue(`--pdz-color-${name}`)
    .trim();
  return value || fallback;
}

@Injectable({ providedIn: 'root' })
export class TierListExportService {
  private readonly sprites = inject(SpriteService);

  download(content: Blob, name: string): void {
    const url = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  downloadCsv(list: ExportList): void {
    this.download(
      new Blob([toCsv(list)], { type: 'text/csv;charset=utf-8;' }),
      fileName(list.name, 'csv'),
    );
  }

  downloadJson(data: unknown, name: string): void {
    this.download(
      new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
      fileName(name, 'json'),
    );
  }

  async downloadImage(list: ExportList): Promise<void> {
    const images = await this.loadSprites(list);
    let blob = await this.render(list, images);
    if (!blob) blob = await this.render(list, new Map());
    if (!blob) throw new Error('Could not draw the tier list.');
    this.download(blob, fileName(list.name, 'png'));
  }

  private async loadSprites(list: ExportList): Promise<Map<string, HTMLImageElement>> {
    const ids = new Set(list.tiers.flatMap((tier) => tier.pokemon.map((p) => p.id)));
    const loaded = new Map<string, HTMLImageElement>();
    await Promise.all(
      [...ids].map(async (id) => {
        const data = this.sprites.getSpriteData({ id });
        if (!data) return;
        for (const path of [data.path, ...data.fallbackPaths]) {
          const image = await this.loadImage(path);
          if (image) {
            loaded.set(id, image);
            return;
          }
        }
      }),
    );
    return loaded;
  }

  private loadImage(src: string): Promise<HTMLImageElement | null> {
    return new Promise((resolve) => {
      const image = new Image();
      image.crossOrigin = 'anonymous';
      image.onload = () => resolve(image);
      image.onerror = () => resolve(null);
      image.src = src;
    });
  }

  private layout(list: ExportList) {
    const perRow = Math.floor(
      (IMAGE.width - IMAGE.padding * 2 - IMAGE.labelWidth) /
        (IMAGE.sprite + IMAGE.gap),
    );
    return list.tiers.map((tier) => {
      const lines = Math.max(1, Math.ceil(tier.pokemon.length / perRow));
      return { tier, perRow, height: lines * (IMAGE.sprite + IMAGE.gap) + IMAGE.gap };
    });
  }

  private render(
    list: ExportList,
    images: Map<string, HTMLImageElement>,
  ): Promise<Blob | null> {
    const rows = this.layout(list);
    const height =
      IMAGE.padding * 2 +
      IMAGE.titleHeight +
      rows.reduce((sum, row) => sum + row.height + IMAGE.rowGap, 0);

    const canvas = document.createElement('canvas');
    canvas.width = IMAGE.width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) return Promise.resolve(null);

    const ground = cssColor('ground', '#14151a');
    const raised = cssColor('raised', '#1d1f26');
    const ink = cssColor('on-surface', '#f2f2f5');
    const muted = cssColor('on-surface-muted', '#a5a7b0');
    const accent = cssColor('primary', '#6f8cff');
    const font = getComputedStyle(document.body).fontFamily || 'sans-serif';

    context.fillStyle = ground;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = ink;
    context.font = `600 28px ${font}`;
    context.textBaseline = 'top';
    context.fillText(list.name, IMAGE.padding, IMAGE.padding);
    context.fillStyle = muted;
    context.font = `400 16px ${font}`;
    const detail = [list.format, list.ruleset].filter(Boolean).join(' · ');
    context.fillText(
      detail ? `${detail} · Pokémon DraftZone` : 'Pokémon DraftZone',
      IMAGE.padding,
      IMAGE.padding + 38,
    );

    let y = IMAGE.padding + IMAGE.titleHeight;
    for (const row of rows) {
      context.fillStyle = raised;
      context.fillRect(IMAGE.padding, y, IMAGE.width - IMAGE.padding * 2, row.height);
      context.fillStyle = accent;
      context.fillRect(IMAGE.padding, y, 4, row.height);

      context.fillStyle = ink;
      context.font = `600 18px ${font}`;
      context.textBaseline = 'middle';
      context.fillText(row.tier.name, IMAGE.padding + 16, y + row.height / 2 - 10, IMAGE.labelWidth - 24);
      if (row.tier.cost !== undefined) {
        context.fillStyle = muted;
        context.font = `400 14px ${font}`;
        context.fillText(`${row.tier.cost} pts`, IMAGE.padding + 16, y + row.height / 2 + 12);
      }

      row.tier.pokemon.forEach((pokemon, index) => {
        const column = index % row.perRow;
        const line = Math.floor(index / row.perRow);
        const x = IMAGE.padding + IMAGE.labelWidth + column * (IMAGE.sprite + IMAGE.gap);
        const top = y + IMAGE.gap + line * (IMAGE.sprite + IMAGE.gap);
        const image = images.get(pokemon.id);
        if (image) {
          const scale = Math.min(IMAGE.sprite / image.width, IMAGE.sprite / image.height);
          const w = image.width * scale;
          const h = image.height * scale;
          context.drawImage(image, x + (IMAGE.sprite - w) / 2, top + (IMAGE.sprite - h) / 2, w, h);
        } else {
          context.fillStyle = ink;
          context.font = `400 11px ${font}`;
          context.textBaseline = 'middle';
          context.fillText(pokemon.name, x, top + IMAGE.sprite / 2, IMAGE.sprite);
        }
      });
      y += row.height + IMAGE.rowGap;
    }

    return new Promise((resolve) => {
      try {
        canvas.toBlob((blob) => resolve(blob), 'image/png');
      } catch {
        resolve(null);
      }
    });
  }
}
