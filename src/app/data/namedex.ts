import { DraftPokemon } from '../interfaces/draft';

export type SpriteProperties = {
  id?: string;
  flip?: true;
};

export type PokemonId = keyof typeof Namedex & string;

export function getSpriteProperties(
  pokemonId: PokemonId,
  source: string,
): SpriteProperties | undefined {
  if (!Namedex[pokemonId]) return undefined;

  if (source in Namedex[pokemonId].sources) {
    return Namedex[pokemonId].sources[source as keyof typeof Sources];
  } else {
    return undefined;
  }
}

export function getPokemonData(pokemonId: string) {
  return Namedex[pokemonId];
}

export function getPidByName(name: string): PokemonId {
  name = name.toLowerCase();
  for (const key in Namedex) {
    const pokemonNames = Namedex[key].name;
    if (
      pokemonNames.some((pokemonName) => pokemonName.toLowerCase() === name)
    ) {
      return key;
    }
  }
  return name;
}

export function getNameByPid(id: PokemonId): string {
  if (Namedex[id]) {
    return Namedex[id].name[0];
  } else {
    return '';
  }
}

export function getRandomPokemon() {
  const dexArray = Object.entries(Namedex);
  const [id, data] = dexArray[Math.round(dexArray.length * Math.random())];
  return { id, name: data.name[0] };
}

let $nameList: DraftPokemon[] | undefined;
export function nameList(): DraftPokemon[] {
  if ($nameList) return $nameList;
  return ($nameList = Object.entries(Namedex)
    .map((e) => ({
      name: e[1].name[0],
      id: e[0],
    }))
    .sort((x, y) => {
      if (x.id < y.id) return -1;
      if (x.id > y.id) return 1;
      return 0;
    }));
}

export type SourceKey = 'ps' | 'pd' | 'serebii' | 'pmd' | 'rr' | 'psgh';

export const Sources: { [key in SourceKey]: string } = {
  ps: 'play.pokemonshowdown.com/sprites',
  pd: '',
  serebii: 'serebii.net',
  pmd: 'raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait',
  rr: 'play.radicalred.net/sprites',
  psgh: 'raw.githubusercontent.com/smogon/sprites/master/src',
} as const;

function psDefaultPath(id: string, shiny?: boolean) {
  return `https://${Sources.psgh}/previews/gen9/${id}${shiny ? '-s' : ''}.png`;
}

export type SpriteSetKey =
  | 'bw'
  | 'afd'
  | 'sv'
  | 'ani'
  | 'home'
  | 'serebii'
  | 'pmd'
  | 'rr';

export const SpriteSets: {
  [key: string]: {
    getPath: (id: string, shiny?: boolean) => string;
    classes: string[];
    flip?: boolean;
    source: SourceKey;
    fallback?: (id: string, shiny?: boolean) => string;
  };
} = {
  bw: {
    getPath: function (id: string, shiny?: boolean) {
      return `https://${Sources[this.source]}/gen5${shiny ? '-shiny' : ''}/${id}.png`;
    },
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
      return `https://${Sources.psgh}/dex/${id}${shiny ? '-s' : ''}.png`;
    },
    classes: [''],
    fallback: psDefaultPath,
    source: 'psgh',
  },
  ani: {
    getPath: function (id: string, shiny?: boolean) {
      return `https://${Sources[this.source]}/models/${id}${shiny ? '-s' : ''}.gif`;
    },
    classes: [''],
    source: 'psgh',
    fallback: psDefaultPath,
  },
  home: {
    getPath: function (id: string, shiny?: boolean) {
      return `https://${Sources[this.source]}/previews/gen9/${id}${shiny ? '-s' : ''}.png`;
    },
    classes: ['sprite-border'],
    source: 'psgh',
    fallback: psDefaultPath,
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
} as const;

export const Namedex: {
  [key: string]: {
    name: string[];
    sources: { [key in keyof typeof Sources]?: SpriteProperties };
    default?: SpriteSetKey;
  };
} = {
  bulbasaur: {
    name: ['Bulbasaur'],
    sources: {
      ps: {},
      serebii: { id: '001' },
      pmd: { id: '0001' },
      psgh: { id: 's32' },
    },
  },
  ivysaur: {
    name: ['Ivysaur'],
    sources: {
      ps: { flip: true },
      serebii: { id: '002' },
      pmd: { id: '0002' },
      psgh: { id: 's64', flip: true },
    },
  },
  venusaur: {
    name: ['Venusaur'],
    sources: {
      ps: {},
      serebii: { id: '003' },
      pmd: { id: '0003' },
      psgh: { id: 's96' },
    },
  },
  venusaurmega: {
    name: ['Mega Venusaur', 'Venusaur-Mega'],
    sources: {
      ps: { id: 'venusaur-mega' },
      serebii: { id: '003-m' },
      pmd: { id: '0003/0001' },
      psgh: { id: 's97' },
    },
  },
  venusaurgmax: {
    name: ['Venusaur-Gmax'],
    sources: {
      ps: { id: 'venusaur-gmax' },
      serebii: { id: '003-gi' },
      pmd: { id: '0003' },
      psgh: { id: 's96-g' },
    },
  },
  charmander: {
    name: ['Charmander'],
    sources: {
      ps: {},
      serebii: { id: '004' },
      pmd: { id: '0004' },
      psgh: { id: 's128' },
    },
  },
  charmeleon: {
    name: ['Charmeleon'],
    sources: {
      ps: {},
      serebii: { id: '005' },
      pmd: { id: '0005' },
      psgh: { id: 's160' },
    },
  },
  charizard: {
    name: ['Charizard'],
    sources: {
      ps: {},
      serebii: { id: '006' },
      pmd: { id: '0006' },
      psgh: { id: 's192' },
    },
  },
  charizardmegax: {
    name: ['Mega Charizard X', 'Charizard-Mega-X'],
    sources: {
      ps: { id: 'charizard-megax', flip: true },
      serebii: { id: '006-mx' },
      pmd: { id: '0006/0001' },
      psgh: { id: 's193', flip: true },
    },
  },
  charizardmegay: {
    name: ['Mega Charizard Y', 'Charizard-Mega-Y'],
    sources: {
      ps: { id: 'charizard-megay' },
      serebii: { id: '006-my' },
      pmd: { id: '0006/0002' },
      psgh: { id: 's194' },
    },
  },
  charizardgmax: {
    name: ['Charizard-Gmax'],
    sources: {
      ps: { id: 'charizard-gmax', flip: true },
      serebii: { id: '006-gi' },
      pmd: { id: '0006' },
      psgh: { id: 's192-g', flip: true },
    },
  },
  squirtle: {
    name: ['Squirtle'],
    sources: {
      ps: {},
      serebii: { id: '007' },
      pmd: { id: '0007' },
      psgh: { id: 's224' },
    },
  },
  wartortle: {
    name: ['Wartortle'],
    sources: {
      ps: {},
      serebii: { id: '008' },
      pmd: { id: '0008' },
      psgh: { id: 's256' },
    },
  },
  blastoise: {
    name: ['Blastoise'],
    sources: {
      ps: {},
      serebii: { id: '009' },
      pmd: { id: '0009' },
      psgh: { id: 's288' },
    },
  },
  blastoisemega: {
    name: ['Mega Blastoise', 'Blastoise-Mega'],
    sources: {
      ps: { id: 'blastoise-mega' },
      serebii: { id: '009-m' },
      pmd: { id: '0009/0001' },
      psgh: { id: 's289' },
    },
  },
  blastoisegmax: {
    name: ['Blastoise-Gmax'],
    sources: {
      ps: { id: 'blastoise-gmax', flip: true },
      serebii: { id: '009-gi' },
      pmd: { id: '0009' },
      psgh: { id: 's288-g', flip: true },
    },
  },
  caterpie: {
    name: ['Caterpie'],
    sources: {
      ps: {},
      serebii: { id: '010' },
      pmd: { id: '0010' },
      psgh: { id: 's320' },
    },
  },
  metapod: {
    name: ['Metapod'],
    sources: {
      ps: {},
      serebii: { id: '011' },
      pmd: { id: '0011' },
      psgh: { id: 's352' },
    },
  },
  butterfree: {
    name: ['Butterfree'],
    sources: {
      ps: {},
      serebii: { id: '012' },
      pmd: { id: '0012' },
      psgh: { id: 's384' },
    },
  },
  butterfreegmax: {
    name: ['Butterfree-Gmax'],
    sources: {
      ps: { id: 'butterfree-gmax', flip: true },
      serebii: { id: '012-gi' },
      pmd: { id: '0012' },
      psgh: { id: 's384-g', flip: true },
    },
  },
  butterfreemega: {
    name: ['Mega Butterfree', 'Butterfree-Mega'],
    sources: {
      ps: { id: 'butterfree-gmax', flip: true },
      serebii: { id: '012-gi' },
      pmd: { id: '0012' },
      psgh: { id: 's384-g', flip: true },
    },
  },
  weedle: {
    name: ['Weedle'],
    sources: {
      ps: {},
      serebii: { id: '013' },
      pmd: { id: '0013' },
      psgh: { id: 's416' },
    },
  },
  kakuna: {
    name: ['Kakuna'],
    sources: {
      ps: {},
      serebii: { id: '014' },
      pmd: { id: '0014' },
      psgh: { id: 's448' },
    },
  },
  beedrill: {
    name: ['Beedrill'],
    sources: {
      ps: {},
      serebii: { id: '015' },
      pmd: { id: '0015' },
      psgh: { id: 's480' },
    },
  },
  beedrillmega: {
    name: ['Mega Beedrill', 'Beedrill-Mega'],
    sources: {
      ps: { id: 'beedrill-mega' },
      serebii: { id: '015-m' },
      pmd: { id: '0015/0001' },
      psgh: { id: 's481' },
    },
  },
  pidgey: {
    name: ['Pidgey'],
    sources: {
      ps: {},
      serebii: { id: '016' },
      pmd: { id: '0016' },
      psgh: { id: 's512' },
    },
  },
  pidgeotto: {
    name: ['Pidgeotto'],
    sources: {
      ps: {},
      serebii: { id: '017' },
      pmd: { id: '0017' },
      psgh: { id: 's544' },
    },
  },
  pidgeot: {
    name: ['Pidgeot'],
    sources: {
      ps: { flip: true },
      serebii: { id: '018' },
      pmd: { id: '0018' },
      psgh: { id: 's576', flip: true },
    },
  },
  pidgeotmega: {
    name: ['Mega Pidgeot', 'Pidgeot-Mega'],
    sources: {
      ps: { id: 'pidgeot-mega' },
      serebii: { id: '018-m' },
      pmd: { id: '0018/0001' },
      psgh: { id: 's577' },
    },
  },
  rattata: {
    name: ['Rattata'],
    sources: {
      ps: {},
      serebii: { id: '019' },
      pmd: { id: '0019' },
      psgh: { id: 's608' },
    },
  },
  rattataalola: {
    name: ['Alolan Rattata', 'Rattata-Alola', 'Rattata-A'],
    sources: {
      ps: { id: 'rattata-alola' },
      serebii: { id: '019-a' },
      pmd: { id: '0019/0001' },
      psgh: { id: 's609' },
    },
  },
  raticate: {
    name: ['Raticate'],
    sources: {
      ps: {},
      serebii: { id: '020' },
      pmd: { id: '0020' },
      psgh: { id: 's640' },
    },
  },
  raticatealola: {
    name: ['Alolan Raticate', 'Raticate-Alola', 'Raticate-A'],
    sources: {
      ps: { id: 'raticate-alola' },
      serebii: { id: '020-a' },
      pmd: { id: '0020/0001' },
      psgh: { id: 's641' },
    },
  },
  spearow: {
    name: ['Spearow'],
    sources: {
      ps: {},
      serebii: { id: '021' },
      pmd: { id: '0021' },
      psgh: { id: 's672' },
    },
  },
  fearow: {
    name: ['Fearow'],
    sources: {
      ps: {},
      serebii: { id: '022' },
      pmd: { id: '0022' },
      psgh: { id: 's704' },
    },
  },
  ekans: {
    name: ['Ekans'],
    sources: {
      ps: {},
      serebii: { id: '023' },
      pmd: { id: '0023' },
      psgh: { id: 's736' },
    },
  },
  arbok: {
    name: ['Arbok'],
    sources: {
      ps: {},
      serebii: { id: '024' },
      pmd: { id: '0024' },
      psgh: { id: 's768' },
    },
  },
  pikachu: {
    name: ['Pikachu'],
    sources: {
      ps: {},
      serebii: { id: '025' },
      pmd: { id: '0025' },
      psgh: { id: 's800' },
    },
  },
  pikachucosplay: {
    name: ['Pikachu-Cosplay'],
    sources: {
      ps: { id: 'pikachu-cosplay' },
      serebii: { id: '025' },
      pmd: { id: '0025' },
      psgh: { id: 's815' },
    },
  },
  pikachurockstar: {
    name: ['Pikachu-Rock-Star'],
    sources: {
      ps: { id: 'pikachu-rockstar' },
      serebii: { id: '025' },
      pmd: { id: '0025/0002' },
      psgh: { id: 's810' },
    },
  },
  pikachubelle: {
    name: ['Pikachu-Belle'],
    sources: {
      ps: { id: 'pikachu-belle' },
      serebii: { id: '025' },
      pmd: { id: '0025/0003' },
      psgh: { id: 's811' },
    },
  },
  pikachupopstar: {
    name: ['Pikachu-Pop-Star'],
    sources: {
      ps: { id: 'pikachu-popstar' },
      serebii: { id: '025' },
      pmd: { id: '0025/0004' },
      psgh: { id: 's812' },
    },
  },
  pikachuphd: {
    name: ['Pikachu-PhD'],
    sources: {
      ps: { id: 'pikachu-phd' },
      serebii: { id: '025' },
      pmd: { id: '0025/0005' },
      psgh: { id: 's813' },
    },
  },
  pikachulibre: {
    name: ['Pikachu-Libre'],
    sources: {
      ps: { id: 'pikachu-libre' },
      serebii: { id: '025' },
      pmd: { id: '0025/0006' },
      psgh: { id: 's814' },
    },
  },
  pikachuoriginal: {
    name: ['Pikachu-Original'],
    sources: {
      ps: { id: 'pikachu-original' },
      serebii: { id: '025-o' },
      pmd: { id: '0025/0008' },
      psgh: { id: 's801' },
    },
  },
  pikachuhoenn: {
    name: ['Pikachu-Hoenn'],
    sources: {
      ps: { id: 'pikachu-hoenn' },
      serebii: { id: '025-h' },
      pmd: { id: '0025/0009' },
      psgh: { id: 's802' },
    },
  },
  pikachusinnoh: {
    name: ['Pikachu-Sinnoh'],
    sources: {
      ps: { id: 'pikachu-sinnoh' },
      serebii: { id: '025-s' },
      pmd: { id: '0025/0010' },
      psgh: { id: 's803' },
    },
  },
  pikachuunova: {
    name: ['Pikachu-Unova'],
    sources: {
      ps: { id: 'pikachu-unova' },
      serebii: { id: '025-u' },
      pmd: { id: '0025/0011' },
      psgh: { id: 's804' },
    },
  },
  pikachukalos: {
    name: ['Pikachu-Kalos'],
    sources: {
      ps: { id: 'pikachu-kalos' },
      serebii: { id: '025-k' },
      pmd: { id: '0025/0012' },
      psgh: { id: 's805' },
    },
  },
  pikachualola: {
    name: ['Alolan Pikachu', 'Pikachu-Alola', 'Pikachu-A'],
    sources: {
      ps: { id: 'pikachu-alola' },
      serebii: { id: '025-a' },
      pmd: { id: '0025/0013' },
      psgh: { id: 's806' },
    },
  },
  pikachupartner: {
    name: ['Pikachu-Partner'],
    sources: {
      ps: { id: 'pikachu-partner' },
      serebii: { id: '025-p' },
      pmd: { id: '0025/0014' },
      psgh: { id: 's807' },
    },
  },
  pikachustarter: {
    name: ['Pikachu-Starter'],
    sources: {
      ps: { id: 'pikachu-starter' },
      serebii: { id: '025' },
      pmd: { id: '0025' },
      psgh: { id: 's808' },
    },
  },
  pikachugmax: {
    name: ['Pikachu-Gmax'],
    sources: {
      ps: { id: 'pikachu-gmax' },
      serebii: { id: '025-gi' },
      pmd: { id: '0025/0001' },
      psgh: { id: 's800-g' },
    },
  },
  pikachuworld: {
    name: ['Pikachu-World'],
    sources: {
      ps: { id: 'pikachu-world' },
      serebii: { id: '025-w' },
      pmd: { id: '0025/0015' },
      psgh: { id: 's809' },
    },
  },
  raichu: {
    name: ['Raichu'],
    sources: {
      ps: {},
      serebii: { id: '026' },
      pmd: { id: '0026' },
      psgh: { id: 's832' },
    },
  },
  raichumegax: {
    name: ['Mega Raichu X', 'Raichu-Mega-X'],
    sources: {
      ps: { id: 'raichu-megax' },
      serebii: { id: '026' },
      pmd: { id: '0026' },
      psgh: { id: 's832' },
    },
  },
  raichumegay: {
    name: ['Mega Raichu Y', 'Raichu-Mega-Y'],
    sources: {
      ps: { id: 'raichu-megay' },
      serebii: { id: '026' },
      pmd: { id: '0026' },
      psgh: { id: 's832' },
    },
  },
  raichualola: {
    name: ['Alolan Raichu', 'Raichu-Alola', 'Raichu-A'],
    sources: {
      ps: { id: 'raichu-alola' },
      serebii: { id: '026-a' },
      pmd: { id: '0026/0001' },
      psgh: { id: 's833' },
    },
  },
  sandshrew: {
    name: ['Sandshrew'],
    sources: {
      ps: {},
      serebii: { id: '027' },
      pmd: { id: '0027' },
      psgh: { id: 's864' },
    },
  },
  sandshrewalola: {
    name: ['Alolan Sandshrew', 'Sandshrew-Alola', 'Sandshrew-A'],
    sources: {
      ps: { id: 'sandshrew-alola', flip: true },
      serebii: { id: '027-a' },
      pmd: { id: '0027/0001' },
      psgh: { id: 's865', flip: true },
    },
  },
  sandslash: {
    name: ['Sandslash'],
    sources: {
      ps: { flip: true },
      serebii: { id: '028' },
      pmd: { id: '0028' },
      psgh: { id: 's896', flip: true },
    },
  },
  sandslashalola: {
    name: ['Alolan Sandslash', 'Sandslash-Alola', 'Sandslash-A'],
    sources: {
      ps: { id: 'sandslash-alola', flip: true },
      serebii: { id: '028-a' },
      pmd: { id: '0028/0001' },
      psgh: { id: 's897', flip: true },
    },
  },
  nidoranf: {
    name: ['Nidoran-Female', 'Nidoran-F'],
    sources: {
      ps: {},
      serebii: { id: '029' },
      pmd: { id: '0029' },
      psgh: { id: 's928' },
    },
  },
  nidorina: {
    name: ['Nidorina'],
    sources: {
      ps: {},
      serebii: { id: '030' },
      pmd: { id: '0030' },
      psgh: { id: 's960' },
    },
  },
  nidoqueen: {
    name: ['Nidoqueen'],
    sources: {
      ps: {},
      serebii: { id: '031' },
      pmd: { id: '0031' },
      psgh: { id: 's992' },
    },
  },
  nidoranm: {
    name: ['Nidoran-M'],
    sources: {
      ps: {},
      serebii: { id: '032' },
      pmd: { id: '0032' },
      psgh: { id: 's1024' },
    },
  },
  nidorino: {
    name: ['Nidorino'],
    sources: {
      ps: {},
      serebii: { id: '033' },
      pmd: { id: '0033' },
      psgh: { id: 's1056' },
    },
  },
  nidoking: {
    name: ['Nidoking'],
    sources: {
      ps: {},
      serebii: { id: '034' },
      pmd: { id: '0034' },
      psgh: { id: 's1088' },
    },
  },
  clefairy: {
    name: ['Clefairy'],
    sources: {
      ps: {},
      serebii: { id: '035' },
      pmd: { id: '0035' },
      psgh: { id: 's1120' },
    },
  },
  clefable: {
    name: ['Clefable'],
    sources: {
      ps: {},
      serebii: { id: '036' },
      pmd: { id: '0036' },
      psgh: { id: 's1152' },
    },
  },
  clefablemega: {
    name: ['Mega Clefable', 'Clefable-Mega'],
    sources: {
      ps: {},
      serebii: { id: '036' },
      pmd: { id: '0036' },
      psgh: { id: 's1152' },
    },
  },
  vulpix: {
    name: ['Vulpix'],
    sources: {
      ps: {},
      serebii: { id: '037' },
      pmd: { id: '0037' },
      psgh: { id: 's1184' },
    },
  },
  vulpixalola: {
    name: ['Alolan Vulpix', 'Vulpix-Alola', 'Vulpix-A'],
    sources: {
      ps: { id: 'vulpix-alola' },
      serebii: { id: '037-a' },
      pmd: { id: '0037/0001' },
      psgh: { id: 's1185' },
    },
  },
  ninetales: {
    name: ['Ninetales'],
    sources: {
      ps: {},
      serebii: { id: '038' },
      pmd: { id: '0038' },
      psgh: { id: 's1216' },
    },
  },
  ninetalesalola: {
    name: ['Alolan Ninetales', 'Ninetales-Alola', 'Ninetales-A'],
    sources: {
      ps: { id: 'ninetales-alola' },
      serebii: { id: '038-a' },
      pmd: { id: '0038/0001' },
      psgh: { id: 's1217' },
    },
  },
  jigglypuff: {
    name: ['Jigglypuff'],
    sources: {
      ps: {},
      serebii: { id: '039' },
      pmd: { id: '0039' },
      psgh: { id: 's1248' },
    },
  },
  wigglytuff: {
    name: ['Wigglytuff'],
    sources: {
      ps: { flip: true },
      serebii: { id: '040' },
      pmd: { id: '0040' },
      psgh: { id: 's1280', flip: true },
    },
  },
  zubat: {
    name: ['Zubat'],
    sources: {
      ps: {},
      serebii: { id: '041' },
      pmd: { id: '0041' },
      psgh: { id: 's1312' },
    },
  },
  golbat: {
    name: ['Golbat'],
    sources: {
      ps: {},
      serebii: { id: '042' },
      pmd: { id: '0042' },
      psgh: { id: 's1344' },
    },
  },
  oddish: {
    name: ['Oddish'],
    sources: {
      ps: {},
      serebii: { id: '043' },
      pmd: { id: '0043' },
      psgh: { id: 's1376' },
    },
  },
  gloom: {
    name: ['Gloom'],
    sources: {
      ps: {},
      serebii: { id: '044' },
      pmd: { id: '0044' },
      psgh: { id: 's1408' },
    },
  },
  vileplume: {
    name: ['Vileplume'],
    sources: {
      ps: {},
      serebii: { id: '045' },
      pmd: { id: '0045' },
      psgh: { id: 's1440' },
    },
  },
  paras: {
    name: ['Paras'],
    sources: {
      ps: {},
      serebii: { id: '046' },
      pmd: { id: '0046' },
      psgh: { id: 's1472' },
    },
  },
  parasect: {
    name: ['Parasect'],
    sources: {
      ps: {},
      serebii: { id: '047' },
      pmd: { id: '0047' },
      psgh: { id: 's1504' },
    },
  },
  venonat: {
    name: ['Venonat'],
    sources: {
      ps: { flip: true },
      serebii: { id: '048' },
      pmd: { id: '0048' },
      psgh: { id: 's1536', flip: true },
    },
  },
  venomoth: {
    name: ['Venomoth'],
    sources: {
      ps: {},
      serebii: { id: '049' },
      pmd: { id: '0049' },
      psgh: { id: 's1568' },
    },
  },
  diglett: {
    name: ['Diglett'],
    sources: {
      ps: {},
      serebii: { id: '050' },
      pmd: { id: '0050' },
      psgh: { id: 's1600' },
    },
  },
  diglettalola: {
    name: ['Alolan Diglett', 'Diglett-Alola', 'Diglett-A'],
    sources: {
      ps: { id: 'diglett-alola' },
      serebii: { id: '050-a' },
      pmd: { id: '0050/0001' },
      psgh: { id: 's1601' },
    },
  },
  dugtrio: {
    name: ['Dugtrio'],
    sources: {
      ps: {},
      serebii: { id: '051' },
      pmd: { id: '0051' },
      psgh: { id: 's1632' },
    },
  },
  dugtrioalola: {
    name: ['Alolan Dugtrio', 'Dugtrio-Alola', 'Dugtrio-A'],
    sources: {
      ps: { id: 'dugtrio-alola' },
      serebii: { id: '051-a' },
      pmd: { id: '0051/0001' },
      psgh: { id: 's1633' },
    },
  },
  meowth: {
    name: ['Meowth'],
    sources: {
      ps: {},
      serebii: { id: '052' },
      pmd: { id: '0052' },
      psgh: { id: 's1664' },
    },
  },
  meowthalola: {
    name: ['Alolan Meowth', 'Meowth-Alola', 'Meowth-A'],
    sources: {
      ps: { id: 'meowth-alola' },
      serebii: { id: '052-a' },
      pmd: { id: '0052/0001' },
      psgh: { id: 's1665' },
    },
  },
  meowthgalar: {
    name: ['Galarian Meowth', 'Meowth-Galar', 'Meowth-G'],
    sources: {
      ps: { id: 'meowth-galar' },
      serebii: { id: '052-g' },
      pmd: { id: '0052/0002' },
      psgh: { id: 's1666' },
    },
  },
  meowthgmax: {
    name: ['Meowth-Gmax'],
    sources: {
      ps: { id: 'meowth-gmax' },
      serebii: { id: '052-gi' },
      pmd: { id: '0052' },
      psgh: { id: 's1664-g' },
    },
  },
  persian: {
    name: ['Persian'],
    sources: {
      ps: {},
      serebii: { id: '053' },
      pmd: { id: '0053' },
      psgh: { id: 's1696' },
    },
  },
  persianalola: {
    name: ['Alolan Persian', 'Persian-Alola', 'Persian-A'],
    sources: {
      ps: { id: 'persian-alola' },
      serebii: { id: '053-a' },
      pmd: { id: '0053/0001' },
      psgh: { id: 's1697' },
    },
  },
  psyduck: {
    name: ['Psyduck'],
    sources: {
      ps: {},
      serebii: { id: '054' },
      pmd: { id: '0054' },
      psgh: { id: 's1728' },
    },
  },
  golduck: {
    name: ['Golduck'],
    sources: {
      ps: {},
      serebii: { id: '055' },
      pmd: { id: '0055' },
      psgh: { id: 's1760' },
    },
  },
  mankey: {
    name: ['Mankey'],
    sources: {
      ps: {},
      serebii: { id: '056' },
      pmd: { id: '0056' },
      psgh: { id: 's1792' },
    },
  },
  primeape: {
    name: ['Primeape'],
    sources: {
      ps: {},
      serebii: { id: '057' },
      pmd: { id: '0057' },
      psgh: { id: 's1824' },
    },
  },
  growlithe: {
    name: ['Growlithe'],
    sources: {
      ps: {},
      serebii: { id: '058' },
      pmd: { id: '0058' },
      psgh: { id: 's1856' },
    },
  },
  growlithehisui: {
    name: ['Hisuian Growlithe', 'Growlithe-Hisui', 'Growlithe-H'],
    sources: {
      ps: { id: 'growlithe-hisui' },
      serebii: { id: '058-h' },
      pmd: { id: '0058/0001' },
      psgh: { id: 's1857' },
    },
  },
  arcanine: {
    name: ['Arcanine'],
    sources: {
      ps: {},
      serebii: { id: '059' },
      pmd: { id: '0059' },
      psgh: { id: 's1888' },
    },
  },
  arcaninehisui: {
    name: ['Hisuian Arcanine', 'Arcanine-Hisui', 'Arcanine-H'],
    sources: {
      ps: { id: 'arcanine-hisui' },
      serebii: { id: '059-h' },
      pmd: { id: '0059/0001' },
      psgh: { id: 's1889' },
    },
  },
  poliwag: {
    name: ['Poliwag'],
    sources: {
      ps: { flip: true },
      serebii: { id: '060' },
      pmd: { id: '0060' },
      psgh: { id: 's1920', flip: true },
    },
  },
  poliwhirl: {
    name: ['Poliwhirl'],
    sources: {
      ps: {},
      serebii: { id: '061' },
      pmd: { id: '0061' },
      psgh: { id: 's1952' },
    },
  },
  poliwrath: {
    name: ['Poliwrath'],
    sources: {
      ps: {},
      serebii: { id: '062' },
      pmd: { id: '0062' },
      psgh: { id: 's1984' },
    },
  },
  abra: {
    name: ['Abra'],
    sources: {
      ps: {},
      serebii: { id: '063' },
      pmd: { id: '0063' },
      psgh: { id: 's2016' },
    },
  },
  kadabra: {
    name: ['Kadabra'],
    sources: {
      ps: { flip: true },
      serebii: { id: '064' },
      pmd: { id: '0064' },
      psgh: { id: 's2048', flip: true },
    },
  },
  alakazam: {
    name: ['Alakazam'],
    sources: {
      ps: {},
      serebii: { id: '065' },
      pmd: { id: '0065' },
      psgh: { id: 's2080' },
    },
  },
  alakazammega: {
    name: ['Mega Alakazam', 'Alakazam-Mega'],
    sources: {
      ps: { id: 'alakazam-mega' },
      serebii: { id: '065-m' },
      pmd: { id: '0065/0001' },
      psgh: { id: 's2081' },
    },
  },
  machop: {
    name: ['Machop'],
    sources: {
      ps: {},
      serebii: { id: '066' },
      pmd: { id: '0066' },
      psgh: { id: 's2112' },
    },
  },
  machoke: {
    name: ['Machoke'],
    sources: {
      ps: {},
      serebii: { id: '067' },
      pmd: { id: '0067' },
      psgh: { id: 's2144' },
    },
  },
  machamp: {
    name: ['Machamp'],
    sources: {
      ps: { flip: true },
      serebii: { id: '068' },
      pmd: { id: '0068' },
      psgh: { id: 's2176', flip: true },
    },
  },
  machampgmax: {
    name: ['Machamp-Gmax'],
    sources: {
      ps: { id: 'machamp-gmax' },
      serebii: { id: '068-gi' },
      pmd: { id: '0068' },
      psgh: { id: 's2176-g' },
    },
  },
  machampmega: {
    name: ['Mega Machamp', 'Machamp-Mega'],
    sources: {
      ps: { id: 'machamp-gmax' },
      serebii: { id: '068-gi' },
      pmd: { id: '0068' },
      psgh: { id: 's2176-g' },
    },
  },
  bellsprout: {
    name: ['Bellsprout'],
    sources: {
      ps: {},
      serebii: { id: '069' },
      pmd: { id: '0069' },
      psgh: { id: 's2208' },
    },
  },
  weepinbell: {
    name: ['Weepinbell'],
    sources: {
      ps: {},
      serebii: { id: '070' },
      pmd: { id: '0070' },
      psgh: { id: 's2240' },
    },
  },
  victreebel: {
    name: ['Victreebel'],
    sources: {
      ps: {},
      serebii: { id: '071' },
      pmd: { id: '0071' },
      psgh: { id: 's2272' },
    },
  },
  victreebelmega: {
    name: ['Mega Victreebel', 'Victreebel-Mega'],
    sources: {
      ps: {},
      serebii: { id: '071' },
      pmd: { id: '0071' },
      psgh: { id: 's2272' },
    },
  },
  tentacool: {
    name: ['Tentacool'],
    sources: {
      ps: {},
      serebii: { id: '072' },
      pmd: { id: '0072' },
      psgh: { id: 's2304' },
    },
  },
  tentacruel: {
    name: ['Tentacruel'],
    sources: {
      ps: {},
      serebii: { id: '073' },
      pmd: { id: '0073' },
      psgh: { id: 's2336' },
    },
  },
  geodude: {
    name: ['Geodude'],
    sources: {
      ps: {},
      serebii: { id: '074' },
      pmd: { id: '0074' },
      psgh: { id: 's2368' },
    },
  },
  geodudealola: {
    name: ['Alolan Geodude', 'Geodude-Alola', 'Geodude-A'],
    sources: {
      ps: { id: 'geodude-alola' },
      serebii: { id: '074-a' },
      pmd: { id: '0074/0001' },
      psgh: { id: 's2369' },
    },
  },
  graveler: {
    name: ['Graveler'],
    sources: {
      ps: {},
      serebii: { id: '075' },
      pmd: { id: '0075' },
      psgh: { id: 's2400' },
    },
  },
  graveleralola: {
    name: ['Alolan Graveler', 'Graveler-Alola', 'Graveler-A'],
    sources: {
      ps: { id: 'graveler-alola' },
      serebii: { id: '075-a' },
      pmd: { id: '0075/0001' },
      psgh: { id: 's2401' },
    },
  },
  golem: {
    name: ['Golem'],
    sources: {
      ps: {},
      serebii: { id: '076' },
      pmd: { id: '0076' },
      psgh: { id: 's2432' },
    },
  },
  golemalola: {
    name: ['Alolan Golem', 'Golem-Alola', 'Golem-A'],
    sources: {
      ps: { id: 'golem-alola' },
      serebii: { id: '076-a' },
      pmd: { id: '0076/0001' },
      psgh: { id: 's2433' },
    },
  },
  ponyta: {
    name: ['Ponyta'],
    sources: {
      ps: {},
      serebii: { id: '077' },
      pmd: { id: '0077' },
      psgh: { id: 's2464' },
    },
  },
  ponytagalar: {
    name: ['Galarian Ponyta', 'Ponyta-Galar', 'Ponyta-G'],
    sources: {
      ps: { id: 'ponyta-galar' },
      serebii: { id: '077-g' },
      pmd: { id: '0077/0001' },
      psgh: { id: 's2465' },
    },
  },
  rapidash: {
    name: ['Rapidash'],
    sources: {
      ps: {},
      serebii: { id: '078' },
      pmd: { id: '0078' },
      psgh: { id: 's2496' },
    },
  },
  rapidashgalar: {
    name: ['Galarian Rapidash', 'Rapidash-Galar', 'Rapidash-G'],
    sources: {
      ps: { id: 'rapidash-galar', flip: true },
      serebii: { id: '078-g' },
      pmd: { id: '0078/0001' },
      psgh: { id: 's2497', flip: true },
    },
  },
  slowpoke: {
    name: ['Slowpoke'],
    sources: {
      ps: {},
      serebii: { id: '079' },
      pmd: { id: '0079' },
      psgh: { id: 's2528' },
    },
  },
  slowpokegalar: {
    name: ['Galarian Slowpoke', 'Slowpoke-Galar', 'Slowpoke-G'],
    sources: {
      ps: { id: 'slowpoke-galar' },
      serebii: { id: '079-g' },
      pmd: { id: '0079/0001' },
      psgh: { id: 's2529' },
    },
  },
  slowbro: {
    name: ['Slowbro'],
    sources: {
      ps: {},
      serebii: { id: '080' },
      pmd: { id: '0080' },
      psgh: { id: 's2560' },
    },
  },
  slowbromega: {
    name: ['Mega Slowbro', 'Slowbro-Mega'],
    sources: {
      ps: { id: 'slowbro-mega' },
      serebii: { id: '080-m' },
      pmd: { id: '0080/0002' },
      psgh: { id: 's2561' },
    },
  },
  slowbrogalar: {
    name: ['Galarian Slowbro', 'Slowbro-Galar', 'Slowbro-G'],
    sources: {
      ps: { id: 'slowbro-galar', flip: true },
      serebii: { id: '080-g' },
      pmd: { id: '0080/0001' },
      psgh: { id: 's2562', flip: true },
    },
  },
  magnemite: {
    name: ['Magnemite'],
    sources: {
      ps: {},
      serebii: { id: '081' },
      pmd: { id: '0081' },
      psgh: { id: 's2592' },
    },
  },
  magneton: {
    name: ['Magneton'],
    sources: {
      ps: { flip: true },
      serebii: { id: '082' },
      pmd: { id: '0082' },
      psgh: { id: 's2624', flip: true },
    },
  },
  farfetchd: {
    name: ['Farfetch’d'],
    sources: {
      ps: { flip: true },
      serebii: { id: '083' },
      pmd: { id: '0083' },
      psgh: { id: 's2656', flip: true },
    },
  },
  farfetchdgalar: {
    name: ['Galarian Farfetch’d', 'Farfetch’d-Galar', 'Farfetch’d-G'],
    sources: {
      ps: { id: 'farfetchd-galar' },
      serebii: { id: '083-g' },
      pmd: { id: '0083/0001' },
      psgh: { id: 's2657' },
    },
  },
  doduo: {
    name: ['Doduo'],
    sources: {
      ps: {},
      serebii: { id: '084' },
      pmd: { id: '0084' },
      psgh: { id: 's2688' },
    },
  },
  dodrio: {
    name: ['Dodrio'],
    sources: {
      ps: {},
      serebii: { id: '085' },
      pmd: { id: '0085' },
      psgh: { id: 's2720' },
    },
  },
  seel: {
    name: ['Seel'],
    sources: {
      ps: {},
      serebii: { id: '086' },
      pmd: { id: '0086' },
      psgh: { id: 's2752' },
    },
  },
  dewgong: {
    name: ['Dewgong'],
    sources: {
      ps: {},
      serebii: { id: '087' },
      pmd: { id: '0087' },
      psgh: { id: 's2784' },
    },
  },
  grimer: {
    name: ['Grimer'],
    sources: {
      ps: {},
      serebii: { id: '088' },
      pmd: { id: '0088' },
      psgh: { id: 's2816' },
    },
  },
  grimeralola: {
    name: ['Alolan Grimer', 'Grimer-Alola', 'Grimer-A'],
    sources: {
      ps: { id: 'grimer-alola' },
      serebii: { id: '088-a' },
      pmd: { id: '0088/0001' },
      psgh: { id: 's2817' },
    },
  },
  muk: {
    name: ['Muk'],
    sources: {
      ps: { flip: true },
      serebii: { id: '089' },
      pmd: { id: '0089' },
      psgh: { id: 's2848', flip: true },
    },
  },
  mukalola: {
    name: ['Alolan Muk', 'Muk-Alola', 'Muk-A'],
    sources: {
      ps: { id: 'muk-alola' },
      serebii: { id: '089-a' },
      pmd: { id: '0089/0001' },
      psgh: { id: 's2849' },
    },
  },
  shellder: {
    name: ['Shellder'],
    sources: {
      ps: {},
      serebii: { id: '090' },
      pmd: { id: '0090' },
      psgh: { id: 's2880' },
    },
  },
  cloyster: {
    name: ['Cloyster'],
    sources: {
      ps: {},
      serebii: { id: '091' },
      pmd: { id: '0091' },
      psgh: { id: 's2912' },
    },
  },
  gastly: {
    name: ['Gastly'],
    sources: {
      ps: {},
      serebii: { id: '092' },
      pmd: { id: '0092' },
      psgh: { id: 's2944' },
    },
  },
  haunter: {
    name: ['Haunter'],
    sources: {
      ps: {},
      serebii: { id: '093' },
      pmd: { id: '0093' },
      psgh: { id: 's2976' },
    },
  },
  gengar: {
    name: ['Gengar'],
    sources: {
      ps: {},
      serebii: { id: '094' },
      pmd: { id: '0094' },
      psgh: { id: 's3008' },
    },
  },
  gengarmega: {
    name: ['Mega Gengar', 'Gengar-Mega'],
    sources: {
      ps: { id: 'gengar-mega' },
      serebii: { id: '094-m' },
      pmd: { id: '0094/0001' },
      psgh: { id: 's3009' },
    },
  },
  gengargmax: {
    name: ['Gengar-Gmax'],
    sources: {
      ps: { id: 'gengar-gmax', flip: true },
      serebii: { id: '094-gi' },
      pmd: { id: '0094' },
      psgh: { id: 's3008-g', flip: true },
    },
  },
  onix: {
    name: ['Onix'],
    sources: {
      ps: {},
      serebii: { id: '095' },
      pmd: { id: '0095' },
      psgh: { id: 's3040' },
    },
  },
  drowzee: {
    name: ['Drowzee'],
    sources: {
      ps: { flip: true },
      serebii: { id: '096' },
      pmd: { id: '0096' },
      psgh: { id: 's3072', flip: true },
    },
  },
  hypno: {
    name: ['Hypno'],
    sources: {
      ps: {},
      serebii: { id: '097' },
      pmd: { id: '0097' },
      psgh: { id: 's3104' },
    },
  },
  krabby: {
    name: ['Krabby'],
    sources: {
      ps: {},
      serebii: { id: '098' },
      pmd: { id: '0098' },
      psgh: { id: 's3136' },
    },
  },
  kingler: {
    name: ['Kingler'],
    sources: {
      ps: {},
      serebii: { id: '099' },
      pmd: { id: '0099' },
      psgh: { id: 's3168' },
    },
  },
  kinglergmax: {
    name: ['Kingler-Gmax'],
    sources: {
      ps: { id: 'kingler-gmax' },
      serebii: { id: '099-gi' },
      pmd: { id: '0099' },
      psgh: { id: 's3168-g' },
    },
  },
  kinglermega: {
    name: ['Mega Kingler', 'Kingler-Mega'],
    sources: {
      ps: { id: 'kingler-gmax' },
      serebii: { id: '099-gi' },
      pmd: { id: '0099' },
      psgh: { id: 's3168-g' },
    },
  },
  voltorb: {
    name: ['Voltorb'],
    sources: {
      ps: { flip: true },
      serebii: { id: '100' },
      pmd: { id: '0100' },
      psgh: { id: 's3200', flip: true },
    },
  },
  voltorbhisui: {
    name: ['Hisuian Voltorb', 'Voltorb-Hisui', 'Voltorb-H'],
    sources: {
      ps: { id: 'voltorb-hisui', flip: true },
      serebii: { id: '100-h' },
      pmd: { id: '0100/0001' },
      psgh: { id: 's3201', flip: true },
    },
  },
  electrode: {
    name: ['Electrode'],
    sources: {
      ps: {},
      serebii: { id: '101' },
      pmd: { id: '0101' },
      psgh: { id: 's3232' },
    },
  },
  electrodehisui: {
    name: ['Hisuian Electrode', 'Electrode-Hisui', 'Electrode-H'],
    sources: {
      ps: { id: 'electrode-hisui', flip: true },
      serebii: { id: '101-h' },
      pmd: { id: '0101/0001' },
      psgh: { id: 's3233', flip: true },
    },
  },
  exeggcute: {
    name: ['Exeggcute'],
    sources: {
      ps: {},
      serebii: { id: '102' },
      pmd: { id: '0102' },
      psgh: { id: 's3264' },
    },
  },
  exeggutor: {
    name: ['Exeggutor'],
    sources: {
      ps: {},
      serebii: { id: '103' },
      pmd: { id: '0103' },
      psgh: { id: 's3296' },
    },
  },
  exeggutoralola: {
    name: ['Alolan Exeggutor', 'Exeggutor-Alola', 'Exeggutor-A'],
    sources: {
      ps: { id: 'exeggutor-alola' },
      serebii: { id: '103-a' },
      pmd: { id: '0103/0001' },
      psgh: { id: 's3297' },
    },
  },
  cubone: {
    name: ['Cubone'],
    sources: {
      ps: {},
      serebii: { id: '104' },
      pmd: { id: '0104' },
      psgh: { id: 's3328' },
    },
  },
  marowak: {
    name: ['Marowak'],
    sources: {
      ps: {},
      serebii: { id: '105' },
      pmd: { id: '0105' },
      psgh: { id: 's3360' },
    },
  },
  marowakalola: {
    name: ['Alolan Marowak', 'Marowak-Alola', 'Marowak-A'],
    sources: {
      ps: { id: 'marowak-alola' },
      serebii: { id: '105-a' },
      pmd: { id: '0105/0001' },
      psgh: { id: 's3361' },
    },
  },
  hitmonlee: {
    name: ['Hitmonlee'],
    sources: {
      ps: { flip: true },
      serebii: { id: '106' },
      pmd: { id: '0106' },
      psgh: { id: 's3392', flip: true },
    },
  },
  hitmonchan: {
    name: ['Hitmonchan'],
    sources: {
      ps: {},
      serebii: { id: '107' },
      pmd: { id: '0107' },
      psgh: { id: 's3424' },
    },
  },
  lickitung: {
    name: ['Lickitung'],
    sources: {
      ps: {},
      serebii: { id: '108' },
      pmd: { id: '0108' },
      psgh: { id: 's3456' },
    },
  },
  koffing: {
    name: ['Koffing'],
    sources: {
      ps: {},
      serebii: { id: '109' },
      pmd: { id: '0109' },
      psgh: { id: 's3488' },
    },
  },
  weezing: {
    name: ['Weezing'],
    sources: {
      ps: {},
      serebii: { id: '110' },
      pmd: { id: '0110' },
      psgh: { id: 's3520' },
    },
  },
  weezinggalar: {
    name: ['Galarian Weezing', 'Weezing-Galar', 'Weezing-G'],
    sources: {
      ps: { id: 'weezing-galar' },
      serebii: { id: '110-g' },
      pmd: { id: '0110/0001' },
      psgh: { id: 's3521' },
    },
  },
  rhyhorn: {
    name: ['Rhyhorn'],
    sources: {
      ps: {},
      serebii: { id: '111' },
      pmd: { id: '0111' },
      psgh: { id: 's3552' },
    },
  },
  rhydon: {
    name: ['Rhydon'],
    sources: {
      ps: {},
      serebii: { id: '112' },
      pmd: { id: '0112' },
      psgh: { id: 's3584' },
    },
  },
  chansey: {
    name: ['Chansey'],
    sources: {
      ps: {},
      serebii: { id: '113' },
      pmd: { id: '0113' },
      psgh: { id: 's3616' },
    },
  },
  tangela: {
    name: ['Tangela'],
    sources: {
      ps: { flip: true },
      serebii: { id: '114' },
      pmd: { id: '0114' },
      psgh: { id: 's3648', flip: true },
    },
  },
  kangaskhan: {
    name: ['Kangaskhan'],
    sources: {
      ps: {},
      serebii: { id: '115' },
      pmd: { id: '0115' },
      psgh: { id: 's3680' },
    },
  },
  kangaskhanmega: {
    name: ['Mega Kangaskhan', 'Kangaskhan-Mega'],
    sources: {
      ps: { id: 'kangaskhan-mega', flip: true },
      serebii: { id: '115-m' },
      pmd: { id: '0115' },
      psgh: { id: 's3681', flip: true },
    },
  },
  horsea: {
    name: ['Horsea'],
    sources: {
      ps: {},
      serebii: { id: '116' },
      pmd: { id: '0116' },
      psgh: { id: 's3712' },
    },
  },
  seadra: {
    name: ['Seadra'],
    sources: {
      ps: {},
      serebii: { id: '117' },
      pmd: { id: '0117' },
      psgh: { id: 's3744' },
    },
  },
  goldeen: {
    name: ['Goldeen'],
    sources: {
      ps: { flip: true },
      serebii: { id: '118' },
      pmd: { id: '0118' },
      psgh: { id: 's3776', flip: true },
    },
  },
  seaking: {
    name: ['Seaking'],
    sources: {
      ps: {},
      serebii: { id: '119' },
      pmd: { id: '0119' },
      psgh: { id: 's3808' },
    },
  },
  staryu: {
    name: ['Staryu'],
    sources: {
      ps: {},
      serebii: { id: '120' },
      pmd: { id: '0120' },
      psgh: { id: 's3840' },
    },
  },
  starmie: {
    name: ['Starmie'],
    sources: {
      ps: {},
      serebii: { id: '121' },
      pmd: { id: '0121' },
      psgh: { id: 's3872' },
    },
  },
  starmiemega: {
    name: ['Mega Starmie', 'Starmie-Mega'],
    sources: {
      ps: {},
      serebii: { id: '121' },
      pmd: { id: '0121' },
      psgh: { id: 's3872' },
    },
  },
  mrmime: {
    name: ['Mr. Mime'],
    sources: {
      ps: {},
      serebii: { id: '122' },
      pmd: { id: '0122' },
      psgh: { id: 's3904' },
    },
  },
  mrmimegalar: {
    name: ['Galarian Mr. Mime', 'Mr. Mime-Galar', 'Mr. Mime-G'],
    sources: {
      ps: { id: 'mrmime-galar' },
      serebii: { id: '122-g' },
      pmd: { id: '0122/0001' },
      psgh: { id: 's3905' },
    },
  },
  scyther: {
    name: ['Scyther'],
    sources: {
      ps: {},
      serebii: { id: '123' },
      pmd: { id: '0123' },
      psgh: { id: 's3936' },
    },
  },
  jynx: {
    name: ['Jynx'],
    sources: {
      ps: {},
      serebii: { id: '124' },
      pmd: { id: '0124' },
      psgh: { id: 's3968' },
    },
  },
  electabuzz: {
    name: ['Electabuzz'],
    sources: {
      ps: { flip: true },
      serebii: { id: '125' },
      pmd: { id: '0125' },
      psgh: { id: 's4000', flip: true },
    },
  },
  magmar: {
    name: ['Magmar'],
    sources: {
      ps: {},
      serebii: { id: '126' },
      pmd: { id: '0126' },
      psgh: { id: 's4032' },
    },
  },
  pinsir: {
    name: ['Pinsir'],
    sources: {
      ps: {},
      serebii: { id: '127' },
      pmd: { id: '0127' },
      psgh: { id: 's4064' },
    },
  },
  pinsirmega: {
    name: ['Mega Pinsir', 'Pinsir-Mega'],
    sources: {
      ps: { id: 'pinsir-mega' },
      serebii: { id: '127-m' },
      pmd: { id: '0127/0001' },
      psgh: { id: 's4065' },
    },
  },
  tauros: {
    name: ['Tauros'],
    sources: {
      ps: {},
      serebii: { id: '128' },
      pmd: { id: '0128' },
      psgh: { id: 's4096' },
    },
  },
  taurospaldeacombat: {
    name: ['Paldean Tauros Combat', 'Tauros-Paldea-Combat', 'Tauros-P'],
    sources: {
      ps: { id: 'tauros-paldeacombat' },
      serebii: { id: '128-p' },
      pmd: { id: '0128/0001' },
      psgh: { id: 's4097' },
    },
  },
  taurospaldeablaze: {
    name: ['Paldean Tauros Blaze', 'Tauros-Paldea-Blaze', 'Tauros-P'],
    sources: {
      ps: { id: 'tauros-paldeablaze', flip: true },
      serebii: { id: '128-b' },
      pmd: { id: '0128/0002' },
      psgh: { id: 's4098', flip: true },
    },
  },
  taurospaldeaaqua: {
    name: ['Paldean Tauros Aqua', 'Tauros-Paldea-Aqua', 'Tauros-P'],
    sources: {
      ps: { id: 'tauros-paldeaaqua' },
      serebii: { id: '128-a' },
      pmd: { id: '0128/0003' },
      psgh: { id: 's4099' },
    },
  },
  magikarp: {
    name: ['Magikarp'],
    sources: {
      ps: {},
      serebii: { id: '129' },
      pmd: { id: '0129' },
      psgh: { id: 's4128' },
    },
  },
  gyarados: {
    name: ['Gyarados'],
    sources: {
      ps: {},
      serebii: { id: '130' },
      pmd: { id: '0130' },
      psgh: { id: 's4160' },
    },
  },
  gyaradosmega: {
    name: ['Mega Gyarados', 'Gyarados-Mega'],
    sources: {
      ps: { id: 'gyarados-mega' },
      serebii: { id: '130-m' },
      pmd: { id: '0130/0001' },
      psgh: { id: 's4161' },
    },
  },
  lapras: {
    name: ['Lapras'],
    sources: {
      ps: { flip: true },
      serebii: { id: '131' },
      pmd: { id: '0131' },
      psgh: { id: 's4192', flip: true },
    },
  },
  laprasgmax: {
    name: ['Lapras-Gmax'],
    sources: {
      ps: { id: 'lapras-gmax' },
      serebii: { id: '131-gi' },
      pmd: { id: '0131' },
      psgh: { id: 's4192-g' },
    },
  },
  laprasmega: {
    name: ['Mega Lapras', 'Lapras-Mega'],
    sources: {
      ps: { id: 'lapras-gmax' },
      serebii: { id: '131-gi' },
      pmd: { id: '0131' },
      psgh: { id: 's4192-g' },
    },
  },
  ditto: {
    name: ['Ditto'],
    sources: {
      ps: {},
      serebii: { id: '132' },
      pmd: { id: '0132' },
      psgh: { id: 's4224' },
    },
  },
  eevee: {
    name: ['Eevee'],
    sources: {
      ps: {},
      serebii: { id: '133' },
      pmd: { id: '0133' },
      psgh: { id: 's4256' },
    },
  },
  eeveestarter: {
    name: ['Eevee-Starter'],
    sources: {
      ps: { id: 'eevee-starter' },
      serebii: { id: '133' },
      pmd: { id: '0133/0001' },
      psgh: { id: 's4257' },
    },
  },
  eeveegmax: {
    name: ['Eevee-Gmax'],
    sources: {
      ps: { id: 'eevee-gmax', flip: true },
      serebii: { id: '133-gi' },
      pmd: { id: '0133' },
      psgh: { id: 's4256-g', flip: true },
    },
  },
  vaporeon: {
    name: ['Vaporeon'],
    sources: {
      ps: {},
      serebii: { id: '134' },
      pmd: { id: '0134' },
      psgh: { id: 's4288' },
    },
  },
  jolteon: {
    name: ['Jolteon'],
    sources: {
      ps: {},
      serebii: { id: '135' },
      pmd: { id: '0135' },
      psgh: { id: 's4320' },
    },
  },
  flareon: {
    name: ['Flareon'],
    sources: {
      ps: {},
      serebii: { id: '136' },
      pmd: { id: '0136' },
      psgh: { id: 's4352' },
    },
  },
  porygon: {
    name: ['Porygon'],
    sources: {
      ps: {},
      serebii: { id: '137' },
      pmd: { id: '0137' },
      psgh: { id: 's4384' },
    },
  },
  omanyte: {
    name: ['Omanyte'],
    sources: {
      ps: { flip: true },
      serebii: { id: '138' },
      pmd: { id: '0138' },
      psgh: { id: 's4416', flip: true },
    },
  },
  omastar: {
    name: ['Omastar'],
    sources: {
      ps: {},
      serebii: { id: '139' },
      pmd: { id: '0139' },
      psgh: { id: 's4448' },
    },
  },
  kabuto: {
    name: ['Kabuto'],
    sources: {
      ps: {},
      serebii: { id: '140' },
      pmd: { id: '0140' },
      psgh: { id: 's4480' },
    },
  },
  kabutops: {
    name: ['Kabutops'],
    sources: {
      ps: {},
      serebii: { id: '141' },
      pmd: { id: '0141' },
      psgh: { id: 's4512' },
    },
  },
  aerodactyl: {
    name: ['Aerodactyl'],
    sources: {
      ps: {},
      serebii: { id: '142' },
      pmd: { id: '0142' },
      psgh: { id: 's4544' },
    },
  },
  aerodactylmega: {
    name: ['Mega Aerodactyl', 'Aerodactyl-Mega'],
    sources: {
      ps: { id: 'aerodactyl-mega' },
      serebii: { id: '142-m' },
      pmd: { id: '0142/0001' },
      psgh: { id: 's4545' },
    },
  },
  snorlax: {
    name: ['Snorlax'],
    sources: {
      ps: {},
      serebii: { id: '143' },
      pmd: { id: '0143' },
      psgh: { id: 's4576' },
    },
  },
  snorlaxgmax: {
    name: ['Snorlax-Gmax'],
    sources: {
      ps: { id: 'snorlax-gmax' },
      serebii: { id: '143-gi' },
      pmd: { id: '0143' },
      psgh: { id: 's4576-g' },
    },
  },
  snorlaxmega: {
    name: ['Mega Snorlax', 'Snorlax-Mega'],
    sources: {
      ps: { id: 'snorlax-gmax' },
      serebii: { id: '143-gi' },
      pmd: { id: '0143' },
      psgh: { id: 's4576-g' },
    },
  },
  articuno: {
    name: ['Articuno'],
    sources: {
      ps: {},
      serebii: { id: '144' },
      pmd: { id: '0144' },
      psgh: { id: 's4608' },
    },
  },
  articunogalar: {
    name: ['Galarian Articuno', 'Articuno-Galar', 'Articuno-G'],
    sources: {
      ps: { id: 'articuno-galar' },
      serebii: { id: '144-g' },
      pmd: { id: '0144/0001' },
      psgh: { id: 's4609' },
    },
  },
  zapdos: {
    name: ['Zapdos'],
    sources: {
      ps: {},
      serebii: { id: '145' },
      pmd: { id: '0145' },
      psgh: { id: 's4640' },
    },
  },
  zapdosgalar: {
    name: ['Galarian Zapdos', 'Zapdos-Galar', 'Zapdos-G'],
    sources: {
      ps: { id: 'zapdos-galar', flip: true },
      serebii: { id: '145-g' },
      pmd: { id: '0145/0001' },
      psgh: { id: 's4641', flip: true },
    },
  },
  moltres: {
    name: ['Moltres'],
    sources: {
      ps: { flip: true },
      serebii: { id: '146' },
      pmd: { id: '0146' },
      psgh: { id: 's4672', flip: true },
    },
  },
  moltresgalar: {
    name: ['Galarian Moltres', 'Moltres-Galar', 'Moltres-G'],
    sources: {
      ps: { id: 'moltres-galar' },
      serebii: { id: '146-g' },
      pmd: { id: '0146/0001' },
      psgh: { id: 's4673' },
    },
  },
  dratini: {
    name: ['Dratini'],
    sources: {
      ps: { flip: true },
      serebii: { id: '147' },
      pmd: { id: '0147' },
      psgh: { id: 's4704', flip: true },
    },
  },
  dragonair: {
    name: ['Dragonair'],
    sources: {
      ps: {},
      serebii: { id: '148' },
      pmd: { id: '0148' },
      psgh: { id: 's4736' },
    },
  },
  dragonite: {
    name: ['Dragonite'],
    sources: {
      ps: {},
      serebii: { id: '149' },
      pmd: { id: '0149' },
      psgh: { id: 's4768' },
    },
  },
  dragonitemega: {
    name: ['Mega Dragonite', 'Dragonite-Mega'],
    sources: {
      ps: {},
      serebii: { id: '149' },
      pmd: { id: '0149' },
      psgh: { id: 's4768' },
    },
  },
  mewtwo: {
    name: ['Mewtwo'],
    sources: {
      ps: {},
      serebii: { id: '150' },
      pmd: { id: '0150' },
      psgh: { id: 's4800' },
    },
  },
  mewtwomegax: {
    name: ['Mega Mewtwo X', 'Mewtwo-Mega-X'],
    sources: {
      ps: { id: 'mewtwo-megax', flip: true },
      serebii: { id: '150-mx' },
      pmd: { id: '0150/0001' },
      psgh: { id: 's4801', flip: true },
    },
  },
  mewtwomegay: {
    name: ['Mega Mewtwo Y', 'Mewtwo-Mega-Y'],
    sources: {
      ps: { id: 'mewtwo-megay' },
      serebii: { id: '150-my' },
      pmd: { id: '0150/0002' },
      psgh: { id: 's4802' },
    },
  },
  mew: {
    name: ['Mew'],
    sources: {
      ps: {},
      serebii: { id: '151' },
      pmd: { id: '0151' },
      psgh: { id: 's4832' },
    },
  },
  chikorita: {
    name: ['Chikorita'],
    sources: {
      ps: {},
      serebii: { id: '152' },
      pmd: { id: '0152' },
      psgh: { id: 's4864' },
    },
  },
  bayleef: {
    name: ['Bayleef'],
    sources: {
      ps: {},
      serebii: { id: '153' },
      pmd: { id: '0153' },
      psgh: { id: 's4896' },
    },
  },
  meganium: {
    name: ['Meganium'],
    sources: {
      ps: {},
      serebii: { id: '154' },
      pmd: { id: '0154' },
      psgh: { id: 's4928' },
    },
  },
  meganiummega: {
    name: ['Mega Meganium', 'Meganium-Mega'],
    sources: {
      ps: {},
      serebii: { id: '154' },
      pmd: { id: '0154' },
      psgh: { id: 's4928' },
    },
  },

  cyndaquil: {
    name: ['Cyndaquil'],
    sources: {
      ps: { flip: true },
      serebii: { id: '155' },
      pmd: { id: '0155' },
      psgh: { id: 's4960', flip: true },
    },
  },
  quilava: {
    name: ['Quilava'],
    sources: {
      ps: { flip: true },
      serebii: { id: '156' },
      pmd: { id: '0156' },
      psgh: { id: 's4992', flip: true },
    },
  },
  typhlosion: {
    name: ['Typhlosion'],
    sources: {
      ps: {},
      serebii: { id: '157' },
      pmd: { id: '0157' },
      psgh: { id: 's5024' },
    },
  },
  typhlosionhisui: {
    name: ['Hisuian Typhlosion', 'Typhlosion-Hisui', 'Typhlosion-H'],
    sources: {
      ps: { id: 'typhlosion-hisui', flip: true },
      serebii: { id: '157-h' },
      pmd: { id: '0157/0001' },
      psgh: { id: 's5025', flip: true },
    },
  },
  totodile: {
    name: ['Totodile'],
    sources: {
      ps: {},
      serebii: { id: '158' },
      pmd: { id: '0158' },
      psgh: { id: 's5056' },
    },
  },
  croconaw: {
    name: ['Croconaw'],
    sources: {
      ps: {},
      serebii: { id: '159' },
      pmd: { id: '0159' },
      psgh: { id: 's5088' },
    },
  },
  feraligatr: {
    name: ['Feraligatr'],
    sources: {
      ps: {},
      serebii: { id: '160' },
      pmd: { id: '0160' },
      psgh: { id: 's5120' },
    },
  },
  feraligatrmega: {
    name: ['Mega Feraligatr', 'Feraligatr-Mega'],
    sources: {
      ps: {},
      serebii: { id: '160' },
      pmd: { id: '0160' },
      psgh: { id: 's5120' },
    },
  },
  sentret: {
    name: ['Sentret'],
    sources: {
      ps: {},
      serebii: { id: '161' },
      pmd: { id: '0161' },
      psgh: { id: 's5152' },
    },
  },
  furret: {
    name: ['Furret'],
    sources: {
      ps: {},
      serebii: { id: '162' },
      pmd: { id: '0162' },
      psgh: { id: 's5184' },
    },
  },
  hoothoot: {
    name: ['Hoothoot'],
    sources: {
      ps: { flip: true },
      serebii: { id: '163' },
      pmd: { id: '0163' },
      psgh: { id: 's5216', flip: true },
    },
  },
  noctowl: {
    name: ['Noctowl'],
    sources: {
      ps: {},
      serebii: { id: '164' },
      pmd: { id: '0164' },
      psgh: { id: 's5248' },
    },
  },
  ledyba: {
    name: ['Ledyba'],
    sources: {
      ps: {},
      serebii: { id: '165' },
      pmd: { id: '0165' },
      psgh: { id: 's5280' },
    },
  },
  ledian: {
    name: ['Ledian'],
    sources: {
      ps: {},
      serebii: { id: '166' },
      pmd: { id: '0166' },
      psgh: { id: 's5312' },
    },
  },
  spinarak: {
    name: ['Spinarak'],
    sources: {
      ps: {},
      serebii: { id: '167' },
      pmd: { id: '0167' },
      psgh: { id: 's5344' },
    },
  },
  ariados: {
    name: ['Ariados'],
    sources: {
      ps: {},
      serebii: { id: '168' },
      pmd: { id: '0168' },
      psgh: { id: 's5376' },
    },
  },
  crobat: {
    name: ['Crobat'],
    sources: {
      ps: { flip: true },
      serebii: { id: '169' },
      pmd: { id: '0169' },
      psgh: { id: 's5408', flip: true },
    },
  },
  chinchou: {
    name: ['Chinchou'],
    sources: {
      ps: {},
      serebii: { id: '170' },
      pmd: { id: '0170' },
      psgh: { id: 's5440' },
    },
  },
  lanturn: {
    name: ['Lanturn'],
    sources: {
      ps: {},
      serebii: { id: '171' },
      pmd: { id: '0171' },
      psgh: { id: 's5472' },
    },
  },
  pichu: {
    name: ['Pichu'],
    sources: {
      ps: {},
      serebii: { id: '172' },
      pmd: { id: '0172' },
      psgh: { id: 's5504' },
    },
  },
  cleffa: {
    name: ['Cleffa'],
    sources: {
      ps: { flip: true },
      serebii: { id: '173' },
      pmd: { id: '0173' },
      psgh: { id: 's5536', flip: true },
    },
  },
  igglybuff: {
    name: ['Igglybuff'],
    sources: {
      ps: {},
      serebii: { id: '174' },
      pmd: { id: '0174' },
      psgh: { id: 's5568' },
    },
  },
  togepi: {
    name: ['Togepi'],
    sources: {
      ps: {},
      serebii: { id: '175' },
      pmd: { id: '0175' },
      psgh: { id: 's5600' },
    },
  },
  togetic: {
    name: ['Togetic'],
    sources: {
      ps: {},
      serebii: { id: '176' },
      pmd: { id: '0176' },
      psgh: { id: 's5632' },
    },
  },
  natu: {
    name: ['Natu'],
    sources: {
      ps: {},
      serebii: { id: '177' },
      pmd: { id: '0177' },
      psgh: { id: 's5664' },
    },
  },
  xatu: {
    name: ['Xatu'],
    sources: {
      ps: {},
      serebii: { id: '178' },
      pmd: { id: '0178' },
      psgh: { id: 's5696' },
    },
  },
  mareep: {
    name: ['Mareep'],
    sources: {
      ps: {},
      serebii: { id: '179' },
      pmd: { id: '0179' },
      psgh: { id: 's5728' },
    },
  },
  flaaffy: {
    name: ['Flaaffy'],
    sources: {
      ps: {},
      serebii: { id: '180' },
      pmd: { id: '0180' },
      psgh: { id: 's5760' },
    },
  },
  ampharos: {
    name: ['Ampharos'],
    sources: {
      ps: {},
      serebii: { id: '181' },
      pmd: { id: '0181' },
      psgh: { id: 's5792' },
    },
  },
  ampharosmega: {
    name: ['Mega Ampharos', 'Ampharos-Mega'],
    sources: {
      ps: { id: 'ampharos-mega' },
      serebii: { id: '181-m' },
      pmd: { id: '0181/0001' },
      psgh: { id: 's5793' },
    },
  },
  bellossom: {
    name: ['Bellossom'],
    sources: {
      ps: {},
      serebii: { id: '182' },
      pmd: { id: '0182' },
      psgh: { id: 's5824' },
    },
  },
  marill: {
    name: ['Marill'],
    sources: {
      ps: { flip: true },
      serebii: { id: '183' },
      pmd: { id: '0183' },
      psgh: { id: 's5856', flip: true },
    },
  },
  azumarill: {
    name: ['Azumarill'],
    sources: {
      ps: {},
      serebii: { id: '184' },
      pmd: { id: '0184' },
      psgh: { id: 's5888' },
    },
  },
  sudowoodo: {
    name: ['Sudowoodo'],
    sources: {
      ps: {},
      serebii: { id: '185' },
      pmd: { id: '0185' },
      psgh: { id: 's5920' },
    },
  },
  politoed: {
    name: ['Politoed'],
    sources: {
      ps: {},
      serebii: { id: '186' },
      pmd: { id: '0186' },
      psgh: { id: 's5952' },
    },
  },
  hoppip: {
    name: ['Hoppip'],
    sources: {
      ps: {},
      serebii: { id: '187' },
      pmd: { id: '0187' },
      psgh: { id: 's5984' },
    },
  },
  skiploom: {
    name: ['Skiploom'],
    sources: {
      ps: {},
      serebii: { id: '188' },
      pmd: { id: '0188' },
      psgh: { id: 's6016' },
    },
  },
  jumpluff: {
    name: ['Jumpluff'],
    sources: {
      ps: {},
      serebii: { id: '189' },
      pmd: { id: '0189' },
      psgh: { id: 's6048' },
    },
  },
  aipom: {
    name: ['Aipom'],
    sources: {
      ps: {},
      serebii: { id: '190' },
      pmd: { id: '0190' },
      psgh: { id: 's6080' },
    },
  },
  sunkern: {
    name: ['Sunkern'],
    sources: {
      ps: {},
      serebii: { id: '191' },
      pmd: { id: '0191' },
      psgh: { id: 's6112' },
    },
  },
  sunflora: {
    name: ['Sunflora'],
    sources: {
      ps: {},
      serebii: { id: '192' },
      pmd: { id: '0192' },
      psgh: { id: 's6144' },
    },
  },
  yanma: {
    name: ['Yanma'],
    sources: {
      ps: {},
      serebii: { id: '193' },
      pmd: { id: '0193' },
      psgh: { id: 's6176' },
    },
  },
  wooper: {
    name: ['Wooper'],
    sources: {
      ps: { flip: true },
      serebii: { id: '194' },
      pmd: { id: '0194' },
      psgh: { id: 's6208', flip: true },
    },
  },
  wooperpaldea: {
    name: ['Paldean Wooper', 'Wooper-Paldea', 'Wooper-P'],
    sources: {
      ps: { id: 'wooper-paldea', flip: true },
      serebii: { id: '194-p' },
      pmd: { id: '0194/0002' },
      psgh: { id: 's6209', flip: true },
    },
  },
  quagsire: {
    name: ['Quagsire'],
    sources: {
      ps: {},
      serebii: { id: '195' },
      pmd: { id: '0195' },
      psgh: { id: 's6240' },
    },
  },
  espeon: {
    name: ['Espeon'],
    sources: {
      ps: {},
      serebii: { id: '196' },
      pmd: { id: '0196' },
      psgh: { id: 's6272' },
    },
  },
  umbreon: {
    name: ['Umbreon'],
    sources: {
      ps: {},
      serebii: { id: '197' },
      pmd: { id: '0197' },
      psgh: { id: 's6304' },
    },
  },
  murkrow: {
    name: ['Murkrow'],
    sources: {
      ps: {},
      serebii: { id: '198' },
      pmd: { id: '0198' },
      psgh: { id: 's6336' },
    },
  },
  slowking: {
    name: ['Slowking'],
    sources: {
      ps: {},
      serebii: { id: '199' },
      pmd: { id: '0199' },
      psgh: { id: 's6368' },
    },
  },
  slowkinggalar: {
    name: ['Galarian Slowking', 'Slowking-Galar', 'Slowking-G'],
    sources: {
      ps: { id: 'slowking-galar' },
      serebii: { id: '199-g' },
      pmd: { id: '0199/0001' },
      psgh: { id: 's6369' },
    },
  },
  misdreavus: {
    name: ['Misdreavus'],
    sources: {
      ps: { flip: true },
      serebii: { id: '200' },
      pmd: { id: '0200' },
      psgh: { id: 's6400', flip: true },
    },
  },
  unown: {
    name: ['Unown'],
    sources: {
      ps: {},
      serebii: { id: '201' },
      pmd: { id: '0201' },
      psgh: { id: 's6432' },
    },
  },
  wobbuffet: {
    name: ['Wobbuffet'],
    sources: {
      ps: {},
      serebii: { id: '202' },
      pmd: { id: '0202' },
      psgh: { id: 's6464' },
    },
  },
  girafarig: {
    name: ['Girafarig'],
    sources: {
      ps: {},
      serebii: { id: '203' },
      pmd: { id: '0203' },
      psgh: { id: 's6496' },
    },
  },
  pineco: {
    name: ['Pineco'],
    sources: {
      ps: {},
      serebii: { id: '204' },
      pmd: { id: '0204' },
      psgh: { id: 's6528' },
    },
  },
  forretress: {
    name: ['Forretress'],
    sources: {
      ps: {},
      serebii: { id: '205' },
      pmd: { id: '0205' },
      psgh: { id: 's6560' },
    },
  },
  dunsparce: {
    name: ['Dunsparce'],
    sources: {
      ps: {},
      serebii: { id: '206' },
      pmd: { id: '0206' },
      psgh: { id: 's6592' },
    },
  },
  gligar: {
    name: ['Gligar'],
    sources: {
      ps: {},
      serebii: { id: '207' },
      pmd: { id: '0207' },
      psgh: { id: 's6624' },
    },
  },
  steelix: {
    name: ['Steelix'],
    sources: {
      ps: {},
      serebii: { id: '208' },
      pmd: { id: '0208' },
      psgh: { id: 's6656' },
    },
  },
  steelixmega: {
    name: ['Mega Steelix', 'Steelix-Mega'],
    sources: {
      ps: { id: 'steelix-mega' },
      serebii: { id: '208-m' },
      pmd: { id: '0208/0001' },
      psgh: { id: 's6657' },
    },
  },
  snubbull: {
    name: ['Snubbull'],
    sources: {
      ps: {},
      serebii: { id: '209' },
      pmd: { id: '0209' },
      psgh: { id: 's6688' },
    },
  },
  granbull: {
    name: ['Granbull'],
    sources: {
      ps: { flip: true },
      serebii: { id: '210' },
      pmd: { id: '0210' },
      psgh: { id: 's6720', flip: true },
    },
  },
  qwilfish: {
    name: ['Qwilfish'],
    sources: {
      ps: { flip: true },
      serebii: { id: '211' },
      pmd: { id: '0211' },
      psgh: { id: 's6752', flip: true },
    },
  },
  qwilfishhisui: {
    name: ['Hisuian Qwilfish', 'Qwilfish-Hisui', 'Qwilfish-H'],
    sources: {
      ps: { id: 'qwilfish-hisui' },
      serebii: { id: '211-h' },
      pmd: { id: '0211/0001' },
      psgh: { id: 's6753' },
    },
  },
  scizor: {
    name: ['Scizor'],
    sources: {
      ps: {},
      serebii: { id: '212' },
      pmd: { id: '0212' },
      psgh: { id: 's6784' },
    },
  },
  scizormega: {
    name: ['Mega Scizor', 'Scizor-Mega'],
    sources: {
      ps: { id: 'scizor-mega' },
      serebii: { id: '212-m' },
      pmd: { id: '0212/0001' },
      psgh: { id: 's6785' },
    },
  },
  shuckle: {
    name: ['Shuckle'],
    sources: {
      ps: { flip: true },
      serebii: { id: '213' },
      pmd: { id: '0213' },
      psgh: { id: 's6816', flip: true },
    },
  },
  heracross: {
    name: ['Heracross'],
    sources: {
      ps: {},
      serebii: { id: '214' },
      pmd: { id: '0214' },
      psgh: { id: 's6848' },
    },
  },
  heracrossmega: {
    name: ['Mega Heracross', 'Heracross-Mega'],
    sources: {
      ps: { id: 'heracross-mega' },
      serebii: { id: '214-m' },
      pmd: { id: '0214/0001' },
      psgh: { id: 's6849' },
    },
  },
  sneasel: {
    name: ['Sneasel'],
    sources: {
      ps: {},
      serebii: { id: '215' },
      pmd: { id: '0215' },
      psgh: { id: 's6880' },
    },
  },
  sneaselhisui: {
    name: ['Hisuian Sneasel', 'Sneasel-Hisui', 'Sneasel-H'],
    sources: {
      ps: { id: 'sneasel-hisui', flip: true },
      serebii: { id: '215-h' },
      pmd: { id: '0215/0001' },
      psgh: { id: 's6881', flip: true },
    },
  },
  teddiursa: {
    name: ['Teddiursa'],
    sources: {
      ps: {},
      serebii: { id: '216' },
      pmd: { id: '0216' },
      psgh: { id: 's6912' },
    },
  },
  ursaring: {
    name: ['Ursaring'],
    sources: {
      ps: {},
      serebii: { id: '217' },
      pmd: { id: '0217' },
      psgh: { id: 's6944' },
    },
  },
  slugma: {
    name: ['Slugma'],
    sources: {
      ps: {},
      serebii: { id: '218' },
      pmd: { id: '0218' },
      psgh: { id: 's6976' },
    },
  },
  magcargo: {
    name: ['Magcargo'],
    sources: {
      ps: {},
      serebii: { id: '219' },
      pmd: { id: '0219' },
      psgh: { id: 's7008' },
    },
  },
  swinub: {
    name: ['Swinub'],
    sources: {
      ps: {},
      serebii: { id: '220' },
      pmd: { id: '0220' },
      psgh: { id: 's7040' },
    },
  },
  piloswine: {
    name: ['Piloswine'],
    sources: {
      ps: {},
      serebii: { id: '221' },
      pmd: { id: '0221' },
      psgh: { id: 's7072' },
    },
  },
  corsola: {
    name: ['Corsola'],
    sources: {
      ps: { flip: true },
      serebii: { id: '222' },
      pmd: { id: '0222' },
      psgh: { id: 's7104', flip: true },
    },
  },
  corsolagalar: {
    name: ['Galarian Corsola', 'Corsola-Galar', 'Corsola-G'],
    sources: {
      ps: { id: 'corsola-galar', flip: true },
      serebii: { id: '222-g' },
      pmd: { id: '0222/0001' },
      psgh: { id: 's7105', flip: true },
    },
  },
  remoraid: {
    name: ['Remoraid'],
    sources: {
      ps: {},
      serebii: { id: '223' },
      pmd: { id: '0223' },
      psgh: { id: 's7136' },
    },
  },
  octillery: {
    name: ['Octillery'],
    sources: {
      ps: {},
      serebii: { id: '224' },
      pmd: { id: '0224' },
      psgh: { id: 's7168' },
    },
  },
  delibird: {
    name: ['Delibird'],
    sources: {
      ps: {},
      serebii: { id: '225' },
      pmd: { id: '0225' },
      psgh: { id: 's7200' },
    },
  },
  mantine: {
    name: ['Mantine'],
    sources: {
      ps: {},
      serebii: { id: '226' },
      pmd: { id: '0226' },
      psgh: { id: 's7232' },
    },
  },
  skarmory: {
    name: ['Skarmory'],
    sources: {
      ps: {},
      serebii: { id: '227' },
      pmd: { id: '0227' },
      psgh: { id: 's7264' },
    },
  },
  skarmorymega: {
    name: ['Mega Skarmory', 'Skarmory-Mega'],
    sources: {
      ps: {},
      serebii: { id: '227' },
      pmd: { id: '0227' },
      psgh: { id: 's7264' },
    },
  },
  houndour: {
    name: ['Houndour'],
    sources: {
      ps: {},
      serebii: { id: '228' },
      pmd: { id: '0228' },
      psgh: { id: 's7296' },
    },
  },
  houndoom: {
    name: ['Houndoom'],
    sources: {
      ps: { flip: true },
      serebii: { id: '229' },
      pmd: { id: '0229' },
      psgh: { id: 's7328', flip: true },
    },
  },
  houndoommega: {
    name: ['Mega Houndoom', 'Houndoom-Mega'],
    sources: {
      ps: { id: 'houndoom-mega' },
      serebii: { id: '229-m' },
      pmd: { id: '0229/0001' },
      psgh: { id: 's7329' },
    },
  },
  kingdra: {
    name: ['Kingdra'],
    sources: {
      ps: {},
      serebii: { id: '230' },
      pmd: { id: '0230' },
      psgh: { id: 's7360' },
    },
  },
  phanpy: {
    name: ['Phanpy'],
    sources: {
      ps: {},
      serebii: { id: '231' },
      pmd: { id: '0231' },
      psgh: { id: 's7392' },
    },
  },
  donphan: {
    name: ['Donphan'],
    sources: {
      ps: {},
      serebii: { id: '232' },
      pmd: { id: '0232' },
      psgh: { id: 's7424' },
    },
  },
  porygon2: {
    name: ['Porygon2'],
    sources: {
      ps: { flip: true },
      serebii: { id: '233' },
      pmd: { id: '0233' },
      psgh: { id: 's7456', flip: true },
    },
  },
  stantler: {
    name: ['Stantler'],
    sources: {
      ps: {},
      serebii: { id: '234' },
      pmd: { id: '0234' },
      psgh: { id: 's7488' },
    },
  },
  smeargle: {
    name: ['Smeargle'],
    sources: {
      ps: {},
      serebii: { id: '235' },
      pmd: { id: '0235' },
      psgh: { id: 's7520' },
    },
  },
  tyrogue: {
    name: ['Tyrogue'],
    sources: {
      ps: {},
      serebii: { id: '236' },
      pmd: { id: '0236' },
      psgh: { id: 's7552' },
    },
  },
  hitmontop: {
    name: ['Hitmontop'],
    sources: {
      ps: { flip: true },
      serebii: { id: '237' },
      pmd: { id: '0237' },
      psgh: { id: 's7584', flip: true },
    },
  },
  smoochum: {
    name: ['Smoochum'],
    sources: {
      ps: {},
      serebii: { id: '238' },
      pmd: { id: '0238' },
      psgh: { id: 's7616' },
    },
  },
  elekid: {
    name: ['Elekid'],
    sources: {
      ps: {},
      serebii: { id: '239' },
      pmd: { id: '0239' },
      psgh: { id: 's7648' },
    },
  },
  magby: {
    name: ['Magby'],
    sources: {
      ps: {},
      serebii: { id: '240' },
      pmd: { id: '0240' },
      psgh: { id: 's7680' },
    },
  },
  miltank: {
    name: ['Miltank'],
    sources: {
      ps: { flip: true },
      serebii: { id: '241' },
      pmd: { id: '0241' },
      psgh: { id: 's7712', flip: true },
    },
  },
  blissey: {
    name: ['Blissey'],
    sources: {
      ps: { flip: true },
      serebii: { id: '242' },
      pmd: { id: '0242' },
      psgh: { id: 's7744', flip: true },
    },
  },
  raikou: {
    name: ['Raikou'],
    sources: {
      ps: {},
      serebii: { id: '243' },
      pmd: { id: '0243' },
      psgh: { id: 's7776' },
    },
  },
  entei: {
    name: ['Entei'],
    sources: {
      ps: {},
      serebii: { id: '244' },
      pmd: { id: '0244' },
      psgh: { id: 's7808' },
    },
  },
  suicune: {
    name: ['Suicune'],
    sources: {
      ps: {},
      serebii: { id: '245' },
      pmd: { id: '0245' },
      psgh: { id: 's7840' },
    },
  },
  larvitar: {
    name: ['Larvitar'],
    sources: {
      ps: {},
      serebii: { id: '246' },
      pmd: { id: '0246' },
      psgh: { id: 's7872' },
    },
  },
  pupitar: {
    name: ['Pupitar'],
    sources: {
      ps: { flip: true },
      serebii: { id: '247' },
      pmd: { id: '0247' },
      psgh: { id: 's7904', flip: true },
    },
  },
  tyranitar: {
    name: ['Tyranitar'],
    sources: {
      ps: {},
      serebii: { id: '248' },
      pmd: { id: '0248' },
      psgh: { id: 's7936' },
    },
  },
  tyranitarmega: {
    name: ['Mega Tyranitar', 'Tyranitar-Mega'],
    sources: {
      ps: { id: 'tyranitar-mega' },
      serebii: { id: '248-m' },
      pmd: { id: '0248/0001' },
      psgh: { id: 's7937' },
    },
  },
  lugia: {
    name: ['Lugia'],
    sources: {
      ps: {},
      serebii: { id: '249' },
      pmd: { id: '0249' },
      psgh: { id: 's7968' },
    },
  },
  hooh: {
    name: ['Ho-Oh'],
    sources: {
      ps: { flip: true },
      serebii: { id: '250' },
      pmd: { id: '0250' },
      psgh: { id: 's8000', flip: true },
    },
  },
  celebi: {
    name: ['Celebi'],
    sources: {
      ps: {},
      serebii: { id: '251' },
      pmd: { id: '0251' },
      psgh: { id: 's8032' },
    },
  },
  treecko: {
    name: ['Treecko'],
    sources: {
      ps: { flip: true },
      serebii: { id: '252' },
      pmd: { id: '0252' },
      psgh: { id: 's8064', flip: true },
    },
  },
  grovyle: {
    name: ['Grovyle'],
    sources: {
      ps: {},
      serebii: { id: '253' },
      pmd: { id: '0253' },
      psgh: { id: 's8096' },
    },
  },
  sceptile: {
    name: ['Sceptile'],
    sources: {
      ps: {},
      serebii: { id: '254' },
      pmd: { id: '0254' },
      psgh: { id: 's8128' },
    },
  },
  sceptilemega: {
    name: ['Mega Sceptile', 'Sceptile-Mega'],
    sources: {
      ps: { id: 'sceptile-mega' },
      serebii: { id: '254-m' },
      pmd: { id: '0254/0001' },
      psgh: { id: 's8129' },
    },
  },
  torchic: {
    name: ['Torchic'],
    sources: {
      ps: {},
      serebii: { id: '255' },
      pmd: { id: '0255' },
      psgh: { id: 's8160' },
    },
  },
  combusken: {
    name: ['Combusken'],
    sources: {
      ps: {},
      serebii: { id: '256' },
      pmd: { id: '0256' },
      psgh: { id: 's8192' },
    },
  },
  blaziken: {
    name: ['Blaziken'],
    sources: {
      ps: { flip: true },
      serebii: { id: '257' },
      pmd: { id: '0257' },
      psgh: { id: 's8224', flip: true },
    },
  },
  blazikenmega: {
    name: ['Mega Blaziken', 'Blaziken-Mega'],
    sources: {
      ps: { id: 'blaziken-mega' },
      serebii: { id: '257-m' },
      pmd: { id: '0257/0001' },
      psgh: { id: 's8225' },
    },
  },
  mudkip: {
    name: ['Mudkip'],
    sources: {
      ps: {},
      serebii: { id: '258' },
      pmd: { id: '0258' },
      psgh: { id: 's8256' },
    },
  },
  marshtomp: {
    name: ['Marshtomp'],
    sources: {
      ps: { flip: true },
      serebii: { id: '259' },
      pmd: { id: '0259' },
      psgh: { id: 's8288', flip: true },
    },
  },
  swampert: {
    name: ['Swampert'],
    sources: {
      ps: {},
      serebii: { id: '260' },
      pmd: { id: '0260' },
      psgh: { id: 's8320' },
    },
  },
  swampertmega: {
    name: ['Mega Swampert', 'Swampert-Mega'],
    sources: {
      ps: { id: 'swampert-mega' },
      serebii: { id: '260-m' },
      pmd: { id: '0260/0001' },
      psgh: { id: 's8321' },
    },
  },
  poochyena: {
    name: ['Poochyena'],
    sources: {
      ps: {},
      serebii: { id: '261' },
      pmd: { id: '0261' },
      psgh: { id: 's8352' },
    },
  },
  mightyena: {
    name: ['Mightyena'],
    sources: {
      ps: {},
      serebii: { id: '262' },
      pmd: { id: '0262' },
      psgh: { id: 's8384' },
    },
  },
  zigzagoon: {
    name: ['Zigzagoon'],
    sources: {
      ps: {},
      serebii: { id: '263' },
      pmd: { id: '0263' },
      psgh: { id: 's8416' },
    },
  },
  zigzagoongalar: {
    name: ['Galarian Zigzagoon', 'Zigzagoon-Galar', 'Zigzagoon-G'],
    sources: {
      ps: { id: 'zigzagoon-galar' },
      serebii: { id: '263-g' },
      pmd: { id: '0263/0001' },
      psgh: { id: 's8417' },
    },
  },
  linoone: {
    name: ['Linoone'],
    sources: {
      ps: {},
      serebii: { id: '264' },
      pmd: { id: '0264' },
      psgh: { id: 's8448' },
    },
  },
  linoonegalar: {
    name: ['Galarian Linoone', 'Linoone-Galar', 'Linoone-G'],
    sources: {
      ps: { id: 'linoone-galar', flip: true },
      serebii: { id: '264-g' },
      pmd: { id: '0264/0001' },
      psgh: { id: 's8449', flip: true },
    },
  },
  wurmple: {
    name: ['Wurmple'],
    sources: {
      ps: {},
      serebii: { id: '265' },
      pmd: { id: '0265' },
      psgh: { id: 's8480' },
    },
  },
  silcoon: {
    name: ['Silcoon'],
    sources: {
      ps: {},
      serebii: { id: '266' },
      pmd: { id: '0266' },
      psgh: { id: 's8512' },
    },
  },
  beautifly: {
    name: ['Beautifly'],
    sources: {
      ps: {},
      serebii: { id: '267' },
      pmd: { id: '0267' },
      psgh: { id: 's8544' },
    },
  },
  cascoon: {
    name: ['Cascoon'],
    sources: {
      ps: { flip: true },
      serebii: { id: '268' },
      pmd: { id: '0268' },
      psgh: { id: 's8576', flip: true },
    },
  },
  dustox: {
    name: ['Dustox'],
    sources: {
      ps: { flip: true },
      serebii: { id: '269' },
      pmd: { id: '0269' },
      psgh: { id: 's8608', flip: true },
    },
  },
  lotad: {
    name: ['Lotad'],
    sources: {
      ps: {},
      serebii: { id: '270' },
      pmd: { id: '0270' },
      psgh: { id: 's8640' },
    },
  },
  lombre: {
    name: ['Lombre'],
    sources: {
      ps: {},
      serebii: { id: '271' },
      pmd: { id: '0271' },
      psgh: { id: 's8672' },
    },
  },
  ludicolo: {
    name: ['Ludicolo'],
    sources: {
      ps: {},
      serebii: { id: '272' },
      pmd: { id: '0272' },
      psgh: { id: 's8704' },
    },
  },
  seedot: {
    name: ['Seedot'],
    sources: {
      ps: {},
      serebii: { id: '273' },
      pmd: { id: '0273' },
      psgh: { id: 's8736' },
    },
  },
  nuzleaf: {
    name: ['Nuzleaf'],
    sources: {
      ps: {},
      serebii: { id: '274' },
      pmd: { id: '0274' },
      psgh: { id: 's8768' },
    },
  },
  shiftry: {
    name: ['Shiftry'],
    sources: {
      ps: {},
      serebii: { id: '275' },
      pmd: { id: '0275' },
      psgh: { id: 's8800' },
    },
  },
  taillow: {
    name: ['Taillow'],
    sources: {
      ps: {},
      serebii: { id: '276' },
      pmd: { id: '0276' },
      psgh: { id: 's8832' },
    },
  },
  swellow: {
    name: ['Swellow'],
    sources: {
      ps: {},
      serebii: { id: '277' },
      pmd: { id: '0277' },
      psgh: { id: 's8864' },
    },
  },
  wingull: {
    name: ['Wingull'],
    sources: {
      ps: {},
      serebii: { id: '278' },
      pmd: { id: '0278' },
      psgh: { id: 's8896' },
    },
  },
  pelipper: {
    name: ['Pelipper'],
    sources: {
      ps: {},
      serebii: { id: '279' },
      pmd: { id: '0279' },
      psgh: { id: 's8928' },
    },
  },
  ralts: {
    name: ['Ralts'],
    sources: {
      ps: {},
      serebii: { id: '280' },
      pmd: { id: '0280' },
      psgh: { id: 's8960' },
    },
  },
  kirlia: {
    name: ['Kirlia'],
    sources: {
      ps: {},
      serebii: { id: '281' },
      pmd: { id: '0281' },
      psgh: { id: 's8992' },
    },
  },
  gardevoir: {
    name: ['Gardevoir'],
    sources: {
      ps: { flip: true },
      serebii: { id: '282' },
      pmd: { id: '0282' },
      psgh: { id: 's9024', flip: true },
    },
  },
  gardevoirmega: {
    name: ['Mega Gardevoir', 'Gardevoir-Mega'],
    sources: {
      ps: { id: 'gardevoir-mega' },
      serebii: { id: '282-m' },
      pmd: { id: '0282/0001' },
      psgh: { id: 's9025' },
    },
  },
  surskit: {
    name: ['Surskit'],
    sources: {
      ps: {},
      serebii: { id: '283' },
      pmd: { id: '0283' },
      psgh: { id: 's9056' },
    },
  },
  masquerain: {
    name: ['Masquerain'],
    sources: {
      ps: {},
      serebii: { id: '284' },
      pmd: { id: '0284' },
      psgh: { id: 's9088' },
    },
  },
  shroomish: {
    name: ['Shroomish'],
    sources: {
      ps: {},
      serebii: { id: '285' },
      pmd: { id: '0285' },
      psgh: { id: 's9120' },
    },
  },
  breloom: {
    name: ['Breloom'],
    sources: {
      ps: {},
      serebii: { id: '286' },
      pmd: { id: '0286' },
      psgh: { id: 's9152' },
    },
  },
  slakoth: {
    name: ['Slakoth'],
    sources: {
      ps: {},
      serebii: { id: '287' },
      pmd: { id: '0287' },
      psgh: { id: 's9184' },
    },
  },
  vigoroth: {
    name: ['Vigoroth'],
    sources: {
      ps: {},
      serebii: { id: '288' },
      pmd: { id: '0288' },
      psgh: { id: 's9216' },
    },
  },
  slaking: {
    name: ['Slaking'],
    sources: {
      ps: {},
      serebii: { id: '289' },
      pmd: { id: '0289' },
      psgh: { id: 's9248' },
    },
  },
  nincada: {
    name: ['Nincada'],
    sources: {
      ps: {},
      serebii: { id: '290' },
      pmd: { id: '0290' },
      psgh: { id: 's9280' },
    },
  },
  ninjask: {
    name: ['Ninjask'],
    sources: {
      ps: {},
      serebii: { id: '291' },
      pmd: { id: '0291' },
      psgh: { id: 's9312' },
    },
  },
  shedinja: {
    name: ['Shedinja'],
    sources: {
      ps: {},
      serebii: { id: '292' },
      pmd: { id: '0292' },
      psgh: { id: 's9344' },
    },
  },
  whismur: {
    name: ['Whismur'],
    sources: {
      ps: { flip: true },
      serebii: { id: '293' },
      pmd: { id: '0293' },
      psgh: { id: 's9376', flip: true },
    },
  },
  loudred: {
    name: ['Loudred'],
    sources: {
      ps: {},
      serebii: { id: '294' },
      pmd: { id: '0294' },
      psgh: { id: 's9408' },
    },
  },
  exploud: {
    name: ['Exploud'],
    sources: {
      ps: {},
      serebii: { id: '295' },
      pmd: { id: '0295' },
      psgh: { id: 's9440' },
    },
  },
  makuhita: {
    name: ['Makuhita'],
    sources: {
      ps: {},
      serebii: { id: '296' },
      pmd: { id: '0296' },
      psgh: { id: 's9472' },
    },
  },
  hariyama: {
    name: ['Hariyama'],
    sources: {
      ps: {},
      serebii: { id: '297' },
      pmd: { id: '0297' },
      psgh: { id: 's9504' },
    },
  },
  azurill: {
    name: ['Azurill'],
    sources: {
      ps: {},
      serebii: { id: '298' },
      pmd: { id: '0298' },
      psgh: { id: 's9536' },
    },
  },
  nosepass: {
    name: ['Nosepass'],
    sources: {
      ps: { flip: true },
      serebii: { id: '299' },
      pmd: { id: '0299' },
      psgh: { id: 's9568', flip: true },
    },
  },
  skitty: {
    name: ['Skitty'],
    sources: {
      ps: {},
      serebii: { id: '300' },
      pmd: { id: '0300' },
      psgh: { id: 's9600' },
    },
  },
  delcatty: {
    name: ['Delcatty'],
    sources: {
      ps: {},
      serebii: { id: '301' },
      pmd: { id: '0301' },
      psgh: { id: 's9632' },
    },
  },
  sableye: {
    name: ['Sableye'],
    sources: {
      ps: {},
      serebii: { id: '302' },
      pmd: { id: '0302' },
      psgh: { id: 's9664' },
    },
  },
  sableyemega: {
    name: ['Mega Sableye', 'Sableye-Mega'],
    sources: {
      ps: { id: 'sableye-mega' },
      serebii: { id: '302-m' },
      pmd: { id: '0302/0001' },
      psgh: { id: 's9665' },
    },
  },
  mawile: {
    name: ['Mawile'],
    sources: {
      ps: { flip: true },
      serebii: { id: '303' },
      pmd: { id: '0303' },
      psgh: { id: 's9696', flip: true },
    },
  },
  mawilemega: {
    name: ['Mega Mawile', 'Mawile-Mega'],
    sources: {
      ps: { id: 'mawile-mega' },
      serebii: { id: '303-m' },
      pmd: { id: '0303/0001' },
      psgh: { id: 's9697' },
    },
  },
  aron: {
    name: ['Aron'],
    sources: {
      ps: {},
      serebii: { id: '304' },
      pmd: { id: '0304' },
      psgh: { id: 's9728' },
    },
  },
  lairon: {
    name: ['Lairon'],
    sources: {
      ps: {},
      serebii: { id: '305' },
      pmd: { id: '0305' },
      psgh: { id: 's9760' },
    },
  },
  aggron: {
    name: ['Aggron'],
    sources: {
      ps: {},
      serebii: { id: '306' },
      pmd: { id: '0306' },
      psgh: { id: 's9792' },
    },
  },
  aggronmega: {
    name: ['Mega Aggron', 'Aggron-Mega'],
    sources: {
      ps: { id: 'aggron-mega' },
      serebii: { id: '306-m' },
      pmd: { id: '0306/0001' },
      psgh: { id: 's9793' },
    },
  },
  meditite: {
    name: ['Meditite'],
    sources: {
      ps: {},
      serebii: { id: '307' },
      pmd: { id: '0307' },
      psgh: { id: 's9824' },
    },
  },
  medicham: {
    name: ['Medicham'],
    sources: {
      ps: {},
      serebii: { id: '308' },
      pmd: { id: '0308' },
      psgh: { id: 's9856' },
    },
  },
  medichammega: {
    name: ['Mega Medicham', 'Medicham-Mega'],
    sources: {
      ps: { id: 'medicham-mega' },
      serebii: { id: '308-m' },
      pmd: { id: '0308/0001' },
      psgh: { id: 's9857' },
    },
  },
  electrike: {
    name: ['Electrike'],
    sources: {
      ps: {},
      serebii: { id: '309' },
      pmd: { id: '0309' },
      psgh: { id: 's9888' },
    },
  },
  manectric: {
    name: ['Manectric'],
    sources: {
      ps: {},
      serebii: { id: '310' },
      pmd: { id: '0310' },
      psgh: { id: 's9920' },
    },
  },
  manectricmega: {
    name: ['Mega Manectric', 'Manectric-Mega'],
    sources: {
      ps: { id: 'manectric-mega' },
      serebii: { id: '310-m' },
      pmd: { id: '0310/0001' },
      psgh: { id: 's9921' },
    },
  },
  plusle: {
    name: ['Plusle'],
    sources: {
      ps: {},
      serebii: { id: '311' },
      pmd: { id: '0311' },
      psgh: { id: 's9952' },
    },
  },
  minun: {
    name: ['Minun'],
    sources: {
      ps: {},
      serebii: { id: '312' },
      pmd: { id: '0312' },
      psgh: { id: 's9984' },
    },
  },
  volbeat: {
    name: ['Volbeat'],
    sources: {
      ps: {},
      serebii: { id: '313' },
      pmd: { id: '0313' },
      psgh: { id: 's10016' },
    },
  },
  illumise: {
    name: ['Illumise'],
    sources: {
      ps: {},
      serebii: { id: '314' },
      pmd: { id: '0314' },
      psgh: { id: 's10048' },
    },
  },
  roselia: {
    name: ['Roselia'],
    sources: {
      ps: {},
      serebii: { id: '315' },
      pmd: { id: '0315' },
      psgh: { id: 's10080' },
    },
  },
  gulpin: {
    name: ['Gulpin'],
    sources: {
      ps: {},
      serebii: { id: '316' },
      pmd: { id: '0316' },
      psgh: { id: 's10112' },
    },
  },
  swalot: {
    name: ['Swalot'],
    sources: {
      ps: { flip: true },
      serebii: { id: '317' },
      pmd: { id: '0317' },
      psgh: { id: 's10144', flip: true },
    },
  },
  carvanha: {
    name: ['Carvanha'],
    sources: {
      ps: {},
      serebii: { id: '318' },
      pmd: { id: '0318' },
      psgh: { id: 's10176' },
    },
  },
  sharpedo: {
    name: ['Sharpedo'],
    sources: {
      ps: {},
      serebii: { id: '319' },
      pmd: { id: '0319' },
      psgh: { id: 's10208' },
    },
  },
  sharpedomega: {
    name: ['Mega Sharpedo', 'Sharpedo-Mega'],
    sources: {
      ps: { id: 'sharpedo-mega' },
      serebii: { id: '319-m' },
      pmd: { id: '0319/0001' },
      psgh: { id: 's10209' },
    },
  },
  wailmer: {
    name: ['Wailmer'],
    sources: {
      ps: {},
      serebii: { id: '320' },
      pmd: { id: '0320' },
      psgh: { id: 's10240' },
    },
  },
  wailord: {
    name: ['Wailord'],
    sources: {
      ps: {},
      serebii: { id: '321' },
      pmd: { id: '0321' },
      psgh: { id: 's10272' },
    },
  },
  numel: {
    name: ['Numel'],
    sources: {
      ps: {},
      serebii: { id: '322' },
      pmd: { id: '0322' },
      psgh: { id: 's10304' },
    },
  },
  camerupt: {
    name: ['Camerupt'],
    sources: {
      ps: {},
      serebii: { id: '323' },
      pmd: { id: '0323' },
      psgh: { id: 's10336' },
    },
  },
  cameruptmega: {
    name: ['Mega Camerupt', 'Camerupt-Mega'],
    sources: {
      ps: { id: 'camerupt-mega' },
      serebii: { id: '323-m' },
      pmd: { id: '0323/0001' },
      psgh: { id: 's10337' },
    },
  },
  torkoal: {
    name: ['Torkoal'],
    sources: {
      ps: {},
      serebii: { id: '324' },
      pmd: { id: '0324' },
      psgh: { id: 's10368' },
    },
  },
  spoink: {
    name: ['Spoink'],
    sources: {
      ps: {},
      serebii: { id: '325' },
      pmd: { id: '0325' },
      psgh: { id: 's10400' },
    },
  },
  grumpig: {
    name: ['Grumpig'],
    sources: {
      ps: {},
      serebii: { id: '326' },
      pmd: { id: '0326' },
      psgh: { id: 's10432' },
    },
  },
  spinda: {
    name: ['Spinda'],
    sources: {
      ps: {},
      serebii: { id: '327' },
      pmd: { id: '0327' },
      psgh: { id: 's10464' },
    },
  },
  trapinch: {
    name: ['Trapinch'],
    sources: {
      ps: {},
      serebii: { id: '328' },
      pmd: { id: '0328' },
      psgh: { id: 's10496' },
    },
  },
  vibrava: {
    name: ['Vibrava'],
    sources: {
      ps: {},
      serebii: { id: '329' },
      pmd: { id: '0329' },
      psgh: { id: 's10528' },
    },
  },
  flygon: {
    name: ['Flygon'],
    sources: {
      ps: {},
      serebii: { id: '330' },
      pmd: { id: '0330' },
      psgh: { id: 's10560' },
    },
  },
  cacnea: {
    name: ['Cacnea'],
    sources: {
      ps: {},
      serebii: { id: '331' },
      pmd: { id: '0331' },
      psgh: { id: 's10592' },
    },
  },
  cacturne: {
    name: ['Cacturne'],
    sources: {
      ps: {},
      serebii: { id: '332' },
      pmd: { id: '0332' },
      psgh: { id: 's10624' },
    },
  },
  swablu: {
    name: ['Swablu'],
    sources: {
      ps: {},
      serebii: { id: '333' },
      pmd: { id: '0333' },
      psgh: { id: 's10656' },
    },
  },
  altaria: {
    name: ['Altaria'],
    sources: {
      ps: {},
      serebii: { id: '334' },
      pmd: { id: '0334' },
      psgh: { id: 's10688' },
    },
  },
  altariamega: {
    name: ['Mega Altaria', 'Altaria-Mega'],
    sources: {
      ps: { id: 'altaria-mega' },
      serebii: { id: '334-m' },
      pmd: { id: '0334/0001' },
      psgh: { id: 's10689' },
    },
  },
  zangoose: {
    name: ['Zangoose'],
    sources: {
      ps: {},
      serebii: { id: '335' },
      pmd: { id: '0335' },
      psgh: { id: 's10720' },
    },
  },
  seviper: {
    name: ['Seviper'],
    sources: {
      ps: {},
      serebii: { id: '336' },
      pmd: { id: '0336' },
      psgh: { id: 's10752' },
    },
  },
  lunatone: {
    name: ['Lunatone'],
    sources: {
      ps: {},
      serebii: { id: '337' },
      pmd: { id: '0337' },
      psgh: { id: 's10784' },
    },
  },
  solrock: {
    name: ['Solrock'],
    sources: {
      ps: {},
      serebii: { id: '338' },
      pmd: { id: '0338' },
      psgh: { id: 's10816' },
    },
  },
  barboach: {
    name: ['Barboach'],
    sources: {
      ps: {},
      serebii: { id: '339' },
      pmd: { id: '0339' },
      psgh: { id: 's10848' },
    },
  },
  whiscash: {
    name: ['Whiscash'],
    sources: {
      ps: {},
      serebii: { id: '340' },
      pmd: { id: '0340' },
      psgh: { id: 's10880' },
    },
  },
  corphish: {
    name: ['Corphish'],
    sources: {
      ps: {},
      serebii: { id: '341' },
      pmd: { id: '0341' },
      psgh: { id: 's10912' },
    },
  },
  crawdaunt: {
    name: ['Crawdaunt'],
    sources: {
      ps: {},
      serebii: { id: '342' },
      pmd: { id: '0342' },
      psgh: { id: 's10944' },
    },
  },
  baltoy: {
    name: ['Baltoy'],
    sources: {
      ps: {},
      serebii: { id: '343' },
      pmd: { id: '0343' },
      psgh: { id: 's10976' },
    },
  },
  claydol: {
    name: ['Claydol'],
    sources: {
      ps: {},
      serebii: { id: '344' },
      pmd: { id: '0344' },
      psgh: { id: 's11008' },
    },
  },
  lileep: {
    name: ['Lileep'],
    sources: {
      ps: {},
      serebii: { id: '345' },
      pmd: { id: '0345' },
      psgh: { id: 's11040' },
    },
  },
  cradily: {
    name: ['Cradily'],
    sources: {
      ps: {},
      serebii: { id: '346' },
      pmd: { id: '0346' },
      psgh: { id: 's11072' },
    },
  },
  anorith: {
    name: ['Anorith'],
    sources: {
      ps: {},
      serebii: { id: '347' },
      pmd: { id: '0347' },
      psgh: { id: 's11104' },
    },
  },
  armaldo: {
    name: ['Armaldo'],
    sources: {
      ps: {},
      serebii: { id: '348' },
      pmd: { id: '0348' },
      psgh: { id: 's11136' },
    },
  },
  feebas: {
    name: ['Feebas'],
    sources: {
      ps: {},
      serebii: { id: '349' },
      pmd: { id: '0349' },
      psgh: { id: 's11168' },
    },
  },
  milotic: {
    name: ['Milotic'],
    sources: {
      ps: {},
      serebii: { id: '350' },
      pmd: { id: '0350' },
      psgh: { id: 's11200' },
    },
  },
  castform: {
    name: ['Castform'],
    sources: {
      ps: {},
      serebii: { id: '351' },
      pmd: { id: '0351' },
      psgh: { id: 's11232' },
    },
  },
  castformsunny: {
    name: ['Castform-Sunny'],
    sources: {
      ps: { id: 'castform-sunny', flip: true },
      serebii: { id: '351-s' },
      pmd: { id: '0351/0001' },
      psgh: { id: 's11233', flip: true },
    },
  },
  castformrainy: {
    name: ['Castform-Rainy'],
    sources: {
      ps: { id: 'castform-rainy' },
      serebii: { id: '351-r' },
      pmd: { id: '0351/0002' },
      psgh: { id: 's11234' },
    },
  },
  castformsnowy: {
    name: ['Castform-Snowy'],
    sources: {
      ps: { id: 'castform-snowy' },
      serebii: { id: '351-i' },
      pmd: { id: '0351/0003' },
      psgh: { id: 's11235' },
    },
  },
  kecleon: {
    name: ['Kecleon'],
    sources: {
      ps: {},
      serebii: { id: '352' },
      pmd: { id: '0352' },
      psgh: { id: 's11264' },
    },
  },
  shuppet: {
    name: ['Shuppet'],
    sources: {
      ps: { flip: true },
      serebii: { id: '353' },
      pmd: { id: '0353' },
      psgh: { id: 's11296', flip: true },
    },
  },
  banette: {
    name: ['Banette'],
    sources: {
      ps: {},
      serebii: { id: '354' },
      pmd: { id: '0354' },
      psgh: { id: 's11328' },
    },
  },
  banettemega: {
    name: ['Mega Banette', 'Banette-Mega'],
    sources: {
      ps: { id: 'banette-mega' },
      serebii: { id: '354-m' },
      pmd: { id: '0354/0001' },
      psgh: { id: 's11329' },
    },
  },
  duskull: {
    name: ['Duskull'],
    sources: {
      ps: {},
      serebii: { id: '355' },
      pmd: { id: '0355' },
      psgh: { id: 's11360' },
    },
  },
  dusclops: {
    name: ['Dusclops'],
    sources: {
      ps: {},
      serebii: { id: '356' },
      pmd: { id: '0356' },
      psgh: { id: 's11392' },
    },
  },
  tropius: {
    name: ['Tropius'],
    sources: {
      ps: {},
      serebii: { id: '357' },
      pmd: { id: '0357' },
      psgh: { id: 's11424' },
    },
  },
  chimecho: {
    name: ['Chimecho'],
    sources: {
      ps: {},
      serebii: { id: '358' },
      pmd: { id: '0358' },
      psgh: { id: 's11456' },
    },
  },
  chimechomega: {
    name: ['Mega Chimecho', 'Chimecho-Mega'],
    sources: {
      ps: { id: 'chimecho-mega' },
      serebii: { id: '358' },
      pmd: { id: '0358' },
      psgh: { id: 's11456' },
    },
  },
  absol: {
    name: ['Absol'],
    sources: {
      ps: {},
      serebii: { id: '359' },
      pmd: { id: '0359' },
      psgh: { id: 's11488' },
    },
  },
  absolmega: {
    name: ['Mega Absol', 'Absol-Mega'],
    sources: {
      ps: { id: 'absol-mega' },
      serebii: { id: '359-m' },
      pmd: { id: '0359/0001' },
      psgh: { id: 's11489' },
    },
  },
  absolmegaz: {
    name: ['Mega Absol Z', 'Absol-Mega-Z'],
    sources: {
      ps: { id: 'absol-megaz' },
      serebii: { id: '359-m' },
      pmd: { id: '0359/0001' },
      psgh: { id: 's11489' },
    },
  },
  wynaut: {
    name: ['Wynaut'],
    sources: {
      ps: {},
      serebii: { id: '360' },
      pmd: { id: '0360' },
      psgh: { id: 's11520' },
    },
  },
  snorunt: {
    name: ['Snorunt'],
    sources: {
      ps: {},
      serebii: { id: '361' },
      pmd: { id: '0361' },
      psgh: { id: 's11552' },
    },
  },
  glalie: {
    name: ['Glalie'],
    sources: {
      ps: {},
      serebii: { id: '362' },
      pmd: { id: '0362' },
      psgh: { id: 's11584' },
    },
  },
  glaliemega: {
    name: ['Mega Glalie', 'Glalie-Mega'],
    sources: {
      ps: { id: 'glalie-mega', flip: true },
      serebii: { id: '362-m' },
      pmd: { id: '0362/0001' },
      psgh: { id: 's11585', flip: true },
    },
  },
  spheal: {
    name: ['Spheal'],
    sources: {
      ps: {},
      serebii: { id: '363' },
      pmd: { id: '0363' },
      psgh: { id: 's11616' },
    },
  },
  sealeo: {
    name: ['Sealeo'],
    sources: {
      ps: { flip: true },
      serebii: { id: '364' },
      pmd: { id: '0364' },
      psgh: { id: 's11648', flip: true },
    },
  },
  walrein: {
    name: ['Walrein'],
    sources: {
      ps: {},
      serebii: { id: '365' },
      pmd: { id: '0365' },
      psgh: { id: 's11680' },
    },
  },
  clamperl: {
    name: ['Clamperl'],
    sources: {
      ps: {},
      serebii: { id: '366' },
      pmd: { id: '0366' },
      psgh: { id: 's11712' },
    },
  },
  huntail: {
    name: ['Huntail'],
    sources: {
      ps: {},
      serebii: { id: '367' },
      pmd: { id: '0367' },
      psgh: { id: 's11744' },
    },
  },
  gorebyss: {
    name: ['Gorebyss'],
    sources: {
      ps: {},
      serebii: { id: '368' },
      pmd: { id: '0368' },
      psgh: { id: 's11776' },
    },
  },
  relicanth: {
    name: ['Relicanth'],
    sources: {
      ps: {},
      serebii: { id: '369' },
      pmd: { id: '0369' },
      psgh: { id: 's11808' },
    },
  },
  luvdisc: {
    name: ['Luvdisc'],
    sources: {
      ps: {},
      serebii: { id: '370' },
      pmd: { id: '0370' },
      psgh: { id: 's11840' },
    },
  },
  bagon: {
    name: ['Bagon'],
    sources: {
      ps: {},
      serebii: { id: '371' },
      pmd: { id: '0371' },
      psgh: { id: 's11872' },
    },
  },
  shelgon: {
    name: ['Shelgon'],
    sources: {
      ps: {},
      serebii: { id: '372' },
      pmd: { id: '0372' },
      psgh: { id: 's11904' },
    },
  },
  salamence: {
    name: ['Salamence'],
    sources: {
      ps: {},
      serebii: { id: '373' },
      pmd: { id: '0373' },
      psgh: { id: 's11936' },
    },
  },
  salamencemega: {
    name: ['Mega Salamence', 'Salamence-Mega'],
    sources: {
      ps: { id: 'salamence-mega' },
      serebii: { id: '373-m' },
      pmd: { id: '0373/0001' },
      psgh: { id: 's11937' },
    },
  },
  beldum: {
    name: ['Beldum'],
    sources: {
      ps: {},
      serebii: { id: '374' },
      pmd: { id: '0374' },
      psgh: { id: 's11968' },
    },
  },
  metang: {
    name: ['Metang'],
    sources: {
      ps: {},
      serebii: { id: '375' },
      pmd: { id: '0375' },
      psgh: { id: 's12000' },
    },
  },
  metagross: {
    name: ['Metagross'],
    sources: {
      ps: {},
      serebii: { id: '376' },
      pmd: { id: '0376' },
      psgh: { id: 's12032' },
    },
  },
  metagrossmega: {
    name: ['Mega Metagross', 'Metagross-Mega'],
    sources: {
      ps: { id: 'metagross-mega' },
      serebii: { id: '376-m' },
      pmd: { id: '0376/0001' },
      psgh: { id: 's12033' },
    },
  },
  regirock: {
    name: ['Regirock'],
    sources: {
      ps: {},
      serebii: { id: '377' },
      pmd: { id: '0377' },
      psgh: { id: 's12064' },
    },
  },
  regice: {
    name: ['Regice'],
    sources: {
      ps: { flip: true },
      serebii: { id: '378' },
      pmd: { id: '0378' },
      psgh: { id: 's12096', flip: true },
    },
  },
  registeel: {
    name: ['Registeel'],
    sources: {
      ps: {},
      serebii: { id: '379' },
      pmd: { id: '0379' },
      psgh: { id: 's12128' },
    },
  },
  latias: {
    name: ['Latias'],
    sources: {
      ps: {},
      serebii: { id: '380' },
      pmd: { id: '0380' },
      psgh: { id: 's12160' },
    },
  },
  latiasmega: {
    name: ['Mega Latias', 'Latias-Mega'],
    sources: {
      ps: { id: 'latias-mega', flip: true },
      serebii: { id: '380-m' },
      pmd: { id: '0380/0001' },
      psgh: { id: 's12161', flip: true },
    },
  },
  latios: {
    name: ['Latios'],
    sources: {
      ps: {},
      serebii: { id: '381' },
      pmd: { id: '0381' },
      psgh: { id: 's12192' },
    },
  },
  latiosmega: {
    name: ['Mega Latios', 'Latios-Mega'],
    sources: {
      ps: { id: 'latios-mega' },
      serebii: { id: '381-m' },
      pmd: { id: '0381/0001' },
      psgh: { id: 's12193' },
    },
  },
  kyogre: {
    name: ['Kyogre'],
    sources: {
      ps: {},
      serebii: { id: '382' },
      pmd: { id: '0382' },
      psgh: { id: 's12224' },
    },
  },
  kyogreprimal: {
    name: ['Primal Kyogre', 'Kyogre-Primal'],
    sources: {
      ps: { id: 'kyogre-primal' },
      serebii: { id: '382-p' },
      pmd: { id: '0382/0001' },
      psgh: { id: 's12225' },
    },
  },
  groudon: {
    name: ['Groudon'],
    sources: {
      ps: { flip: true },
      serebii: { id: '383' },
      pmd: { id: '0383' },
      psgh: { id: 's12256', flip: true },
    },
  },
  groudonprimal: {
    name: ['Primal Groudon', 'Groudon-Primal'],
    sources: {
      ps: { id: 'groudon-primal', flip: true },
      serebii: { id: '383-p' },
      pmd: { id: '0383/0001' },
      psgh: { id: 's12257', flip: true },
    },
  },
  rayquaza: {
    name: ['Rayquaza'],
    sources: {
      ps: {},
      serebii: { id: '384' },
      pmd: { id: '0384' },
      psgh: { id: 's12288' },
    },
  },
  rayquazamega: {
    name: ['Mega Rayquaza', 'Rayquaza-Mega'],
    sources: {
      ps: { id: 'rayquaza-mega' },
      serebii: { id: '384-m' },
      pmd: { id: '0384/0001' },
      psgh: { id: 's12289' },
    },
  },
  jirachi: {
    name: ['Jirachi'],
    sources: {
      ps: {},
      serebii: { id: '385' },
      pmd: { id: '0385' },
      psgh: { id: 's12320' },
    },
  },
  deoxys: {
    name: ['Deoxys'],
    sources: {
      ps: {},
      serebii: { id: '386' },
      pmd: { id: '0386' },
      psgh: { id: 's12352' },
    },
  },
  deoxysattack: {
    name: ['Deoxys-Attack'],
    sources: {
      ps: { id: 'deoxys-attack' },
      serebii: { id: '386-a' },
      pmd: { id: '0386/0001' },
      psgh: { id: 's12353' },
    },
  },
  deoxysdefense: {
    name: ['Deoxys-Defense'],
    sources: {
      ps: { id: 'deoxys-defense', flip: true },
      serebii: { id: '386-d' },
      pmd: { id: '0386/0002' },
      psgh: { id: 's12354', flip: true },
    },
  },
  deoxysspeed: {
    name: ['Deoxys-Speed'],
    sources: {
      ps: { id: 'deoxys-speed' },
      serebii: { id: '386-s' },
      pmd: { id: '0386/0003' },
      psgh: { id: 's12355' },
    },
  },
  turtwig: {
    name: ['Turtwig'],
    sources: {
      ps: {},
      serebii: { id: '387' },
      pmd: { id: '0387' },
      psgh: { id: 's12384' },
    },
  },
  grotle: {
    name: ['Grotle'],
    sources: {
      ps: {},
      serebii: { id: '388' },
      pmd: { id: '0388' },
      psgh: { id: 's12416' },
    },
  },
  torterra: {
    name: ['Torterra'],
    sources: {
      ps: {},
      serebii: { id: '389' },
      pmd: { id: '0389' },
      psgh: { id: 's12448' },
    },
  },
  chimchar: {
    name: ['Chimchar'],
    sources: {
      ps: {},
      serebii: { id: '390' },
      pmd: { id: '0390' },
      psgh: { id: 's12480' },
    },
  },
  monferno: {
    name: ['Monferno'],
    sources: {
      ps: {},
      serebii: { id: '391' },
      pmd: { id: '0391' },
      psgh: { id: 's12512' },
    },
  },
  infernape: {
    name: ['Infernape'],
    sources: {
      ps: {},
      serebii: { id: '392' },
      pmd: { id: '0392' },
      psgh: { id: 's12544' },
    },
  },
  piplup: {
    name: ['Piplup'],
    sources: {
      ps: { flip: true },
      serebii: { id: '393' },
      pmd: { id: '0393' },
      psgh: { id: 's12576', flip: true },
    },
  },
  prinplup: {
    name: ['Prinplup'],
    sources: {
      ps: {},
      serebii: { id: '394' },
      pmd: { id: '0394' },
      psgh: { id: 's12608' },
    },
  },
  empoleon: {
    name: ['Empoleon'],
    sources: {
      ps: {},
      serebii: { id: '395' },
      pmd: { id: '0395' },
      psgh: { id: 's12640' },
    },
  },
  starly: {
    name: ['Starly'],
    sources: {
      ps: {},
      serebii: { id: '396' },
      pmd: { id: '0396' },
      psgh: { id: 's12672' },
    },
  },
  staravia: {
    name: ['Staravia'],
    sources: {
      ps: {},
      serebii: { id: '397' },
      pmd: { id: '0397' },
      psgh: { id: 's12704' },
    },
  },
  staraptor: {
    name: ['Staraptor'],
    sources: {
      ps: {},
      serebii: { id: '398' },
      pmd: { id: '0398' },
      psgh: { id: 's12736' },
    },
  },
  staraptormega: {
    name: ['Mega Staraptor', 'Staraptor-Mega'],
    sources: {
      ps: { id: 'staraptor-mega' },
      serebii: { id: '398' },
      pmd: { id: '0398' },
      psgh: { id: 's12736' },
    },
  },
  bidoof: {
    name: ['Bidoof'],
    sources: {
      ps: {},
      serebii: { id: '399' },
      pmd: { id: '0399' },
      psgh: { id: 's12768' },
    },
  },
  bibarel: {
    name: ['Bibarel'],
    sources: {
      ps: {},
      serebii: { id: '400' },
      pmd: { id: '0400' },
      psgh: { id: 's12800' },
    },
  },
  kricketot: {
    name: ['Kricketot'],
    sources: {
      ps: {},
      serebii: { id: '401' },
      pmd: { id: '0401' },
      psgh: { id: 's12832' },
    },
  },
  kricketune: {
    name: ['Kricketune'],
    sources: {
      ps: {},
      serebii: { id: '402' },
      pmd: { id: '0402' },
      psgh: { id: 's12864' },
    },
  },
  shinx: {
    name: ['Shinx'],
    sources: {
      ps: { flip: true },
      serebii: { id: '403' },
      pmd: { id: '0403' },
      psgh: { id: 's12896', flip: true },
    },
  },
  luxio: {
    name: ['Luxio'],
    sources: {
      ps: {},
      serebii: { id: '404' },
      pmd: { id: '0404' },
      psgh: { id: 's12928' },
    },
  },
  luxray: {
    name: ['Luxray'],
    sources: {
      ps: {},
      serebii: { id: '405' },
      pmd: { id: '0405' },
      psgh: { id: 's12960' },
    },
  },
  budew: {
    name: ['Budew'],
    sources: {
      ps: {},
      serebii: { id: '406' },
      pmd: { id: '0406' },
      psgh: { id: 's12992' },
    },
  },
  roserade: {
    name: ['Roserade'],
    sources: {
      ps: {},
      serebii: { id: '407' },
      pmd: { id: '0407' },
      psgh: { id: 's13024' },
    },
  },
  cranidos: {
    name: ['Cranidos'],
    sources: {
      ps: { flip: true },
      serebii: { id: '408' },
      pmd: { id: '0408' },
      psgh: { id: 's13056', flip: true },
    },
  },
  rampardos: {
    name: ['Rampardos'],
    sources: {
      ps: { flip: true },
      serebii: { id: '409' },
      pmd: { id: '0409' },
      psgh: { id: 's13088', flip: true },
    },
  },
  shieldon: {
    name: ['Shieldon'],
    sources: {
      ps: {},
      serebii: { id: '410' },
      pmd: { id: '0410' },
      psgh: { id: 's13120' },
    },
  },
  bastiodon: {
    name: ['Bastiodon'],
    sources: {
      ps: {},
      serebii: { id: '411' },
      pmd: { id: '0411' },
      psgh: { id: 's13152' },
    },
  },
  burmy: {
    name: ['Burmy'],
    sources: {
      ps: {},
      serebii: { id: '412' },
      pmd: { id: '0412' },
      psgh: { id: 's13184' },
    },
  },
  wormadam: {
    name: ['Wormadam'],
    sources: {
      ps: {},
      serebii: { id: '413' },
      pmd: { id: '0413' },
      psgh: { id: 's13216' },
    },
  },
  wormadamsandy: {
    name: ['Wormadam-Sandy'],
    sources: {
      ps: { id: 'wormadam-sandy', flip: true },
      serebii: { id: '413-s' },
      pmd: { id: '0413/0001' },
      psgh: { id: 's13217', flip: true },
    },
  },
  wormadamtrash: {
    name: ['Wormadam-Trash'],
    sources: {
      ps: { id: 'wormadam-trash' },
      serebii: { id: '413-t' },
      pmd: { id: '0413/0002' },
      psgh: { id: 's13218' },
    },
  },
  mothim: {
    name: ['Mothim'],
    sources: {
      ps: {},
      serebii: { id: '414' },
      pmd: { id: '0414' },
      psgh: { id: 's13248' },
    },
  },
  combee: {
    name: ['Combee'],
    sources: {
      ps: {},
      serebii: { id: '415' },
      pmd: { id: '0415' },
      psgh: { id: 's13280' },
    },
  },
  vespiquen: {
    name: ['Vespiquen'],
    sources: {
      ps: {},
      serebii: { id: '416' },
      pmd: { id: '0416' },
      psgh: { id: 's13312' },
    },
  },
  pachirisu: {
    name: ['Pachirisu'],
    sources: {
      ps: {},
      serebii: { id: '417' },
      pmd: { id: '0417' },
      psgh: { id: 's13344' },
    },
  },
  buizel: {
    name: ['Buizel'],
    sources: {
      ps: {},
      serebii: { id: '418' },
      pmd: { id: '0418' },
      psgh: { id: 's13376' },
    },
  },
  floatzel: {
    name: ['Floatzel'],
    sources: {
      ps: {},
      serebii: { id: '419' },
      pmd: { id: '0419' },
      psgh: { id: 's13408' },
    },
  },
  cherubi: {
    name: ['Cherubi'],
    sources: {
      ps: {},
      serebii: { id: '420' },
      pmd: { id: '0420' },
      psgh: { id: 's13440' },
    },
  },
  cherrim: {
    name: ['Cherrim'],
    sources: {
      ps: {},
      serebii: { id: '421' },
      pmd: { id: '0421' },
      psgh: { id: 's13472' },
    },
  },
  cherrimsunshine: {
    name: ['Cherrim-Sunshine'],
    sources: {
      ps: { id: 'cherrim-sunshine' },
      serebii: { id: '421-s' },
      pmd: { id: '0421/0001' },
      psgh: { id: 's13473' },
    },
  },
  shellos: {
    name: ['Shellos'],
    sources: {
      ps: {},
      serebii: { id: '422' },
      pmd: { id: '0422' },
      psgh: { id: 's13504' },
    },
  },
  gastrodon: {
    name: ['Gastrodon'],
    sources: {
      ps: {},
      serebii: { id: '423' },
      pmd: { id: '0423' },
      psgh: { id: 's13536' },
    },
  },
  ambipom: {
    name: ['Ambipom'],
    sources: {
      ps: {},
      serebii: { id: '424' },
      pmd: { id: '0424' },
      psgh: { id: 's13568' },
    },
  },
  drifloon: {
    name: ['Drifloon'],
    sources: {
      ps: {},
      serebii: { id: '425' },
      pmd: { id: '0425' },
      psgh: { id: 's13600' },
    },
  },
  drifblim: {
    name: ['Drifblim'],
    sources: {
      ps: {},
      serebii: { id: '426' },
      pmd: { id: '0426' },
      psgh: { id: 's13632' },
    },
  },
  buneary: {
    name: ['Buneary'],
    sources: {
      ps: {},
      serebii: { id: '427' },
      pmd: { id: '0427' },
      psgh: { id: 's13664' },
    },
  },
  lopunny: {
    name: ['Lopunny'],
    sources: {
      ps: {},
      serebii: { id: '428' },
      pmd: { id: '0428' },
      psgh: { id: 's13696' },
    },
  },
  lopunnymega: {
    name: ['Mega Lopunny', 'Lopunny-Mega'],
    sources: {
      ps: { id: 'lopunny-mega' },
      serebii: { id: '428-m' },
      pmd: { id: '0428/0001' },
      psgh: { id: 's13697' },
    },
  },
  mismagius: {
    name: ['Mismagius'],
    sources: {
      ps: {},
      serebii: { id: '429' },
      pmd: { id: '0429' },
      psgh: { id: 's13728' },
    },
  },
  honchkrow: {
    name: ['Honchkrow'],
    sources: {
      ps: {},
      serebii: { id: '430' },
      pmd: { id: '0430' },
      psgh: { id: 's13760' },
    },
  },
  glameow: {
    name: ['Glameow'],
    sources: {
      ps: {},
      serebii: { id: '431' },
      pmd: { id: '0431' },
      psgh: { id: 's13792' },
    },
  },
  purugly: {
    name: ['Purugly'],
    sources: {
      ps: {},
      serebii: { id: '432' },
      pmd: { id: '0432' },
      psgh: { id: 's13824' },
    },
  },
  chingling: {
    name: ['Chingling'],
    sources: {
      ps: {},
      serebii: { id: '433' },
      pmd: { id: '0433' },
      psgh: { id: 's13856' },
    },
  },
  stunky: {
    name: ['Stunky'],
    sources: {
      ps: {},
      serebii: { id: '434' },
      pmd: { id: '0434' },
      psgh: { id: 's13888' },
    },
  },
  skuntank: {
    name: ['Skuntank'],
    sources: {
      ps: {},
      serebii: { id: '435' },
      pmd: { id: '0435' },
      psgh: { id: 's13920' },
    },
  },
  bronzor: {
    name: ['Bronzor'],
    sources: {
      ps: {},
      serebii: { id: '436' },
      pmd: { id: '0436' },
      psgh: { id: 's13952' },
    },
  },
  bronzong: {
    name: ['Bronzong'],
    sources: {
      ps: {},
      serebii: { id: '437' },
      pmd: { id: '0437' },
      psgh: { id: 's13984' },
    },
  },
  bonsly: {
    name: ['Bonsly'],
    sources: {
      ps: {},
      serebii: { id: '438' },
      pmd: { id: '0438' },
      psgh: { id: 's14016' },
    },
  },
  mimejr: {
    name: ['Mime Jr.'],
    sources: {
      ps: {},
      serebii: { id: '439' },
      pmd: { id: '0439' },
      psgh: { id: 's14048' },
    },
  },
  happiny: {
    name: ['Happiny'],
    sources: {
      ps: {},
      serebii: { id: '440' },
      pmd: { id: '0440' },
      psgh: { id: 's14080' },
    },
  },
  chatot: {
    name: ['Chatot'],
    sources: {
      ps: {},
      serebii: { id: '441' },
      pmd: { id: '0441' },
      psgh: { id: 's14112' },
    },
  },
  spiritomb: {
    name: ['Spiritomb'],
    sources: {
      ps: {},
      serebii: { id: '442' },
      pmd: { id: '0442' },
      psgh: { id: 's14144' },
    },
  },
  gible: {
    name: ['Gible'],
    sources: {
      ps: {},
      serebii: { id: '443' },
      pmd: { id: '0443' },
      psgh: { id: 's14176' },
    },
  },
  gabite: {
    name: ['Gabite'],
    sources: {
      ps: {},
      serebii: { id: '444' },
      pmd: { id: '0444' },
      psgh: { id: 's14208' },
    },
  },
  garchomp: {
    name: ['Garchomp'],
    sources: {
      ps: {},
      serebii: { id: '445' },
      pmd: { id: '0445' },
      psgh: { id: 's14240' },
    },
  },
  garchompmega: {
    name: ['Mega Garchomp', 'Garchomp-Mega'],
    sources: {
      ps: { id: 'garchomp-mega' },
      serebii: { id: '445-m' },
      pmd: { id: '0445/0001' },
      psgh: { id: 's14241' },
    },
  },
  garchompmegaz: {
    name: ['Mega Garchomp Z', 'Garchomp-Mega-Z'],
    sources: {
      ps: { id: 'garchomp-megaz' },
      serebii: { id: '445-m' },
      pmd: { id: '0445/0001' },
      psgh: { id: 's14241' },
    },
  },
  munchlax: {
    name: ['Munchlax'],
    sources: {
      ps: { flip: true },
      serebii: { id: '446' },
      pmd: { id: '0446' },
      psgh: { id: 's14272', flip: true },
    },
  },
  riolu: {
    name: ['Riolu'],
    sources: {
      ps: {},
      serebii: { id: '447' },
      pmd: { id: '0447' },
      psgh: { id: 's14304' },
    },
  },
  lucario: {
    name: ['Lucario'],
    sources: {
      ps: {},
      serebii: { id: '448' },
      pmd: { id: '0448' },
      psgh: { id: 's14336' },
    },
  },
  lucariomega: {
    name: ['Mega Lucario', 'Lucario-Mega'],
    sources: {
      ps: { id: 'lucario-mega', flip: true },
      serebii: { id: '448-m' },
      pmd: { id: '0448/0001' },
      psgh: { id: 's14337', flip: true },
    },
  },
  lucariomegaz: {
    name: ['Mega Lucario Z', 'Lucario-Mega-Z'],
    sources: {
      ps: { id: 'lucario-megaz', flip: true },
      serebii: { id: '448-m' },
      pmd: { id: '0448/0001' },
      psgh: { id: 's14337', flip: true },
    },
  },
  hippopotas: {
    name: ['Hippopotas'],
    sources: {
      ps: {},
      serebii: { id: '449' },
      pmd: { id: '0449' },
      psgh: { id: 's14368' },
    },
  },
  hippowdon: {
    name: ['Hippowdon'],
    sources: {
      ps: {},
      serebii: { id: '450' },
      pmd: { id: '0450' },
      psgh: { id: 's14400' },
    },
  },
  skorupi: {
    name: ['Skorupi'],
    sources: {
      ps: {},
      serebii: { id: '451' },
      pmd: { id: '0451' },
      psgh: { id: 's14432' },
    },
  },
  drapion: {
    name: ['Drapion'],
    sources: {
      ps: {},
      serebii: { id: '452' },
      pmd: { id: '0452' },
      psgh: { id: 's14464' },
    },
  },
  croagunk: {
    name: ['Croagunk'],
    sources: {
      ps: {},
      serebii: { id: '453' },
      pmd: { id: '0453' },
      psgh: { id: 's14496' },
    },
  },
  toxicroak: {
    name: ['Toxicroak'],
    sources: {
      ps: {},
      serebii: { id: '454' },
      pmd: { id: '0454' },
      psgh: { id: 's14528' },
    },
  },
  carnivine: {
    name: ['Carnivine'],
    sources: {
      ps: {},
      serebii: { id: '455' },
      pmd: { id: '0455' },
      psgh: { id: 's14560' },
    },
  },
  finneon: {
    name: ['Finneon'],
    sources: {
      ps: {},
      serebii: { id: '456' },
      pmd: { id: '0456' },
      psgh: { id: 's14592' },
    },
  },
  lumineon: {
    name: ['Lumineon'],
    sources: {
      ps: {},
      serebii: { id: '457' },
      pmd: { id: '0457' },
      psgh: { id: 's14624' },
    },
  },
  mantyke: {
    name: ['Mantyke'],
    sources: {
      ps: {},
      serebii: { id: '458' },
      pmd: { id: '0458' },
      psgh: { id: 's14656' },
    },
  },
  snover: {
    name: ['Snover'],
    sources: {
      ps: {},
      serebii: { id: '459' },
      pmd: { id: '0459' },
      psgh: { id: 's14688' },
    },
  },
  abomasnow: {
    name: ['Abomasnow'],
    sources: {
      ps: {},
      serebii: { id: '460' },
      pmd: { id: '0460' },
      psgh: { id: 's14720' },
    },
  },
  abomasnowmega: {
    name: ['Mega Abomasnow', 'Abomasnow-Mega'],
    sources: {
      ps: { id: 'abomasnow-mega' },
      serebii: { id: '460-m' },
      pmd: { id: '0460/0001' },
      psgh: { id: 's14721' },
    },
  },
  weavile: {
    name: ['Weavile'],
    sources: {
      ps: {},
      serebii: { id: '461' },
      pmd: { id: '0461' },
      psgh: { id: 's14752' },
    },
  },
  magnezone: {
    name: ['Magnezone'],
    sources: {
      ps: {},
      serebii: { id: '462' },
      pmd: { id: '0462' },
      psgh: { id: 's14784' },
    },
  },
  lickilicky: {
    name: ['Lickilicky'],
    sources: {
      ps: {},
      serebii: { id: '463' },
      pmd: { id: '0463' },
      psgh: { id: 's14816' },
    },
  },
  rhyperior: {
    name: ['Rhyperior'],
    sources: {
      ps: {},
      serebii: { id: '464' },
      pmd: { id: '0464' },
      psgh: { id: 's14848' },
    },
  },
  tangrowth: {
    name: ['Tangrowth'],
    sources: {
      ps: {},
      serebii: { id: '465' },
      pmd: { id: '0465' },
      psgh: { id: 's14880' },
    },
  },
  electivire: {
    name: ['Electivire'],
    sources: {
      ps: {},
      serebii: { id: '466' },
      pmd: { id: '0466' },
      psgh: { id: 's14912' },
    },
  },
  magmortar: {
    name: ['Magmortar'],
    sources: {
      ps: {},
      serebii: { id: '467' },
      pmd: { id: '0467' },
      psgh: { id: 's14944' },
    },
  },
  togekiss: {
    name: ['Togekiss'],
    sources: {
      ps: {},
      serebii: { id: '468' },
      pmd: { id: '0468' },
      psgh: { id: 's14976' },
    },
  },
  yanmega: {
    name: ['Yanmega'],
    sources: {
      ps: {},
      serebii: { id: '469' },
      pmd: { id: '0469' },
      psgh: { id: 's15008' },
    },
  },
  leafeon: {
    name: ['Leafeon'],
    sources: {
      ps: {},
      serebii: { id: '470' },
      pmd: { id: '0470' },
      psgh: { id: 's15040' },
    },
  },
  glaceon: {
    name: ['Glaceon'],
    sources: {
      ps: { flip: true },
      serebii: { id: '471' },
      pmd: { id: '0471' },
      psgh: { id: 's15072', flip: true },
    },
  },
  gliscor: {
    name: ['Gliscor'],
    sources: {
      ps: {},
      serebii: { id: '472' },
      pmd: { id: '0472' },
      psgh: { id: 's15104' },
    },
  },
  mamoswine: {
    name: ['Mamoswine'],
    sources: {
      ps: {},
      serebii: { id: '473' },
      pmd: { id: '0473' },
      psgh: { id: 's15136' },
    },
  },
  porygonz: {
    name: ['Porygon-Z'],
    sources: {
      ps: {},
      serebii: { id: '474' },
      pmd: { id: '0474' },
      psgh: { id: 's15168' },
    },
  },
  gallade: {
    name: ['Gallade'],
    sources: {
      ps: {},
      serebii: { id: '475' },
      pmd: { id: '0475' },
      psgh: { id: 's15200' },
    },
  },
  gallademega: {
    name: ['Mega Gallade', 'Gallade-Mega'],
    sources: {
      ps: { id: 'gallade-mega' },
      serebii: { id: '475-m' },
      pmd: { id: '0475/0001' },
      psgh: { id: 's15201' },
    },
  },
  probopass: {
    name: ['Probopass'],
    sources: {
      ps: {},
      serebii: { id: '476' },
      pmd: { id: '0476' },
      psgh: { id: 's15232' },
    },
  },
  dusknoir: {
    name: ['Dusknoir'],
    sources: {
      ps: { flip: true },
      serebii: { id: '477' },
      pmd: { id: '0477' },
      psgh: { id: 's15264', flip: true },
    },
  },
  froslass: {
    name: ['Froslass'],
    sources: {
      ps: {},
      serebii: { id: '478' },
      pmd: { id: '0478' },
      psgh: { id: 's15296' },
    },
  },
  froslassmega: {
    name: ['Mega Froslass', 'Froslass-Mega'],
    sources: {
      ps: {},
      serebii: { id: '478' },
      pmd: { id: '0478' },
      psgh: { id: 's15296' },
    },
  },
  rotom: {
    name: ['Rotom'],
    sources: {
      ps: { flip: true },
      serebii: { id: '479' },
      pmd: { id: '0479' },
      psgh: { id: 's15328', flip: true },
    },
  },
  rotomheat: {
    name: ['Rotom-Heat'],
    sources: {
      ps: { id: 'rotom-heat' },
      serebii: { id: '479-h' },
      pmd: { id: '0479/0001' },
      psgh: { id: 's15329' },
    },
  },
  rotomwash: {
    name: ['Rotom-Wash'],
    sources: {
      ps: { id: 'rotom-wash', flip: true },
      serebii: { id: '479-w' },
      pmd: { id: '0479/0002' },
      psgh: { id: 's15330', flip: true },
    },
  },
  rotomfrost: {
    name: ['Rotom-Frost'],
    sources: {
      ps: { id: 'rotom-frost', flip: true },
      serebii: { id: '479-f' },
      pmd: { id: '0479/0003' },
      psgh: { id: 's15331', flip: true },
    },
  },
  rotomfan: {
    name: ['Rotom-Fan'],
    sources: {
      ps: { id: 'rotom-fan' },
      serebii: { id: '479-s' },
      pmd: { id: '0479/0004' },
      psgh: { id: 's15332' },
    },
  },
  rotommow: {
    name: ['Rotom-Mow'],
    sources: {
      ps: { id: 'rotom-mow', flip: true },
      serebii: { id: '479-m' },
      pmd: { id: '0479/0005' },
      psgh: { id: 's15333', flip: true },
    },
  },
  uxie: {
    name: ['Uxie'],
    sources: {
      ps: {},
      serebii: { id: '480' },
      pmd: { id: '0480' },
      psgh: { id: 's15360' },
    },
  },
  mesprit: {
    name: ['Mesprit'],
    sources: {
      ps: {},
      serebii: { id: '481' },
      pmd: { id: '0481' },
      psgh: { id: 's15392' },
    },
  },
  azelf: {
    name: ['Azelf'],
    sources: {
      ps: { flip: true },
      serebii: { id: '482' },
      pmd: { id: '0482' },
      psgh: { id: 's15424', flip: true },
    },
  },
  dialga: {
    name: ['Dialga'],
    sources: {
      ps: { flip: true },
      serebii: { id: '483' },
      pmd: { id: '0483' },
      psgh: { id: 's15456', flip: true },
    },
  },
  dialgaorigin: {
    name: ['Dialga-Origin'],
    sources: {
      ps: { id: 'dialga-origin' },
      serebii: { id: '483-o' },
      pmd: { id: '0483/0001' },
      psgh: { id: 's15457' },
    },
  },
  dialgaprimal: {
    name: ['Dialga-Primal'],
    sources: {
      ps: { id: 'dialga' },
      serebii: { id: '483' },
      pmd: { id: '0483/0002' },
      psgh: { id: 's15456' },
    },
  },
  palkia: {
    name: ['Palkia'],
    sources: {
      ps: {},
      serebii: { id: '484' },
      pmd: { id: '0484' },
      psgh: { id: 's15488' },
    },
  },
  palkiaorigin: {
    name: ['Palkia-Origin'],
    sources: {
      ps: { id: 'palkia-origin', flip: true },
      serebii: { id: '484-o' },
      pmd: { id: '0484/0001' },
      psgh: { id: 's15489', flip: true },
    },
  },
  heatran: {
    name: ['Heatran'],
    sources: {
      ps: {},
      serebii: { id: '485' },
      pmd: { id: '0485' },
      psgh: { id: 's15520' },
    },
  },
  heatranmega: {
    name: ['Mega Heatran', 'Heatran-Mega'],
    sources: {
      ps: { id: 'heatran-mega' },
      serebii: { id: '485' },
      pmd: { id: '0485' },
      psgh: { id: 's15520' },
    },
  },
  regigigas: {
    name: ['Regigigas'],
    sources: {
      ps: {},
      serebii: { id: '486' },
      pmd: { id: '0486' },
      psgh: { id: 's15552' },
    },
  },
  giratina: {
    name: ['Giratina'],
    sources: {
      ps: {},
      serebii: { id: '487' },
      pmd: { id: '0487' },
      psgh: { id: 's15584' },
    },
  },
  giratinaorigin: {
    name: ['Giratina-Origin'],
    sources: {
      ps: { id: 'giratina-origin' },
      serebii: { id: '487-o' },
      pmd: { id: '0487/0001' },
      psgh: { id: 's15585' },
    },
  },
  cresselia: {
    name: ['Cresselia'],
    sources: {
      ps: { flip: true },
      serebii: { id: '488' },
      pmd: { id: '0488' },
      psgh: { id: 's15616', flip: true },
    },
  },
  phione: {
    name: ['Phione'],
    sources: {
      ps: {},
      serebii: { id: '489' },
      pmd: { id: '0489' },
      psgh: { id: 's15648' },
    },
  },
  manaphy: {
    name: ['Manaphy'],
    sources: {
      ps: {},
      serebii: { id: '490' },
      pmd: { id: '0490' },
      psgh: { id: 's15680' },
    },
  },
  darkrai: {
    name: ['Darkrai'],
    sources: {
      ps: {},
      serebii: { id: '491' },
      pmd: { id: '0491' },
      psgh: { id: 's15712' },
    },
  },
  darkraimega: {
    name: ['Mega Darkrai', 'Darkrai-Mega'],
    sources: {
      ps: { id: 'darkrai-mega' },
      serebii: { id: '491' },
      pmd: { id: '0491' },
      psgh: { id: 's15712' },
    },
  },
  shaymin: {
    name: ['Shaymin'],
    sources: {
      ps: {},
      serebii: { id: '492' },
      pmd: { id: '0492' },
      psgh: { id: 's15744' },
    },
  },
  shayminsky: {
    name: ['Shaymin-Sky'],
    sources: {
      ps: { id: 'shaymin-sky' },
      serebii: { id: '492-s' },
      pmd: { id: '0492/0001' },
      psgh: { id: 's15745' },
    },
  },
  arceus: {
    name: ['Arceus'],
    sources: {
      ps: {},
      serebii: { id: '493' },
      pmd: { id: '0493' },
      psgh: { id: 's15776' },
    },
  },
  arceusbug: {
    name: ['Arceus-Bug'],
    sources: {
      ps: { id: 'arceus-bug' },
      serebii: { id: '493' },
      pmd: { id: '0493/0001' },
      psgh: { id: 's15782' },
    },
  },
  arceusdark: {
    name: ['Arceus-Dark'],
    sources: {
      ps: { id: 'arceus-dark' },
      serebii: { id: '493-dark' },
      pmd: { id: '0493/0002' },
      psgh: { id: 's15792' },
    },
  },
  arceusdragon: {
    name: ['Arceus-Dragon'],
    sources: {
      ps: { id: 'arceus-dragon' },
      serebii: { id: '493-dragon' },
      pmd: { id: '0493/0003' },
      psgh: { id: 's15791' },
    },
  },
  arceuselectric: {
    name: ['Arceus-Electric'],
    sources: {
      ps: { id: 'arceus-electric' },
      serebii: { id: '493-electric' },
      pmd: { id: '0493/0004' },
      psgh: { id: 's15788' },
    },
  },
  arceusfairy: {
    name: ['Arceus-Fairy'],
    sources: {
      ps: { id: 'arceus-fairy' },
      serebii: { id: '493-fairy' },
      pmd: { id: '0493/0017' },
      psgh: { id: 's15793' },
    },
  },
  arceusfighting: {
    name: ['Arceus-Fighting'],
    sources: {
      ps: { id: 'arceus-fighting' },
      serebii: { id: '493-fighting' },
      pmd: { id: '0493/0005' },
      psgh: { id: 's15777' },
    },
  },
  arceusfire: {
    name: ['Arceus-Fire'],
    sources: {
      ps: { id: 'arceus-fire' },
      serebii: { id: '493-fire' },
      pmd: { id: '0493/0006' },
      psgh: { id: 's15785' },
    },
  },
  arceusflying: {
    name: ['Arceus-Flying'],
    sources: {
      ps: { id: 'arceus-flying' },
      serebii: { id: '493-flying' },
      pmd: { id: '0493/0007' },
      psgh: { id: 's15778' },
    },
  },
  arceusghost: {
    name: ['Arceus-Ghost'],
    sources: {
      ps: { id: 'arceus-ghost' },
      serebii: { id: '493-ghost' },
      pmd: { id: '0493/0008' },
      psgh: { id: 's15783' },
    },
  },
  arceusgrass: {
    name: ['Arceus-Grass'],
    sources: {
      ps: { id: 'arceus-grass' },
      serebii: { id: '493-grass' },
      pmd: { id: '0493/0009' },
      psgh: { id: 's15787' },
    },
  },
  arceusground: {
    name: ['Arceus-Ground'],
    sources: {
      ps: { id: 'arceus-ground' },
      serebii: { id: '493-ground' },
      pmd: { id: '0493/0010' },
      psgh: { id: 's15780' },
    },
  },
  arceusice: {
    name: ['Arceus-Ice'],
    sources: {
      ps: { id: 'arceus-ice' },
      serebii: { id: '493-ice' },
      pmd: { id: '0493/0011' },
      psgh: { id: 's15790' },
    },
  },
  arceuspoison: {
    name: ['Arceus-Poison'],
    sources: {
      ps: { id: 'arceus-poison' },
      serebii: { id: '493-poison' },
      pmd: { id: '0493/0012' },
      psgh: { id: 's15779' },
    },
  },
  arceuspsychic: {
    name: ['Arceus-Psychic'],
    sources: {
      ps: { id: 'arceus-psychic' },
      serebii: { id: '493-psychic' },
      pmd: { id: '0493/0013' },
      psgh: { id: 's15789' },
    },
  },
  arceusrock: {
    name: ['Arceus-Rock'],
    sources: {
      ps: { id: 'arceus-rock' },
      serebii: { id: '493-rock' },
      pmd: { id: '0493/0014' },
      psgh: { id: 's15781' },
    },
  },
  arceussteel: {
    name: ['Arceus-Steel'],
    sources: {
      ps: { id: 'arceus-steel' },
      serebii: { id: '493-steel' },
      pmd: { id: '0493/0015' },
      psgh: { id: 's15784' },
    },
  },
  arceuswater: {
    name: ['Arceus-Water'],
    sources: {
      ps: { id: 'arceus-water' },
      serebii: { id: '493-water' },
      pmd: { id: '0493/0016' },
      psgh: { id: 's15786' },
    },
  },
  victini: {
    name: ['Victini'],
    sources: {
      ps: {},
      serebii: { id: '494' },
      pmd: { id: '0494' },
      psgh: { id: 's15808' },
    },
  },
  snivy: {
    name: ['Snivy'],
    sources: {
      ps: {},
      serebii: { id: '495' },
      pmd: { id: '0495' },
      psgh: { id: 's15840' },
    },
  },
  servine: {
    name: ['Servine'],
    sources: {
      ps: { flip: true },
      serebii: { id: '496' },
      pmd: { id: '0496' },
      psgh: { id: 's15872', flip: true },
    },
  },
  serperior: {
    name: ['Serperior'],
    sources: {
      ps: {},
      serebii: { id: '497' },
      pmd: { id: '0497' },
      psgh: { id: 's15904' },
    },
  },
  tepig: {
    name: ['Tepig'],
    sources: {
      ps: { flip: true },
      serebii: { id: '498' },
      pmd: { id: '0498' },
      psgh: { id: 's15936', flip: true },
    },
  },
  pignite: {
    name: ['Pignite'],
    sources: {
      ps: {},
      serebii: { id: '499' },
      pmd: { id: '0499' },
      psgh: { id: 's15968' },
    },
  },
  emboar: {
    name: ['Emboar'],
    sources: {
      ps: {},
      serebii: { id: '500' },
      pmd: { id: '0500' },
      psgh: { id: 's16000' },
    },
  },
  emboarmega: {
    name: ['Mega Emboar', 'Emboar-Mega'],
    sources: {
      ps: {},
      serebii: { id: '500' },
      pmd: { id: '0500' },
      psgh: { id: 's16000' },
    },
  },
  oshawott: {
    name: ['Oshawott'],
    sources: {
      ps: {},
      serebii: { id: '501' },
      pmd: { id: '0501' },
      psgh: { id: 's16032' },
    },
  },
  dewott: {
    name: ['Dewott'],
    sources: {
      ps: {},
      serebii: { id: '502' },
      pmd: { id: '0502' },
      psgh: { id: 's16064' },
    },
  },
  samurott: {
    name: ['Samurott'],
    sources: {
      ps: {},
      serebii: { id: '503' },
      pmd: { id: '0503' },
      psgh: { id: 's16096' },
    },
  },
  samurotthisui: {
    name: ['Hisuian Samurott', 'Samurott-Hisui', 'Samurott-H'],
    sources: {
      ps: { id: 'samurott-hisui' },
      serebii: { id: '503-h' },
      pmd: { id: '0503/0001' },
      psgh: { id: 's16097' },
    },
  },
  patrat: {
    name: ['Patrat'],
    sources: {
      ps: {},
      serebii: { id: '504' },
      pmd: { id: '0504' },
      psgh: { id: 's16128' },
    },
  },
  watchog: {
    name: ['Watchog'],
    sources: {
      ps: {},
      serebii: { id: '505' },
      pmd: { id: '0505' },
      psgh: { id: 's16160' },
    },
  },
  lillipup: {
    name: ['Lillipup'],
    sources: {
      ps: {},
      serebii: { id: '506' },
      pmd: { id: '0506' },
      psgh: { id: 's16192' },
    },
  },
  herdier: {
    name: ['Herdier'],
    sources: {
      ps: {},
      serebii: { id: '507' },
      pmd: { id: '0507' },
      psgh: { id: 's16224' },
    },
  },
  stoutland: {
    name: ['Stoutland'],
    sources: {
      ps: {},
      serebii: { id: '508' },
      pmd: { id: '0508' },
      psgh: { id: 's16256' },
    },
  },
  purrloin: {
    name: ['Purrloin'],
    sources: {
      ps: {},
      serebii: { id: '509' },
      pmd: { id: '0509' },
      psgh: { id: 's16288' },
    },
  },
  liepard: {
    name: ['Liepard'],
    sources: {
      ps: {},
      serebii: { id: '510' },
      pmd: { id: '0510' },
      psgh: { id: 's16320' },
    },
  },
  pansage: {
    name: ['Pansage'],
    sources: {
      ps: {},
      serebii: { id: '511' },
      pmd: { id: '0511' },
      psgh: { id: 's16352' },
    },
  },
  simisage: {
    name: ['Simisage'],
    sources: {
      ps: {},
      serebii: { id: '512' },
      pmd: { id: '0512' },
      psgh: { id: 's16384' },
    },
  },
  pansear: {
    name: ['Pansear'],
    sources: {
      ps: {},
      serebii: { id: '513' },
      pmd: { id: '0513' },
      psgh: { id: 's16416' },
    },
  },
  simisear: {
    name: ['Simisear'],
    sources: {
      ps: {},
      serebii: { id: '514' },
      pmd: { id: '0514' },
      psgh: { id: 's16448' },
    },
  },
  panpour: {
    name: ['Panpour'],
    sources: {
      ps: { flip: true },
      serebii: { id: '515' },
      pmd: { id: '0515' },
      psgh: { id: 's16480', flip: true },
    },
  },
  simipour: {
    name: ['Simipour'],
    sources: {
      ps: { flip: true },
      serebii: { id: '516' },
      pmd: { id: '0516' },
      psgh: { id: 's16512', flip: true },
    },
  },
  munna: {
    name: ['Munna'],
    sources: {
      ps: {},
      serebii: { id: '517' },
      pmd: { id: '0517' },
      psgh: { id: 's16544' },
    },
  },
  musharna: {
    name: ['Musharna'],
    sources: {
      ps: {},
      serebii: { id: '518' },
      pmd: { id: '0518' },
      psgh: { id: 's16576' },
    },
  },
  pidove: {
    name: ['Pidove'],
    sources: {
      ps: {},
      serebii: { id: '519' },
      pmd: { id: '0519' },
      psgh: { id: 's16608' },
    },
  },
  tranquill: {
    name: ['Tranquill'],
    sources: {
      ps: {},
      serebii: { id: '520' },
      pmd: { id: '0520' },
      psgh: { id: 's16640' },
    },
  },
  unfezant: {
    name: ['Unfezant'],
    sources: {
      ps: {},
      serebii: { id: '521' },
      pmd: { id: '0521' },
      psgh: { id: 's16672' },
    },
  },
  blitzle: {
    name: ['Blitzle'],
    sources: {
      ps: { flip: true },
      serebii: { id: '522' },
      pmd: { id: '0522' },
      psgh: { id: 's16704', flip: true },
    },
  },
  zebstrika: {
    name: ['Zebstrika'],
    sources: {
      ps: {},
      serebii: { id: '523' },
      pmd: { id: '0523' },
      psgh: { id: 's16736' },
    },
  },
  roggenrola: {
    name: ['Roggenrola'],
    sources: {
      ps: {},
      serebii: { id: '524' },
      pmd: { id: '0524' },
      psgh: { id: 's16768' },
    },
  },
  boldore: {
    name: ['Boldore'],
    sources: {
      ps: {},
      serebii: { id: '525' },
      pmd: { id: '0525' },
      psgh: { id: 's16800' },
    },
  },
  gigalith: {
    name: ['Gigalith'],
    sources: {
      ps: {},
      serebii: { id: '526' },
      pmd: { id: '0526' },
      psgh: { id: 's16832' },
    },
  },
  woobat: {
    name: ['Woobat'],
    sources: {
      ps: {},
      serebii: { id: '527' },
      pmd: { id: '0527' },
      psgh: { id: 's16864' },
    },
  },
  swoobat: {
    name: ['Swoobat'],
    sources: {
      ps: {},
      serebii: { id: '528' },
      pmd: { id: '0528' },
      psgh: { id: 's16896' },
    },
  },
  drilbur: {
    name: ['Drilbur'],
    sources: {
      ps: {},
      serebii: { id: '529' },
      pmd: { id: '0529' },
      psgh: { id: 's16928' },
    },
  },
  excadrill: {
    name: ['Excadrill'],
    sources: {
      ps: { flip: true },
      serebii: { id: '530' },
      pmd: { id: '0530' },
      psgh: { id: 's16960', flip: true },
    },
  },
  excadrillmega: {
    name: ['Mega Excadrill', 'Excadrill-Mega'],
    sources: {
      ps: { flip: true },
      serebii: { id: '530' },
      pmd: { id: '0530' },
      psgh: { id: 's16960', flip: true },
    },
  },
  audino: {
    name: ['Audino'],
    sources: {
      ps: { flip: true },
      serebii: { id: '531' },
      pmd: { id: '0531' },
      psgh: { id: 's16992', flip: true },
    },
  },
  audinomega: {
    name: ['Mega Audino', 'Audino-Mega'],
    sources: {
      ps: { id: 'audino-mega' },
      serebii: { id: '531-m' },
      pmd: { id: '0531/0001' },
      psgh: { id: 's16993' },
    },
  },
  timburr: {
    name: ['Timburr'],
    sources: {
      ps: {},
      serebii: { id: '532' },
      pmd: { id: '0532' },
      psgh: { id: 's17024' },
    },
  },
  gurdurr: {
    name: ['Gurdurr'],
    sources: {
      ps: {},
      serebii: { id: '533' },
      pmd: { id: '0533' },
      psgh: { id: 's17056' },
    },
  },
  conkeldurr: {
    name: ['Conkeldurr'],
    sources: {
      ps: {},
      serebii: { id: '534' },
      pmd: { id: '0534' },
      psgh: { id: 's17088' },
    },
  },
  tympole: {
    name: ['Tympole'],
    sources: {
      ps: {},
      serebii: { id: '535' },
      pmd: { id: '0535' },
      psgh: { id: 's17120' },
    },
  },
  palpitoad: {
    name: ['Palpitoad'],
    sources: {
      ps: {},
      serebii: { id: '536' },
      pmd: { id: '0536' },
      psgh: { id: 's17152' },
    },
  },
  seismitoad: {
    name: ['Seismitoad'],
    sources: {
      ps: {},
      serebii: { id: '537' },
      pmd: { id: '0537' },
      psgh: { id: 's17184' },
    },
  },
  throh: {
    name: ['Throh'],
    sources: {
      ps: {},
      serebii: { id: '538' },
      pmd: { id: '0538' },
      psgh: { id: 's17216' },
    },
  },
  sawk: {
    name: ['Sawk'],
    sources: {
      ps: {},
      serebii: { id: '539' },
      pmd: { id: '0539' },
      psgh: { id: 's17248' },
    },
  },
  sewaddle: {
    name: ['Sewaddle'],
    sources: {
      ps: {},
      serebii: { id: '540' },
      pmd: { id: '0540' },
      psgh: { id: 's17280' },
    },
  },
  swadloon: {
    name: ['Swadloon'],
    sources: {
      ps: {},
      serebii: { id: '541' },
      pmd: { id: '0541' },
      psgh: { id: 's17312' },
    },
  },
  leavanny: {
    name: ['Leavanny'],
    sources: {
      ps: {},
      serebii: { id: '542' },
      pmd: { id: '0542' },
      psgh: { id: 's17344' },
    },
  },
  venipede: {
    name: ['Venipede'],
    sources: {
      ps: {},
      serebii: { id: '543' },
      pmd: { id: '0543' },
      psgh: { id: 's17376' },
    },
  },
  whirlipede: {
    name: ['Whirlipede'],
    sources: {
      ps: {},
      serebii: { id: '544' },
      pmd: { id: '0544' },
      psgh: { id: 's17408' },
    },
  },
  scolipede: {
    name: ['Scolipede'],
    sources: {
      ps: {},
      serebii: { id: '545' },
      pmd: { id: '0545' },
      psgh: { id: 's17440' },
    },
  },
  scolipedemega: {
    name: ['Mega Scolipede', 'Scolipede-Mega'],
    sources: {
      ps: {},
      serebii: { id: '545' },
      pmd: { id: '0545' },
      psgh: { id: 's17440' },
    },
  },
  cottonee: {
    name: ['Cottonee'],
    sources: {
      ps: {},
      serebii: { id: '546' },
      pmd: { id: '0546' },
      psgh: { id: 's17472' },
    },
  },
  whimsicott: {
    name: ['Whimsicott'],
    sources: {
      ps: {},
      serebii: { id: '547' },
      pmd: { id: '0547' },
      psgh: { id: 's17504' },
    },
  },
  petilil: {
    name: ['Petilil'],
    sources: {
      ps: {},
      serebii: { id: '548' },
      pmd: { id: '0548' },
      psgh: { id: 's17536' },
    },
  },
  lilligant: {
    name: ['Lilligant'],
    sources: {
      ps: {},
      serebii: { id: '549' },
      pmd: { id: '0549' },
      psgh: { id: 's17568' },
    },
  },
  lilliganthisui: {
    name: ['Hisuian Lilligant', 'Lilligant-Hisui', 'Lilligant-H'],
    sources: {
      ps: { id: 'lilligant-hisui' },
      serebii: { id: '549-h' },
      pmd: { id: '0549/0001' },
      psgh: { id: 's17569' },
    },
  },
  basculin: {
    name: ['Basculin'],
    sources: {
      ps: {},
      serebii: { id: '550' },
      pmd: { id: '0550' },
      psgh: { id: 's17600' },
    },
  },
  basculinbluestriped: {
    name: ['Basculin-Blue-Striped'],
    sources: {
      ps: { id: 'basculin-bluestriped' },
      serebii: { id: '550-b' },
      pmd: { id: '0550/0001' },
      psgh: { id: 's17601' },
    },
  },
  basculinwhitestriped: {
    name: ['Basculin-White-Striped'],
    sources: {
      ps: { id: 'basculin-whitestriped' },
      serebii: { id: '550-w' },
      pmd: { id: '0550/0002' },
      psgh: { id: 's17602' },
    },
  },
  sandile: {
    name: ['Sandile'],
    sources: {
      ps: {},
      serebii: { id: '551' },
      pmd: { id: '0551' },
      psgh: { id: 's17632' },
    },
  },
  krokorok: {
    name: ['Krokorok'],
    sources: {
      ps: { flip: true },
      serebii: { id: '552' },
      pmd: { id: '0552' },
      psgh: { id: 's17664', flip: true },
    },
  },
  krookodile: {
    name: ['Krookodile'],
    sources: {
      ps: {},
      serebii: { id: '553' },
      pmd: { id: '0553' },
      psgh: { id: 's17696' },
    },
  },
  darumaka: {
    name: ['Darumaka'],
    sources: {
      ps: {},
      serebii: { id: '554' },
      pmd: { id: '0554' },
      psgh: { id: 's17728' },
    },
  },
  darumakagalar: {
    name: ['Galarian Darumaka', 'Darumaka-Galar', 'Darumaka-G'],
    sources: {
      ps: { id: 'darumaka-galar' },
      serebii: { id: '554-g' },
      pmd: { id: '0554/0001' },
      psgh: { id: 's17729' },
    },
  },
  darmanitan: {
    name: ['Darmanitan'],
    sources: {
      ps: {},
      serebii: { id: '555' },
      pmd: { id: '0555' },
      psgh: { id: 's17760' },
    },
  },
  darmanitanzen: {
    name: ['Darmanitan-Zen'],
    sources: {
      ps: { id: 'darmanitan-zen' },
      serebii: { id: '555' },
      pmd: { id: '0555/0001' },
      psgh: { id: 's17761' },
    },
  },
  darmanitangalar: {
    name: ['Galarian Darmanitan', 'Darmanitan-Galar', 'Darmanitan-G'],
    sources: {
      ps: { id: 'darmanitan-galar', flip: true },
      serebii: { id: '555-g' },
      pmd: { id: '0555/0002' },
      psgh: { id: 's17762', flip: true },
    },
  },
  darmanitangalarzen: {
    name: ['Darmanitan-G', 'Darmanitan-Galar-Zen'],
    sources: {
      ps: { id: 'darmanitan-galarzen' },
      serebii: { id: '555-gz' },
      pmd: { id: '0555/0003' },
      psgh: { id: 's17763' },
    },
  },
  maractus: {
    name: ['Maractus'],
    sources: {
      ps: {},
      serebii: { id: '556' },
      pmd: { id: '0556' },
      psgh: { id: 's17792' },
    },
  },
  dwebble: {
    name: ['Dwebble'],
    sources: {
      ps: {},
      serebii: { id: '557' },
      pmd: { id: '0557' },
      psgh: { id: 's17824' },
    },
  },
  crustle: {
    name: ['Crustle'],
    sources: {
      ps: {},
      serebii: { id: '558' },
      pmd: { id: '0558' },
      psgh: { id: 's17856' },
    },
  },
  scraggy: {
    name: ['Scraggy'],
    sources: {
      ps: {},
      serebii: { id: '559' },
      pmd: { id: '0559' },
      psgh: { id: 's17888' },
    },
  },
  scrafty: {
    name: ['Scrafty'],
    sources: {
      ps: {},
      serebii: { id: '560' },
      pmd: { id: '0560' },
      psgh: { id: 's17920' },
    },
  },
  scraftymega: {
    name: ['Mega Scrafty', 'Scrafty-Mega'],
    sources: {
      ps: {},
      serebii: { id: '560' },
      pmd: { id: '0560' },
      psgh: { id: 's17920' },
    },
  },
  sigilyph: {
    name: ['Sigilyph'],
    sources: {
      ps: {},
      serebii: { id: '561' },
      pmd: { id: '0561' },
      psgh: { id: 's17952' },
    },
  },
  yamask: {
    name: ['Yamask'],
    sources: {
      ps: {},
      serebii: { id: '562' },
      pmd: { id: '0562' },
      psgh: { id: 's17984' },
    },
  },
  yamaskgalar: {
    name: ['Galarian Yamask', 'Yamask-Galar', 'Yamask-G'],
    sources: {
      ps: { id: 'yamask-galar' },
      serebii: { id: '562-g' },
      pmd: { id: '0562/0001' },
      psgh: { id: 's17985' },
    },
  },
  cofagrigus: {
    name: ['Cofagrigus'],
    sources: {
      ps: {},
      serebii: { id: '563' },
      pmd: { id: '0563' },
      psgh: { id: 's18016' },
    },
  },
  tirtouga: {
    name: ['Tirtouga'],
    sources: {
      ps: {},
      serebii: { id: '564' },
      pmd: { id: '0564' },
      psgh: { id: 's18048' },
    },
  },
  carracosta: {
    name: ['Carracosta'],
    sources: {
      ps: {},
      serebii: { id: '565' },
      pmd: { id: '0565' },
      psgh: { id: 's18080' },
    },
  },
  archen: {
    name: ['Archen'],
    sources: {
      ps: {},
      serebii: { id: '566' },
      pmd: { id: '0566' },
      psgh: { id: 's18112' },
    },
  },
  archeops: {
    name: ['Archeops'],
    sources: {
      ps: {},
      serebii: { id: '567' },
      pmd: { id: '0567' },
      psgh: { id: 's18144' },
    },
  },
  trubbish: {
    name: ['Trubbish'],
    sources: {
      ps: {},
      serebii: { id: '568' },
      pmd: { id: '0568' },
      psgh: { id: 's18176' },
    },
  },
  garbodor: {
    name: ['Garbodor'],
    sources: {
      ps: {},
      serebii: { id: '569' },
      pmd: { id: '0569' },
      psgh: { id: 's18208' },
    },
  },
  garbodorgmax: {
    name: ['Garbodor-Gmax'],
    sources: {
      ps: { id: 'garbodor-gmax' },
      serebii: { id: '569-gi' },
      pmd: { id: '0569' },
      psgh: { id: 's18208-g' },
    },
  },
  garbodormega: {
    name: ['Mega Garbodor', 'Garbodor-Mega'],
    sources: {
      ps: { id: 'garbodor-gmax' },
      serebii: { id: '569-gi' },
      pmd: { id: '0569' },
      psgh: { id: 's18208-g' },
    },
  },
  zorua: {
    name: ['Zorua'],
    sources: {
      ps: {},
      serebii: { id: '570' },
      pmd: { id: '0570' },
      psgh: { id: 's18240' },
    },
  },
  zoruahisui: {
    name: ['Hisuian Zorua', 'Zorua-Hisui', 'Zorua-H'],
    sources: {
      ps: { id: 'zorua-hisui' },
      serebii: { id: '570-h' },
      pmd: { id: '0570/0001' },
      psgh: { id: 's18241' },
    },
  },
  zoroark: {
    name: ['Zoroark'],
    sources: {
      ps: {},
      serebii: { id: '571' },
      pmd: { id: '0571' },
      psgh: { id: 's18272' },
    },
  },
  zoroarkhisui: {
    name: ['Hisuian Zoroark', 'Zoroark-Hisui', 'Zoroark-H'],
    sources: {
      ps: { id: 'zoroark-hisui' },
      serebii: { id: '571-h' },
      pmd: { id: '0571/0001' },
      psgh: { id: 's18273' },
    },
  },
  minccino: {
    name: ['Minccino'],
    sources: {
      ps: {},
      serebii: { id: '572' },
      pmd: { id: '0572' },
      psgh: { id: 's18304' },
    },
  },
  cinccino: {
    name: ['Cinccino'],
    sources: {
      ps: {},
      serebii: { id: '573' },
      pmd: { id: '0573' },
      psgh: { id: 's18336' },
    },
  },
  gothita: {
    name: ['Gothita'],
    sources: {
      ps: {},
      serebii: { id: '574' },
      pmd: { id: '0574' },
      psgh: { id: 's18368' },
    },
  },
  gothorita: {
    name: ['Gothorita'],
    sources: {
      ps: {},
      serebii: { id: '575' },
      pmd: { id: '0575' },
      psgh: { id: 's18400' },
    },
  },
  gothitelle: {
    name: ['Gothitelle'],
    sources: {
      ps: {},
      serebii: { id: '576' },
      pmd: { id: '0576' },
      psgh: { id: 's18432' },
    },
  },
  solosis: {
    name: ['Solosis'],
    sources: {
      ps: {},
      serebii: { id: '577' },
      pmd: { id: '0577' },
      psgh: { id: 's18464' },
    },
  },
  duosion: {
    name: ['Duosion'],
    sources: {
      ps: {},
      serebii: { id: '578' },
      pmd: { id: '0578' },
      psgh: { id: 's18496' },
    },
  },
  reuniclus: {
    name: ['Reuniclus'],
    sources: {
      ps: {},
      serebii: { id: '579' },
      pmd: { id: '0579' },
      psgh: { id: 's18528' },
    },
  },
  ducklett: {
    name: ['Ducklett'],
    sources: {
      ps: {},
      serebii: { id: '580' },
      pmd: { id: '0580' },
      psgh: { id: 's18560' },
    },
  },
  swanna: {
    name: ['Swanna'],
    sources: {
      ps: {},
      serebii: { id: '581' },
      pmd: { id: '0581' },
      psgh: { id: 's18592' },
    },
  },
  vanillite: {
    name: ['Vanillite'],
    sources: {
      ps: {},
      serebii: { id: '582' },
      pmd: { id: '0582' },
      psgh: { id: 's18624' },
    },
  },
  vanillish: {
    name: ['Vanillish'],
    sources: {
      ps: {},
      serebii: { id: '583' },
      pmd: { id: '0583' },
      psgh: { id: 's18656' },
    },
  },
  vanilluxe: {
    name: ['Vanilluxe'],
    sources: {
      ps: {},
      serebii: { id: '584' },
      pmd: { id: '0584' },
      psgh: { id: 's18688' },
    },
  },
  deerling: {
    name: ['Deerling'],
    sources: {
      ps: {},
      serebii: { id: '585' },
      pmd: { id: '0585' },
      psgh: { id: 's18720' },
    },
  },
  sawsbuck: {
    name: ['Sawsbuck'],
    sources: {
      ps: {},
      serebii: { id: '586' },
      pmd: { id: '0586' },
      psgh: { id: 's18752' },
    },
  },
  emolga: {
    name: ['Emolga'],
    sources: {
      ps: {},
      serebii: { id: '587' },
      pmd: { id: '0587' },
      psgh: { id: 's18784' },
    },
  },
  karrablast: {
    name: ['Karrablast'],
    sources: {
      ps: {},
      serebii: { id: '588' },
      pmd: { id: '0588' },
      psgh: { id: 's18816' },
    },
  },
  escavalier: {
    name: ['Escavalier'],
    sources: {
      ps: {},
      serebii: { id: '589' },
      pmd: { id: '0589' },
      psgh: { id: 's18848' },
    },
  },
  foongus: {
    name: ['Foongus'],
    sources: {
      ps: {},
      serebii: { id: '590' },
      pmd: { id: '0590' },
      psgh: { id: 's18880' },
    },
  },
  amoonguss: {
    name: ['Amoonguss'],
    sources: {
      ps: {},
      serebii: { id: '591' },
      pmd: { id: '0591' },
      psgh: { id: 's18912' },
    },
  },
  frillish: {
    name: ['Frillish'],
    sources: {
      ps: {},
      serebii: { id: '592' },
      pmd: { id: '0592' },
      psgh: { id: 's18944' },
    },
  },
  jellicent: {
    name: ['Jellicent'],
    sources: {
      ps: { flip: true },
      serebii: { id: '593' },
      pmd: { id: '0593' },
      psgh: { id: 's18976', flip: true },
    },
  },
  alomomola: {
    name: ['Alomomola'],
    sources: {
      ps: {},
      serebii: { id: '594' },
      pmd: { id: '0594' },
      psgh: { id: 's19008' },
    },
  },
  joltik: {
    name: ['Joltik'],
    sources: {
      ps: {},
      serebii: { id: '595' },
      pmd: { id: '0595' },
      psgh: { id: 's19040' },
    },
  },
  galvantula: {
    name: ['Galvantula'],
    sources: {
      ps: {},
      serebii: { id: '596' },
      pmd: { id: '0596' },
      psgh: { id: 's19072' },
    },
  },
  ferroseed: {
    name: ['Ferroseed'],
    sources: {
      ps: {},
      serebii: { id: '597' },
      pmd: { id: '0597' },
      psgh: { id: 's19104' },
    },
  },
  ferrothorn: {
    name: ['Ferrothorn'],
    sources: {
      ps: {},
      serebii: { id: '598' },
      pmd: { id: '0598' },
      psgh: { id: 's19136' },
    },
  },
  klink: {
    name: ['Klink'],
    sources: {
      ps: {},
      serebii: { id: '599' },
      pmd: { id: '0599' },
      psgh: { id: 's19168' },
    },
  },
  klang: {
    name: ['Klang'],
    sources: {
      ps: {},
      serebii: { id: '600' },
      pmd: { id: '0600' },
      psgh: { id: 's19200' },
    },
  },
  klinklang: {
    name: ['Klinklang'],
    sources: {
      ps: {},
      serebii: { id: '601' },
      pmd: { id: '0601' },
      psgh: { id: 's19232' },
    },
  },
  tynamo: {
    name: ['Tynamo'],
    sources: {
      ps: {},
      serebii: { id: '602' },
      pmd: { id: '0602' },
      psgh: { id: 's19264' },
    },
  },
  eelektrik: {
    name: ['Eelektrik'],
    sources: {
      ps: {},
      serebii: { id: '603' },
      pmd: { id: '0603' },
      psgh: { id: 's19296' },
    },
  },
  eelektross: {
    name: ['Eelektross'],
    sources: {
      ps: {},
      serebii: { id: '604' },
      pmd: { id: '0604' },
      psgh: { id: 's19328' },
    },
  },
  eelektrossmega: {
    name: ['Mega Eelektross', 'Eelektross-Mega'],
    sources: {
      ps: {},
      serebii: { id: '604' },
      pmd: { id: '0604' },
      psgh: { id: 's19328' },
    },
  },
  elgyem: {
    name: ['Elgyem'],
    sources: {
      ps: { flip: true },
      serebii: { id: '605' },
      pmd: { id: '0605' },
      psgh: { id: 's19360', flip: true },
    },
  },
  beheeyem: {
    name: ['Beheeyem'],
    sources: {
      ps: {},
      serebii: { id: '606' },
      pmd: { id: '0606' },
      psgh: { id: 's19392' },
    },
  },
  litwick: {
    name: ['Litwick'],
    sources: {
      ps: {},
      serebii: { id: '607' },
      pmd: { id: '0607' },
      psgh: { id: 's19424' },
    },
  },
  lampent: {
    name: ['Lampent'],
    sources: {
      ps: {},
      serebii: { id: '608' },
      pmd: { id: '0608' },
      psgh: { id: 's19456' },
    },
  },
  chandelure: {
    name: ['Chandelure'],
    sources: {
      ps: {},
      serebii: { id: '609' },
      pmd: { id: '0609' },
      psgh: { id: 's19488' },
    },
  },
  chandeluremega: {
    name: ['Mega Chandelure', 'Chandelure-Mega'],
    sources: {
      ps: {},
      serebii: { id: '609' },
      pmd: { id: '0609' },
      psgh: { id: 's19488' },
    },
  },
  axew: {
    name: ['Axew'],
    sources: {
      ps: {},
      serebii: { id: '610' },
      pmd: { id: '0610' },
      psgh: { id: 's19520' },
    },
  },
  fraxure: {
    name: ['Fraxure'],
    sources: {
      ps: {},
      serebii: { id: '611' },
      pmd: { id: '0611' },
      psgh: { id: 's19552' },
    },
  },
  haxorus: {
    name: ['Haxorus'],
    sources: {
      ps: {},
      serebii: { id: '612' },
      pmd: { id: '0612' },
      psgh: { id: 's19584' },
    },
  },
  cubchoo: {
    name: ['Cubchoo'],
    sources: {
      ps: {},
      serebii: { id: '613' },
      pmd: { id: '0613' },
      psgh: { id: 's19616' },
    },
  },
  beartic: {
    name: ['Beartic'],
    sources: {
      ps: {},
      serebii: { id: '614' },
      pmd: { id: '0614' },
      psgh: { id: 's19648' },
    },
  },
  cryogonal: {
    name: ['Cryogonal'],
    sources: {
      ps: {},
      serebii: { id: '615' },
      pmd: { id: '0615' },
      psgh: { id: 's19680' },
    },
  },
  shelmet: {
    name: ['Shelmet'],
    sources: {
      ps: {},
      serebii: { id: '616' },
      pmd: { id: '0616' },
      psgh: { id: 's19712' },
    },
  },
  accelgor: {
    name: ['Accelgor'],
    sources: {
      ps: { flip: true },
      serebii: { id: '617' },
      pmd: { id: '0617' },
      psgh: { id: 's19744', flip: true },
    },
  },
  stunfisk: {
    name: ['Stunfisk'],
    sources: {
      ps: {},
      serebii: { id: '618' },
      pmd: { id: '0618' },
      psgh: { id: 's19776' },
    },
  },
  stunfiskgalar: {
    name: ['Galarian Stunfisk', 'Stunfisk-Galar', 'Stunfisk-G'],
    sources: {
      ps: { id: 'stunfisk-galar' },
      serebii: { id: '618-g' },
      pmd: { id: '0618/0001' },
      psgh: { id: 's19777' },
    },
  },
  mienfoo: {
    name: ['Mienfoo'],
    sources: {
      ps: {},
      serebii: { id: '619' },
      pmd: { id: '0619' },
      psgh: { id: 's19808' },
    },
  },
  mienshao: {
    name: ['Mienshao'],
    sources: {
      ps: {},
      serebii: { id: '620' },
      pmd: { id: '0620' },
      psgh: { id: 's19840' },
    },
  },
  druddigon: {
    name: ['Druddigon'],
    sources: {
      ps: {},
      serebii: { id: '621' },
      pmd: { id: '0621' },
      psgh: { id: 's19872' },
    },
  },
  golett: {
    name: ['Golett'],
    sources: {
      ps: {},
      serebii: { id: '622' },
      pmd: { id: '0622' },
      psgh: { id: 's19904' },
    },
  },
  golurk: {
    name: ['Golurk'],
    sources: {
      ps: {},
      serebii: { id: '623' },
      pmd: { id: '0623' },
      psgh: { id: 's19936' },
    },
  },
  golurkmega: {
    name: ['Mega Golurk', 'Golurk-Mega'],
    sources: {
      ps: { id: 'golurk-mega' },
      serebii: { id: '623' },
      pmd: { id: '0623' },
      psgh: { id: 's19936' },
    },
  },
  pawniard: {
    name: ['Pawniard'],
    sources: {
      ps: { flip: true },
      serebii: { id: '624' },
      pmd: { id: '0624' },
      psgh: { id: 's19968', flip: true },
    },
  },
  bisharp: {
    name: ['Bisharp'],
    sources: {
      ps: {},
      serebii: { id: '625' },
      pmd: { id: '0625' },
      psgh: { id: 's20000' },
    },
  },
  bouffalant: {
    name: ['Bouffalant'],
    sources: {
      ps: {},
      serebii: { id: '626' },
      pmd: { id: '0626' },
      psgh: { id: 's20032' },
    },
  },
  rufflet: {
    name: ['Rufflet'],
    sources: {
      ps: {},
      serebii: { id: '627' },
      pmd: { id: '0627' },
      psgh: { id: 's20064' },
    },
  },
  braviary: {
    name: ['Braviary'],
    sources: {
      ps: {},
      serebii: { id: '628' },
      pmd: { id: '0628' },
      psgh: { id: 's20096' },
    },
  },
  braviaryhisui: {
    name: ['Hisuian Braviary', 'Braviary-Hisui', 'Braviary-H'],
    sources: {
      ps: { id: 'braviary-hisui' },
      serebii: { id: '628-h' },
      pmd: { id: '0628/0001' },
      psgh: { id: 's20097' },
    },
  },
  vullaby: {
    name: ['Vullaby'],
    sources: {
      ps: {},
      serebii: { id: '629' },
      pmd: { id: '0629' },
      psgh: { id: 's20128' },
    },
  },
  mandibuzz: {
    name: ['Mandibuzz'],
    sources: {
      ps: { flip: true },
      serebii: { id: '630' },
      pmd: { id: '0630' },
      psgh: { id: 's20160', flip: true },
    },
  },
  heatmor: {
    name: ['Heatmor'],
    sources: {
      ps: {},
      serebii: { id: '631' },
      pmd: { id: '0631' },
      psgh: { id: 's20192' },
    },
  },
  durant: {
    name: ['Durant'],
    sources: {
      ps: {},
      serebii: { id: '632' },
      pmd: { id: '0632' },
      psgh: { id: 's20224' },
    },
  },
  deino: {
    name: ['Deino'],
    sources: {
      ps: {},
      serebii: { id: '633' },
      pmd: { id: '0633' },
      psgh: { id: 's20256' },
    },
  },
  zweilous: {
    name: ['Zweilous'],
    sources: {
      ps: {},
      serebii: { id: '634' },
      pmd: { id: '0634' },
      psgh: { id: 's20288' },
    },
  },
  hydreigon: {
    name: ['Hydreigon'],
    sources: {
      ps: {},
      serebii: { id: '635' },
      pmd: { id: '0635' },
      psgh: { id: 's20320' },
    },
  },
  larvesta: {
    name: ['Larvesta'],
    sources: {
      ps: {},
      serebii: { id: '636' },
      pmd: { id: '0636' },
      psgh: { id: 's20352' },
    },
  },
  volcarona: {
    name: ['Volcarona'],
    sources: {
      ps: {},
      serebii: { id: '637' },
      pmd: { id: '0637' },
      psgh: { id: 's20384' },
    },
  },
  cobalion: {
    name: ['Cobalion'],
    sources: {
      ps: {},
      serebii: { id: '638' },
      pmd: { id: '0638' },
      psgh: { id: 's20416' },
    },
  },
  terrakion: {
    name: ['Terrakion'],
    sources: {
      ps: {},
      serebii: { id: '639' },
      pmd: { id: '0639' },
      psgh: { id: 's20448' },
    },
  },
  virizion: {
    name: ['Virizion'],
    sources: {
      ps: { flip: true },
      serebii: { id: '640' },
      pmd: { id: '0640' },
      psgh: { id: 's20480', flip: true },
    },
  },
  tornadus: {
    name: ['Tornadus-Incarnate', 'Tornadus', 'Tornadus-I'],
    sources: {
      ps: {},
      serebii: { id: '641' },
      pmd: { id: '0641' },
      psgh: { id: 's20512' },
    },
  },
  tornadustherian: {
    name: ['Tornadus-T', 'Tornadus-Therian'],
    sources: {
      ps: { id: 'tornadus-therian' },
      serebii: { id: '641-t' },
      pmd: { id: '0641/0001' },
      psgh: { id: 's20513' },
    },
  },
  thundurus: {
    name: ['Thundurus-Incarnate', 'Thundurus', 'Thundurus-I'],
    sources: {
      ps: { flip: true },
      serebii: { id: '642' },
      pmd: { id: '0642' },
      psgh: { id: 's20544', flip: true },
    },
  },
  thundurustherian: {
    name: ['Thundurus-T', 'Thundurus-Therian'],
    sources: {
      ps: { id: 'thundurus-therian', flip: true },
      serebii: { id: '642-t' },
      pmd: { id: '0642/0001' },
      psgh: { id: 's20545', flip: true },
    },
  },
  reshiram: {
    name: ['Reshiram'],
    sources: {
      ps: { flip: true },
      serebii: { id: '643' },
      pmd: { id: '0643' },
      psgh: { id: 's20576', flip: true },
    },
  },
  zekrom: {
    name: ['Zekrom'],
    sources: {
      ps: {},
      serebii: { id: '644' },
      pmd: { id: '0644' },
      psgh: { id: 's20608' },
    },
  },
  landorus: {
    name: ['Landorus-Incarnate', 'Landorus', 'Landorus-I'],
    sources: {
      ps: {},
      serebii: { id: '645' },
      pmd: { id: '0645' },
      psgh: { id: 's20640' },
    },
  },
  landorustherian: {
    name: ['Landorus-T', 'Landorus-Therian'],
    sources: {
      ps: { id: 'landorus-therian' },
      serebii: { id: '645-t' },
      pmd: { id: '0645/0001' },
      psgh: { id: 's20641' },
    },
  },
  kyurem: {
    name: ['Kyurem'],
    sources: {
      ps: {},
      serebii: { id: '646' },
      pmd: { id: '0646' },
      psgh: { id: 's20672' },
    },
  },
  kyuremblack: {
    name: ['Kyurem-Black'],
    sources: {
      ps: { id: 'kyurem-black', flip: true },
      serebii: { id: '646-b' },
      pmd: { id: '0646/0001' },
      psgh: { id: 's20674', flip: true },
    },
  },
  kyuremwhite: {
    name: ['Kyurem-White'],
    sources: {
      ps: { id: 'kyurem-white' },
      serebii: { id: '646-w' },
      pmd: { id: '0646/0002' },
      psgh: { id: 's20673' },
    },
  },
  keldeo: {
    name: ['Keldeo'],
    sources: {
      ps: {},
      serebii: { id: '647' },
      pmd: { id: '0647' },
      psgh: { id: 's20704' },
    },
  },
  keldeoresolute: {
    name: ['Keldeo-Resolute'],
    sources: {
      ps: { id: 'keldeo-resolute', flip: true },
      serebii: { id: '647-r' },
      pmd: { id: '0647/0001' },
      psgh: { id: 's20705', flip: true },
    },
  },
  meloetta: {
    name: ['Meloetta'],
    sources: {
      ps: {},
      serebii: { id: '648' },
      pmd: { id: '0648' },
      psgh: { id: 's20736' },
    },
  },
  meloettapirouette: {
    name: ['Meloetta-Pirouette'],
    sources: {
      ps: { id: 'meloetta-pirouette', flip: true },
      serebii: { id: '648-p' },
      pmd: { id: '0648/0001' },
      psgh: { id: 's20737', flip: true },
    },
  },
  genesect: {
    name: ['Genesect'],
    sources: {
      ps: {},
      serebii: { id: '649' },
      pmd: { id: '0649' },
      psgh: { id: 's20768' },
    },
  },
  genesectdouse: {
    name: ['Genesect-Douse'],
    sources: {
      ps: { id: 'genesect-douse' },
      serebii: { id: '649-w' },
      pmd: { id: '0649/0001' },
      psgh: { id: 's20769' },
    },
  },
  genesectshock: {
    name: ['Genesect-Shock'],
    sources: {
      ps: { id: 'genesect-shock' },
      serebii: { id: '649-e' },
      pmd: { id: '0649/0002' },
      psgh: { id: 's20770' },
    },
  },
  genesectburn: {
    name: ['Genesect-Burn'],
    sources: {
      ps: { id: 'genesect-burn' },
      serebii: { id: '649-f' },
      pmd: { id: '0649/0003' },
      psgh: { id: 's20771' },
    },
  },
  genesectchill: {
    name: ['Genesect-Chill'],
    sources: {
      ps: { id: 'genesect-chill' },
      serebii: { id: '649-i' },
      pmd: { id: '0649/0004' },
      psgh: { id: 's20772' },
    },
  },
  chespin: {
    name: ['Chespin'],
    sources: {
      ps: {},
      serebii: { id: '650' },
      pmd: { id: '0650' },
      psgh: { id: 's20800' },
    },
  },
  quilladin: {
    name: ['Quilladin'],
    sources: {
      ps: {},
      serebii: { id: '651' },
      pmd: { id: '0651' },
      psgh: { id: 's20832' },
    },
  },
  chesnaught: {
    name: ['Chesnaught'],
    sources: {
      ps: {},
      serebii: { id: '652' },
      pmd: { id: '0652' },
      psgh: { id: 's20864' },
    },
  },
  chesnaughtmega: {
    name: ['Mega Chesnaught', 'Chesnaught-Mega'],
    sources: {
      ps: {},
      serebii: { id: '652' },
      pmd: { id: '0652' },
      psgh: { id: 's20864' },
    },
  },

  fennekin: {
    name: ['Fennekin'],
    sources: {
      ps: {},
      serebii: { id: '653' },
      pmd: { id: '0653' },
      psgh: { id: 's20896' },
    },
  },
  braixen: {
    name: ['Braixen'],
    sources: {
      ps: {},
      serebii: { id: '654' },
      pmd: { id: '0654' },
      psgh: { id: 's20928' },
    },
  },
  delphox: {
    name: ['Delphox'],
    sources: {
      ps: {},
      serebii: { id: '655' },
      pmd: { id: '0655' },
      psgh: { id: 's20960' },
    },
  },
  delphoxmega: {
    name: ['Mega Delphox', 'Delphox-Mega'],
    sources: {
      ps: {},
      serebii: { id: '655' },
      pmd: { id: '0655' },
      psgh: { id: 's20960' },
    },
  },

  froakie: {
    name: ['Froakie'],
    sources: {
      ps: { flip: true },
      serebii: { id: '656' },
      pmd: { id: '0656' },
      psgh: { id: 's20992', flip: true },
    },
  },
  frogadier: {
    name: ['Frogadier'],
    sources: {
      ps: {},
      serebii: { id: '657' },
      pmd: { id: '0657' },
      psgh: { id: 's21024' },
    },
  },
  greninja: {
    name: ['Greninja'],
    sources: {
      ps: { flip: true },
      serebii: { id: '658' },
      pmd: { id: '0658' },
      psgh: { id: 's21056', flip: true },
    },
  },
  greninjamega: {
    name: ['Mega Greninja', 'Greninja-Mega'],
    sources: {
      ps: { flip: true },
      serebii: { id: '658' },
      pmd: { id: '0658' },
      psgh: { id: 's21056', flip: true },
    },
  },
  greninjabond: {
    name: ['Greninja-Bond'],
    sources: {
      ps: { id: 'greninja' },
      serebii: { id: '658' },
      pmd: { id: '0658' },
      psgh: { id: 's21056' },
    },
  },
  greninjaash: {
    name: ['Greninja-Ash'],
    sources: {
      ps: { id: 'greninja-ash' },
      serebii: { id: '658-a' },
      pmd: { id: '0658/0001' },
      psgh: { id: 's21058' },
    },
  },
  bunnelby: {
    name: ['Bunnelby'],
    sources: {
      ps: {},
      serebii: { id: '659' },
      pmd: { id: '0659' },
      psgh: { id: 's21088' },
    },
  },
  diggersby: {
    name: ['Diggersby'],
    sources: {
      ps: {},
      serebii: { id: '660' },
      pmd: { id: '0660' },
      psgh: { id: 's21120' },
    },
  },
  fletchling: {
    name: ['Fletchling'],
    sources: {
      ps: {},
      serebii: { id: '661' },
      pmd: { id: '0661' },
      psgh: { id: 's21152' },
    },
  },
  fletchinder: {
    name: ['Fletchinder'],
    sources: {
      ps: {},
      serebii: { id: '662' },
      pmd: { id: '0662' },
      psgh: { id: 's21184' },
    },
  },
  talonflame: {
    name: ['Talonflame'],
    sources: {
      ps: {},
      serebii: { id: '663' },
      pmd: { id: '0663' },
      psgh: { id: 's21216' },
    },
  },
  scatterbug: {
    name: ['Scatterbug'],
    sources: {
      ps: { flip: true },
      serebii: { id: '664' },
      pmd: { id: '0664' },
      psgh: { id: 's21248', flip: true },
    },
  },
  spewpa: {
    name: ['Spewpa'],
    sources: {
      ps: {},
      serebii: { id: '665' },
      pmd: { id: '0665' },
      psgh: { id: 's21280' },
    },
  },
  vivillon: {
    name: ['Vivillon'],
    sources: {
      ps: {},
      serebii: { id: '666' },
      pmd: { id: '0666' },
      psgh: { id: 's21312' },
    },
  },
  vivillonfancy: {
    name: ['Vivillon-Fancy'],
    sources: {
      ps: { id: 'vivillon-fancy' },
      serebii: { id: '666-f' },
      pmd: { id: '0666/0018' },
      psgh: { id: 's21330' },
    },
  },
  vivillonpokeball: {
    name: ['Vivillon-Pokeball'],
    sources: {
      ps: { id: 'vivillon-pokeball' },
      serebii: { id: '666-pb' },
      pmd: { id: '0666/0019' },
      psgh: { id: 's21331' },
    },
  },
  litleo: {
    name: ['Litleo'],
    sources: {
      ps: {},
      serebii: { id: '667' },
      pmd: { id: '0667' },
      psgh: { id: 's21344' },
    },
  },
  pyroar: {
    name: ['Pyroar'],
    sources: {
      ps: { flip: true },
      serebii: { id: '668' },
      pmd: { id: '0668' },
      psgh: { id: 's21376', flip: true },
    },
  },
  pyroarmega: {
    name: ['Mega Pyroar', 'Pyroar-Mega'],
    sources: {
      ps: { flip: true },
      serebii: { id: '668' },
      pmd: { id: '0668' },
      psgh: { id: 's21376', flip: true },
    },
  },
  flabebe: {
    name: ['Flabébé'],
    sources: {
      ps: {},
      serebii: { id: '669' },
      pmd: { id: '0669' },
      psgh: { id: 's21408' },
    },
  },
  floette: {
    name: ['Floette'],
    sources: {
      ps: { flip: true },
      serebii: { id: '670' },
      pmd: { id: '0670' },
      psgh: { id: 's21440', flip: true },
    },
  },
  floetteeternal: {
    name: ['Floette-Eternal'],
    sources: {
      ps: { id: 'floette-eternal', flip: true },
      serebii: { id: '670' },
      pmd: { id: '0670/0005' },
      psgh: { id: 's21445', flip: true },
    },
  },
  floettemega: {
    name: ['Mega Floette', 'Floette-Mega'],
    sources: {
      ps: { flip: true },
      serebii: { id: '670' },
      pmd: { id: '0670' },
      psgh: { id: 's21440', flip: true },
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
      psgh: { id: 's21472' },
    },
  },
  skiddo: {
    name: ['Skiddo'],
    sources: {
      ps: {},
      serebii: { id: '672' },
      pmd: { id: '0672' },
      psgh: { id: 's21504' },
    },
  },
  gogoat: {
    name: ['Gogoat'],
    sources: {
      ps: {},
      serebii: { id: '673' },
      pmd: { id: '0673' },
      psgh: { id: 's21536' },
    },
  },
  pancham: {
    name: ['Pancham'],
    sources: {
      ps: {},
      serebii: { id: '674' },
      pmd: { id: '0674' },
      psgh: { id: 's21568' },
    },
  },
  pangoro: {
    name: ['Pangoro'],
    sources: {
      ps: {},
      serebii: { id: '675' },
      pmd: { id: '0675' },
      psgh: { id: 's21600' },
    },
  },
  furfrou: {
    name: ['Furfrou'],
    sources: {
      ps: {},
      serebii: { id: '676' },
      pmd: { id: '0676' },
      psgh: { id: 's21632' },
    },
  },
  espurr: {
    name: ['Espurr'],
    sources: {
      ps: {},
      serebii: { id: '677' },
      pmd: { id: '0677' },
      psgh: { id: 's21664' },
    },
  },
  meowstic: {
    name: ['Meowstic'],
    sources: {
      ps: {},
      serebii: { id: '678' },
      pmd: { id: '0678' },
      psgh: { id: 's21696' },
    },
  },
  meowsticf: {
    name: ['Meowstic-Female', 'Meowstic-F'],
    sources: {
      ps: { id: 'meowstic-f' },
      serebii: { id: '678-f' },
      pmd: { id: '0678/0000/0000/0002' },
      psgh: { id: 's21697' },
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
      pmd: { id: '0678' },
      psgh: { id: 's21696' },
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
      pmd: { id: '0678/0000/0000/0002' },
      psgh: { id: 's21697' },
    },
  },
  honedge: {
    name: ['Honedge'],
    sources: {
      ps: {},
      serebii: { id: '679' },
      pmd: { id: '0679' },
      psgh: { id: 's21728' },
    },
  },
  doublade: {
    name: ['Doublade'],
    sources: {
      ps: {},
      serebii: { id: '680' },
      pmd: { id: '0680' },
      psgh: { id: 's21760' },
    },
  },
  aegislash: {
    name: ['Aegislash'],
    sources: {
      ps: {},
      serebii: { id: '681' },
      pmd: { id: '0681' },
      psgh: { id: 's21792' },
    },
  },
  aegislashblade: {
    name: ['Aegislash-Blade'],
    sources: {
      ps: { id: 'aegislash-blade' },
      serebii: { id: '681-b' },
      pmd: { id: '0681/0001' },
      psgh: { id: 's21793' },
    },
  },
  spritzee: {
    name: ['Spritzee'],
    sources: {
      ps: {},
      serebii: { id: '682' },
      pmd: { id: '0682' },
      psgh: { id: 's21824' },
    },
  },
  aromatisse: {
    name: ['Aromatisse'],
    sources: {
      ps: { flip: true },
      serebii: { id: '683' },
      pmd: { id: '0683' },
      psgh: { id: 's21856', flip: true },
    },
  },
  swirlix: {
    name: ['Swirlix'],
    sources: {
      ps: {},
      serebii: { id: '684' },
      pmd: { id: '0684' },
      psgh: { id: 's21888' },
    },
  },
  slurpuff: {
    name: ['Slurpuff'],
    sources: {
      ps: {},
      serebii: { id: '685' },
      pmd: { id: '0685' },
      psgh: { id: 's21920' },
    },
  },
  inkay: {
    name: ['Inkay'],
    sources: {
      ps: { flip: true },
      serebii: { id: '686' },
      pmd: { id: '0686' },
      psgh: { id: 's21952', flip: true },
    },
  },
  malamar: {
    name: ['Malamar'],
    sources: {
      ps: {},
      serebii: { id: '687' },
      pmd: { id: '0687' },
      psgh: { id: 's21984' },
    },
  },
  malamarmega: {
    name: ['Mega Malamar', 'Malamar-Mega'],
    sources: {
      ps: {},
      serebii: { id: '687' },
      pmd: { id: '0687' },
      psgh: { id: 's21984' },
    },
  },
  binacle: {
    name: ['Binacle'],
    sources: {
      ps: {},
      serebii: { id: '688' },
      pmd: { id: '0688' },
      psgh: { id: 's22016' },
    },
  },
  barbaracle: {
    name: ['Barbaracle'],
    sources: {
      ps: {},
      serebii: { id: '689' },
      pmd: { id: '0689' },
      psgh: { id: 's22048' },
    },
  },
  barbaraclemega: {
    name: ['Mega Barbaracle', 'Barbaracle-Mega'],
    sources: {
      ps: {},
      serebii: { id: '689' },
      pmd: { id: '0689' },
      psgh: { id: 's22048' },
    },
  },
  skrelp: {
    name: ['Skrelp'],
    sources: {
      ps: {},
      serebii: { id: '690' },
      pmd: { id: '0690' },
      psgh: { id: 's22080' },
    },
  },
  dragalge: {
    name: ['Dragalge'],
    sources: {
      ps: {},
      serebii: { id: '691' },
      pmd: { id: '0691' },
      psgh: { id: 's22112' },
    },
  },
  dragalgemega: {
    name: ['Mega Dragalge', 'Dragalge-Mega'],
    sources: {
      ps: {},
      serebii: { id: '691' },
      pmd: { id: '0691' },
      psgh: { id: 's22112' },
    },
  },
  clauncher: {
    name: ['Clauncher'],
    sources: {
      ps: {},
      serebii: { id: '692' },
      pmd: { id: '0692' },
      psgh: { id: 's22144' },
    },
  },
  clawitzer: {
    name: ['Clawitzer'],
    sources: {
      ps: {},
      serebii: { id: '693' },
      pmd: { id: '0693' },
      psgh: { id: 's22176' },
    },
  },
  helioptile: {
    name: ['Helioptile'],
    sources: {
      ps: {},
      serebii: { id: '694' },
      pmd: { id: '0694' },
      psgh: { id: 's22208' },
    },
  },
  heliolisk: {
    name: ['Heliolisk'],
    sources: {
      ps: {},
      serebii: { id: '695' },
      pmd: { id: '0695' },
      psgh: { id: 's22240' },
    },
  },
  tyrunt: {
    name: ['Tyrunt'],
    sources: {
      ps: { flip: true },
      serebii: { id: '696' },
      pmd: { id: '0696' },
      psgh: { id: 's22272', flip: true },
    },
  },
  tyrantrum: {
    name: ['Tyrantrum'],
    sources: {
      ps: {},
      serebii: { id: '697' },
      pmd: { id: '0697' },
      psgh: { id: 's22304' },
    },
  },
  amaura: {
    name: ['Amaura'],
    sources: {
      ps: {},
      serebii: { id: '698' },
      pmd: { id: '0698' },
      psgh: { id: 's22336' },
    },
  },
  aurorus: {
    name: ['Aurorus'],
    sources: {
      ps: {},
      serebii: { id: '699' },
      pmd: { id: '0699' },
      psgh: { id: 's22368' },
    },
  },
  sylveon: {
    name: ['Sylveon'],
    sources: {
      ps: {},
      serebii: { id: '700' },
      pmd: { id: '0700' },
      psgh: { id: 's22400' },
    },
  },
  hawlucha: {
    name: ['Hawlucha'],
    sources: {
      ps: {},
      serebii: { id: '701' },
      pmd: { id: '0701' },
      psgh: { id: 's22432' },
    },
  },
  hawluchamega: {
    name: ['Mega Hawlucha', 'Hawlucha-Mega'],
    sources: {
      ps: {},
      serebii: { id: '701' },
      pmd: { id: '0701' },
      psgh: { id: 's22432' },
    },
  },
  dedenne: {
    name: ['Dedenne'],
    sources: {
      ps: {},
      serebii: { id: '702' },
      pmd: { id: '0702' },
      psgh: { id: 's22464' },
    },
  },
  carbink: {
    name: ['Carbink'],
    sources: {
      ps: {},
      serebii: { id: '703' },
      pmd: { id: '0703' },
      psgh: { id: 's22496' },
    },
  },
  goomy: {
    name: ['Goomy'],
    sources: {
      ps: {},
      serebii: { id: '704' },
      pmd: { id: '0704' },
      psgh: { id: 's22528' },
    },
  },
  sliggoo: {
    name: ['Sliggoo'],
    sources: {
      ps: { flip: true },
      serebii: { id: '705' },
      pmd: { id: '0705' },
      psgh: { id: 's22560', flip: true },
    },
  },
  sliggoohisui: {
    name: ['Hisuian Sliggoo', 'Sliggoo-Hisui', 'Sliggoo-H'],
    sources: {
      ps: { id: 'sliggoo-hisui' },
      serebii: { id: '705-h' },
      pmd: { id: '0705/0001' },
      psgh: { id: 's22561' },
    },
  },
  goodra: {
    name: ['Goodra'],
    sources: {
      ps: {},
      serebii: { id: '706' },
      pmd: { id: '0706' },
      psgh: { id: 's22592' },
    },
  },
  goodrahisui: {
    name: ['Hisuian Goodra', 'Goodra-Hisui', 'Goodra-H'],
    sources: {
      ps: { id: 'goodra-hisui' },
      serebii: { id: '706-h' },
      pmd: { id: '0706/0001' },
      psgh: { id: 's22593' },
    },
  },
  klefki: {
    name: ['Klefki'],
    sources: {
      ps: {},
      serebii: { id: '707' },
      pmd: { id: '0707' },
      psgh: { id: 's22624' },
    },
  },
  phantump: {
    name: ['Phantump'],
    sources: {
      ps: { flip: true },
      serebii: { id: '708' },
      pmd: { id: '0708' },
      psgh: { id: 's22656', flip: true },
    },
  },
  trevenant: {
    name: ['Trevenant'],
    sources: {
      ps: {},
      serebii: { id: '709' },
      pmd: { id: '0709' },
      psgh: { id: 's22688' },
    },
  },
  pumpkaboo: {
    name: ['Pumpkaboo'],
    sources: {
      ps: {},
      serebii: { id: '710' },
      pmd: { id: '0710' },
      psgh: { id: 's22720' },
    },
  },
  pumpkaboosmall: {
    name: ['Pumpkaboo-Small'],
    sources: {
      ps: { id: 'pumpkaboo-small' },
      serebii: { id: '710-s' },
      pmd: { id: '0710' },
      psgh: { id: 's22721' },
    },
  },
  pumpkaboolarge: {
    name: ['Pumpkaboo-Large'],
    sources: {
      ps: { id: 'pumpkaboo-large' },
      serebii: { id: '710-l' },
      pmd: { id: '0710' },
      psgh: { id: 's22722' },
    },
  },
  pumpkaboosuper: {
    name: ['Pumpkaboo-Super'],
    sources: {
      ps: { id: 'pumpkaboo-super' },
      serebii: { id: '710-h' },
      pmd: { id: '0710' },
      psgh: { id: 's22723' },
    },
  },
  gourgeist: {
    name: ['Gourgeist'],
    sources: {
      ps: {},
      serebii: { id: '711' },
      pmd: { id: '0711' },
      psgh: { id: 's22752' },
    },
  },
  gourgeistsmall: {
    name: ['Gourgeist-Small'],
    sources: {
      ps: { id: 'gourgeist-small' },
      serebii: { id: '711' },
      pmd: { id: '0711' },
      psgh: { id: 's22753' },
    },
  },
  gourgeistlarge: {
    name: ['Gourgeist-Large'],
    sources: {
      ps: { id: 'gourgeist-large' },
      serebii: { id: '711-l' },
      pmd: { id: '0711' },
      psgh: { id: 's22754' },
    },
  },
  gourgeistsuper: {
    name: ['Gourgeist-Super'],
    sources: {
      ps: { id: 'gourgeist-super' },
      serebii: { id: '711-h' },
      pmd: { id: '0711' },
      psgh: { id: 's22755' },
    },
  },
  bergmite: {
    name: ['Bergmite'],
    sources: {
      ps: {},
      serebii: { id: '712' },
      pmd: { id: '0712' },
      psgh: { id: 's22784' },
    },
  },
  avalugg: {
    name: ['Avalugg'],
    sources: {
      ps: {},
      serebii: { id: '713' },
      pmd: { id: '0713' },
      psgh: { id: 's22816' },
    },
  },
  avalugghisui: {
    name: ['Hisuian Avalugg', 'Avalugg-Hisui', 'Avalugg-H'],
    sources: {
      ps: { id: 'avalugg-hisui' },
      serebii: { id: '713-h' },
      pmd: { id: '0713/0001' },
      psgh: { id: 's22817' },
    },
  },
  noibat: {
    name: ['Noibat'],
    sources: {
      ps: {},
      serebii: { id: '714' },
      pmd: { id: '0714' },
      psgh: { id: 's22848' },
    },
  },
  noivern: {
    name: ['Noivern'],
    sources: {
      ps: {},
      serebii: { id: '715' },
      pmd: { id: '0715' },
      psgh: { id: 's22880' },
    },
  },
  xerneas: {
    name: ['Xerneas'],
    sources: {
      ps: { flip: true },
      serebii: { id: '716-a' },
      pmd: { id: '0716' },
      psgh: { id: 's22912', flip: true },
    },
  },
  xerneasneutral: {
    name: ['Xerneas-Neutral'],
    sources: {
      ps: { id: 'xerneas-neutral', flip: true },
      serebii: { id: '716' },
      pmd: { id: '0716' },
      psgh: { id: 's22912', flip: true },
    },
  },
  yveltal: {
    name: ['Yveltal'],
    sources: {
      ps: {},
      serebii: { id: '717' },
      pmd: { id: '0717' },
      psgh: { id: 's22944' },
    },
  },
  zygarde: {
    name: ['Zygarde'],
    sources: {
      ps: {},
      serebii: { id: '718' },
      pmd: { id: '0718' },
      psgh: { id: 's22976' },
    },
  },
  zygarde10: {
    name: ['Zygarde-10%'],
    sources: {
      ps: { id: 'zygarde-10' },
      serebii: { id: '718-10' },
      pmd: { id: '0718/0001' },
      psgh: { id: 's22977' },
    },
  },
  zygardecomplete: {
    name: ['Zygarde-Complete'],
    sources: {
      ps: { id: 'zygarde-complete' },
      serebii: { id: '718-c' },
      pmd: { id: '0718/0002' },
      psgh: { id: 's22980' },
    },
  },
  zygardemega: {
    name: ['Mega Zygarde', 'Zygarde-Mega'],
    sources: {
      ps: {},
      serebii: { id: '718-c' },
      pmd: { id: '0718/0002' },
      psgh: { id: 's22980' },
    },
  },
  diancie: {
    name: ['Diancie'],
    sources: {
      ps: {},
      serebii: { id: '719' },
      pmd: { id: '0719' },
      psgh: { id: 's23008' },
    },
  },
  dianciemega: {
    name: ['Mega Diancie', 'Diancie-Mega'],
    sources: {
      ps: { id: 'diancie-mega' },
      serebii: { id: '719-m' },
      pmd: { id: '0719/0001' },
      psgh: { id: 's23009' },
    },
  },
  hoopa: {
    name: ['Hoopa'],
    sources: {
      ps: {},
      serebii: { id: '720' },
      pmd: { id: '0720' },
      psgh: { id: 's23040' },
    },
  },
  hoopaunbound: {
    name: ['Hoopa-Unbound'],
    sources: {
      ps: { id: 'hoopa-unbound' },
      serebii: { id: '720-u' },
      pmd: { id: '0720/0001' },
      psgh: { id: 's23041' },
    },
  },
  volcanion: {
    name: ['Volcanion'],
    sources: {
      ps: {},
      serebii: { id: '721' },
      pmd: { id: '0721' },
      psgh: { id: 's23072' },
    },
  },
  rowlet: {
    name: ['Rowlet'],
    sources: {
      ps: {},
      serebii: { id: '722' },
      pmd: { id: '0722' },
      psgh: { id: 's23104' },
    },
  },
  dartrix: {
    name: ['Dartrix'],
    sources: {
      ps: { flip: true },
      serebii: { id: '723' },
      pmd: { id: '0723' },
      psgh: { id: 's23136', flip: true },
    },
  },
  decidueye: {
    name: ['Decidueye'],
    sources: {
      ps: { flip: true },
      serebii: { id: '724' },
      pmd: { id: '0724' },
      psgh: { id: 's23168', flip: true },
    },
  },
  decidueyehisui: {
    name: ['Hisuian Decidueye', 'Decidueye-Hisui', 'Decidueye-H'],
    sources: {
      ps: { id: 'decidueye-hisui' },
      serebii: { id: '724-h' },
      pmd: { id: '0724/0001' },
      psgh: { id: 's23169' },
    },
  },
  litten: {
    name: ['Litten'],
    sources: {
      ps: {},
      serebii: { id: '725' },
      pmd: { id: '0725' },
      psgh: { id: 's23200' },
    },
  },
  torracat: {
    name: ['Torracat'],
    sources: {
      ps: {},
      serebii: { id: '726' },
      pmd: { id: '0726' },
      psgh: { id: 's23232' },
    },
  },
  incineroar: {
    name: ['Incineroar'],
    sources: {
      ps: {},
      serebii: { id: '727' },
      pmd: { id: '0727' },
      psgh: { id: 's23264' },
    },
  },
  popplio: {
    name: ['Popplio'],
    sources: {
      ps: { flip: true },
      serebii: { id: '728' },
      pmd: { id: '0728' },
      psgh: { id: 's23296', flip: true },
    },
  },
  brionne: {
    name: ['Brionne'],
    sources: {
      ps: { flip: true },
      serebii: { id: '729' },
      pmd: { id: '0729' },
      psgh: { id: 's23328', flip: true },
    },
  },
  primarina: {
    name: ['Primarina'],
    sources: {
      ps: {},
      serebii: { id: '730' },
      pmd: { id: '0730' },
      psgh: { id: 's23360' },
    },
  },
  pikipek: {
    name: ['Pikipek'],
    sources: {
      ps: {},
      serebii: { id: '731' },
      pmd: { id: '0731' },
      psgh: { id: 's23392' },
    },
  },
  trumbeak: {
    name: ['Trumbeak'],
    sources: {
      ps: {},
      serebii: { id: '732' },
      pmd: { id: '0732' },
      psgh: { id: 's23424' },
    },
  },
  toucannon: {
    name: ['Toucannon'],
    sources: {
      ps: {},
      serebii: { id: '733' },
      pmd: { id: '0733' },
      psgh: { id: 's23456' },
    },
  },
  yungoos: {
    name: ['Yungoos'],
    sources: {
      ps: {},
      serebii: { id: '734' },
      pmd: { id: '0734' },
      psgh: { id: 's23488' },
    },
  },
  gumshoos: {
    name: ['Gumshoos'],
    sources: {
      ps: { flip: true },
      serebii: { id: '735' },
      pmd: { id: '0735' },
      psgh: { id: 's23520', flip: true },
    },
  },
  grubbin: {
    name: ['Grubbin'],
    sources: {
      ps: {},
      serebii: { id: '736' },
      pmd: { id: '0736' },
      psgh: { id: 's23552' },
    },
  },
  charjabug: {
    name: ['Charjabug'],
    sources: {
      ps: {},
      serebii: { id: '737' },
      pmd: { id: '0737' },
      psgh: { id: 's23584' },
    },
  },
  vikavolt: {
    name: ['Vikavolt'],
    sources: {
      ps: {},
      serebii: { id: '738' },
      pmd: { id: '0738' },
      psgh: { id: 's23616' },
    },
  },
  crabrawler: {
    name: ['Crabrawler'],
    sources: {
      ps: {},
      serebii: { id: '739' },
      pmd: { id: '0739' },
      psgh: { id: 's23648' },
    },
  },
  crabominable: {
    name: ['Crabominable'],
    sources: {
      ps: {},
      serebii: { id: '740' },
      pmd: { id: '0740' },
      psgh: { id: 's23680' },
    },
  },
  crabominablemega: {
    name: ['Mega Crabominable', 'Crabominable-Mega'],
    sources: {
      ps: { id: 'crabominable-mega' },
      serebii: { id: '740' },
      pmd: { id: '0740' },
      psgh: { id: 's23680' },
    },
  },
  oricorio: {
    name: ['Oricorio'],
    sources: {
      ps: {},
      serebii: { id: '741' },
      pmd: { id: '0741' },
      psgh: { id: 's23712' },
    },
  },
  oricoriopompom: {
    name: ['Oricorio-Pom-Pom'],
    sources: {
      ps: { id: 'oricorio-pompom' },
      serebii: { id: '741-p' },
      pmd: { id: '0741/0001' },
      psgh: { id: 's23713' },
    },
  },
  oricoriopau: {
    name: ["Oricorio-Pa'u"],
    sources: {
      ps: { id: 'oricorio-pau' },
      serebii: { id: '741-pau' },
      pmd: { id: '0741/0002' },
      psgh: { id: 's23714' },
    },
  },
  oricoriosensu: {
    name: ['Oricorio-Sensu'],
    sources: {
      ps: { id: 'oricorio-sensu', flip: true },
      serebii: { id: '741-s' },
      pmd: { id: '0741/0003' },
      psgh: { id: 's23715', flip: true },
    },
  },
  cutiefly: {
    name: ['Cutiefly'],
    sources: {
      ps: {},
      serebii: { id: '742' },
      pmd: { id: '0742' },
      psgh: { id: 's23744' },
    },
  },
  ribombee: {
    name: ['Ribombee'],
    sources: {
      ps: {},
      serebii: { id: '743' },
      pmd: { id: '0743' },
      psgh: { id: 's23776' },
    },
  },
  rockruff: {
    name: ['Rockruff'],
    sources: {
      ps: { flip: true },
      serebii: { id: '744' },
      pmd: { id: '0744' },
      psgh: { id: 's23808', flip: true },
    },
  },
  lycanroc: {
    name: ['Lycanroc'],
    sources: {
      ps: {},
      serebii: { id: '745' },
      pmd: { id: '0745' },
      psgh: { id: 's23840' },
    },
  },
  lycanrocmidnight: {
    name: ['Lycanroc-Midnight'],
    sources: {
      ps: { id: 'lycanroc-midnight', flip: true },
      serebii: { id: '745-m' },
      pmd: { id: '0745/0001' },
      psgh: { id: 's23841', flip: true },
    },
  },
  lycanrocdusk: {
    name: ['Lycanroc-Dusk'],
    sources: {
      ps: { id: 'lycanroc-dusk' },
      serebii: { id: '745-d' },
      pmd: { id: '0745/0002' },
      psgh: { id: 's23842' },
    },
  },
  wishiwashi: {
    name: ['Wishiwashi'],
    sources: {
      ps: {},
      serebii: { id: '746' },
      pmd: { id: '0746' },
      psgh: { id: 's23872' },
    },
  },
  wishiwashischool: {
    name: ['Wishiwashi-School'],
    sources: {
      ps: { id: 'wishiwashi-school' },
      serebii: { id: '746-s' },
      pmd: { id: '0746/0001' },
      psgh: { id: 's23873' },
    },
  },
  mareanie: {
    name: ['Mareanie'],
    sources: {
      ps: {},
      serebii: { id: '747' },
      pmd: { id: '0747' },
      psgh: { id: 's23904' },
    },
  },
  toxapex: {
    name: ['Toxapex'],
    sources: {
      ps: {},
      serebii: { id: '748' },
      pmd: { id: '0748' },
      psgh: { id: 's23936' },
    },
  },
  mudbray: {
    name: ['Mudbray'],
    sources: {
      ps: {},
      serebii: { id: '749' },
      pmd: { id: '0749' },
      psgh: { id: 's23968' },
    },
  },
  mudsdale: {
    name: ['Mudsdale'],
    sources: {
      ps: { flip: true },
      serebii: { id: '750' },
      pmd: { id: '0750' },
      psgh: { id: 's24000', flip: true },
    },
  },
  dewpider: {
    name: ['Dewpider'],
    sources: {
      ps: {},
      serebii: { id: '751' },
      pmd: { id: '0751' },
      psgh: { id: 's24032' },
    },
  },
  araquanid: {
    name: ['Araquanid'],
    sources: {
      ps: { flip: true },
      serebii: { id: '752' },
      pmd: { id: '0752' },
      psgh: { id: 's24064', flip: true },
    },
  },
  fomantis: {
    name: ['Fomantis'],
    sources: {
      ps: {},
      serebii: { id: '753' },
      pmd: { id: '0753' },
      psgh: { id: 's24096' },
    },
  },
  lurantis: {
    name: ['Lurantis'],
    sources: {
      ps: {},
      serebii: { id: '754' },
      pmd: { id: '0754' },
      psgh: { id: 's24128' },
    },
  },
  morelull: {
    name: ['Morelull'],
    sources: {
      ps: {},
      serebii: { id: '755' },
      pmd: { id: '0755' },
      psgh: { id: 's24160' },
    },
  },
  shiinotic: {
    name: ['Shiinotic'],
    sources: {
      ps: {},
      serebii: { id: '756' },
      pmd: { id: '0756' },
      psgh: { id: 's24192' },
    },
  },
  salandit: {
    name: ['Salandit'],
    sources: {
      ps: {},
      serebii: { id: '757' },
      pmd: { id: '0757' },
      psgh: { id: 's24224' },
    },
  },
  salazzle: {
    name: ['Salazzle'],
    sources: {
      ps: { flip: true },
      serebii: { id: '758' },
      pmd: { id: '0758' },
      psgh: { id: 's24256', flip: true },
    },
  },
  stufful: {
    name: ['Stufful'],
    sources: {
      ps: {},
      serebii: { id: '759' },
      pmd: { id: '0759' },
      psgh: { id: 's24288' },
    },
  },
  bewear: {
    name: ['Bewear'],
    sources: {
      ps: { flip: true },
      serebii: { id: '760' },
      pmd: { id: '0760' },
      psgh: { id: 's24320', flip: true },
    },
  },
  bounsweet: {
    name: ['Bounsweet'],
    sources: {
      ps: {},
      serebii: { id: '761' },
      pmd: { id: '0761' },
      psgh: { id: 's24352' },
    },
  },
  steenee: {
    name: ['Steenee'],
    sources: {
      ps: {},
      serebii: { id: '762' },
      pmd: { id: '0762' },
      psgh: { id: 's24384' },
    },
  },
  tsareena: {
    name: ['Tsareena'],
    sources: {
      ps: {},
      serebii: { id: '763' },
      pmd: { id: '0763' },
      psgh: { id: 's24416' },
    },
  },
  comfey: {
    name: ['Comfey'],
    sources: {
      ps: {},
      serebii: { id: '764' },
      pmd: { id: '0764' },
      psgh: { id: 's24448' },
    },
  },
  oranguru: {
    name: ['Oranguru'],
    sources: {
      ps: {},
      serebii: { id: '765' },
      pmd: { id: '0765' },
      psgh: { id: 's24480' },
    },
  },
  passimian: {
    name: ['Passimian'],
    sources: {
      ps: {},
      serebii: { id: '766' },
      pmd: { id: '0766' },
      psgh: { id: 's24512' },
    },
  },
  wimpod: {
    name: ['Wimpod'],
    sources: {
      ps: { flip: true },
      serebii: { id: '767' },
      pmd: { id: '0767' },
      psgh: { id: 's24544', flip: true },
    },
  },
  golisopod: {
    name: ['Golisopod'],
    sources: {
      ps: {},
      serebii: { id: '768' },
      pmd: { id: '0768' },
      psgh: { id: 's24576' },
    },
  },
  golisopodmega: {
    name: ['Mega Golisopod', 'Golisopod-Mega'],
    sources: {
      ps: { id: 'golisopod-mega' },
      serebii: { id: '768' },
      pmd: { id: '0768' },
      psgh: { id: 's24576' },
    },
  },
  sandygast: {
    name: ['Sandygast'],
    sources: {
      ps: {},
      serebii: { id: '769' },
      pmd: { id: '0769' },
      psgh: { id: 's24608' },
    },
  },
  palossand: {
    name: ['Palossand'],
    sources: {
      ps: {},
      serebii: { id: '770' },
      pmd: { id: '0770' },
      psgh: { id: 's24640' },
    },
  },
  pyukumuku: {
    name: ['Pyukumuku'],
    sources: {
      ps: {},
      serebii: { id: '771' },
      pmd: { id: '0771' },
      psgh: { id: 's24672' },
    },
  },
  typenull: {
    name: ['Type: Null'],
    sources: {
      ps: { flip: true },
      serebii: { id: '772' },
      pmd: { id: '0772' },
      psgh: { id: 's24704', flip: true },
    },
  },
  silvally: {
    name: ['Silvally'],
    sources: {
      ps: {},
      serebii: { id: '773' },
      pmd: { id: '0773' },
      psgh: { id: 's24736' },
    },
  },
  silvallybug: {
    name: ['Silvally-Bug'],
    sources: {
      ps: { id: 'silvally-bug' },
      serebii: { id: '773-bug' },
      pmd: { id: '0773/0006' },
      psgh: { id: 's24742' },
    },
  },
  silvallydark: {
    name: ['Silvally-Dark'],
    sources: {
      ps: { id: 'silvally-dark' },
      serebii: { id: '773-dark' },
      pmd: { id: '0773/0016' },
      psgh: { id: 's24752' },
    },
  },
  silvallydragon: {
    name: ['Silvally-Dragon'],
    sources: {
      ps: { id: 'silvally-dragon' },
      serebii: { id: '773-dragon' },
      pmd: { id: '0773/0015' },
      psgh: { id: 's24751' },
    },
  },
  silvallyelectric: {
    name: ['Silvally-Electric'],
    sources: {
      ps: { id: 'silvally-electric' },
      serebii: { id: '773-electric' },
      pmd: { id: '0773/0012' },
      psgh: { id: 's24748' },
    },
  },
  silvallyfairy: {
    name: ['Silvally-Fairy'],
    sources: {
      ps: { id: 'silvally-fairy' },
      serebii: { id: '773-fairy' },
      pmd: { id: '0773/0017' },
      psgh: { id: 's24753' },
    },
  },
  silvallyfighting: {
    name: ['Silvally-Fighting'],
    sources: {
      ps: { id: 'silvally-fighting' },
      serebii: { id: '773-fighting' },
      pmd: { id: '0773/0001' },
      psgh: { id: 's24737' },
    },
  },
  silvallyfire: {
    name: ['Silvally-Fire'],
    sources: {
      ps: { id: 'silvally-fire' },
      serebii: { id: '773-fire' },
      pmd: { id: '0773/0009' },
      psgh: { id: 's24745' },
    },
  },
  silvallyflying: {
    name: ['Silvally-Flying'],
    sources: {
      ps: { id: 'silvally-flying' },
      serebii: { id: '773-flying' },
      pmd: { id: '0773/0002' },
      psgh: { id: 's24738' },
    },
  },
  silvallyghost: {
    name: ['Silvally-Ghost'],
    sources: {
      ps: { id: 'silvally-ghost' },
      serebii: { id: '773-ghost' },
      pmd: { id: '0773/0007' },
      psgh: { id: 's24743' },
    },
  },
  silvallygrass: {
    name: ['Silvally-Grass'],
    sources: {
      ps: { id: 'silvally-grass' },
      serebii: { id: '773-grass' },
      pmd: { id: '0773/0011' },
      psgh: { id: 's24747' },
    },
  },
  silvallyground: {
    name: ['Silvally-Ground'],
    sources: {
      ps: { id: 'silvally-ground' },
      serebii: { id: '773-ground' },
      pmd: { id: '0773/0004' },
      psgh: { id: 's24740' },
    },
  },
  silvallyice: {
    name: ['Silvally-Ice'],
    sources: {
      ps: { id: 'silvally-ice' },
      serebii: { id: '773-ice' },
      pmd: { id: '0773/0014' },
      psgh: { id: 's24750' },
    },
  },
  silvallypoison: {
    name: ['Silvally-Poison'],
    sources: {
      ps: { id: 'silvally-poison' },
      serebii: { id: '773-poison' },
      pmd: { id: '0773/0003' },
      psgh: { id: 's24739' },
    },
  },
  silvallypsychic: {
    name: ['Silvally-Psychic'],
    sources: {
      ps: { id: 'silvally-psychic' },
      serebii: { id: '773-psychic' },
      pmd: { id: '0773/0013' },
      psgh: { id: 's24749' },
    },
  },
  silvallyrock: {
    name: ['Silvally-Rock'],
    sources: {
      ps: { id: 'silvally-rock' },
      serebii: { id: '773-rock' },
      pmd: { id: '0773/0005' },
      psgh: { id: 's24741' },
    },
  },
  silvallysteel: {
    name: ['Silvally-Steel'],
    sources: {
      ps: { id: 'silvally-steel' },
      serebii: { id: '773-steel' },
      pmd: { id: '0773/0008' },
      psgh: { id: 's24744' },
    },
  },
  silvallywater: {
    name: ['Silvally-Water'],
    sources: {
      ps: { id: 'silvally-water' },
      serebii: { id: '773-water' },
      pmd: { id: '0773/0010' },
      psgh: { id: 's24746' },
    },
  },
  minior: {
    name: ['Minior'],
    sources: {
      ps: {},
      serebii: { id: '774-b' },
      pmd: { id: '0774' },
      psgh: { id: 's24768' },
    },
  },
  miniormeteor: {
    name: ['Minior-Meteor'],
    sources: {
      ps: { id: 'minior-meteor' },
      serebii: { id: '774' },
      pmd: { id: '0774' },
      psgh: { id: 's24768' },
    },
  },
  komala: {
    name: ['Komala'],
    sources: {
      ps: {},
      serebii: { id: '775' },
      pmd: { id: '0775' },
      psgh: { id: 's24800' },
    },
  },
  turtonator: {
    name: ['Turtonator'],
    sources: {
      ps: {},
      serebii: { id: '776' },
      pmd: { id: '0776' },
      psgh: { id: 's24832' },
    },
  },
  togedemaru: {
    name: ['Togedemaru'],
    sources: {
      ps: {},
      serebii: { id: '777' },
      pmd: { id: '0777' },
      psgh: { id: 's24864' },
    },
  },
  mimikyu: {
    name: ['Mimikyu'],
    sources: {
      ps: {},
      serebii: { id: '778' },
      pmd: { id: '0778' },
      psgh: { id: 's24896' },
    },
  },
  mimikyubusted: {
    name: ['Mimikyu-Busted'],
    sources: {
      ps: { id: 'mimikyu-busted' },
      serebii: { id: '778-b' },
      pmd: { id: '0778/0001' },
      psgh: { id: 's24897' },
    },
  },
  bruxish: {
    name: ['Bruxish'],
    sources: {
      ps: {},
      serebii: { id: '779' },
      pmd: { id: '0779' },
      psgh: { id: 's24928' },
    },
  },
  drampa: {
    name: ['Drampa'],
    sources: {
      ps: {},
      serebii: { id: '780' },
      pmd: { id: '0780' },
      psgh: { id: 's24960' },
    },
  },
  drampamega: {
    name: ['Mega Drampa', 'Drampa-Mega'],
    sources: {
      ps: {},
      serebii: { id: '780' },
      pmd: { id: '0780' },
      psgh: { id: 's24960' },
    },
  },
  dhelmise: {
    name: ['Dhelmise'],
    sources: {
      ps: {},
      serebii: { id: '781' },
      pmd: { id: '0781' },
      psgh: { id: 's24992' },
    },
  },
  jangmoo: {
    name: ['Jangmo-o'],
    sources: {
      ps: {},
      serebii: { id: '782' },
      pmd: { id: '0782' },
      psgh: { id: 's25024' },
    },
  },
  hakamoo: {
    name: ['Hakamo-o'],
    sources: {
      ps: {},
      serebii: { id: '783' },
      pmd: { id: '0783' },
      psgh: { id: 's25056' },
    },
  },
  kommoo: {
    name: ['Kommo-o'],
    sources: {
      ps: {},
      serebii: { id: '784' },
      pmd: { id: '0784' },
      psgh: { id: 's25088' },
    },
  },
  tapukoko: {
    name: ['Tapu Koko'],
    sources: {
      ps: { flip: true },
      serebii: { id: '785' },
      pmd: { id: '0785' },
      psgh: { id: 's25120', flip: true },
    },
  },
  tapulele: {
    name: ['Tapu Lele'],
    sources: {
      ps: {},
      serebii: { id: '786' },
      pmd: { id: '0786' },
      psgh: { id: 's25152' },
    },
  },
  tapubulu: {
    name: ['Tapu Bulu'],
    sources: {
      ps: {},
      serebii: { id: '787' },
      pmd: { id: '0787' },
      psgh: { id: 's25184' },
    },
  },
  tapufini: {
    name: ['Tapu Fini'],
    sources: {
      ps: { flip: true },
      serebii: { id: '788' },
      pmd: { id: '0788' },
      psgh: { id: 's25216', flip: true },
    },
  },
  cosmog: {
    name: ['Cosmog'],
    sources: {
      ps: { flip: true },
      serebii: { id: '789' },
      pmd: { id: '0789' },
      psgh: { id: 's25248', flip: true },
    },
  },
  cosmoem: {
    name: ['Cosmoem'],
    sources: {
      ps: {},
      serebii: { id: '790' },
      pmd: { id: '0790' },
      psgh: { id: 's25280' },
    },
  },
  solgaleo: {
    name: ['Solgaleo'],
    sources: {
      ps: { flip: true },
      serebii: { id: '791' },
      pmd: { id: '0791' },
      psgh: { id: 's25312', flip: true },
    },
  },
  lunala: {
    name: ['Lunala'],
    sources: {
      ps: {},
      serebii: { id: '792' },
      pmd: { id: '0792' },
      psgh: { id: 's25344' },
    },
  },
  nihilego: {
    name: ['Nihilego'],
    sources: {
      ps: {},
      serebii: { id: '793' },
      pmd: { id: '0793' },
      psgh: { id: 's25376' },
    },
  },
  buzzwole: {
    name: ['Buzzwole'],
    sources: {
      ps: {},
      serebii: { id: '794' },
      pmd: { id: '0794' },
      psgh: { id: 's25408' },
    },
  },
  pheromosa: {
    name: ['Pheromosa'],
    sources: {
      ps: {},
      serebii: { id: '795' },
      pmd: { id: '0795' },
      psgh: { id: 's25440' },
    },
  },
  xurkitree: {
    name: ['Xurkitree'],
    sources: {
      ps: {},
      serebii: { id: '796' },
      pmd: { id: '0796' },
      psgh: { id: 's25472' },
    },
  },
  celesteela: {
    name: ['Celesteela'],
    sources: {
      ps: { flip: true },
      serebii: { id: '797' },
      pmd: { id: '0797' },
      psgh: { id: 's25504', flip: true },
    },
  },
  kartana: {
    name: ['Kartana'],
    sources: {
      ps: { flip: true },
      serebii: { id: '798' },
      pmd: { id: '0798' },
      psgh: { id: 's25536', flip: true },
    },
  },
  guzzlord: {
    name: ['Guzzlord'],
    sources: {
      ps: {},
      serebii: { id: '799' },
      pmd: { id: '0799' },
      psgh: { id: 's25568' },
    },
  },
  necrozma: {
    name: ['Necrozma'],
    sources: {
      ps: {},
      serebii: { id: '800' },
      pmd: { id: '0800' },
      psgh: { id: 's25600' },
    },
  },
  necrozmaduskmane: {
    name: ['Necrozma-Dusk-Mane'],
    sources: {
      ps: { id: 'necrozma-duskmane' },
      serebii: { id: '800-dm' },
      pmd: { id: '0800/0001' },
      psgh: { id: 's25601' },
    },
  },
  necrozmadawnwings: {
    name: ['Necrozma-Dawn-Wings'],
    sources: {
      ps: { id: 'necrozma-dawnwings', flip: true },
      serebii: { id: '800-dw' },
      pmd: { id: '0800/0002' },
      psgh: { id: 's25602', flip: true },
    },
  },
  necrozmaultra: {
    name: ['Necrozma-Ultra'],
    sources: {
      ps: { id: 'necrozma-ultra', flip: true },
      serebii: { id: '800-u' },
      pmd: { id: '0800/0003' },
      psgh: { id: 's25603', flip: true },
    },
  },
  magearna: {
    name: ['Magearna'],
    sources: {
      ps: {},
      serebii: { id: '801' },
      pmd: { id: '0801' },
      psgh: { id: 's25632' },
    },
  },
  magearnaoriginal: {
    name: ['Magearna-Original'],
    sources: {
      ps: { id: 'magearna-original' },
      serebii: { id: '801-o' },
      pmd: { id: '0801/0001' },
      psgh: { id: 's25633' },
    },
  },
  magearnamega: {
    name: ['Mega Magearna', 'Magearna-Mega'],
    sources: {
      ps: { id: 'magearna-mega' },
      serebii: { id: '801' },
      pmd: { id: '0801' },
      psgh: { id: 's25632' },
    },
  },
  magearnaoriginalmega: {
    name: ['Mega Magearna-Original', 'Magearna-Original-Mega'],
    sources: {
      ps: { id: 'magearna-original-mega' },
      serebii: { id: '801-o' },
      pmd: { id: '0801/0001' },
      psgh: { id: 's25633' },
    },
  },
  marshadow: {
    name: ['Marshadow'],
    sources: {
      ps: {},
      serebii: { id: '802' },
      pmd: { id: '0802' },
      psgh: { id: 's25664' },
    },
  },
  poipole: {
    name: ['Poipole'],
    sources: {
      ps: {},
      serebii: { id: '803' },
      pmd: { id: '0803' },
      psgh: { id: 's25696' },
    },
  },
  naganadel: {
    name: ['Naganadel'],
    sources: {
      ps: {},
      serebii: { id: '804' },
      pmd: { id: '0804' },
      psgh: { id: 's25728' },
    },
  },
  stakataka: {
    name: ['Stakataka'],
    sources: {
      ps: {},
      serebii: { id: '805' },
      pmd: { id: '0805' },
      psgh: { id: 's25760' },
    },
  },
  blacephalon: {
    name: ['Blacephalon'],
    sources: {
      ps: {},
      serebii: { id: '806' },
      pmd: { id: '0806' },
      psgh: { id: 's25792' },
    },
  },
  zeraora: {
    name: ['Zeraora'],
    sources: {
      ps: {},
      serebii: { id: '807' },
      pmd: { id: '0807' },
      psgh: { id: 's25824' },
    },
  },
  zeraoramega: {
    name: ['Mega Zeraora', 'Zeraora-Mega'],
    sources: {
      ps: { id: 'zeraora-mega' },
      serebii: { id: '807' },
      pmd: { id: '0807' },
      psgh: { id: 's25824' },
    },
  },
  meltan: {
    name: ['Meltan'],
    sources: {
      ps: { flip: true },
      serebii: { id: '808' },
      pmd: { id: '0808' },
      psgh: { id: 's25856', flip: true },
    },
  },
  melmetal: {
    name: ['Melmetal'],
    sources: {
      ps: {},
      serebii: { id: '809' },
      pmd: { id: '0809' },
      psgh: { id: 's25888' },
    },
  },
  melmetalgmax: {
    name: ['Melmetal-Gmax'],
    sources: {
      ps: { id: 'melmetal-gmax' },
      serebii: { id: '809-gi' },
      pmd: { id: '0809' },
      psgh: { id: 's25888-g' },
    },
  },
  grookey: {
    name: ['Grookey'],
    sources: {
      ps: { flip: true },
      serebii: { id: '810' },
      pmd: { id: '0810' },
      psgh: { id: 's25920', flip: true },
    },
  },
  thwackey: {
    name: ['Thwackey'],
    sources: {
      ps: {},
      serebii: { id: '811' },
      pmd: { id: '0811' },
      psgh: { id: 's25952' },
    },
  },
  rillaboom: {
    name: ['Rillaboom'],
    sources: {
      ps: {},
      serebii: { id: '812' },
      pmd: { id: '0812' },
      psgh: { id: 's25984' },
    },
  },
  rillaboomgmax: {
    name: ['Rillaboom-Gmax'],
    sources: {
      ps: { id: 'rillaboom-gmax' },
      serebii: { id: '812-gi' },
      pmd: { id: '0812' },
      psgh: { id: 's25984-g' },
    },
  },
  scorbunny: {
    name: ['Scorbunny'],
    sources: {
      ps: {},
      serebii: { id: '813' },
      pmd: { id: '0813' },
      psgh: { id: 's26016' },
    },
  },
  raboot: {
    name: ['Raboot'],
    sources: {
      ps: { flip: true },
      serebii: { id: '814' },
      pmd: { id: '0814' },
      psgh: { id: 's26048', flip: true },
    },
  },
  cinderace: {
    name: ['Cinderace'],
    sources: {
      ps: { flip: true },
      serebii: { id: '815' },
      pmd: { id: '0815' },
      psgh: { id: 's26080', flip: true },
    },
  },
  cinderacegmax: {
    name: ['Cinderace-Gmax'],
    sources: {
      ps: { id: 'cinderace-gmax' },
      serebii: { id: '815-gi' },
      pmd: { id: '0815' },
      psgh: { id: 's26080-g' },
    },
  },
  sobble: {
    name: ['Sobble'],
    sources: {
      ps: {},
      serebii: { id: '816' },
      pmd: { id: '0816' },
      psgh: { id: 's26112' },
    },
  },
  drizzile: {
    name: ['Drizzile'],
    sources: {
      ps: {},
      serebii: { id: '817' },
      pmd: { id: '0817' },
      psgh: { id: 's26144' },
    },
  },
  inteleon: {
    name: ['Inteleon'],
    sources: {
      ps: {},
      serebii: { id: '818' },
      pmd: { id: '0818' },
      psgh: { id: 's26176' },
    },
  },
  inteleongmax: {
    name: ['Inteleon-Gmax'],
    sources: {
      ps: { id: 'inteleon-gmax' },
      serebii: { id: '818-gi' },
      pmd: { id: '0818' },
      psgh: { id: 's26176-g' },
    },
  },
  skwovet: {
    name: ['Skwovet'],
    sources: {
      ps: { flip: true },
      serebii: { id: '819' },
      pmd: { id: '0819' },
      psgh: { id: 's26208', flip: true },
    },
  },
  greedent: {
    name: ['Greedent'],
    sources: {
      ps: { flip: true },
      serebii: { id: '820' },
      pmd: { id: '0820' },
      psgh: { id: 's26240', flip: true },
    },
  },
  rookidee: {
    name: ['Rookidee'],
    sources: {
      ps: { flip: true },
      serebii: { id: '821' },
      pmd: { id: '0821' },
      psgh: { id: 's26272', flip: true },
    },
  },
  corvisquire: {
    name: ['Corvisquire'],
    sources: {
      ps: {},
      serebii: { id: '822' },
      pmd: { id: '0822' },
      psgh: { id: 's26304' },
    },
  },
  corviknight: {
    name: ['Corviknight'],
    sources: {
      ps: { flip: true },
      serebii: { id: '823' },
      pmd: { id: '0823' },
      psgh: { id: 's26336', flip: true },
    },
  },
  corviknightgmax: {
    name: ['Corviknight-Gmax'],
    sources: {
      ps: { id: 'corviknight-gmax' },
      serebii: { id: '823-gi' },
      pmd: { id: '0823' },
      psgh: { id: 's26336-g' },
    },
  },
  blipbug: {
    name: ['Blipbug'],
    sources: {
      ps: {},
      serebii: { id: '824' },
      pmd: { id: '0824' },
      psgh: { id: 's26368' },
    },
  },
  dottler: {
    name: ['Dottler'],
    sources: {
      ps: { flip: true },
      serebii: { id: '825' },
      pmd: { id: '0825' },
      psgh: { id: 's26400', flip: true },
    },
  },
  orbeetle: {
    name: ['Orbeetle'],
    sources: {
      ps: {},
      serebii: { id: '826' },
      pmd: { id: '0826' },
      psgh: { id: 's26432' },
    },
  },
  orbeetlegmax: {
    name: ['Orbeetle-Gmax'],
    sources: {
      ps: { id: 'orbeetle-gmax' },
      serebii: { id: '826-gi' },
      pmd: { id: '0826' },
      psgh: { id: 's26432-g' },
    },
  },
  orbeetlemega: {
    name: ['Orbeetle-Gmax'],
    sources: {
      ps: { id: 'orbeetle-gmax' },
      serebii: { id: '826-gi' },
      pmd: { id: '0826' },
      psgh: { id: 's26432-g' },
    },
  },
  nickit: {
    name: ['Nickit'],
    sources: {
      ps: {},
      serebii: { id: '827' },
      pmd: { id: '0827' },
      psgh: { id: 's26464' },
    },
  },
  thievul: {
    name: ['Thievul'],
    sources: {
      ps: {},
      serebii: { id: '828' },
      pmd: { id: '0828' },
      psgh: { id: 's26496' },
    },
  },
  gossifleur: {
    name: ['Gossifleur'],
    sources: {
      ps: {},
      serebii: { id: '829' },
      pmd: { id: '0829' },
      psgh: { id: 's26528' },
    },
  },
  eldegoss: {
    name: ['Eldegoss'],
    sources: {
      ps: {},
      serebii: { id: '830' },
      pmd: { id: '0830' },
      psgh: { id: 's26560' },
    },
  },
  wooloo: {
    name: ['Wooloo'],
    sources: {
      ps: { flip: true },
      serebii: { id: '831' },
      pmd: { id: '0831' },
      psgh: { id: 's26592', flip: true },
    },
  },
  dubwool: {
    name: ['Dubwool'],
    sources: {
      ps: { flip: true },
      serebii: { id: '832' },
      pmd: { id: '0832' },
      psgh: { id: 's26624', flip: true },
    },
  },
  chewtle: {
    name: ['Chewtle'],
    sources: {
      ps: {},
      serebii: { id: '833' },
      pmd: { id: '0833' },
      psgh: { id: 's26656' },
    },
  },
  drednaw: {
    name: ['Drednaw'],
    sources: {
      ps: {},
      serebii: { id: '834' },
      pmd: { id: '0834' },
      psgh: { id: 's26688' },
    },
  },
  drednawgmax: {
    name: ['Drednaw-Gmax'],
    sources: {
      ps: { id: 'drednaw-gmax' },
      serebii: { id: '834-gi' },
      pmd: { id: '0834' },
      psgh: { id: 's26688-g' },
    },
  },
  drednawmega: {
    name: ['Mega Drednaw', 'Drednaw-Mega'],
    sources: {
      ps: { id: 'drednaw-gmax' },
      serebii: { id: '834-gi' },
      pmd: { id: '0834' },
      psgh: { id: 's26688-g' },
    },
  },
  yamper: {
    name: ['Yamper'],
    sources: {
      ps: { flip: true },
      serebii: { id: '835' },
      pmd: { id: '0835' },
      psgh: { id: 's26720', flip: true },
    },
  },
  boltund: {
    name: ['Boltund'],
    sources: {
      ps: {},
      serebii: { id: '836' },
      pmd: { id: '0836' },
      psgh: { id: 's26752' },
    },
  },
  rolycoly: {
    name: ['Rolycoly'],
    sources: {
      ps: {},
      serebii: { id: '837' },
      pmd: { id: '0837' },
      psgh: { id: 's26784' },
    },
  },
  carkol: {
    name: ['Carkol'],
    sources: {
      ps: { flip: true },
      serebii: { id: '838' },
      pmd: { id: '0838' },
      psgh: { id: 's26816', flip: true },
    },
  },
  coalossal: {
    name: ['Coalossal'],
    sources: {
      ps: {},
      serebii: { id: '839' },
      pmd: { id: '0839' },
      psgh: { id: 's26848' },
    },
  },
  coalossalgmax: {
    name: ['Coalossal-Gmax'],
    sources: {
      ps: { id: 'coalossal-gmax' },
      serebii: { id: '839-gi' },
      pmd: { id: '0839' },
      psgh: { id: 's26848-g' },
    },
  },
  coalossalmega: {
    name: ['Mega Coalossal', 'Coalossal-Mega'],
    sources: {
      ps: { id: 'coalossal-gmax' },
      serebii: { id: '839-gi' },
      pmd: { id: '0839' },
      psgh: { id: 's26848-g' },
    },
  },
  applin: {
    name: ['Applin'],
    sources: {
      ps: {},
      serebii: { id: '840' },
      pmd: { id: '0840' },
      psgh: { id: 's26880' },
    },
  },
  flapple: {
    name: ['Flapple'],
    sources: {
      ps: {},
      serebii: { id: '841' },
      pmd: { id: '0841' },
      psgh: { id: 's26912' },
    },
  },
  flapplegmax: {
    name: ['Flapple-Gmax'],
    sources: {
      ps: { id: 'flapple-gmax' },
      serebii: { id: '841-gi' },
      pmd: { id: '0841' },
      psgh: { id: 's26912-g' },
    },
  },
  flapplemega: {
    name: ['Mega Flapple', 'Flapple-Mega'],
    sources: {
      ps: { id: 'flapple-gmax' },
      serebii: { id: '841-gi' },
      pmd: { id: '0841' },
      psgh: { id: 's26912-g' },
    },
  },
  appletun: {
    name: ['Appletun'],
    sources: {
      ps: {},
      serebii: { id: '842' },
      pmd: { id: '0842' },
      psgh: { id: 's26944' },
    },
  },
  appletungmax: {
    name: ['Appletun-Gmax'],
    sources: {
      ps: { id: 'appletun-gmax' },
      serebii: { id: '842-gi' },
      pmd: { id: '0842' },
      psgh: { id: 's26944-g' },
    },
  },
  appletunmega: {
    name: ['Mega Appletun', 'Appletun-Mega'],
    sources: {
      ps: { id: 'appletun-gmax' },
      serebii: { id: '842-gi' },
      pmd: { id: '0842' },
      psgh: { id: 's26944-g' },
    },
  },
  silicobra: {
    name: ['Silicobra'],
    sources: {
      ps: {},
      serebii: { id: '843' },
      pmd: { id: '0843' },
      psgh: { id: 's26976' },
    },
  },
  sandaconda: {
    name: ['Sandaconda'],
    sources: {
      ps: { flip: true },
      serebii: { id: '844' },
      pmd: { id: '0844' },
      psgh: { id: 's27008', flip: true },
    },
  },
  sandacondagmax: {
    name: ['Sandaconda-Gmax'],
    sources: {
      ps: { id: 'sandaconda-gmax', flip: true },
      serebii: { id: '844-gi' },
      pmd: { id: '0844' },
      psgh: { id: 's27008-g', flip: true },
    },
  },
  sandacondamega: {
    name: ['Mega Sandaconda', 'Sandaconda-Mega'],
    sources: {
      ps: { id: 'sandaconda-gmax', flip: true },
      serebii: { id: '844-gi' },
      pmd: { id: '0844' },
      psgh: { id: 's27008-g', flip: true },
    },
  },
  cramorant: {
    name: ['Cramorant'],
    sources: {
      ps: {},
      serebii: { id: '845' },
      pmd: { id: '0845' },
      psgh: { id: 's27040' },
    },
  },
  arrokuda: {
    name: ['Arrokuda'],
    sources: {
      ps: {},
      serebii: { id: '846' },
      pmd: { id: '0846' },
      psgh: { id: 's27072' },
    },
  },
  barraskewda: {
    name: ['Barraskewda'],
    sources: {
      ps: {},
      serebii: { id: '847' },
      pmd: { id: '0847' },
      psgh: { id: 's27104' },
    },
  },
  toxel: {
    name: ['Toxel'],
    sources: {
      ps: {},
      serebii: { id: '848' },
      pmd: { id: '0848' },
      psgh: { id: 's27136' },
    },
  },
  toxtricity: {
    name: ['Toxtricity'],
    sources: {
      ps: {},
      serebii: { id: '849' },
      pmd: { id: '0849' },
      psgh: { id: 's27168' },
    },
  },
  toxtricitylowkey: {
    name: ['Toxtricity-Low-Key'],
    sources: {
      ps: { id: 'toxtricity-lowkey', flip: true },
      serebii: { id: '849-l' },
      pmd: { id: '0849/0001' },
      psgh: { id: 's27169', flip: true },
    },
  },
  toxtricitygmax: {
    name: ['Toxtricity-Gmax'],
    sources: {
      ps: { id: 'toxtricity-gmax' },
      serebii: { id: '849-gi' },
      pmd: { id: '0849' },
      psgh: { id: 's27168-g' },
    },
  },
  toxtricitymega: {
    name: ['Mega Toxtricity', 'Toxtricity-Mega'],
    sources: {
      ps: { id: 'toxtricity-gmax' },
      serebii: { id: '849-gi' },
      pmd: { id: '0849' },
      psgh: { id: 's27168-g' },
    },
  },
  toxtricitylowkeygmax: {
    name: ['Toxtricity-Low-Key-Gmax'],
    sources: {
      ps: { id: 'toxtricity-gmax' },
      serebii: { id: '849-gi' },
      pmd: { id: '0849' },
      psgh: { id: 's27168-g' },
    },
  },
  toxtricitylowkeymega: {
    name: ['Mega Toxtricity-Low-Key', 'Toxtricity-Low-Key-Mega'],
    sources: {
      ps: { id: 'toxtricity-gmax' },
      serebii: { id: '849-gi' },
      pmd: { id: '0849' },
      psgh: { id: 's27168-g' },
    },
  },
  sizzlipede: {
    name: ['Sizzlipede'],
    sources: {
      ps: { flip: true },
      serebii: { id: '850' },
      pmd: { id: '0850' },
      psgh: { id: 's27200', flip: true },
    },
  },
  centiskorch: {
    name: ['Centiskorch'],
    sources: {
      ps: {},
      serebii: { id: '851' },
      pmd: { id: '0851' },
      psgh: { id: 's27232' },
    },
  },
  centiskorchgmax: {
    name: ['Centiskorch-Gmax'],
    sources: {
      ps: { id: 'centiskorch-gmax' },
      serebii: { id: '851-gi' },
      pmd: { id: '0851' },
      psgh: { id: 's27232-g' },
    },
  },
  centiskorchmega: {
    name: ['Mega Centiskorch', 'Centiskorch-Mega'],
    sources: {
      ps: { id: 'centiskorch-gmax' },
      serebii: { id: '851-gi' },
      pmd: { id: '0851' },
      psgh: { id: 's27232-g' },
    },
  },
  clobbopus: {
    name: ['Clobbopus'],
    sources: {
      ps: {},
      serebii: { id: '852' },
      pmd: { id: '0852' },
      psgh: { id: 's27264' },
    },
  },
  grapploct: {
    name: ['Grapploct'],
    sources: {
      ps: {},
      serebii: { id: '853' },
      pmd: { id: '0853' },
      psgh: { id: 's27296' },
    },
  },
  sinistea: {
    name: ['Sinistea'],
    sources: {
      ps: { flip: true },
      serebii: { id: '854' },
      pmd: { id: '0854' },
      psgh: { id: 's27328', flip: true },
    },
  },
  polteageist: {
    name: ['Polteageist'],
    sources: {
      ps: {},
      serebii: { id: '855' },
      pmd: { id: '0855' },
      psgh: { id: 's27360' },
    },
  },
  hatenna: {
    name: ['Hatenna'],
    sources: {
      ps: {},
      serebii: { id: '856' },
      pmd: { id: '0856' },
      psgh: { id: 's27392' },
    },
  },
  hattrem: {
    name: ['Hattrem'],
    sources: {
      ps: {},
      serebii: { id: '857' },
      pmd: { id: '0857' },
      psgh: { id: 's27424' },
    },
  },
  hatterene: {
    name: ['Hatterene'],
    sources: {
      ps: {},
      serebii: { id: '858' },
      pmd: { id: '0858' },
      psgh: { id: 's27456' },
    },
  },
  hatterenegmax: {
    name: ['Hatterene-Gmax'],
    sources: {
      ps: { id: 'hatterene-gmax', flip: true },
      serebii: { id: '858-gi' },
      pmd: { id: '0858' },
      psgh: { id: 's27456-g', flip: true },
    },
  },
  impidimp: {
    name: ['Impidimp'],
    sources: {
      ps: {},
      serebii: { id: '859' },
      pmd: { id: '0859' },
      psgh: { id: 's27488' },
    },
  },
  morgrem: {
    name: ['Morgrem'],
    sources: {
      ps: {},
      serebii: { id: '860' },
      pmd: { id: '0860' },
      psgh: { id: 's27520' },
    },
  },
  grimmsnarl: {
    name: ['Grimmsnarl'],
    sources: {
      ps: {},
      serebii: { id: '861' },
      pmd: { id: '0861' },
      psgh: { id: 's27552' },
    },
  },
  grimmsnarlgmax: {
    name: ['Grimmsnarl-Gmax'],
    sources: {
      ps: { id: 'grimmsnarl-gmax' },
      serebii: { id: '861-gi' },
      pmd: { id: '0861' },
      psgh: { id: 's27552-g' },
    },
  },
  obstagoon: {
    name: ['Obstagoon'],
    sources: {
      ps: { flip: true },
      serebii: { id: '862' },
      pmd: { id: '0862' },
      psgh: { id: 's27584', flip: true },
    },
  },
  perrserker: {
    name: ['Perrserker'],
    sources: {
      ps: { flip: true },
      serebii: { id: '863' },
      pmd: { id: '0863' },
      psgh: { id: 's27616', flip: true },
    },
  },
  cursola: {
    name: ['Cursola'],
    sources: {
      ps: { flip: true },
      serebii: { id: '864' },
      pmd: { id: '0864' },
      psgh: { id: 's27648', flip: true },
    },
  },
  sirfetchd: {
    name: ['Sirfetch’d'],
    sources: {
      ps: {},
      serebii: { id: '865' },
      pmd: { id: '0865' },
      psgh: { id: 's27680' },
    },
  },
  mrrime: {
    name: ['Mr. Rime'],
    sources: {
      ps: { flip: true },
      serebii: { id: '866' },
      pmd: { id: '0866' },
      psgh: { id: 's27712', flip: true },
    },
  },
  runerigus: {
    name: ['Runerigus'],
    sources: {
      ps: {},
      serebii: { id: '867' },
      pmd: { id: '0867' },
      psgh: { id: 's27744' },
    },
  },
  milcery: {
    name: ['Milcery'],
    sources: {
      ps: {},
      serebii: { id: '868' },
      pmd: { id: '0868' },
      psgh: { id: 's27776' },
    },
  },
  alcremie: {
    name: ['Alcremie'],
    sources: {
      ps: { flip: true },
      serebii: { id: '869' },
      pmd: { id: '0869' },
      psgh: { id: 's27808', flip: true },
    },
  },
  alcremiegmax: {
    name: ['Alcremie-Gmax'],
    sources: {
      ps: { id: 'alcremie-gmax' },
      serebii: { id: '869-gi' },
      pmd: { id: '0869' },
      psgh: { id: 's27808-g' },
    },
  },
  alcremiemega: {
    name: ['Mega Alcremie', 'Alcremie-Mega'],
    sources: {
      ps: { id: 'alcremie-gmax' },
      serebii: { id: '869-gi' },
      pmd: { id: '0869' },
      psgh: { id: 's27808-g' },
    },
  },
  falinks: {
    name: ['Falinks'],
    sources: {
      ps: {},
      serebii: { id: '870' },
      pmd: { id: '0870' },
      psgh: { id: 's27840' },
    },
  },
  falinksmega: {
    name: ['Mega Falinks', 'Falinks-Mega'],
    sources: {
      ps: {},
      serebii: { id: '870' },
      pmd: { id: '0870' },
      psgh: { id: 's27840' },
    },
  },
  pincurchin: {
    name: ['Pincurchin'],
    sources: {
      ps: {},
      serebii: { id: '871' },
      pmd: { id: '0871' },
      psgh: { id: 's27872' },
    },
  },
  snom: {
    name: ['Snom'],
    sources: {
      ps: { flip: true },
      serebii: { id: '872' },
      pmd: { id: '0872' },
      psgh: { id: 's27904', flip: true },
    },
  },
  frosmoth: {
    name: ['Frosmoth'],
    sources: {
      ps: { flip: true },
      serebii: { id: '873' },
      pmd: { id: '0873' },
      psgh: { id: 's27936', flip: true },
    },
  },
  stonjourner: {
    name: ['Stonjourner'],
    sources: {
      ps: {},
      serebii: { id: '874' },
      pmd: { id: '0874' },
      psgh: { id: 's27968' },
    },
  },
  eiscue: {
    name: ['Eiscue'],
    sources: {
      ps: {},
      serebii: { id: '875' },
      pmd: { id: '0875' },
      psgh: { id: 's28000' },
    },
  },
  eiscuenoice: {
    name: ['Eiscue-Noice'],
    sources: {
      ps: { id: 'eiscue-noice' },
      serebii: { id: '875-n' },
      pmd: { id: '0875/0001' },
      psgh: { id: 's28001' },
    },
  },
  indeedee: {
    name: ['Indeedee'],
    sources: {
      ps: { flip: true },
      serebii: { id: '876' },
      pmd: { id: '0876' },
      psgh: { id: 's28032', flip: true },
    },
  },
  indeedeef: {
    name: ['Indeedee-Female', 'Indeedee-F'],
    sources: {
      ps: { id: 'indeedee-f' },
      serebii: { id: '876-f' },
      pmd: { id: '0876/0000/0000/0002' },
      psgh: { id: 's28033' },
    },
  },
  morpeko: {
    name: ['Morpeko'],
    sources: {
      ps: {},
      serebii: { id: '877' },
      pmd: { id: '0877' },
      psgh: { id: 's28064' },
    },
  },
  morpekohangry: {
    name: ['Morpeko-Hangry'],
    sources: {
      ps: { id: 'morpeko-hangry' },
      serebii: { id: '877-h' },
      pmd: { id: '0877/0001' },
      psgh: { id: 's28065' },
    },
  },
  cufant: {
    name: ['Cufant'],
    sources: {
      ps: { flip: true },
      serebii: { id: '878' },
      pmd: { id: '0878' },
      psgh: { id: 's28096', flip: true },
    },
  },
  copperajah: {
    name: ['Copperajah'],
    sources: {
      ps: {},
      serebii: { id: '879' },
      pmd: { id: '0879' },
      psgh: { id: 's28128' },
    },
  },
  copperajahgmax: {
    name: ['Copperajah-Gmax'],
    sources: {
      ps: { id: 'copperajah-gmax' },
      serebii: { id: '879-gi' },
      pmd: { id: '0879' },
      psgh: { id: 's28128-g' },
    },
  },
  copperajahmega: {
    name: ['Mega Copperajah', 'Copperajah-Mega'],
    sources: {
      ps: { id: 'copperajah-gmax' },
      serebii: { id: '879-gi' },
      pmd: { id: '0879' },
      psgh: { id: 's28128-g' },
    },
  },
  dracozolt: {
    name: ['Dracozolt'],
    sources: {
      ps: {},
      serebii: { id: '880' },
      pmd: { id: '0880' },
      psgh: { id: 's28160' },
    },
  },
  arctozolt: {
    name: ['Arctozolt'],
    sources: {
      ps: {},
      serebii: { id: '881' },
      pmd: { id: '0881' },
      psgh: { id: 's28192' },
    },
  },
  dracovish: {
    name: ['Dracovish'],
    sources: {
      ps: {},
      serebii: { id: '882' },
      pmd: { id: '0882' },
      psgh: { id: 's28224' },
    },
  },
  arctovish: {
    name: ['Arctovish'],
    sources: {
      ps: {},
      serebii: { id: '883' },
      pmd: { id: '0883' },
      psgh: { id: 's28256' },
    },
  },
  duraludon: {
    name: ['Duraludon'],
    sources: {
      ps: {},
      serebii: { id: '884' },
      pmd: { id: '0884' },
      psgh: { id: 's28288' },
    },
  },
  duraludongmax: {
    name: ['Duraludon-Gmax'],
    sources: {
      ps: { id: 'duraludon-gmax', flip: true },
      serebii: { id: '884-gi' },
      pmd: { id: '0884' },
      psgh: { id: 's28288-g', flip: true },
    },
  },
  duraludonmega: {
    name: ['Mega Duraludon', 'Duraludon-Mega'],
    sources: {
      ps: { id: 'duraludon-gmax', flip: true },
      serebii: { id: '884-gi' },
      pmd: { id: '0884' },
      psgh: { id: 's28288-g', flip: true },
    },
  },
  dreepy: {
    name: ['Dreepy'],
    sources: {
      ps: {},
      serebii: { id: '885' },
      pmd: { id: '0885' },
      psgh: { id: 's28320' },
    },
  },
  drakloak: {
    name: ['Drakloak'],
    sources: {
      ps: {},
      serebii: { id: '886' },
      pmd: { id: '0886' },
      psgh: { id: 's28352' },
    },
  },
  dragapult: {
    name: ['Dragapult'],
    sources: {
      ps: {},
      serebii: { id: '887' },
      pmd: { id: '0887' },
      psgh: { id: 's28384' },
    },
  },
  zacian: {
    name: ['Zacian'],
    sources: {
      ps: { flip: true },
      serebii: { id: '888' },
      pmd: { id: '0888' },
      psgh: { id: 's28416', flip: true },
    },
  },
  zaciancrowned: {
    name: ['Zacian-Crowned'],
    sources: {
      ps: { id: 'zacian-crowned', flip: true },
      serebii: { id: '888-c' },
      pmd: { id: '0888/0001' },
      psgh: { id: 's28417', flip: true },
    },
  },
  zamazenta: {
    name: ['Zamazenta'],
    sources: {
      ps: {},
      serebii: { id: '889' },
      pmd: { id: '0889' },
      psgh: { id: 's28448' },
    },
  },
  zamazentacrowned: {
    name: ['Zamazenta-Crowned'],
    sources: {
      ps: { id: 'zamazenta-crowned' },
      serebii: { id: '889-c' },
      pmd: { id: '0889/0001' },
      psgh: { id: 's28449' },
    },
  },
  eternatus: {
    name: ['Eternatus'],
    sources: {
      ps: {},
      serebii: { id: '890' },
      pmd: { id: '0890' },
      psgh: { id: 's28480' },
    },
  },
  eternatuseternamax: {
    name: ['Eternatus-Eternamax'],
    sources: {
      ps: { id: 'eternatus-eternamax' },
      serebii: { id: '890-e' },
      pmd: { id: '0890/0001' },
      psgh: { id: 's28481' },
    },
  },
  kubfu: {
    name: ['Kubfu'],
    sources: {
      ps: {},
      serebii: { id: '891' },
      pmd: { id: '0891' },
      psgh: { id: 's28512' },
    },
  },
  urshifu: {
    name: ['Urshifu'],
    sources: {
      ps: {},
      serebii: { id: '892' },
      pmd: { id: '0892' },
      psgh: { id: 's28544' },
    },
  },
  urshifurapidstrike: {
    name: ['Urshifu-Rapid-Strike'],
    sources: {
      ps: { id: 'urshifu-rapidstrike', flip: true },
      serebii: { id: '892-r' },
      pmd: { id: '0892/0001' },
      psgh: { id: 's28545', flip: true },
    },
  },
  urshifugmax: {
    name: ['Urshifu-Gmax'],
    sources: {
      ps: { id: 'urshifu-gmax' },
      serebii: { id: '892-gi' },
      pmd: { id: '0892' },
      psgh: { id: 's28544-g' },
    },
  },
  urshifurapidstrikegmax: {
    name: ['Urshifu-Rapid-Strike-Gmax'],
    sources: {
      ps: { id: 'urshifu-rapidstrikegmax', flip: true },
      serebii: { id: '892-rgi' },
      pmd: { id: '0892' },
      psgh: { id: 's28544', flip: true },
    },
  },
  zarude: {
    name: ['Zarude'],
    sources: {
      ps: { flip: true },
      serebii: { id: '893' },
      pmd: { id: '0893' },
      psgh: { id: 's28576', flip: true },
    },
  },
  zarudedada: {
    name: ['Zarude-Dada'],
    sources: {
      ps: { id: 'zarude-dada', flip: true },
      serebii: { id: '893-d' },
      pmd: { id: '0893/0001' },
      psgh: { id: 's28577', flip: true },
    },
  },
  regieleki: {
    name: ['Regieleki'],
    sources: {
      ps: {},
      serebii: { id: '894' },
      pmd: { id: '0894' },
      psgh: { id: 's28608' },
    },
  },
  regidrago: {
    name: ['Regidrago'],
    sources: {
      ps: { flip: true },
      serebii: { id: '895' },
      pmd: { id: '0895' },
      psgh: { id: 's28640', flip: true },
    },
  },
  glastrier: {
    name: ['Glastrier'],
    sources: {
      ps: {},
      serebii: { id: '896' },
      pmd: { id: '0896' },
      psgh: { id: 's28672' },
    },
  },
  spectrier: {
    name: ['Spectrier'],
    sources: {
      ps: {},
      serebii: { id: '897' },
      pmd: { id: '0897' },
      psgh: { id: 's28704' },
    },
  },
  calyrex: {
    name: ['Calyrex'],
    sources: {
      ps: {},
      serebii: { id: '898' },
      pmd: { id: '0898' },
      psgh: { id: 's28736' },
    },
  },
  calyrexice: {
    name: ['Calyrex-Ice'],
    sources: {
      ps: { id: 'calyrex-ice' },
      serebii: { id: '898-i' },
      pmd: { id: '0898' },
      psgh: { id: 's28737' },
    },
  },
  calyrexshadow: {
    name: ['Calyrex-Shadow'],
    sources: {
      ps: { id: 'calyrex-shadow' },
      serebii: { id: '898-s' },
      pmd: { id: '0898' },
      psgh: { id: 's28738' },
    },
  },
  wyrdeer: {
    name: ['Wyrdeer'],
    sources: {
      ps: {},
      serebii: { id: '899' },
      pmd: { id: '0899' },
      psgh: { id: 's28768' },
    },
  },
  kleavor: {
    name: ['Kleavor'],
    sources: {
      ps: {},
      serebii: { id: '900' },
      pmd: { id: '0900' },
      psgh: { id: 's28800' },
    },
  },
  ursaluna: {
    name: ['Ursaluna'],
    sources: {
      ps: { flip: true },
      serebii: { id: '901' },
      pmd: { id: '0901' },
      psgh: { id: 's28832', flip: true },
    },
  },
  ursalunabloodmoon: {
    name: ['Ursaluna-Bloodmoon'],
    sources: {
      ps: { id: 'ursaluna-bloodmoon' },
      serebii: { id: '901-b' },
      pmd: { id: '0901/0001' },
      psgh: { id: 's28833' },
    },
  },
  basculegion: {
    name: ['Basculegion'],
    sources: {
      ps: {},
      serebii: { id: '902' },
      pmd: { id: '0902' },
      psgh: { id: 's28864' },
    },
  },
  basculegionf: {
    name: ['Basculegion-Female', 'Basculegion-F'],
    sources: {
      ps: { id: 'basculegion-f' },
      serebii: { id: '902-f' },
      pmd: { id: '0902/0000/0000/0002' },
      psgh: { id: 's28865' },
    },
  },
  sneasler: {
    name: ['Sneasler'],
    sources: {
      ps: {},
      serebii: { id: '903' },
      pmd: { id: '0903' },
      psgh: { id: 's28896' },
    },
  },
  overqwil: {
    name: ['Overqwil'],
    sources: {
      ps: {},
      serebii: { id: '904' },
      pmd: { id: '0904' },
      psgh: { id: 's28928' },
    },
  },
  enamorus: {
    name: ['Enamorus-Incarnate', 'Enamorus', 'Enamorus-I'],
    sources: {
      ps: { flip: true },
      serebii: { id: '905' },
      pmd: { id: '0905' },
      psgh: { id: 's28960', flip: true },
    },
  },
  enamorustherian: {
    name: ['Enamorus-T', 'Enamorus-Therian'],
    sources: {
      ps: { id: 'enamorus-therian' },
      serebii: { id: '905-t' },
      pmd: { id: '0905/0001' },
      psgh: { id: 's28961' },
    },
  },
  sprigatito: {
    name: ['Sprigatito'],
    sources: {
      ps: {},
      serebii: { id: '906' },
      pmd: { id: '0906' },
      psgh: { id: 's28992' },
    },
  },
  floragato: {
    name: ['Floragato'],
    sources: {
      ps: {},
      serebii: { id: '907' },
      pmd: { id: '0907' },
      psgh: { id: 's29024' },
    },
  },
  meowscarada: {
    name: ['Meowscarada'],
    sources: {
      ps: {},
      serebii: { id: '908' },
      pmd: { id: '0908' },
      psgh: { id: 's29056' },
    },
  },
  fuecoco: {
    name: ['Fuecoco'],
    sources: {
      ps: {},
      serebii: { id: '909' },
      pmd: { id: '0909' },
      psgh: { id: 's29088' },
    },
  },
  crocalor: {
    name: ['Crocalor'],
    sources: {
      ps: {},
      serebii: { id: '910' },
      pmd: { id: '0910' },
      psgh: { id: 's29120' },
    },
  },
  skeledirge: {
    name: ['Skeledirge'],
    sources: {
      ps: {},
      serebii: { id: '911' },
      pmd: { id: '0911' },
      psgh: { id: 's29152' },
    },
  },
  quaxly: {
    name: ['Quaxly'],
    sources: {
      ps: { flip: true },
      serebii: { id: '912' },
      pmd: { id: '0912' },
      psgh: { id: 's29184', flip: true },
    },
  },
  quaxwell: {
    name: ['Quaxwell'],
    sources: {
      ps: { flip: true },
      serebii: { id: '913' },
      pmd: { id: '0913' },
      psgh: { id: 's29216', flip: true },
    },
  },
  quaquaval: {
    name: ['Quaquaval'],
    sources: {
      ps: { flip: true },
      serebii: { id: '914' },
      pmd: { id: '0914' },
      psgh: { id: 's29248', flip: true },
    },
  },
  lechonk: {
    name: ['Lechonk'],
    sources: {
      ps: {},
      serebii: { id: '915' },
      pmd: { id: '0915' },
      psgh: { id: 's29280' },
    },
  },
  oinkologne: {
    name: ['Oinkologne'],
    sources: {
      ps: { flip: true },
      serebii: { id: '916' },
      pmd: { id: '0916' },
      psgh: { id: 's29312', flip: true },
    },
  },
  oinkolognef: {
    name: ['Oinkologne-Female', 'Oinkologne-F'],
    sources: {
      ps: { id: 'oinkologne-f' },
      serebii: { id: '916-f' },
      pmd: { id: '0916/0000/0000/0002' },
      psgh: { id: 's29313' },
    },
  },
  tarountula: {
    name: ['Tarountula'],
    sources: {
      ps: {},
      serebii: { id: '917' },
      pmd: { id: '0917' },
      psgh: { id: 's29344' },
    },
  },
  spidops: {
    name: ['Spidops'],
    sources: {
      ps: {},
      serebii: { id: '918' },
      pmd: { id: '0918' },
      psgh: { id: 's29376' },
    },
  },
  nymble: {
    name: ['Nymble'],
    sources: {
      ps: {},
      serebii: { id: '919' },
      pmd: { id: '0919' },
      psgh: { id: 's29408' },
    },
  },
  lokix: {
    name: ['Lokix'],
    sources: {
      ps: {},
      serebii: { id: '920' },
      pmd: { id: '0920' },
      psgh: { id: 's29440' },
    },
  },
  pawmi: {
    name: ['Pawmi'],
    sources: {
      ps: { flip: true },
      serebii: { id: '921' },
      pmd: { id: '0921' },
      psgh: { id: 's29472', flip: true },
    },
  },
  pawmo: {
    name: ['Pawmo'],
    sources: {
      ps: {},
      serebii: { id: '922' },
      pmd: { id: '0922' },
      psgh: { id: 's29504' },
    },
  },
  pawmot: {
    name: ['Pawmot'],
    sources: {
      ps: {},
      serebii: { id: '923' },
      pmd: { id: '0923' },
      psgh: { id: 's29536' },
    },
  },
  tandemaus: {
    name: ['Tandemaus'],
    sources: {
      ps: {},
      serebii: { id: '924' },
      pmd: { id: '0924' },
      psgh: { id: 's29568' },
    },
  },
  maushold: {
    name: ['Maushold'],
    sources: {
      ps: {},
      serebii: { id: '925' },
      pmd: { id: '0925' },
      psgh: { id: 's29600' },
    },
  },
  fidough: {
    name: ['Fidough'],
    sources: {
      ps: {},
      serebii: { id: '926' },
      pmd: { id: '0926' },
      psgh: { id: 's29632' },
    },
  },
  dachsbun: {
    name: ['Dachsbun'],
    sources: {
      ps: {},
      serebii: { id: '927' },
      pmd: { id: '0927' },
      psgh: { id: 's29664' },
    },
  },
  smoliv: {
    name: ['Smoliv'],
    sources: {
      ps: { flip: true },
      serebii: { id: '928' },
      pmd: { id: '0928' },
      psgh: { id: 's29696', flip: true },
    },
  },
  dolliv: {
    name: ['Dolliv'],
    sources: {
      ps: { flip: true },
      serebii: { id: '929' },
      pmd: { id: '0929' },
      psgh: { id: 's29728', flip: true },
    },
  },
  arboliva: {
    name: ['Arboliva'],
    sources: {
      ps: {},
      serebii: { id: '930' },
      pmd: { id: '0930' },
      psgh: { id: 's29760' },
    },
  },
  squawkabilly: {
    name: ['Squawkabilly'],
    sources: {
      ps: {},
      serebii: { id: '931' },
      pmd: { id: '0931' },
      psgh: { id: 's29792' },
    },
  },
  squawkabillyblue: {
    name: ['Squawkabilly-Blue'],
    sources: {
      ps: { id: 'squawkabilly-blue' },
      serebii: { id: '931-b' },
      pmd: { id: '0931/0001' },
      psgh: { id: 's29793' },
    },
  },
  squawkabillyyellow: {
    name: ['Squawkabilly-Yellow'],
    sources: {
      ps: { id: 'squawkabilly-yellow' },
      serebii: { id: '931-y' },
      pmd: { id: '0931/0002' },
      psgh: { id: 's29794' },
    },
  },
  squawkabillywhite: {
    name: ['Squawkabilly-White'],
    sources: {
      ps: { id: 'squawkabilly-white' },
      serebii: { id: '931-w' },
      pmd: { id: '0931/0003' },
      psgh: { id: 's29795' },
    },
  },
  nacli: {
    name: ['Nacli'],
    sources: {
      ps: {},
      serebii: { id: '932' },
      pmd: { id: '0932' },
      psgh: { id: 's29824' },
    },
  },
  naclstack: {
    name: ['Naclstack'],
    sources: {
      ps: {},
      serebii: { id: '933' },
      pmd: { id: '0933' },
      psgh: { id: 's29856' },
    },
  },
  garganacl: {
    name: ['Garganacl'],
    sources: {
      ps: {},
      serebii: { id: '934' },
      pmd: { id: '0934' },
      psgh: { id: 's29888' },
    },
  },
  charcadet: {
    name: ['Charcadet'],
    sources: {
      ps: {},
      serebii: { id: '935' },
      pmd: { id: '0935' },
      psgh: { id: 's29920' },
    },
  },
  armarouge: {
    name: ['Armarouge'],
    sources: {
      ps: { flip: true },
      serebii: { id: '936' },
      pmd: { id: '0936' },
      psgh: { id: 's29952', flip: true },
    },
  },
  ceruledge: {
    name: ['Ceruledge'],
    sources: {
      ps: {},
      serebii: { id: '937' },
      pmd: { id: '0937' },
      psgh: { id: 's29984' },
    },
  },
  tadbulb: {
    name: ['Tadbulb'],
    sources: {
      ps: {},
      serebii: { id: '938' },
      pmd: { id: '0938' },
      psgh: { id: 's30016' },
    },
  },
  bellibolt: {
    name: ['Bellibolt'],
    sources: {
      ps: {},
      serebii: { id: '939' },
      pmd: { id: '0939' },
      psgh: { id: 's30048' },
    },
  },
  wattrel: {
    name: ['Wattrel'],
    sources: {
      ps: {},
      serebii: { id: '940' },
      pmd: { id: '0940' },
      psgh: { id: 's30080' },
    },
  },
  kilowattrel: {
    name: ['Kilowattrel'],
    sources: {
      ps: {},
      serebii: { id: '941' },
      pmd: { id: '0941' },
      psgh: { id: 's30112' },
    },
  },
  maschiff: {
    name: ['Maschiff'],
    sources: {
      ps: {},
      serebii: { id: '942' },
      pmd: { id: '0942' },
      psgh: { id: 's30144' },
    },
  },
  mabosstiff: {
    name: ['Mabosstiff'],
    sources: {
      ps: {},
      serebii: { id: '943' },
      pmd: { id: '0943' },
      psgh: { id: 's30176' },
    },
  },
  shroodle: {
    name: ['Shroodle'],
    sources: {
      ps: {},
      serebii: { id: '944' },
      pmd: { id: '0944' },
      psgh: { id: 's30208' },
    },
  },
  grafaiai: {
    name: ['Grafaiai'],
    sources: {
      ps: {},
      serebii: { id: '945' },
      pmd: { id: '0945' },
      psgh: { id: 's30240' },
    },
  },
  bramblin: {
    name: ['Bramblin'],
    sources: {
      ps: { flip: true },
      serebii: { id: '946' },
      pmd: { id: '0946' },
      psgh: { id: 's30272', flip: true },
    },
  },
  brambleghast: {
    name: ['Brambleghast'],
    sources: {
      ps: {},
      serebii: { id: '947' },
      pmd: { id: '0947' },
      psgh: { id: 's30304' },
    },
  },
  toedscool: {
    name: ['Toedscool'],
    sources: {
      ps: {},
      serebii: { id: '948' },
      pmd: { id: '0948' },
      psgh: { id: 's30336' },
    },
  },
  toedscruel: {
    name: ['Toedscruel'],
    sources: {
      ps: {},
      serebii: { id: '949' },
      pmd: { id: '0949' },
      psgh: { id: 's30368' },
    },
  },
  klawf: {
    name: ['Klawf'],
    sources: {
      ps: { flip: true },
      serebii: { id: '950' },
      pmd: { id: '0950' },
      psgh: { id: 's30400', flip: true },
    },
  },
  capsakid: {
    name: ['Capsakid'],
    sources: {
      ps: {},
      serebii: { id: '951' },
      pmd: { id: '0951' },
      psgh: { id: 's30432' },
    },
  },
  scovillain: {
    name: ['Scovillain'],
    sources: {
      ps: { flip: true },
      serebii: { id: '952' },
      pmd: { id: '0952' },
      psgh: { id: 's30464', flip: true },
    },
  },
  scovillainmega: {
    name: ['Mega Scovillain', 'Scovillain-Mega'],
    sources: {
      ps: { id: 'scovillain-mega', flip: true },
      serebii: { id: '952' },
      pmd: { id: '0952' },
      psgh: { id: 's30464', flip: true },
    },
  },
  rellor: {
    name: ['Rellor'],
    sources: {
      ps: {},
      serebii: { id: '953' },
      pmd: { id: '0953' },
      psgh: { id: 's30496' },
    },
  },
  rabsca: {
    name: ['Rabsca'],
    sources: {
      ps: {},
      serebii: { id: '954' },
      pmd: { id: '0954' },
      psgh: { id: 's30528' },
    },
  },
  flittle: {
    name: ['Flittle'],
    sources: {
      ps: { flip: true },
      serebii: { id: '955' },
      pmd: { id: '0955' },
      psgh: { id: 's30560', flip: true },
    },
  },
  espathra: {
    name: ['Espathra'],
    sources: {
      ps: {},
      serebii: { id: '956' },
      pmd: { id: '0956' },
      psgh: { id: 's30592' },
    },
  },
  tinkatink: {
    name: ['Tinkatink'],
    sources: {
      ps: {},
      serebii: { id: '957' },
      pmd: { id: '0957' },
      psgh: { id: 's30624' },
    },
  },
  tinkatuff: {
    name: ['Tinkatuff'],
    sources: {
      ps: {},
      serebii: { id: '958' },
      pmd: { id: '0958' },
      psgh: { id: 's30656' },
    },
  },
  tinkaton: {
    name: ['Tinkaton'],
    sources: {
      ps: {},
      serebii: { id: '959' },
      pmd: { id: '0959' },
      psgh: { id: 's30688' },
    },
  },
  wiglett: {
    name: ['Wiglett'],
    sources: {
      ps: {},
      serebii: { id: '960' },
      pmd: { id: '0960' },
      psgh: { id: 's30720' },
    },
  },
  wugtrio: {
    name: ['Wugtrio'],
    sources: {
      ps: { flip: true },
      serebii: { id: '961' },
      pmd: { id: '0961' },
      psgh: { id: 's30752', flip: true },
    },
  },
  bombirdier: {
    name: ['Bombirdier'],
    sources: {
      ps: {},
      serebii: { id: '962' },
      pmd: { id: '0962' },
      psgh: { id: 's30784' },
    },
  },
  finizen: {
    name: ['Finizen'],
    sources: {
      ps: {},
      serebii: { id: '963' },
      pmd: { id: '0963' },
      psgh: { id: 's30816' },
    },
  },
  palafin: {
    name: ['Palafin'],
    sources: {
      ps: {},
      serebii: { id: '964' },
      pmd: { id: '0964' },
      psgh: { id: 's30848' },
    },
  },
  palafinhero: {
    name: ['Palafin-Hero'],
    sources: {
      ps: { id: 'palafin-hero' },
      serebii: { id: '964-h' },
      pmd: { id: '0964/0001' },
      psgh: { id: 's30849' },
    },
  },
  varoom: {
    name: ['Varoom'],
    sources: {
      ps: {},
      serebii: { id: '965' },
      pmd: { id: '0965' },
      psgh: { id: 's30880' },
    },
  },
  revavroom: {
    name: ['Revavroom'],
    sources: {
      ps: {},
      serebii: { id: '966' },
      pmd: { id: '0966' },
      psgh: { id: 's30912' },
    },
  },
  cyclizar: {
    name: ['Cyclizar'],
    sources: {
      ps: { flip: true },
      serebii: { id: '967' },
      pmd: { id: '0967' },
      psgh: { id: 's30944', flip: true },
    },
  },
  orthworm: {
    name: ['Orthworm'],
    sources: {
      ps: {},
      serebii: { id: '968' },
      pmd: { id: '0968' },
      psgh: { id: 's30976' },
    },
  },
  glimmet: {
    name: ['Glimmet'],
    sources: {
      ps: { flip: true },
      serebii: { id: '969' },
      pmd: { id: '0969' },
      psgh: { id: 's31008', flip: true },
    },
  },
  glimmora: {
    name: ['Glimmora'],
    sources: {
      ps: { flip: true },
      serebii: { id: '970' },
      pmd: { id: '0970' },
      psgh: { id: 's31040', flip: true },
    },
  },
  glimmoramega: {
    name: ['Mega Glimmora', 'Glimmora-Mega'],
    sources: {
      ps: { id: 'glimmora-mega', flip: true },
      serebii: { id: '970' },
      pmd: { id: '0970' },
      psgh: { id: 's31040', flip: true },
    },
  },
  greavard: {
    name: ['Greavard'],
    sources: {
      ps: {},
      serebii: { id: '971' },
      pmd: { id: '0971' },
      psgh: { id: 's31072' },
    },
  },
  houndstone: {
    name: ['Houndstone'],
    sources: {
      ps: {},
      serebii: { id: '972' },
      pmd: { id: '0972' },
      psgh: { id: 's31104' },
    },
  },
  flamigo: {
    name: ['Flamigo'],
    sources: {
      ps: {},
      serebii: { id: '973' },
      pmd: { id: '0973' },
      psgh: { id: 's31136' },
    },
  },
  cetoddle: {
    name: ['Cetoddle'],
    sources: {
      ps: {},
      serebii: { id: '974' },
      pmd: { id: '0974' },
      psgh: { id: 's31168' },
    },
  },
  cetitan: {
    name: ['Cetitan'],
    sources: {
      ps: {},
      serebii: { id: '975' },
      pmd: { id: '0975' },
      psgh: { id: 's31200' },
    },
  },
  veluza: {
    name: ['Veluza'],
    sources: {
      ps: {},
      serebii: { id: '976' },
      pmd: { id: '0976' },
      psgh: { id: 's31232' },
    },
  },
  dondozo: {
    name: ['Dondozo'],
    sources: {
      ps: {},
      serebii: { id: '977' },
      pmd: { id: '0977' },
      psgh: { id: 's31264' },
    },
  },
  tatsugiri: {
    name: ['Tatsugiri'],
    sources: {
      ps: { flip: true },
      serebii: { id: '978' },
      pmd: { id: '0978' },
      psgh: { id: 's31296', flip: true },
    },
  },
  tatsugirimega: {
    name: ['Mega Tatsugiri', 'Tatsugiri-Mega'],
    sources: {
      ps: { id: 'tatsugiri-mega', flip: true },
      serebii: { id: '978' },
      pmd: { id: '0978' },
      psgh: { id: 's31296', flip: true },
    },
  },
  annihilape: {
    name: ['Annihilape'],
    sources: {
      ps: {},
      serebii: { id: '979' },
      pmd: { id: '0979' },
      psgh: { id: 's31328' },
    },
  },
  clodsire: {
    name: ['Clodsire'],
    sources: {
      ps: {},
      serebii: { id: '980' },
      pmd: { id: '0980' },
      psgh: { id: 's31360' },
    },
  },
  farigiraf: {
    name: ['Farigiraf'],
    sources: {
      ps: { flip: true },
      serebii: { id: '981' },
      pmd: { id: '0981' },
      psgh: { id: 's31392', flip: true },
    },
  },
  dudunsparce: {
    name: ['Dudunsparce'],
    sources: {
      ps: {},
      serebii: { id: '982' },
      pmd: { id: '0982' },
      psgh: { id: 's31424' },
    },
  },
  dudunsparcethreesegment: {
    name: ['Dudunsparce-Three-Segment'],
    sources: {
      ps: { id: 'dudunsparce-threesegment' },
      serebii: { id: '982-t' },
      pmd: { id: '0982/0001' },
      psgh: { id: 's31425' },
    },
  },
  kingambit: {
    name: ['Kingambit'],
    sources: {
      ps: {},
      serebii: { id: '983' },
      pmd: { id: '0983' },
      psgh: { id: 's31456' },
    },
  },
  greattusk: {
    name: ['Great Tusk'],
    sources: {
      ps: {},
      serebii: { id: '984' },
      pmd: { id: '0984' },
      psgh: { id: 's31488' },
    },
  },
  screamtail: {
    name: ['Scream Tail'],
    sources: {
      ps: { flip: true },
      serebii: { id: '985' },
      pmd: { id: '0985' },
      psgh: { id: 's31520', flip: true },
    },
  },
  brutebonnet: {
    name: ['Brute Bonnet'],
    sources: {
      ps: {},
      serebii: { id: '986' },
      pmd: { id: '0986' },
      psgh: { id: 's31552' },
    },
  },
  fluttermane: {
    name: ['Flutter Mane'],
    sources: {
      ps: {},
      serebii: { id: '987' },
      pmd: { id: '0987' },
      psgh: { id: 's31584' },
    },
  },
  slitherwing: {
    name: ['Slither Wing'],
    sources: {
      ps: {},
      serebii: { id: '988' },
      pmd: { id: '0988' },
      psgh: { id: 's31616' },
    },
  },
  sandyshocks: {
    name: ['Sandy Shocks'],
    sources: {
      ps: {},
      serebii: { id: '989' },
      pmd: { id: '0989' },
      psgh: { id: 's31648' },
    },
  },
  irontreads: {
    name: ['Iron Treads'],
    sources: {
      ps: {},
      serebii: { id: '990' },
      pmd: { id: '0990' },
      psgh: { id: 's31680' },
    },
  },
  ironbundle: {
    name: ['Iron Bundle'],
    sources: {
      ps: {},
      serebii: { id: '991' },
      pmd: { id: '0991' },
      psgh: { id: 's31712' },
    },
  },
  ironhands: {
    name: ['Iron Hands'],
    sources: {
      ps: {},
      serebii: { id: '992' },
      pmd: { id: '0992' },
      psgh: { id: 's31744' },
    },
  },
  ironjugulis: {
    name: ['Iron Jugulis'],
    sources: {
      ps: {},
      serebii: { id: '993' },
      pmd: { id: '0993' },
      psgh: { id: 's31776' },
    },
  },
  ironmoth: {
    name: ['Iron Moth'],
    sources: {
      ps: {},
      serebii: { id: '994' },
      pmd: { id: '0994' },
      psgh: { id: 's31808' },
    },
  },
  ironthorns: {
    name: ['Iron Thorns'],
    sources: {
      ps: {},
      serebii: { id: '995' },
      pmd: { id: '0995' },
      psgh: { id: 's31840' },
    },
  },
  frigibax: {
    name: ['Frigibax'],
    sources: {
      ps: {},
      serebii: { id: '996' },
      pmd: { id: '0996' },
      psgh: { id: 's31872' },
    },
  },
  arctibax: {
    name: ['Arctibax'],
    sources: {
      ps: {},
      serebii: { id: '997' },
      pmd: { id: '0997' },
      psgh: { id: 's31904' },
    },
  },
  baxcalibur: {
    name: ['Baxcalibur'],
    sources: {
      ps: {},
      serebii: { id: '998' },
      pmd: { id: '0998' },
      psgh: { id: 's31936' },
    },
  },
  baxcaliburmega: {
    name: ['Mega Baxcalibur', 'Baxcalibur-Mega'],
    sources: {
      ps: { id: 'baxcalibur-mega' },
      serebii: { id: '998' },
      pmd: { id: '0998' },
      psgh: { id: 's31936' },
    },
  },
  gimmighoul: {
    name: ['Gimmighoul'],
    sources: {
      ps: {},
      serebii: { id: '999' },
      pmd: { id: '0999' },
      psgh: { id: 's31968' },
    },
  },
  gimmighoulroaming: {
    name: ['Gimmighoul-Roaming'],
    sources: {
      ps: { id: 'gimmighoul-roaming' },
      serebii: { id: '999-r' },
      pmd: { id: '0999/0001' },
      psgh: { id: 's31969' },
    },
  },
  gholdengo: {
    name: ['Gholdengo'],
    sources: {
      ps: {},
      serebii: { id: '1000' },
      pmd: { id: '1000' },
      psgh: { id: 's32000' },
    },
  },
  wochien: {
    name: ['Wo-Chien'],
    sources: {
      ps: {},
      serebii: { id: '1001' },
      pmd: { id: '1001' },
      psgh: { id: 's32032' },
    },
  },
  chienpao: {
    name: ['Chien-Pao'],
    sources: {
      ps: {},
      serebii: { id: '1002' },
      pmd: { id: '1002' },
      psgh: { id: 's32064' },
    },
  },
  tinglu: {
    name: ['Ting-Lu'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1003' },
      pmd: { id: '1003' },
      psgh: { id: 's32096', flip: true },
    },
  },
  chiyu: {
    name: ['Chi-Yu'],
    sources: {
      ps: {},
      serebii: { id: '1004' },
      pmd: { id: '1004' },
      psgh: { id: 's32128' },
    },
  },
  roaringmoon: {
    name: ['Roaring Moon'],
    sources: {
      ps: {},
      serebii: { id: '1005' },
      pmd: { id: '1005' },
      psgh: { id: 's32160' },
    },
  },
  ironvaliant: {
    name: ['Iron Valiant'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1006' },
      pmd: { id: '1006' },
      psgh: { id: 's32192', flip: true },
    },
  },
  koraidon: {
    name: ['Koraidon'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1007' },
      pmd: { id: '1007' },
      psgh: { id: 's32224', flip: true },
    },
  },
  miraidon: {
    name: ['Miraidon'],
    sources: {
      ps: {},
      serebii: { id: '1008' },
      pmd: { id: '1008' },
      psgh: { id: 's32256' },
    },
  },
  walkingwake: {
    name: ['Walking Wake'],
    sources: {
      ps: {},
      serebii: { id: '1009' },
      pmd: { id: '1009' },
      psgh: { id: 's32288' },
    },
  },
  ironleaves: {
    name: ['Iron Leaves'],
    sources: {
      ps: {},
      serebii: { id: '1010' },
      pmd: { id: '1010' },
      psgh: { id: 's32320' },
    },
  },
  dipplin: {
    name: ['Dipplin'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1011' },
      pmd: { id: '1011' },
      psgh: { id: 's32352', flip: true },
    },
  },
  poltchageist: {
    name: ['Poltchageist'],
    sources: {
      ps: {},
      serebii: { id: '1012' },
      pmd: { id: '1012' },
      psgh: { id: 's32384' },
    },
  },
  sinistcha: {
    name: ['Sinistcha'],
    sources: {
      ps: {},
      serebii: { id: '1013' },
      pmd: { id: '1013' },
      psgh: { id: 's32416' },
    },
  },
  okidogi: {
    name: ['Okidogi'],
    sources: {
      ps: {},
      serebii: { id: '1014' },
      pmd: { id: '1014' },
      psgh: { id: 's32448' },
    },
  },
  munkidori: {
    name: ['Munkidori'],
    sources: {
      ps: {},
      serebii: { id: '1015' },
      pmd: { id: '1015' },
      psgh: { id: 's32480' },
    },
  },
  fezandipiti: {
    name: ['Fezandipiti'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1016' },
      pmd: { id: '1016' },
      psgh: { id: 's32512', flip: true },
    },
  },
  ogerpon: {
    name: ['Ogerpon'],
    sources: {
      ps: {},
      serebii: { id: '1017' },
      pmd: { id: '1017/0004' },
      psgh: { id: 's32544' },
    },
  },
  ogerponwellspring: {
    name: ['Ogerpon-Wellspring'],
    sources: {
      ps: { id: 'ogerpon-wellspring' },
      serebii: { id: '1017-w' },
      pmd: { id: '1017/0005' },
      psgh: { id: 's32545' },
    },
  },
  ogerponhearthflame: {
    name: ['Ogerpon-Hearthflame'],
    sources: {
      ps: { id: 'ogerpon-hearthflame' },
      serebii: { id: '1017-h' },
      pmd: { id: '1017/0006' },
      psgh: { id: 's32546' },
    },
  },
  ogerponcornerstone: {
    name: ['Ogerpon-Cornerstone'],
    sources: {
      ps: { id: 'ogerpon-cornerstone' },
      serebii: { id: '1017-c' },
      pmd: { id: '1017/0007' },
      psgh: { id: 's32547' },
    },
  },
  archaludon: {
    name: ['Archaludon'],
    sources: {
      ps: {},
      serebii: { id: '1018' },
      pmd: { id: '1018' },
      psgh: { id: 's32576' },
    },
  },
  hydrapple: {
    name: ['Hydrapple'],
    sources: {
      ps: {},
      serebii: { id: '1019' },
      pmd: { id: '1019' },
      psgh: { id: 's32608' },
    },
  },
  gougingfire: {
    name: ['Gouging Fire'],
    sources: {
      ps: {},
      serebii: { id: '1020' },
      pmd: { id: '1020' },
      psgh: { id: 's32640' },
    },
  },
  ragingbolt: {
    name: ['Raging Bolt'],
    sources: {
      ps: {},
      serebii: { id: '1021' },
      pmd: { id: '1021' },
      psgh: { id: 's32672' },
    },
  },
  ironboulder: {
    name: ['Iron Boulder'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1022' },
      pmd: { id: '1022' },
      psgh: { id: 's32704', flip: true },
    },
  },
  ironcrown: {
    name: ['Iron Crown'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1023' },
      pmd: { id: '1023' },
      psgh: { id: 's32736', flip: true },
    },
  },
  terapagos: {
    name: ['Terapagos'],
    sources: {
      ps: { flip: true },
      serebii: { id: '1024' },
      pmd: { id: '1024' },
      psgh: { id: 's32768', flip: true },
    },
  },
  terapagosterastal: {
    name: ['Terapagos-Terastal'],
    sources: {
      ps: { id: 'terapagos-terastal', flip: true },
      serebii: { id: '1024-t' },
      pmd: { id: '1024/0001' },
      psgh: { id: 's32769', flip: true },
    },
  },
  pecharunt: {
    name: ['Pecharunt'],
    sources: {
      ps: {},
      serebii: { id: '1025' },
      pmd: { id: '1025' },
      psgh: { id: 's32800' },
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
};
