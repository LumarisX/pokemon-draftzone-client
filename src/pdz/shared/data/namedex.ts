import { DraftPokemon } from '@pdz/features/drafts/draft.model';

export type SpriteProperties = {
  id?: string;
  flip?: true;
};

export type NamedexEntry = {
  name: string[];
  sources: { [key in SourceKey]?: SpriteProperties };
  default?: SpriteSetKey;
};

export type PokemonId = keyof typeof NamedexData;

export function isPokemonId(value: string): value is PokemonId {
  return value in Namedex;
}

export function getSpriteProperties(
  pokemonId: PokemonId,
  source: string,
): SpriteProperties | undefined {
  return Namedex[pokemonId]?.sources[source as SourceKey];
}

export function getPokemonData(pokemonId: string): NamedexEntry | undefined {
  return isPokemonId(pokemonId) ? Namedex[pokemonId] : undefined;
}

export function toPokemonId(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

let $aliasIndex: Map<string, PokemonId> | undefined;
function aliasIndex(): Map<string, PokemonId> {
  if ($aliasIndex) return $aliasIndex;
  const index = new Map<string, PokemonId>();
  for (const key of pokemonIds()) {
    for (const alias of Namedex[key].name) {
      const aliasId = toPokemonId(alias);
      if (!index.has(aliasId)) index.set(aliasId, key);
    }
  }
  return ($aliasIndex = index);
}

export function getPidByName(name: string): PokemonId | undefined {
  const id = toPokemonId(name);
  return isPokemonId(id) ? id : aliasIndex().get(id);
}

export function getNameByPid(id: string): string {
  return getPokemonData(id)?.name[0] ?? '';
}

export function pokemonIds(): PokemonId[] {
  return Object.keys(Namedex) as PokemonId[];
}

export function getRandomPokemon(): { id: PokemonId; name: string } {
  const ids = pokemonIds();
  const id = ids[Math.floor(ids.length * Math.random())];
  return { id, name: Namedex[id].name[0] };
}

let $nameList: DraftPokemon[] | undefined;
export function nameList(): DraftPokemon[] {
  if ($nameList) return $nameList;
  return ($nameList = pokemonIds()
    .map((id) => ({
      name: Namedex[id].name[0],
      id,
    }))
    .sort((x, y) => {
      if (x.id < y.id) return -1;
      if (x.id > y.id) return 1;
      return 0;
    }));
}

export type SourceKey = 'ps' | 'pd' | 'serebii' | 'pmd' | 'rr' | 'pokeapi';

export const Sources: { [key in SourceKey]: string } = {
  ps: 'play.pokemonshowdown.com/sprites',
  pd: '',
  serebii: 'serebii.net',
  pmd: 'raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait',
  rr: 'play.radicalred.net/sprites',
  pokeapi:
    'raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork',
} as const;

function psDefaultPath(id: string, shiny?: boolean) {
  return `https://${Sources.ps}/home${shiny ? '-shiny' : ''}/${id}.png`;
}

function psAnimatedPath(id: string, shiny?: boolean) {
  return `https://${Sources.ps}/ani${shiny ? '-shiny' : ''}/${id}.gif`;
}

function psGen5Path(id: string, shiny?: boolean) {
  return `https://${Sources.ps}/gen5${shiny ? '-shiny' : ''}/${id}.png`;
}

export type SpriteSetKey =
  | 'bw'
  | 'afd'
  | 'sv'
  | 'ani'
  | 'home'
  | 'serebii'
  | 'pmd'
  | 'rr'
  | 'pokeapi';

export type SpriteSetConfig = {
  getPath: (id: string, shiny?: boolean) => string;
  classes: string[];
  flip?: boolean;
  source: SourceKey;
  fallback?: (id: string, shiny?: boolean) => string;
};

export const SpriteSets: Record<SpriteSetKey, SpriteSetConfig> = {
  bw: {
    getPath: psGen5Path,
    classes: [''],
    source: 'ps',
    fallback: psDefaultPath,
  },
  afd: {
    getPath: function (id: string, shiny?: boolean) {
      return `https://${Sources[this.source]}/afd${shiny ? '-shiny' : ''}/${id}.png`;
    },
    classes: [''],
    source: 'ps',
    fallback: psDefaultPath,
  },
  sv: {
    getPath: function (id: string, shiny?: boolean) {
      return `https://${Sources[this.source]}/dex${shiny ? '-shiny' : ''}/${id}.png`;
    },
    classes: [''],
    fallback: psDefaultPath,
    source: 'ps',
  },
  ani: {
    getPath: psAnimatedPath,
    classes: [''],
    source: 'ps',
    fallback: psDefaultPath,
  },
  home: {
    getPath: psDefaultPath,
    classes: ['sprite-border'],
    source: 'ps',
    fallback: psGen5Path,
  },
  serebii: {
    getPath: function (id: string, shiny?: boolean) {
      return `https://${Sources[this.source]}/${
        shiny ? 'Shiny/SV' : 'scarletviolet/pokemon'
      }/new/${id}.png`;
    },
    classes: ['sprite-border'],
    source: 'serebii',
  },
  pmd: {
    getPath: function (id: string, shiny?: boolean) {
      if (shiny) {
        const splitBase = id.split('/');
        if (!splitBase[1]) {
          splitBase[1] = '0000';
        }
        splitBase.splice(2, 1, '0001');
        return `https://${Sources[this.source]}/${splitBase.join('/')}/Normal.png`;
      } else {
        return `https://${Sources[this.source]}/${id}/Normal.png`;
      }
    },
    classes: ['pmd'],
    source: 'pmd',
    flip: true,
    fallback: function (id: string, shiny?: boolean) {
      const base = id.split('/');
      base.pop();
      if (base.length > 0) {
        return `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait/${base.join(
          '/',
        )}/Normal.png`;
      }
      return '';
    },
  },
  rr: {
    getPath: function (id: string, shiny?: boolean) {
      return `https://${Sources[this.source]}/gen5${shiny ? '-shiny' : ''}/${id}.png`;
    },
    classes: ['sprite-border'],
    source: 'rr',
  },
  pokeapi: {
    getPath: function (id: string, shiny?: boolean) {
      return `https://${Sources[this.source]}/${shiny ? 'shiny/' : ''}${id}.png`;
    },
    classes: ['sprite-border'],
    source: 'pokeapi',
    fallback: function (id: string) {
      return `https://${Sources.pokeapi}/${id}.png`;
    },
  },
} as const;

const NamedexData = {
  bulbasaur: {
    name: ['Bulbasaur'],
    sources: {
      ps: {},
      serebii: { id: '001' },
      pmd: { id: '0001' },
      pokeapi: { id: '1' },
    },
  },
  ivysaur: {
    name: ['Ivysaur'],
    sources: {
      ps: { flip: true },
      serebii: { id: '002' },
      pmd: { id: '0002' },
      pokeapi: { id: '2' },
    },
  },
  venusaur: {
    name: ['Venusaur'],
    sources: {
      ps: {},
      serebii: { id: '003' },
      pmd: { id: '0003' },
      pokeapi: { id: '3' },
    },
  },
  venusaurmega: {
    name: ['Mega Venusaur', 'Venusaur-Mega'],
    sources: {
      ps: { id: 'venusaur-mega' },
      serebii: { id: '003-m' },
      pmd: { id: '0003/0001' },
      pokeapi: { id: '10033' },
    },
  },
  venusaurgmax: {
    name: ['Venusaur-Gmax'],
    sources: {
      ps: { id: 'venusaur-gmax' },
      serebii: { id: '003-gi' },
      pmd: { id: '0003' },
      pokeapi: { id: '10195' },
    },
  },
  charmander: {
    name: ['Charmander'],
    sources: {
      ps: {},
      serebii: { id: '004' },
      pmd: { id: '0004' },
      pokeapi: { id: '4' },
    },
  },
  charmeleon: {
    name: ['Charmeleon'],
    sources: {
      ps: {},
      serebii: { id: '005' },
      pmd: { id: '0005' },
      pokeapi: { id: '5' },
    },
  },
  charizard: {
    name: ['Charizard'],
    sources: {
      ps: {},
      serebii: { id: '006' },
      pmd: { id: '0006' },
      pokeapi: { id: '6' },
    },
  },
  charizardmegax: {
    name: ['Mega Charizard X', 'Charizard-Mega-X'],
    sources: {
      ps: { id: 'charizard-megax', flip: true },
      serebii: { id: '006-mx' },
      pmd: { id: '0006/0001' },
      pokeapi: { id: '10034' },
    },
  },
  charizardmegay: {
    name: ['Mega Charizard Y', 'Charizard-Mega-Y'],
    sources: {
      ps: { id: 'charizard-megay' },
      serebii: { id: '006-my' },
      pmd: { id: '0006/0002' },
      pokeapi: { id: '10035' },
    },
  },
  charizardgmax: {
    name: ['Charizard-Gmax'],
    sources: {
      ps: { id: 'charizard-gmax', flip: true },
      serebii: { id: '006-gi' },
      pmd: { id: '0006' },
      pokeapi: { id: '10196' },
    },
  },
  squirtle: {
    name: ['Squirtle'],
    sources: {
      ps: {},
      serebii: { id: '007' },
      pmd: { id: '0007' },
      pokeapi: { id: '7' },
    },
  },
  wartortle: {
    name: ['Wartortle'],
    sources: {
      ps: {},
      serebii: { id: '008' },
      pmd: { id: '0008' },
      pokeapi: { id: '8' },
    },
  },
  blastoise: {
    name: ['Blastoise'],
    sources: {
      ps: {},
      serebii: { id: '009' },
      pmd: { id: '0009' },
      pokeapi: { id: '9' },
    },
  },
  blastoisemega: {
    name: ['Mega Blastoise', 'Blastoise-Mega'],
    sources: {
      ps: { id: 'blastoise-mega' },
      serebii: { id: '009-m' },
      pmd: { id: '0009/0001' },
      pokeapi: { id: '10036' },
    },
  },
  blastoisegmax: {
    name: ['Blastoise-Gmax'],
    sources: {
      ps: { id: 'blastoise-gmax', flip: true },
      serebii: { id: '009-gi' },
      pmd: { id: '0009' },
      pokeapi: { id: '10197' },
    },
  },
  caterpie: {
    name: ['Caterpie'],
    sources: {
      ps: {},
      serebii: { id: '010' },
      pmd: { id: '0010' },
      pokeapi: { id: '10' },
    },
  },
  metapod: {
    name: ['Metapod'],
    sources: {
      ps: {},
      serebii: { id: '011' },
      pmd: { id: '0011' },
      pokeapi: { id: '11' },
    },
  },
  butterfree: {
    name: ['Butterfree'],
    sources: {
      ps: {},
      serebii: { id: '012' },
      pmd: { id: '0012' },
      pokeapi: { id: '12' },
    },
  },
  butterfreegmax: {
    name: ['Butterfree-Gmax'],
    sources: {
      ps: { id: 'butterfree-gmax', flip: true },
      serebii: { id: '012-gi' },
      pmd: { id: '0012' },
      pokeapi: { id: '10198' },
    },
  },
  butterfreemega: {
    name: ['Mega Butterfree', 'Butterfree-Mega'],
    sources: {
      ps: { id: 'butterfree-gmax', flip: true },
      serebii: { id: '012-gi' },
      pmd: { id: '0012' },
      pokeapi: { id: '10198' },
    },
  },
  weedle: {
    name: ['Weedle'],
    sources: {
      ps: {},
      serebii: { id: '013' },
      pmd: { id: '0013' },
      pokeapi: { id: '13' },
    },
  },
  kakuna: {
    name: ['Kakuna'],
    sources: {
      ps: {},
      serebii: { id: '014' },
      pmd: { id: '0014' },
      pokeapi: { id: '14' },
    },
  },
  beedrill: {
    name: ['Beedrill'],
    sources: {
      ps: {},
      serebii: { id: '015' },
      pmd: { id: '0015' },
      pokeapi: { id: '15' },
    },
  },
  beedrillmega: {
    name: ['Mega Beedrill', 'Beedrill-Mega'],
    sources: {
      ps: { id: 'beedrill-mega' },
      serebii: { id: '015-m' },
      pmd: { id: '0015/0001' },
      pokeapi: { id: '10090' },
    },
  },
  pidgey: {
    name: ['Pidgey'],
    sources: {
      ps: {},
      serebii: { id: '016' },
      pmd: { id: '0016' },
      pokeapi: { id: '16' },
    },
  },
  pidgeotto: {
    name: ['Pidgeotto'],
    sources: {
      ps: {},
      serebii: { id: '017' },
      pmd: { id: '0017' },
      pokeapi: { id: '17' },
    },
  },
  pidgeot: {
    name: ['Pidgeot'],
    sources: {
      ps: { flip: true },
      serebii: { id: '018' },
      pmd: { id: '0018' },
      pokeapi: { id: '18' },
    },
  },
  pidgeotmega: {
    name: ['Mega Pidgeot', 'Pidgeot-Mega'],
    sources: {
      ps: { id: 'pidgeot-mega' },
      serebii: { id: '018-m' },
      pmd: { id: '0018/0001' },
      pokeapi: { id: '10073' },
    },
  },
  rattata: {
    name: ['Rattata'],
    sources: {
      ps: {},
      serebii: { id: '019' },
      pmd: { id: '0019' },
      pokeapi: { id: '19' },
    },
  },
  rattataalola: {
    name: ['Alolan Rattata', 'Rattata-Alola', 'Rattata-A'],
    sources: {
      ps: { id: 'rattata-alola' },
      serebii: { id: '019-a' },
      pmd: { id: '0019/0001' },
      pokeapi: { id: '10091' },
    },
  },
  raticate: {
    name: ['Raticate'],
    sources: {
      ps: {},
      serebii: { id: '020' },
      pmd: { id: '0020' },
      pokeapi: { id: '20' },
    },
  },
  raticatealola: {
    name: ['Alolan Raticate', 'Raticate-Alola', 'Raticate-A'],
    sources: {
      ps: { id: 'raticate-alola' },
      serebii: { id: '020-a' },
      pmd: { id: '0020/0001' },
      pokeapi: { id: '10092' },
    },
  },
  spearow: {
    name: ['Spearow'],
    sources: {
      ps: {},
      serebii: { id: '021' },
      pmd: { id: '0021' },
      pokeapi: { id: '21' },
    },
  },
  fearow: {
    name: ['Fearow'],
    sources: {
      ps: {},
      serebii: { id: '022' },
      pmd: { id: '0022' },
      pokeapi: { id: '22' },
    },
  },
  ekans: {
    name: ['Ekans'],
    sources: {
      ps: {},
      serebii: { id: '023' },
      pmd: { id: '0023' },
      pokeapi: { id: '23' },
    },
  },
  arbok: {
    name: ['Arbok'],
    sources: {
      ps: {},
      serebii: { id: '024' },
      pmd: { id: '0024' },
      pokeapi: { id: '24' },
    },
  },
  pikachu: {
    name: ['Pikachu'],
    sources: {
      ps: {},
      serebii: { id: '025' },
      pmd: { id: '0025' },
      pokeapi: { id: '25' },
    },
  },
  pikachucosplay: {
    name: ['Pikachu-Cosplay'],
    sources: {
      ps: { id: 'pikachu-cosplay' },
      serebii: { id: '025' },
      pmd: { id: '0025' },
      pokeapi: { id: '10085' },
    },
  },
  pikachurockstar: {
    name: ['Pikachu-Rock-Star'],
    sources: {
      ps: { id: 'pikachu-rockstar' },
      serebii: { id: '025' },
      pmd: { id: '0025/0002' },
      pokeapi: { id: '10080' },
    },
  },
  pikachubelle: {
    name: ['Pikachu-Belle'],
    sources: {
      ps: { id: 'pikachu-belle' },
      serebii: { id: '025' },
      pmd: { id: '0025/0003' },
      pokeapi: { id: '10081' },
    },
  },
  pikachupopstar: {
    name: ['Pikachu-Pop-Star'],
    sources: {
      ps: { id: 'pikachu-popstar' },
      serebii: { id: '025' },
      pmd: { id: '0025/0004' },
      pokeapi: { id: '10082' },
    },
  },
  pikachuphd: {
    name: ['Pikachu-PhD'],
    sources: {
      ps: { id: 'pikachu-phd' },
      serebii: { id: '025' },
      pmd: { id: '0025/0005' },
      pokeapi: { id: '10083' },
    },
  },
  pikachulibre: {
    name: ['Pikachu-Libre'],
    sources: {
      ps: { id: 'pikachu-libre' },
      serebii: { id: '025' },
      pmd: { id: '0025/0006' },
      pokeapi: { id: '10084' },
    },
  },
  pikachuoriginal: {
    name: ['Pikachu-Original'],
    sources: {
      ps: { id: 'pikachu-original' },
      serebii: { id: '025-o' },
      pmd: { id: '0025/0008' },
      pokeapi: { id: '10094' },
    },
  },
  pikachuhoenn: {
    name: ['Pikachu-Hoenn'],
    sources: {
      ps: { id: 'pikachu-hoenn' },
      serebii: { id: '025-h' },
      pmd: { id: '0025/0009' },
      pokeapi: { id: '10095' },
    },
  },
  pikachusinnoh: {
    name: ['Pikachu-Sinnoh'],
    sources: {
      ps: { id: 'pikachu-sinnoh' },
      serebii: { id: '025-s' },
      pmd: { id: '0025/0010' },
      pokeapi: { id: '10096' },
    },
  },
  pikachuunova: {
    name: ['Pikachu-Unova'],
    sources: {
      ps: { id: 'pikachu-unova' },
      serebii: { id: '025-u' },
      pmd: { id: '0025/0011' },
      pokeapi: { id: '10097' },
    },
  },
  pikachukalos: {
    name: ['Pikachu-Kalos'],
    sources: {
      ps: { id: 'pikachu-kalos' },
      serebii: { id: '025-k' },
      pmd: { id: '0025/0012' },
      pokeapi: { id: '10098' },
    },
  },
  pikachualola: {
    name: ['Alolan Pikachu', 'Pikachu-Alola', 'Pikachu-A'],
    sources: {
      ps: { id: 'pikachu-alola' },
      serebii: { id: '025-a' },
      pmd: { id: '0025/0013' },
      pokeapi: { id: '10099' },
    },
  },
  pikachupartner: {
    name: ['Pikachu-Partner'],
    sources: {
      ps: { id: 'pikachu-partner' },
      serebii: { id: '025-p' },
      pmd: { id: '0025/0014' },
      pokeapi: { id: '10148' },
    },
  },
  pikachustarter: {
    name: ['Pikachu-Starter'],
    sources: {
      ps: { id: 'pikachu-starter' },
      serebii: { id: '025' },
      pmd: { id: '0025' },
      pokeapi: { id: '10158' },
    },
  },
  pikachugmax: {
    name: ['Pikachu-Gmax'],
    sources: {
      ps: { id: 'pikachu-gmax' },
      serebii: { id: '025-gi' },
      pmd: { id: '0025/0001' },
      pokeapi: { id: '10199' },
    },
  },
  pikachuworld: {
    name: ['Pikachu-World'],
    sources: {
      ps: { id: 'pikachu-world' },
      serebii: { id: '025-w' },
      pmd: { id: '0025/0015' },
      pokeapi: { id: '10160' },
    },
  },
  raichu: {
    name: ['Raichu'],
    sources: {
      ps: {},
      serebii: { id: '026' },
      pmd: { id: '0026' },
      pokeapi: { id: '26' },
    },
  },
  raichumegax: {
    name: ['Mega Raichu X', 'Raichu-Mega-X'],
    sources: {
      ps: { id: 'raichu-megax' },
      serebii: { id: '026' },
      pmd: { id: '0026/0002' },
      pokeapi: { id: '10304' },
    },
  },
  raichumegay: {
    name: ['Mega Raichu Y', 'Raichu-Mega-Y'],
    sources: {
      ps: { id: 'raichu-megay' },
      serebii: { id: '026' },
      pmd: { id: '0026/0003' },
      pokeapi: { id: '10305' },
    },
  },
  raichualola: {
    name: ['Alolan Raichu', 'Raichu-Alola', 'Raichu-A'],
    sources: {
      ps: { id: 'raichu-alola' },
      serebii: { id: '026-a' },
      pmd: { id: '0026/0001' },
      pokeapi: { id: '10100' },
    },
  },
  sandshrew: {
    name: ['Sandshrew'],
    sources: {
      ps: {},
      serebii: { id: '027' },
      pmd: { id: '0027' },
      pokeapi: { id: '27' },
    },
  },
  sandshrewalola: {
    name: ['Alolan Sandshrew', 'Sandshrew-Alola', 'Sandshrew-A'],
    sources: {
      ps: { id: 'sandshrew-alola', flip: true },
      serebii: { id: '027-a' },
      pmd: { id: '0027/0001' },
      pokeapi: { id: '10101' },
    },
  },
  sandslash: {
    name: ['Sandslash'],
    sources: {
      ps: { flip: true },
      serebii: { id: '028' },
      pmd: { id: '0028' },
      pokeapi: { id: '28' },
    },
  },
  sandslashalola: {
    name: ['Alolan Sandslash', 'Sandslash-Alola', 'Sandslash-A'],
    sources: {
      ps: { id: 'sandslash-alola', flip: true },
      serebii: { id: '028-a' },
      pmd: { id: '0028/0001' },
      pokeapi: { id: '10102' },
    },
  },
  nidoranf: {
    name: ['Nidoran-Female', 'Nidoran-F'],
    sources: {
      ps: {},
      serebii: { id: '029' },
      pmd: { id: '0029' },
      pokeapi: { id: '29' },
    },
  },
  nidorina: {
    name: ['Nidorina'],
    sources: {
      ps: {},
      serebii: { id: '030' },
      pmd: { id: '0030' },
      pokeapi: { id: '30' },
    },
  },
  nidoqueen: {
    name: ['Nidoqueen'],
    sources: {
      ps: {},
      serebii: { id: '031' },
      pmd: { id: '0031' },
      pokeapi: { id: '31' },
    },
  },
  nidoranm: {
    name: ['Nidoran-M'],
    sources: {
      ps: {},
      serebii: { id: '032' },
      pmd: { id: '0032' },
      pokeapi: { id: '32' },
    },
  },
  nidorino: {
    name: ['Nidorino'],
    sources: {
      ps: {},
      serebii: { id: '033' },
      pmd: { id: '0033' },
      pokeapi: { id: '33' },
    },
  },
  nidoking: {
    name: ['Nidoking'],
    sources: {
      ps: {},
      serebii: { id: '034' },
      pmd: { id: '0034' },
      pokeapi: { id: '34' },
    },
  },
  clefairy: {
    name: ['Clefairy'],
    sources: {
      ps: {},
      serebii: { id: '035' },
      pmd: { id: '0035' },
      pokeapi: { id: '35' },
    },
  },
  clefable: {
    name: ['Clefable'],
    sources: {
      ps: {},
      serebii: { id: '036' },
      pmd: { id: '0036' },
      pokeapi: { id: '36' },
    },
  },
  clefablemega: {
    name: ['Mega Clefable', 'Clefable-Mega'],
    sources: {
      ps: { id: 'clefable-mega' },
      serebii: { id: '036' },
      pmd: { id: '0036/0001' },
      pokeapi: { id: '10278' },
    },
  },
  vulpix: {
    name: ['Vulpix'],
    sources: {
      ps: {},
      serebii: { id: '037' },
      pmd: { id: '0037' },
      pokeapi: { id: '37' },
    },
  },
  vulpixalola: {
    name: ['Alolan Vulpix', 'Vulpix-Alola', 'Vulpix-A'],
    sources: {
      ps: { id: 'vulpix-alola' },
      serebii: { id: '037-a' },
      pmd: { id: '0037/0001' },
      pokeapi: { id: '10103' },
    },
  },
  ninetales: {
    name: ['Ninetales'],
    sources: {
      ps: {},
      serebii: { id: '038' },
      pmd: { id: '0038' },
      pokeapi: { id: '38' },
    },
  },
  ninetalesalola: {
    name: ['Alolan Ninetales', 'Ninetales-Alola', 'Ninetales-A'],
    sources: {
      ps: { id: 'ninetales-alola' },
      serebii: { id: '038-a' },
      pmd: { id: '0038/0001' },
      pokeapi: { id: '10104' },
    },
  },
  jigglypuff: {
    name: ['Jigglypuff'],
    sources: {
      ps: {},
      serebii: { id: '039' },
      pmd: { id: '0039' },
      pokeapi: { id: '39' },
    },
  },
  wigglytuff: {
    name: ['Wigglytuff'],
    sources: {
      ps: { flip: true },
      serebii: { id: '040' },
      pmd: { id: '0040' },
      pokeapi: { id: '40' },
    },
  },
  zubat: {
    name: ['Zubat'],
    sources: {
      ps: {},
      serebii: { id: '041' },
      pmd: { id: '0041' },
      pokeapi: { id: '41' },
    },
  },
  golbat: {
    name: ['Golbat'],
    sources: {
      ps: {},
      serebii: { id: '042' },
      pmd: { id: '0042' },
      pokeapi: { id: '42' },
    },
  },
  oddish: {
    name: ['Oddish'],
    sources: {
      ps: {},
      serebii: { id: '043' },
      pmd: { id: '0043' },
      pokeapi: { id: '43' },
    },
  },
  gloom: {
    name: ['Gloom'],
    sources: {
      ps: {},
      serebii: { id: '044' },
      pmd: { id: '0044' },
      pokeapi: { id: '44' },
    },
  },
  vileplume: {
    name: ['Vileplume'],
    sources: {
      ps: {},
      serebii: { id: '045' },
      pmd: { id: '0045' },
      pokeapi: { id: '45' },
    },
  },
  paras: {
    name: ['Paras'],
    sources: {
      ps: {},
      serebii: { id: '046' },
      pmd: { id: '0046' },
      pokeapi: { id: '46' },
    },
  },
  parasect: {
    name: ['Parasect'],
    sources: {
      ps: {},
      serebii: { id: '047' },
      pmd: { id: '0047' },
      pokeapi: { id: '47' },
    },
  },
  venonat: {
    name: ['Venonat'],
    sources: {
      ps: { flip: true },
      serebii: { id: '048' },
      pmd: { id: '0048' },
      pokeapi: { id: '48' },
    },
  },
  venomoth: {
    name: ['Venomoth'],
    sources: {
      ps: {},
      serebii: { id: '049' },
      pmd: { id: '0049' },
      pokeapi: { id: '49' },
    },
  },
  diglett: {
    name: ['Diglett'],
    sources: {
      ps: {},
      serebii: { id: '050' },
      pmd: { id: '0050' },
      pokeapi: { id: '50' },
    },
  },
  diglettalola: {
    name: ['Alolan Diglett', 'Diglett-Alola', 'Diglett-A'],
    sources: {
      ps: { id: 'diglett-alola' },
      serebii: { id: '050-a' },
      pmd: { id: '0050/0001' },
      pokeapi: { id: '10105' },
    },
  },
  dugtrio: {
    name: ['Dugtrio'],
    sources: {
      ps: {},
      serebii: { id: '051' },
      pmd: { id: '0051' },
      pokeapi: { id: '51' },
    },
  },
  dugtrioalola: {
    name: ['Alolan Dugtrio', 'Dugtrio-Alola', 'Dugtrio-A'],
    sources: {
      ps: { id: 'dugtrio-alola' },
      serebii: { id: '051-a' },
      pmd: { id: '0051/0001' },
      pokeapi: { id: '10106' },
    },
  },
  meowth: {
    name: ['Meowth'],
    sources: {
      ps: {},
      serebii: { id: '052' },
      pmd: { id: '0052' },
      pokeapi: { id: '52' },
    },
  },
  meowthalola: {
    name: ['Alolan Meowth', 'Meowth-Alola', 'Meowth-A'],
    sources: {
      ps: { id: 'meowth-alola' },
      serebii: { id: '052-a' },
      pmd: { id: '0052/0001' },
      pokeapi: { id: '10107' },
    },
  },
  meowthgalar: {
    name: ['Galarian Meowth', 'Meowth-Galar', 'Meowth-G'],
    sources: {
      ps: { id: 'meowth-galar' },
      serebii: { id: '052-g' },
      pmd: { id: '0052/0002' },
      pokeapi: { id: '10161' },
    },
  },
  meowthgmax: {
    name: ['Meowth-Gmax'],
    sources: {
      ps: { id: 'meowth-gmax' },
      serebii: { id: '052-gi' },
      pmd: { id: '0052' },
      pokeapi: { id: '10200' },
    },
  },
  persian: {
    name: ['Persian'],
    sources: {
      ps: {},
      serebii: { id: '053' },
      pmd: { id: '0053' },
      pokeapi: { id: '53' },
    },
  },
  persianalola: {
    name: ['Alolan Persian', 'Persian-Alola', 'Persian-A'],
    sources: {
      ps: { id: 'persian-alola' },
      serebii: { id: '053-a' },
      pmd: { id: '0053/0001' },
      pokeapi: { id: '10108' },
    },
  },
  psyduck: {
    name: ['Psyduck'],
    sources: {
      ps: {},
      serebii: { id: '054' },
      pmd: { id: '0054' },
      pokeapi: { id: '54' },
    },
  },
  golduck: {
    name: ['Golduck'],
    sources: {
      ps: {},
      serebii: { id: '055' },
      pmd: { id: '0055' },
      pokeapi: { id: '55' },
    },
  },
  mankey: {
    name: ['Mankey'],
    sources: {
      ps: {},
      serebii: { id: '056' },
      pmd: { id: '0056' },
      pokeapi: { id: '56' },
    },
  },
  primeape: {
    name: ['Primeape'],
    sources: {
      ps: {},
      serebii: { id: '057' },
      pmd: { id: '0057' },
      pokeapi: { id: '57' },
    },
  },
  growlithe: {
    name: ['Growlithe'],
    sources: {
      ps: {},
      serebii: { id: '058' },
      pmd: { id: '0058' },
      pokeapi: { id: '58' },
    },
  },
  growlithehisui: {
    name: ['Hisuian Growlithe', 'Growlithe-Hisui', 'Growlithe-H'],
    sources: {
      ps: { id: 'growlithe-hisui' },
      serebii: { id: '058-h' },
      pmd: { id: '0058/0001' },
      pokeapi: { id: '10229' },
    },
  },
  arcanine: {
    name: ['Arcanine'],
    sources: {
      ps: {},
      serebii: { id: '059' },
      pmd: { id: '0059' },
      pokeapi: { id: '59' },
    },
  },
  arcaninehisui: {
    name: ['Hisuian Arcanine', 'Arcanine-Hisui', 'Arcanine-H'],
    sources: {
      ps: { id: 'arcanine-hisui' },
      serebii: { id: '059-h' },
      pmd: { id: '0059/0001' },
      pokeapi: { id: '10230' },
    },
  },
  poliwag: {
    name: ['Poliwag'],
    sources: {
      ps: { flip: true },
      serebii: { id: '060' },
      pmd: { id: '0060' },
      pokeapi: { id: '60' },
    },
  },
  poliwhirl: {
    name: ['Poliwhirl'],
    sources: {
      ps: {},
      serebii: { id: '061' },
      pmd: { id: '0061' },
      pokeapi: { id: '61' },
    },
  },
  poliwrath: {
    name: ['Poliwrath'],
    sources: {
      ps: {},
      serebii: { id: '062' },
      pmd: { id: '0062' },
      pokeapi: { id: '62' },
    },
  },
  abra: {
    name: ['Abra'],
    sources: {
      ps: {},
      serebii: { id: '063' },
      pmd: { id: '0063' },
      pokeapi: { id: '63' },
    },
  },
  kadabra: {
    name: ['Kadabra'],
    sources: {
      ps: { flip: true },
      serebii: { id: '064' },
      pmd: { id: '0064' },
      pokeapi: { id: '64' },
    },
  },
  alakazam: {
    name: ['Alakazam'],
    sources: {
      ps: {},
      serebii: { id: '065' },
      pmd: { id: '0065' },
      pokeapi: { id: '65' },
    },
  },
  alakazammega: {
    name: ['Mega Alakazam', 'Alakazam-Mega'],
    sources: {
      ps: { id: 'alakazam-mega' },
      serebii: { id: '065-m' },
      pmd: { id: '0065/0001' },
      pokeapi: { id: '10037' },
    },
  },
  machop: {
    name: ['Machop'],
    sources: {
      ps: {},
      serebii: { id: '066' },
      pmd: { id: '0066' },
      pokeapi: { id: '66' },
    },
  },
  machoke: {
    name: ['Machoke'],
    sources: {
      ps: {},
      serebii: { id: '067' },
      pmd: { id: '0067' },
      pokeapi: { id: '67' },
    },
  },
  machamp: {
    name: ['Machamp'],
    sources: {
      ps: { flip: true },
      serebii: { id: '068' },
      pmd: { id: '0068' },
      pokeapi: { id: '68' },
    },
  },
  machampgmax: {
    name: ['Machamp-Gmax'],
    sources: {
      ps: { id: 'machamp-gmax' },
      serebii: { id: '068-gi' },
      pmd: { id: '0068' },
      pokeapi: { id: '10201' },
    },
  },
  machampmega: {
    name: ['Mega Machamp', 'Machamp-Mega'],
    sources: {
      ps: { id: 'machamp-gmax' },
      serebii: { id: '068-gi' },
      pmd: { id: '0068' },
      pokeapi: { id: '10201' },
    },
  },
  bellsprout: {
    name: ['Bellsprout'],
    sources: {
      ps: {},
      serebii: { id: '069' },
      pmd: { id: '0069' },
      pokeapi: { id: '69' },
    },
  },
  weepinbell: {
    name: ['Weepinbell'],
    sources: {
      ps: {},
      serebii: { id: '070' },
      pmd: { id: '0070' },
      pokeapi: { id: '70' },
    },
  },
  victreebel: {
    name: ['Victreebel'],
    sources: {
      ps: {},
      serebii: { id: '071' },
      pmd: { id: '0071' },
      pokeapi: { id: '71' },
    },
  },
  victreebelmega: {
    name: ['Mega Victreebel', 'Victreebel-Mega'],
    sources: {
      ps: { id: 'victreebel-mega' },
      serebii: { id: '071' },
      pmd: { id: '0071/0001' },
      pokeapi: { id: '10279' },
    },
  },
  tentacool: {
    name: ['Tentacool'],
    sources: {
      ps: {},
      serebii: { id: '072' },
      pmd: { id: '0072' },
      pokeapi: { id: '72' },
    },
  },
  tentacruel: {
    name: ['Tentacruel'],
    sources: {
      ps: {},
      serebii: { id: '073' },
      pmd: { id: '0073' },
      pokeapi: { id: '73' },
    },
  },
  geodude: {
    name: ['Geodude'],
    sources: {
      ps: {},
      serebii: { id: '074' },
      pmd: { id: '0074' },
      pokeapi: { id: '74' },
    },
  },
  geodudealola: {
    name: ['Alolan Geodude', 'Geodude-Alola', 'Geodude-A'],
    sources: {
      ps: { id: 'geodude-alola' },
      serebii: { id: '074-a' },
      pmd: { id: '0074/0001' },
      pokeapi: { id: '10109' },
    },
  },
  graveler: {
    name: ['Graveler'],
    sources: {
      ps: {},
      serebii: { id: '075' },
      pmd: { id: '0075' },
      pokeapi: { id: '75' },
    },
  },
  graveleralola: {
    name: ['Alolan Graveler', 'Graveler-Alola', 'Graveler-A'],
    sources: {
      ps: { id: 'graveler-alola' },
      serebii: { id: '075-a' },
      pmd: { id: '0075/0001' },
      pokeapi: { id: '10110' },
    },
  },
  golem: {
    name: ['Golem'],
    sources: {
      ps: {},
      serebii: { id: '076' },
      pmd: { id: '0076' },
      pokeapi: { id: '76' },
    },
  },
  golemalola: {
    name: ['Alolan Golem', 'Golem-Alola', 'Golem-A'],
    sources: {
      ps: { id: 'golem-alola' },
      serebii: { id: '076-a' },
      pmd: { id: '0076/0001' },
      pokeapi: { id: '10111' },
    },
  },
  ponyta: {
    name: ['Ponyta'],
    sources: {
      ps: {},
      serebii: { id: '077' },
      pmd: { id: '0077' },
      pokeapi: { id: '77' },
    },
  },
  ponytagalar: {
    name: ['Galarian Ponyta', 'Ponyta-Galar', 'Ponyta-G'],
    sources: {
      ps: { id: 'ponyta-galar' },
      serebii: { id: '077-g' },
      pmd: { id: '0077/0001' },
      pokeapi: { id: '10162' },
    },
  },
  rapidash: {
    name: ['Rapidash'],
    sources: {
      ps: {},
      serebii: { id: '078' },
      pmd: { id: '0078' },
      pokeapi: { id: '78' },
    },
  },
  rapidashgalar: {
    name: ['Galarian Rapidash', 'Rapidash-Galar', 'Rapidash-G'],
    sources: {
      ps: { id: 'rapidash-galar', flip: true },
      serebii: { id: '078-g' },
      pmd: { id: '0078/0001' },
      pokeapi: { id: '10163' },
    },
  },
  slowpoke: {
    name: ['Slowpoke'],
    sources: {
      ps: {},
      serebii: { id: '079' },
      pmd: { id: '0079' },
      pokeapi: { id: '79' },
    },
  },
  slowpokegalar: {
    name: ['Galarian Slowpoke', 'Slowpoke-Galar', 'Slowpoke-G'],
    sources: {
      ps: { id: 'slowpoke-galar' },
      serebii: { id: '079-g' },
      pmd: { id: '0079/0001' },
      pokeapi: { id: '10164' },
    },
  },
  slowbro: {
    name: ['Slowbro'],
    sources: {
      ps: {},
      serebii: { id: '080' },
      pmd: { id: '0080' },
      pokeapi: { id: '80' },
    },
  },
  slowbromega: {
    name: ['Mega Slowbro', 'Slowbro-Mega'],
    sources: {
      ps: { id: 'slowbro-mega' },
      serebii: { id: '080-m' },
      pmd: { id: '0080/0002' },
      pokeapi: { id: '10071' },
    },
  },
  slowbrogalar: {
    name: ['Galarian Slowbro', 'Slowbro-Galar', 'Slowbro-G'],
    sources: {
      ps: { id: 'slowbro-galar', flip: true },
      serebii: { id: '080-g' },
      pmd: { id: '0080/0001' },
      pokeapi: { id: '10165' },
    },
  },
  magnemite: {
    name: ['Magnemite'],
    sources: {
      ps: {},
      serebii: { id: '081' },
      pmd: { id: '0081' },
      pokeapi: { id: '81' },
    },
  },
  magneton: {
    name: ['Magneton'],
    sources: {
      ps: { flip: true },
      serebii: { id: '082' },
      pmd: { id: '0082' },
      pokeapi: { id: '82' },
    },
  },
  farfetchd: {
    name: ['Farfetch’d'],
    sources: {
      ps: { flip: true },
      serebii: { id: '083' },
      pmd: { id: '0083' },
      pokeapi: { id: '83' },
    },
  },
  farfetchdgalar: {
    name: ['Galarian Farfetch’d', 'Farfetch’d-Galar', 'Farfetch’d-G'],
    sources: {
      ps: { id: 'farfetchd-galar' },
      serebii: { id: '083-g' },
      pmd: { id: '0083/0001' },
      pokeapi: { id: '10166' },
    },
  },
  doduo: {
    name: ['Doduo'],
    sources: {
      ps: {},
      serebii: { id: '084' },
      pmd: { id: '0084' },
      pokeapi: { id: '84' },
    },
  },
  dodrio: {
    name: ['Dodrio'],
    sources: {
      ps: {},
      serebii: { id: '085' },
      pmd: { id: '0085' },
      pokeapi: { id: '85' },
    },
  },
  seel: {
    name: ['Seel'],
    sources: {
      ps: {},
      serebii: { id: '086' },
      pmd: { id: '0086' },
      pokeapi: { id: '86' },
    },
  },
  dewgong: {
    name: ['Dewgong'],
    sources: {
      ps: {},
      serebii: { id: '087' },
      pmd: { id: '0087' },
      pokeapi: { id: '87' },
    },
  },
  grimer: {
    name: ['Grimer'],
    sources: {
      ps: {},
      serebii: { id: '088' },
      pmd: { id: '0088' },
      pokeapi: { id: '88' },
    },
  },
  grimeralola: {
    name: ['Alolan Grimer', 'Grimer-Alola', 'Grimer-A'],
    sources: {
      ps: { id: 'grimer-alola' },
      serebii: { id: '088-a' },
      pmd: { id: '0088/0001' },
      pokeapi: { id: '10112' },
    },
  },
  muk: {
    name: ['Muk'],
    sources: {
      ps: { flip: true },
      serebii: { id: '089' },
      pmd: { id: '0089' },
      pokeapi: { id: '89' },
    },
  },
  mukalola: {
    name: ['Alolan Muk', 'Muk-Alola', 'Muk-A'],
    sources: {
      ps: { id: 'muk-alola' },
      serebii: { id: '089-a' },
      pmd: { id: '0089/0001' },
      pokeapi: { id: '10113' },
    },
  },
  shellder: {
    name: ['Shellder'],
    sources: {
      ps: {},
      serebii: { id: '090' },
      pmd: { id: '0090' },
      pokeapi: { id: '90' },
    },
  },
  cloyster: {
    name: ['Cloyster'],
    sources: {
      ps: {},
      serebii: { id: '091' },
      pmd: { id: '0091' },
      pokeapi: { id: '91' },
    },
  },
  gastly: {
    name: ['Gastly'],
    sources: {
      ps: {},
      serebii: { id: '092' },
      pmd: { id: '0092' },
      pokeapi: { id: '92' },
    },
  },
  haunter: {
    name: ['Haunter'],
    sources: {
      ps: {},
      serebii: { id: '093' },
      pmd: { id: '0093' },
      pokeapi: { id: '93' },
    },
  },
  gengar: {
    name: ['Gengar'],
    sources: {
      ps: {},
      serebii: { id: '094' },
      pmd: { id: '0094' },
      pokeapi: { id: '94' },
    },
  },
  gengarmega: {
    name: ['Mega Gengar', 'Gengar-Mega'],
    sources: {
      ps: { id: 'gengar-mega' },
      serebii: { id: '094-m' },
      pmd: { id: '0094/0001' },
      pokeapi: { id: '10038' },
    },
  },
  gengargmax: {
    name: ['Gengar-Gmax'],
    sources: {
      ps: { id: 'gengar-gmax', flip: true },
      serebii: { id: '094-gi' },
      pmd: { id: '0094' },
      pokeapi: { id: '10202' },
    },
  },
  onix: {
    name: ['Onix'],
    sources: {
      ps: {},
      serebii: { id: '095' },
      pmd: { id: '0095' },
      pokeapi: { id: '95' },
    },
  },
  drowzee: {
    name: ['Drowzee'],
    sources: {
      ps: { flip: true },
      serebii: { id: '096' },
      pmd: { id: '0096' },
      pokeapi: { id: '96' },
    },
  },
  hypno: {
    name: ['Hypno'],
    sources: {
      ps: {},
      serebii: { id: '097' },
      pmd: { id: '0097' },
      pokeapi: { id: '97' },
    },
  },
  krabby: {
    name: ['Krabby'],
    sources: {
      ps: {},
      serebii: { id: '098' },
      pmd: { id: '0098' },
      pokeapi: { id: '98' },
    },
  },
  kingler: {
    name: ['Kingler'],
    sources: {
      ps: {},
      serebii: { id: '099' },
      pmd: { id: '0099' },
      pokeapi: { id: '99' },
    },
  },
  kinglergmax: {
    name: ['Kingler-Gmax'],
    sources: {
      ps: { id: 'kingler-gmax' },
      serebii: { id: '099-gi' },
      pmd: { id: '0099' },
      pokeapi: { id: '10203' },
    },
  },
  kinglermega: {
    name: ['Mega Kingler', 'Kingler-Mega'],
    sources: {
      ps: { id: 'kingler-gmax' },
      serebii: { id: '099-gi' },
      pmd: { id: '0099' },
      pokeapi: { id: '10203' },
    },
  },
  voltorb: {
    name: ['Voltorb'],
    sources: {
      ps: { flip: true },
      serebii: { id: '100' },
      pmd: { id: '0100' },
      pokeapi: { id: '100' },
    },
  },
  voltorbhisui: {
    name: ['Hisuian Voltorb', 'Voltorb-Hisui', 'Voltorb-H'],
    sources: {
      ps: { id: 'voltorb-hisui', flip: true },
      serebii: { id: '100-h' },
      pmd: { id: '0100/0001' },
      pokeapi: { id: '10231' },
    },
  },
  electrode: {
    name: ['Electrode'],
    sources: {
      ps: {},
      serebii: { id: '101' },
      pmd: { id: '0101' },
      pokeapi: { id: '101' },
    },
  },
  electrodehisui: {
    name: ['Hisuian Electrode', 'Electrode-Hisui', 'Electrode-H'],
    sources: {
      ps: { id: 'electrode-hisui', flip: true },
      serebii: { id: '101-h' },
      pmd: { id: '0101/0001' },
      pokeapi: { id: '10232' },
    },
  },
  exeggcute: {
    name: ['Exeggcute'],
    sources: {
      ps: {},
      serebii: { id: '102' },
      pmd: { id: '0102' },
      pokeapi: { id: '102' },
    },
  },
  exeggutor: {
    name: ['Exeggutor'],
    sources: {
      ps: {},
      serebii: { id: '103' },
      pmd: { id: '0103' },
      pokeapi: { id: '103' },
    },
  },
  exeggutoralola: {
    name: ['Alolan Exeggutor', 'Exeggutor-Alola', 'Exeggutor-A'],
    sources: {
      ps: { id: 'exeggutor-alola' },
      serebii: { id: '103-a' },
      pmd: { id: '0103/0001' },
      pokeapi: { id: '10114' },
    },
  },
  cubone: {
    name: ['Cubone'],
    sources: {
      ps: {},
      serebii: { id: '104' },
      pmd: { id: '0104' },
      pokeapi: { id: '104' },
    },
  },
  marowak: {
    name: ['Marowak'],
    sources: {
      ps: {},
      serebii: { id: '105' },
      pmd: { id: '0105' },
      pokeapi: { id: '105' },
    },
  },
  marowakalola: {
    name: ['Alolan Marowak', 'Marowak-Alola', 'Marowak-A'],
    sources: {
      ps: { id: 'marowak-alola' },
      serebii: { id: '105-a' },
      pmd: { id: '0105/0001' },
      pokeapi: { id: '10115' },
    },
  },
  hitmonlee: {
    name: ['Hitmonlee'],
    sources: {
      ps: { flip: true },
      serebii: { id: '106' },
      pmd: { id: '0106' },
      pokeapi: { id: '106' },
    },
  },
  hitmonchan: {
    name: ['Hitmonchan'],
    sources: {
      ps: {},
      serebii: { id: '107' },
      pmd: { id: '0107' },
      pokeapi: { id: '107' },
    },
  },
  lickitung: {
    name: ['Lickitung'],
    sources: {
      ps: {},
      serebii: { id: '108' },
      pmd: { id: '0108' },
      pokeapi: { id: '108' },
    },
  },
  koffing: {
    name: ['Koffing'],
    sources: {
      ps: {},
      serebii: { id: '109' },
      pmd: { id: '0109' },
      pokeapi: { id: '109' },
    },
  },
  weezing: {
    name: ['Weezing'],
    sources: {
      ps: {},
      serebii: { id: '110' },
      pmd: { id: '0110' },
      pokeapi: { id: '110' },
    },
  },
  weezinggalar: {
    name: ['Galarian Weezing', 'Weezing-Galar', 'Weezing-G'],
    sources: {
      ps: { id: 'weezing-galar' },
      serebii: { id: '110-g' },
      pmd: { id: '0110/0001' },
      pokeapi: { id: '10167' },
    },
  },
  rhyhorn: {
    name: ['Rhyhorn'],
    sources: {
      ps: {},
      serebii: { id: '111' },
      pmd: { id: '0111' },
      pokeapi: { id: '111' },
    },
  },
  rhydon: {
    name: ['Rhydon'],
    sources: {
      ps: {},
      serebii: { id: '112' },
      pmd: { id: '0112' },
      pokeapi: { id: '112' },
    },
  },
  chansey: {
    name: ['Chansey'],
    sources: {
      ps: {},
      serebii: { id: '113' },
      pmd: { id: '0113' },
      pokeapi: { id: '113' },
    },
  },
  tangela: {
    name: ['Tangela'],
    sources: {
      ps: { flip: true },
      serebii: { id: '114' },
      pmd: { id: '0114' },
      pokeapi: { id: '114' },
    },
  },
  kangaskhan: {
    name: ['Kangaskhan'],
    sources: {
      ps: {},
      serebii: { id: '115' },
      pmd: { id: '0115' },
      pokeapi: { id: '115' },
    },
  },
  kangaskhanmega: {
    name: ['Mega Kangaskhan', 'Kangaskhan-Mega'],
    sources: {
      ps: { id: 'kangaskhan-mega', flip: true },
      serebii: { id: '115-m' },
      pmd: { id: '0115' },
      pokeapi: { id: '10039' },
    },
  },
  horsea: {
    name: ['Horsea'],
    sources: {
      ps: {},
      serebii: { id: '116' },
      pmd: { id: '0116' },
      pokeapi: { id: '116' },
    },
  },
  seadra: {
    name: ['Seadra'],
    sources: {
      ps: {},
      serebii: { id: '117' },
      pmd: { id: '0117' },
      pokeapi: { id: '117' },
    },
  },
  goldeen: {
    name: ['Goldeen'],
    sources: {
      ps: { flip: true },
      serebii: { id: '118' },
      pmd: { id: '0118' },
      pokeapi: { id: '118' },
    },
  },
  seaking: {
    name: ['Seaking'],
    sources: {
      ps: {},
      serebii: { id: '119' },
      pmd: { id: '0119' },
      pokeapi: { id: '119' },
    },
  },
  staryu: {
    name: ['Staryu'],
    sources: {
      ps: {},
      serebii: { id: '120' },
      pmd: { id: '0120' },
      pokeapi: { id: '120' },
    },
  },
  starmie: {
    name: ['Starmie'],
    sources: {
      ps: {},
      serebii: { id: '121' },
      pmd: { id: '0121' },
      pokeapi: { id: '121' },
    },
  },
  starmiemega: {
    name: ['Mega Starmie', 'Starmie-Mega'],
    sources: {
      ps: { id: 'starmie-mega' },
      serebii: { id: '121' },
      pmd: { id: '0121/0001' },
      pokeapi: { id: '10280' },
    },
  },
  mrmime: {
    name: ['Mr. Mime'],
    sources: {
      ps: {},
      serebii: { id: '122' },
      pmd: { id: '0122' },
      pokeapi: { id: '122' },
    },
  },
  mrmimegalar: {
    name: ['Galarian Mr. Mime', 'Mr. Mime-Galar', 'Mr. Mime-G'],
    sources: {
      ps: { id: 'mrmime-galar' },
      serebii: { id: '122-g' },
      pmd: { id: '0122/0001' },
      pokeapi: { id: '10168' },
    },
  },
  scyther: {
    name: ['Scyther'],
    sources: {
      ps: {},
      serebii: { id: '123' },
      pmd: { id: '0123' },
      pokeapi: { id: '123' },
    },
  },
  jynx: {
    name: ['Jynx'],
    sources: {
      ps: {},
      serebii: { id: '124' },
      pmd: { id: '0124' },
      pokeapi: { id: '124' },
    },
  },
  electabuzz: {
    name: ['Electabuzz'],
    sources: {
      ps: { flip: true },
      serebii: { id: '125' },
      pmd: { id: '0125' },
      pokeapi: { id: '125' },
    },
  },
  magmar: {
    name: ['Magmar'],
    sources: {
      ps: {},
      serebii: { id: '126' },
      pmd: { id: '0126' },
      pokeapi: { id: '126' },
    },
  },
  pinsir: {
    name: ['Pinsir'],
    sources: {
      ps: {},
      serebii: { id: '127' },
      pmd: { id: '0127' },
      pokeapi: { id: '127' },
    },
  },
  pinsirmega: {
    name: ['Mega Pinsir', 'Pinsir-Mega'],
    sources: {
      ps: { id: 'pinsir-mega' },
      serebii: { id: '127-m' },
      pmd: { id: '0127/0001' },
      pokeapi: { id: '10040' },
    },
  },
  tauros: {
    name: ['Tauros'],
    sources: {
      ps: {},
      serebii: { id: '128' },
      pmd: { id: '0128' },
      pokeapi: { id: '128' },
    },
  },
  taurospaldeacombat: {
    name: ['Paldean Tauros Combat', 'Tauros-Paldea-Combat', 'Tauros-P'],
    sources: {
      ps: { id: 'tauros-paldeacombat' },
      serebii: { id: '128-p' },
      pmd: { id: '0128/0001' },
      pokeapi: { id: '10250' },
    },
  },
  taurospaldeablaze: {
    name: ['Paldean Tauros Blaze', 'Tauros-Paldea-Blaze', 'Tauros-P-B'],
    sources: {
      ps: { id: 'tauros-paldeablaze', flip: true },
      serebii: { id: '128-b' },
      pmd: { id: '0128/0002' },
      pokeapi: { id: '10251' },
    },
  },
  taurospaldeaaqua: {
    name: ['Paldean Tauros Aqua', 'Tauros-Paldea-Aqua', 'Tauros-P-A'],
    sources: {
      ps: { id: 'tauros-paldeaaqua' },
      serebii: { id: '128-a' },
      pmd: { id: '0128/0003' },
      pokeapi: { id: '10252' },
    },
  },
  magikarp: {
    name: ['Magikarp'],
    sources: {
      ps: {},
      serebii: { id: '129' },
      pmd: { id: '0129' },
      pokeapi: { id: '129' },
    },
  },
  gyarados: {
    name: ['Gyarados'],
    sources: {
      ps: {},
      serebii: { id: '130' },
      pmd: { id: '0130' },
      pokeapi: { id: '130' },
    },
  },
  gyaradosmega: {
    name: ['Mega Gyarados', 'Gyarados-Mega'],
    sources: {
      ps: { id: 'gyarados-mega' },
      serebii: { id: '130-m' },
      pmd: { id: '0130/0001' },
      pokeapi: { id: '10041' },
    },
  },
  lapras: {
    name: ['Lapras'],
    sources: {
      ps: { flip: true },
      serebii: { id: '131' },
      pmd: { id: '0131' },
      pokeapi: { id: '131' },
    },
  },
  laprasgmax: {
    name: ['Lapras-Gmax'],
    sources: {
      ps: { id: 'lapras-gmax' },
      serebii: { id: '131-gi' },
      pmd: { id: '0131' },
      pokeapi: { id: '10204' },
    },
  },
  laprasmega: {
    name: ['Mega Lapras', 'Lapras-Mega'],
    sources: {
      ps: { id: 'lapras-gmax' },
      serebii: { id: '131-gi' },
      pmd: { id: '0131' },
      pokeapi: { id: '10204' },
    },
  },
  ditto: {
    name: ['Ditto'],
    sources: {
      ps: {},
      serebii: { id: '132' },
      pmd: { id: '0132' },
      pokeapi: { id: '132' },
    },
  },
  eevee: {
    name: ['Eevee'],
    sources: {
      ps: {},
      serebii: { id: '133' },
      pmd: { id: '0133' },
      pokeapi: { id: '133' },
    },
  },
  eeveestarter: {
    name: ['Eevee-Starter'],
    sources: {
      ps: { id: 'eevee-starter' },
      serebii: { id: '133' },
      pmd: { id: '0133/0001' },
      pokeapi: { id: '10159' },
    },
  },
  eeveegmax: {
    name: ['Eevee-Gmax'],
    sources: {
      ps: { id: 'eevee-gmax', flip: true },
      serebii: { id: '133-gi' },
      pmd: { id: '0133' },
      pokeapi: { id: '10205' },
    },
  },
  vaporeon: {
    name: ['Vaporeon'],
    sources: {
      ps: {},
      serebii: { id: '134' },
      pmd: { id: '0134' },
      pokeapi: { id: '134' },
    },
  },
  jolteon: {
    name: ['Jolteon'],
    sources: {
      ps: {},
      serebii: { id: '135' },
      pmd: { id: '0135' },
      pokeapi: { id: '135' },
    },
  },
  flareon: {
    name: ['Flareon'],
    sources: {
      ps: {},
      serebii: { id: '136' },
      pmd: { id: '0136' },
      pokeapi: { id: '136' },
    },
  },
  porygon: {
    name: ['Porygon'],
    sources: {
      ps: {},
      serebii: { id: '137' },
      pmd: { id: '0137' },
      pokeapi: { id: '137' },
    },
  },
  omanyte: {
    name: ['Omanyte'],
    sources: {
      ps: { flip: true },
      serebii: { id: '138' },
      pmd: { id: '0138' },
      pokeapi: { id: '138' },
    },
  },
  omastar: {
    name: ['Omastar'],
    sources: {
      ps: {},
      serebii: { id: '139' },
      pmd: { id: '0139' },
      pokeapi: { id: '139' },
    },
  },
  kabuto: {
    name: ['Kabuto'],
    sources: {
      ps: {},
      serebii: { id: '140' },
      pmd: { id: '0140' },
      pokeapi: { id: '140' },
    },
  },
  kabutops: {
    name: ['Kabutops'],
    sources: {
      ps: {},
      serebii: { id: '141' },
      pmd: { id: '0141' },
      pokeapi: { id: '141' },
    },
  },
  aerodactyl: {
    name: ['Aerodactyl'],
    sources: {
      ps: {},
      serebii: { id: '142' },
      pmd: { id: '0142' },
      pokeapi: { id: '142' },
    },
  },
  aerodactylmega: {
    name: ['Mega Aerodactyl', 'Aerodactyl-Mega'],
    sources: {
      ps: { id: 'aerodactyl-mega' },
      serebii: { id: '142-m' },
      pmd: { id: '0142/0001' },
      pokeapi: { id: '10042' },
    },
  },
  snorlax: {
    name: ['Snorlax'],
    sources: {
      ps: {},
      serebii: { id: '143' },
      pmd: { id: '0143' },
      pokeapi: { id: '143' },
    },
  },
  snorlaxgmax: {
    name: ['Snorlax-Gmax'],
    sources: {
      ps: { id: 'snorlax-gmax' },
      serebii: { id: '143-gi' },
      pmd: { id: '0143' },
      pokeapi: { id: '10206' },
    },
  },
  snorlaxmega: {
    name: ['Mega Snorlax', 'Snorlax-Mega'],
    sources: {
      ps: { id: 'snorlax-gmax' },
      serebii: { id: '143-gi' },
      pmd: { id: '0143' },
      pokeapi: { id: '10206' },
    },
  },
  articuno: {
    name: ['Articuno'],
    sources: {
      ps: {},
      serebii: { id: '144' },
      pmd: { id: '0144' },
      pokeapi: { id: '144' },
    },
  },
  articunogalar: {
    name: ['Galarian Articuno', 'Articuno-Galar', 'Articuno-G'],
    sources: {
      ps: { id: 'articuno-galar' },
      serebii: { id: '144-g' },
      pmd: { id: '0144/0001' },
      pokeapi: { id: '10169' },
    },
  },
  zapdos: {
    name: ['Zapdos'],
    sources: {
      ps: {},
      serebii: { id: '145' },
      pmd: { id: '0145' },
      pokeapi: { id: '145' },
    },
  },
  zapdosgalar: {
    name: ['Galarian Zapdos', 'Zapdos-Galar', 'Zapdos-G'],
    sources: {
      ps: { id: 'zapdos-galar', flip: true },
      serebii: { id: '145-g' },
      pmd: { id: '0145/0001' },
      pokeapi: { id: '10170' },
    },
  },
  moltres: {
    name: ['Moltres'],
    sources: {
      ps: { flip: true },
      serebii: { id: '146' },
      pmd: { id: '0146' },
      pokeapi: { id: '146' },
    },
  },
  moltresgalar: {
    name: ['Galarian Moltres', 'Moltres-Galar', 'Moltres-G'],
    sources: {
      ps: { id: 'moltres-galar' },
      serebii: { id: '146-g' },
      pmd: { id: '0146/0001' },
      pokeapi: { id: '10171' },
    },
  },
  dratini: {
    name: ['Dratini'],
    sources: {
      ps: { flip: true },
      serebii: { id: '147' },
      pmd: { id: '0147' },
      pokeapi: { id: '147' },
    },
  },
  dragonair: {
    name: ['Dragonair'],
    sources: {
      ps: {},
      serebii: { id: '148' },
      pmd: { id: '0148' },
      pokeapi: { id: '148' },
    },
  },
  dragonite: {
    name: ['Dragonite'],
    sources: {
      ps: {},
      serebii: { id: '149' },
      pmd: { id: '0149' },
      pokeapi: { id: '149' },
    },
  },
  dragonitemega: {
    name: ['Mega Dragonite', 'Dragonite-Mega'],
    sources: {
      ps: { id: 'dragonite-mega' },
      serebii: { id: '149' },
      pmd: { id: '0149/0001' },
      pokeapi: { id: '10281' },
    },
  },
  mewtwo: {
    name: ['Mewtwo'],
    sources: {
      ps: {},
      serebii: { id: '150' },
      pmd: { id: '0150' },
      pokeapi: { id: '150' },
    },
  },
  mewtwomegax: {
    name: ['Mega Mewtwo X', 'Mewtwo-Mega-X'],
    sources: {
      ps: { id: 'mewtwo-megax', flip: true },
      serebii: { id: '150-mx' },
      pmd: { id: '0150/0001' },
      pokeapi: { id: '10043' },
    },
  },
  mewtwomegay: {
    name: ['Mega Mewtwo Y', 'Mewtwo-Mega-Y'],
    sources: {
      ps: { id: 'mewtwo-megay' },
      serebii: { id: '150-my' },
      pmd: { id: '0150/0002' },
      pokeapi: { id: '10044' },
    },
  },
  mew: {
    name: ['Mew'],
    sources: {
      ps: {},
      serebii: { id: '151' },
      pmd: { id: '0151' },
      pokeapi: { id: '151' },
    },
  },
  chikorita: {
    name: ['Chikorita'],
    sources: {
      ps: {},
      serebii: { id: '152' },
      pmd: { id: '0152' },
      pokeapi: { id: '152' },
    },
  },
  bayleef: {
    name: ['Bayleef'],
    sources: {
      ps: {},
      serebii: { id: '153' },
      pmd: { id: '0153' },
      pokeapi: { id: '153' },
    },
  },
  meganium: {
    name: ['Meganium'],
    sources: {
      ps: {},
      serebii: { id: '154' },
      pmd: { id: '0154' },
      pokeapi: { id: '154' },
    },
  },
  meganiummega: {
    name: ['Mega Meganium', 'Meganium-Mega'],
    sources: {
      ps: { id: 'meganium-mega' },
      serebii: { id: '154' },
      pmd: { id: '0154/0001' },
      pokeapi: { id: '10282' },
    },
  },

  cyndaquil: {
    name: ['Cyndaquil'],
    sources: {
      ps: { flip: true },
      serebii: { id: '155' },
      pmd: { id: '0155' },
      pokeapi: { id: '155' },
    },
  },
  quilava: {
    name: ['Quilava'],
    sources: {
      ps: { flip: true },
      serebii: { id: '156' },
      pmd: { id: '0156' },
      pokeapi: { id: '156' },
    },
  },
  typhlosion: {
    name: ['Typhlosion'],
    sources: {
      ps: {},
      serebii: { id: '157' },
      pmd: { id: '0157' },
      pokeapi: { id: '157' },
    },
  },
  typhlosionhisui: {
    name: ['Hisuian Typhlosion', 'Typhlosion-Hisui', 'Typhlosion-H'],
    sources: {
      ps: { id: 'typhlosion-hisui', flip: true },
      serebii: { id: '157-h' },
      pmd: { id: '0157/0001' },
      pokeapi: { id: '10233' },
    },
  },
  totodile: {
    name: ['Totodile'],
    sources: {
      ps: {},
      serebii: { id: '158' },
      pmd: { id: '0158' },
      pokeapi: { id: '158' },
    },
  },
  croconaw: {
    name: ['Croconaw'],
    sources: {
      ps: {},
      serebii: { id: '159' },
      pmd: { id: '0159' },
      pokeapi: { id: '159' },
    },
  },
  feraligatr: {
    name: ['Feraligatr'],
    sources: {
      ps: {},
      serebii: { id: '160' },
      pmd: { id: '0160' },
      pokeapi: { id: '160' },
    },
  },
  feraligatrmega: {
    name: ['Mega Feraligatr', 'Feraligatr-Mega'],
    sources: {
      ps: { id: 'feraligatr-mega' },
      serebii: { id: '160' },
      pmd: { id: '0160/0001' },
      pokeapi: { id: '10283' },
    },
  },
  sentret: {
    name: ['Sentret'],
    sources: {
      ps: {},
      serebii: { id: '161' },
      pmd: { id: '0161' },
      pokeapi: { id: '161' },
    },
  },
  furret: {
    name: ['Furret'],
    sources: {
      ps: {},
      serebii: { id: '162' },
      pmd: { id: '0162' },
      pokeapi: { id: '162' },
    },
  },
  hoothoot: {
    name: ['Hoothoot'],
    sources: {
      ps: { flip: true },
      serebii: { id: '163' },
      pmd: { id: '0163' },
      pokeapi: { id: '163' },
    },
  },
  noctowl: {
    name: ['Noctowl'],
    sources: {
      ps: {},
      serebii: { id: '164' },
      pmd: { id: '0164' },
      pokeapi: { id: '164' },
    },
  },
  ledyba: {
    name: ['Ledyba'],
    sources: {
      ps: {},
      serebii: { id: '165' },
      pmd: { id: '0165' },
      pokeapi: { id: '165' },
    },
  },
  ledian: {
    name: ['Ledian'],
    sources: {
      ps: {},
      serebii: { id: '166' },
      pmd: { id: '0166' },
      pokeapi: { id: '166' },
    },
  },
  spinarak: {
    name: ['Spinarak'],
    sources: {
      ps: {},
      serebii: { id: '167' },
      pmd: { id: '0167' },
      pokeapi: { id: '167' },
    },
  },
  ariados: {
    name: ['Ariados'],
    sources: {
      ps: {},
      serebii: { id: '168' },
      pmd: { id: '0168' },
      pokeapi: { id: '168' },
    },
  },
  crobat: {
    name: ['Crobat'],
    sources: {
      ps: { flip: true },
      serebii: { id: '169' },
      pmd: { id: '0169' },
      pokeapi: { id: '169' },
    },
  },
  chinchou: {
    name: ['Chinchou'],
    sources: {
      ps: {},
      serebii: { id: '170' },
      pmd: { id: '0170' },
      pokeapi: { id: '170' },
    },
  },
  lanturn: {
    name: ['Lanturn'],
    sources: {
      ps: {},
      serebii: { id: '171' },
      pmd: { id: '0171' },
      pokeapi: { id: '171' },
    },
  },
  pichu: {
    name: ['Pichu'],
    sources: {
      ps: {},
      serebii: { id: '172' },
      pmd: { id: '0172' },
      pokeapi: { id: '172' },
    },
  },
  cleffa: {
    name: ['Cleffa'],
    sources: {
      ps: { flip: true },
      serebii: { id: '173' },
      pmd: { id: '0173' },
      pokeapi: { id: '173' },
    },
  },
  igglybuff: {
    name: ['Igglybuff'],
    sources: {
      ps: {},
      serebii: { id: '174' },
      pmd: { id: '0174' },
      pokeapi: { id: '174' },
    },
  },
  togepi: {
    name: ['Togepi'],
    sources: {
      ps: {},
      serebii: { id: '175' },
      pmd: { id: '0175' },
      pokeapi: { id: '175' },
    },
  },
  togetic: {
    name: ['Togetic'],
    sources: {
      ps: {},
      serebii: { id: '176' },
      pmd: { id: '0176' },
      pokeapi: { id: '176' },
    },
  },
  natu: {
    name: ['Natu'],
    sources: {
      ps: {},
      serebii: { id: '177' },
      pmd: { id: '0177' },
      pokeapi: { id: '177' },
    },
  },
  xatu: {
    name: ['Xatu'],
    sources: {
      ps: {},
      serebii: { id: '178' },
      pmd: { id: '0178' },
      pokeapi: { id: '178' },
    },
  },
  mareep: {
    name: ['Mareep'],
    sources: {
      ps: {},
      serebii: { id: '179' },
      pmd: { id: '0179' },
      pokeapi: { id: '179' },
    },
  },
  flaaffy: {
    name: ['Flaaffy'],
    sources: {
      ps: {},
      serebii: { id: '180' },
      pmd: { id: '0180' },
      pokeapi: { id: '180' },
    },
  },
  ampharos: {
    name: ['Ampharos'],
    sources: {
      ps: {},
      serebii: { id: '181' },
      pmd: { id: '0181' },
      pokeapi: { id: '181' },
    },
  },
  ampharosmega: {
    name: ['Mega Ampharos', 'Ampharos-Mega'],
    sources: {
      ps: { id: 'ampharos-mega' },
      serebii: { id: '181-m' },
      pmd: { id: '0181/0001' },
      pokeapi: { id: '10045' },
    },
  },
  bellossom: {
    name: ['Bellossom'],
    sources: {
      ps: {},
      serebii: { id: '182' },
      pmd: { id: '0182' },
      pokeapi: { id: '182' },
    },
  },
  marill: {
    name: ['Marill'],
    sources: {
      ps: { flip: true },
      serebii: { id: '183' },
      pmd: { id: '0183' },
      pokeapi: { id: '183' },
    },
  },
  azumarill: {
    name: ['Azumarill'],
    sources: {
      ps: {},
      serebii: { id: '184' },
      pmd: { id: '0184' },
      pokeapi: { id: '184' },
    },
  },
  sudowoodo: {
    name: ['Sudowoodo'],
    sources: {
      ps: {},
      serebii: { id: '185' },
      pmd: { id: '0185' },
      pokeapi: { id: '185' },
    },
  },
  politoed: {
    name: ['Politoed'],
    sources: {
      ps: {},
      serebii: { id: '186' },
      pmd: { id: '0186' },
      pokeapi: { id: '186' },
    },
  },
  hoppip: {
    name: ['Hoppip'],
    sources: {
      ps: {},
      serebii: { id: '187' },
      pmd: { id: '0187' },
      pokeapi: { id: '187' },
    },
  },
  skiploom: {
    name: ['Skiploom'],
    sources: {
      ps: {},
      serebii: { id: '188' },
      pmd: { id: '0188' },
      pokeapi: { id: '188' },
    },
  },
  jumpluff: {
    name: ['Jumpluff'],
    sources: {
      ps: {},
      serebii: { id: '189' },
      pmd: { id: '0189' },
      pokeapi: { id: '189' },
    },
  },
  aipom: {
    name: ['Aipom'],
    sources: {
      ps: {},
      serebii: { id: '190' },
      pmd: { id: '0190' },
      pokeapi: { id: '190' },
    },
  },
  sunkern: {
    name: ['Sunkern'],
    sources: {
      ps: {},
      serebii: { id: '191' },
      pmd: { id: '0191' },
      pokeapi: { id: '191' },
    },
  },
  sunflora: {
    name: ['Sunflora'],
    sources: {
      ps: {},
      serebii: { id: '192' },
      pmd: { id: '0192' },
      pokeapi: { id: '192' },
    },
  },
  yanma: {
    name: ['Yanma'],
    sources: {
      ps: {},
      serebii: { id: '193' },
      pmd: { id: '0193' },
      pokeapi: { id: '193' },
    },
  },
  wooper: {
    name: ['Wooper'],
    sources: {
      ps: { flip: true },
      serebii: { id: '194' },
      pmd: { id: '0194' },
      pokeapi: { id: '194' },
    },
  },
  wooperpaldea: {
    name: ['Paldean Wooper', 'Wooper-Paldea', 'Wooper-P'],
    sources: {
      ps: { id: 'wooper-paldea', flip: true },
      serebii: { id: '194-p' },
      pmd: { id: '0194/0002' },
      pokeapi: { id: '10253' },
    },
  },
  quagsire: {
    name: ['Quagsire'],
    sources: {
      ps: {},
      serebii: { id: '195' },
      pmd: { id: '0195' },
      pokeapi: { id: '195' },
    },
  },
  espeon: {
    name: ['Espeon'],
    sources: {
      ps: {},
      serebii: { id: '196' },
      pmd: { id: '0196' },
      pokeapi: { id: '196' },
    },
  },
  umbreon: {
    name: ['Umbreon'],
    sources: {
      ps: { flip: true },
      serebii: { id: '197' },
      pmd: { id: '0197' },
      pokeapi: { id: '197' },
    },
  },
  murkrow: {
    name: ['Murkrow'],
    sources: {
      ps: {},
      serebii: { id: '198' },
      pmd: { id: '0198' },
      pokeapi: { id: '198' },
    },
  },
  slowking: {
    name: ['Slowking'],
    sources: {
      ps: {},
      serebii: { id: '199' },
      pmd: { id: '0199' },
      pokeapi: { id: '199' },
    },
  },
  slowkinggalar: {
    name: ['Galarian Slowking', 'Slowking-Galar', 'Slowking-G'],
    sources: {
      ps: { id: 'slowking-galar' },
      serebii: { id: '199-g' },
      pmd: { id: '0199/0001' },
      pokeapi: { id: '10172' },
    },
  },
  misdreavus: {
    name: ['Misdreavus'],
    sources: {
      ps: { flip: true },
      serebii: { id: '200' },
      pmd: { id: '0200' },
      pokeapi: { id: '200' },
    },
  },
  unown: {
    name: ['Unown'],
    sources: {
      ps: {},
      serebii: { id: '201' },
      pmd: { id: '0201' },
      pokeapi: { id: '201' },
    },
  },
  wobbuffet: {
    name: ['Wobbuffet'],
    sources: {
      ps: {},
      serebii: { id: '202' },
      pmd: { id: '0202' },
      pokeapi: { id: '202' },
    },
  },
  girafarig: {
    name: ['Girafarig'],
    sources: {
      ps: {},
      serebii: { id: '203' },
      pmd: { id: '0203' },
      pokeapi: { id: '203' },
    },
  },
  pineco: {
    name: ['Pineco'],
    sources: {
      ps: {},
      serebii: { id: '204' },
      pmd: { id: '0204' },
      pokeapi: { id: '204' },
    },
  },
  forretress: {
    name: ['Forretress'],
    sources: {
      ps: {},
      serebii: { id: '205' },
      pmd: { id: '0205' },
      pokeapi: { id: '205' },
    },
  },
  dunsparce: {
    name: ['Dunsparce'],
    sources: {
      ps: {},
      serebii: { id: '206' },
      pmd: { id: '0206' },
      pokeapi: { id: '206' },
    },
  },
  gligar: {
    name: ['Gligar'],
    sources: {
      ps: {},
      serebii: { id: '207' },
      pmd: { id: '0207' },
      pokeapi: { id: '207' },
    },
  },
  steelix: {
    name: ['Steelix'],
    sources: {
      ps: {},
      serebii: { id: '208' },
      pmd: { id: '0208' },
      pokeapi: { id: '208' },
    },
  },
  steelixmega: {
    name: ['Mega Steelix', 'Steelix-Mega'],
    sources: {
      ps: { id: 'steelix-mega' },
      serebii: { id: '208-m' },
      pmd: { id: '0208/0001' },
      pokeapi: { id: '10072' },
    },
  },
  snubbull: {
    name: ['Snubbull'],
    sources: {
      ps: {},
      serebii: { id: '209' },
      pmd: { id: '0209' },
      pokeapi: { id: '209' },
    },
  },
  granbull: {
    name: ['Granbull'],
    sources: {
      ps: { flip: true },
      serebii: { id: '210' },
      pmd: { id: '0210' },
      pokeapi: { id: '210' },
    },
  },
  qwilfish: {
    name: ['Qwilfish'],
    sources: {
      ps: { flip: true },
      serebii: { id: '211' },
      pmd: { id: '0211' },
      pokeapi: { id: '211' },
    },
  },
  qwilfishhisui: {
    name: ['Hisuian Qwilfish', 'Qwilfish-Hisui', 'Qwilfish-H'],
    sources: {
      ps: { id: 'qwilfish-hisui' },
      serebii: { id: '211-h' },
      pmd: { id: '0211/0001' },
      pokeapi: { id: '10234' },
    },
  },
  scizor: {
    name: ['Scizor'],
    sources: {
      ps: {},
      serebii: { id: '212' },
      pmd: { id: '0212' },
      pokeapi: { id: '212' },
    },
  },
  scizormega: {
    name: ['Mega Scizor', 'Scizor-Mega'],
    sources: {
      ps: { id: 'scizor-mega' },
      serebii: { id: '212-m' },
      pmd: { id: '0212/0001' },
      pokeapi: { id: '10046' },
    },
  },
  shuckle: {
    name: ['Shuckle'],
    sources: {
      ps: { flip: true },
      serebii: { id: '213' },
      pmd: { id: '0213' },
      pokeapi: { id: '213' },
    },
  },
  heracross: {
    name: ['Heracross'],
    sources: {
      ps: {},
      serebii: { id: '214' },
      pmd: { id: '0214' },
      pokeapi: { id: '214' },
    },
  },
  heracrossmega: {
    name: ['Mega Heracross', 'Heracross-Mega'],
    sources: {
      ps: { id: 'heracross-mega' },
      serebii: { id: '214-m' },
      pmd: { id: '0214/0001' },
      pokeapi: { id: '10047' },
    },
  },
  sneasel: {
    name: ['Sneasel'],
    sources: {
      ps: {},
      serebii: { id: '215' },
      pmd: { id: '0215' },
      pokeapi: { id: '215' },
    },
  },
  sneaselhisui: {
    name: ['Hisuian Sneasel', 'Sneasel-Hisui', 'Sneasel-H'],
    sources: {
      ps: { id: 'sneasel-hisui', flip: true },
      serebii: { id: '215-h' },
      pmd: { id: '0215/0001' },
      pokeapi: { id: '10235' },
    },
  },
  teddiursa: {
    name: ['Teddiursa'],
    sources: {
      ps: {},
      serebii: { id: '216' },
      pmd: { id: '0216' },
      pokeapi: { id: '216' },
    },
  },
  ursaring: {
    name: ['Ursaring'],
    sources: {
      ps: {},
      serebii: { id: '217' },
      pmd: { id: '0217' },
      pokeapi: { id: '217' },
    },
  },
  slugma: {
    name: ['Slugma'],
    sources: {
      ps: {},
      serebii: { id: '218' },
      pmd: { id: '0218' },
      pokeapi: { id: '218' },
    },
  },
  magcargo: {
    name: ['Magcargo'],
    sources: {
      ps: {},
      serebii: { id: '219' },
      pmd: { id: '0219' },
      pokeapi: { id: '219' },
    },
  },
  swinub: {
    name: ['Swinub'],
    sources: {
      ps: {},
      serebii: { id: '220' },
      pmd: { id: '0220' },
      pokeapi: { id: '220' },
    },
  },
  piloswine: {
    name: ['Piloswine'],
    sources: {
      ps: {},
      serebii: { id: '221' },
      pmd: { id: '0221' },
      pokeapi: { id: '221' },
    },
  },
  corsola: {
    name: ['Corsola'],
    sources: {
      ps: { flip: true },
      serebii: { id: '222' },
      pmd: { id: '0222' },
      pokeapi: { id: '222' },
    },
  },
  corsolagalar: {
    name: ['Galarian Corsola', 'Corsola-Galar', 'Corsola-G'],
    sources: {
      ps: { id: 'corsola-galar', flip: true },
      serebii: { id: '222-g' },
      pmd: { id: '0222/0001' },
      pokeapi: { id: '10173' },
    },
  },
  remoraid: {
    name: ['Remoraid'],
    sources: {
      ps: {},
      serebii: { id: '223' },
      pmd: { id: '0223' },
      pokeapi: { id: '223' },
    },
  },
  octillery: {
    name: ['Octillery'],
    sources: {
      ps: {},
      serebii: { id: '224' },
      pmd: { id: '0224' },
      pokeapi: { id: '224' },
    },
  },
  delibird: {
    name: ['Delibird'],
    sources: {
      ps: {},
      serebii: { id: '225' },
      pmd: { id: '0225' },
      pokeapi: { id: '225' },
    },
  },
  mantine: {
    name: ['Mantine'],
    sources: {
      ps: {},
      serebii: { id: '226' },
      pmd: { id: '0226' },
      pokeapi: { id: '226' },
    },
  },
  skarmory: {
    name: ['Skarmory'],
    sources: {
      ps: {},
      serebii: { id: '227' },
      pmd: { id: '0227' },
      pokeapi: { id: '227' },
    },
  },
  skarmorymega: {
    name: ['Mega Skarmory', 'Skarmory-Mega'],
    sources: {
      ps: { id: 'skarmory-mega' },
      serebii: { id: '227' },
      pmd: { id: '0227/0001' },
      pokeapi: { id: '10284' },
    },
  },
  houndour: {
    name: ['Houndour'],
    sources: {
      ps: {},
      serebii: { id: '228' },
      pmd: { id: '0228' },
      pokeapi: { id: '228' },
    },
  },
  houndoom: {
    name: ['Houndoom'],
    sources: {
      ps: { flip: true },
      serebii: { id: '229' },
      pmd: { id: '0229' },
      pokeapi: { id: '229' },
    },
  },
  houndoommega: {
    name: ['Mega Houndoom', 'Houndoom-Mega'],
    sources: {
      ps: { id: 'houndoom-mega' },
      serebii: { id: '229-m' },
      pmd: { id: '0229/0001' },
      pokeapi: { id: '10048' },
    },
  },
  kingdra: {
    name: ['Kingdra'],
    sources: {
      ps: {},
      serebii: { id: '230' },
      pmd: { id: '0230' },
      pokeapi: { id: '230' },
    },
  },
  phanpy: {
    name: ['Phanpy'],
    sources: {
      ps: {},
      serebii: { id: '231' },
      pmd: { id: '0231' },
      pokeapi: { id: '231' },
    },
  },
  donphan: {
    name: ['Donphan'],
    sources: {
      ps: {},
      serebii: { id: '232' },
      pmd: { id: '0232' },
      pokeapi: { id: '232' },
    },
  },
  porygon2: {
    name: ['Porygon2'],
    sources: {
      ps: { flip: true },
      serebii: { id: '233' },
      pmd: { id: '0233' },
      pokeapi: { id: '233' },
    },
  },
  stantler: {
    name: ['Stantler'],
    sources: {
      ps: {},
      serebii: { id: '234' },
      pmd: { id: '0234' },
      pokeapi: { id: '234' },
    },
  },
  smeargle: {
    name: ['Smeargle'],
    sources: {
      ps: {},
      serebii: { id: '235' },
      pmd: { id: '0235' },
      pokeapi: { id: '235' },
    },
  },
  tyrogue: {
    name: ['Tyrogue'],
    sources: {
      ps: {},
      serebii: { id: '236' },
      pmd: { id: '0236' },
      pokeapi: { id: '236' },
    },
  },
  hitmontop: {
    name: ['Hitmontop'],
    sources: {
      ps: { flip: true },
      serebii: { id: '237' },
      pmd: { id: '0237' },
      pokeapi: { id: '237' },
    },
  },
  smoochum: {
    name: ['Smoochum'],
    sources: {
      ps: {},
      serebii: { id: '238' },
      pmd: { id: '0238' },
      pokeapi: { id: '238' },
    },
  },
  elekid: {
    name: ['Elekid'],
    sources: {
      ps: {},
      serebii: { id: '239' },
      pmd: { id: '0239' },
      pokeapi: { id: '239' },
    },
  },
  magby: {
    name: ['Magby'],
    sources: {
      ps: {},
      serebii: { id: '240' },
      pmd: { id: '0240' },
      pokeapi: { id: '240' },
    },
  },
  miltank: {
    name: ['Miltank'],
    sources: {
      ps: { flip: true },
      serebii: { id: '241' },
      pmd: { id: '0241' },
      pokeapi: { id: '241' },
    },
  },
  blissey: {
    name: ['Blissey'],
    sources: {
      ps: { flip: true },
      serebii: { id: '242' },
      pmd: { id: '0242' },
      pokeapi: { id: '242' },
    },
  },
  raikou: {
    name: ['Raikou'],
    sources: {
      ps: {},
      serebii: { id: '243' },
      pmd: { id: '0243' },
      pokeapi: { id: '243' },
    },
  },
  entei: {
    name: ['Entei'],
    sources: {
      ps: {},
      serebii: { id: '244' },
      pmd: { id: '0244' },
      pokeapi: { id: '244' },
    },
  },
  suicune: {
    name: ['Suicune'],
    sources: {
      ps: {},
      serebii: { id: '245' },
      pmd: { id: '0245' },
      pokeapi: { id: '245' },
    },
  },
  larvitar: {
    name: ['Larvitar'],
    sources: {
      ps: {},
      serebii: { id: '246' },
      pmd: { id: '0246' },
      pokeapi: { id: '246' },
    },
  },
  pupitar: {
    name: ['Pupitar'],
    sources: {
      ps: { flip: true },
      serebii: { id: '247' },
      pmd: { id: '0247' },
      pokeapi: { id: '247' },
    },
  },
  tyranitar: {
    name: ['Tyranitar'],
    sources: {
      ps: {},
      serebii: { id: '248' },
      pmd: { id: '0248' },
      pokeapi: { id: '248' },
    },
  },
  tyranitarmega: {
    name: ['Mega Tyranitar', 'Tyranitar-Mega'],
    sources: {
      ps: { id: 'tyranitar-mega' },
      serebii: { id: '248-m' },
      pmd: { id: '0248/0001' },
      pokeapi: { id: '10049' },
    },
  },
  lugia: {
    name: ['Lugia'],
    sources: {
      ps: {},
      serebii: { id: '249' },
      pmd: { id: '0249' },
      pokeapi: { id: '249' },
    },
  },
  hooh: {
    name: ['Ho-Oh'],
    sources: {
      ps: { flip: true },
      serebii: { id: '250' },
      pmd: { id: '0250' },
      pokeapi: { id: '250' },
    },
  },
  celebi: {
    name: ['Celebi'],
    sources: {
      ps: {},
      serebii: { id: '251' },
      pmd: { id: '0251' },
      pokeapi: { id: '251' },
    },
  },
  treecko: {
    name: ['Treecko'],
    sources: {
      ps: { flip: true },
      serebii: { id: '252' },
      pmd: { id: '0252' },
      pokeapi: { id: '252' },
    },
  },
  grovyle: {
    name: ['Grovyle'],
    sources: {
      ps: {},
      serebii: { id: '253' },
      pmd: { id: '0253' },
      pokeapi: { id: '253' },
    },
  },
  sceptile: {
    name: ['Sceptile'],
    sources: {
      ps: {},
      serebii: { id: '254' },
      pmd: { id: '0254' },
      pokeapi: { id: '254' },
    },
  },
  sceptilemega: {
    name: ['Mega Sceptile', 'Sceptile-Mega'],
    sources: {
      ps: { id: 'sceptile-mega' },
      serebii: { id: '254-m' },
      pmd: { id: '0254/0001' },
      pokeapi: { id: '10065' },
    },
  },
  torchic: {
    name: ['Torchic'],
    sources: {
      ps: {},
      serebii: { id: '255' },
      pmd: { id: '0255' },
      pokeapi: { id: '255' },
    },
  },
  combusken: {
    name: ['Combusken'],
    sources: {
      ps: {},
      serebii: { id: '256' },
      pmd: { id: '0256' },
      pokeapi: { id: '256' },
    },
  },
  blaziken: {
    name: ['Blaziken'],
    sources: {
      ps: { flip: true },
      serebii: { id: '257' },
      pmd: { id: '0257' },
      pokeapi: { id: '257' },
    },
  },
  blazikenmega: {
    name: ['Mega Blaziken', 'Blaziken-Mega'],
    sources: {
      ps: { id: 'blaziken-mega' },
      serebii: { id: '257-m' },
      pmd: { id: '0257/0001' },
      pokeapi: { id: '10050' },
    },
  },
  mudkip: {
    name: ['Mudkip'],
    sources: {
      ps: {},
      serebii: { id: '258' },
      pmd: { id: '0258' },
      pokeapi: { id: '258' },
    },
  },
  marshtomp: {
    name: ['Marshtomp'],
    sources: {
      ps: { flip: true },
      serebii: { id: '259' },
      pmd: { id: '0259' },
      pokeapi: { id: '259' },
    },
  },
  swampert: {
    name: ['Swampert'],
    sources: {
      ps: {},
      serebii: { id: '260' },
      pmd: { id: '0260' },
      pokeapi: { id: '260' },
    },
  },
  swampertmega: {
    name: ['Mega Swampert', 'Swampert-Mega'],
    sources: {
      ps: { id: 'swampert-mega' },
      serebii: { id: '260-m' },
      pmd: { id: '0260/0001' },
      pokeapi: { id: '10064' },
    },
  },
  poochyena: {
    name: ['Poochyena'],
    sources: {
      ps: {},
      serebii: { id: '261' },
      pmd: { id: '0261' },
      pokeapi: { id: '261' },
    },
  },
  mightyena: {
    name: ['Mightyena'],
    sources: {
      ps: {},
      serebii: { id: '262' },
      pmd: { id: '0262' },
      pokeapi: { id: '262' },
    },
  },
  zigzagoon: {
    name: ['Zigzagoon'],
    sources: {
      ps: {},
      serebii: { id: '263' },
      pmd: { id: '0263' },
      pokeapi: { id: '263' },
    },
  },
  zigzagoongalar: {
    name: ['Galarian Zigzagoon', 'Zigzagoon-Galar', 'Zigzagoon-G'],
    sources: {
      ps: { id: 'zigzagoon-galar' },
      serebii: { id: '263-g' },
      pmd: { id: '0263/0001' },
      pokeapi: { id: '10174' },
    },
  },
  linoone: {
    name: ['Linoone'],
    sources: {
      ps: {},
      serebii: { id: '264' },
      pmd: { id: '0264' },
      pokeapi: { id: '264' },
    },
  },
  linoonegalar: {
    name: ['Galarian Linoone', 'Linoone-Galar', 'Linoone-G'],
    sources: {
      ps: { id: 'linoone-galar', flip: true },
      serebii: { id: '264-g' },
      pmd: { id: '0264/0001' },
      pokeapi: { id: '10175' },
    },
  },
  wurmple: {
    name: ['Wurmple'],
    sources: {
      ps: {},
      serebii: { id: '265' },
      pmd: { id: '0265' },
      pokeapi: { id: '265' },
    },
  },
  silcoon: {
    name: ['Silcoon'],
    sources: {
      ps: {},
      serebii: { id: '266' },
      pmd: { id: '0266' },
      pokeapi: { id: '266' },
    },
  },
  beautifly: {
    name: ['Beautifly'],
    sources: {
      ps: {},
      serebii: { id: '267' },
      pmd: { id: '0267' },
      pokeapi: { id: '267' },
    },
  },
  cascoon: {
    name: ['Cascoon'],
    sources: {
      ps: { flip: true },
      serebii: { id: '268' },
      pmd: { id: '0268' },
      pokeapi: { id: '268' },
    },
  },
  dustox: {
    name: ['Dustox'],
    sources: {
      ps: { flip: true },
      serebii: { id: '269' },
      pmd: { id: '0269' },
      pokeapi: { id: '269' },
    },
  },
  lotad: {
    name: ['Lotad'],
    sources: {
      ps: {},
      serebii: { id: '270' },
      pmd: { id: '0270' },
      pokeapi: { id: '270' },
    },
  },
  lombre: {
    name: ['Lombre'],
    sources: {
      ps: {},
      serebii: { id: '271' },
      pmd: { id: '0271' },
      pokeapi: { id: '271' },
    },
  },
  ludicolo: {
    name: ['Ludicolo'],
    sources: {
      ps: {},
      serebii: { id: '272' },
      pmd: { id: '0272' },
      pokeapi: { id: '272' },
    },
  },
  seedot: {
    name: ['Seedot'],
    sources: {
      ps: {},
      serebii: { id: '273' },
      pmd: { id: '0273' },
      pokeapi: { id: '273' },
    },
  },
  nuzleaf: {
    name: ['Nuzleaf'],
    sources: {
      ps: {},
      serebii: { id: '274' },
      pmd: { id: '0274' },
      pokeapi: { id: '274' },
    },
  },
  shiftry: {
    name: ['Shiftry'],
    sources: {
      ps: {},
      serebii: { id: '275' },
      pmd: { id: '0275' },
      pokeapi: { id: '275' },
    },
  },
  taillow: {
    name: ['Taillow'],
    sources: {
      ps: {},
      serebii: { id: '276' },
      pmd: { id: '0276' },
      pokeapi: { id: '276' },
    },
  },
  swellow: {
    name: ['Swellow'],
    sources: {
      ps: {},
      serebii: { id: '277' },
      pmd: { id: '0277' },
      pokeapi: { id: '277' },
    },
  },
  wingull: {
    name: ['Wingull'],
    sources: {
      ps: {},
      serebii: { id: '278' },
      pmd: { id: '0278' },
      pokeapi: { id: '278' },
    },
  },
  pelipper: {
    name: ['Pelipper'],
    sources: {
      ps: {},
      serebii: { id: '279' },
      pmd: { id: '0279' },
      pokeapi: { id: '279' },
    },
  },
  ralts: {
    name: ['Ralts'],
    sources: {
      ps: {},
      serebii: { id: '280' },
      pmd: { id: '0280' },
      pokeapi: { id: '280' },
    },
  },
  kirlia: {
    name: ['Kirlia'],
    sources: {
      ps: {},
      serebii: { id: '281' },
      pmd: { id: '0281' },
      pokeapi: { id: '281' },
    },
  },
  gardevoir: {
    name: ['Gardevoir'],
    sources: {
      ps: { flip: true },
      serebii: { id: '282' },
      pmd: { id: '0282' },
      pokeapi: { id: '282' },
    },
  },
  gardevoirmega: {
    name: ['Mega Gardevoir', 'Gardevoir-Mega'],
    sources: {
      ps: { id: 'gardevoir-mega' },
      serebii: { id: '282-m' },
      pmd: { id: '0282/0001' },
      pokeapi: { id: '10051' },
    },
  },
  surskit: {
    name: ['Surskit'],
    sources: {
      ps: {},
      serebii: { id: '283' },
      pmd: { id: '0283' },
      pokeapi: { id: '283' },
    },
  },
  masquerain: {
    name: ['Masquerain'],
    sources: {
      ps: {},
      serebii: { id: '284' },
      pmd: { id: '0284' },
      pokeapi: { id: '284' },
    },
  },
  shroomish: {
    name: ['Shroomish'],
    sources: {
      ps: {},
      serebii: { id: '285' },
      pmd: { id: '0285' },
      pokeapi: { id: '285' },
    },
  },
  breloom: {
    name: ['Breloom'],
    sources: {
      ps: {},
      serebii: { id: '286' },
      pmd: { id: '0286' },
      pokeapi: { id: '286' },
    },
  },
  slakoth: {
    name: ['Slakoth'],
    sources: {
      ps: {},
      serebii: { id: '287' },
      pmd: { id: '0287' },
      pokeapi: { id: '287' },
    },
  },
  vigoroth: {
    name: ['Vigoroth'],
    sources: {
      ps: {},
      serebii: { id: '288' },
      pmd: { id: '0288' },
      pokeapi: { id: '288' },
    },
  },
  slaking: {
    name: ['Slaking'],
    sources: {
      ps: {},
      serebii: { id: '289' },
      pmd: { id: '0289' },
      pokeapi: { id: '289' },
    },
  },
  nincada: {
    name: ['Nincada'],
    sources: {
      ps: {},
      serebii: { id: '290' },
      pmd: { id: '0290' },
      pokeapi: { id: '290' },
    },
  },
  ninjask: {
    name: ['Ninjask'],
    sources: {
      ps: {},
      serebii: { id: '291' },
      pmd: { id: '0291' },
      pokeapi: { id: '291' },
    },
  },
  shedinja: {
    name: ['Shedinja'],
    sources: {
      ps: {},
      serebii: { id: '292' },
      pmd: { id: '0292' },
      pokeapi: { id: '292' },
    },
  },
  whismur: {
    name: ['Whismur'],
    sources: {
      ps: { flip: true },
      serebii: { id: '293' },
      pmd: { id: '0293' },
      pokeapi: { id: '293' },
    },
  },
  loudred: {
    name: ['Loudred'],
    sources: {
      ps: {},
      serebii: { id: '294' },
      pmd: { id: '0294' },
      pokeapi: { id: '294' },
    },
  },
  exploud: {
    name: ['Exploud'],
    sources: {
      ps: {},
      serebii: { id: '295' },
      pmd: { id: '0295' },
      pokeapi: { id: '295' },
    },
  },
  makuhita: {
    name: ['Makuhita'],
    sources: {
      ps: {},
      serebii: { id: '296' },
      pmd: { id: '0296' },
      pokeapi: { id: '296' },
    },
  },
  hariyama: {
    name: ['Hariyama'],
    sources: {
      ps: {},
      serebii: { id: '297' },
      pmd: { id: '0297' },
      pokeapi: { id: '297' },
    },
  },
  azurill: {
    name: ['Azurill'],
    sources: {
      ps: {},
      serebii: { id: '298' },
      pmd: { id: '0298' },
      pokeapi: { id: '298' },
    },
  },
  nosepass: {
    name: ['Nosepass'],
    sources: {
      ps: { flip: true },
      serebii: { id: '299' },
      pmd: { id: '0299' },
      pokeapi: { id: '299' },
    },
  },
  skitty: {
    name: ['Skitty'],
    sources: {
      ps: {},
      serebii: { id: '300' },
      pmd: { id: '0300' },
      pokeapi: { id: '300' },
    },
  },
  delcatty: {
    name: ['Delcatty'],
    sources: {
      ps: {},
      serebii: { id: '301' },
      pmd: { id: '0301' },
      pokeapi: { id: '301' },
    },
  },
  sableye: {
    name: ['Sableye'],
    sources: {
      ps: {},
      serebii: { id: '302' },
      pmd: { id: '0302' },
      pokeapi: { id: '302' },
    },
  },
  sableyemega: {
    name: ['Mega Sableye', 'Sableye-Mega'],
    sources: {
      ps: { id: 'sableye-mega' },
      serebii: { id: '302-m' },
      pmd: { id: '0302/0001' },
      pokeapi: { id: '10066' },
    },
  },
  mawile: {
    name: ['Mawile'],
    sources: {
      ps: { flip: true },
      serebii: { id: '303' },
      pmd: { id: '0303' },
      pokeapi: { id: '303' },
    },
  },
  mawilemega: {
    name: ['Mega Mawile', 'Mawile-Mega'],
    sources: {
      ps: { id: 'mawile-mega' },
      serebii: { id: '303-m' },
      pmd: { id: '0303/0001' },
      pokeapi: { id: '10052' },
    },
  },
  aron: {
    name: ['Aron'],
    sources: {
      ps: {},
      serebii: { id: '304' },
      pmd: { id: '0304' },
      pokeapi: { id: '304' },
    },
  },
  lairon: {
    name: ['Lairon'],
    sources: {
      ps: {},
      serebii: { id: '305' },
      pmd: { id: '0305' },
      pokeapi: { id: '305' },
    },
  },
  aggron: {
    name: ['Aggron'],
    sources: {
      ps: {},
      serebii: { id: '306' },
      pmd: { id: '0306' },
      pokeapi: { id: '306' },
    },
  },
  aggronmega: {
    name: ['Mega Aggron', 'Aggron-Mega'],
    sources: {
      ps: { id: 'aggron-mega' },
      serebii: { id: '306-m' },
      pmd: { id: '0306/0001' },
      pokeapi: { id: '10053' },
    },
  },
  meditite: {
    name: ['Meditite'],
    sources: {
      ps: {},
      serebii: { id: '307' },
      pmd: { id: '0307' },
      pokeapi: { id: '307' },
    },
  },
  medicham: {
    name: ['Medicham'],
    sources: {
      ps: {},
      serebii: { id: '308' },
      pmd: { id: '0308' },
      pokeapi: { id: '308' },
    },
  },
  medichammega: {
    name: ['Mega Medicham', 'Medicham-Mega'],
    sources: {
      ps: { id: 'medicham-mega' },
      serebii: { id: '308-m' },
      pmd: { id: '0308/0001' },
      pokeapi: { id: '10054' },
    },
  },
  electrike: {
    name: ['Electrike'],
    sources: {
      ps: {},
      serebii: { id: '309' },
      pmd: { id: '0309' },
      pokeapi: { id: '309' },
    },
  },
  manectric: {
    name: ['Manectric'],
    sources: {
      ps: {},
      serebii: { id: '310' },
      pmd: { id: '0310' },
      pokeapi: { id: '310' },
    },
  },
  manectricmega: {
    name: ['Mega Manectric', 'Manectric-Mega'],
    sources: {
      ps: { id: 'manectric-mega' },
      serebii: { id: '310-m' },
      pmd: { id: '0310/0001' },
      pokeapi: { id: '10055' },
    },
  },
  plusle: {
    name: ['Plusle'],
    sources: {
      ps: {},
      serebii: { id: '311' },
      pmd: { id: '0311' },
      pokeapi: { id: '311' },
    },
  },
  minun: {
    name: ['Minun'],
    sources: {
      ps: {},
      serebii: { id: '312' },
      pmd: { id: '0312' },
      pokeapi: { id: '312' },
    },
  },
  volbeat: {
    name: ['Volbeat'],
    sources: {
      ps: {},
      serebii: { id: '313' },
      pmd: { id: '0313' },
      pokeapi: { id: '313' },
    },
  },
  illumise: {
    name: ['Illumise'],
    sources: {
      ps: {},
      serebii: { id: '314' },
      pmd: { id: '0314' },
      pokeapi: { id: '314' },
    },
  },
  roselia: {
    name: ['Roselia'],
    sources: {
      ps: {},
      serebii: { id: '315' },
      pmd: { id: '0315' },
      pokeapi: { id: '315' },
    },
  },
  gulpin: {
    name: ['Gulpin'],
    sources: {
      ps: {},
      serebii: { id: '316' },
      pmd: { id: '0316' },
      pokeapi: { id: '316' },
    },
  },
  swalot: {
    name: ['Swalot'],
    sources: {
      ps: { flip: true },
      serebii: { id: '317' },
      pmd: { id: '0317' },
      pokeapi: { id: '317' },
    },
  },
  carvanha: {
    name: ['Carvanha'],
    sources: {
      ps: {},
      serebii: { id: '318' },
      pmd: { id: '0318' },
      pokeapi: { id: '318' },
    },
  },
  sharpedo: {
    name: ['Sharpedo'],
    sources: {
      ps: {},
      serebii: { id: '319' },
      pmd: { id: '0319' },
      pokeapi: { id: '319' },
    },
  },
  sharpedomega: {
    name: ['Mega Sharpedo', 'Sharpedo-Mega'],
    sources: {
      ps: { id: 'sharpedo-mega' },
      serebii: { id: '319-m' },
      pmd: { id: '0319/0001' },
      pokeapi: { id: '10070' },
    },
  },
  wailmer: {
    name: ['Wailmer'],
    sources: {
      ps: {},
      serebii: { id: '320' },
      pmd: { id: '0320' },
      pokeapi: { id: '320' },
    },
  },
  wailord: {
    name: ['Wailord'],
    sources: {
      ps: {},
      serebii: { id: '321' },
      pmd: { id: '0321' },
      pokeapi: { id: '321' },
    },
  },
  numel: {
    name: ['Numel'],
    sources: {
      ps: {},
      serebii: { id: '322' },
      pmd: { id: '0322' },
      pokeapi: { id: '322' },
    },
  },
  camerupt: {
    name: ['Camerupt'],
    sources: {
      ps: {},
      serebii: { id: '323' },
      pmd: { id: '0323' },
      pokeapi: { id: '323' },
    },
  },
  cameruptmega: {
    name: ['Mega Camerupt', 'Camerupt-Mega'],
    sources: {
      ps: { id: 'camerupt-mega' },
      serebii: { id: '323-m' },
      pmd: { id: '0323/0001' },
      pokeapi: { id: '10087' },
    },
  },
  torkoal: {
    name: ['Torkoal'],
    sources: {
      ps: {},
      serebii: { id: '324' },
      pmd: { id: '0324' },
      pokeapi: { id: '324' },
    },
  },
  spoink: {
    name: ['Spoink'],
    sources: {
      ps: {},
      serebii: { id: '325' },
      pmd: { id: '0325' },
      pokeapi: { id: '325' },
    },
  },
  grumpig: {
    name: ['Grumpig'],
    sources: {
      ps: {},
      serebii: { id: '326' },
      pmd: { id: '0326' },
      pokeapi: { id: '326' },
    },
  },
  spinda: {
    name: ['Spinda'],
    sources: {
      ps: {},
      serebii: { id: '327' },
      pmd: { id: '0327' },
      pokeapi: { id: '327' },
    },
  },
  trapinch: {
    name: ['Trapinch'],
    sources: {
      ps: {},
      serebii: { id: '328' },
      pmd: { id: '0328' },
      pokeapi: { id: '328' },
    },
  },
  vibrava: {
    name: ['Vibrava'],
    sources: {
      ps: {},
      serebii: { id: '329' },
      pmd: { id: '0329' },
      pokeapi: { id: '329' },
    },
  },
  flygon: {
    name: ['Flygon'],
    sources: {
      ps: {},
      serebii: { id: '330' },
      pmd: { id: '0330' },
      pokeapi: { id: '330' },
    },
  },
  cacnea: {
    name: ['Cacnea'],
    sources: {
      ps: {},
      serebii: { id: '331' },
      pmd: { id: '0331' },
      pokeapi: { id: '331' },
    },
  },
  cacturne: {
    name: ['Cacturne'],
    sources: {
      ps: {},
      serebii: { id: '332' },
      pmd: { id: '0332' },
      pokeapi: { id: '332' },
    },
  },
  swablu: {
    name: ['Swablu'],
    sources: {
      ps: {},
      serebii: { id: '333' },
      pmd: { id: '0333' },
      pokeapi: { id: '333' },
    },
  },
  altaria: {
    name: ['Altaria'],
    sources: {
      ps: {},
      serebii: { id: '334' },
      pmd: { id: '0334' },
      pokeapi: { id: '334' },
    },
  },
  altariamega: {
    name: ['Mega Altaria', 'Altaria-Mega'],
    sources: {
      ps: { id: 'altaria-mega' },
      serebii: { id: '334-m' },
      pmd: { id: '0334/0001' },
      pokeapi: { id: '10067' },
    },
  },
  zangoose: {
    name: ['Zangoose'],
    sources: {
      ps: {},
      serebii: { id: '335' },
      pmd: { id: '0335' },
      pokeapi: { id: '335' },
    },
  },
  seviper: {
    name: ['Seviper'],
    sources: {
      ps: {},
      serebii: { id: '336' },
      pmd: { id: '0336' },
      pokeapi: { id: '336' },
    },
  },
  lunatone: {
    name: ['Lunatone'],
    sources: {
      ps: {},
      serebii: { id: '337' },
      pmd: { id: '0337' },
      pokeapi: { id: '337' },
    },
  },
  solrock: {
    name: ['Solrock'],
    sources: {
      ps: {},
      serebii: { id: '338' },
      pmd: { id: '0338' },
      pokeapi: { id: '338' },
    },
  },
  barboach: {
    name: ['Barboach'],
    sources: {
      ps: {},
      serebii: { id: '339' },
      pmd: { id: '0339' },
      pokeapi: { id: '339' },
    },
  },
  whiscash: {
    name: ['Whiscash'],
    sources: {
      ps: {},
      serebii: { id: '340' },
      pmd: { id: '0340' },
      pokeapi: { id: '340' },
    },
  },
  corphish: {
    name: ['Corphish'],
    sources: {
      ps: {},
      serebii: { id: '341' },
      pmd: { id: '0341' },
      pokeapi: { id: '341' },
    },
  },
  crawdaunt: {
    name: ['Crawdaunt'],
    sources: {
      ps: {},
      serebii: { id: '342' },
      pmd: { id: '0342' },
      pokeapi: { id: '342' },
    },
  },
  baltoy: {
    name: ['Baltoy'],
    sources: {
      ps: {},
      serebii: { id: '343' },
      pmd: { id: '0343' },
      pokeapi: { id: '343' },
    },
  },
  claydol: {
    name: ['Claydol'],
    sources: {
      ps: {},
      serebii: { id: '344' },
      pmd: { id: '0344' },
      pokeapi: { id: '344' },
    },
  },
  lileep: {
    name: ['Lileep'],
    sources: {
      ps: {},
      serebii: { id: '345' },
      pmd: { id: '0345' },
      pokeapi: { id: '345' },
    },
  },
  cradily: {
    name: ['Cradily'],
    sources: {
      ps: {},
      serebii: { id: '346' },
      pmd: { id: '0346' },
      pokeapi: { id: '346' },
    },
  },
  anorith: {
    name: ['Anorith'],
    sources: {
      ps: {},
      serebii: { id: '347' },
      pmd: { id: '0347' },
      pokeapi: { id: '347' },
    },
  },
  armaldo: {
    name: ['Armaldo'],
    sources: {
      ps: {},
      serebii: { id: '348' },
      pmd: { id: '0348' },
      pokeapi: { id: '348' },
    },
  },
  feebas: {
    name: ['Feebas'],
    sources: {
      ps: {},
      serebii: { id: '349' },
      pmd: { id: '0349' },
      pokeapi: { id: '349' },
    },
  },
  milotic: {
    name: ['Milotic'],
    sources: {
      ps: {},
      serebii: { id: '350' },
      pmd: { id: '0350' },
      pokeapi: { id: '350' },
    },
  },
  castform: {
    name: ['Castform'],
    sources: {
      ps: {},
      serebii: { id: '351' },
      pmd: { id: '0351' },
      pokeapi: { id: '351' },
    },
  },
  castformsunny: {
    name: ['Castform-Sunny'],
    sources: {
      ps: { id: 'castform-sunny', flip: true },
      serebii: { id: '351-s' },
      pmd: { id: '0351/0001' },
      pokeapi: { id: '10013' },
    },
  },
  castformrainy: {
    name: ['Castform-Rainy'],
    sources: {
      ps: { id: 'castform-rainy' },
      serebii: { id: '351-r' },
      pmd: { id: '0351/0002' },
      pokeapi: { id: '10014' },
    },
  },
  castformsnowy: {
    name: ['Castform-Snowy'],
    sources: {
      ps: { id: 'castform-snowy' },
      serebii: { id: '351-i' },
      pmd: { id: '0351/0003' },
      pokeapi: { id: '10015' },
    },
  },
  kecleon: {
    name: ['Kecleon'],
    sources: {
      ps: {},
      serebii: { id: '352' },
      pmd: { id: '0352' },
      pokeapi: { id: '352' },
    },
  },
  shuppet: {
    name: ['Shuppet'],
    sources: {
      ps: { flip: true },
      serebii: { id: '353' },
      pmd: { id: '0353' },
      pokeapi: { id: '353' },
    },
  },
  banette: {
    name: ['Banette'],
    sources: {
      ps: {},
      serebii: { id: '354' },
      pmd: { id: '0354' },
      pokeapi: { id: '354' },
    },
  },
  banettemega: {
    name: ['Mega Banette', 'Banette-Mega'],
    sources: {
      ps: { id: 'banette-mega' },
      serebii: { id: '354-m' },
      pmd: { id: '0354/0001' },
      pokeapi: { id: '10056' },
    },
  },
  duskull: {
    name: ['Duskull'],
    sources: {
      ps: {},
      serebii: { id: '355' },
      pmd: { id: '0355' },
      pokeapi: { id: '355' },
    },
  },
  dusclops: {
    name: ['Dusclops'],
    sources: {
      ps: {},
      serebii: { id: '356' },
      pmd: { id: '0356' },
      pokeapi: { id: '356' },
    },
  },
  tropius: {
    name: ['Tropius'],
    sources: {
      ps: {},
      serebii: { id: '357' },
      pmd: { id: '0357' },
      pokeapi: { id: '357' },
    },
  },
  chimecho: {
    name: ['Chimecho'],
    sources: {
      ps: {},
      serebii: { id: '358' },
      pmd: { id: '0358' },
      pokeapi: { id: '358' },
    },
  },
  chimechomega: {
    name: ['Mega Chimecho', 'Chimecho-Mega'],
    sources: {
      ps: { id: 'chimecho-mega' },
      serebii: { id: '358' },
      pmd: { id: '0358/0001' },
      pokeapi: { id: '10306' },
    },
  },
  absol: {
    name: ['Absol'],
    sources: {
      ps: {},
      serebii: { id: '359' },
      pmd: { id: '0359' },
      pokeapi: { id: '359' },
    },
  },
  absolmega: {
    name: ['Mega Absol', 'Absol-Mega'],
    sources: {
      ps: { id: 'absol-mega' },
      serebii: { id: '359-m' },
      pmd: { id: '0359/0001' },
      pokeapi: { id: '10057' },
    },
  },
  absolmegaz: {
    name: ['Mega Absol Z', 'Absol-Mega-Z'],
    sources: {
      ps: { id: 'absol-megaz' },
      serebii: { id: '359-mz' },
      pmd: { id: '0359/0002' },
      pokeapi: { id: '10307' },
    },
  },
  wynaut: {
    name: ['Wynaut'],
    sources: {
      ps: {},
      serebii: { id: '360' },
      pmd: { id: '0360' },
      pokeapi: { id: '360' },
    },
  },
  snorunt: {
    name: ['Snorunt'],
    sources: {
      ps: {},
      serebii: { id: '361' },
      pmd: { id: '0361' },
      pokeapi: { id: '361' },
    },
  },
  glalie: {
    name: ['Glalie'],
    sources: {
      ps: {},
      serebii: { id: '362' },
      pmd: { id: '0362' },
      pokeapi: { id: '362' },
    },
  },
  glaliemega: {
    name: ['Mega Glalie', 'Glalie-Mega'],
    sources: {
      ps: { id: 'glalie-mega', flip: true },
      serebii: { id: '362-m' },
      pmd: { id: '0362/0001' },
      pokeapi: { id: '10074' },
    },
  },
  spheal: {
    name: ['Spheal'],
    sources: {
      ps: {},
      serebii: { id: '363' },
      pmd: { id: '0363' },
      pokeapi: { id: '363' },
    },
  },
  sealeo: {
    name: ['Sealeo'],
    sources: {
      ps: { flip: true },
      serebii: { id: '364' },
      pmd: { id: '0364' },
      pokeapi: { id: '364' },
    },
  },
  walrein: {
    name: ['Walrein'],
    sources: {
      ps: {},
      serebii: { id: '365' },
      pmd: { id: '0365' },
      pokeapi: { id: '365' },
    },
  },
  clamperl: {
    name: ['Clamperl'],
    sources: {
      ps: {},
      serebii: { id: '366' },
      pmd: { id: '0366' },
      pokeapi: { id: '366' },
    },
  },
  huntail: {
    name: ['Huntail'],
    sources: {
      ps: {},
      serebii: { id: '367' },
      pmd: { id: '0367' },
      pokeapi: { id: '367' },
    },
  },
  gorebyss: {
    name: ['Gorebyss'],
    sources: {
      ps: {},
      serebii: { id: '368' },
      pmd: { id: '0368' },
      pokeapi: { id: '368' },
    },
  },
  relicanth: {
    name: ['Relicanth'],
    sources: {
      ps: {},
      serebii: { id: '369' },
      pmd: { id: '0369' },
      pokeapi: { id: '369' },
    },
  },
  luvdisc: {
    name: ['Luvdisc'],
    sources: {
      ps: {},
      serebii: { id: '370' },
      pmd: { id: '0370' },
      pokeapi: { id: '370' },
    },
  },
  bagon: {
    name: ['Bagon'],
    sources: {
      ps: {},
      serebii: { id: '371' },
      pmd: { id: '0371' },
      pokeapi: { id: '371' },
    },
  },
  shelgon: {
    name: ['Shelgon'],
    sources: {
      ps: {},
      serebii: { id: '372' },
      pmd: { id: '0372' },
      pokeapi: { id: '372' },
    },
  },
  salamence: {
    name: ['Salamence'],
    sources: {
      ps: {},
      serebii: { id: '373' },
      pmd: { id: '0373' },
      pokeapi: { id: '373' },
    },
  },
  salamencemega: {
    name: ['Mega Salamence', 'Salamence-Mega'],
    sources: {
      ps: { id: 'salamence-mega' },
      serebii: { id: '373-m' },
      pmd: { id: '0373/0001' },
      pokeapi: { id: '10089' },
    },
  },
  beldum: {
    name: ['Beldum'],
    sources: {
      ps: {},
      serebii: { id: '374' },
      pmd: { id: '0374' },
      pokeapi: { id: '374' },
    },
  },
  metang: {
    name: ['Metang'],
    sources: {
      ps: {},
      serebii: { id: '375' },
      pmd: { id: '0375' },
      pokeapi: { id: '375' },
    },
  },
  metagross: {
    name: ['Metagross'],
    sources: {
      ps: {},
      serebii: { id: '376' },
      pmd: { id: '0376' },
      pokeapi: { id: '376' },
    },
  },
  metagrossmega: {
    name: ['Mega Metagross', 'Metagross-Mega'],
    sources: {
      ps: { id: 'metagross-mega' },
      serebii: { id: '376-m' },
      pmd: { id: '0376/0001' },
      pokeapi: { id: '10076' },
    },
  },
  regirock: {
    name: ['Regirock'],
    sources: {
      ps: {},
      serebii: { id: '377' },
      pmd: { id: '0377' },
      pokeapi: { id: '377' },
    },
  },
  regice: {
    name: ['Regice'],
    sources: {
      ps: { flip: true },
      serebii: { id: '378' },
      pmd: { id: '0378' },
      pokeapi: { id: '378' },
    },
  },
  registeel: {
    name: ['Registeel'],
    sources: {
      ps: {},
      serebii: { id: '379' },
      pmd: { id: '0379' },
      pokeapi: { id: '379' },
    },
  },
  latias: {
    name: ['Latias'],
    sources: {
      ps: {},
      serebii: { id: '380' },
      pmd: { id: '0380' },
      pokeapi: { id: '380' },
    },
  },
  latiasmega: {
    name: ['Mega Latias', 'Latias-Mega'],
    sources: {
      ps: { id: 'latias-mega', flip: true },
      serebii: { id: '380-m' },
      pmd: { id: '0380/0001' },
      pokeapi: { id: '10062' },
    },
  },
  latios: {
    name: ['Latios'],
    sources: {
      ps: {},
      serebii: { id: '381' },
      pmd: { id: '0381' },
      pokeapi: { id: '381' },
    },
  },
  latiosmega: {
    name: ['Mega Latios', 'Latios-Mega'],
    sources: {
      ps: { id: 'latios-mega' },
      serebii: { id: '381-m' },
      pmd: { id: '0381/0001' },
      pokeapi: { id: '10063' },
    },
  },
  kyogre: {
    name: ['Kyogre'],
    sources: {
      ps: {},
      serebii: { id: '382' },
      pmd: { id: '0382' },
      pokeapi: { id: '382' },
    },
  },
  kyogreprimal: {
    name: ['Primal Kyogre', 'Kyogre-Primal'],
    sources: {
      ps: { id: 'kyogre-primal' },
      serebii: { id: '382-p' },
      pmd: { id: '0382/0001' },
      pokeapi: { id: '10077' },
    },
  },
  groudon: {
    name: ['Groudon'],
    sources: {
      ps: { flip: true },
      serebii: { id: '383' },
      pmd: { id: '0383' },
      pokeapi: { id: '383' },
    },
  },
  groudonprimal: {
    name: ['Primal Groudon', 'Groudon-Primal'],
    sources: {
      ps: { id: 'groudon-primal', flip: true },
      serebii: { id: '383-p' },
      pmd: { id: '0383/0001' },
      pokeapi: { id: '10078' },
    },
  },
  rayquaza: {
    name: ['Rayquaza'],
    sources: {
      ps: {},
      serebii: { id: '384' },
      pmd: { id: '0384' },
      pokeapi: { id: '384' },
    },
  },
  rayquazamega: {
    name: ['Mega Rayquaza', 'Rayquaza-Mega'],
    sources: {
      ps: { id: 'rayquaza-mega' },
      serebii: { id: '384-m' },
      pmd: { id: '0384/0001' },
      pokeapi: { id: '10079' },
    },
  },
  jirachi: {
    name: ['Jirachi'],
    sources: {
      ps: {},
      serebii: { id: '385' },
      pmd: { id: '0385' },
      pokeapi: { id: '385' },
    },
  },
  deoxys: {
    name: ['Deoxys'],
    sources: {
      ps: {},
      serebii: { id: '386' },
      pmd: { id: '0386' },
      pokeapi: { id: '386' },
    },
  },
  deoxysattack: {
    name: ['Deoxys-Attack'],
    sources: {
      ps: { id: 'deoxys-attack' },
      serebii: { id: '386-a' },
      pmd: { id: '0386/0001' },
      pokeapi: { id: '10001' },
    },
  },
  deoxysdefense: {
    name: ['Deoxys-Defense'],
    sources: {
      ps: { id: 'deoxys-defense', flip: true },
      serebii: { id: '386-d' },
      pmd: { id: '0386/0002' },
      pokeapi: { id: '10002' },
    },
  },
  deoxysspeed: {
    name: ['Deoxys-Speed'],
    sources: {
      ps: { id: 'deoxys-speed' },
      serebii: { id: '386-s' },
      pmd: { id: '0386/0003' },
      pokeapi: { id: '10003' },
    },
  },
  turtwig: {
    name: ['Turtwig'],
    sources: {
      ps: {},
      serebii: { id: '387' },
      pmd: { id: '0387' },
      pokeapi: { id: '387' },
    },
  },
  grotle: {
    name: ['Grotle'],
    sources: {
      ps: {},
      serebii: { id: '388' },
      pmd: { id: '0388' },
      pokeapi: { id: '388' },
    },
  },
  torterra: {
    name: ['Torterra'],
    sources: {
      ps: {},
      serebii: { id: '389' },
      pmd: { id: '0389' },
      pokeapi: { id: '389' },
    },
  },
  chimchar: {
    name: ['Chimchar'],
    sources: {
      ps: {},
      serebii: { id: '390' },
      pmd: { id: '0390' },
      pokeapi: { id: '390' },
    },
  },
  monferno: {
    name: ['Monferno'],
    sources: {
      ps: {},
      serebii: { id: '391' },
      pmd: { id: '0391' },
      pokeapi: { id: '391' },
    },
  },
  infernape: {
    name: ['Infernape'],
    sources: {
      ps: {},
      serebii: { id: '392' },
      pmd: { id: '0392' },
      pokeapi: { id: '392' },
    },
  },
  piplup: {
    name: ['Piplup'],
    sources: {
      ps: { flip: true },
      serebii: { id: '393' },
      pmd: { id: '0393' },
      pokeapi: { id: '393' },
    },
  },
  prinplup: {
    name: ['Prinplup'],
    sources: {
      ps: {},
      serebii: { id: '394' },
      pmd: { id: '0394' },
      pokeapi: { id: '394' },
    },
  },
  empoleon: {
    name: ['Empoleon'],
    sources: {
      ps: {},
      serebii: { id: '395' },
      pmd: { id: '0395' },
      pokeapi: { id: '395' },
    },
  },
  starly: {
    name: ['Starly'],
    sources: {
      ps: {},
      serebii: { id: '396' },
      pmd: { id: '0396' },
      pokeapi: { id: '396' },
    },
  },
  staravia: {
    name: ['Staravia'],
    sources: {
      ps: {},
      serebii: { id: '397' },
      pmd: { id: '0397' },
      pokeapi: { id: '397' },
    },
  },
  staraptor: {
    name: ['Staraptor'],
    sources: {
      ps: {},
      serebii: { id: '398' },
      pmd: { id: '0398' },
      pokeapi: { id: '398' },
    },
  },
  staraptormega: {
    name: ['Mega Staraptor', 'Staraptor-Mega'],
    sources: {
      ps: { id: 'staraptor-mega' },
      serebii: { id: '398' },
      pmd: { id: '0398/0001' },
      pokeapi: { id: '10308' },
    },
  },
  bidoof: {
    name: ['Bidoof'],
    sources: {
      ps: {},
      serebii: { id: '399' },
      pmd: { id: '0399' },
      pokeapi: { id: '399' },
    },
  },
  bibarel: {
    name: ['Bibarel'],
    sources: {
      ps: {},
      serebii: { id: '400' },
      pmd: { id: '0400' },
      pokeapi: { id: '400' },
    },
  },
  kricketot: {
    name: ['Kricketot'],
    sources: {
      ps: {},
      serebii: { id: '401' },
      pmd: { id: '0401' },
      pokeapi: { id: '401' },
    },
  },
  kricketune: {
    name: ['Kricketune'],
    sources: {
      ps: {},
      serebii: { id: '402' },
      pmd: { id: '0402' },
      pokeapi: { id: '402' },
    },
  },
  shinx: {
    name: ['Shinx'],
    sources: {
      ps: { flip: true },
      serebii: { id: '403' },
      pmd: { id: '0403' },
      pokeapi: { id: '403' },
    },
  },
  luxio: {
    name: ['Luxio'],
    sources: {
      ps: {},
      serebii: { id: '404' },
      pmd: { id: '0404' },
      pokeapi: { id: '404' },
    },
  },
  luxray: {
    name: ['Luxray'],
    sources: {
      ps: {},
      serebii: { id: '405' },
      pmd: { id: '0405' },
      pokeapi: { id: '405' },
    },
  },
  budew: {
    name: ['Budew'],
    sources: {
      ps: {},
      serebii: { id: '406' },
      pmd: { id: '0406' },
      pokeapi: { id: '406' },
    },
  },
  roserade: {
    name: ['Roserade'],
    sources: {
      ps: {},
      serebii: { id: '407' },
      pmd: { id: '0407' },
      pokeapi: { id: '407' },
    },
  },
  cranidos: {
    name: ['Cranidos'],
    sources: {
      ps: { flip: true },
      serebii: { id: '408' },
      pmd: { id: '0408' },
      pokeapi: { id: '408' },
    },
  },
  rampardos: {
    name: ['Rampardos'],
    sources: {
      ps: { flip: true },
      serebii: { id: '409' },
      pmd: { id: '0409' },
      pokeapi: { id: '409' },
    },
  },
  shieldon: {
    name: ['Shieldon'],
    sources: {
      ps: {},
      serebii: { id: '410' },
      pmd: { id: '0410' },
      pokeapi: { id: '410' },
    },
  },
  bastiodon: {
    name: ['Bastiodon'],
    sources: {
      ps: {},
      serebii: { id: '411' },
      pmd: { id: '0411' },
      pokeapi: { id: '411' },
    },
  },
  burmy: {
    name: ['Burmy'],
    sources: {
      ps: {},
      serebii: { id: '412' },
      pmd: { id: '0412' },
      pokeapi: { id: '412' },
    },
  },
  wormadam: {
    name: ['Wormadam'],
    sources: {
      ps: {},
      serebii: { id: '413' },
      pmd: { id: '0413' },
      pokeapi: { id: '413' },
    },
  },
  wormadamsandy: {
    name: ['Wormadam-Sandy'],
    sources: {
      ps: { id: 'wormadam-sandy', flip: true },
      serebii: { id: '413-s' },
      pmd: { id: '0413/0001' },
      pokeapi: { id: '10004' },
    },
  },
  wormadamtrash: {
    name: ['Wormadam-Trash'],
    sources: {
      ps: { id: 'wormadam-trash' },
      serebii: { id: '413-t' },
      pmd: { id: '0413/0002' },
      pokeapi: { id: '10005' },
    },
  },
  mothim: {
    name: ['Mothim'],
    sources: {
      ps: {},
      serebii: { id: '414' },
      pmd: { id: '0414' },
      pokeapi: { id: '414' },
    },
  },
  combee: {
    name: ['Combee'],
    sources: {
      ps: {},
      serebii: { id: '415' },
      pmd: { id: '0415' },
      pokeapi: { id: '415' },
    },
  },
  vespiquen: {
    name: ['Vespiquen'],
    sources: {
      ps: {},
      serebii: { id: '416' },
      pmd: { id: '0416' },
      pokeapi: { id: '416' },
    },
  },
  pachirisu: {
    name: ['Pachirisu'],
    sources: {
      ps: {},
      serebii: { id: '417' },
      pmd: { id: '0417' },
      pokeapi: { id: '417' },
    },
  },
  buizel: {
    name: ['Buizel'],
    sources: {
      ps: {},
      serebii: { id: '418' },
      pmd: { id: '0418' },
      pokeapi: { id: '418' },
    },
  },
  floatzel: {
    name: ['Floatzel'],
    sources: {
      ps: {},
      serebii: { id: '419' },
      pmd: { id: '0419' },
      pokeapi: { id: '419' },
    },
  },
  cherubi: {
    name: ['Cherubi'],
    sources: {
      ps: {},
      serebii: { id: '420' },
      pmd: { id: '0420' },
      pokeapi: { id: '420' },
    },
  },
  cherrim: {
    name: ['Cherrim'],
    sources: {
      ps: {},
      serebii: { id: '421' },
      pmd: { id: '0421' },
      pokeapi: { id: '421' },
    },
  },
  cherrimsunshine: {
    name: ['Cherrim-Sunshine'],
    sources: {
      ps: { id: 'cherrim-sunshine' },
      serebii: { id: '421-s' },
      pmd: { id: '0421/0001' },
      pokeapi: { id: '421' },
    },
  },
  shellos: {
    name: ['Shellos'],
    sources: {
      ps: {},
      serebii: { id: '422' },
      pmd: { id: '0422' },
      pokeapi: { id: '422' },
    },
  },
  gastrodon: {
    name: ['Gastrodon'],
    sources: {
      ps: {},
      serebii: { id: '423' },
      pmd: { id: '0423' },
      pokeapi: { id: '423' },
    },
  },
  ambipom: {
    name: ['Ambipom'],
    sources: {
      ps: {},
      serebii: { id: '424' },
      pmd: { id: '0424' },
      pokeapi: { id: '424' },
    },
  },
  drifloon: {
    name: ['Drifloon'],
    sources: {
      ps: {},
      serebii: { id: '425' },
      pmd: { id: '0425' },
      pokeapi: { id: '425' },
    },
  },
  drifblim: {
    name: ['Drifblim'],
    sources: {
      ps: {},
      serebii: { id: '426' },
      pmd: { id: '0426' },
      pokeapi: { id: '426' },
    },
  },
  buneary: {
    name: ['Buneary'],
    sources: {
      ps: {},
      serebii: { id: '427' },
      pmd: { id: '0427' },
      pokeapi: { id: '427' },
    },
  },
  lopunny: {
    name: ['Lopunny'],
    sources: {
      ps: {},
      serebii: { id: '428' },
      pmd: { id: '0428' },
      pokeapi: { id: '428' },
    },
  },
  lopunnymega: {
    name: ['Mega Lopunny', 'Lopunny-Mega'],
    sources: {
      ps: { id: 'lopunny-mega' },
      serebii: { id: '428-m' },
      pmd: { id: '0428/0001' },
      pokeapi: { id: '10088' },
    },
  },
  mismagius: {
    name: ['Mismagius'],
    sources: {
      ps: {},
      serebii: { id: '429' },
      pmd: { id: '0429' },
      pokeapi: { id: '429' },
    },
  },
  honchkrow: {
    name: ['Honchkrow'],
    sources: {
      ps: {},
      serebii: { id: '430' },
      pmd: { id: '0430' },
      pokeapi: { id: '430' },
    },
  },
  glameow: {
    name: ['Glameow'],
    sources: {
      ps: {},
      serebii: { id: '431' },
      pmd: { id: '0431' },
      pokeapi: { id: '431' },
    },
  },
  purugly: {
    name: ['Purugly'],
    sources: {
      ps: {},
      serebii: { id: '432' },
      pmd: { id: '0432' },
      pokeapi: { id: '432' },
    },
  },
  chingling: {
    name: ['Chingling'],
    sources: {
      ps: {},
      serebii: { id: '433' },
      pmd: { id: '0433' },
      pokeapi: { id: '433' },
    },
  },
  stunky: {
    name: ['Stunky'],
    sources: {
      ps: {},
      serebii: { id: '434' },
      pmd: { id: '0434' },
      pokeapi: { id: '434' },
    },
  },
  skuntank: {
    name: ['Skuntank'],
    sources: {
      ps: {},
      serebii: { id: '435' },
      pmd: { id: '0435' },
      pokeapi: { id: '435' },
    },
  },
  bronzor: {
    name: ['Bronzor'],
    sources: {
      ps: {},
      serebii: { id: '436' },
      pmd: { id: '0436' },
      pokeapi: { id: '436' },
    },
  },
  bronzong: {
    name: ['Bronzong'],
    sources: {
      ps: {},
      serebii: { id: '437' },
      pmd: { id: '0437' },
      pokeapi: { id: '437' },
    },
  },
  bonsly: {
    name: ['Bonsly'],
    sources: {
      ps: {},
      serebii: { id: '438' },
      pmd: { id: '0438' },
      pokeapi: { id: '438' },
    },
  },
  mimejr: {
    name: ['Mime Jr.'],
    sources: {
      ps: {},
      serebii: { id: '439' },
      pmd: { id: '0439' },
      pokeapi: { id: '439' },
    },
  },
  happiny: {
    name: ['Happiny'],
    sources: {
      ps: {},
      serebii: { id: '440' },
      pmd: { id: '0440' },
      pokeapi: { id: '440' },
    },
  },
  chatot: {
    name: ['Chatot'],
    sources: {
      ps: {},
      serebii: { id: '441' },
      pmd: { id: '0441' },
      pokeapi: { id: '441' },
    },
  },
  spiritomb: {
    name: ['Spiritomb'],
    sources: {
      ps: {},
      serebii: { id: '442' },
      pmd: { id: '0442' },
      pokeapi: { id: '442' },
    },
  },
  gible: {
    name: ['Gible'],
    sources: {
      ps: {},
      serebii: { id: '443' },
      pmd: { id: '0443' },
      pokeapi: { id: '443' },
    },
  },
  gabite: {
    name: ['Gabite'],
    sources: {
      ps: {},
      serebii: { id: '444' },
      pmd: { id: '0444' },
      pokeapi: { id: '444' },
    },
  },
  garchomp: {
    name: ['Garchomp'],
    sources: {
      ps: {},
      serebii: { id: '445' },
      pmd: { id: '0445' },
      pokeapi: { id: '445' },
    },
  },
  garchompmega: {
    name: ['Mega Garchomp', 'Garchomp-Mega'],
    sources: {
      ps: { id: 'garchomp-mega' },
      serebii: { id: '445-m' },
      pmd: { id: '0445/0001' },
      pokeapi: { id: '10058' },
    },
  },
  garchompmegaz: {
    name: ['Mega Garchomp Z', 'Garchomp-Mega-Z'],
    sources: {
      ps: { id: 'garchomp-megaz' },
      serebii: { id: '445-m' },
      pmd: { id: '0445/0002' },
      pokeapi: { id: '10309' },
    },
  },
  munchlax: {
    name: ['Munchlax'],
    sources: {
      ps: { flip: true },
      serebii: { id: '446' },
      pmd: { id: '0446' },
      pokeapi: { id: '446' },
    },
  },
  riolu: {
    name: ['Riolu'],
    sources: {
      ps: {},
      serebii: { id: '447' },
      pmd: { id: '0447' },
      pokeapi: { id: '447' },
    },
  },
  lucario: {
    name: ['Lucario'],
    sources: {
      ps: {},
      serebii: { id: '448' },
      pmd: { id: '0448' },
      pokeapi: { id: '448' },
    },
  },
  lucariomega: {
    name: ['Mega Lucario', 'Lucario-Mega'],
    sources: {
      ps: { id: 'lucario-mega', flip: true },
      serebii: { id: '448-m' },
      pmd: { id: '0448/0001' },
      pokeapi: { id: '10059' },
    },
  },
  lucariomegaz: {
    name: ['Mega Lucario Z', 'Lucario-Mega-Z'],
    sources: {
      ps: { id: 'lucario-megaz', flip: true },
      serebii: { id: '448-m' },
      pmd: { id: '0448/0002' },
      pokeapi: { id: '10310' },
    },
  },
  hippopotas: {
    name: ['Hippopotas'],
    sources: {
      ps: {},
      serebii: { id: '449' },
      pmd: { id: '0449' },
      pokeapi: { id: '449' },
    },
  },
  hippowdon: {
    name: ['Hippowdon'],
    sources: {
      ps: {},
      serebii: { id: '450' },
      pmd: { id: '0450' },
      pokeapi: { id: '450' },
    },
  },
  skorupi: {
    name: ['Skorupi'],
    sources: {
      ps: {},
      serebii: { id: '451' },
      pmd: { id: '0451' },
      pokeapi: { id: '451' },
    },
  },
  drapion: {
    name: ['Drapion'],
    sources: {
      ps: {},
      serebii: { id: '452' },
      pmd: { id: '0452' },
      pokeapi: { id: '452' },
    },
  },
  croagunk: {
    name: ['Croagunk'],
    sources: {
      ps: {},
      serebii: { id: '453' },
      pmd: { id: '0453' },
      pokeapi: { id: '453' },
    },
  },
  toxicroak: {
    name: ['Toxicroak'],
    sources: {
      ps: {},
      serebii: { id: '454' },
      pmd: { id: '0454' },
      pokeapi: { id: '454' },
    },
  },
  carnivine: {
    name: ['Carnivine'],
    sources: {
      ps: {},
      serebii: { id: '455' },
      pmd: { id: '0455' },
      pokeapi: { id: '455' },
    },
  },
  finneon: {
    name: ['Finneon'],
    sources: {
      ps: {},
      serebii: { id: '456' },
      pmd: { id: '0456' },
      pokeapi: { id: '456' },
    },
  },
  lumineon: {
    name: ['Lumineon'],
    sources: {
      ps: {},
      serebii: { id: '457' },
      pmd: { id: '0457' },
      pokeapi: { id: '457' },
    },
  },
  mantyke: {
    name: ['Mantyke'],
    sources: {
      ps: {},
      serebii: { id: '458' },
      pmd: { id: '0458' },
      pokeapi: { id: '458' },
    },
  },
  snover: {
    name: ['Snover'],
    sources: {
      ps: {},
      serebii: { id: '459' },
      pmd: { id: '0459' },
      pokeapi: { id: '459' },
    },
  },
  abomasnow: {
    name: ['Abomasnow'],
    sources: {
      ps: {},
      serebii: { id: '460' },
      pmd: { id: '0460' },
      pokeapi: { id: '460' },
    },
  },
  abomasnowmega: {
    name: ['Mega Abomasnow', 'Abomasnow-Mega'],
    sources: {
      ps: { id: 'abomasnow-mega' },
      serebii: { id: '460-m' },
      pmd: { id: '0460/0001' },
      pokeapi: { id: '10060' },
    },
  },
  weavile: {
    name: ['Weavile'],
    sources: {
      ps: {},
      serebii: { id: '461' },
      pmd: { id: '0461' },
      pokeapi: { id: '461' },
    },
  },
  magnezone: {
    name: ['Magnezone'],
    sources: {
      ps: {},
      serebii: { id: '462' },
      pmd: { id: '0462' },
      pokeapi: { id: '462' },
    },
  },
  lickilicky: {
    name: ['Lickilicky'],
    sources: {
      ps: {},
      serebii: { id: '463' },
      pmd: { id: '0463' },
      pokeapi: { id: '463' },
    },
  },
  rhyperior: {
    name: ['Rhyperior'],
    sources: {
      ps: {},
      serebii: { id: '464' },
      pmd: { id: '0464' },
      pokeapi: { id: '464' },
    },
  },
  tangrowth: {
    name: ['Tangrowth'],
    sources: {
      ps: {},
      serebii: { id: '465' },
      pmd: { id: '0465' },
      pokeapi: { id: '465' },
    },
  },
  electivire: {
    name: ['Electivire'],
    sources: {
      ps: {},
      serebii: { id: '466' },
      pmd: { id: '0466' },
      pokeapi: { id: '466' },
    },
  },
  magmortar: {
    name: ['Magmortar'],
    sources: {
      ps: {},
      serebii: { id: '467' },
      pmd: { id: '0467' },
      pokeapi: { id: '467' },
    },
  },
  togekiss: {
    name: ['Togekiss'],
    sources: {
      ps: {},
      serebii: { id: '468' },
      pmd: { id: '0468' },
      pokeapi: { id: '468' },
    },
  },
  yanmega: {
    name: ['Yanmega'],
    sources: {
      ps: {},
      serebii: { id: '469' },
      pmd: { id: '0469' },
      pokeapi: { id: '469' },
    },
  },
  leafeon: {
    name: ['Leafeon'],
    sources: {
      ps: {},
      serebii: { id: '470' },
      pmd: { id: '0470' },
      pokeapi: { id: '470' },
    },
  },
  glaceon: {
    name: ['Glaceon'],
    sources: {
      ps: { flip: true },
      serebii: { id: '471' },
      pmd: { id: '0471' },
      pokeapi: { id: '471' },
    },
  },
  gliscor: {
    name: ['Gliscor'],
    sources: {
      ps: {},
      serebii: { id: '472' },
      pmd: { id: '0472' },
      pokeapi: { id: '472' },
    },
  },
  mamoswine: {
    name: ['Mamoswine'],
    sources: {
      ps: {},
      serebii: { id: '473' },
      pmd: { id: '0473' },
      pokeapi: { id: '473' },
    },
  },
  porygonz: {
    name: ['Porygon-Z'],
    sources: {
      ps: {},
      serebii: { id: '474' },
      pmd: { id: '0474' },
      pokeapi: { id: '474' },
    },
  },
  gallade: {
    name: ['Gallade'],
    sources: {
      ps: {},
      serebii: { id: '475' },
      pmd: { id: '0475' },
      pokeapi: { id: '475' },
    },
  },
  gallademega: {
    name: ['Mega Gallade', 'Gallade-Mega'],
    sources: {
      ps: { id: 'gallade-mega' },
      serebii: { id: '475-m' },
      pmd: { id: '0475/0001' },
      pokeapi: { id: '10068' },
    },
  },
  probopass: {
    name: ['Probopass'],
    sources: {
      ps: {},
      serebii: { id: '476' },
      pmd: { id: '0476' },
      pokeapi: { id: '476' },
    },
  },
  dusknoir: {
    name: ['Dusknoir'],
    sources: {
      ps: { flip: true },
      serebii: { id: '477' },
      pmd: { id: '0477' },
      pokeapi: { id: '477' },
    },
  },
  froslass: {
    name: ['Froslass'],
    sources: {
      ps: {},
      serebii: { id: '478' },
      pmd: { id: '0478' },
      pokeapi: { id: '478' },
    },
  },
  froslassmega: {
    name: ['Mega Froslass', 'Froslass-Mega'],
    sources: {
      ps: { id: 'froslass-mega' },
      serebii: { id: '478' },
      pmd: { id: '0478/0001' },
      pokeapi: { id: '10285' },
    },
  },
  rotom: {
    name: ['Rotom'],
    sources: {
      ps: { flip: true },
      serebii: { id: '479' },
      pmd: { id: '0479' },
      pokeapi: { id: '479' },
    },
  },
  rotomheat: {
    name: ['Rotom-Heat'],
    sources: {
      ps: { id: 'rotom-heat' },
      serebii: { id: '479-h' },
      pmd: { id: '0479/0001' },
      pokeapi: { id: '10008' },
    },
  },
  rotomwash: {
    name: ['Rotom-Wash'],
    sources: {
      ps: { id: 'rotom-wash', flip: true },
      serebii: { id: '479-w' },
      pmd: { id: '0479/0002' },
      pokeapi: { id: '10009' },
    },
  },
  rotomfrost: {
    name: ['Rotom-Frost'],
    sources: {
      ps: { id: 'rotom-frost', flip: true },
      serebii: { id: '479-f' },
      pmd: { id: '0479/0003' },
      pokeapi: { id: '10010' },
    },
  },
  rotomfan: {
    name: ['Rotom-Fan'],
    sources: {
      ps: { id: 'rotom-fan' },
      serebii: { id: '479-s' },
      pmd: { id: '0479/0004' },
      pokeapi: { id: '10011' },
    },
  },
  rotommow: {
    name: ['Rotom-Mow'],
    sources: {
      ps: { id: 'rotom-mow', flip: true },
      serebii: { id: '479-m' },
      pmd: { id: '0479/0005' },
      pokeapi: { id: '10012' },
    },
  },
  uxie: {
    name: ['Uxie'],
    sources: {
      ps: {},
      serebii: { id: '480' },
      pmd: { id: '0480' },
      pokeapi: { id: '480' },
    },
  },
  mesprit: {
    name: ['Mesprit'],
    sources: {
      ps: {},
      serebii: { id: '481' },
      pmd: { id: '0481' },
      pokeapi: { id: '481' },
    },
  },
  azelf: {
    name: ['Azelf'],
    sources: {
      ps: { flip: true },
      serebii: { id: '482' },
      pmd: { id: '0482' },
      pokeapi: { id: '482' },
    },
  },
  dialga: {
    name: ['Dialga'],
    sources: {
      ps: { flip: true },
      serebii: { id: '483' },
      pmd: { id: '0483' },
      pokeapi: { id: '483' },
    },
  },
  dialgaorigin: {
    name: ['Dialga-Origin'],
    sources: {
      ps: { id: 'dialga-origin' },
      serebii: { id: '483-o' },
      pmd: { id: '0483/0001' },
      pokeapi: { id: '10245' },
    },
  },
  dialgaprimal: {
    name: ['Dialga-Primal'],
    sources: {
      ps: { id: 'dialga' },
      serebii: { id: '483' },
      pmd: { id: '0483/0002' },
      pokeapi: { id: '483' },
    },
  },
  palkia: {
    name: ['Palkia'],
    sources: {
      ps: {},
      serebii: { id: '484' },
      pmd: { id: '0484' },
      pokeapi: { id: '484' },
    },
  },
  palkiaorigin: {
    name: ['Palkia-Origin'],
    sources: {
      ps: { id: 'palkia-origin', flip: true },
      serebii: { id: '484-o' },
      pmd: { id: '0484/0001' },
      pokeapi: { id: '10246' },
    },
  },
  heatran: {
    name: ['Heatran'],
    sources: {
      ps: {},
      serebii: { id: '485' },
      pmd: { id: '0485' },
      pokeapi: { id: '485' },
    },
  },
  heatranmega: {
    name: ['Mega Heatran', 'Heatran-Mega'],
    sources: {
      ps: { id: 'heatran-mega' },
      serebii: { id: '485' },
      pmd: { id: '0485/0001' },
      pokeapi: { id: '10311' },
    },
  },
  regigigas: {
    name: ['Regigigas'],
    sources: {
      ps: {},
      serebii: { id: '486' },
      pmd: { id: '0486' },
      pokeapi: { id: '486' },
    },
  },
  giratina: {
    name: ['Giratina'],
    sources: {
      ps: {},
      serebii: { id: '487' },
      pmd: { id: '0487' },
      pokeapi: { id: '487' },
    },
  },
  giratinaorigin: {
    name: ['Giratina-Origin'],
    sources: {
      ps: { id: 'giratina-origin' },
      serebii: { id: '487-o' },
      pmd: { id: '0487/0001' },
      pokeapi: { id: '10007' },
    },
  },
  cresselia: {
    name: ['Cresselia'],
    sources: {
      ps: { flip: true },
      serebii: { id: '488' },
      pmd: { id: '0488' },
      pokeapi: { id: '488' },
    },
  },
  phione: {
    name: ['Phione'],
    sources: {
      ps: {},
      serebii: { id: '489' },
      pmd: { id: '0489' },
      pokeapi: { id: '489' },
    },
  },
  manaphy: {
    name: ['Manaphy'],
    sources: {
      ps: {},
      serebii: { id: '490' },
      pmd: { id: '0490' },
      pokeapi: { id: '490' },
    },
  },
  darkrai: {
    name: ['Darkrai'],
    sources: {
      ps: {},
      serebii: { id: '491' },
      pmd: { id: '0491' },
      pokeapi: { id: '491' },
    },
  },
  darkraimega: {
    name: ['Mega Darkrai', 'Darkrai-Mega'],
    sources: {
      ps: { id: 'darkrai-mega' },
      serebii: { id: '491' },
      pmd: { id: '0491/0001' },
      pokeapi: { id: '10312' },
    },
  },
  shaymin: {
    name: ['Shaymin'],
    sources: {
      ps: {},
      serebii: { id: '492' },
      pmd: { id: '0492' },
      pokeapi: { id: '492' },
    },
  },
  shayminsky: {
    name: ['Shaymin-Sky'],
    sources: {
      ps: { id: 'shaymin-sky' },
      serebii: { id: '492-s' },
      pmd: { id: '0492/0001' },
      pokeapi: { id: '10006' },
    },
  },
  arceus: {
    name: ['Arceus'],
    sources: {
      ps: {},
      serebii: { id: '493' },
      pmd: { id: '0493' },
      pokeapi: { id: '493' },
    },
  },
  arceusbug: {
    name: ['Arceus-Bug'],
    sources: {
      ps: { id: 'arceus-bug' },
      serebii: { id: '493' },
      pmd: { id: '0493/0001' },
      pokeapi: { id: '493' },
    },
  },
  arceusdark: {
    name: ['Arceus-Dark'],
    sources: {
      ps: { id: 'arceus-dark' },
      serebii: { id: '493-dark' },
      pmd: { id: '0493/0002' },
      pokeapi: { id: '493' },
    },
  },
  arceusdragon: {
    name: ['Arceus-Dragon'],
    sources: {
      ps: { id: 'arceus-dragon' },
      serebii: { id: '493-dragon' },
      pmd: { id: '0493/0003' },
      pokeapi: { id: '493' },
    },
  },
  arceuselectric: {
    name: ['Arceus-Electric'],
    sources: {
      ps: { id: 'arceus-electric' },
      serebii: { id: '493-electric' },
      pmd: { id: '0493/0004' },
      pokeapi: { id: '493' },
    },
  },
  arceusfairy: {
    name: ['Arceus-Fairy'],
    sources: {
      ps: { id: 'arceus-fairy' },
      serebii: { id: '493-fairy' },
      pmd: { id: '0493/0017' },
      pokeapi: { id: '493' },
    },
  },
  arceusfighting: {
    name: ['Arceus-Fighting'],
    sources: {
      ps: { id: 'arceus-fighting' },
      serebii: { id: '493-fighting' },
      pmd: { id: '0493/0005' },
      pokeapi: { id: '493' },
    },
  },
  arceusfire: {
    name: ['Arceus-Fire'],
    sources: {
      ps: { id: 'arceus-fire' },
      serebii: { id: '493-fire' },
      pmd: { id: '0493/0006' },
      pokeapi: { id: '493' },
    },
  },
  arceusflying: {
    name: ['Arceus-Flying'],
    sources: {
      ps: { id: 'arceus-flying' },
      serebii: { id: '493-flying' },
      pmd: { id: '0493/0007' },
      pokeapi: { id: '493' },
    },
  },
  arceusghost: {
    name: ['Arceus-Ghost'],
    sources: {
      ps: { id: 'arceus-ghost' },
      serebii: { id: '493-ghost' },
      pmd: { id: '0493/0008' },
      pokeapi: { id: '493' },
    },
  },
  arceusgrass: {
    name: ['Arceus-Grass'],
    sources: {
      ps: { id: 'arceus-grass' },
      serebii: { id: '493-grass' },
      pmd: { id: '0493/0009' },
      pokeapi: { id: '493' },
    },
  },
  arceusground: {
    name: ['Arceus-Ground'],
    sources: {
      ps: { id: 'arceus-ground' },
      serebii: { id: '493-ground' },
      pmd: { id: '0493/0010' },
      pokeapi: { id: '493' },
    },
  },
  arceusice: {
    name: ['Arceus-Ice'],
    sources: {
      ps: { id: 'arceus-ice' },
      serebii: { id: '493-ice' },
      pmd: { id: '0493/0011' },
      pokeapi: { id: '493' },
    },
  },
  arceuspoison: {
    name: ['Arceus-Poison'],
    sources: {
      ps: { id: 'arceus-poison' },
      serebii: { id: '493-poison' },
      pmd: { id: '0493/0012' },
      pokeapi: { id: '493' },
    },
  },
  arceuspsychic: {
    name: ['Arceus-Psychic'],
    sources: {
      ps: { id: 'arceus-psychic' },
      serebii: { id: '493-psychic' },
      pmd: { id: '0493/0013' },
      pokeapi: { id: '493' },
    },
  },
  arceusrock: {
    name: ['Arceus-Rock'],
    sources: {
      ps: { id: 'arceus-rock' },
      serebii: { id: '493-rock' },
      pmd: { id: '0493/0014' },
      pokeapi: { id: '493' },
    },
  },
  arceussteel: {
    name: ['Arceus-Steel'],
    sources: {
      ps: { id: 'arceus-steel' },
      serebii: { id: '493-steel' },
      pmd: { id: '0493/0015' },
      pokeapi: { id: '493' },
    },
  },
  arceuswater: {
    name: ['Arceus-Water'],
    sources: {
      ps: { id: 'arceus-water' },
      serebii: { id: '493-water' },
      pmd: { id: '0493/0016' },
      pokeapi: { id: '493' },
    },
  },
  victini: {
    name: ['Victini'],
    sources: {
      ps: {},
      serebii: { id: '494' },
      pmd: { id: '0494' },
      pokeapi: { id: '494' },
    },
  },
  snivy: {
    name: ['Snivy'],
    sources: {
      ps: {},
      serebii: { id: '495' },
      pmd: { id: '0495' },
      pokeapi: { id: '495' },
    },
  },
  servine: {
    name: ['Servine'],
    sources: {
      ps: { flip: true },
      serebii: { id: '496' },
      pmd: { id: '0496' },
      pokeapi: { id: '496' },
    },
  },
  serperior: {
    name: ['Serperior'],
    sources: {
      ps: {},
      serebii: { id: '497' },
      pmd: { id: '0497' },
      pokeapi: { id: '497' },
    },
  },
  tepig: {
    name: ['Tepig'],
    sources: {
      ps: { flip: true },
      serebii: { id: '498' },
      pmd: { id: '0498' },
      pokeapi: { id: '498' },
    },
  },
  pignite: {
    name: ['Pignite'],
    sources: {
      ps: {},
      serebii: { id: '499' },
      pmd: { id: '0499' },
      pokeapi: { id: '499' },
    },
  },
  emboar: {
    name: ['Emboar'],
    sources: {
      ps: {},
      serebii: { id: '500' },
      pmd: { id: '0500' },
      pokeapi: { id: '500' },
    },
  },
  emboarmega: {
    name: ['Mega Emboar', 'Emboar-Mega'],
    sources: {
      ps: { id: 'emboar-mega' },
      serebii: { id: '500' },
      pmd: { id: '0500/0001' },
      pokeapi: { id: '10286' },
    },
  },
  oshawott: {
    name: ['Oshawott'],
    sources: {
      ps: {},
      serebii: { id: '501' },
      pmd: { id: '0501' },
      pokeapi: { id: '501' },
    },
  },
  dewott: {
    name: ['Dewott'],
    sources: {
      ps: {},
      serebii: { id: '502' },
      pmd: { id: '0502' },
      pokeapi: { id: '502' },
    },
  },
  samurott: {
    name: ['Samurott'],
    sources: {
      ps: {},
      serebii: { id: '503' },
      pmd: { id: '0503' },
      pokeapi: { id: '503' },
    },
  },
  samurotthisui: {
    name: ['Hisuian Samurott', 'Samurott-Hisui', 'Samurott-H'],
    sources: {
      ps: { id: 'samurott-hisui' },
      serebii: { id: '503-h' },
      pmd: { id: '0503/0001' },
      pokeapi: { id: '10236' },
    },
  },
  patrat: {
    name: ['Patrat'],
    sources: {
      ps: {},
      serebii: { id: '504' },
      pmd: { id: '0504' },
      pokeapi: { id: '504' },
    },
  },
  watchog: {
    name: ['Watchog'],
    sources: {
      ps: {},
      serebii: { id: '505' },
      pmd: { id: '0505' },
      pokeapi: { id: '505' },
    },
  },
  lillipup: {
    name: ['Lillipup'],
    sources: {
      ps: {},
      serebii: { id: '506' },
      pmd: { id: '0506' },
      pokeapi: { id: '506' },
    },
  },
  herdier: {
    name: ['Herdier'],
    sources: {
      ps: {},
      serebii: { id: '507' },
      pmd: { id: '0507' },
      pokeapi: { id: '507' },
    },
  },
  stoutland: {
    name: ['Stoutland'],
    sources: {
      ps: {},
      serebii: { id: '508' },
      pmd: { id: '0508' },
      pokeapi: { id: '508' },
    },
  },
  purrloin: {
    name: ['Purrloin'],
    sources: {
      ps: {},
      serebii: { id: '509' },
      pmd: { id: '0509' },
      pokeapi: { id: '509' },
    },
  },
  liepard: {
    name: ['Liepard'],
    sources: {
      ps: {},
      serebii: { id: '510' },
      pmd: { id: '0510' },
      pokeapi: { id: '510' },
    },
  },
  pansage: {
    name: ['Pansage'],
    sources: {
      ps: {},
      serebii: { id: '511' },
      pmd: { id: '0511' },
      pokeapi: { id: '511' },
    },
  },
  simisage: {
    name: ['Simisage'],
    sources: {
      ps: {},
      serebii: { id: '512' },
      pmd: { id: '0512' },
      pokeapi: { id: '512' },
    },
  },
  pansear: {
    name: ['Pansear'],
    sources: {
      ps: {},
      serebii: { id: '513' },
      pmd: { id: '0513' },
      pokeapi: { id: '513' },
    },
  },
  simisear: {
    name: ['Simisear'],
    sources: {
      ps: {},
      serebii: { id: '514' },
      pmd: { id: '0514' },
      pokeapi: { id: '514' },
    },
  },
  panpour: {
    name: ['Panpour'],
    sources: {
      ps: { flip: true },
      serebii: { id: '515' },
      pmd: { id: '0515' },
      pokeapi: { id: '515' },
    },
  },
  simipour: {
    name: ['Simipour'],
    sources: {
      ps: { flip: true },
      serebii: { id: '516' },
      pmd: { id: '0516' },
      pokeapi: { id: '516' },
    },
  },
  munna: {
    name: ['Munna'],
    sources: {
      ps: {},
      serebii: { id: '517' },
      pmd: { id: '0517' },
      pokeapi: { id: '517' },
    },
  },
  musharna: {
    name: ['Musharna'],
    sources: {
      ps: {},
      serebii: { id: '518' },
      pmd: { id: '0518' },
      pokeapi: { id: '518' },
    },
  },
  pidove: {
    name: ['Pidove'],
    sources: {
      ps: {},
      serebii: { id: '519' },
      pmd: { id: '0519' },
      pokeapi: { id: '519' },
    },
  },
  tranquill: {
    name: ['Tranquill'],
    sources: {
      ps: {},
      serebii: { id: '520' },
      pmd: { id: '0520' },
      pokeapi: { id: '520' },
    },
  },
  unfezant: {
    name: ['Unfezant'],
    sources: {
      ps: {},
      serebii: { id: '521' },
      pmd: { id: '0521' },
      pokeapi: { id: '521' },
    },
  },
  blitzle: {
    name: ['Blitzle'],
    sources: {
      ps: { flip: true },
      serebii: { id: '522' },
      pmd: { id: '0522' },
      pokeapi: { id: '522' },
    },
  },
  zebstrika: {
    name: ['Zebstrika'],
    sources: {
      ps: {},
      serebii: { id: '523' },
      pmd: { id: '0523' },
      pokeapi: { id: '523' },
    },
  },
  roggenrola: {
    name: ['Roggenrola'],
    sources: {
      ps: {},
      serebii: { id: '524' },
      pmd: { id: '0524' },
      pokeapi: { id: '524' },
    },
  },
  boldore: {
    name: ['Boldore'],
    sources: {
      ps: {},
      serebii: { id: '525' },
      pmd: { id: '0525' },
      pokeapi: { id: '525' },
    },
  },
  gigalith: {
    name: ['Gigalith'],
    sources: {
      ps: {},
      serebii: { id: '526' },
      pmd: { id: '0526' },
      pokeapi: { id: '526' },
    },
  },
  woobat: {
    name: ['Woobat'],
    sources: {
      ps: {},
      serebii: { id: '527' },
      pmd: { id: '0527' },
      pokeapi: { id: '527' },
    },
  },
  swoobat: {
    name: ['Swoobat'],
    sources: {
      ps: {},
      serebii: { id: '528' },
      pmd: { id: '0528' },
      pokeapi: { id: '528' },
    },
  },
  drilbur: {
    name: ['Drilbur'],
    sources: {
      ps: {},
      serebii: { id: '529' },
      pmd: { id: '0529' },
      pokeapi: { id: '529' },
    },
  },
  excadrill: {
    name: ['Excadrill'],
    sources: {
      ps: { flip: true },
      serebii: { id: '530' },
      pmd: { id: '0530' },
      pokeapi: { id: '530' },
    },
  },
  excadrillmega: {
    name: ['Mega Excadrill', 'Excadrill-Mega'],
    sources: {
      ps: { id: 'excadrill-mega', flip: true },
      serebii: { id: '530' },
      pmd: { id: '0530/0001' },
      pokeapi: { id: '10287' },
    },
  },
  audino: {
    name: ['Audino'],
    sources: {
      ps: { flip: true },
      serebii: { id: '531' },
      pmd: { id: '0531' },
      pokeapi: { id: '531' },
    },
  },
  audinomega: {
    name: ['Mega Audino', 'Audino-Mega'],
    sources: {
      ps: { id: 'audino-mega' },
      serebii: { id: '531-m' },
      pmd: { id: '0531/0001' },
      pokeapi: { id: '10069' },
    },
  },
  timburr: {
    name: ['Timburr'],
    sources: {
      ps: {},
      serebii: { id: '532' },
      pmd: { id: '0532' },
      pokeapi: { id: '532' },
    },
  },
  gurdurr: {
    name: ['Gurdurr'],
    sources: {
      ps: {},
      serebii: { id: '533' },
      pmd: { id: '0533' },
      pokeapi: { id: '533' },
    },
  },
  conkeldurr: {
    name: ['Conkeldurr'],
    sources: {
      ps: {},
      serebii: { id: '534' },
      pmd: { id: '0534' },
      pokeapi: { id: '534' },
    },
  },
  tympole: {
    name: ['Tympole'],
    sources: {
      ps: {},
      serebii: { id: '535' },
      pmd: { id: '0535' },
      pokeapi: { id: '535' },
    },
  },
  palpitoad: {
    name: ['Palpitoad'],
    sources: {
      ps: {},
      serebii: { id: '536' },
      pmd: { id: '0536' },
      pokeapi: { id: '536' },
    },
  },
  seismitoad: {
    name: ['Seismitoad'],
    sources: {
      ps: {},
      serebii: { id: '537' },
      pmd: { id: '0537' },
      pokeapi: { id: '537' },
    },
  },
  throh: {
    name: ['Throh'],
    sources: {
      ps: {},
      serebii: { id: '538' },
      pmd: { id: '0538' },
      pokeapi: { id: '538' },
    },
  },
  sawk: {
    name: ['Sawk'],
    sources: {
      ps: {},
      serebii: { id: '539' },
      pmd: { id: '0539' },
      pokeapi: { id: '539' },
    },
  },
  sewaddle: {
    name: ['Sewaddle'],
    sources: {
      ps: {},
      serebii: { id: '540' },
      pmd: { id: '0540' },
      pokeapi: { id: '540' },
    },
  },
  swadloon: {
    name: ['Swadloon'],
    sources: {
      ps: {},
      serebii: { id: '541' },
      pmd: { id: '0541' },
      pokeapi: { id: '541' },
    },
  },
  leavanny: {
    name: ['Leavanny'],
    sources: {
      ps: {},
      serebii: { id: '542' },
      pmd: { id: '0542' },
      pokeapi: { id: '542' },
    },
  },
  venipede: {
    name: ['Venipede'],
    sources: {
      ps: {},
      serebii: { id: '543' },
      pmd: { id: '0543' },
      pokeapi: { id: '543' },
    },
  },
  whirlipede: {
    name: ['Whirlipede'],
    sources: {
      ps: {},
      serebii: { id: '544' },
      pmd: { id: '0544' },
      pokeapi: { id: '544' },
    },
  },
  scolipede: {
    name: ['Scolipede'],
    sources: {
      ps: {},
      serebii: { id: '545' },
      pmd: { id: '0545' },
      pokeapi: { id: '545' },
    },
  },
  scolipedemega: {
    name: ['Mega Scolipede', 'Scolipede-Mega'],
    sources: {
      ps: { id: 'scolipede-mega' },
      serebii: { id: '545' },
      pmd: { id: '0545/0001' },
      pokeapi: { id: '10288' },
    },
  },
  cottonee: {
    name: ['Cottonee'],
    sources: {
      ps: {},
      serebii: { id: '546' },
      pmd: { id: '0546' },
      pokeapi: { id: '546' },
    },
  },
  whimsicott: {
    name: ['Whimsicott'],
    sources: {
      ps: {},
      serebii: { id: '547' },
      pmd: { id: '0547' },
      pokeapi: { id: '547' },
    },
  },
  petilil: {
    name: ['Petilil'],
    sources: {
      ps: {},
      serebii: { id: '548' },
      pmd: { id: '0548' },
      pokeapi: { id: '548' },
    },
  },
  lilligant: {
    name: ['Lilligant'],
    sources: {
      ps: {},
      serebii: { id: '549' },
      pmd: { id: '0549' },
      pokeapi: { id: '549' },
    },
  },
  lilliganthisui: {
    name: ['Hisuian Lilligant', 'Lilligant-Hisui', 'Lilligant-H'],
    sources: {
      ps: { id: 'lilligant-hisui' },
      serebii: { id: '549-h' },
      pmd: { id: '0549/0001' },
      pokeapi: { id: '10237' },
    },
  },
  basculin: {
    name: ['Basculin'],
    sources: {
      ps: {},
      serebii: { id: '550' },
      pmd: { id: '0550' },
      pokeapi: { id: '550' },
    },
  },
  basculinbluestriped: {
    name: ['Basculin-Blue-Striped'],
    sources: {
      ps: { id: 'basculin-bluestriped' },
      serebii: { id: '550-b' },
      pmd: { id: '0550/0001' },
      pokeapi: { id: '10016' },
    },
  },
  basculinwhitestriped: {
    name: ['Basculin-White-Striped'],
    sources: {
      ps: { id: 'basculin-whitestriped' },
      serebii: { id: '550-w' },
      pmd: { id: '0550/0002' },
      pokeapi: { id: '10247' },
    },
  },
  sandile: {
    name: ['Sandile'],
    sources: {
      ps: {},
      serebii: { id: '551' },
      pmd: { id: '0551' },
      pokeapi: { id: '551' },
    },
  },
  krokorok: {
    name: ['Krokorok'],
    sources: {
      ps: { flip: true },
      serebii: { id: '552' },
      pmd: { id: '0552' },
      pokeapi: { id: '552' },
    },
  },
  krookodile: {
    name: ['Krookodile'],
    sources: {
      ps: {},
      serebii: { id: '553' },
      pmd: { id: '0553' },
      pokeapi: { id: '553' },
    },
  },
  darumaka: {
    name: ['Darumaka'],
    sources: {
      ps: {},
      serebii: { id: '554' },
      pmd: { id: '0554' },
      pokeapi: { id: '554' },
    },
  },
  darumakagalar: {
    name: ['Galarian Darumaka', 'Darumaka-Galar', 'Darumaka-G'],
    sources: {
      ps: { id: 'darumaka-galar' },
      serebii: { id: '554-g' },
      pmd: { id: '0554/0001' },
      pokeapi: { id: '10176' },
    },
  },
  darmanitan: {
    name: ['Darmanitan'],
    sources: {
      ps: {},
      serebii: { id: '555' },
      pmd: { id: '0555' },
      pokeapi: { id: '555' },
    },
  },
  darmanitanzen: {
    name: ['Darmanitan-Zen'],
    sources: {
      ps: { id: 'darmanitan-zen' },
      serebii: { id: '555' },
      pmd: { id: '0555/0001' },
      pokeapi: { id: '10017' },
    },
  },
  darmanitangalar: {
    name: ['Galarian Darmanitan', 'Darmanitan-Galar', 'Darmanitan-G'],
    sources: {
      ps: { id: 'darmanitan-galar', flip: true },
      serebii: { id: '555-g' },
      pmd: { id: '0555/0002' },
      pokeapi: { id: '10177' },
    },
  },
  darmanitangalarzen: {
    name: ['Galarian Zen Darmanitan', 'Darmanitan-Galar-Zen', 'Darmanitan-G-Zen'],
    sources: {
      ps: { id: 'darmanitan-galarzen' },
      serebii: { id: '555-gz' },
      pmd: { id: '0555/0003' },
      pokeapi: { id: '10178' },
    },
  },
  maractus: {
    name: ['Maractus'],
    sources: {
      ps: {},
      serebii: { id: '556' },
      pmd: { id: '0556' },
      pokeapi: { id: '556' },
    },
  },
  dwebble: {
    name: ['Dwebble'],
    sources: {
      ps: {},
      serebii: { id: '557' },
      pmd: { id: '0557' },
      pokeapi: { id: '557' },
    },
  },
  crustle: {
    name: ['Crustle'],
    sources: {
      ps: {},
      serebii: { id: '558' },
      pmd: { id: '0558' },
      pokeapi: { id: '558' },
    },
  },
  scraggy: {
    name: ['Scraggy'],
    sources: {
      ps: {},
      serebii: { id: '559' },
      pmd: { id: '0559' },
      pokeapi: { id: '559' },
    },
  },
  scrafty: {
    name: ['Scrafty'],
    sources: {
      ps: {},
      serebii: { id: '560' },
      pmd: { id: '0560' },
      pokeapi: { id: '560' },
    },
  },
  scraftymega: {
    name: ['Mega Scrafty', 'Scrafty-Mega'],
    sources: {
      ps: { id: 'scrafty-mega' },
      serebii: { id: '560' },
      pmd: { id: '0560/0001' },
      pokeapi: { id: '10289' },
    },
  },
  sigilyph: {
    name: ['Sigilyph'],
    sources: {
      ps: {},
      serebii: { id: '561' },
      pmd: { id: '0561' },
      pokeapi: { id: '561' },
    },
  },
  yamask: {
    name: ['Yamask'],
    sources: {
      ps: {},
      serebii: { id: '562' },
      pmd: { id: '0562' },
      pokeapi: { id: '562' },
    },
  },
  yamaskgalar: {
    name: ['Galarian Yamask', 'Yamask-Galar', 'Yamask-G'],
    sources: {
      ps: { id: 'yamask-galar' },
      serebii: { id: '562-g' },
      pmd: { id: '0562/0001' },
      pokeapi: { id: '10179' },
    },
  },
  cofagrigus: {
    name: ['Cofagrigus'],
    sources: {
      ps: {},
      serebii: { id: '563' },
      pmd: { id: '0563' },
      pokeapi: { id: '563' },
    },
  },
  tirtouga: {
    name: ['Tirtouga'],
    sources: {
      ps: {},
      serebii: { id: '564' },
      pmd: { id: '0564' },
      pokeapi: { id: '564' },
    },
  },
  carracosta: {
    name: ['Carracosta'],
    sources: {
      ps: {},
      serebii: { id: '565' },
      pmd: { id: '0565' },
      pokeapi: { id: '565' },
    },
  },
  archen: {
    name: ['Archen'],
    sources: {
      ps: {},
      serebii: { id: '566' },
      pmd: { id: '0566' },
      pokeapi: { id: '566' },
    },
  },
  archeops: {
    name: ['Archeops'],
    sources: {
      ps: {},
      serebii: { id: '567' },
      pmd: { id: '0567' },
      pokeapi: { id: '567' },
    },
  },
  trubbish: {
    name: ['Trubbish'],
    sources: {
      ps: {},
      serebii: { id: '568' },
      pmd: { id: '0568' },
      pokeapi: { id: '568' },
    },
  },
  garbodor: {
    name: ['Garbodor'],
    sources: {
      ps: {},
      serebii: { id: '569' },
      pmd: { id: '0569' },
      pokeapi: { id: '569' },
    },
  },
  garbodorgmax: {
    name: ['Garbodor-Gmax'],
    sources: {
      ps: { id: 'garbodor-gmax' },
      serebii: { id: '569-gi' },
      pmd: { id: '0569' },
      pokeapi: { id: '10207' },
    },
  },
  garbodormega: {
    name: ['Mega Garbodor', 'Garbodor-Mega'],
    sources: {
      ps: { id: 'garbodor-gmax' },
      serebii: { id: '569-gi' },
      pmd: { id: '0569' },
      pokeapi: { id: '10207' },
    },
  },
  zorua: {
    name: ['Zorua'],
    sources: {
      ps: {},
      serebii: { id: '570' },
      pmd: { id: '0570' },
      pokeapi: { id: '570' },
    },
  },
  zoruahisui: {
    name: ['Hisuian Zorua', 'Zorua-Hisui', 'Zorua-H'],
    sources: {
      ps: { id: 'zorua-hisui' },
      serebii: { id: '570-h' },
      pmd: { id: '0570/0001' },
      pokeapi: { id: '10238' },
    },
  },
  zoroark: {
    name: ['Zoroark'],
    sources: {
      ps: {},
      serebii: { id: '571' },
      pmd: { id: '0571' },
      pokeapi: { id: '571' },
    },
  },
  zoroarkhisui: {
    name: ['Hisuian Zoroark', 'Zoroark-Hisui', 'Zoroark-H'],
    sources: {
      ps: { id: 'zoroark-hisui' },
      serebii: { id: '571-h' },
      pmd: { id: '0571/0001' },
      pokeapi: { id: '10239' },
    },
  },
  minccino: {
    name: ['Minccino'],
    sources: {
      ps: {},
      serebii: { id: '572' },
      pmd: { id: '0572' },
      pokeapi: { id: '572' },
    },
  },
  cinccino: {
    name: ['Cinccino'],
    sources: {
      ps: {},
      serebii: { id: '573' },
      pmd: { id: '0573' },
      pokeapi: { id: '573' },
    },
  },
  gothita: {
    name: ['Gothita'],
    sources: {
      ps: {},
      serebii: { id: '574' },
      pmd: { id: '0574' },
      pokeapi: { id: '574' },
    },
  },
  gothorita: {
    name: ['Gothorita'],
    sources: {
      ps: {},
      serebii: { id: '575' },
      pmd: { id: '0575' },
      pokeapi: { id: '575' },
    },
  },
  gothitelle: {
    name: ['Gothitelle'],
    sources: {
      ps: {},
      serebii: { id: '576' },
      pmd: { id: '0576' },
      pokeapi: { id: '576' },
    },
  },
  solosis: {
    name: ['Solosis'],
    sources: {
      ps: {},
      serebii: { id: '577' },
      pmd: { id: '0577' },
      pokeapi: { id: '577' },
    },
  },
  duosion: {
    name: ['Duosion'],
    sources: {
      ps: {},
      serebii: { id: '578' },
      pmd: { id: '0578' },
      pokeapi: { id: '578' },
    },
  },
  reuniclus: {
    name: ['Reuniclus'],
    sources: {
      ps: {},
      serebii: { id: '579' },
      pmd: { id: '0579' },
      pokeapi: { id: '579' },
    },
  },
  ducklett: {
    name: ['Ducklett'],
    sources: {
      ps: {},
      serebii: { id: '580' },
      pmd: { id: '0580' },
      pokeapi: { id: '580' },
    },
  },
  swanna: {
    name: ['Swanna'],
    sources: {
      ps: {},
      serebii: { id: '581' },
      pmd: { id: '0581' },
      pokeapi: { id: '581' },
    },
  },
  vanillite: {
    name: ['Vanillite'],
    sources: {
      ps: {},
      serebii: { id: '582' },
      pmd: { id: '0582' },
      pokeapi: { id: '582' },
    },
  },
  vanillish: {
    name: ['Vanillish'],
    sources: {
      ps: {},
      serebii: { id: '583' },
      pmd: { id: '0583' },
      pokeapi: { id: '583' },
    },
  },
  vanilluxe: {
    name: ['Vanilluxe'],
    sources: {
      ps: {},
      serebii: { id: '584' },
      pmd: { id: '0584' },
      pokeapi: { id: '584' },
    },
  },
  deerling: {
    name: ['Deerling'],
    sources: {
      ps: {},
      serebii: { id: '585' },
      pmd: { id: '0585' },
      pokeapi: { id: '585' },
    },
  },
  sawsbuck: {
    name: ['Sawsbuck'],
    sources: {
      ps: {},
      serebii: { id: '586' },
      pmd: { id: '0586' },
      pokeapi: { id: '586' },
    },
  },
  emolga: {
    name: ['Emolga'],
    sources: {
      ps: {},
      serebii: { id: '587' },
      pmd: { id: '0587' },
      pokeapi: { id: '587' },
    },
  },
  karrablast: {
    name: ['Karrablast'],
    sources: {
      ps: {},
      serebii: { id: '588' },
      pmd: { id: '0588' },
      pokeapi: { id: '588' },
    },
  },
  escavalier: {
    name: ['Escavalier'],
    sources: {
      ps: {},
      serebii: { id: '589' },
      pmd: { id: '0589' },
      pokeapi: { id: '589' },
    },
  },
  foongus: {
    name: ['Foongus'],
    sources: {
      ps: {},
      serebii: { id: '590' },
      pmd: { id: '0590' },
      pokeapi: { id: '590' },
    },
  },
  amoonguss: {
    name: ['Amoonguss'],
    sources: {
      ps: {},
      serebii: { id: '591' },
      pmd: { id: '0591' },
      pokeapi: { id: '591' },
    },
  },
  frillish: {
    name: ['Frillish'],
    sources: {
      ps: {},
      serebii: { id: '592' },
      pmd: { id: '0592' },
      pokeapi: { id: '592' },
    },
  },
  jellicent: {
    name: ['Jellicent'],
    sources: {
      ps: { flip: true },
      serebii: { id: '593' },
      pmd: { id: '0593' },
      pokeapi: { id: '593' },
    },
  },
  alomomola: {
    name: ['Alomomola'],
    sources: {
      ps: {},
      serebii: { id: '594' },
      pmd: { id: '0594' },
      pokeapi: { id: '594' },
    },
  },
  joltik: {
    name: ['Joltik'],
    sources: {
      ps: {},
      serebii: { id: '595' },
      pmd: { id: '0595' },
      pokeapi: { id: '595' },
    },
  },
  galvantula: {
    name: ['Galvantula'],
    sources: {
      ps: {},
      serebii: { id: '596' },
      pmd: { id: '0596' },
      pokeapi: { id: '596' },
    },
  },
  ferroseed: {
    name: ['Ferroseed'],
    sources: {
      ps: {},
      serebii: { id: '597' },
      pmd: { id: '0597' },
      pokeapi: { id: '597' },
    },
  },
  ferrothorn: {
    name: ['Ferrothorn'],
    sources: {
      ps: {},
      serebii: { id: '598' },
      pmd: { id: '0598' },
      pokeapi: { id: '598' },
    },
  },
  klink: {
    name: ['Klink'],
    sources: {
      ps: {},
      serebii: { id: '599' },
      pmd: { id: '0599' },
      pokeapi: { id: '599' },
    },
  },
  klang: {
    name: ['Klang'],
    sources: {
      ps: {},
      serebii: { id: '600' },
      pmd: { id: '0600' },
      pokeapi: { id: '600' },
    },
  },
  klinklang: {
    name: ['Klinklang'],
    sources: {
      ps: {},
      serebii: { id: '601' },
      pmd: { id: '0601' },
      pokeapi: { id: '601' },
    },
  },
  tynamo: {
    name: ['Tynamo'],
    sources: {
      ps: {},
      serebii: { id: '602' },
      pmd: { id: '0602' },
      pokeapi: { id: '602' },
    },
  },
  eelektrik: {
    name: ['Eelektrik'],
    sources: {
      ps: {},
      serebii: { id: '603' },
      pmd: { id: '0603' },
      pokeapi: { id: '603' },
    },
  },
  eelektross: {
    name: ['Eelektross'],
    sources: {
      ps: {},
      serebii: { id: '604' },
      pmd: { id: '0604' },
      pokeapi: { id: '604' },
    },
  },
  eelektrossmega: {
    name: ['Mega Eelektross', 'Eelektross-Mega'],
    sources: {
      ps: { id: 'eelektross-mega' },
      serebii: { id: '604' },
      pmd: { id: '0604/0001' },
      pokeapi: { id: '10290' },
    },
  },
  elgyem: {
    name: ['Elgyem'],
    sources: {
      ps: { flip: true },
      serebii: { id: '605' },
      pmd: { id: '0605' },
      pokeapi: { id: '605' },
    },
  },
  beheeyem: {
    name: ['Beheeyem'],
    sources: {
      ps: {},
      serebii: { id: '606' },
      pmd: { id: '0606' },
      pokeapi: { id: '606' },
    },
  },
  litwick: {
    name: ['Litwick'],
    sources: {
      ps: {},
      serebii: { id: '607' },
      pmd: { id: '0607' },
      pokeapi: { id: '607' },
    },
  },
  lampent: {
    name: ['Lampent'],
    sources: {
      ps: {},
      serebii: { id: '608' },
      pmd: { id: '0608' },
      pokeapi: { id: '608' },
    },
  },
  chandelure: {
    name: ['Chandelure'],
    sources: {
      ps: {},
      serebii: { id: '609' },
      pmd: { id: '0609' },
      pokeapi: { id: '609' },
    },
  },
  chandeluremega: {
    name: ['Mega Chandelure', 'Chandelure-Mega'],
    sources: {
      ps: { id: 'chandelure-mega' },
      serebii: { id: '609' },
      pmd: { id: '0609/0001' },
      pokeapi: { id: '10291' },
    },
  },
  axew: {
    name: ['Axew'],
    sources: {
      ps: {},
      serebii: { id: '610' },
      pmd: { id: '0610' },
      pokeapi: { id: '610' },
    },
  },
  fraxure: {
    name: ['Fraxure'],
    sources: {
      ps: {},
      serebii: { id: '611' },
      pmd: { id: '0611' },
      pokeapi: { id: '611' },
    },
  },
  haxorus: {
    name: ['Haxorus'],
    sources: {
      ps: {},
      serebii: { id: '612' },
      pmd: { id: '0612' },
      pokeapi: { id: '612' },
    },
  },
  cubchoo: {
    name: ['Cubchoo'],
    sources: {
      ps: {},
      serebii: { id: '613' },
      pmd: { id: '0613' },
      pokeapi: { id: '613' },
    },
  },
  beartic: {
    name: ['Beartic'],
    sources: {
      ps: {},
      serebii: { id: '614' },
      pmd: { id: '0614' },
      pokeapi: { id: '614' },
    },
  },
  cryogonal: {
    name: ['Cryogonal'],
    sources: {
      ps: {},
      serebii: { id: '615' },
      pmd: { id: '0615' },
      pokeapi: { id: '615' },
    },
  },
  shelmet: {
    name: ['Shelmet'],
    sources: {
      ps: {},
      serebii: { id: '616' },
      pmd: { id: '0616' },
      pokeapi: { id: '616' },
    },
  },
  accelgor: {
    name: ['Accelgor'],
    sources: {
      ps: { flip: true },
      serebii: { id: '617' },
      pmd: { id: '0617' },
      pokeapi: { id: '617' },
    },
  },
  stunfisk: {
    name: ['Stunfisk'],
    sources: {
      ps: {},
      serebii: { id: '618' },
      pmd: { id: '0618' },
      pokeapi: { id: '618' },
    },
  },
  stunfiskgalar: {
    name: ['Galarian Stunfisk', 'Stunfisk-Galar', 'Stunfisk-G'],
    sources: {
      ps: { id: 'stunfisk-galar' },
      serebii: { id: '618-g' },
      pmd: { id: '0618/0001' },
      pokeapi: { id: '10180' },
    },
  },
  mienfoo: {
    name: ['Mienfoo'],
    sources: {
      ps: {},
      serebii: { id: '619' },
      pmd: { id: '0619' },
      pokeapi: { id: '619' },
    },
  },
  mienshao: {
    name: ['Mienshao'],
    sources: {
      ps: {},
      serebii: { id: '620' },
      pmd: { id: '0620' },
      pokeapi: { id: '620' },
    },
  },
  druddigon: {
    name: ['Druddigon'],
    sources: {
      ps: {},
      serebii: { id: '621' },
      pmd: { id: '0621' },
      pokeapi: { id: '621' },
    },
  },
  golett: {
    name: ['Golett'],
    sources: {
      ps: {},
      serebii: { id: '622' },
      pmd: { id: '0622' },
      pokeapi: { id: '622' },
    },
  },
  golurk: {
    name: ['Golurk'],
    sources: {
      ps: {},
      serebii: { id: '623' },
      pmd: { id: '0623' },
      pokeapi: { id: '623' },
    },
  },
  golurkmega: {
    name: ['Mega Golurk', 'Golurk-Mega'],
    sources: {
      ps: { id: 'golurk-mega' },
      serebii: { id: '623' },
      pmd: { id: '0623/0001' },
      pokeapi: { id: '10313' },
    },
  },
  pawniard: {
    name: ['Pawniard'],
    sources: {
      ps: { flip: true },
      serebii: { id: '624' },
      pmd: { id: '0624' },
      pokeapi: { id: '624' },
    },
  },
  bisharp: {
    name: ['Bisharp'],
    sources: {
      ps: {},
      serebii: { id: '625' },
      pmd: { id: '0625' },
      pokeapi: { id: '625' },
    },
  },
  bouffalant: {
    name: ['Bouffalant'],
    sources: {
      ps: {},
      serebii: { id: '626' },
      pmd: { id: '0626' },
      pokeapi: { id: '626' },
    },
  },
  rufflet: {
    name: ['Rufflet'],
    sources: {
      ps: {},
      serebii: { id: '627' },
      pmd: { id: '0627' },
      pokeapi: { id: '627' },
    },
  },
  braviary: {
    name: ['Braviary'],
    sources: {
      ps: {},
      serebii: { id: '628' },
      pmd: { id: '0628' },
      pokeapi: { id: '628' },
    },
  },
  braviaryhisui: {
    name: ['Hisuian Braviary', 'Braviary-Hisui', 'Braviary-H'],
    sources: {
      ps: { id: 'braviary-hisui' },
      serebii: { id: '628-h' },
      pmd: { id: '0628/0001' },
      pokeapi: { id: '10240' },
    },
  },
  vullaby: {
    name: ['Vullaby'],
    sources: {
      ps: {},
      serebii: { id: '629' },
      pmd: { id: '0629' },
      pokeapi: { id: '629' },
    },
  },
  mandibuzz: {
    name: ['Mandibuzz'],
    sources: {
      ps: { flip: true },
      serebii: { id: '630' },
      pmd: { id: '0630' },
      pokeapi: { id: '630' },
    },
  },
  heatmor: {
    name: ['Heatmor'],
    sources: {
      ps: {},
      serebii: { id: '631' },
      pmd: { id: '0631' },
      pokeapi: { id: '631' },
    },
  },
  durant: {
    name: ['Durant'],
    sources: {
      ps: {},
      serebii: { id: '632' },
      pmd: { id: '0632' },
      pokeapi: { id: '632' },
    },
  },
  deino: {
    name: ['Deino'],
    sources: {
      ps: {},
      serebii: { id: '633' },
      pmd: { id: '0633' },
      pokeapi: { id: '633' },
    },
  },
  zweilous: {
    name: ['Zweilous'],
    sources: {
      ps: {},
      serebii: { id: '634' },
      pmd: { id: '0634' },
      pokeapi: { id: '634' },
    },
  },
  hydreigon: {
    name: ['Hydreigon'],
    sources: {
      ps: {},
      serebii: { id: '635' },
      pmd: { id: '0635' },
      pokeapi: { id: '635' },
    },
  },
  larvesta: {
    name: ['Larvesta'],
    sources: {
      ps: {},
      serebii: { id: '636' },
      pmd: { id: '0636' },
      pokeapi: { id: '636' },
    },
  },
  volcarona: {
    name: ['Volcarona'],
    sources: {
      ps: {},
      serebii: { id: '637' },
      pmd: { id: '0637' },
      pokeapi: { id: '637' },
    },
  },
  cobalion: {
    name: ['Cobalion'],
    sources: {
      ps: {},
      serebii: { id: '638' },
      pmd: { id: '0638' },
      pokeapi: { id: '638' },
    },
  },
  terrakion: {
    name: ['Terrakion'],
    sources: {
      ps: {},
      serebii: { id: '639' },
      pmd: { id: '0639' },
      pokeapi: { id: '639' },
    },
  },
  virizion: {
    name: ['Virizion'],
    sources: {
      ps: { flip: true },
      serebii: { id: '640' },
      pmd: { id: '0640' },
      pokeapi: { id: '640' },
    },
  },
  tornadus: {
    name: ['Tornadus-Incarnate', 'Tornadus', 'Tornadus-I'],
    sources: {
      ps: {},
      serebii: { id: '641' },
      pmd: { id: '0641' },
      pokeapi: { id: '641' },
    },
  },
  tornadustherian: {
    name: ['Tornadus-T', 'Tornadus-Therian'],
    sources: {
      ps: { id: 'tornadus-therian' },
      serebii: { id: '641-t' },
      pmd: { id: '0641/0001' },
      pokeapi: { id: '10019' },
    },
  },
  thundurus: {
    name: ['Thundurus-Incarnate', 'Thundurus', 'Thundurus-I'],
    sources: {
      ps: { flip: true },
      serebii: { id: '642' },
      pmd: { id: '0642' },
      pokeapi: { id: '642' },
    },
  },
  thundurustherian: {
    name: ['Thundurus-T', 'Thundurus-Therian'],
    sources: {
      ps: { id: 'thundurus-therian', flip: true },
      serebii: { id: '642-t' },
      pmd: { id: '0642/0001' },
      pokeapi: { id: '10020' },
    },
  },
  reshiram: {
    name: ['Reshiram'],
    sources: {
      ps: { flip: true },
      serebii: { id: '643' },
      pmd: { id: '0643' },
      pokeapi: { id: '643' },
    },
  },
  zekrom: {
    name: ['Zekrom'],
    sources: {
      ps: {},
      serebii: { id: '644' },
      pmd: { id: '0644' },
      pokeapi: { id: '644' },
    },
  },
  landorus: {
    name: ['Landorus-Incarnate', 'Landorus', 'Landorus-I'],
    sources: {
      ps: {},
      serebii: { id: '645' },
      pmd: { id: '0645' },
      pokeapi: { id: '645' },
    },
  },
  landorustherian: {
    name: ['Landorus-T', 'Landorus-Therian'],
    sources: {
      ps: { id: 'landorus-therian' },
      serebii: { id: '645-t' },
      pmd: { id: '0645/0001' },
      pokeapi: { id: '10021' },
    },
  },
  kyurem: {
    name: ['Kyurem'],
    sources: {
      ps: {},
      serebii: { id: '646' },
      pmd: { id: '0646' },
      pokeapi: { id: '646' },
    },
  },
  kyuremblack: {
    name: ['Kyurem-Black'],
    sources: {
      ps: { id: 'kyurem-black', flip: true },
      serebii: { id: '646-b' },
      pmd: { id: '0646/0001' },
      pokeapi: { id: '10022' },
    },
  },
  kyuremwhite: {
    name: ['Kyurem-White'],
    sources: {
      ps: { id: 'kyurem-white' },
      serebii: { id: '646-w' },
      pmd: { id: '0646/0002' },
      pokeapi: { id: '10023' },
    },
  },
  keldeo: {
    name: ['Keldeo'],
    sources: {
      ps: {},
      serebii: { id: '647' },
      pmd: { id: '0647' },
      pokeapi: { id: '647' },
    },
  },
  keldeoresolute: {
    name: ['Keldeo-Resolute'],
    sources: {
      ps: { id: 'keldeo-resolute', flip: true },
      serebii: { id: '647-r' },
      pmd: { id: '0647/0001' },
      pokeapi: { id: '10024' },
    },
  },
  meloetta: {
    name: ['Meloetta'],
    sources: {
      ps: {},
      serebii: { id: '648' },
      pmd: { id: '0648' },
      pokeapi: { id: '648' },
    },
  },
  meloettapirouette: {
    name: ['Meloetta-Pirouette'],
    sources: {
      ps: { id: 'meloetta-pirouette', flip: true },
      serebii: { id: '648-p' },
      pmd: { id: '0648/0001' },
      pokeapi: { id: '10018' },
    },
  },
  genesect: {
    name: ['Genesect'],
    sources: {
      ps: {},
      serebii: { id: '649' },
      pmd: { id: '0649' },
      pokeapi: { id: '649' },
    },
  },
  genesectdouse: {
    name: ['Genesect-Douse'],
    sources: {
      ps: { id: 'genesect-douse' },
      serebii: { id: '649-w' },
      pmd: { id: '0649/0001' },
      pokeapi: { id: '649' },
    },
  },
  genesectshock: {
    name: ['Genesect-Shock'],
    sources: {
      ps: { id: 'genesect-shock' },
      serebii: { id: '649-e' },
      pmd: { id: '0649/0002' },
      pokeapi: { id: '649' },
    },
  },
  genesectburn: {
    name: ['Genesect-Burn'],
    sources: {
      ps: { id: 'genesect-burn' },
      serebii: { id: '649-f' },
      pmd: { id: '0649/0003' },
      pokeapi: { id: '649' },
    },
  },
  genesectchill: {
    name: ['Genesect-Chill'],
    sources: {
      ps: { id: 'genesect-chill' },
      serebii: { id: '649-i' },
      pmd: { id: '0649/0004' },
      pokeapi: { id: '649' },
    },
  },
  chespin: {
    name: ['Chespin'],
    sources: {
      ps: {},
      serebii: { id: '650' },
      pmd: { id: '0650' },
      pokeapi: { id: '650' },
    },
  },
  quilladin: {
    name: ['Quilladin'],
    sources: {
      ps: {},
      serebii: { id: '651' },
      pmd: { id: '0651' },
      pokeapi: { id: '651' },
    },
  },
  chesnaught: {
    name: ['Chesnaught'],
    sources: {
      ps: {},
      serebii: { id: '652' },
      pmd: { id: '0652' },
      pokeapi: { id: '652' },
    },
  },
  chesnaughtmega: {
    name: ['Mega Chesnaught', 'Chesnaught-Mega'],
    sources: {
      ps: { id: 'chesnaught-mega' },
      serebii: { id: '652' },
      pmd: { id: '0652/0001' },
      pokeapi: { id: '10292' },
    },
  },

  fennekin: {
    name: ['Fennekin'],
    sources: {
      ps: {},
      serebii: { id: '653' },
      pmd: { id: '0653' },
      pokeapi: { id: '653' },
    },
  },
  braixen: {
    name: ['Braixen'],
    sources: {
      ps: {},
      serebii: { id: '654' },
      pmd: { id: '0654' },
      pokeapi: { id: '654' },
    },
  },
  delphox: {
    name: ['Delphox'],
    sources: {
      ps: {},
      serebii: { id: '655' },
      pmd: { id: '0655' },
      pokeapi: { id: '655' },
    },
  },
  delphoxmega: {
    name: ['Mega Delphox', 'Delphox-Mega'],
    sources: {
      ps: { id: 'delphox-mega' },
      serebii: { id: '655' },
      pmd: { id: '0655/0001' },
      pokeapi: { id: '10293' },
    },
  },

  froakie: {
    name: ['Froakie'],
    sources: {
      ps: { flip: true },
      serebii: { id: '656' },
      pmd: { id: '0656' },
      pokeapi: { id: '656' },
    },
  },
  frogadier: {
    name: ['Frogadier'],
    sources: {
      ps: {},
      serebii: { id: '657' },
      pmd: { id: '0657' },
      pokeapi: { id: '657' },
    },
  },
  greninja: {
    name: ['Greninja'],
    sources: {
      ps: { flip: true },
      serebii: { id: '658' },
      pmd: { id: '0658' },
      pokeapi: { id: '658' },
    },
  },
  greninjamega: {
    name: ['Mega Greninja', 'Greninja-Mega'],
    sources: {
      ps: { id: 'greninja-mega', flip: true },
      serebii: { id: '658' },
      pmd: { id: '0658/0001' },
      pokeapi: { id: '10294' },
    },
  },
  greninjabond: {
    name: ['Greninja-Bond'],
    sources: {
      ps: { id: 'greninja' },
      serebii: { id: '658' },
      pmd: { id: '0658' },
      pokeapi: { id: '658' },
    },
  },
  greninjaash: {
    name: ['Greninja-Ash'],
    sources: {
      ps: { id: 'greninja-ash' },
      serebii: { id: '658-a' },
      pmd: { id: '0658/0001' },
      pokeapi: { id: '10117' },
    },
  },
  bunnelby: {
    name: ['Bunnelby'],
    sources: {
      ps: {},
      serebii: { id: '659' },
      pmd: { id: '0659' },
      pokeapi: { id: '659' },
    },
  },
  diggersby: {
    name: ['Diggersby'],
    sources: {
      ps: {},
      serebii: { id: '660' },
      pmd: { id: '0660' },
      pokeapi: { id: '660' },
    },
  },
  fletchling: {
    name: ['Fletchling'],
    sources: {
      ps: {},
      serebii: { id: '661' },
      pmd: { id: '0661' },
      pokeapi: { id: '661' },
    },
  },
  fletchinder: {
    name: ['Fletchinder'],
    sources: {
      ps: {},
      serebii: { id: '662' },
      pmd: { id: '0662' },
      pokeapi: { id: '662' },
    },
  },
  talonflame: {
    name: ['Talonflame'],
    sources: {
      ps: {},
      serebii: { id: '663' },
      pmd: { id: '0663' },
      pokeapi: { id: '663' },
    },
  },
  scatterbug: {
    name: ['Scatterbug'],
    sources: {
      ps: { flip: true },
      serebii: { id: '664' },
      pmd: { id: '0664' },
      pokeapi: { id: '664' },
    },
  },
  spewpa: {
    name: ['Spewpa'],
    sources: {
      ps: {},
      serebii: { id: '665' },
      pmd: { id: '0665' },
      pokeapi: { id: '665' },
    },
  },
  vivillon: {
    name: ['Vivillon'],
    sources: {
      ps: {},
      serebii: { id: '666' },
      pmd: { id: '0666' },
      pokeapi: { id: '666' },
    },
  },
  vivillonfancy: {
    name: ['Vivillon-Fancy'],
    sources: {
      ps: { id: 'vivillon-fancy' },
      serebii: { id: '666-f' },
      pmd: { id: '0666/0018' },
      pokeapi: { id: '666' },
    },
  },
  vivillonpokeball: {
    name: ['Vivillon-Pokeball'],
    sources: {
      ps: { id: 'vivillon-pokeball' },
      serebii: { id: '666-pb' },
      pmd: { id: '0666/0019' },
      pokeapi: { id: '666' },
    },
  },
  litleo: {
    name: ['Litleo'],
    sources: {
      ps: {},
      serebii: { id: '667' },
      pmd: { id: '0667' },
      pokeapi: { id: '667' },
    },
  },
  pyroar: {
    name: ['Pyroar'],
    sources: {
      ps: { flip: true },
      serebii: { id: '668' },
      pmd: { id: '0668' },
      pokeapi: { id: '668' },
    },
  },
  pyroarmega: {
    name: ['Mega Pyroar', 'Pyroar-Mega'],
    sources: {
      ps: { id: 'pyroar-mega', flip: true },
      serebii: { id: '668' },
      pmd: { id: '0668/0001' },
      pokeapi: { id: '10295' },
    },
  },
  flabebe: {
    name: ['Flabébé'],
    sources: {
      ps: {},
      serebii: { id: '669' },
      pmd: { id: '0669' },
      pokeapi: { id: '669' },
    },
  },
  floette: {
    name: ['Floette'],
    sources: {
      ps: { flip: true },
      serebii: { id: '670' },
      pmd: { id: '0670' },
      pokeapi: { id: '670' },
    },
  },
  floetteeternal: {
    name: ['Floette-Eternal'],
    sources: {
      ps: { id: 'floette-eternal', flip: true },
      serebii: { id: '670' },
      pmd: { id: '0670/0005' },
      pokeapi: { id: '10061' },
    },
  },
  floettemega: {
    name: ['Mega Floette', 'Floette-Mega'],
    sources: {
      ps: { id: 'floette-mega', flip: true },
      serebii: { id: '670' },
      pmd: { id: '0670/0006' },
      pokeapi: { id: '10296' },
    },
  },
  florges: {
    name: [
      'Florges',
      'Florges-Blue',
      'Florges-White',
      'Florges-Yellow',
      'Florges-Red',
    ],
    sources: {
      ps: {},
      serebii: { id: '671' },
      pmd: { id: '0671' },
      pokeapi: { id: '671' },
    },
  },
  skiddo: {
    name: ['Skiddo'],
    sources: {
      ps: {},
      serebii: { id: '672' },
      pmd: { id: '0672' },
      pokeapi: { id: '672' },
    },
  },
  gogoat: {
    name: ['Gogoat'],
    sources: {
      ps: {},
      serebii: { id: '673' },
      pmd: { id: '0673' },
      pokeapi: { id: '673' },
    },
  },
  pancham: {
    name: ['Pancham'],
    sources: {
      ps: {},
      serebii: { id: '674' },
      pmd: { id: '0674' },
      pokeapi: { id: '674' },
    },
  },
  pangoro: {
    name: ['Pangoro'],
    sources: {
      ps: {},
      serebii: { id: '675' },
      pmd: { id: '0675' },
      pokeapi: { id: '675' },
    },
  },
  furfrou: {
    name: ['Furfrou'],
    sources: {
      ps: {},
      serebii: { id: '676' },
      pmd: { id: '0676' },
      pokeapi: { id: '676' },
    },
  },
  espurr: {
    name: ['Espurr'],
    sources: {
      ps: {},
      serebii: { id: '677' },
      pmd: { id: '0677' },
      pokeapi: { id: '677' },
    },
  },
  meowstic: {
    name: ['Meowstic'],
    sources: {
      ps: {},
      serebii: { id: '678' },
      pmd: { id: '0678' },
      pokeapi: { id: '678' },
    },
  },
  meowsticf: {
    name: ['Meowstic-Female', 'Meowstic-F'],
    sources: {
      ps: { id: 'meowstic-f' },
      serebii: { id: '678-f' },
      pmd: { id: '0678/0000/0000/0002' },
      pokeapi: { id: '10025' },
    },
  },
  meowsticmmega: {
    name: [
      'Mega Meowstic-Male',
      'Mega Meowstic-M',
      'Meowstic-Male-Mega',
      'Meowstic-M-Mega',
      'Mega Meowstic',
      'Meowstic-Mega',
    ],
    sources: {
      ps: { id: 'meowstic-mega' },
      serebii: { id: '678' },
      pmd: { id: '0678/0001' },
      pokeapi: { id: '10314' },
    },
  },
  meowsticfmega: {
    name: [
      'Mega Meowstic-Female',
      'Mega Meowstic-F',
      'Meowstic-Female-Mega',
      'Meowstic-F-Mega',
    ],
    sources: {
      ps: { id: 'meowstic-f-mega' },
      serebii: { id: '678-f' },
      pmd: { id: '0678/0001' },
      pokeapi: { id: '10326' },
    },
  },
  honedge: {
    name: ['Honedge'],
    sources: {
      ps: {},
      serebii: { id: '679' },
      pmd: { id: '0679' },
      pokeapi: { id: '679' },
    },
  },
  doublade: {
    name: ['Doublade'],
    sources: {
      ps: {},
      serebii: { id: '680' },
      pmd: { id: '0680' },
      pokeapi: { id: '680' },
    },
  },
  aegislash: {
    name: ['Aegislash'],
    sources: {
      ps: {},
      serebii: { id: '681' },
      pmd: { id: '0681' },
      pokeapi: { id: '681' },
    },
  },
  aegislashblade: {
    name: ['Aegislash-Blade'],
    sources: {
      ps: { id: 'aegislash-blade' },
      serebii: { id: '681-b' },
      pmd: { id: '0681/0001' },
      pokeapi: { id: '10026' },
    },
  },
  spritzee: {
    name: ['Spritzee'],
    sources: {
      ps: {},
      serebii: { id: '682' },
      pmd: { id: '0682' },
      pokeapi: { id: '682' },
    },
  },
  aromatisse: {
    name: ['Aromatisse'],
    sources: {
      ps: { flip: true },
      serebii: { id: '683' },
      pmd: { id: '0683' },
      pokeapi: { id: '683' },
    },
  },
  swirlix: {
    name: ['Swirlix'],
    sources: {
      ps: {},
      serebii: { id: '684' },
      pmd: { id: '0684' },
      pokeapi: { id: '684' },
    },
  },
  slurpuff: {
    name: ['Slurpuff'],
    sources: {
      ps: {},
      serebii: { id: '685' },
      pmd: { id: '0685' },
      pokeapi: { id: '685' },
    },
  },
  inkay: {
    name: ['Inkay'],
    sources: {
      ps: { flip: true },
      serebii: { id: '686' },
      pmd: { id: '0686' },
      pokeapi: { id: '686' },
    },
  },
  malamar: {
    name: ['Malamar'],
    sources: {
      ps: {},
      serebii: { id: '687' },
      pmd: { id: '0687' },
      pokeapi: { id: '687' },
    },
  },
  malamarmega: {
    name: ['Mega Malamar', 'Malamar-Mega'],
    sources: {
      ps: { id: 'malamar-mega' },
      serebii: { id: '687' },
      pmd: { id: '0687/0001' },
      pokeapi: { id: '10297' },
    },
  },
  binacle: {
    name: ['Binacle'],
    sources: {
      ps: {},
      serebii: { id: '688' },
      pmd: { id: '0688' },
      pokeapi: { id: '688' },
    },
  },
  barbaracle: {
    name: ['Barbaracle'],
    sources: {
      ps: {},
      serebii: { id: '689' },
      pmd: { id: '0689' },
      pokeapi: { id: '689' },
    },
  },
  barbaraclemega: {
    name: ['Mega Barbaracle', 'Barbaracle-Mega'],
    sources: {
      ps: { id: 'barbaracle-mega' },
      serebii: { id: '689' },
      pmd: { id: '0689/0001' },
      pokeapi: { id: '10298' },
    },
  },
  skrelp: {
    name: ['Skrelp'],
    sources: {
      ps: {},
      serebii: { id: '690' },
      pmd: { id: '0690' },
      pokeapi: { id: '690' },
    },
  },
  dragalge: {
    name: ['Dragalge'],
    sources: {
      ps: {},
      serebii: { id: '691' },
      pmd: { id: '0691' },
      pokeapi: { id: '691' },
    },
  },
  dragalgemega: {
    name: ['Mega Dragalge', 'Dragalge-Mega'],
    sources: {
      ps: { id: 'dragalge-mega' },
      serebii: { id: '691' },
      pmd: { id: '0691/0001' },
      pokeapi: { id: '10299' },
    },
  },
  clauncher: {
    name: ['Clauncher'],
    sources: {
      ps: {},
      serebii: { id: '692' },
      pmd: { id: '0692' },
      pokeapi: { id: '692' },
    },
  },
  clawitzer: {
    name: ['Clawitzer'],
    sources: {
      ps: {},
      serebii: { id: '693' },
      pmd: { id: '0693' },
      pokeapi: { id: '693' },
    },
  },
  helioptile: {
    name: ['Helioptile'],
    sources: {
      ps: {},
      serebii: { id: '694' },
      pmd: { id: '0694' },
      pokeapi: { id: '694' },
    },
  },
  heliolisk: {
    name: ['Heliolisk'],
    sources: {
      ps: {},
      serebii: { id: '695' },
      pmd: { id: '0695' },
      pokeapi: { id: '695' },
    },
  },
  tyrunt: {
    name: ['Tyrunt'],
    sources: {
      ps: { flip: true },
      serebii: { id: '696' },
      pmd: { id: '0696' },
      pokeapi: { id: '696' },
    },
  },
  tyrantrum: {
    name: ['Tyrantrum'],
    sources: {
      ps: {},
      serebii: { id: '697' },
      pmd: { id: '0697' },
      pokeapi: { id: '697' },
    },
  },
  amaura: {
    name: ['Amaura'],
    sources: {
      ps: {},
      serebii: { id: '698' },
      pmd: { id: '0698' },
      pokeapi: { id: '698' },
    },
  },
  aurorus: {
    name: ['Aurorus'],
    sources: {
      ps: {},
      serebii: { id: '699' },
      pmd: { id: '0699' },
      pokeapi: { id: '699' },
    },
  },
  sylveon: {
    name: ['Sylveon'],
    sources: {
      ps: {},
      serebii: { id: '700' },
      pmd: { id: '0700' },
      pokeapi: { id: '700' },
    },
  },
  hawlucha: {
    name: ['Hawlucha'],
    sources: {
      ps: {},
      serebii: { id: '701' },
      pmd: { id: '0701' },
      pokeapi: { id: '701' },
    },
  },
  hawluchamega: {
    name: ['Mega Hawlucha', 'Hawlucha-Mega'],
    sources: {
      ps: { id: 'hawlucha-mega' },
      serebii: { id: '701' },
      pmd: { id: '0701/0001' },
      pokeapi: { id: '10300' },
    },
  },
  dedenne: {
    name: ['Dedenne'],
    sources: {
      ps: {},
      serebii: { id: '702' },
      pmd: { id: '0702' },
      pokeapi: { id: '702' },
    },
  },
  carbink: {
    name: ['Carbink'],
    sources: {
      ps: {},
      serebii: { id: '703' },
      pmd: { id: '0703' },
      pokeapi: { id: '703' },
    },
  },
  goomy: {
    name: ['Goomy'],
    sources: {
      ps: {},
      serebii: { id: '704' },
      pmd: { id: '0704' },
      pokeapi: { id: '704' },
    },
  },
  sliggoo: {
    name: ['Sliggoo'],
    sources: {
      ps: { flip: true },
      serebii: { id: '705' },
      pmd: { id: '0705' },
      pokeapi: { id: '705' },
    },
  },
  sliggoohisui: {
    name: ['Hisuian Sliggoo', 'Sliggoo-Hisui', 'Sliggoo-H'],
    sources: {
      ps: { id: 'sliggoo-hisui' },
      serebii: { id: '705-h' },
      pmd: { id: '0705/0001' },
      pokeapi: { id: '10241' },
    },
  },
  goodra: {
    name: ['Goodra'],
    sources: {
      ps: {},
      serebii: { id: '706' },
      pmd: { id: '0706' },
      pokeapi: { id: '706' },
    },
  },
  goodrahisui: {
    name: ['Hisuian Goodra', 'Goodra-Hisui', 'Goodra-H'],
    sources: {
      ps: { id: 'goodra-hisui' },
      serebii: { id: '706-h' },
      pmd: { id: '0706/0001' },
      pokeapi: { id: '10242' },
    },
  },
  klefki: {
    name: ['Klefki'],
    sources: {
      ps: {},
      serebii: { id: '707' },
      pmd: { id: '0707' },
      pokeapi: { id: '707' },
    },
  },
  phantump: {
    name: ['Phantump'],
    sources: {
      ps: { flip: true },
      serebii: { id: '708' },
      pmd: { id: '0708' },
      pokeapi: { id: '708' },
    },
  },
  trevenant: {
    name: ['Trevenant'],
    sources: {
      ps: {},
      serebii: { id: '709' },
      pmd: { id: '0709' },
      pokeapi: { id: '709' },
    },
  },
  pumpkaboo: {
    name: ['Pumpkaboo'],
    sources: {
      ps: {},
      serebii: { id: '710' },
      pmd: { id: '0710' },
      pokeapi: { id: '710' },
    },
  },
  pumpkaboosmall: {
    name: ['Pumpkaboo-Small'],
    sources: {
      ps: { id: 'pumpkaboo-small' },
      serebii: { id: '710-s' },
      pmd: { id: '0710' },
      pokeapi: { id: '10027' },
    },
  },
  pumpkaboolarge: {
    name: ['Pumpkaboo-Large'],
    sources: {
      ps: { id: 'pumpkaboo-large' },
      serebii: { id: '710-l' },
      pmd: { id: '0710' },
      pokeapi: { id: '10028' },
    },
  },
  pumpkaboosuper: {
    name: ['Pumpkaboo-Super'],
    sources: {
      ps: { id: 'pumpkaboo-super' },
      serebii: { id: '710-h' },
      pmd: { id: '0710' },
      pokeapi: { id: '10029' },
    },
  },
  gourgeist: {
    name: ['Gourgeist'],
    sources: {
      ps: {},
      serebii: { id: '711' },
      pmd: { id: '0711' },
      pokeapi: { id: '711' },
    },
  },
  gourgeistsmall: {
    name: ['Gourgeist-Small'],
    sources: {
      ps: { id: 'gourgeist-small' },
      serebii: { id: '711' },
      pmd: { id: '0711' },
      pokeapi: { id: '10030' },
    },
  },
  gourgeistlarge: {
    name: ['Gourgeist-Large'],
    sources: {
      ps: { id: 'gourgeist-large' },
      serebii: { id: '711-l' },
      pmd: { id: '0711' },
      pokeapi: { id: '10031' },
    },
  },
  gourgeistsuper: {
    name: ['Gourgeist-Super'],
    sources: {
      ps: { id: 'gourgeist-super' },
      serebii: { id: '711-h' },
      pmd: { id: '0711' },
      pokeapi: { id: '10032' },
    },
  },
  bergmite: {
    name: ['Bergmite'],
    sources: {
      ps: {},
      serebii: { id: '712' },
      pmd: { id: '0712' },
      pokeapi: { id: '712' },
    },
  },
  avalugg: {
    name: ['Avalugg'],
    sources: {
      ps: {},
      serebii: { id: '713' },
      pmd: { id: '0713' },
      pokeapi: { id: '713' },
    },
  },
  avalugghisui: {
    name: ['Hisuian Avalugg', 'Avalugg-Hisui', 'Avalugg-H'],
    sources: {
      ps: { id: 'avalugg-hisui' },
      serebii: { id: '713-h' },
      pmd: { id: '0713/0001' },
      pokeapi: { id: '10243' },
    },
  },
  noibat: {
    name: ['Noibat'],
    sources: {
      ps: {},
      serebii: { id: '714' },
      pmd: { id: '0714' },
      pokeapi: { id: '714' },
    },
  },
  noivern: {
    name: ['Noivern'],
    sources: {
      ps: {},
      serebii: { id: '715' },
      pmd: { id: '0715' },
      pokeapi: { id: '715' },
    },
  },
  xerneas: {
    name: ['Xerneas'],
    sources: {
      ps: { flip: true },
      serebii: { id: '716-a' },
      pmd: { id: '0716' },
      pokeapi: { id: '716' },
    },
  },
  xerneasneutral: {
    name: ['Xerneas-Neutral'],
    sources: {
      ps: { id: 'xerneas-neutral', flip: true },
      serebii: { id: '716' },
      pmd: { id: '0716' },
      pokeapi: { id: '716' },
    },
  },
  yveltal: {
    name: ['Yveltal'],
    sources: {
      ps: {},
      serebii: { id: '717' },
      pmd: { id: '0717' },
      pokeapi: { id: '717' },
    },
  },
  zygarde: {
    name: ['Zygarde'],
    sources: {
      ps: {},
      serebii: { id: '718' },
      pmd: { id: '0718' },
      pokeapi: { id: '718' },
    },
  },
  zygarde10: {
    name: ['Zygarde-10%'],
    sources: {
      ps: { id: 'zygarde-10' },
      serebii: { id: '718-10' },
      pmd: { id: '0718/0001' },
      pokeapi: { id: '10181' },
    },
  },
  zygardecomplete: {
    name: ['Zygarde-Complete'],
    sources: {
      ps: { id: 'zygarde-complete' },
      serebii: { id: '718-c' },
      pmd: { id: '0718/0002' },
      pokeapi: { id: '10120' },
    },
  },
  zygardemega: {
    name: ['Mega Zygarde', 'Zygarde-Mega'],
    sources: {
      ps: { id: 'zygarde-mega' },
      serebii: { id: '718-c' },
      pmd: { id: '0718/0005' },
      pokeapi: { id: '10301' },
    },
  },
  diancie: {
    name: ['Diancie'],
    sources: {
      ps: {},
      serebii: { id: '719' },
      pmd: { id: '0719' },
      pokeapi: { id: '719' },
    },
  },
  dianciemega: {
    name: ['Mega Diancie', 'Diancie-Mega'],
    sources: {
      ps: { id: 'diancie-mega' },
      serebii: { id: '719-m' },
      pmd: { id: '0719/0001' },
      pokeapi: { id: '10075' },
    },
  },
  hoopa: {
    name: ['Hoopa'],
    sources: {
      ps: {},
      serebii: { id: '720' },
      pmd: { id: '0720' },
      pokeapi: { id: '720' },
    },
  },
  hoopaunbound: {
    name: ['Hoopa-Unbound'],
    sources: {
      ps: { id: 'hoopa-unbound' },
      serebii: { id: '720-u' },
      pmd: { id: '0720/0001' },
      pokeapi: { id: '10086' },
    },
  },
  volcanion: {
    name: ['Volcanion'],
    sources: {
      ps: {},
      serebii: { id: '721' },
      pmd: { id: '0721' },
      pokeapi: { id: '721' },
    },
  },
  rowlet: {
    name: ['Rowlet'],
    sources: {
      ps: {},
      serebii: { id: '722' },
      pmd: { id: '0722' },
      pokeapi: { id: '722' },
    },
  },
  dartrix: {
    name: ['Dartrix'],
    sources: {
      ps: { flip: true },
      serebii: { id: '723' },
      pmd: { id: '0723' },
      pokeapi: { id: '723' },
    },
  },
  decidueye: {
    name: ['Decidueye'],
    sources: {
      ps: { flip: true },
      serebii: { id: '724' },
      pmd: { id: '0724' },
      pokeapi: { id: '724' },
    },
  },
  decidueyehisui: {
    name: ['Hisuian Decidueye', 'Decidueye-Hisui', 'Decidueye-H'],
    sources: {
      ps: { id: 'decidueye-hisui' },
      serebii: { id: '724-h' },
      pmd: { id: '0724/0001' },
      pokeapi: { id: '10244' },
    },
  },
  litten: {
    name: ['Litten'],
    sources: {
      ps: {},
      serebii: { id: '725' },
      pmd: { id: '0725' },
      pokeapi: { id: '725' },
    },
  },
  torracat: {
    name: ['Torracat'],
    sources: {
      ps: {},
      serebii: { id: '726' },
      pmd: { id: '0726' },
      pokeapi: { id: '726' },
    },
  },
  incineroar: {
    name: ['Incineroar'],
    sources: {
      ps: {},
      serebii: { id: '727' },
      pmd: { id: '0727' },
      pokeapi: { id: '727' },
    },
  },
  popplio: {
    name: ['Popplio'],
    sources: {
      ps: { flip: true },
      serebii: { id: '728' },
      pmd: { id: '0728' },
      pokeapi: { id: '728' },
    },
  },
  brionne: {
    name: ['Brionne'],
    sources: {
      ps: { flip: true },
      serebii: { id: '729' },
      pmd: { id: '0729' },
      pokeapi: { id: '729' },
    },
  },
  primarina: {
    name: ['Primarina'],
    sources: {
      ps: {},
      serebii: { id: '730' },
      pmd: { id: '0730' },
      pokeapi: { id: '730' },
    },
  },
  pikipek: {
    name: ['Pikipek'],
    sources: {
      ps: {},
      serebii: { id: '731' },
      pmd: { id: '0731' },
      pokeapi: { id: '731' },
    },
  },
  trumbeak: {
    name: ['Trumbeak'],
    sources: {
      ps: {},
      serebii: { id: '732' },
      pmd: { id: '0732' },
      pokeapi: { id: '732' },
    },
  },
  toucannon: {
    name: ['Toucannon'],
    sources: {
      ps: {},
      serebii: { id: '733' },
      pmd: { id: '0733' },
      pokeapi: { id: '733' },
    },
  },
  yungoos: {
    name: ['Yungoos'],
    sources: {
      ps: {},
      serebii: { id: '734' },
      pmd: { id: '0734' },
      pokeapi: { id: '734' },
    },
  },
  gumshoos: {
    name: ['Gumshoos'],
    sources: {
      ps: { flip: true },
      serebii: { id: '735' },
      pmd: { id: '0735' },
      pokeapi: { id: '735' },
    },
  },
  grubbin: {
    name: ['Grubbin'],
    sources: {
      ps: {},
      serebii: { id: '736' },
      pmd: { id: '0736' },
      pokeapi: { id: '736' },
    },
  },
  charjabug: {
    name: ['Charjabug'],
    sources: {
      ps: {},
      serebii: { id: '737' },
      pmd: { id: '0737' },
      pokeapi: { id: '737' },
    },
  },
  vikavolt: {
    name: ['Vikavolt'],
    sources: {
      ps: {},
      serebii: { id: '738' },
      pmd: { id: '0738' },
      pokeapi: { id: '738' },
    },
  },
  crabrawler: {
    name: ['Crabrawler'],
    sources: {
      ps: {},
      serebii: { id: '739' },
      pmd: { id: '0739' },
      pokeapi: { id: '739' },
    },
  },
  crabominable: {
    name: ['Crabominable'],
    sources: {
      ps: {},
      serebii: { id: '740' },
      pmd: { id: '0740' },
      pokeapi: { id: '740' },
    },
  },
  crabominablemega: {
    name: ['Mega Crabominable', 'Crabominable-Mega'],
    sources: {
      ps: { id: 'crabominable-mega' },
      serebii: { id: '740' },
      pmd: { id: '0740/0001' },
      pokeapi: { id: '10315' },
    },
  },
  oricorio: {
    name: ['Oricorio'],
    sources: {
      ps: {},
      serebii: { id: '741' },
      pmd: { id: '0741' },
      pokeapi: { id: '741' },
    },
  },
  oricoriopompom: {
    name: ['Oricorio-Pom-Pom'],
    sources: {
      ps: { id: 'oricorio-pompom' },
      serebii: { id: '741-p' },
      pmd: { id: '0741/0001' },
      pokeapi: { id: '10123' },
    },
  },
  oricoriopau: {
    name: ["Oricorio-Pa'u"],
    sources: {
      ps: { id: 'oricorio-pau' },
      serebii: { id: '741-pau' },
      pmd: { id: '0741/0002' },
      pokeapi: { id: '10124' },
    },
  },
  oricoriosensu: {
    name: ['Oricorio-Sensu'],
    sources: {
      ps: { id: 'oricorio-sensu', flip: true },
      serebii: { id: '741-s' },
      pmd: { id: '0741/0003' },
      pokeapi: { id: '10125' },
    },
  },
  cutiefly: {
    name: ['Cutiefly'],
    sources: {
      ps: {},
      serebii: { id: '742' },
      pmd: { id: '0742' },
      pokeapi: { id: '742' },
    },
  },
  ribombee: {
    name: ['Ribombee'],
    sources: {
      ps: {},
      serebii: { id: '743' },
      pmd: { id: '0743' },
      pokeapi: { id: '743' },
    },
  },
  rockruff: {
    name: ['Rockruff'],
    sources: {
      ps: { flip: true },
      serebii: { id: '744' },
      pmd: { id: '0744' },
      pokeapi: { id: '744' },
    },
  },
  lycanroc: {
    name: ['Lycanroc'],
    sources: {
      ps: {},
      serebii: { id: '745' },
      pmd: { id: '0745' },
      pokeapi: { id: '745' },
    },
  },
  lycanrocmidnight: {
    name: ['Lycanroc-Midnight'],
    sources: {
      ps: { id: 'lycanroc-midnight', flip: true },
      serebii: { id: '745-m' },
      pmd: { id: '0745/0001' },
      pokeapi: { id: '10126' },
    },
  },
  lycanrocdusk: {
    name: ['Lycanroc-Dusk'],
    sources: {
      ps: { id: 'lycanroc-dusk' },
      serebii: { id: '745-d' },
      pmd: { id: '0745/0002' },
      pokeapi: { id: '10152' },
    },
  },
  wishiwashi: {
    name: ['Wishiwashi'],
    sources: {
      ps: {},
      serebii: { id: '746' },
      pmd: { id: '0746' },
      pokeapi: { id: '746' },
    },
  },
  wishiwashischool: {
    name: ['Wishiwashi-School'],
    sources: {
      ps: { id: 'wishiwashi-school' },
      serebii: { id: '746-s' },
      pmd: { id: '0746/0001' },
      pokeapi: { id: '10127' },
    },
  },
  mareanie: {
    name: ['Mareanie'],
    sources: {
      ps: {},
      serebii: { id: '747' },
      pmd: { id: '0747' },
      pokeapi: { id: '747' },
    },
  },
  toxapex: {
    name: ['Toxapex'],
    sources: {
      ps: {},
      serebii: { id: '748' },
      pmd: { id: '0748' },
      pokeapi: { id: '748' },
    },
  },
  mudbray: {
    name: ['Mudbray'],
    sources: {
      ps: {},
      serebii: { id: '749' },
      pmd: { id: '0749' },
      pokeapi: { id: '749' },
    },
  },
  mudsdale: {
    name: ['Mudsdale'],
    sources: {
      ps: { flip: true },
      serebii: { id: '750' },
      pmd: { id: '0750' },
      pokeapi: { id: '750' },
    },
  },
  dewpider: {
    name: ['Dewpider'],
    sources: {
      ps: {},
      serebii: { id: '751' },
      pmd: { id: '0751' },
      pokeapi: { id: '751' },
    },
  },
  araquanid: {
    name: ['Araquanid'],
    sources: {
      ps: { flip: true },
      serebii: { id: '752' },
      pmd: { id: '0752' },
      pokeapi: { id: '752' },
    },
  },
  fomantis: {
    name: ['Fomantis'],
    sources: {
      ps: {},
      serebii: { id: '753' },
      pmd: { id: '0753' },
      pokeapi: { id: '753' },
    },
  },
  lurantis: {
    name: ['Lurantis'],
    sources: {
      ps: {},
      serebii: { id: '754' },
      pmd: { id: '0754' },
      pokeapi: { id: '754' },
    },
  },
  morelull: {
    name: ['Morelull'],
    sources: {
      ps: {},
      serebii: { id: '755' },
      pmd: { id: '0755' },
      pokeapi: { id: '755' },
    },
  },
  shiinotic: {
    name: ['Shiinotic'],
    sources: {
      ps: {},
      serebii: { id: '756' },
      pmd: { id: '0756' },
      pokeapi: { id: '756' },
    },
  },
  salandit: {
    name: ['Salandit'],
    sources: {
      ps: {},
      serebii: { id: '757' },
      pmd: { id: '0757' },
      pokeapi: { id: '757' },
    },
  },
  salazzle: {
    name: ['Salazzle'],
    sources: {
      ps: { flip: true },
      serebii: { id: '758' },
      pmd: { id: '0758' },
      pokeapi: { id: '758' },
    },
  },
  stufful: {
    name: ['Stufful'],
    sources: {
      ps: {},
      serebii: { id: '759' },
      pmd: { id: '0759' },
      pokeapi: { id: '759' },
    },
  },
  bewear: {
    name: ['Bewear'],
    sources: {
      ps: { flip: true },
      serebii: { id: '760' },
      pmd: { id: '0760' },
      pokeapi: { id: '760' },
    },
  },
  bounsweet: {
    name: ['Bounsweet'],
    sources: {
      ps: {},
      serebii: { id: '761' },
      pmd: { id: '0761' },
      pokeapi: { id: '761' },
    },
  },
  steenee: {
    name: ['Steenee'],
    sources: {
      ps: {},
      serebii: { id: '762' },
      pmd: { id: '0762' },
      pokeapi: { id: '762' },
    },
  },
  tsareena: {
    name: ['Tsareena'],
    sources: {
      ps: {},
      serebii: { id: '763' },
      pmd: { id: '0763' },
      pokeapi: { id: '763' },
    },
  },
  comfey: {
    name: ['Comfey'],
    sources: {
      ps: {},
      serebii: { id: '764' },
      pmd: { id: '0764' },
      pokeapi: { id: '764' },
    },
  },
  oranguru: {
    name: ['Oranguru'],
    sources: {
      ps: {},
      serebii: { id: '765' },
      pmd: { id: '0765' },
      pokeapi: { id: '765' },
    },
  },
  passimian: {
    name: ['Passimian'],
    sources: {
      ps: {},
      serebii: { id: '766' },
      pmd: { id: '0766' },
      pokeapi: { id: '766' },
    },
  },
  wimpod: {
    name: ['Wimpod'],
    sources: {
      ps: { flip: true },
      serebii: { id: '767' },
      pmd: { id: '0767' },
      pokeapi: { id: '767' },
    },
  },
  golisopod: {
    name: ['Golisopod'],
    sources: {
      ps: {},
      serebii: { id: '768' },
      pmd: { id: '0768' },
      pokeapi: { id: '768' },
    },
  },
  golisopodmega: {
    name: ['Mega Golisopod', 'Golisopod-Mega'],
    sources: {
      ps: { id: 'golisopod-mega' },
      serebii: { id: '768' },
      pmd: { id: '0768/0001' },
      pokeapi: { id: '10316' },
    },
  },
  sandygast: {
    name: ['Sandygast'],
    sources: {
      ps: {},
      serebii: { id: '769' },
      pmd: { id: '0769' },
      pokeapi: { id: '769' },
    },
  },
  palossand: {
    name: ['Palossand'],
    sources: {
      ps: {},
      serebii: { id: '770' },
      pmd: { id: '0770' },
      pokeapi: { id: '770' },
    },
  },
  pyukumuku: {
    name: ['Pyukumuku'],
    sources: {
      ps: {},
      serebii: { id: '771' },
      pmd: { id: '0771' },
      pokeapi: { id: '771' },
    },
  },
  typenull: {
    name: ['Type: Null'],
    sources: {
      ps: { flip: true },
      serebii: { id: '772' },
      pmd: { id: '0772' },
      pokeapi: { id: '772' },
    },
  },
  silvally: {
    name: ['Silvally'],
    sources: {
      ps: {},
      serebii: { id: '773' },
      pmd: { id: '0773' },
      pokeapi: { id: '773' },
    },
  },
  silvallybug: {
    name: ['Silvally-Bug'],
    sources: {
      ps: { id: 'silvally-bug' },
      serebii: { id: '773-bug' },
      pmd: { id: '0773/0006' },
      pokeapi: { id: '773' },
    },
  },
  silvallydark: {
    name: ['Silvally-Dark'],
    sources: {
      ps: { id: 'silvally-dark' },
      serebii: { id: '773-dark' },
      pmd: { id: '0773/0016' },
      pokeapi: { id: '773' },
    },
  },
  silvallydragon: {
    name: ['Silvally-Dragon'],
    sources: {
      ps: { id: 'silvally-dragon' },
      serebii: { id: '773-dragon' },
      pmd: { id: '0773/0015' },
      pokeapi: { id: '773' },
    },
  },
  silvallyelectric: {
    name: ['Silvally-Electric'],
    sources: {
      ps: { id: 'silvally-electric' },
      serebii: { id: '773-electric' },
      pmd: { id: '0773/0012' },
      pokeapi: { id: '773' },
    },
  },
  silvallyfairy: {
    name: ['Silvally-Fairy'],
    sources: {
      ps: { id: 'silvally-fairy' },
      serebii: { id: '773-fairy' },
      pmd: { id: '0773/0017' },
      pokeapi: { id: '773' },
    },
  },
  silvallyfighting: {
    name: ['Silvally-Fighting'],
    sources: {
      ps: { id: 'silvally-fighting' },
      serebii: { id: '773-fighting' },
      pmd: { id: '0773/0001' },
      pokeapi: { id: '773' },
    },
  },
  silvallyfire: {
    name: ['Silvally-Fire'],
    sources: {
      ps: { id: 'silvally-fire' },
      serebii: { id: '773-fire' },
      pmd: { id: '0773/0009' },
      pokeapi: { id: '773' },
    },
  },
  silvallyflying: {
    name: ['Silvally-Flying'],
    sources: {
      ps: { id: 'silvally-flying' },
      serebii: { id: '773-flying' },
      pmd: { id: '0773/0002' },
      pokeapi: { id: '773' },
    },
  },
  silvallyghost: {
    name: ['Silvally-Ghost'],
    sources: {
      ps: { id: 'silvally-ghost' },
      serebii: { id: '773-ghost' },
      pmd: { id: '0773/0007' },
      pokeapi: { id: '773' },
    },
  },
  silvallygrass: {
    name: ['Silvally-Grass'],
    sources: {
      ps: { id: 'silvally-grass' },
      serebii: { id: '773-grass' },
      pmd: { id: '0773/0011' },
      pokeapi: { id: '773' },
    },
  },
  silvallyground: {
    name: ['Silvally-Ground'],
    sources: {
      ps: { id: 'silvally-ground' },
      serebii: { id: '773-ground' },
      pmd: { id: '0773/0004' },
      pokeapi: { id: '773' },
    },
  },
  silvallyice: {
    name: ['Silvally-Ice'],
    sources: {
      ps: { id: 'silvally-ice' },
      serebii: { id: '773-ice' },
      pmd: { id: '0773/0014' },
      pokeapi: { id: '773' },
    },
  },
  silvallypoison: {
    name: ['Silvally-Poison'],
    sources: {
      ps: { id: 'silvally-poison' },
      serebii: { id: '773-poison' },
      pmd: { id: '0773/0003' },
      pokeapi: { id: '773' },
    },
  },
  silvallypsychic: {
    name: ['Silvally-Psychic'],
    sources: {
      ps: { id: 'silvally-psychic' },
      serebii: { id: '773-psychic' },
      pmd: { id: '0773/0013' },
      pokeapi: { id: '773' },
    },
  },
  silvallyrock: {
    name: ['Silvally-Rock'],
    sources: {
      ps: { id: 'silvally-rock' },
      serebii: { id: '773-rock' },
      pmd: { id: '0773/0005' },
      pokeapi: { id: '773' },
    },
  },
  silvallysteel: {
    name: ['Silvally-Steel'],
    sources: {
      ps: { id: 'silvally-steel' },
      serebii: { id: '773-steel' },
      pmd: { id: '0773/0008' },
      pokeapi: { id: '773' },
    },
  },
  silvallywater: {
    name: ['Silvally-Water'],
    sources: {
      ps: { id: 'silvally-water' },
      serebii: { id: '773-water' },
      pmd: { id: '0773/0010' },
      pokeapi: { id: '773' },
    },
  },
  minior: {
    name: ['Minior'],
    sources: {
      ps: {},
      serebii: { id: '774-b' },
      pmd: { id: '0774' },
      pokeapi: { id: '10136' },
    },
  },
  miniormeteor: {
    name: ['Minior-Meteor'],
    sources: {
      ps: { id: 'minior-meteor' },
      serebii: { id: '774' },
      pmd: { id: '0774' },
      pokeapi: { id: '774' },
    },
  },
  komala: {
    name: ['Komala'],
    sources: {
      ps: {},
      serebii: { id: '775' },
      pmd: { id: '0775' },
      pokeapi: { id: '775' },
    },
  },
  turtonator: {
    name: ['Turtonator'],
    sources: {
      ps: {},
      serebii: { id: '776' },
      pmd: { id: '0776' },
      pokeapi: { id: '776' },
    },
  },
  togedemaru: {
    name: ['Togedemaru'],
    sources: {
      ps: {},
      serebii: { id: '777' },
      pmd: { id: '0777' },
      pokeapi: { id: '777' },
    },
  },
  mimikyu: {
    name: ['Mimikyu'],
    sources: {
      ps: {},
      serebii: { id: '778' },
      pmd: { id: '0778' },
      pokeapi: { id: '778' },
    },
  },
  mimikyubusted: {
    name: ['Mimikyu-Busted'],
    sources: {
      ps: { id: 'mimikyu-busted' },
      serebii: { id: '778-b' },
      pmd: { id: '0778/0001' },
      pokeapi: { id: '778' },
    },
  },
  bruxish: {
    name: ['Bruxish'],
    sources: {
      ps: {},
      serebii: { id: '779' },
      pmd: { id: '0779' },
      pokeapi: { id: '779' },
    },
  },
  drampa: {
    name: ['Drampa'],
    sources: {
      ps: {},
      serebii: { id: '780' },
      pmd: { id: '0780' },
      pokeapi: { id: '780' },
    },
  },
  drampamega: {
    name: ['Mega Drampa', 'Drampa-Mega'],
    sources: {
      ps: { id: 'drampa-mega' },
      serebii: { id: '780' },
      pmd: { id: '0780/0001' },
      pokeapi: { id: '10302' },
    },
  },
  dhelmise: {
    name: ['Dhelmise'],
    sources: {
      ps: {},
      serebii: { id: '781' },
      pmd: { id: '0781' },
      pokeapi: { id: '781' },
    },
  },
  jangmoo: {
    name: ['Jangmo-o'],
    sources: {
      ps: {},
      serebii: { id: '782' },
      pmd: { id: '0782' },
      pokeapi: { id: '782' },
    },
  },
  hakamoo: {
    name: ['Hakamo-o'],
    sources: {
      ps: {},
      serebii: { id: '783' },
      pmd: { id: '0783' },
      pokeapi: { id: '783' },
    },
  },
  kommoo: {
    name: ['Kommo-o'],
    sources: {
      ps: {},
      serebii: { id: '784' },
      pmd: { id: '0784' },
      pokeapi: { id: '784' },
    },
  },
  tapukoko: {
    name: ['Tapu Koko'],
    sources: {
      ps: { flip: true },
      serebii: { id: '785' },
      pmd: { id: '0785' },
      pokeapi: { id: '785' },
    },
  },
  tapulele: {
    name: ['Tapu Lele'],
    sources: {
      ps: {},
      serebii: { id: '786' },
      pmd: { id: '0786' },
      pokeapi: { id: '786' },
    },
  },
  tapubulu: {
    name: ['Tapu Bulu'],
    sources: {
      ps: {},
      serebii: { id: '787' },
      pmd: { id: '0787' },
      pokeapi: { id: '787' },
    },
  },
  tapufini: {
    name: ['Tapu Fini'],
    sources: {
      ps: { flip: true },
      serebii: { id: '788' },
      pmd: { id: '0788' },
      pokeapi: { id: '788' },
    },
  },
  cosmog: {
    name: ['Cosmog'],
    sources: {
      ps: { flip: true },
      serebii: { id: '789' },
      pmd: { id: '0789' },
      pokeapi: { id: '789' },
    },
  },
  cosmoem: {
    name: ['Cosmoem'],
    sources: {
      ps: {},
      serebii: { id: '790' },
      pmd: { id: '0790' },
      pokeapi: { id: '790' },
    },
  },
  solgaleo: {
    name: ['Solgaleo'],
    sources: {
      ps: { flip: true },
      serebii: { id: '791' },
      pmd: { id: '0791' },
      pokeapi: { id: '791' },
    },
  },
  lunala: {
    name: ['Lunala'],
    sources: {
      ps: {},
      serebii: { id: '792' },
      pmd: { id: '0792' },
      pokeapi: { id: '792' },
    },
  },
  nihilego: {
    name: ['Nihilego'],
    sources: {
      ps: {},
      serebii: { id: '793' },
      pmd: { id: '0793' },
      pokeapi: { id: '793' },
    },
  },
  buzzwole: {
    name: ['Buzzwole'],
    sources: {
      ps: {},
      serebii: { id: '794' },
      pmd: { id: '0794' },
      pokeapi: { id: '794' },
    },
  },
  pheromosa: {
    name: ['Pheromosa'],
    sources: {
      ps: {},
      serebii: { id: '795' },
      pmd: { id: '0795' },
      pokeapi: { id: '795' },
    },
  },
  xurkitree: {
    name: ['Xurkitree'],
    sources: {
      ps: {},
      serebii: { id: '796' },
      pmd: { id: '0796' },
      pokeapi: { id: '796' },
    },
  },
  celesteela: {
    name: ['Celesteela'],
    sources: {
      ps: { flip: true },
      serebii: { id: '797' },
      pmd: { id: '0797' },
      pokeapi: { id: '797' },
    },
  },
  kartana: {
    name: ['Kartana'],
    sources: {
      ps: { flip: true },
      serebii: { id: '798' },
      pmd: { id: '0798' },
      pokeapi: { id: '798' },
    },
  },
  guzzlord: {
    name: ['Guzzlord'],
    sources: {
      ps: {},
      serebii: { id: '799' },
      pmd: { id: '0799' },
      pokeapi: { id: '799' },
    },
  },
  necrozma: {
    name: ['Necrozma'],
    sources: {
      ps: {},
      serebii: { id: '800' },
      pmd: { id: '0800' },
      pokeapi: { id: '800' },
    },
  },
  necrozmaduskmane: {
    name: ['Necrozma-Dusk-Mane'],
    sources: {
      ps: { id: 'necrozma-duskmane' },
      serebii: { id: '800-dm' },
      pmd: { id: '0800/0001' },
      pokeapi: { id: '10155' },
    },
  },
  necrozmadawnwings: {
    name: ['Necrozma-Dawn-Wings'],
    sources: {
      ps: { id: 'necrozma-dawnwings', flip: true },
      serebii: { id: '800-dw' },
      pmd: { id: '0800/0002' },
      pokeapi: { id: '10156' },
    },
  },
  necrozmaultra: {
    name: ['Necrozma-Ultra'],
    sources: {
      ps: { id: 'necrozma-ultra', flip: true },
      serebii: { id: '800-u' },
      pmd: { id: '0800/0003' },
      pokeapi: { id: '10157' },
    },
  },
  magearna: {
    name: ['Magearna'],
    sources: {
      ps: {},
      serebii: { id: '801' },
      pmd: { id: '0801' },
      pokeapi: { id: '801' },
    },
  },
  magearnaoriginal: {
    name: ['Magearna-Original'],
    sources: {
      ps: { id: 'magearna-original' },
      serebii: { id: '801-o' },
      pmd: { id: '0801/0001' },
      pokeapi: { id: '10147' },
    },
  },
  magearnamega: {
    name: ['Mega Magearna', 'Magearna-Mega'],
    sources: {
      ps: { id: 'magearna-mega' },
      serebii: { id: '801' },
      pmd: { id: '0801/0002' },
      pokeapi: { id: '10317' },
    },
  },
  magearnaoriginalmega: {
    name: ['Mega Magearna-Original', 'Magearna-Original-Mega'],
    sources: {
      ps: { id: 'magearna-original-mega' },
      serebii: { id: '801-o' },
      pmd: { id: '0801/0003' },
      pokeapi: { id: '10318' },
    },
  },
  marshadow: {
    name: ['Marshadow'],
    sources: {
      ps: {},
      serebii: { id: '802' },
      pmd: { id: '0802' },
      pokeapi: { id: '802' },
    },
  },
  poipole: {
    name: ['Poipole'],
    sources: {
      ps: {},
      serebii: { id: '803' },
      pmd: { id: '0803' },
      pokeapi: { id: '803' },
    },
  },
  naganadel: {
    name: ['Naganadel'],
    sources: {
      ps: {},
      serebii: { id: '804' },
      pmd: { id: '0804' },
      pokeapi: { id: '804' },
    },
  },
  stakataka: {
    name: ['Stakataka'],
    sources: {
      ps: {},
      serebii: { id: '805' },
      pmd: { id: '0805' },
      pokeapi: { id: '805' },
    },
  },
  blacephalon: {
    name: ['Blacephalon'],
    sources: {
      ps: {},
      serebii: { id: '806' },
      pmd: { id: '0806' },
      pokeapi: { id: '806' },
    },
  },
  zeraora: {
    name: ['Zeraora'],
    sources: {
      ps: {},
      serebii: { id: '807' },
      pmd: { id: '0807' },
      pokeapi: { id: '807' },
    },
  },
  zeraoramega: {
    name: ['Mega Zeraora', 'Zeraora-Mega'],
    sources: {
      ps: { id: 'zeraora-mega' },
      serebii: { id: '807' },
      pmd: { id: '0807/0001' },
      pokeapi: { id: '10319' },
    },
  },
  meltan: {
    name: ['Meltan'],
    sources: {
      ps: { flip: true },
      serebii: { id: '808' },
      pmd: { id: '0808' },
      pokeapi: { id: '808' },
    },
  },
  melmetal: {
    name: ['Melmetal'],
    sources: {
      ps: {},
      serebii: { id: '809' },
      pmd: { id: '0809' },
      pokeapi: { id: '809' },
    },
  },
  melmetalgmax: {
    name: ['Melmetal-Gmax'],
    sources: {
      ps: { id: 'melmetal-gmax' },
      serebii: { id: '809-gi' },
      pmd: { id: '0809' },
      pokeapi: { id: '10208' },
    },
  },
  grookey: {
    name: ['Grookey'],
    sources: {
      ps: { flip: true },
      serebii: { id: '810' },
      pmd: { id: '0810' },
      pokeapi: { id: '810' },
    },
  },
  thwackey: {
    name: ['Thwackey'],
    sources: {
      ps: {},
      serebii: { id: '811' },
      pmd: { id: '0811' },
      pokeapi: { id: '811' },
    },
  },
  rillaboom: {
    name: ['Rillaboom'],
    sources: {
      ps: {},
      serebii: { id: '812' },
      pmd: { id: '0812' },
      pokeapi: { id: '812' },
    },
  },
  rillaboomgmax: {
    name: ['Rillaboom-Gmax'],
    sources: {
      ps: { id: 'rillaboom-gmax' },
      serebii: { id: '812-gi' },
      pmd: { id: '0812' },
      pokeapi: { id: '10209' },
    },
  },
  scorbunny: {
    name: ['Scorbunny'],
    sources: {
      ps: {},
      serebii: { id: '813' },
      pmd: { id: '0813' },
      pokeapi: { id: '813' },
    },
  },
  raboot: {
    name: ['Raboot'],
    sources: {
      ps: { flip: true },
      serebii: { id: '814' },
      pmd: { id: '0814' },
      pokeapi: { id: '814' },
    },
  },
  cinderace: {
    name: ['Cinderace'],
    sources: {
      ps: { flip: true },
      serebii: { id: '815' },
      pmd: { id: '0815' },
      pokeapi: { id: '815' },
    },
  },
  cinderacegmax: {
    name: ['Cinderace-Gmax'],
    sources: {
      ps: { id: 'cinderace-gmax' },
      serebii: { id: '815-gi' },
      pmd: { id: '0815' },
      pokeapi: { id: '10210' },
    },
  },
  sobble: {
    name: ['Sobble'],
    sources: {
      ps: {},
      serebii: { id: '816' },
      pmd: { id: '0816' },
      pokeapi: { id: '816' },
    },
  },
  drizzile: {
    name: ['Drizzile'],
    sources: {
      ps: {},
      serebii: { id: '817' },
      pmd: { id: '0817' },
      pokeapi: { id: '817' },
    },
  },
  inteleon: {
    name: ['Inteleon'],
    sources: {
      ps: {},
      serebii: { id: '818' },
      pmd: { id: '0818' },
      pokeapi: { id: '818' },
    },
  },
  inteleongmax: {
    name: ['Inteleon-Gmax'],
    sources: {
      ps: { id: 'inteleon-gmax' },
      serebii: { id: '818-gi' },
      pmd: { id: '0818' },
      pokeapi: { id: '10211' },
    },
  },
  skwovet: {
    name: ['Skwovet'],
    sources: {
      ps: { flip: true },
      serebii: { id: '819' },
      pmd: { id: '0819' },
      pokeapi: { id: '819' },
    },
  },
  greedent: {
    name: ['Greedent'],
    sources: {
      ps: { flip: true },
      serebii: { id: '820' },
      pmd: { id: '0820' },
      pokeapi: { id: '820' },
    },
  },
  rookidee: {
    name: ['Rookidee'],
    sources: {
      ps: { flip: true },
      serebii: { id: '821' },
      pmd: { id: '0821' },
      pokeapi: { id: '821' },
    },
  },
  corvisquire: {
    name: ['Corvisquire'],
    sources: {
      ps: {},
      serebii: { id: '822' },
      pmd: { id: '0822' },
      pokeapi: { id: '822' },
    },
  },
  corviknight: {
    name: ['Corviknight'],
    sources: {
      ps: { flip: true },
      serebii: { id: '823' },
      pmd: { id: '0823' },
      pokeapi: { id: '823' },
    },
  },
  corviknightgmax: {
    name: ['Corviknight-Gmax'],
    sources: {
      ps: { id: 'corviknight-gmax' },
      serebii: { id: '823-gi' },
      pmd: { id: '0823' },
      pokeapi: { id: '10212' },
    },
  },
  blipbug: {
    name: ['Blipbug'],
    sources: {
      ps: {},
      serebii: { id: '824' },
      pmd: { id: '0824' },
      pokeapi: { id: '824' },
    },
  },
  dottler: {
    name: ['Dottler'],
    sources: {
      ps: { flip: true },
      serebii: { id: '825' },
      pmd: { id: '0825' },
      pokeapi: { id: '825' },
    },
  },
  orbeetle: {
    name: ['Orbeetle'],
    sources: {
      ps: {},
      serebii: { id: '826' },
      pmd: { id: '0826' },
      pokeapi: { id: '826' },
    },
  },
  orbeetlegmax: {
    name: ['Orbeetle-Gmax'],
    sources: {
      ps: { id: 'orbeetle-gmax' },
      serebii: { id: '826-gi' },
      pmd: { id: '0826' },
      pokeapi: { id: '10213' },
    },
  },
  orbeetlemega: {
    name: ['Mega Orbeetle', 'Orbeetle-Mega'],
    sources: {
      ps: { id: 'orbeetle-gmax' },
      serebii: { id: '826-gi' },
      pmd: { id: '0826' },
      pokeapi: { id: '10213' },
    },
  },
  nickit: {
    name: ['Nickit'],
    sources: {
      ps: {},
      serebii: { id: '827' },
      pmd: { id: '0827' },
      pokeapi: { id: '827' },
    },
  },
  thievul: {
    name: ['Thievul'],
    sources: {
      ps: {},
      serebii: { id: '828' },
      pmd: { id: '0828' },
      pokeapi: { id: '828' },
    },
  },
  gossifleur: {
    name: ['Gossifleur'],
    sources: {
      ps: {},
      serebii: { id: '829' },
      pmd: { id: '0829' },
      pokeapi: { id: '829' },
    },
  },
  eldegoss: {
    name: ['Eldegoss'],
    sources: {
      ps: {},
      serebii: { id: '830' },
      pmd: { id: '0830' },
      pokeapi: { id: '830' },
    },
  },
  wooloo: {
    name: ['Wooloo'],
    sources: {
      ps: { flip: true },
      serebii: { id: '831' },
      pmd: { id: '0831' },
      pokeapi: { id: '831' },
    },
  },
  dubwool: {
    name: ['Dubwool'],
    sources: {
      ps: { flip: true },
      serebii: { id: '832' },
      pmd: { id: '0832' },
      pokeapi: { id: '832' },
    },
  },
  chewtle: {
    name: ['Chewtle'],
    sources: {
      ps: {},
      serebii: { id: '833' },
      pmd: { id: '0833' },
      pokeapi: { id: '833' },
    },
  },
  drednaw: {
    name: ['Drednaw'],
    sources: {
      ps: {},
      serebii: { id: '834' },
      pmd: { id: '0834' },
      pokeapi: { id: '834' },
    },
  },
  drednawgmax: {
    name: ['Drednaw-Gmax'],
    sources: {
      ps: { id: 'drednaw-gmax' },
      serebii: { id: '834-gi' },
      pmd: { id: '0834' },
      pokeapi: { id: '10214' },
    },
  },
  drednawmega: {
    name: ['Mega Drednaw', 'Drednaw-Mega'],
    sources: {
      ps: { id: 'drednaw-gmax' },
      serebii: { id: '834-gi' },
      pmd: { id: '0834' },
      pokeapi: { id: '10214' },
    },
  },
  yamper: {
    name: ['Yamper'],
    sources: {
      ps: { flip: true },
      serebii: { id: '835' },
      pmd: { id: '0835' },
      pokeapi: { id: '835' },
    },
  },
  boltund: {
    name: ['Boltund'],
    sources: {
      ps: {},
      serebii: { id: '836' },
      pmd: { id: '0836' },
      pokeapi: { id: '836' },
    },
  },
  rolycoly: {
    name: ['Rolycoly'],
    sources: {
      ps: {},
      serebii: { id: '837' },
      pmd: { id: '0837' },
      pokeapi: { id: '837' },
    },
  },
  carkol: {
    name: ['Carkol'],
    sources: {
      ps: { flip: true },
      serebii: { id: '838' },
      pmd: { id: '0838' },
      pokeapi: { id: '838' },
    },
  },
  coalossal: {
    name: ['Coalossal'],
    sources: {
      ps: {},
      serebii: { id: '839' },
      pmd: { id: '0839' },
      pokeapi: { id: '839' },
    },
  },
  coalossalgmax: {
    name: ['Coalossal-Gmax'],
    sources: {
      ps: { id: 'coalossal-gmax' },
      serebii: { id: '839-gi' },
      pmd: { id: '0839' },
      pokeapi: { id: '10215' },
    },
  },
  coalossalmega: {
    name: ['Mega Coalossal', 'Coalossal-Mega'],
    sources: {
      ps: { id: 'coalossal-gmax' },
      serebii: { id: '839-gi' },
      pmd: { id: '0839' },
      pokeapi: { id: '10215' },
    },
  },
  applin: {
    name: ['Applin'],
    sources: {
      ps: {},
      serebii: { id: '840' },
      pmd: { id: '0840' },
      pokeapi: { id: '840' },
    },
  },
  flapple: {
    name: ['Flapple'],
    sources: {
      ps: {},
      serebii: { id: '841' },
      pmd: { id: '0841' },
      pokeapi: { id: '841' },
    },
  },
  flapplegmax: {
    name: ['Flapple-Gmax'],
    sources: {
      ps: { id: 'flapple-gmax' },
      serebii: { id: '841-gi' },
      pmd: { id: '0841' },
      pokeapi: { id: '10216' },
    },
  },
  flapplemega: {
    name: ['Mega Flapple', 'Flapple-Mega'],
    sources: {
      ps: { id: 'flapple-gmax' },
      serebii: { id: '841-gi' },
      pmd: { id: '0841' },
      pokeapi: { id: '10216' },
    },
  },
  appletun: {
    name: ['Appletun'],
    sources: {
      ps: {},
      serebii: { id: '842' },
      pmd: { id: '0842' },
      pokeapi: { id: '842' },
    },
  },
  appletungmax: {
    name: ['Appletun-Gmax'],
    sources: {
      ps: { id: 'appletun-gmax' },
      serebii: { id: '842-gi' },
      pmd: { id: '0842' },
      pokeapi: { id: '10217' },
    },
  },
  appletunmega: {
    name: ['Mega Appletun', 'Appletun-Mega'],
    sources: {
      ps: { id: 'appletun-gmax' },
      serebii: { id: '842-gi' },
      pmd: { id: '0842' },
      pokeapi: { id: '10217' },
    },
  },
  silicobra: {
    name: ['Silicobra'],
    sources: {
      ps: {},
      serebii: { id: '843' },
      pmd: { id: '0843' },
      pokeapi: { id: '843' },
    },
  },
  sandaconda: {
    name: ['Sandaconda'],
    sources: {
      ps: { flip: true },
      serebii: { id: '844' },
      pmd: { id: '0844' },
      pokeapi: { id: '844' },
    },
  },
  sandacondagmax: {
    name: ['Sandaconda-Gmax'],
    sources: {
      ps: { id: 'sandaconda-gmax', flip: true },
      serebii: { id: '844-gi' },
      pmd: { id: '0844' },
      pokeapi: { id: '10218' },
    },
  },
  sandacondamega: {
    name: ['Mega Sandaconda', 'Sandaconda-Mega'],
    sources: {
      ps: { id: 'sandaconda-gmax', flip: true },
      serebii: { id: '844-gi' },
      pmd: { id: '0844' },
      pokeapi: { id: '10218' },
    },
  },
  cramorant: {
    name: ['Cramorant'],
    sources: {
      ps: {},
      serebii: { id: '845' },
      pmd: { id: '0845' },
      pokeapi: { id: '845' },
    },
  },
  cramorantgulping: {
    name: ['Cramorant-Gulping'],
    sources: {
      ps: { id: 'cramorant-gulping' },
      serebii: { id: '845' },
      pmd: { id: '0845' },
      pokeapi: { id: '10182' },
    },
  },
  cramorantgorging: {
    name: ['Cramorant-Gorging'],
    sources: {
      ps: { id: 'cramorant-gorging' },
      serebii: { id: '845' },
      pmd: { id: '0845' },
      pokeapi: { id: '10183' },
    },
  },
  arrokuda: {
    name: ['Arrokuda'],
    sources: {
      ps: {},
      serebii: { id: '846' },
      pmd: { id: '0846' },
      pokeapi: { id: '846' },
    },
  },
  barraskewda: {
    name: ['Barraskewda'],
    sources: {
      ps: {},
      serebii: { id: '847' },
      pmd: { id: '0847' },
      pokeapi: { id: '847' },
    },
  },
  toxel: {
    name: ['Toxel'],
    sources: {
      ps: {},
      serebii: { id: '848' },
      pmd: { id: '0848' },
      pokeapi: { id: '848' },
    },
  },
  toxtricity: {
    name: ['Toxtricity'],
    sources: {
      ps: {},
      serebii: { id: '849' },
      pmd: { id: '0849' },
      pokeapi: { id: '849' },
    },
  },
  toxtricitylowkey: {
    name: ['Toxtricity-Low-Key'],
    sources: {
      ps: { id: 'toxtricity-lowkey', flip: true },
      serebii: { id: '849-l' },
      pmd: { id: '0849/0001' },
      pokeapi: { id: '10184' },
    },
  },
  toxtricitygmax: {
    name: ['Toxtricity-Gmax'],
    sources: {
      ps: { id: 'toxtricity-gmax' },
      serebii: { id: '849-gi' },
      pmd: { id: '0849' },
      pokeapi: { id: '10219' },
    },
  },
  toxtricitymega: {
    name: ['Mega Toxtricity', 'Toxtricity-Mega'],
    sources: {
      ps: { id: 'toxtricity-gmax' },
      serebii: { id: '849-gi' },
      pmd: { id: '0849' },
      pokeapi: { id: '10219' },
    },
  },
  toxtricitylowkeygmax: {
    name: ['Toxtricity-Low-Key-Gmax'],
    sources: {
      ps: { id: 'toxtricity-gmax' },
      serebii: { id: '849-gi' },
      pmd: { id: '0849' },
      pokeapi: { id: '10228' },
    },
  },
  toxtricitylowkeymega: {
    name: ['Mega Toxtricity-Low-Key', 'Toxtricity-Low-Key-Mega'],
    sources: {
      ps: { id: 'toxtricity-gmax' },
      serebii: { id: '849-gi' },
      pmd: { id: '0849' },
      pokeapi: { id: '10228' },
    },
  },
  sizzlipede: {
    name: ['Sizzlipede'],
    sources: {
      ps: { flip: true },
      serebii: { id: '850' },
      pmd: { id: '0850' },
      pokeapi: { id: '850' },
    },
  },
  centiskorch: {
    name: ['Centiskorch'],
    sources: {
      ps: {},
      serebii: { id: '851' },
      pmd: { id: '0851' },
      pokeapi: { id: '851' },
    },
  },
  centiskorchgmax: {
    name: ['Centiskorch-Gmax'],
    sources: {
      ps: { id: 'centiskorch-gmax' },
      serebii: { id: '851-gi' },
      pmd: { id: '0851' },
      pokeapi: { id: '10220' },
    },
  },
  centiskorchmega: {
    name: ['Mega Centiskorch', 'Centiskorch-Mega'],
    sources: {
      ps: { id: 'centiskorch-gmax' },
      serebii: { id: '851-gi' },
      pmd: { id: '0851' },
      pokeapi: { id: '10220' },
    },
  },
  clobbopus: {
    name: ['Clobbopus'],
    sources: {
      ps: {},
      serebii: { id: '852' },
      pmd: { id: '0852' },
      pokeapi: { id: '852' },
    },
  },
  grapploct: {
    name: ['Grapploct'],
    sources: {
      ps: {},
      serebii: { id: '853' },
      pmd: { id: '0853' },
      pokeapi: { id: '853' },
    },
  },
  sinistea: {
    name: ['Sinistea'],
    sources: {
      ps: { flip: true },
      serebii: { id: '854' },
      pmd: { id: '0854' },
      pokeapi: { id: '854' },
    },
  },
  polteageist: {
    name: ['Polteageist'],
    sources: {
      ps: {},
      serebii: { id: '855' },
      pmd: { id: '0855' },
      pokeapi: { id: '855' },
    },
  },
  hatenna: {
    name: ['Hatenna'],
    sources: {
      ps: {},
      serebii: { id: '856' },
      pmd: { id: '0856' },
      pokeapi: { id: '856' },
    },
  },
  hattrem: {
    name: ['Hattrem'],
    sources: {
      ps: {},
      serebii: { id: '857' },
      pmd: { id: '0857' },
      pokeapi: { id: '857' },
    },
  },
  hatterene: {
    name: ['Hatterene'],
    sources: {
      ps: {},
      serebii: { id: '858' },
      pmd: { id: '0858' },
      pokeapi: { id: '858' },
    },
  },
  hatterenegmax: {
    name: ['Hatterene-Gmax'],
    sources: {
      ps: { id: 'hatterene-gmax', flip: true },
      serebii: { id: '858-gi' },
      pmd: { id: '0858' },
      pokeapi: { id: '10221' },
    },
  },
  impidimp: {
    name: ['Impidimp'],
    sources: {
      ps: {},
      serebii: { id: '859' },
      pmd: { id: '0859' },
      pokeapi: { id: '859' },
    },
  },
  morgrem: {
    name: ['Morgrem'],
    sources: {
      ps: {},
      serebii: { id: '860' },
      pmd: { id: '0860' },
      pokeapi: { id: '860' },
    },
  },
  grimmsnarl: {
    name: ['Grimmsnarl'],
    sources: {
      ps: {},
      serebii: { id: '861' },
      pmd: { id: '0861' },
      pokeapi: { id: '861' },
    },
  },
  grimmsnarlgmax: {
    name: ['Grimmsnarl-Gmax'],
    sources: {
      ps: { id: 'grimmsnarl-gmax' },
      serebii: { id: '861-gi' },
      pmd: { id: '0861' },
      pokeapi: { id: '10222' },
    },
  },
  obstagoon: {
    name: ['Obstagoon'],
    sources: {
      ps: { flip: true },
      serebii: { id: '862' },
      pmd: { id: '0862' },
      pokeapi: { id: '862' },
    },
  },
  perrserker: {
    name: ['Perrserker'],
    sources: {
      ps: { flip: true },
      serebii: { id: '863' },
      pmd: { id: '0863' },
      pokeapi: { id: '863' },
    },
  },
  cursola: {
    name: ['Cursola'],
    sources: {
      ps: { flip: true },
      serebii: { id: '864' },
      pmd: { id: '0864' },
      pokeapi: { id: '864' },
    },
  },
  sirfetchd: {
    name: ['Sirfetch’d'],
    sources: {
      ps: {},
      serebii: { id: '865' },
      pmd: { id: '0865' },
      pokeapi: { id: '865' },
    },
  },
  mrrime: {
    name: ['Mr. Rime'],
    sources: {
      ps: { flip: true },
      serebii: { id: '866' },
      pmd: { id: '0866' },
      pokeapi: { id: '866' },
    },
  },
  runerigus: {
    name: ['Runerigus'],
    sources: {
      ps: {},
      serebii: { id: '867' },
      pmd: { id: '0867' },
      pokeapi: { id: '867' },
    },
  },
  milcery: {
    name: ['Milcery'],
    sources: {
      ps: {},
      serebii: { id: '868' },
      pmd: { id: '0868' },
      pokeapi: { id: '868' },
    },
  },
  alcremie: {
    name: ['Alcremie'],
    sources: {
      ps: { flip: true },
      serebii: { id: '869' },
      pmd: { id: '0869' },
      pokeapi: { id: '869' },
    },
  },
  alcremiegmax: {
    name: ['Alcremie-Gmax'],
    sources: {
      ps: { id: 'alcremie-gmax' },
      serebii: { id: '869-gi' },
      pmd: { id: '0869' },
      pokeapi: { id: '10223' },
    },
  },
  alcremiemega: {
    name: ['Mega Alcremie', 'Alcremie-Mega'],
    sources: {
      ps: { id: 'alcremie-gmax' },
      serebii: { id: '869-gi' },
      pmd: { id: '0869' },
      pokeapi: { id: '10223' },
    },
  },
  falinks: {
    name: ['Falinks'],
    sources: {
      ps: {},
      serebii: { id: '870' },
      pmd: { id: '0870' },
      pokeapi: { id: '870' },
    },
  },
  falinksmega: {
    name: ['Mega Falinks', 'Falinks-Mega'],
    sources: {
      ps: { id: 'falinks-mega' },
      serebii: { id: '870' },
      pmd: { id: '0870' },
      pokeapi: { id: '10303' },
    },
  },
  pincurchin: {
    name: ['Pincurchin'],
    sources: {
      ps: {},
      serebii: { id: '871' },
      pmd: { id: '0871' },
      pokeapi: { id: '871' },
    },
  },
  snom: {
    name: ['Snom'],
    sources: {
      ps: { flip: true },
      serebii: { id: '872' },
      pmd: { id: '0872' },
      pokeapi: { id: '872' },
    },
  },
  frosmoth: {
    name: ['Frosmoth'],
    sources: {
      ps: { flip: true },
      serebii: { id: '873' },
      pmd: { id: '0873' },
      pokeapi: { id: '873' },
    },
  },
  stonjourner: {
    name: ['Stonjourner'],
    sources: {
      ps: {},
      serebii: { id: '874' },
      pmd: { id: '0874' },
      pokeapi: { id: '874' },
    },
  },
  eiscue: {
    name: ['Eiscue'],
    sources: {
      ps: {},
      serebii: { id: '875' },
      pmd: { id: '0875' },
      pokeapi: { id: '875' },
    },
  },
  eiscuenoice: {
    name: ['Eiscue-Noice'],
    sources: {
      ps: { id: 'eiscue-noice' },
      serebii: { id: '875-n' },
      pmd: { id: '0875/0001' },
      pokeapi: { id: '10185' },
    },
  },
  indeedee: {
    name: ['Indeedee'],
    sources: {
      ps: { flip: true },
      serebii: { id: '876' },
      pmd: { id: '0876' },
      pokeapi: { id: '876' },
    },
  },
  indeedeef: {
    name: ['Indeedee-Female', 'Indeedee-F'],
    sources: {
      ps: { id: 'indeedee-f' },
      serebii: { id: '876-f' },
      pmd: { id: '0876/0000/0000/0002' },
      pokeapi: { id: '10186' },
    },
  },
  morpeko: {
    name: ['Morpeko'],
    sources: {
      ps: {},
      serebii: { id: '877' },
      pmd: { id: '0877' },
      pokeapi: { id: '877' },
    },
  },
  morpekohangry: {
    name: ['Morpeko-Hangry'],
    sources: {
      ps: { id: 'morpeko-hangry' },
      serebii: { id: '877-h' },
      pmd: { id: '0877/0001' },
      pokeapi: { id: '10187' },
    },
  },
  cufant: {
    name: ['Cufant'],
    sources: {
      ps: { flip: true },
      serebii: { id: '878' },
      pmd: { id: '0878' },
      pokeapi: { id: '878' },
    },
  },
  copperajah: {
    name: ['Copperajah'],
    sources: {
      ps: {},
      serebii: { id: '879' },
      pmd: { id: '0879' },
      pokeapi: { id: '879' },
    },
  },
  copperajahgmax: {
    name: ['Copperajah-Gmax'],
    sources: {
      ps: { id: 'copperajah-gmax' },
      serebii: { id: '879-gi' },
      pmd: { id: '0879' },
      pokeapi: { id: '10224' },
    },
  },
  copperajahmega: {
    name: ['Mega Copperajah', 'Copperajah-Mega'],
    sources: {
      ps: { id: 'copperajah-gmax' },
      serebii: { id: '879-gi' },
      pmd: { id: '0879' },
      pokeapi: { id: '10224' },
    },
  },
  dracozolt: {
    name: ['Dracozolt'],
    sources: {
      ps: {},
      serebii: { id: '880' },
      pmd: { id: '0880' },
      pokeapi: { id: '880' },
    },
  },
  arctozolt: {
    name: ['Arctozolt'],
    sources: {
      ps: {},
      serebii: { id: '881' },
      pmd: { id: '0881' },
      pokeapi: { id: '881' },
    },
  },
  dracovish: {
    name: ['Dracovish'],
    sources: {
      ps: {},
      serebii: { id: '882' },
      pmd: { id: '0882' },
      pokeapi: { id: '882' },
    },
  },
  arctovish: {
    name: ['Arctovish'],
    sources: {
      ps: {},
      serebii: { id: '883' },
      pmd: { id: '0883' },
      pokeapi: { id: '883' },
    },
  },
  duraludon: {
    name: ['Duraludon'],
    sources: {
      ps: {},
      serebii: { id: '884' },
      pmd: { id: '0884' },
      pokeapi: { id: '884' },
    },
  },
  duraludongmax: {
    name: ['Duraludon-Gmax'],
    sources: {
      ps: { id: 'duraludon-gmax', flip: true },
      serebii: { id: '884-gi' },
      pmd: { id: '0884' },
      pokeapi: { id: '10225' },
    },
  },
  duraludonmega: {
    name: ['Mega Duraludon', 'Duraludon-Mega'],
    sources: {
      ps: { id: 'duraludon-gmax', flip: true },
      serebii: { id: '884-gi' },
      pmd: { id: '0884' },
      pokeapi: { id: '10225' },
    },
  },
  dreepy: {
    name: ['Dreepy'],
    sources: {
      ps: {},
      serebii: { id: '885' },
      pmd: { id: '0885' },
      pokeapi: { id: '885' },
    },
  },
  drakloak: {
    name: ['Drakloak'],
    sources: {
      ps: {},
      serebii: { id: '886' },
      pmd: { id: '0886' },
      pokeapi: { id: '886' },
    },
  },
  dragapult: {
    name: ['Dragapult'],
    sources: {
      ps: {},
      serebii: { id: '887' },
      pmd: { id: '0887' },
      pokeapi: { id: '887' },
    },
  },
  zacian: {
    name: ['Zacian', 'Zacian-Hero'],
    sources: {
      ps: { flip: true },
      serebii: { id: '888' },
      pmd: { id: '0888' },
      pokeapi: { id: '888' },
    },
  },
  zaciancrowned: {
    name: ['Zacian-Crowned'],
    sources: {
      ps: { id: 'zacian-crowned', flip: true },
      serebii: { id: '888-c' },
      pmd: { id: '0888/0001' },
      pokeapi: { id: '10188' },
    },
  },
  zamazenta: {
    name: ['Zamazenta', 'Zamazenta-Hero'],
    sources: {
      ps: {},
      serebii: { id: '889' },
      pmd: { id: '0889' },
      pokeapi: { id: '889' },
    },
  },
  zamazentacrowned: {
    name: ['Zamazenta-Crowned'],
    sources: {
      ps: { id: 'zamazenta-crowned' },
      serebii: { id: '889-c' },
      pmd: { id: '0889/0001' },
      pokeapi: { id: '10189' },
    },
  },
  eternatus: {
    name: ['Eternatus'],
    sources: {
      ps: {},
      serebii: { id: '890' },
      pmd: { id: '0890' },
      pokeapi: { id: '890' },
    },
  },
  eternatuseternamax: {
    name: ['Eternatus-Eternamax'],
    sources: {
      ps: { id: 'eternatus-eternamax' },
      serebii: { id: '890-e' },
      pmd: { id: '0890/0001' },
      pokeapi: { id: '10190' },
    },
  },
  kubfu: {
    name: ['Kubfu'],
    sources: {
      ps: {},
      serebii: { id: '891' },
      pmd: { id: '0891' },
      pokeapi: { id: '891' },
    },
  },
  urshifu: {
    name: ['Urshifu'],
    sources: {
      ps: {},
      serebii: { id: '892' },
      pmd: { id: '0892' },
      pokeapi: { id: '892' },
    },
  },
  urshifurapidstrike: {
    name: ['Urshifu-Rapid-Strike'],
    sources: {
      ps: { id: 'urshifu-rapidstrike', flip: true },
      serebii: { id: '892-r' },
      pmd: { id: '0892/0001' },
      pokeapi: { id: '10191' },
    },
  },
  urshifugmax: {
    name: ['Urshifu-Gmax'],
    sources: {
      ps: { id: 'urshifu-gmax' },
      serebii: { id: '892-gi' },
      pmd: { id: '0892' },
      pokeapi: { id: '10226' },
    },
  },
  urshifurapidstrikegmax: {
    name: ['Urshifu-Rapid-Strike-Gmax'],
    sources: {
      ps: { id: 'urshifu-gmax', flip: true },
      serebii: { id: '892-rgi' },
      pmd: { id: '0892' },
      pokeapi: { id: '10227' },
    },
  },
  zarude: {
    name: ['Zarude'],
    sources: {
      ps: { flip: true },
      serebii: { id: '893' },
      pmd: { id: '0893' },
      pokeapi: { id: '893' },
    },
  },
  zarudedada: {
    name: ['Zarude-Dada'],
    sources: {
      ps: { id: 'zarude-dada', flip: true },
      serebii: { id: '893-d' },
      pmd: { id: '0893/0001' },
      pokeapi: { id: '10192' },
    },
  },
  regieleki: {
    name: ['Regieleki'],
    sources: {
      ps: {},
      serebii: { id: '894' },
      pmd: { id: '0894' },
      pokeapi: { id: '894' },
    },
  },
  regidrago: {
    name: ['Regidrago'],
    sources: {
      ps: { flip: true },
      serebii: { id: '895' },
      pmd: { id: '0895' },
      pokeapi: { id: '895' },
    },
  },
  glastrier: {
    name: ['Glastrier'],
    sources: {
      ps: {},
      serebii: { id: '896' },
      pmd: { id: '0896' },
      pokeapi: { id: '896' },
    },
  },
  spectrier: {
    name: ['Spectrier'],
    sources: {
      ps: {},
      serebii: { id: '897' },
      pmd: { id: '0897' },
      pokeapi: { id: '897' },
    },
  },
  calyrex: {
    name: ['Calyrex'],
    sources: {
      ps: {},
      serebii: { id: '898' },
      pmd: { id: '0898' },
      pokeapi: { id: '898' },
    },
  },
  calyrexice: {
    name: ['Calyrex-Ice'],
    sources: {
      ps: { id: 'calyrex-ice' },
      serebii: { id: '898-i' },
      pmd: { id: '0898' },
      pokeapi: { id: '10193' },
    },
  },
  calyrexshadow: {
    name: ['Calyrex-Shadow'],
    sources: {
      ps: { id: 'calyrex-shadow' },
      serebii: { id: '898-s' },
      pmd: { id: '0898' },
      pokeapi: { id: '10194' },
    },
  },
  wyrdeer: {
    name: ['Wyrdeer'],
    sources: {
      ps: {},
      serebii: { id: '899' },
      pmd: { id: '0899' },
      pokeapi: { id: '899' },
    },
  },
  kleavor: {
    name: ['Kleavor'],
    sources: {
      ps: {},
      serebii: { id: '900' },
      pmd: { id: '0900' },
      pokeapi: { id: '900' },
    },
  },
  ursaluna: {
    name: ['Ursaluna'],
    sources: {
      ps: { flip: true },
      serebii: { id: '901' },
      pmd: { id: '0901' },
      pokeapi: { id: '901' },
    },
  },
  ursalunabloodmoon: {
    name: ['Ursaluna-Bloodmoon'],
    sources: {
      ps: { id: 'ursaluna-bloodmoon' },
      serebii: { id: '901-b' },
      pmd: { id: '0901/0001' },
      pokeapi: { id: '10272' },
    },
  },
  basculegion: {
    name: ['Basculegion'],
    sources: {
      ps: {},
      serebii: { id: '902' },
      pmd: { id: '0902' },
      pokeapi: { id: '902' },
    },
  },
  basculegionf: {
    name: ['Basculegion-Female', 'Basculegion-F'],
    sources: {
      ps: { id: 'basculegion-f' },
      serebii: { id: '902-f' },
      pmd: { id: '0902/0000/0000/0002' },
      pokeapi: { id: '10248' },
    },
  },
  sneasler: {
    name: ['Sneasler'],
    sources: {
      ps: {},
      serebii: { id: '903' },
      pmd: { id: '0903' },
      pokeapi: { id: '903' },
    },
  },
  overqwil: {
    name: ['Overqwil'],
    sources: {
      ps: {},
      serebii: { id: '904' },
      pmd: { id: '0904' },
      pokeapi: { id: '904' },
    },
  },
  enamorus: {
    name: ['Enamorus-Incarnate', 'Enamorus', 'Enamorus-I'],
    sources: {
      ps: { flip: true },
      serebii: { id: '905' },
      pmd: { id: '0905' },
      pokeapi: { id: '905' },
    },
  },
  enamorustherian: {
    name: ['Enamorus-T', 'Enamorus-Therian'],
    sources: {
      ps: { id: 'enamorus-therian' },
      serebii: { id: '905-t' },
      pmd: { id: '0905/0001' },
      pokeapi: { id: '10249' },
    },
  },
  sprigatito: {
    name: ['Sprigatito'],
    sources: {
      ps: {},
      serebii: { id: '906' },
      pmd: { id: '0906' },
      pokeapi: { id: '906' },
    },
  },
  floragato: {
    name: ['Floragato'],
    sources: {
      ps: {},
      serebii: { id: '907' },
      pmd: { id: '0907' },
      pokeapi: { id: '907' },
    },
  },
  meowscarada: {
    name: ['Meowscarada'],
    sources: {
      ps: {},
      serebii: { id: '908' },
      pmd: { id: '0908' },
      pokeapi: { id: '908' },
    },
  },
  fuecoco: {
    name: ['Fuecoco'],
    sources: {
      ps: {},
      serebii: { id: '909' },
      pmd: { id: '0909' },
      pokeapi: { id: '909' },
    },
  },
  crocalor: {
    name: ['Crocalor'],
    sources: {
      ps: {},
      serebii: { id: '910' },
      pmd: { id: '0910' },
      pokeapi: { id: '910' },
    },
  },
  skeledirge: {
    name: ['Skeledirge'],
    sources: {
      ps: {},
      serebii: { id: '911' },
      pmd: { id: '0911' },
      pokeapi: { id: '911' },
    },
  },
  quaxly: {
    name: ['Quaxly'],
    sources: {
      ps: { flip: true },
      serebii: { id: '912' },
      pmd: { id: '0912' },
      pokeapi: { id: '912' },
    },
  },
  quaxwell: {
    name: ['Quaxwell'],
    sources: {
      ps: { flip: true },
      serebii: { id: '913' },
      pmd: { id: '0913' },
      pokeapi: { id: '913' },
    },
  },
  quaquaval: {
    name: ['Quaquaval'],
    sources: {
      ps: { flip: true },
      serebii: { id: '914' },
      pmd: { id: '0914' },
      pokeapi: { id: '914' },
    },
  },
  lechonk: {
    name: ['Lechonk'],
    sources: {
      ps: {},
      serebii: { id: '915' },
      pmd: { id: '0915' },
      pokeapi: { id: '915' },
    },
  },
  oinkologne: {
    name: ['Oinkologne'],
    sources: {
      ps: { flip: true },
      serebii: { id: '916' },
      pmd: { id: '0916' },
      pokeapi: { id: '916' },
    },
  },
  oinkolognef: {
    name: ['Oinkologne-Female', 'Oinkologne-F'],
    sources: {
      ps: { id: 'oinkologne-f' },
      serebii: { id: '916-f' },
      pmd: { id: '0916/0000/0000/0002' },
      pokeapi: { id: '10254' },
    },
  },
  tarountula: {
    name: ['Tarountula'],
    sources: {
      ps: {},
      serebii: { id: '917' },
      pmd: { id: '0917' },
      pokeapi: { id: '917' },
    },
  },
  spidops: {
    name: ['Spidops'],
    sources: {
      ps: {},
      serebii: { id: '918' },
      pmd: { id: '0918' },
      pokeapi: { id: '918' },
    },
  },
  nymble: {
    name: ['Nymble'],
    sources: {
      ps: {},
      serebii: { id: '919' },
      pmd: { id: '0919' },
      pokeapi: { id: '919' },
    },
  },
  lokix: {
    name: ['Lokix'],
    sources: {
      ps: {},
      serebii: { id: '920' },
      pmd: { id: '0920' },
      pokeapi: { id: '920' },
    },
  },
  pawmi: {
    name: ['Pawmi'],
    sources: {
      ps: { flip: true },
      serebii: { id: '921' },
      pmd: { id: '0921' },
      pokeapi: { id: '921' },
    },
  },
  pawmo: {
    name: ['Pawmo'],
    sources: {
      ps: {},
      serebii: { id: '922' },
      pmd: { id: '0922' },
      pokeapi: { id: '922' },
    },
  },
  pawmot: {
    name: ['Pawmot'],
    sources: {
      ps: {},
      serebii: { id: '923' },
      pmd: { id: '0923' },
      pokeapi: { id: '923' },
    },
  },
  tandemaus: {
    name: ['Tandemaus'],
    sources: {
      ps: {},
      serebii: { id: '924' },
      pmd: { id: '0924' },
      pokeapi: { id: '924' },
    },
  },
  maushold: {
    name: ['Maushold'],
    sources: {
      ps: {},
      serebii: { id: '925' },
      pmd: { id: '0925' },
      pokeapi: { id: '925' },
    },
  },
  fidough: {
    name: ['Fidough'],
    sources: {
      ps: {},
      serebii: { id: '926' },
      pmd: { id: '0926' },
      pokeapi: { id: '926' },
    },
  },
  dachsbun: {
    name: ['Dachsbun'],
    sources: {
      ps: {},
      serebii: { id: '927' },
      pmd: { id: '0927' },
      pokeapi: { id: '927' },
    },
  },
  smoliv: {
    name: ['Smoliv'],
    sources: {
      ps: { flip: true },
      serebii: { id: '928' },
      pmd: { id: '0928' },
      pokeapi: { id: '928' },
    },
  },
  dolliv: {
    name: ['Dolliv'],
    sources: {
      ps: { flip: true },
      serebii: { id: '929' },
      pmd: { id: '0929' },
      pokeapi: { id: '929' },
    },
  },
  arboliva: {
    name: ['Arboliva'],
    sources: {
      ps: {},
      serebii: { id: '930' },
      pmd: { id: '0930' },
      pokeapi: { id: '930' },
    },
  },
  squawkabilly: {
    name: ['Squawkabilly'],
    sources: {
      ps: {},
      serebii: { id: '931' },
      pmd: { id: '0931' },
      pokeapi: { id: '931' },
    },
  },
  squawkabillyblue: {
    name: ['Squawkabilly-Blue'],
    sources: {
      ps: { id: 'squawkabilly-blue' },
      serebii: { id: '931-b' },
      pmd: { id: '0931/0001' },
      pokeapi: { id: '10260' },
    },
  },
  squawkabillyyellow: {
    name: ['Squawkabilly-Yellow'],
    sources: {
      ps: { id: 'squawkabilly-yellow' },
      serebii: { id: '931-y' },
      pmd: { id: '0931/0002' },
      pokeapi: { id: '10261' },
    },
  },
  squawkabillywhite: {
    name: ['Squawkabilly-White'],
    sources: {
      ps: { id: 'squawkabilly-white' },
      serebii: { id: '931-w' },
      pmd: { id: '0931/0003' },
      pokeapi: { id: '10262' },
    },
  },
  nacli: {
    name: ['Nacli'],
    sources: {
      ps: {},
      serebii: { id: '932' },
      pmd: { id: '0932' },
      pokeapi: { id: '932' },
    },
  },
  naclstack: {
    name: ['Naclstack'],
    sources: {
      ps: {},
      serebii: { id: '933' },
      pmd: { id: '0933' },
      pokeapi: { id: '933' },
    },
  },
  garganacl: {
    name: ['Garganacl'],
    sources: {
      ps: {},
      serebii: { id: '934' },
      pmd: { id: '0934' },
      pokeapi: { id: '934' },
    },
  },
  charcadet: {
    name: ['Charcadet'],
    sources: {
      ps: {},
      serebii: { id: '935' },
      pmd: { id: '0935' },
      pokeapi: { id: '935' },
    },
  },
  armarouge: {
    name: ['Armarouge'],
    sources: {
      ps: { flip: true },
      serebii: { id: '936' },
      pmd: { id: '0936' },
      pokeapi: { id: '936' },
    },
  },
  ceruledge: {
    name: ['Ceruledge'],
    sources: {
      ps: {},
      serebii: { id: '937' },
      pmd: { id: '0937' },
      pokeapi: { id: '937' },
    },
  },
  tadbulb: {
    name: ['Tadbulb'],
    sources: {
      ps: {},
      serebii: { id: '938' },
      pmd: { id: '0938' },
      pokeapi: { id: '938' },
    },
  },
  bellibolt: {
    name: ['Bellibolt'],
    sources: {
      ps: {},
      serebii: { id: '939' },
      pmd: { id: '0939' },
      pokeapi: { id: '939' },
    },
  },
  wattrel: {
    name: ['Wattrel'],
    sources: {
      ps: {},
      serebii: { id: '940' },
      pmd: { id: '0940' },
      pokeapi: { id: '940' },
    },
  },
  kilowattrel: {
    name: ['Kilowattrel'],
    sources: {
      ps: {},
      serebii: { id: '941' },
      pmd: { id: '0941' },
      pokeapi: { id: '941' },
    },
  },
  maschiff: {
    name: ['Maschiff'],
    sources: {
      ps: {},
      serebii: { id: '942' },
      pmd: { id: '0942' },
      pokeapi: { id: '942' },
    },
  },
  mabosstiff: {
    name: ['Mabosstiff'],
    sources: {
      ps: {},
      serebii: { id: '943' },
      pmd: { id: '0943' },
      pokeapi: { id: '943' },
    },
  },
  shroodle: {
    name: ['Shroodle'],
    sources: {
      ps: {},
      serebii: { id: '944' },
      pmd: { id: '0944' },
      pokeapi: { id: '944' },
    },
  },
  grafaiai: {
    name: ['Grafaiai'],
    sources: {
      ps: {},
      serebii: { id: '945' },
      pmd: { id: '0945' },
      pokeapi: { id: '945' },
    },
  },
  bramblin: {
    name: ['Bramblin'],
    sources: {
      ps: { flip: true },
      serebii: { id: '946' },
      pmd: { id: '0946' },
      pokeapi: { id: '946' },
    },
  },
  brambleghast: {
    name: ['Brambleghast'],
    sources: {
      ps: {},
      serebii: { id: '947' },
      pmd: { id: '0947' },
      pokeapi: { id: '947' },
    },
  },
  toedscool: {
    name: ['Toedscool'],
    sources: {
      ps: {},
      serebii: { id: '948' },
      pmd: { id: '0948' },
      pokeapi: { id: '948' },
    },
  },
  toedscruel: {
    name: ['Toedscruel'],
    sources: {
      ps: {},
      serebii: { id: '949' },
      pmd: { id: '0949' },
      pokeapi: { id: '949' },
    },
  },
  klawf: {
    name: ['Klawf'],
    sources: {
      ps: { flip: true },
      serebii: { id: '950' },
      pmd: { id: '0950' },
      pokeapi: { id: '950' },
    },
  },
  capsakid: {
    name: ['Capsakid'],
    sources: {
      ps: {},
      serebii: { id: '951' },
      pmd: { id: '0951' },
      pokeapi: { id: '951' },
    },
  },
  scovillain: {
    name: ['Scovillain'],
    sources: {
      ps: { flip: true },
      serebii: { id: '952' },
      pmd: { id: '0952' },
      pokeapi: { id: '952' },
    },
  },
  scovillainmega: {
    name: ['Mega Scovillain', 'Scovillain-Mega'],
    sources: {
      ps: { id: 'scovillain-mega', flip: true },
      serebii: { id: '952' },
      pmd: { id: '0952/0001' },
      pokeapi: { id: '10320' },
    },
  },
  rellor: {
    name: ['Rellor'],
    sources: {
      ps: {},
      serebii: { id: '953' },
      pmd: { id: '0953' },
      pokeapi: { id: '953' },
    },
  },
  rabsca: {
    name: ['Rabsca'],
    sources: {
      ps: {},
      serebii: { id: '954' },
      pmd: { id: '0954' },
      pokeapi: { id: '954' },
    },
  },
  flittle: {
    name: ['Flittle'],
    sources: {
      ps: { flip: true },
      serebii: { id: '955' },
      pmd: { id: '0955' },
      pokeapi: { id: '955' },
    },
  },
  espathra: {
    name: ['Espathra'],
    sources: {
      ps: {},
      serebii: { id: '956' },
      pmd: { id: '0956' },
      pokeapi: { id: '956' },
    },
  },
  tinkatink: {
    name: ['Tinkatink'],
    sources: {
      ps: {},
      serebii: { id: '957' },
      pmd: { id: '0957' },
      pokeapi: { id: '957' },
    },
  },
  tinkatuff: {
    name: ['Tinkatuff'],
    sources: {
      ps: {},
      serebii: { id: '958' },
      pmd: { id: '0958' },
      pokeapi: { id: '958' },
    },
  },
  tinkaton: {
    name: ['Tinkaton'],
    sources: {
      ps: {},
      serebii: { id: '959' },
      pmd: { id: '0959' },
      pokeapi: { id: '959' },
    },
  },
  wiglett: {
    name: ['Wiglett'],
    sources: {
      ps: {},
      serebii: { id: '960' },
      pmd: { id: '0960' },
      pokeapi: { id: '960' },
    },
  },
  wugtrio: {
    name: ['Wugtrio'],
    sources: {
      ps: { flip: true },
      serebii: { id: '961' },
      pmd: { id: '0961' },
      pokeapi: { id: '961' },
    },
  },
  bombirdier: {
    name: ['Bombirdier'],
    sources: {
      ps: {},
      serebii: { id: '962' },
      pmd: { id: '0962' },
      pokeapi: { id: '962' },
    },
  },
  finizen: {
    name: ['Finizen'],
    sources: {
      ps: {},
      serebii: { id: '963' },
      pmd: { id: '0963' },
      pokeapi: { id: '963' },
    },
  },
  palafin: {
    name: ['Palafin'],
    sources: {
      ps: {},
      serebii: { id: '964' },
      pmd: { id: '0964' },
      pokeapi: { id: '964' },
    },
  },
  palafinhero: {
    name: ['Palafin-Hero'],
    sources: {
      ps: { id: 'palafin-hero' },
      serebii: { id: '964-h' },
      pmd: { id: '0964/0001' },
      pokeapi: { id: '10256' },
    },
  },
  varoom: {
    name: ['Varoom'],
    sources: {
      ps: {},
      serebii: { id: '965' },
      pmd: { id: '0965' },
      pokeapi: { id: '965' },
    },
  },
  revavroom: {
    name: ['Revavroom'],
    sources: {
      ps: {},
      serebii: { id: '966' },
      pmd: { id: '0966' },
      pokeapi: { id: '966' },
    },
  },
  cyclizar: {
    name: ['Cyclizar'],
    sources: {
      ps: { flip: true },
      serebii: { id: '967' },
      pmd: { id: '0967' },
      pokeapi: { id: '967' },
    },
  },
  orthworm: {
    name: ['Orthworm'],
    sources: {
      ps: {},
      serebii: { id: '968' },
      pmd: { id: '0968' },
      pokeapi: { id: '968' },
    },
  },
  glimmet: {
    name: ['Glimmet'],
    sources: {
      ps: { flip: true },
      serebii: { id: '969' },
      pmd: { id: '0969' },
      pokeapi: { id: '969' },
    },
  },
  glimmora: {
    name: ['Glimmora'],
    sources: {
      ps: { flip: true },
      serebii: { id: '970' },
      pmd: { id: '0970' },
      pokeapi: { id: '970' },
    },
  },
  glimmoramega: {
    name: ['Mega Glimmora', 'Glimmora-Mega'],
    sources: {
      ps: { id: 'glimmora-mega', flip: true },
      serebii: { id: '970' },
      pmd: { id: '0970/0001' },
      pokeapi: { id: '10321' },
    },
  },
  greavard: {
    name: ['Greavard'],
    sources: {
      ps: {},
      serebii: { id: '971' },
      pmd: { id: '0971' },
      pokeapi: { id: '971' },
    },
  },
  houndstone: {
    name: ['Houndstone'],
    sources: {
      ps: {},
      serebii: { id: '972' },
      pmd: { id: '0972' },
      pokeapi: { id: '972' },
    },
  },
  flamigo: {
    name: ['Flamigo'],
    sources: {
      ps: {},
      serebii: { id: '973' },
      pmd: { id: '0973' },
      pokeapi: { id: '973' },
    },
  },
  cetoddle: {
    name: ['Cetoddle'],
    sources: {
      ps: {},
      serebii: { id: '974' },
      pmd: { id: '0974' },
      pokeapi: { id: '974' },
    },
  },
  cetitan: {
    name: ['Cetitan'],
    sources: {
      ps: {},
      serebii: { id: '975' },
      pmd: { id: '0975' },
      pokeapi: { id: '975' },
    },
  },
  veluza: {
    name: ['Veluza'],
    sources: {
      ps: {},
      serebii: { id: '976' },
      pmd: { id: '0976' },
      pokeapi: { id: '976' },
    },
  },
  dondozo: {
    name: ['Dondozo'],
    sources: {
      ps: {},
      serebii: { id: '977' },
      pmd: { id: '0977' },
      pokeapi: { id: '977' },
    },
  },
  tatsugiri: {
    name: ['Tatsugiri'],
    sources: {
      ps: { flip: true },
      serebii: { id: '978' },
      pmd: { id: '0978' },
      pokeapi: { id: '978' },
    },
  },
  tatsugiridroopy: {
    name: ['Tatsugiri-Droopy'],
    sources: {
      ps: { id: 'tatsugiri-droopy', flip: true },
      serebii: { id: '978' },
      pmd: { id: '0978' },
      pokeapi: { id: '10258' },
    },
  },
  tatsugiristretchy: {
    name: ['Tatsugiri-Stretchy'],
    sources: {
      ps: { id: 'tatsugiri-stretchy', flip: true },
      serebii: { id: '978' },
      pmd: { id: '0978' },
      pokeapi: { id: '10259' },
    },
  },
  tatsugiricurlymega: {
    name: ['Mega Tatsugiri', 'Tatsugiri-Mega'],
    sources: {
      ps: { id: 'tatsugiri-mega', flip: true },
      serebii: { id: '978' },
      pmd: { id: '0978/0003' },
      pokeapi: { id: '978' },
    },
  },
  annihilape: {
    name: ['Annihilape'],
    sources: {
      ps: {},
      serebii: { id: '979' },
      pmd: { id: '0979' },
      pokeapi: { id: '979' },
    },
  },
  clodsire: {
    name: ['Clodsire'],
    sources: {
      ps: {},
      serebii: { id: '980' },
      pmd: { id: '0980' },
      pokeapi: { id: '980' },
    },
  },
  farigiraf: {
    name: ['Farigiraf'],
    sources: {
      ps: { flip: true },
      serebii: { id: '981' },
      pmd: { id: '0981' },
      pokeapi: { id: '981' },
    },
  },
  dudunsparce: {
    name: ['Dudunsparce'],
    sources: {
      ps: {},
      serebii: { id: '982' },
      pmd: { id: '0982' },
      pokeapi: { id: '982' },
    },
  },
  dudunsparcethreesegment: {
    name: ['Dudunsparce-Three-Segment'],
    sources: {
      ps: { id: 'dudunsparce-threesegment' },
      serebii: { id: '982-t' },
      pmd: { id: '0982/0001' },
      pokeapi: { id: '10255' },
    },
  },
  kingambit: {
    name: ['Kingambit'],
    sources: {
      ps: {},
      serebii: { id: '983' },
      pmd: { id: '0983' },
      pokeapi: { id: '983' },
    },
  },
  greattusk: {
    name: ['Great Tusk'],
    sources: {
      ps: {},
      serebii: { id: '984' },
      pmd: { id: '0984' },
      pokeapi: { id: '984' },
    },
  },
  screamtail: {
    name: ['Scream Tail'],
    sources: {
      ps: { flip: true },
      serebii: { id: '985' },
      pmd: { id: '0985' },
      pokeapi: { id: '985' },
    },
  },
  brutebonnet: {
    name: ['Brute Bonnet'],
    sources: {
      ps: {},
      serebii: { id: '986' },
      pmd: { id: '0986' },
      pokeapi: { id: '986' },
    },
  },
  fluttermane: {
    name: ['Flutter Mane'],
    sources: {
      ps: {},
      serebii: { id: '987' },
      pmd: { id: '0987' },
      pokeapi: { id: '987' },
    },
  },
  slitherwing: {
    name: ['Slither Wing'],
    sources: {
      ps: {},
      serebii: { id: '988' },
      pmd: { id: '0988' },
      pokeapi: { id: '988' },
    },
  },
  sandyshocks: {
    name: ['Sandy Shocks'],
    sources: {
      ps: {},
      serebii: { id: '989' },
      pmd: { id: '0989' },
      pokeapi: { id: '989' },
    },
  },
  irontreads: {
    name: ['Iron Treads'],
    sources: {
      ps: {},
      serebii: { id: '990' },
      pmd: { id: '0990' },
      pokeapi: { id: '990' },
    },
  },
  ironbundle: {
    name: ['Iron Bundle'],
    sources: {
      ps: {},
      serebii: { id: '991' },
      pmd: { id: '0991' },
      pokeapi: { id: '991' },
    },
  },
  ironhands: {
    name: ['Iron Hands'],
    sources: {
      ps: {},
      serebii: { id: '992' },
      pmd: { id: '0992' },
      pokeapi: { id: '992' },
    },
  },
  ironjugulis: {
    name: ['Iron Jugulis'],
    sources: {
      ps: {},
      serebii: { id: '993' },
      pmd: { id: '0993' },
      pokeapi: { id: '993' },
    },
  },
  ironmoth: {
    name: ['Iron Moth'],
    sources: {
      ps: {},
      serebii: { id: '994' },
      pmd: { id: '0994' },
      pokeapi: { id: '994' },
    },
  },
  ironthorns: {
    name: ['Iron Thorns'],
    sources: {
      ps: {},
      serebii: { id: '995' },
      pmd: { id: '0995' },
      pokeapi: { id: '995' },
    },
  },
  frigibax: {
    name: ['Frigibax'],
    sources: {
      ps: {},
      serebii: { id: '996' },
      pmd: { id: '0996' },
      pokeapi: { id: '996' },
    },
  },
  arctibax: {
    name: ['Arctibax'],
    sources: {
      ps: {},
      serebii: { id: '997' },
      pmd: { id: '0997' },
      pokeapi: { id: '997' },
    },
  },
  baxcalibur: {
    name: ['Baxcalibur'],
    sources: {
      ps: {},
      serebii: { id: '998' },
      pmd: { id: '0998' },
      pokeapi: { id: '998' },
    },
  },
  baxcaliburmega: {
    name: ['Mega Baxcalibur', 'Baxcalibur-Mega'],
    sources: {
      ps: { id: 'baxcalibur-mega' },
      serebii: { id: '998' },
      pmd: { id: '0998/0001' },
      pokeapi: { id: '10325' },
    },
  },
  gimmighoul: {
    name: ['Gimmighoul'],
    sources: {
      ps: {},
      serebii: { id: '999' },
      pmd: { id: '0999' },
      pokeapi: { id: '999' },
    },
  },
  gimmighoulroaming: {
    name: ['Gimmighoul-Roaming'],
    sources: {
      ps: { id: 'gimmighoul-roaming' },
      serebii: { id: '999-r' },
      pmd: { id: '0999/0001' },
      pokeapi: { id: '10263' },
    },
  },
  gholdengo: {
    name: ['Gholdengo'],
    sources: {
      ps: {},
      serebii: { id: '1000' },
      pmd: { id: '1000' },
      pokeapi: { id: '1000' },
    },
  },
  wochien: {
    name: ['Wo-Chien'],
    sources: {
      ps: {},
      serebii: { id: '1001' },
      pmd: { id: '1001' },
      pokeapi: { id: '1001' },
    },
  },
  chienpao: {
    name: ['Chien-Pao'],
    sources: {
      ps: {},
      serebii: { id: '1002' },
      pmd: { id: '1002' },
      pokeapi: { id: '1002' },
    },
  },
  tinglu: {
    name: ['Ting-Lu'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1003' },
      pmd: { id: '1003' },
      pokeapi: { id: '1003' },
    },
  },
  chiyu: {
    name: ['Chi-Yu'],
    sources: {
      ps: {},
      serebii: { id: '1004' },
      pmd: { id: '1004' },
      pokeapi: { id: '1004' },
    },
  },
  roaringmoon: {
    name: ['Roaring Moon'],
    sources: {
      ps: {},
      serebii: { id: '1005' },
      pmd: { id: '1005' },
      pokeapi: { id: '1005' },
    },
  },
  ironvaliant: {
    name: ['Iron Valiant'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1006' },
      pmd: { id: '1006' },
      pokeapi: { id: '1006' },
    },
  },
  koraidon: {
    name: ['Koraidon'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1007' },
      pmd: { id: '1007' },
      pokeapi: { id: '1007' },
    },
  },
  miraidon: {
    name: ['Miraidon'],
    sources: {
      ps: {},
      serebii: { id: '1008' },
      pmd: { id: '1008' },
      pokeapi: { id: '1008' },
    },
  },
  walkingwake: {
    name: ['Walking Wake'],
    sources: {
      ps: {},
      serebii: { id: '1009' },
      pmd: { id: '1009' },
      pokeapi: { id: '1009' },
    },
  },
  ironleaves: {
    name: ['Iron Leaves'],
    sources: {
      ps: {},
      serebii: { id: '1010' },
      pmd: { id: '1010' },
      pokeapi: { id: '1010' },
    },
  },
  dipplin: {
    name: ['Dipplin'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1011' },
      pmd: { id: '1011' },
      pokeapi: { id: '1011' },
    },
  },
  poltchageist: {
    name: ['Poltchageist'],
    sources: {
      ps: {},
      serebii: { id: '1012' },
      pmd: { id: '1012' },
      pokeapi: { id: '1012' },
    },
  },
  sinistcha: {
    name: ['Sinistcha'],
    sources: {
      ps: {},
      serebii: { id: '1013' },
      pmd: { id: '1013' },
      pokeapi: { id: '1013' },
    },
  },
  okidogi: {
    name: ['Okidogi'],
    sources: {
      ps: {},
      serebii: { id: '1014' },
      pmd: { id: '1014' },
      pokeapi: { id: '1014' },
    },
  },
  munkidori: {
    name: ['Munkidori'],
    sources: {
      ps: {},
      serebii: { id: '1015' },
      pmd: { id: '1015' },
      pokeapi: { id: '1015' },
    },
  },
  fezandipiti: {
    name: ['Fezandipiti'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1016' },
      pmd: { id: '1016' },
      pokeapi: { id: '1016' },
    },
  },
  ogerpon: {
    name: ['Ogerpon'],
    sources: {
      ps: {},
      serebii: { id: '1017' },
      pmd: { id: '1017/0004' },
      pokeapi: { id: '1017' },
    },
  },
  ogerponwellspring: {
    name: ['Ogerpon-Wellspring'],
    sources: {
      ps: { id: 'ogerpon-wellspring' },
      serebii: { id: '1017-w' },
      pmd: { id: '1017/0005' },
      pokeapi: { id: '10273' },
    },
  },
  ogerponhearthflame: {
    name: ['Ogerpon-Hearthflame'],
    sources: {
      ps: { id: 'ogerpon-hearthflame' },
      serebii: { id: '1017-h' },
      pmd: { id: '1017/0006' },
      pokeapi: { id: '10274' },
    },
  },
  ogerponcornerstone: {
    name: ['Ogerpon-Cornerstone'],
    sources: {
      ps: { id: 'ogerpon-cornerstone' },
      serebii: { id: '1017-c' },
      pmd: { id: '1017/0007' },
      pokeapi: { id: '10275' },
    },
  },
  ogerpontealetera: {
    name: ['Ogerpon-Teal-Tera'],
    sources: {
      ps: { id: 'ogerpon-tealtera' },
      serebii: { id: '1017-c' },
      pmd: { id: '1017/0008' },
      pokeapi: { id: '1017' },
    },
  },
  ogerponwellspringtera: {
    name: ['Ogerpon-Wellspring-Tera'],
    sources: {
      ps: { id: 'ogerpon-wellspringtera' },
      serebii: { id: '1017-w' },
      pmd: { id: '1017/0005' },
      pokeapi: { id: '10273' },
    },
  },
  ogerponhearthflametera: {
    name: ['Ogerpon-Hearthflame-Tera'],
    sources: {
      ps: { id: 'ogerpon-hearthflametera' },
      serebii: { id: '1017-h' },
      pmd: { id: '1017/0006' },
      pokeapi: { id: '10274' },
    },
  },
  ogerponcornerstonetera: {
    name: ['Ogerpon-Cornerstone-Tera'],
    sources: {
      ps: { id: 'ogerpon-cornerstonetera' },
      serebii: { id: '1017-c' },
      pmd: { id: '1017/0007' },
      pokeapi: { id: '10275' },
    },
  },
  archaludon: {
    name: ['Archaludon'],
    sources: {
      ps: {},
      serebii: { id: '1018' },
      pmd: { id: '1018' },
      pokeapi: { id: '1018' },
    },
  },
  hydrapple: {
    name: ['Hydrapple'],
    sources: {
      ps: {},
      serebii: { id: '1019' },
      pmd: { id: '1019' },
      pokeapi: { id: '1019' },
    },
  },
  gougingfire: {
    name: ['Gouging Fire'],
    sources: {
      ps: {},
      serebii: { id: '1020' },
      pmd: { id: '1020' },
      pokeapi: { id: '1020' },
    },
  },
  ragingbolt: {
    name: ['Raging Bolt'],
    sources: {
      ps: {},
      serebii: { id: '1021' },
      pmd: { id: '1021' },
      pokeapi: { id: '1021' },
    },
  },
  ironboulder: {
    name: ['Iron Boulder'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1022' },
      pmd: { id: '1022' },
      pokeapi: { id: '1022' },
    },
  },
  ironcrown: {
    name: ['Iron Crown'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1023' },
      pmd: { id: '1023' },
      pokeapi: { id: '1023' },
    },
  },
  terapagos: {
    name: ['Terapagos'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1024' },
      pmd: { id: '1024' },
      pokeapi: { id: '1024' },
    },
  },
  terapagosterastal: {
    name: ['Terapagos-Terastal'],
    sources: {
      ps: { id: 'terapagos-terastal', flip: true },
      serebii: { id: '1024-t' },
      pmd: { id: '1024/0001' },
      pokeapi: { id: '10276' },
    },
  },
  terapagosstellar: {
    name: ['Terapagos-Stellar'],
    sources: {
      ps: { id: 'terapagos-stellar', flip: true },
      serebii: { id: '1024-s' },
      pmd: { id: '1024/0002' },
      pokeapi: { id: '10277' },
    },
  },
  pecharunt: {
    name: ['Pecharunt'],
    sources: {
      ps: {},
      serebii: { id: '1025' },
      pmd: { id: '1025' },
      pokeapi: { id: '1025' },
    },
  },
  chillet: { name: ['Chillet'], sources: { rr: {} }, default: 'rr' },
  syclar: { name: ['Syclar'], sources: { ps: {} }, default: 'bw' },
  syclant: { name: ['Syclant'], sources: { ps: {} }, default: 'bw' },
  revenankh: { name: ['Revenankh'], sources: { ps: {} }, default: 'bw' },
  embirch: { name: ['Embirch'], sources: { ps: {} }, default: 'bw' },
  flarelm: { name: ['Flarelm'], sources: { ps: {} }, default: 'bw' },
  pyroak: { name: ['Pyroak'], sources: { ps: {} }, default: 'bw' },
  breezi: {
    name: ['Breezi'],
    sources: { ps: {} },
    default: 'bw',
  },
  fidgit: { name: ['Fidgit'], sources: { ps: {} }, default: 'bw' },
  rebble: { name: ['Rebble'], sources: { ps: {} }, default: 'bw' },
  tactite: { name: ['Tactite'], sources: { ps: {} }, default: 'bw' },
  stratagem: { name: ['Stratagem'], sources: { ps: {} }, default: 'bw' },
  privatyke: { name: ['Privatyke'], sources: { ps: {} }, default: 'bw' },
  arghonaut: { name: ['Arghonaut'], sources: { ps: {} }, default: 'bw' },
  kitsunoh: { name: ['Kitsunoh'], sources: { ps: {} }, default: 'bw' },
  cyclohm: { name: ['Cyclohm'], sources: { ps: {} }, default: 'bw' },
  colossoil: { name: ['Colossoil'], sources: { ps: {} }, default: 'bw' },
  krilowatt: { name: ['Krilowatt'], sources: { ps: {} }, default: 'bw' },
  voodoll: { name: ['Voodoll'], sources: { ps: {} }, default: 'bw' },
  voodoom: { name: ['Voodoom'], sources: { ps: {} }, default: 'bw' },
  scratchet: { name: ['Scratchet'], sources: { ps: {} }, default: 'bw' },
  tomohawk: { name: ['Tomohawk'], sources: { ps: {} }, default: 'bw' },
  necturine: { name: ['Necturine'], sources: { ps: {} }, default: 'bw' },
  necturna: { name: ['Necturna'], sources: { ps: {} }, default: 'bw' },
  mollux: { name: ['Mollux'], sources: { ps: {} }, default: 'bw' },
  cupra: { name: ['Cupra'], sources: { ps: {} }, default: 'bw' },
  argalis: { name: ['Argalis'], sources: { ps: {} }, default: 'bw' },
  aurumoth: { name: ['Aurumoth'], sources: { ps: {} }, default: 'bw' },
  brattler: { name: ['Brattler'], sources: { ps: {} }, default: 'bw' },
  malaconda: { name: ['Malaconda'], sources: { ps: {} }, default: 'bw' },
  cawdet: { name: ['Cawdet'], sources: { ps: {} }, default: 'bw' },
  cawmodore: { name: ['Cawmodore'], sources: { ps: {} }, default: 'bw' },
  volkritter: { name: ['Volkritter'], sources: { ps: {} }, default: 'bw' },
  volkraken: { name: ['Volkraken'], sources: { ps: {} }, default: 'bw' },
  snugglow: { name: ['Snugglow'], sources: { ps: {} }, default: 'bw' },
  plasmanta: { name: ['Plasmanta'], sources: { ps: {} }, default: 'bw' },
  floatoy: { name: ['Floatoy'], sources: { ps: {} }, default: 'bw' },
  caimanoe: { name: ['Caimanoe'], sources: { ps: {} }, default: 'bw' },
  naviathan: { name: ['Naviathan'], sources: { ps: {} }, default: 'bw' },
  crucibelle: { name: ['Crucibelle'], sources: { ps: {} }, default: 'bw' },
  crucibellemega: {
    name: ['Mega Crucibelle', 'Crucibelle-Mega'],
    sources: { ps: { id: 'crucibelle-mega' } },
    default: 'bw',
  },
  pluffle: { name: ['Pluffle'], sources: { ps: {} }, default: 'bw' },
  kerfluffle: { name: ['Kerfluffle'], sources: { ps: {} }, default: 'bw' },
  pajantom: { name: ['Pajantom'], sources: { ps: {} }, default: 'bw' },
  mumbao: { name: ['Mumbao'], sources: { ps: {} }, default: 'bw' },
  jumbao: { name: ['Jumbao'], sources: { ps: {} }, default: 'bw' },
  fawnifer: { name: ['Fawnifer'], sources: { ps: {} }, default: 'bw' },
  electrelk: { name: ['Electrelk'], sources: { ps: {} }, default: 'bw' },
  caribolt: { name: ['Caribolt'], sources: { ps: {} }, default: 'bw' },
  smogecko: { name: ['Smogecko'], sources: { ps: {} }, default: 'bw' },
  smoguana: { name: ['Smoguana'], sources: { ps: {} }, default: 'bw' },
  smokomodo: { name: ['Smokomodo'], sources: { ps: {} }, default: 'bw' },
  swirlpool: { name: ['Swirlpool'], sources: { ps: {} }, default: 'bw' },
  coribalis: { name: ['Coribalis'], sources: { ps: {} }, default: 'bw' },
  snaelstrom: { name: ['Snaelstrom'], sources: { ps: {} }, default: 'bw' },
  justyke: { name: ['Justyke'], sources: { ps: {} }, default: 'bw' },
  equilibra: { name: ['Equilibra'], sources: { ps: {} }, default: 'bw' },
  solotl: { name: ['Solotl'], sources: { ps: {} }, default: 'bw' },
  astrolotl: { name: ['Astrolotl'], sources: { ps: {} }, default: 'bw' },
  miasmite: { name: ['Miasmite'], sources: { ps: {} }, default: 'bw' },
  miasmaw: { name: ['Miasmaw'], sources: { ps: {} }, default: 'bw' },
  chromera: { name: ['Chromera'], sources: { ps: {} }, default: 'bw' },
  nohface: { name: ['Nohface'], sources: { ps: {} }, default: 'bw' },
  monohm: { name: ['Monohm'], sources: { ps: {} }, default: 'bw' },
  duohm: { name: ['Duohm'], sources: { ps: {} }, default: 'bw' },
  dorsoil: { name: ['Dorsoil'], sources: { ps: {} }, default: 'bw' },
  protowatt: { name: ['Protowatt'], sources: { ps: {} }, default: 'bw' },
  venomicon: { name: ['Venomicon'], sources: { ps: {} }, default: 'bw' },
  venomiconepilogue: {
    name: ['Venomicon-Epilogue'],
    sources: { ps: { id: 'venomicon-epilogue' } },
    default: 'bw',
  },
  saharascal: { name: ['Saharascal'], sources: { ps: {} }, default: 'bw' },
  saharaja: { name: ['Saharaja'], sources: { ps: {} }, default: 'bw' },
  ababo: { name: ['Ababo'], sources: { ps: {} }, default: 'bw' },
  scattervein: { name: ['Scattervein'], sources: { ps: {} }, default: 'bw' },
  hemogoblin: { name: ['Hemogoblin'], sources: { ps: {} }, default: 'bw' },
  cresceidon: { name: ['Cresceidon'], sources: { ps: {} }, default: 'bw' },
  chuggon: { name: ['Chuggon'], sources: { ps: {} }, default: 'bw' },
  draggalong: { name: ['Draggalong'], sources: { ps: {} }, default: 'bw' },
  chuggalong: { name: ['Chuggalong'], sources: { ps: {} }, default: 'bw' },
  shox: { name: ['Shox'], sources: { ps: {} }, default: 'bw' },
  ramnarokradiant: {
    name: ['Ramnarok-Radiant'],
    sources: { ps: { id: 'ramnarok-radiant' } },
    default: 'bw',
  },
  ramnarok: { name: ['Ramnarok'], sources: { ps: {} }, default: 'bw' },
  doduosevii: {
    name: ['Doduo-Sevii'],
    sources: { rr: { id: 'doduo-sevii' } },
    default: 'rr',
  },
  dodriosevii: {
    name: ['Dodrio-Sevii'],
    sources: { rr: { id: 'dodrio-sevii' } },
    default: 'rr',
  },
  teddiursasevii: {
    name: ['Teddiursa-Sevii'],
    sources: { rr: { id: 'teddiursa-sevii' } },
    default: 'rr',
  },
  ursaringsevii: {
    name: ['Ursaring-Sevii'],
    sources: { rr: { id: 'ursaring-sevii' } },
    default: 'rr',
  },
  mantinesevii: {
    name: ['Mantine-Sevii'],
    sources: { rr: { id: 'mantine-sevii' } },
    default: 'rr',
  },
  feebassevii: {
    name: ['Feebas-Sevii'],
    sources: { rr: { id: 'feebas-sevii', flip: true } },
    default: 'rr',
  },
  miloticsevii: {
    name: ['Milotic-Sevii'],
    sources: { rr: { id: 'milotic-sevii' } },
    default: 'rr',
  },
  carnivinesevii: {
    name: ['Carnivine-Sevii'],
    sources: { rr: { id: 'carnivine-sevii' } },
    default: 'rr',
  },
  mantykesevii: {
    name: ['Mantyke-Sevii'],
    sources: { rr: { id: 'mantyke-sevii' } },
    default: 'rr',
  },
  blitzlesevii: {
    name: ['Blitzle-Sevii'],
    sources: { rr: { id: 'blitzle-sevii' } },
    default: 'rr',
  },
  zebstrikasevii: {
    name: ['Zebstrika-Sevii'],
    sources: { rr: { id: 'zebstrika-sevii' } },
    default: 'rr',
  },
  claunchersevii: {
    name: ['Clauncher-Sevii'],
    sources: { rr: { id: 'clauncher-sevii' } },
    default: 'rr',
  },
  clawitzersevii: {
    name: ['Clawitzer-Sevii'],
    sources: { rr: { id: 'clawitzer-sevii' } },
    default: 'rr',
  },
  wishiwashisevii: {
    name: ['Wishiwashi-Sevii'],
    sources: { rr: { id: 'wishiwashi-sevii' } },
    default: 'rr',
  },
  dhelmisesevii: {
    name: ['Dhelmise-Sevii'],
    sources: { rr: { id: 'dhelmise-sevii' } },
    default: 'rr',
  },
  sizzlipedesevii: {
    name: ['Sizzlipede-Sevii'],
    sources: { rr: { id: 'sizzlepede-sevii' } },
    default: 'rr',
  },
  centiskorchsevii: {
    name: ['Centiskorch-Sevii'],
    sources: { rr: { id: 'centiskorch-sevii' } },
    default: 'rr',
  },
  nymblesevii: {
    name: ['Nymble-Sevii'],
    sources: { rr: { id: 'nymble-sevii' } },
    default: 'rr',
  },
  lokixsevii: {
    name: ['Lokix-Sevii'],
    sources: { rr: { id: 'lokix-sevii' } },
    default: 'rr',
  },
  noibatsevii: {
    name: ['Noibat-Sevii'],
    sources: { rr: { id: 'noibat-sevii' } },
    default: 'rr',
  },
  noivernsevii: {
    name: ['Noivern-Sevii'],
    sources: { rr: { id: 'noivern-sevii' } },
    default: 'rr',
  },
} satisfies Record<string, NamedexEntry>;

export const Namedex: Record<PokemonId, NamedexEntry> = NamedexData;
