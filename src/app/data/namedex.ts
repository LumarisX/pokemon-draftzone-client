import { Pokemon } from '../interfaces/draft';

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

let $nameList: Pokemon[] | undefined;
export function nameList(): Pokemon[] {
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

export type SourceKey = 'ps' | 'pd' | 'serebii' | 'pmd' | 'rr';

export const Sources: { [key in SourceKey]: string } = {
  ps: 'play.pokemonshowdown.com/sprites',
  pd: '',
  serebii: 'serebii.net',
  pmd: 'raw.githubusercontent.com/PMDCollab/SpriteCollab/master/portrait',
  rr: 'play.radicalred.net/sprites',
} as const;

function psDexPath(id: string, shiny?: boolean) {
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
    fallback: psDexPath,
  },
  afd: {
    getPath: function (id: string, shiny?: boolean) {
      return `https://${Sources[this.source]}/afd${shiny ? '-shiny' : ''}/${id}.png`;
    },
    classes: [''],
    source: 'ps',
    fallback: psDexPath,
  },
  sv: {
    getPath: psDexPath,
    classes: [''],
    source: 'ps',
  },
  ani: {
    getPath: function (id: string, shiny?: boolean) {
      return `https://${Sources[this.source]}/ani${shiny ? '-shiny' : ''}/${id}.gif`;
    },
    classes: [''],
    source: 'ps',
    fallback: psDexPath,
  },
  home: {
    getPath: function (id: string, shiny?: boolean) {
      return `https://${Sources[this.source]}/home-centered${
        shiny ? '-shiny' : ''
      }/${id}.png`;
    },
    classes: ['sprite-border'],
    source: 'ps',
    fallback: psDexPath,
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
    sources: { ps: {}, serebii: { id: '001' }, pd: {}, pmd: { id: '0001' } },
  },
  ivysaur: {
    name: ['Ivysaur'],
    sources: {
      ps: {},
      serebii: { id: '002' },
      pd: { flip: true },
      pmd: { id: '0002' },
    },
  },
  venusaur: {
    name: ['Venusaur'],
    sources: { ps: {}, serebii: { id: '003' }, pd: {}, pmd: { id: '0003' } },
  },
  venusaurmega: {
    name: ['Mega Venusaur', 'Venusaur-Mega'],
    sources: {
      ps: { id: 'venusaur-mega' },
      serebii: { id: '003-m' },
      pd: { id: 'venusaur-mega' },
      pmd: { id: '0003/0001' },
    },
  },
  venusaurgmax: {
    name: ['Venusaur-Gmax'],
    sources: {
      ps: { id: 'venusaur-gmax' },
      serebii: { id: '003-gi' },
      pd: { id: 'venusaur-gigantamax' },
      pmd: { id: '0003' },
    },
  },
  charmander: {
    name: ['Charmander'],
    sources: { ps: {}, serebii: { id: '004' }, pd: {}, pmd: { id: '0004' } },
  },
  charmeleon: {
    name: ['Charmeleon'],
    sources: { ps: {}, serebii: { id: '005' }, pd: {}, pmd: { id: '0005' } },
  },
  charizard: {
    name: ['Charizard'],
    sources: { ps: {}, serebii: { id: '006' }, pd: {}, pmd: { id: '0006' } },
  },
  charizardmegax: {
    name: ['Mega Charizard X', 'Charizard-Mega-X'],
    sources: {
      ps: { id: 'charizard-megax' },
      serebii: { id: '006-mx' },
      pd: { id: 'charizard-mega-x', flip: true },
      pmd: { id: '0006/0001' },
    },
  },
  charizardmegay: {
    name: ['Mega Charizard Y', 'Charizard-Mega-Y'],
    sources: {
      ps: { id: 'charizard-megay' },
      serebii: { id: '006-my' },
      pd: { id: 'charizard-mega-y' },
      pmd: { id: '0006/0002' },
    },
  },
  charizardgmax: {
    name: ['Charizard-Gmax'],
    sources: {
      ps: { id: 'charizard-gmax' },
      serebii: { id: '006-gi' },
      pd: { id: 'charizard-gigantamax', flip: true },
      pmd: { id: '0006' },
    },
  },
  squirtle: {
    name: ['Squirtle'],
    sources: { ps: {}, serebii: { id: '007' }, pd: {}, pmd: { id: '0007' } },
  },
  wartortle: {
    name: ['Wartortle'],
    sources: { ps: {}, serebii: { id: '008' }, pd: {}, pmd: { id: '0008' } },
  },
  blastoise: {
    name: ['Blastoise'],
    sources: { ps: {}, serebii: { id: '009' }, pd: {}, pmd: { id: '0009' } },
  },
  blastoisemega: {
    name: ['Mega Blastoise', 'Blastoise-Mega'],
    sources: {
      ps: { id: 'blastoise-mega' },
      serebii: { id: '009-m' },
      pd: { id: 'blastoise-mega' },
      pmd: { id: '0009/0001' },
    },
  },
  blastoisegmax: {
    name: ['Blastoise-Gmax'],
    sources: {
      ps: { id: 'blastoise-gmax' },
      serebii: { id: '009-gi' },
      pd: { id: 'blastoise-gigantamax', flip: true },
      pmd: { id: '0009' },
    },
  },
  caterpie: {
    name: ['Caterpie'],
    sources: { ps: {}, serebii: { id: '010' }, pd: {}, pmd: { id: '0010' } },
  },
  metapod: {
    name: ['Metapod'],
    sources: { ps: {}, serebii: { id: '011' }, pd: {}, pmd: { id: '0011' } },
  },
  butterfree: {
    name: ['Butterfree'],
    sources: { ps: {}, serebii: { id: '012' }, pd: {}, pmd: { id: '0012' } },
  },
  butterfreegmax: {
    name: ['Butterfree-Gmax'],
    sources: {
      ps: { id: 'butterfree-gmax' },
      serebii: { id: '012-gi' },
      pd: { id: 'butterfree-gigantamax', flip: true },
      pmd: { id: '0012' },
    },
  },
  butterfreemega: {
    name: ['Mega Butterfree', 'Butterfree-Mega'],
    sources: {
      ps: { id: 'butterfree-gmax' },
      serebii: { id: '012-gi' },
      pd: { id: 'butterfree-gigantamax', flip: true },
      pmd: { id: '0012' },
    },
  },
  weedle: {
    name: ['Weedle'],
    sources: { ps: {}, serebii: { id: '013' }, pd: {}, pmd: { id: '0013' } },
  },
  kakuna: {
    name: ['Kakuna'],
    sources: { ps: {}, serebii: { id: '014' }, pd: {}, pmd: { id: '0014' } },
  },
  beedrill: {
    name: ['Beedrill'],
    sources: { ps: {}, serebii: { id: '015' }, pd: {}, pmd: { id: '0015' } },
  },
  beedrillmega: {
    name: ['Mega Beedrill', 'Beedrill-Mega'],
    sources: {
      ps: { id: 'beedrill-mega' },
      serebii: { id: '015-m' },
      pd: { id: 'beedrill-mega' },
      pmd: { id: '0015/0001' },
    },
  },
  pidgey: {
    name: ['Pidgey'],
    sources: { ps: {}, serebii: { id: '016' }, pd: {}, pmd: { id: '0016' } },
  },
  pidgeotto: {
    name: ['Pidgeotto'],
    sources: { ps: {}, serebii: { id: '017' }, pd: {}, pmd: { id: '0017' } },
  },
  pidgeot: {
    name: ['Pidgeot'],
    sources: {
      ps: {},
      serebii: { id: '018' },
      pd: { flip: true },
      pmd: { id: '0018' },
    },
  },
  pidgeotmega: {
    name: ['Mega Pidgeot', 'Pidgeot-Mega'],
    sources: {
      ps: { id: 'pidgeot-mega' },
      serebii: { id: '018-m' },
      pd: { id: 'pidgeot-mega' },
      pmd: { id: '0018/0001' },
    },
  },
  rattata: {
    name: ['Rattata'],
    sources: { ps: {}, serebii: { id: '019' }, pd: {}, pmd: { id: '0019' } },
  },
  rattataalola: {
    name: ['Alolan Rattata', 'Rattata-Alola', 'Rattata-A'],
    sources: {
      ps: { id: 'rattata-alola' },
      serebii: { id: '019-a' },
      pd: { id: 'rattata-alolan' },
      pmd: { id: '0019/0001' },
    },
  },
  raticate: {
    name: ['Raticate'],
    sources: { ps: {}, serebii: { id: '020' }, pd: {}, pmd: { id: '0020' } },
  },
  raticatealola: {
    name: ['Alolan Raticate', 'Raticate-Alola', 'Raticate-A'],
    sources: {
      ps: { id: 'raticate-alola' },
      serebii: { id: '020-a' },
      pd: { id: 'raticate-alolan' },
      pmd: { id: '0020/0001' },
    },
  },
  spearow: {
    name: ['Spearow'],
    sources: { ps: {}, serebii: { id: '021' }, pd: {}, pmd: { id: '0021' } },
  },
  fearow: {
    name: ['Fearow'],
    sources: { ps: {}, serebii: { id: '022' }, pd: {}, pmd: { id: '0022' } },
  },
  ekans: {
    name: ['Ekans'],
    sources: { ps: {}, serebii: { id: '023' }, pd: {}, pmd: { id: '0023' } },
  },
  arbok: {
    name: ['Arbok'],
    sources: { ps: {}, serebii: { id: '024' }, pd: {}, pmd: { id: '0024' } },
  },
  pikachu: {
    name: ['Pikachu'],
    sources: { ps: {}, serebii: { id: '025' }, pd: {}, pmd: { id: '0025' } },
  },
  pikachucosplay: {
    name: ['Pikachu-Cosplay'],
    sources: {
      ps: { id: 'pikachu-cosplay' },
      serebii: { id: '025' },
      pd: { id: 'pikachu-cosplay' },
      pmd: { id: '0025' },
    },
  },
  pikachurockstar: {
    name: ['Pikachu-Rock-Star'],
    sources: {
      ps: { id: 'pikachu-rockstar' },
      serebii: { id: '025' },
      pd: { id: 'pikachu-rock-star' },
      pmd: { id: '0025/0002' },
    },
  },
  pikachubelle: {
    name: ['Pikachu-Belle'],
    sources: {
      ps: { id: 'pikachu-belle' },
      serebii: { id: '025' },
      pd: { id: 'pikachu-belle' },
      pmd: { id: '0025/0003' },
    },
  },
  pikachupopstar: {
    name: ['Pikachu-Pop-Star'],
    sources: {
      ps: { id: 'pikachu-popstar' },
      serebii: { id: '025' },
      pd: { id: 'pikachu-pop-star' },
      pmd: { id: '0025/0004' },
    },
  },
  pikachuphd: {
    name: ['Pikachu-PhD'],
    sources: {
      ps: { id: 'pikachu-phd' },
      serebii: { id: '025' },
      pd: { id: 'pikachu-phd' },
      pmd: { id: '0025/0005' },
    },
  },
  pikachulibre: {
    name: ['Pikachu-Libre'],
    sources: {
      ps: { id: 'pikachu-libre' },
      serebii: { id: '025' },
      pd: { id: 'pikachu-libre' },
      pmd: { id: '0025/0006' },
    },
  },
  pikachuoriginal: {
    name: ['Pikachu-Original'],
    sources: {
      ps: { id: 'pikachu-original' },
      serebii: { id: '025-o' },
      pd: { id: 'pikachu-original-cap' },
      pmd: { id: '0025/0008' },
    },
  },
  pikachuhoenn: {
    name: ['Pikachu-Hoenn'],
    sources: {
      ps: { id: 'pikachu-hoenn' },
      serebii: { id: '025-h' },
      pd: { id: 'pikachu-hoenn-cap' },
      pmd: { id: '0025/0009' },
    },
  },
  pikachusinnoh: {
    name: ['Pikachu-Sinnoh'],
    sources: {
      ps: { id: 'pikachu-sinnoh' },
      serebii: { id: '025-s' },
      pd: { id: 'pikachu-sinnoh-cap' },
      pmd: { id: '0025/0010' },
    },
  },
  pikachuunova: {
    name: ['Pikachu-Unova'],
    sources: {
      ps: { id: 'pikachu-unova' },
      serebii: { id: '025-u' },
      pd: { id: 'pikachu-unova-cap' },
      pmd: { id: '0025/0011' },
    },
  },
  pikachukalos: {
    name: ['Pikachu-Kalos'],
    sources: {
      ps: { id: 'pikachu-kalos' },
      serebii: { id: '025-k' },
      pd: { id: 'pikachu-kalos-cap' },
      pmd: { id: '0025/0012' },
    },
  },
  pikachualola: {
    name: ['Alolan Pikachu', 'Pikachu-Alola', 'Pikachu-A'],
    sources: {
      ps: { id: 'pikachu-alola' },
      serebii: { id: '025-a' },
      pd: { id: 'pikachu-alola-cap' },
      pmd: { id: '0025/0013' },
    },
  },
  pikachupartner: {
    name: ['Pikachu-Partner'],
    sources: {
      ps: { id: 'pikachu-partner' },
      serebii: { id: '025-p' },
      pd: { id: 'pikachu-partner-cap' },
      pmd: { id: '0025/0014' },
    },
  },
  pikachustarter: {
    name: ['Pikachu-Starter'],
    sources: {
      ps: { id: 'pikachu-starter' },
      serebii: { id: '025' },
      pd: { id: 'pikachu' },
      pmd: { id: '0025' },
    },
  },
  pikachugmax: {
    name: ['Pikachu-Gmax'],
    sources: {
      ps: { id: 'pikachu-gmax' },
      serebii: { id: '025-gi' },
      pd: { id: 'pikachu-gigantamax' },
      pmd: { id: '0025/0001' },
    },
  },
  pikachuworld: {
    name: ['Pikachu-World'],
    sources: {
      ps: { id: 'pikachu-world' },
      serebii: { id: '025-w' },
      pd: { id: 'pikachu-world-cap' },
      pmd: { id: '0025/0015' },
    },
  },
  raichu: {
    name: ['Raichu'],
    sources: { ps: {}, serebii: { id: '026' }, pd: {}, pmd: { id: '0026' } },
  },
  raichualola: {
    name: ['Alolan Raichu', 'Raichu-Alola', 'Raichu-A'],
    sources: {
      ps: { id: 'raichu-alola' },
      serebii: { id: '026-a' },
      pd: { id: 'raichu-alolan' },
      pmd: { id: '0026/0001' },
    },
  },
  sandshrew: {
    name: ['Sandshrew'],
    sources: { ps: {}, serebii: { id: '027' }, pd: {}, pmd: { id: '0027' } },
  },
  sandshrewalola: {
    name: ['Alolan Sandshrew', 'Sandshrew-Alola', 'Sandshrew-A'],
    sources: {
      ps: { id: 'sandshrew-alola' },
      serebii: { id: '027-a' },
      pd: { id: 'sandshrew-alolan', flip: true },
      pmd: { id: '0027/0001' },
    },
  },
  sandslash: {
    name: ['Sandslash'],
    sources: {
      ps: {},
      serebii: { id: '028' },
      pd: { flip: true },
      pmd: { id: '0028' },
    },
  },
  sandslashalola: {
    name: ['Alolan Sandslash', 'Sandslash-Alola', 'Sandslash-A'],
    sources: {
      ps: { id: 'sandslash-alola' },
      serebii: { id: '028-a' },
      pd: { id: 'sandslash-alolan', flip: true },
      pmd: { id: '0028/0001' },
    },
  },
  nidoranf: {
    name: ['Nidoran-Female', 'Nidoran-F'],
    sources: {
      ps: {},
      serebii: { id: '029' },
      pd: { id: 'nidoran-f' },
      pmd: { id: '0029' },
    },
  },
  nidorina: {
    name: ['Nidorina'],
    sources: { ps: {}, serebii: { id: '030' }, pd: {}, pmd: { id: '0030' } },
  },
  nidoqueen: {
    name: ['Nidoqueen'],
    sources: { ps: {}, serebii: { id: '031' }, pd: {}, pmd: { id: '0031' } },
  },
  nidoranm: {
    name: ['Nidoran-M'],
    sources: {
      ps: {},
      serebii: { id: '032' },
      pd: { id: 'nidoran-m' },
      pmd: { id: '0032' },
    },
  },
  nidorino: {
    name: ['Nidorino'],
    sources: { ps: {}, serebii: { id: '033' }, pd: {}, pmd: { id: '0033' } },
  },
  nidoking: {
    name: ['Nidoking'],
    sources: { ps: {}, serebii: { id: '034' }, pd: {}, pmd: { id: '0034' } },
  },
  clefairy: {
    name: ['Clefairy'],
    sources: { ps: {}, serebii: { id: '035' }, pd: {}, pmd: { id: '0035' } },
  },
  clefable: {
    name: ['Clefable'],
    sources: { ps: {}, serebii: { id: '036' }, pd: {}, pmd: { id: '0036' } },
  },
  vulpix: {
    name: ['Vulpix'],
    sources: { ps: {}, serebii: { id: '037' }, pd: {}, pmd: { id: '0037' } },
  },
  vulpixalola: {
    name: ['Alolan Vulpix', 'Vulpix-Alola', 'Vulpix-A'],
    sources: {
      ps: { id: 'vulpix-alola' },
      serebii: { id: '037-a' },
      pd: { id: 'vulpix-alolan' },
      pmd: { id: '0037/0001' },
    },
  },
  ninetales: {
    name: ['Ninetales'],
    sources: { ps: {}, serebii: { id: '038' }, pd: {}, pmd: { id: '0038' } },
  },
  ninetalesalola: {
    name: ['Alolan Ninetales', 'Ninetales-Alola', 'Ninetales-A'],
    sources: {
      ps: { id: 'ninetales-alola' },
      serebii: { id: '038-a' },
      pd: { id: 'ninetales-alolan' },
      pmd: { id: '0038/0001' },
    },
  },
  jigglypuff: {
    name: ['Jigglypuff'],
    sources: { ps: {}, serebii: { id: '039' }, pd: {}, pmd: { id: '0039' } },
  },
  wigglytuff: {
    name: ['Wigglytuff'],
    sources: {
      ps: {},
      serebii: { id: '040' },
      pd: { flip: true },
      pmd: { id: '0040' },
    },
  },
  zubat: {
    name: ['Zubat'],
    sources: { ps: {}, serebii: { id: '041' }, pd: {}, pmd: { id: '0041' } },
  },
  golbat: {
    name: ['Golbat'],
    sources: { ps: {}, serebii: { id: '042' }, pd: {}, pmd: { id: '0042' } },
  },
  oddish: {
    name: ['Oddish'],
    sources: { ps: {}, serebii: { id: '043' }, pd: {}, pmd: { id: '0043' } },
  },
  gloom: {
    name: ['Gloom'],
    sources: { ps: {}, serebii: { id: '044' }, pd: {}, pmd: { id: '0044' } },
  },
  vileplume: {
    name: ['Vileplume'],
    sources: { ps: {}, serebii: { id: '045' }, pd: {}, pmd: { id: '0045' } },
  },
  paras: {
    name: ['Paras'],
    sources: { ps: {}, serebii: { id: '046' }, pd: {}, pmd: { id: '0046' } },
  },
  parasect: {
    name: ['Parasect'],
    sources: { ps: {}, serebii: { id: '047' }, pd: {}, pmd: { id: '0047' } },
  },
  venonat: {
    name: ['Venonat'],
    sources: {
      ps: {},
      serebii: { id: '048' },
      pd: { flip: true },
      pmd: { id: '0048' },
    },
  },
  venomoth: {
    name: ['Venomoth'],
    sources: { ps: {}, serebii: { id: '049' }, pd: {}, pmd: { id: '0049' } },
  },
  diglett: {
    name: ['Diglett'],
    sources: { ps: {}, serebii: { id: '050' }, pd: {}, pmd: { id: '0050' } },
  },
  diglettalola: {
    name: ['Alolan Diglett', 'Diglett-Alola', 'Diglett-A'],
    sources: {
      ps: { id: 'diglett-alola' },
      serebii: { id: '050-a' },
      pd: { id: 'diglett-alolan' },
      pmd: { id: '0050/0001' },
    },
  },
  dugtrio: {
    name: ['Dugtrio'],
    sources: { ps: {}, serebii: { id: '051' }, pd: {}, pmd: { id: '0051' } },
  },
  dugtrioalola: {
    name: ['Alolan Dugtrio', 'Dugtrio-Alola', 'Dugtrio-A'],
    sources: {
      ps: { id: 'dugtrio-alola' },
      serebii: { id: '051-a' },
      pd: { id: 'dugtrio-alolan' },
      pmd: { id: '0051/0001' },
    },
  },
  meowth: {
    name: ['Meowth'],
    sources: { ps: {}, serebii: { id: '052' }, pd: {}, pmd: { id: '0052' } },
  },
  meowthalola: {
    name: ['Alolan Meowth', 'Meowth-Alola', 'Meowth-A'],
    sources: {
      ps: { id: 'meowth-alola' },
      serebii: { id: '052-a' },
      pd: { id: 'meowth-alolan' },
      pmd: { id: '0052/0001' },
    },
  },
  meowthgalar: {
    name: ['Galarian Meowth', 'Meowth-Galar', 'Meowth-G'],
    sources: {
      ps: { id: 'meowth-galar' },
      serebii: { id: '052-g' },
      pd: { id: 'meowth-galarian' },
      pmd: { id: '0052/0002' },
    },
  },
  meowthgmax: {
    name: ['Meowth-Gmax'],
    sources: {
      ps: { id: 'meowth-gmax' },
      serebii: { id: '052-gi' },
      pd: { id: 'meowth-gigantamax' },
      pmd: { id: '0052' },
    },
  },
  persian: {
    name: ['Persian'],
    sources: { ps: {}, serebii: { id: '053' }, pd: {}, pmd: { id: '0053' } },
  },
  persianalola: {
    name: ['Alolan Persian', 'Persian-Alola', 'Persian-A'],
    sources: {
      ps: { id: 'persian-alola' },
      serebii: { id: '053-a' },
      pd: { id: 'persian-alolan' },
      pmd: { id: '0053/0001' },
    },
  },
  psyduck: {
    name: ['Psyduck'],
    sources: { ps: {}, serebii: { id: '054' }, pd: {}, pmd: { id: '0054' } },
  },
  golduck: {
    name: ['Golduck'],
    sources: { ps: {}, serebii: { id: '055' }, pd: {}, pmd: { id: '0055' } },
  },
  mankey: {
    name: ['Mankey'],
    sources: { ps: {}, serebii: { id: '056' }, pd: {}, pmd: { id: '0056' } },
  },
  primeape: {
    name: ['Primeape'],
    sources: { ps: {}, serebii: { id: '057' }, pd: {}, pmd: { id: '0057' } },
  },
  growlithe: {
    name: ['Growlithe'],
    sources: { ps: {}, serebii: { id: '058' }, pd: {}, pmd: { id: '0058' } },
  },
  growlithehisui: {
    name: ['Hisuian Growlithe', 'Growlithe-Hisui', 'Growlithe-H'],
    sources: {
      ps: { id: 'growlithe-hisui' },
      serebii: { id: '058-h' },
      pd: { id: 'growlithe-hisuian' },
      pmd: { id: '0058/0001' },
    },
  },
  arcanine: {
    name: ['Arcanine'],
    sources: { ps: {}, serebii: { id: '059' }, pd: {}, pmd: { id: '0059' } },
  },
  arcaninehisui: {
    name: ['Hisuian Arcanine', 'Arcanine-Hisui', 'Arcanine-H'],
    sources: {
      ps: { id: 'arcanine-hisui' },
      serebii: { id: '059-h' },
      pd: { id: 'arcanine-hisuian' },
      pmd: { id: '0059/0001' },
    },
  },
  poliwag: {
    name: ['Poliwag'],
    sources: {
      ps: {},
      serebii: { id: '060' },
      pd: { flip: true },
      pmd: { id: '0060' },
    },
  },
  poliwhirl: {
    name: ['Poliwhirl'],
    sources: { ps: {}, serebii: { id: '061' }, pd: {}, pmd: { id: '0061' } },
  },
  poliwrath: {
    name: ['Poliwrath'],
    sources: { ps: {}, serebii: { id: '062' }, pd: {}, pmd: { id: '0062' } },
  },
  abra: {
    name: ['Abra'],
    sources: { ps: {}, serebii: { id: '063' }, pd: {}, pmd: { id: '0063' } },
  },
  kadabra: {
    name: ['Kadabra'],
    sources: {
      ps: {},
      serebii: { id: '064' },
      pd: { flip: true },
      pmd: { id: '0064' },
    },
  },
  alakazam: {
    name: ['Alakazam'],
    sources: { ps: {}, serebii: { id: '065' }, pd: {}, pmd: { id: '0065' } },
  },
  alakazammega: {
    name: ['Mega Alakazam', 'Alakazam-Mega'],
    sources: {
      ps: { id: 'alakazam-mega' },
      serebii: { id: '065-m' },
      pd: { id: 'alakazam-mega' },
      pmd: { id: '0065/0001' },
    },
  },
  machop: {
    name: ['Machop'],
    sources: { ps: {}, serebii: { id: '066' }, pd: {}, pmd: { id: '0066' } },
  },
  machoke: {
    name: ['Machoke'],
    sources: { ps: {}, serebii: { id: '067' }, pd: {}, pmd: { id: '0067' } },
  },
  machamp: {
    name: ['Machamp'],
    sources: {
      ps: {},
      serebii: { id: '068' },
      pd: { flip: true },
      pmd: { id: '0068' },
    },
  },
  machampgmax: {
    name: ['Machamp-Gmax'],
    sources: {
      ps: { id: 'machamp-gmax' },
      serebii: { id: '068-gi' },
      pd: { id: 'machamp-gigantamax' },
      pmd: { id: '0068' },
    },
  },
  machampmega: {
    name: ['Mega Machamp', 'Machamp-Mega'],
    sources: {
      ps: { id: 'machamp-gmax' },
      serebii: { id: '068-gi' },
      pd: { id: 'machamp-gigantamax' },
      pmd: { id: '0068' },
    },
  },
  bellsprout: {
    name: ['Bellsprout'],
    sources: { ps: {}, serebii: { id: '069' }, pd: {}, pmd: { id: '0069' } },
  },
  weepinbell: {
    name: ['Weepinbell'],
    sources: { ps: {}, serebii: { id: '070' }, pd: {}, pmd: { id: '0070' } },
  },
  victreebel: {
    name: ['Victreebel'],
    sources: { ps: {}, serebii: { id: '071' }, pd: {}, pmd: { id: '0071' } },
  },
  tentacool: {
    name: ['Tentacool'],
    sources: { ps: {}, serebii: { id: '072' }, pd: {}, pmd: { id: '0072' } },
  },
  tentacruel: {
    name: ['Tentacruel'],
    sources: { ps: {}, serebii: { id: '073' }, pd: {}, pmd: { id: '0073' } },
  },
  geodude: {
    name: ['Geodude'],
    sources: { ps: {}, serebii: { id: '074' }, pd: {}, pmd: { id: '0074' } },
  },
  geodudealola: {
    name: ['Alolan Geodude', 'Geodude-Alola', 'Geodude-A'],
    sources: {
      ps: { id: 'geodude-alola' },
      serebii: { id: '074-a' },
      pd: { id: 'geodude-alolan' },
      pmd: { id: '0074/0001' },
    },
  },
  graveler: {
    name: ['Graveler'],
    sources: { ps: {}, serebii: { id: '075' }, pd: {}, pmd: { id: '0075' } },
  },
  graveleralola: {
    name: ['Alolan Graveler', 'Graveler-Alola', 'Graveler-A'],
    sources: {
      ps: { id: 'graveler-alola' },
      serebii: { id: '075-a' },
      pd: { id: 'graveler-alolan' },
      pmd: { id: '0075/0001' },
    },
  },
  golem: {
    name: ['Golem'],
    sources: { ps: {}, serebii: { id: '076' }, pd: {}, pmd: { id: '0076' } },
  },
  golemalola: {
    name: ['Alolan Golem', 'Golem-Alola', 'Golem-A'],
    sources: {
      ps: { id: 'golem-alola' },
      serebii: { id: '076-a' },
      pd: { id: 'golem-alolan' },
      pmd: { id: '0076/0001' },
    },
  },
  ponyta: {
    name: ['Ponyta'],
    sources: { ps: {}, serebii: { id: '077' }, pd: {}, pmd: { id: '0077' } },
  },
  ponytagalar: {
    name: ['Galarian Ponyta', 'Ponyta-Galar', 'Ponyta-G'],
    sources: {
      ps: { id: 'ponyta-galar' },
      serebii: { id: '077-g' },
      pd: { id: 'ponyta-galarian' },
      pmd: { id: '0077/0001' },
    },
  },
  rapidash: {
    name: ['Rapidash'],
    sources: { ps: {}, serebii: { id: '078' }, pd: {}, pmd: { id: '0078' } },
  },
  rapidashgalar: {
    name: ['Galarian Rapidash', 'Rapidash-Galar', 'Rapidash-G'],
    sources: {
      ps: { id: 'rapidash-galar' },
      serebii: { id: '078-g' },
      pd: { id: 'rapidash-galarian', flip: true },
      pmd: { id: '0078/0001' },
    },
  },
  slowpoke: {
    name: ['Slowpoke'],
    sources: { ps: {}, serebii: { id: '079' }, pd: {}, pmd: { id: '0079' } },
  },
  slowpokegalar: {
    name: ['Galarian Slowpoke', 'Slowpoke-Galar', 'Slowpoke-G'],
    sources: {
      ps: { id: 'slowpoke-galar' },
      serebii: { id: '079-g' },
      pd: { id: 'slowpoke-galarian' },
      pmd: { id: '0079/0001' },
    },
  },
  slowbro: {
    name: ['Slowbro'],
    sources: { ps: {}, serebii: { id: '080' }, pd: {}, pmd: { id: '0080' } },
  },
  slowbromega: {
    name: ['Mega Slowbro', 'Slowbro-Mega'],
    sources: {
      ps: { id: 'slowbro-mega' },
      serebii: { id: '080-m' },
      pd: { id: 'slowbro-mega' },
      pmd: { id: '0080/0002' },
    },
  },
  slowbrogalar: {
    name: ['Galarian Slowbro', 'Slowbro-Galar', 'Slowbro-G'],
    sources: {
      ps: { id: 'slowbro-galar' },
      serebii: { id: '080-g' },
      pd: { id: 'slowbro-galarian', flip: true },
      pmd: { id: '0080/0001' },
    },
  },
  magnemite: {
    name: ['Magnemite'],
    sources: { ps: {}, serebii: { id: '081' }, pd: {}, pmd: { id: '0081' } },
  },
  magneton: {
    name: ['Magneton'],
    sources: {
      ps: {},
      serebii: { id: '082' },
      pd: { flip: true },
      pmd: { id: '0082' },
    },
  },
  farfetchd: {
    name: ['Farfetch’d'],
    sources: {
      ps: {},
      serebii: { id: '083' },
      pd: { flip: true },
      pmd: { id: '0083' },
    },
  },
  farfetchdgalar: {
    name: ['Galarian Farfetch’d', 'Farfetch’d-Galar', 'Farfetch’d-G'],
    sources: {
      ps: { id: 'farfetchd-galar' },
      serebii: { id: '083-g' },
      pd: { id: 'farfetchd-galarian' },
      pmd: { id: '0083/0001' },
    },
  },
  doduo: {
    name: ['Doduo'],
    sources: { ps: {}, serebii: { id: '084' }, pd: {}, pmd: { id: '0084' } },
  },
  dodrio: {
    name: ['Dodrio'],
    sources: { ps: {}, serebii: { id: '085' }, pd: {}, pmd: { id: '0085' } },
  },
  seel: {
    name: ['Seel'],
    sources: { ps: {}, serebii: { id: '086' }, pd: {}, pmd: { id: '0086' } },
  },
  dewgong: {
    name: ['Dewgong'],
    sources: { ps: {}, serebii: { id: '087' }, pd: {}, pmd: { id: '0087' } },
  },
  grimer: {
    name: ['Grimer'],
    sources: { ps: {}, serebii: { id: '088' }, pd: {}, pmd: { id: '0088' } },
  },
  grimeralola: {
    name: ['Alolan Grimer', 'Grimer-Alola', 'Grimer-A'],
    sources: {
      ps: { id: 'grimer-alola' },
      serebii: { id: '088-a' },
      pd: { id: 'grimer-alolan' },
      pmd: { id: '0088/0001' },
    },
  },
  muk: {
    name: ['Muk'],
    sources: {
      ps: {},
      serebii: { id: '089' },
      pd: { flip: true },
      pmd: { id: '0089' },
    },
  },
  mukalola: {
    name: ['Alolan Muk', 'Muk-Alola', 'Muk-A'],
    sources: {
      ps: { id: 'muk-alola' },
      serebii: { id: '089-a' },
      pd: { id: 'muk-alolan' },
      pmd: { id: '0089/0001' },
    },
  },
  shellder: {
    name: ['Shellder'],
    sources: { ps: {}, serebii: { id: '090' }, pd: {}, pmd: { id: '0090' } },
  },
  cloyster: {
    name: ['Cloyster'],
    sources: { ps: {}, serebii: { id: '091' }, pd: {}, pmd: { id: '0091' } },
  },
  gastly: {
    name: ['Gastly'],
    sources: { ps: {}, serebii: { id: '092' }, pd: {}, pmd: { id: '0092' } },
  },
  haunter: {
    name: ['Haunter'],
    sources: { ps: {}, serebii: { id: '093' }, pd: {}, pmd: { id: '0093' } },
  },
  gengar: {
    name: ['Gengar'],
    sources: { ps: {}, serebii: { id: '094' }, pd: {}, pmd: { id: '0094' } },
  },
  gengarmega: {
    name: ['Mega Gengar', 'Gengar-Mega'],
    sources: {
      ps: { id: 'gengar-mega' },
      serebii: { id: '094-m' },
      pd: { id: 'gengar-mega' },
      pmd: { id: '0094/0001' },
    },
  },
  gengargmax: {
    name: ['Gengar-Gmax'],
    sources: {
      ps: { id: 'gengar-gmax' },
      serebii: { id: '094-gi' },
      pd: { id: 'gengar-gigantamax', flip: true },
      pmd: { id: '0094' },
    },
  },
  onix: {
    name: ['Onix'],
    sources: { ps: {}, serebii: { id: '095' }, pd: {}, pmd: { id: '0095' } },
  },
  drowzee: {
    name: ['Drowzee'],
    sources: {
      ps: {},
      serebii: { id: '096' },
      pd: { flip: true },
      pmd: { id: '0096' },
    },
  },
  hypno: {
    name: ['Hypno'],
    sources: { ps: {}, serebii: { id: '097' }, pd: {}, pmd: { id: '0097' } },
  },
  krabby: {
    name: ['Krabby'],
    sources: { ps: {}, serebii: { id: '098' }, pd: {}, pmd: { id: '0098' } },
  },
  kingler: {
    name: ['Kingler'],
    sources: { ps: {}, serebii: { id: '099' }, pd: {}, pmd: { id: '0099' } },
  },
  kinglergmax: {
    name: ['Kingler-Gmax'],
    sources: {
      ps: { id: 'kingler-gmax' },
      serebii: { id: '099-gi' },
      pd: { id: 'kingler-gigantamax' },
      pmd: { id: '0099' },
    },
  },
  kinglermega: {
    name: ['Mega Kingler', 'Kingler-Mega'],
    sources: {
      ps: { id: 'kingler-gmax' },
      serebii: { id: '099-gi' },
      pd: { id: 'kingler-gigantamax' },
      pmd: { id: '0099' },
    },
  },
  voltorb: {
    name: ['Voltorb'],
    sources: {
      ps: {},
      serebii: { id: '100' },
      pd: { flip: true },
      pmd: { id: '0100' },
    },
  },
  voltorbhisui: {
    name: ['Hisuian Voltorb', 'Voltorb-Hisui', 'Voltorb-H'],
    sources: {
      ps: { id: 'voltorb-hisui' },
      serebii: { id: '100-h' },
      pd: { id: 'voltorb-hisuian', flip: true },
      pmd: { id: '0100/0001' },
    },
  },
  electrode: {
    name: ['Electrode'],
    sources: { ps: {}, serebii: { id: '101' }, pd: {}, pmd: { id: '0101' } },
  },
  electrodehisui: {
    name: ['Hisuian Electrode', 'Electrode-Hisui', 'Electrode-H'],
    sources: {
      ps: { id: 'electrode-hisui' },
      serebii: { id: '101-h' },
      pd: { id: 'electrode-hisuian', flip: true },
      pmd: { id: '0101/0001' },
    },
  },
  exeggcute: {
    name: ['Exeggcute'],
    sources: { ps: {}, serebii: { id: '102' }, pd: {}, pmd: { id: '0102' } },
  },
  exeggutor: {
    name: ['Exeggutor'],
    sources: { ps: {}, serebii: { id: '103' }, pd: {}, pmd: { id: '0103' } },
  },
  exeggutoralola: {
    name: ['Alolan Exeggutor', 'Exeggutor-Alola', 'Exeggutor-A'],
    sources: {
      ps: { id: 'exeggutor-alola' },
      serebii: { id: '103-a' },
      pd: { id: 'exeggutor-alolan' },
      pmd: { id: '0103/0001' },
    },
  },
  cubone: {
    name: ['Cubone'],
    sources: { ps: {}, serebii: { id: '104' }, pd: {}, pmd: { id: '0104' } },
  },
  marowak: {
    name: ['Marowak'],
    sources: { ps: {}, serebii: { id: '105' }, pd: {}, pmd: { id: '0105' } },
  },
  marowakalola: {
    name: ['Alolan Marowak', 'Marowak-Alola', 'Marowak-A'],
    sources: {
      ps: { id: 'marowak-alola' },
      serebii: { id: '105-a' },
      pd: { id: 'marowak-alolan' },
      pmd: { id: '0105/0001' },
    },
  },
  hitmonlee: {
    name: ['Hitmonlee'],
    sources: {
      ps: {},
      serebii: { id: '106' },
      pd: { flip: true },
      pmd: { id: '0106' },
    },
  },
  hitmonchan: {
    name: ['Hitmonchan'],
    sources: { ps: {}, serebii: { id: '107' }, pd: {}, pmd: { id: '0107' } },
  },
  lickitung: {
    name: ['Lickitung'],
    sources: { ps: {}, serebii: { id: '108' }, pd: {}, pmd: { id: '0108' } },
  },
  koffing: {
    name: ['Koffing'],
    sources: { ps: {}, serebii: { id: '109' }, pd: {}, pmd: { id: '0109' } },
  },
  weezing: {
    name: ['Weezing'],
    sources: { ps: {}, serebii: { id: '110' }, pd: {}, pmd: { id: '0110' } },
  },
  weezinggalar: {
    name: ['Galarian Weezing', 'Weezing-Galar', 'Weezing-G'],
    sources: {
      ps: { id: 'weezing-galar' },
      serebii: { id: '110-g' },
      pd: { id: 'weezing-galarian' },
      pmd: { id: '0110/0001' },
    },
  },
  rhyhorn: {
    name: ['Rhyhorn'],
    sources: { ps: {}, serebii: { id: '111' }, pd: {}, pmd: { id: '0111' } },
  },
  rhydon: {
    name: ['Rhydon'],
    sources: { ps: {}, serebii: { id: '112' }, pd: {}, pmd: { id: '0112' } },
  },
  chansey: {
    name: ['Chansey'],
    sources: { ps: {}, serebii: { id: '113' }, pd: {}, pmd: { id: '0113' } },
  },
  tangela: {
    name: ['Tangela'],
    sources: {
      ps: {},
      serebii: { id: '114' },
      pd: { flip: true },
      pmd: { id: '0114' },
    },
  },
  kangaskhan: {
    name: ['Kangaskhan'],
    sources: { ps: {}, serebii: { id: '115' }, pd: {}, pmd: { id: '0115' } },
  },
  kangaskhanmega: {
    name: ['Mega Kangaskhan', 'Kangaskhan-Mega'],
    sources: {
      ps: { id: 'kangaskhan-mega' },
      serebii: { id: '115-m' },
      pd: { id: 'kangaskhan-mega', flip: true },
      pmd: { id: '0115' },
    },
  },
  horsea: {
    name: ['Horsea'],
    sources: { ps: {}, serebii: { id: '116' }, pd: {}, pmd: { id: '0116' } },
  },
  seadra: {
    name: ['Seadra'],
    sources: { ps: {}, serebii: { id: '117' }, pd: {}, pmd: { id: '0117' } },
  },
  goldeen: {
    name: ['Goldeen'],
    sources: {
      ps: {},
      serebii: { id: '118' },
      pd: { flip: true },
      pmd: { id: '0118' },
    },
  },
  seaking: {
    name: ['Seaking'],
    sources: { ps: {}, serebii: { id: '119' }, pd: {}, pmd: { id: '0119' } },
  },
  staryu: {
    name: ['Staryu'],
    sources: { ps: {}, serebii: { id: '120' }, pd: {}, pmd: { id: '0120' } },
  },
  starmie: {
    name: ['Starmie'],
    sources: { ps: {}, serebii: { id: '121' }, pd: {}, pmd: { id: '0121' } },
  },
  mrmime: {
    name: ['Mr. Mime'],
    sources: {
      ps: {},
      serebii: { id: '122' },
      pd: { id: 'mr-mime' },
      pmd: { id: '0122' },
    },
  },
  mrmimegalar: {
    name: ['Galarian Mr. Mime', 'Mr. Mime-Galar', 'Mr. Mime-G'],
    sources: {
      ps: { id: 'mrmime-galar' },
      serebii: { id: '122-g' },
      pd: { id: 'mr-mime-galarian' },
      pmd: { id: '0122/0001' },
    },
  },
  scyther: {
    name: ['Scyther'],
    sources: { ps: {}, serebii: { id: '123' }, pd: {}, pmd: { id: '0123' } },
  },
  jynx: {
    name: ['Jynx'],
    sources: { ps: {}, serebii: { id: '124' }, pd: {}, pmd: { id: '0124' } },
  },
  electabuzz: {
    name: ['Electabuzz'],
    sources: {
      ps: {},
      serebii: { id: '125' },
      pd: { flip: true },
      pmd: { id: '0125' },
    },
  },
  magmar: {
    name: ['Magmar'],
    sources: { ps: {}, serebii: { id: '126' }, pd: {}, pmd: { id: '0126' } },
  },
  pinsir: {
    name: ['Pinsir'],
    sources: { ps: {}, serebii: { id: '127' }, pd: {}, pmd: { id: '0127' } },
  },
  pinsirmega: {
    name: ['Mega Pinsir', 'Pinsir-Mega'],
    sources: {
      ps: { id: 'pinsir-mega' },
      serebii: { id: '127-m' },
      pd: { id: 'pinsir-mega' },
      pmd: { id: '0127/0001' },
    },
  },
  tauros: {
    name: ['Tauros'],
    sources: { ps: {}, serebii: { id: '128' }, pd: {}, pmd: { id: '0128' } },
  },
  taurospaldeacombat: {
    name: ['Paldean Tauros Combat', 'Tauros-Paldea-Combat', 'Tauros-P'],
    sources: {
      ps: { id: 'tauros-paldeacombat' },
      serebii: { id: '128-p' },
      pd: { id: 'tauros-paldean-combat' },
      pmd: { id: '0128/0001' },
    },
  },
  taurospaldeablaze: {
    name: ['Paldean Tauros Blaze', 'Tauros-Paldea-Blaze', 'Tauros-P'],
    sources: {
      ps: { id: 'tauros-paldeablaze' },
      serebii: { id: '128-b' },
      pd: { id: 'tauros-paldean-blaze', flip: true },
      pmd: { id: '0128/0002' },
    },
  },
  taurospaldeaaqua: {
    name: ['Paldean Tauros Aqua', 'Tauros-Paldea-Aqua', 'Tauros-P'],
    sources: {
      ps: { id: 'tauros-paldeaaqua' },
      serebii: { id: '128-a' },
      pd: { id: 'tauros-paldean-aqua' },
      pmd: { id: '0128/0003' },
    },
  },
  magikarp: {
    name: ['Magikarp'],
    sources: { ps: {}, serebii: { id: '129' }, pd: {}, pmd: { id: '0129' } },
  },
  gyarados: {
    name: ['Gyarados'],
    sources: { ps: {}, serebii: { id: '130' }, pd: {}, pmd: { id: '0130' } },
  },
  gyaradosmega: {
    name: ['Mega Gyarados', 'Gyarados-Mega'],
    sources: {
      ps: { id: 'gyarados-mega' },
      serebii: { id: '130-m' },
      pd: { id: 'gyarados-mega' },
      pmd: { id: '0130/0001' },
    },
  },
  lapras: {
    name: ['Lapras'],
    sources: {
      ps: {},
      serebii: { id: '131' },
      pd: { flip: true },
      pmd: { id: '0131' },
    },
  },
  laprasgmax: {
    name: ['Lapras-Gmax'],
    sources: {
      ps: { id: 'lapras-gmax' },
      serebii: { id: '131-gi' },
      pd: { id: 'lapras-gigantamax' },
      pmd: { id: '0131' },
    },
  },
  laprasmega: {
    name: ['Mega Lapras', 'Lapras-Mega'],
    sources: {
      ps: { id: 'lapras-gmax' },
      serebii: { id: '131-gi' },
      pd: { id: 'lapras-gigantamax' },
      pmd: { id: '0131' },
    },
  },
  ditto: {
    name: ['Ditto'],
    sources: { ps: {}, serebii: { id: '132' }, pd: {}, pmd: { id: '0132' } },
  },
  eevee: {
    name: ['Eevee'],
    sources: { ps: {}, serebii: { id: '133' }, pd: {}, pmd: { id: '0133' } },
  },
  eeveestarter: {
    name: ['Eevee-Starter'],
    sources: {
      ps: { id: 'eevee-starter' },
      serebii: { id: '133' },
      pd: { id: 'eevee' },
      pmd: { id: '0133/0001' },
    },
  },
  eeveegmax: {
    name: ['Eevee-Gmax'],
    sources: {
      ps: { id: 'eevee-gmax' },
      serebii: { id: '133-gi' },
      pd: { id: 'eevee-gigantamax', flip: true },
      pmd: { id: '0133' },
    },
  },
  vaporeon: {
    name: ['Vaporeon'],
    sources: { ps: {}, serebii: { id: '134' }, pd: {}, pmd: { id: '0134' } },
  },
  jolteon: {
    name: ['Jolteon'],
    sources: { ps: {}, serebii: { id: '135' }, pd: {}, pmd: { id: '0135' } },
  },
  flareon: {
    name: ['Flareon'],
    sources: { ps: {}, serebii: { id: '136' }, pd: {}, pmd: { id: '0136' } },
  },
  porygon: {
    name: ['Porygon'],
    sources: { ps: {}, serebii: { id: '137' }, pd: {}, pmd: { id: '0137' } },
  },
  omanyte: {
    name: ['Omanyte'],
    sources: {
      ps: {},
      serebii: { id: '138' },
      pd: { flip: true },
      pmd: { id: '0138' },
    },
  },
  omastar: {
    name: ['Omastar'],
    sources: { ps: {}, serebii: { id: '139' }, pd: {}, pmd: { id: '0139' } },
  },
  kabuto: {
    name: ['Kabuto'],
    sources: { ps: {}, serebii: { id: '140' }, pd: {}, pmd: { id: '0140' } },
  },
  kabutops: {
    name: ['Kabutops'],
    sources: { ps: {}, serebii: { id: '141' }, pd: {}, pmd: { id: '0141' } },
  },
  aerodactyl: {
    name: ['Aerodactyl'],
    sources: { ps: {}, serebii: { id: '142' }, pd: {}, pmd: { id: '0142' } },
  },
  aerodactylmega: {
    name: ['Mega Aerodactyl', 'Aerodactyl-Mega'],
    sources: {
      ps: { id: 'aerodactyl-mega' },
      serebii: { id: '142-m' },
      pd: { id: 'aerodactyl-mega' },
      pmd: { id: '0142/0001' },
    },
  },
  snorlax: {
    name: ['Snorlax'],
    sources: { ps: {}, serebii: { id: '143' }, pd: {}, pmd: { id: '0143' } },
  },
  snorlaxgmax: {
    name: ['Snorlax-Gmax'],
    sources: {
      ps: { id: 'snorlax-gmax' },
      serebii: { id: '143-gi' },
      pd: { id: 'snorlax-gigantamax' },
      pmd: { id: '0143' },
    },
  },
  snorlaxmega: {
    name: ['Mega Snorlax', 'Snorlax-Mega'],
    sources: {
      ps: { id: 'snorlax-gmax' },
      serebii: { id: '143-gi' },
      pd: { id: 'snorlax-gigantamax' },
      pmd: { id: '0143' },
    },
  },
  articuno: {
    name: ['Articuno'],
    sources: { ps: {}, serebii: { id: '144' }, pd: {}, pmd: { id: '0144' } },
  },
  articunogalar: {
    name: ['Galarian Articuno', 'Articuno-Galar', 'Articuno-G'],
    sources: {
      ps: { id: 'articuno-galar' },
      serebii: { id: '144-g' },
      pd: { id: 'articuno-galarian' },
      pmd: { id: '0144/0001' },
    },
  },
  zapdos: {
    name: ['Zapdos'],
    sources: { ps: {}, serebii: { id: '145' }, pd: {}, pmd: { id: '0145' } },
  },
  zapdosgalar: {
    name: ['Galarian Zapdos', 'Zapdos-Galar', 'Zapdos-G'],
    sources: {
      ps: { id: 'zapdos-galar' },
      serebii: { id: '145-g' },
      pd: { id: 'zapdos-galarian', flip: true },
      pmd: { id: '0145/0001' },
    },
  },
  moltres: {
    name: ['Moltres'],
    sources: {
      ps: {},
      serebii: { id: '146' },
      pd: { flip: true },
      pmd: { id: '0146' },
    },
  },
  moltresgalar: {
    name: ['Galarian Moltres', 'Moltres-Galar', 'Moltres-G'],
    sources: {
      ps: { id: 'moltres-galar' },
      serebii: { id: '146-g' },
      pd: { id: 'moltres-galarian' },
      pmd: { id: '0146/0001' },
    },
  },
  dratini: {
    name: ['Dratini'],
    sources: {
      ps: {},
      serebii: { id: '147' },
      pd: { flip: true },
      pmd: { id: '0147' },
    },
  },
  dragonair: {
    name: ['Dragonair'],
    sources: { ps: {}, serebii: { id: '148' }, pd: {}, pmd: { id: '0148' } },
  },
  dragonite: {
    name: ['Dragonite'],
    sources: { ps: {}, serebii: { id: '149' }, pd: {}, pmd: { id: '0149' } },
  },
  mewtwo: {
    name: ['Mewtwo'],
    sources: { ps: {}, serebii: { id: '150' }, pd: {}, pmd: { id: '0150' } },
  },
  mewtwomegax: {
    name: ['Mega Mewtwo X', 'Mewtwo-Mega-X'],
    sources: {
      ps: { id: 'mewtwo-megax' },
      serebii: { id: '150-mx' },
      pd: { id: 'mewtwo-mega-x', flip: true },
      pmd: { id: '0150/0001' },
    },
  },
  mewtwomegay: {
    name: ['Mega Mewtwo Y', 'Mewtwo-Mega-Y'],
    sources: {
      ps: { id: 'mewtwo-megay' },
      serebii: { id: '150-my' },
      pd: { id: 'mewtwo-mega-y' },
      pmd: { id: '0150/0002' },
    },
  },
  mew: {
    name: ['Mew'],
    sources: { ps: {}, serebii: { id: '151' }, pd: {}, pmd: { id: '0151' } },
  },
  chikorita: {
    name: ['Chikorita'],
    sources: { ps: {}, serebii: { id: '152' }, pd: {}, pmd: { id: '0152' } },
  },
  bayleef: {
    name: ['Bayleef'],
    sources: { ps: {}, serebii: { id: '153' }, pd: {}, pmd: { id: '0153' } },
  },
  meganium: {
    name: ['Meganium'],
    sources: { ps: {}, serebii: { id: '154' }, pd: {}, pmd: { id: '0154' } },
  },
  cyndaquil: {
    name: ['Cyndaquil'],
    sources: {
      ps: {},
      serebii: { id: '155' },
      pd: { flip: true },
      pmd: { id: '0155' },
    },
  },
  quilava: {
    name: ['Quilava'],
    sources: {
      ps: {},
      serebii: { id: '156' },
      pd: { flip: true },
      pmd: { id: '0156' },
    },
  },
  typhlosion: {
    name: ['Typhlosion'],
    sources: { ps: {}, serebii: { id: '157' }, pd: {}, pmd: { id: '0157' } },
  },
  typhlosionhisui: {
    name: ['Hisuian Typhlosion', 'Typhlosion-Hisui', 'Typhlosion-H'],
    sources: {
      ps: { id: 'typhlosion-hisui' },
      serebii: { id: '157-h' },
      pd: { id: 'typhlosion-hisuian', flip: true },
      pmd: { id: '0157/0001' },
    },
  },
  totodile: {
    name: ['Totodile'],
    sources: { ps: {}, serebii: { id: '158' }, pd: {}, pmd: { id: '0158' } },
  },
  croconaw: {
    name: ['Croconaw'],
    sources: { ps: {}, serebii: { id: '159' }, pd: {}, pmd: { id: '0159' } },
  },
  feraligatr: {
    name: ['Feraligatr'],
    sources: { ps: {}, serebii: { id: '160' }, pd: {}, pmd: { id: '0160' } },
  },
  sentret: {
    name: ['Sentret'],
    sources: { ps: {}, serebii: { id: '161' }, pd: {}, pmd: { id: '0161' } },
  },
  furret: {
    name: ['Furret'],
    sources: { ps: {}, serebii: { id: '162' }, pd: {}, pmd: { id: '0162' } },
  },
  hoothoot: {
    name: ['Hoothoot'],
    sources: {
      ps: {},
      serebii: { id: '163' },
      pd: { flip: true },
      pmd: { id: '0163' },
    },
  },
  noctowl: {
    name: ['Noctowl'],
    sources: { ps: {}, serebii: { id: '164' }, pd: {}, pmd: { id: '0164' } },
  },
  ledyba: {
    name: ['Ledyba'],
    sources: { ps: {}, serebii: { id: '165' }, pd: {}, pmd: { id: '0165' } },
  },
  ledian: {
    name: ['Ledian'],
    sources: { ps: {}, serebii: { id: '166' }, pd: {}, pmd: { id: '0166' } },
  },
  spinarak: {
    name: ['Spinarak'],
    sources: { ps: {}, serebii: { id: '167' }, pd: {}, pmd: { id: '0167' } },
  },
  ariados: {
    name: ['Ariados'],
    sources: { ps: {}, serebii: { id: '168' }, pd: {}, pmd: { id: '0168' } },
  },
  crobat: {
    name: ['Crobat'],
    sources: {
      ps: {},
      serebii: { id: '169' },
      pd: { flip: true },
      pmd: { id: '0169' },
    },
  },
  chinchou: {
    name: ['Chinchou'],
    sources: { ps: {}, serebii: { id: '170' }, pd: {}, pmd: { id: '0170' } },
  },
  lanturn: {
    name: ['Lanturn'],
    sources: { ps: {}, serebii: { id: '171' }, pd: {}, pmd: { id: '0171' } },
  },
  pichu: {
    name: ['Pichu'],
    sources: { ps: {}, serebii: { id: '172' }, pd: {}, pmd: { id: '0172' } },
  },
  cleffa: {
    name: ['Cleffa'],
    sources: {
      ps: {},
      serebii: { id: '173' },
      pd: { flip: true },
      pmd: { id: '0173' },
    },
  },
  igglybuff: {
    name: ['Igglybuff'],
    sources: { ps: {}, serebii: { id: '174' }, pd: {}, pmd: { id: '0174' } },
  },
  togepi: {
    name: ['Togepi'],
    sources: { ps: {}, serebii: { id: '175' }, pd: {}, pmd: { id: '0175' } },
  },
  togetic: {
    name: ['Togetic'],
    sources: { ps: {}, serebii: { id: '176' }, pd: {}, pmd: { id: '0176' } },
  },
  natu: {
    name: ['Natu'],
    sources: { ps: {}, serebii: { id: '177' }, pd: {}, pmd: { id: '0177' } },
  },
  xatu: {
    name: ['Xatu'],
    sources: { ps: {}, serebii: { id: '178' }, pd: {}, pmd: { id: '0178' } },
  },
  mareep: {
    name: ['Mareep'],
    sources: { ps: {}, serebii: { id: '179' }, pd: {}, pmd: { id: '0179' } },
  },
  flaaffy: {
    name: ['Flaaffy'],
    sources: { ps: {}, serebii: { id: '180' }, pd: {}, pmd: { id: '0180' } },
  },
  ampharos: {
    name: ['Ampharos'],
    sources: { ps: {}, serebii: { id: '181' }, pd: {}, pmd: { id: '0181' } },
  },
  ampharosmega: {
    name: ['Mega Ampharos', 'Ampharos-Mega'],
    sources: {
      ps: { id: 'ampharos-mega' },
      serebii: { id: '181-m' },
      pd: { id: 'ampharos-mega' },
      pmd: { id: '0181/0001' },
    },
  },
  bellossom: {
    name: ['Bellossom'],
    sources: { ps: {}, serebii: { id: '182' }, pd: {}, pmd: { id: '0182' } },
  },
  marill: {
    name: ['Marill'],
    sources: {
      ps: {},
      serebii: { id: '183' },
      pd: { flip: true },
      pmd: { id: '0183' },
    },
  },
  azumarill: {
    name: ['Azumarill'],
    sources: { ps: {}, serebii: { id: '184' }, pd: {}, pmd: { id: '0184' } },
  },
  sudowoodo: {
    name: ['Sudowoodo'],
    sources: { ps: {}, serebii: { id: '185' }, pd: {}, pmd: { id: '0185' } },
  },
  politoed: {
    name: ['Politoed'],
    sources: { ps: {}, serebii: { id: '186' }, pd: {}, pmd: { id: '0186' } },
  },
  hoppip: {
    name: ['Hoppip'],
    sources: { ps: {}, serebii: { id: '187' }, pd: {}, pmd: { id: '0187' } },
  },
  skiploom: {
    name: ['Skiploom'],
    sources: { ps: {}, serebii: { id: '188' }, pd: {}, pmd: { id: '0188' } },
  },
  jumpluff: {
    name: ['Jumpluff'],
    sources: { ps: {}, serebii: { id: '189' }, pd: {}, pmd: { id: '0189' } },
  },
  aipom: {
    name: ['Aipom'],
    sources: { ps: {}, serebii: { id: '190' }, pd: {}, pmd: { id: '0190' } },
  },
  sunkern: {
    name: ['Sunkern'],
    sources: { ps: {}, serebii: { id: '191' }, pd: {}, pmd: { id: '0191' } },
  },
  sunflora: {
    name: ['Sunflora'],
    sources: { ps: {}, serebii: { id: '192' }, pd: {}, pmd: { id: '0192' } },
  },
  yanma: {
    name: ['Yanma'],
    sources: { ps: {}, serebii: { id: '193' }, pd: {}, pmd: { id: '0193' } },
  },
  wooper: {
    name: ['Wooper'],
    sources: {
      ps: {},
      serebii: { id: '194' },
      pd: { flip: true },
      pmd: { id: '0194' },
    },
  },
  wooperpaldea: {
    name: ['Paldean Wooper', 'Wooper-Paldea', 'Wooper-P'],
    sources: {
      ps: { id: 'wooper-paldea' },
      serebii: { id: '194-p' },
      pd: { id: 'wooper-paldean', flip: true },
      pmd: { id: '0194/0002' },
    },
  },
  quagsire: {
    name: ['Quagsire'],
    sources: { ps: {}, serebii: { id: '195' }, pd: {}, pmd: { id: '0195' } },
  },
  espeon: {
    name: ['Espeon'],
    sources: { ps: {}, serebii: { id: '196' }, pd: {}, pmd: { id: '0196' } },
  },
  umbreon: {
    name: ['Umbreon'],
    sources: { ps: {}, serebii: { id: '197' }, pd: {}, pmd: { id: '0197' } },
  },
  murkrow: {
    name: ['Murkrow'],
    sources: { ps: {}, serebii: { id: '198' }, pd: {}, pmd: { id: '0198' } },
  },
  slowking: {
    name: ['Slowking'],
    sources: { ps: {}, serebii: { id: '199' }, pd: {}, pmd: { id: '0199' } },
  },
  slowkinggalar: {
    name: ['Galarian Slowking', 'Slowking-Galar', 'Slowking-G'],
    sources: {
      ps: { id: 'slowking-galar' },
      serebii: { id: '199-g' },
      pd: { id: 'slowking-galarian' },
      pmd: { id: '0199/0001' },
    },
  },
  misdreavus: {
    name: ['Misdreavus'],
    sources: {
      ps: {},
      serebii: { id: '200' },
      pd: { flip: true },
      pmd: { id: '0200' },
    },
  },
  unown: {
    name: ['Unown'],
    sources: { ps: {}, serebii: { id: '201' }, pd: {}, pmd: { id: '0201' } },
  },
  wobbuffet: {
    name: ['Wobbuffet'],
    sources: { ps: {}, serebii: { id: '202' }, pd: {}, pmd: { id: '0202' } },
  },
  girafarig: {
    name: ['Girafarig'],
    sources: { ps: {}, serebii: { id: '203' }, pd: {}, pmd: { id: '0203' } },
  },
  pineco: {
    name: ['Pineco'],
    sources: { ps: {}, serebii: { id: '204' }, pd: {}, pmd: { id: '0204' } },
  },
  forretress: {
    name: ['Forretress'],
    sources: { ps: {}, serebii: { id: '205' }, pd: {}, pmd: { id: '0205' } },
  },
  dunsparce: {
    name: ['Dunsparce'],
    sources: { ps: {}, serebii: { id: '206' }, pd: {}, pmd: { id: '0206' } },
  },
  gligar: {
    name: ['Gligar'],
    sources: { ps: {}, serebii: { id: '207' }, pd: {}, pmd: { id: '0207' } },
  },
  steelix: {
    name: ['Steelix'],
    sources: { ps: {}, serebii: { id: '208' }, pd: {}, pmd: { id: '0208' } },
  },
  steelixmega: {
    name: ['Mega Steelix', 'Steelix-Mega'],
    sources: {
      ps: { id: 'steelix-mega' },
      serebii: { id: '208-m' },
      pd: { id: 'steelix-mega' },
      pmd: { id: '0208/0001' },
    },
  },
  snubbull: {
    name: ['Snubbull'],
    sources: { ps: {}, serebii: { id: '209' }, pd: {}, pmd: { id: '0209' } },
  },
  granbull: {
    name: ['Granbull'],
    sources: {
      ps: {},
      serebii: { id: '210' },
      pd: { flip: true },
      pmd: { id: '0210' },
    },
  },
  qwilfish: {
    name: ['Qwilfish'],
    sources: {
      ps: {},
      serebii: { id: '211' },
      pd: { flip: true },
      pmd: { id: '0211' },
    },
  },
  qwilfishhisui: {
    name: ['Hisuian Qwilfish', 'Qwilfish-Hisui', 'Qwilfish-H'],
    sources: {
      ps: { id: 'qwilfish-hisui' },
      serebii: { id: '211-h' },
      pd: { id: 'qwilfish-hisuian' },
      pmd: { id: '0211/0001' },
    },
  },
  scizor: {
    name: ['Scizor'],
    sources: { ps: {}, serebii: { id: '212' }, pd: {}, pmd: { id: '0212' } },
  },
  scizormega: {
    name: ['Mega Scizor', 'Scizor-Mega'],
    sources: {
      ps: { id: 'scizor-mega' },
      serebii: { id: '212-m' },
      pd: { id: 'scizor-mega' },
      pmd: { id: '0212/0001' },
    },
  },
  shuckle: {
    name: ['Shuckle'],
    sources: {
      ps: {},
      serebii: { id: '213' },
      pd: { flip: true },
      pmd: { id: '0213' },
    },
  },
  heracross: {
    name: ['Heracross'],
    sources: { ps: {}, serebii: { id: '214' }, pd: {}, pmd: { id: '0214' } },
  },
  heracrossmega: {
    name: ['Mega Heracross', 'Heracross-Mega'],
    sources: {
      ps: { id: 'heracross-mega' },
      serebii: { id: '214-m' },
      pd: { id: 'heracross-mega' },
      pmd: { id: '0214/0001' },
    },
  },
  sneasel: {
    name: ['Sneasel'],
    sources: { ps: {}, serebii: { id: '215' }, pd: {}, pmd: { id: '0215' } },
  },
  sneaselhisui: {
    name: ['Hisuian Sneasel', 'Sneasel-Hisui', 'Sneasel-H'],
    sources: {
      ps: { id: 'sneasel-hisui' },
      serebii: { id: '215-h' },
      pd: { id: 'sneasel-hisuian', flip: true },
      pmd: { id: '0215/0001' },
    },
  },
  teddiursa: {
    name: ['Teddiursa'],
    sources: { ps: {}, serebii: { id: '216' }, pd: {}, pmd: { id: '0216' } },
  },
  ursaring: {
    name: ['Ursaring'],
    sources: { ps: {}, serebii: { id: '217' }, pd: {}, pmd: { id: '0217' } },
  },
  slugma: {
    name: ['Slugma'],
    sources: { ps: {}, serebii: { id: '218' }, pd: {}, pmd: { id: '0218' } },
  },
  magcargo: {
    name: ['Magcargo'],
    sources: { ps: {}, serebii: { id: '219' }, pd: {}, pmd: { id: '0219' } },
  },
  swinub: {
    name: ['Swinub'],
    sources: { ps: {}, serebii: { id: '220' }, pd: {}, pmd: { id: '0220' } },
  },
  piloswine: {
    name: ['Piloswine'],
    sources: { ps: {}, serebii: { id: '221' }, pd: {}, pmd: { id: '0221' } },
  },
  corsola: {
    name: ['Corsola'],
    sources: {
      ps: {},
      serebii: { id: '222' },
      pd: { flip: true },
      pmd: { id: '0222' },
    },
  },
  corsolagalar: {
    name: ['Galarian Corsola', 'Corsola-Galar', 'Corsola-G'],
    sources: {
      ps: { id: 'corsola-galar' },
      serebii: { id: '222-g' },
      pd: { id: 'corsola-galarian', flip: true },
      pmd: { id: '0222/0001' },
    },
  },
  remoraid: {
    name: ['Remoraid'],
    sources: { ps: {}, serebii: { id: '223' }, pd: {}, pmd: { id: '0223' } },
  },
  octillery: {
    name: ['Octillery'],
    sources: { ps: {}, serebii: { id: '224' }, pd: {}, pmd: { id: '0224' } },
  },
  delibird: {
    name: ['Delibird'],
    sources: { ps: {}, serebii: { id: '225' }, pd: {}, pmd: { id: '0225' } },
  },
  mantine: {
    name: ['Mantine'],
    sources: { ps: {}, serebii: { id: '226' }, pd: {}, pmd: { id: '0226' } },
  },
  skarmory: {
    name: ['Skarmory'],
    sources: { ps: {}, serebii: { id: '227' }, pd: {}, pmd: { id: '0227' } },
  },
  houndour: {
    name: ['Houndour'],
    sources: { ps: {}, serebii: { id: '228' }, pd: {}, pmd: { id: '0228' } },
  },
  houndoom: {
    name: ['Houndoom'],
    sources: {
      ps: {},
      serebii: { id: '229' },
      pd: { flip: true },
      pmd: { id: '0229' },
    },
  },
  houndoommega: {
    name: ['Mega Houndoom', 'Houndoom-Mega'],
    sources: {
      ps: { id: 'houndoom-mega' },
      serebii: { id: '229-m' },
      pd: { id: 'houndoom-mega' },
      pmd: { id: '0229/0001' },
    },
  },
  kingdra: {
    name: ['Kingdra'],
    sources: { ps: {}, serebii: { id: '230' }, pd: {}, pmd: { id: '0230' } },
  },
  phanpy: {
    name: ['Phanpy'],
    sources: { ps: {}, serebii: { id: '231' }, pd: {}, pmd: { id: '0231' } },
  },
  donphan: {
    name: ['Donphan'],
    sources: { ps: {}, serebii: { id: '232' }, pd: {}, pmd: { id: '0232' } },
  },
  porygon2: {
    name: ['Porygon2'],
    sources: {
      ps: {},
      serebii: { id: '233' },
      pd: { flip: true },
      pmd: { id: '0233' },
    },
  },
  stantler: {
    name: ['Stantler'],
    sources: { ps: {}, serebii: { id: '234' }, pd: {}, pmd: { id: '0234' } },
  },
  smeargle: {
    name: ['Smeargle'],
    sources: { ps: {}, serebii: { id: '235' }, pd: {}, pmd: { id: '0235' } },
  },
  tyrogue: {
    name: ['Tyrogue'],
    sources: { ps: {}, serebii: { id: '236' }, pd: {}, pmd: { id: '0236' } },
  },
  hitmontop: {
    name: ['Hitmontop'],
    sources: {
      ps: {},
      serebii: { id: '237' },
      pd: { flip: true },
      pmd: { id: '0237' },
    },
  },
  smoochum: {
    name: ['Smoochum'],
    sources: { ps: {}, serebii: { id: '238' }, pd: {}, pmd: { id: '0238' } },
  },
  elekid: {
    name: ['Elekid'],
    sources: { ps: {}, serebii: { id: '239' }, pd: {}, pmd: { id: '0239' } },
  },
  magby: {
    name: ['Magby'],
    sources: { ps: {}, serebii: { id: '240' }, pd: {}, pmd: { id: '0240' } },
  },
  miltank: {
    name: ['Miltank'],
    sources: {
      ps: {},
      serebii: { id: '241' },
      pd: { flip: true },
      pmd: { id: '0241' },
    },
  },
  blissey: {
    name: ['Blissey'],
    sources: {
      ps: {},
      serebii: { id: '242' },
      pd: { flip: true },
      pmd: { id: '0242' },
    },
  },
  raikou: {
    name: ['Raikou'],
    sources: { ps: {}, serebii: { id: '243' }, pd: {}, pmd: { id: '0243' } },
  },
  entei: {
    name: ['Entei'],
    sources: { ps: {}, serebii: { id: '244' }, pd: {}, pmd: { id: '0244' } },
  },
  suicune: {
    name: ['Suicune'],
    sources: { ps: {}, serebii: { id: '245' }, pd: {}, pmd: { id: '0245' } },
  },
  larvitar: {
    name: ['Larvitar'],
    sources: { ps: {}, serebii: { id: '246' }, pd: {}, pmd: { id: '0246' } },
  },
  pupitar: {
    name: ['Pupitar'],
    sources: {
      ps: {},
      serebii: { id: '247' },
      pd: { flip: true },
      pmd: { id: '0247' },
    },
  },
  tyranitar: {
    name: ['Tyranitar'],
    sources: { ps: {}, serebii: { id: '248' }, pd: {}, pmd: { id: '0248' } },
  },
  tyranitarmega: {
    name: ['Mega Tyranitar', 'Tyranitar-Mega'],
    sources: {
      ps: { id: 'tyranitar-mega' },
      serebii: { id: '248-m' },
      pd: { id: 'tyranitar-mega' },
      pmd: { id: '0248/0001' },
    },
  },
  lugia: {
    name: ['Lugia'],
    sources: { ps: {}, serebii: { id: '249' }, pd: {}, pmd: { id: '0249' } },
  },
  hooh: {
    name: ['Ho-Oh'],
    sources: {
      ps: {},
      serebii: { id: '250' },
      pd: { id: 'ho-oh', flip: true },
      pmd: { id: '0250' },
    },
  },
  celebi: {
    name: ['Celebi'],
    sources: { ps: {}, serebii: { id: '251' }, pd: {}, pmd: { id: '0251' } },
  },
  treecko: {
    name: ['Treecko'],
    sources: {
      ps: {},
      serebii: { id: '252' },
      pd: { flip: true },
      pmd: { id: '0252' },
    },
  },
  grovyle: {
    name: ['Grovyle'],
    sources: { ps: {}, serebii: { id: '253' }, pd: {}, pmd: { id: '0253' } },
  },
  sceptile: {
    name: ['Sceptile'],
    sources: { ps: {}, serebii: { id: '254' }, pd: {}, pmd: { id: '0254' } },
  },
  sceptilemega: {
    name: ['Mega Sceptile', 'Sceptile-Mega'],
    sources: {
      ps: { id: 'sceptile-mega' },
      serebii: { id: '254-m' },
      pd: { id: 'sceptile-mega' },
      pmd: { id: '0254/0001' },
    },
  },
  torchic: {
    name: ['Torchic'],
    sources: { ps: {}, serebii: { id: '255' }, pd: {}, pmd: { id: '0255' } },
  },
  combusken: {
    name: ['Combusken'],
    sources: { ps: {}, serebii: { id: '256' }, pd: {}, pmd: { id: '0256' } },
  },
  blaziken: {
    name: ['Blaziken'],
    sources: {
      ps: {},
      serebii: { id: '257' },
      pd: { flip: true },
      pmd: { id: '0257' },
    },
  },
  blazikenmega: {
    name: ['Mega Blaziken', 'Blaziken-Mega'],
    sources: {
      ps: { id: 'blaziken-mega' },
      serebii: { id: '257-m' },
      pd: { id: 'blaziken-mega' },
      pmd: { id: '0257/0001' },
    },
  },
  mudkip: {
    name: ['Mudkip'],
    sources: { ps: {}, serebii: { id: '258' }, pd: {}, pmd: { id: '0258' } },
  },
  marshtomp: {
    name: ['Marshtomp'],
    sources: {
      ps: {},
      serebii: { id: '259' },
      pd: { flip: true },
      pmd: { id: '0259' },
    },
  },
  swampert: {
    name: ['Swampert'],
    sources: { ps: {}, serebii: { id: '260' }, pd: {}, pmd: { id: '0260' } },
  },
  swampertmega: {
    name: ['Mega Swampert', 'Swampert-Mega'],
    sources: {
      ps: { id: 'swampert-mega' },
      serebii: { id: '260-m' },
      pd: { id: 'swampert-mega' },
      pmd: { id: '0260/0001' },
    },
  },
  poochyena: {
    name: ['Poochyena'],
    sources: { ps: {}, serebii: { id: '261' }, pd: {}, pmd: { id: '0261' } },
  },
  mightyena: {
    name: ['Mightyena'],
    sources: { ps: {}, serebii: { id: '262' }, pd: {}, pmd: { id: '0262' } },
  },
  zigzagoon: {
    name: ['Zigzagoon'],
    sources: { ps: {}, serebii: { id: '263' }, pd: {}, pmd: { id: '0263' } },
  },
  zigzagoongalar: {
    name: ['Galarian Zigzagoon', 'Zigzagoon-Galar', 'Zigzagoon-G'],
    sources: {
      ps: { id: 'zigzagoon-galar' },
      serebii: { id: '263-g' },
      pd: { id: 'zigzagoon-galarian' },
      pmd: { id: '0263/0001' },
    },
  },
  linoone: {
    name: ['Linoone'],
    sources: { ps: {}, serebii: { id: '264' }, pd: {}, pmd: { id: '0264' } },
  },
  linoonegalar: {
    name: ['Galarian Linoone', 'Linoone-Galar', 'Linoone-G'],
    sources: {
      ps: { id: 'linoone-galar' },
      serebii: { id: '264-g' },
      pd: { id: 'linoone-galarian', flip: true },
      pmd: { id: '0264/0001' },
    },
  },
  wurmple: {
    name: ['Wurmple'],
    sources: { ps: {}, serebii: { id: '265' }, pd: {}, pmd: { id: '0265' } },
  },
  silcoon: {
    name: ['Silcoon'],
    sources: { ps: {}, serebii: { id: '266' }, pd: {}, pmd: { id: '0266' } },
  },
  beautifly: {
    name: ['Beautifly'],
    sources: { ps: {}, serebii: { id: '267' }, pd: {}, pmd: { id: '0267' } },
  },
  cascoon: {
    name: ['Cascoon'],
    sources: {
      ps: {},
      serebii: { id: '268' },
      pd: { flip: true },
      pmd: { id: '0268' },
    },
  },
  dustox: {
    name: ['Dustox'],
    sources: {
      ps: {},
      serebii: { id: '269' },
      pd: { flip: true },
      pmd: { id: '0269' },
    },
  },
  lotad: {
    name: ['Lotad'],
    sources: { ps: {}, serebii: { id: '270' }, pd: {}, pmd: { id: '0270' } },
  },
  lombre: {
    name: ['Lombre'],
    sources: { ps: {}, serebii: { id: '271' }, pd: {}, pmd: { id: '0271' } },
  },
  ludicolo: {
    name: ['Ludicolo'],
    sources: { ps: {}, serebii: { id: '272' }, pd: {}, pmd: { id: '0272' } },
  },
  seedot: {
    name: ['Seedot'],
    sources: { ps: {}, serebii: { id: '273' }, pd: {}, pmd: { id: '0273' } },
  },
  nuzleaf: {
    name: ['Nuzleaf'],
    sources: { ps: {}, serebii: { id: '274' }, pd: {}, pmd: { id: '0274' } },
  },
  shiftry: {
    name: ['Shiftry'],
    sources: { ps: {}, serebii: { id: '275' }, pd: {}, pmd: { id: '0275' } },
  },
  taillow: {
    name: ['Taillow'],
    sources: { ps: {}, serebii: { id: '276' }, pd: {}, pmd: { id: '0276' } },
  },
  swellow: {
    name: ['Swellow'],
    sources: { ps: {}, serebii: { id: '277' }, pd: {}, pmd: { id: '0277' } },
  },
  wingull: {
    name: ['Wingull'],
    sources: { ps: {}, serebii: { id: '278' }, pd: {}, pmd: { id: '0278' } },
  },
  pelipper: {
    name: ['Pelipper'],
    sources: { ps: {}, serebii: { id: '279' }, pd: {}, pmd: { id: '0279' } },
  },
  ralts: {
    name: ['Ralts'],
    sources: { ps: {}, serebii: { id: '280' }, pd: {}, pmd: { id: '0280' } },
  },
  kirlia: {
    name: ['Kirlia'],
    sources: { ps: {}, serebii: { id: '281' }, pd: {}, pmd: { id: '0281' } },
  },
  gardevoir: {
    name: ['Gardevoir'],
    sources: {
      ps: {},
      serebii: { id: '282' },
      pd: { flip: true },
      pmd: { id: '0282' },
    },
  },
  gardevoirmega: {
    name: ['Mega Gardevoir', 'Gardevoir-Mega'],
    sources: {
      ps: { id: 'gardevoir-mega' },
      serebii: { id: '282-m' },
      pd: { id: 'gardevoir-mega' },
      pmd: { id: '0282/0001' },
    },
  },
  surskit: {
    name: ['Surskit'],
    sources: { ps: {}, serebii: { id: '283' }, pd: {}, pmd: { id: '0283' } },
  },
  masquerain: {
    name: ['Masquerain'],
    sources: { ps: {}, serebii: { id: '284' }, pd: {}, pmd: { id: '0284' } },
  },
  shroomish: {
    name: ['Shroomish'],
    sources: { ps: {}, serebii: { id: '285' }, pd: {}, pmd: { id: '0285' } },
  },
  breloom: {
    name: ['Breloom'],
    sources: { ps: {}, serebii: { id: '286' }, pd: {}, pmd: { id: '0286' } },
  },
  slakoth: {
    name: ['Slakoth'],
    sources: { ps: {}, serebii: { id: '287' }, pd: {}, pmd: { id: '0287' } },
  },
  vigoroth: {
    name: ['Vigoroth'],
    sources: { ps: {}, serebii: { id: '288' }, pd: {}, pmd: { id: '0288' } },
  },
  slaking: {
    name: ['Slaking'],
    sources: { ps: {}, serebii: { id: '289' }, pd: {}, pmd: { id: '0289' } },
  },
  nincada: {
    name: ['Nincada'],
    sources: { ps: {}, serebii: { id: '290' }, pd: {}, pmd: { id: '0290' } },
  },
  ninjask: {
    name: ['Ninjask'],
    sources: { ps: {}, serebii: { id: '291' }, pd: {}, pmd: { id: '0291' } },
  },
  shedinja: {
    name: ['Shedinja'],
    sources: { ps: {}, serebii: { id: '292' }, pd: {}, pmd: { id: '0292' } },
  },
  whismur: {
    name: ['Whismur'],
    sources: {
      ps: {},
      serebii: { id: '293' },
      pd: { flip: true },
      pmd: { id: '0293' },
    },
  },
  loudred: {
    name: ['Loudred'],
    sources: { ps: {}, serebii: { id: '294' }, pd: {}, pmd: { id: '0294' } },
  },
  exploud: {
    name: ['Exploud'],
    sources: { ps: {}, serebii: { id: '295' }, pd: {}, pmd: { id: '0295' } },
  },
  makuhita: {
    name: ['Makuhita'],
    sources: { ps: {}, serebii: { id: '296' }, pd: {}, pmd: { id: '0296' } },
  },
  hariyama: {
    name: ['Hariyama'],
    sources: { ps: {}, serebii: { id: '297' }, pd: {}, pmd: { id: '0297' } },
  },
  azurill: {
    name: ['Azurill'],
    sources: { ps: {}, serebii: { id: '298' }, pd: {}, pmd: { id: '0298' } },
  },
  nosepass: {
    name: ['Nosepass'],
    sources: {
      ps: {},
      serebii: { id: '299' },
      pd: { flip: true },
      pmd: { id: '0299' },
    },
  },
  skitty: {
    name: ['Skitty'],
    sources: { ps: {}, serebii: { id: '300' }, pd: {}, pmd: { id: '0300' } },
  },
  delcatty: {
    name: ['Delcatty'],
    sources: { ps: {}, serebii: { id: '301' }, pd: {}, pmd: { id: '0301' } },
  },
  sableye: {
    name: ['Sableye'],
    sources: { ps: {}, serebii: { id: '302' }, pd: {}, pmd: { id: '0302' } },
  },
  sableyemega: {
    name: ['Mega Sableye', 'Sableye-Mega'],
    sources: {
      ps: { id: 'sableye-mega' },
      serebii: { id: '302-m' },
      pd: { id: 'sableye-mega' },
      pmd: { id: '0302/0001' },
    },
  },
  mawile: {
    name: ['Mawile'],
    sources: {
      ps: {},
      serebii: { id: '303' },
      pd: { flip: true },
      pmd: { id: '0303' },
    },
  },
  mawilemega: {
    name: ['Mega Mawile', 'Mawile-Mega'],
    sources: {
      ps: { id: 'mawile-mega' },
      serebii: { id: '303-m' },
      pd: { id: 'mawile-mega' },
      pmd: { id: '0303/0001' },
    },
  },
  aron: {
    name: ['Aron'],
    sources: { ps: {}, serebii: { id: '304' }, pd: {}, pmd: { id: '0304' } },
  },
  lairon: {
    name: ['Lairon'],
    sources: { ps: {}, serebii: { id: '305' }, pd: {}, pmd: { id: '0305' } },
  },
  aggron: {
    name: ['Aggron'],
    sources: { ps: {}, serebii: { id: '306' }, pd: {}, pmd: { id: '0306' } },
  },
  aggronmega: {
    name: ['Mega Aggron', 'Aggron-Mega'],
    sources: {
      ps: { id: 'aggron-mega' },
      serebii: { id: '306-m' },
      pd: { id: 'aggron-mega' },
      pmd: { id: '0306/0001' },
    },
  },
  meditite: {
    name: ['Meditite'],
    sources: { ps: {}, serebii: { id: '307' }, pd: {}, pmd: { id: '0307' } },
  },
  medicham: {
    name: ['Medicham'],
    sources: { ps: {}, serebii: { id: '308' }, pd: {}, pmd: { id: '0308' } },
  },
  medichammega: {
    name: ['Mega Medicham', 'Medicham-Mega'],
    sources: {
      ps: { id: 'medicham-mega' },
      serebii: { id: '308-m' },
      pd: { id: 'medicham-mega' },
      pmd: { id: '0308/0001' },
    },
  },
  electrike: {
    name: ['Electrike'],
    sources: { ps: {}, serebii: { id: '309' }, pd: {}, pmd: { id: '0309' } },
  },
  manectric: {
    name: ['Manectric'],
    sources: { ps: {}, serebii: { id: '310' }, pd: {}, pmd: { id: '0310' } },
  },
  manectricmega: {
    name: ['Mega Manectric', 'Manectric-Mega'],
    sources: {
      ps: { id: 'manectric-mega' },
      serebii: { id: '310-m' },
      pd: { id: 'manectric-mega' },
      pmd: { id: '0310/0001' },
    },
  },
  plusle: {
    name: ['Plusle'],
    sources: { ps: {}, serebii: { id: '311' }, pd: {}, pmd: { id: '0311' } },
  },
  minun: {
    name: ['Minun'],
    sources: { ps: {}, serebii: { id: '312' }, pd: {}, pmd: { id: '0312' } },
  },
  volbeat: {
    name: ['Volbeat'],
    sources: { ps: {}, serebii: { id: '313' }, pd: {}, pmd: { id: '0313' } },
  },
  illumise: {
    name: ['Illumise'],
    sources: { ps: {}, serebii: { id: '314' }, pd: {}, pmd: { id: '0314' } },
  },
  roselia: {
    name: ['Roselia'],
    sources: { ps: {}, serebii: { id: '315' }, pd: {}, pmd: { id: '0315' } },
  },
  gulpin: {
    name: ['Gulpin'],
    sources: { ps: {}, serebii: { id: '316' }, pd: {}, pmd: { id: '0316' } },
  },
  swalot: {
    name: ['Swalot'],
    sources: {
      ps: {},
      serebii: { id: '317' },
      pd: { flip: true },
      pmd: { id: '0317' },
    },
  },
  carvanha: {
    name: ['Carvanha'],
    sources: { ps: {}, serebii: { id: '318' }, pd: {}, pmd: { id: '0318' } },
  },
  sharpedo: {
    name: ['Sharpedo'],
    sources: { ps: {}, serebii: { id: '319' }, pd: {}, pmd: { id: '0319' } },
  },
  sharpedomega: {
    name: ['Mega Sharpedo', 'Sharpedo-Mega'],
    sources: {
      ps: { id: 'sharpedo-mega' },
      serebii: { id: '319-m' },
      pd: { id: 'sharpedo-mega' },
      pmd: { id: '0319/0001' },
    },
  },
  wailmer: {
    name: ['Wailmer'],
    sources: { ps: {}, serebii: { id: '320' }, pd: {}, pmd: { id: '0320' } },
  },
  wailord: {
    name: ['Wailord'],
    sources: { ps: {}, serebii: { id: '321' }, pd: {}, pmd: { id: '0321' } },
  },
  numel: {
    name: ['Numel'],
    sources: { ps: {}, serebii: { id: '322' }, pd: {}, pmd: { id: '0322' } },
  },
  camerupt: {
    name: ['Camerupt'],
    sources: { ps: {}, serebii: { id: '323' }, pd: {}, pmd: { id: '0323' } },
  },
  cameruptmega: {
    name: ['Mega Camerupt', 'Camerupt-Mega'],
    sources: {
      ps: { id: 'camerupt-mega' },
      serebii: { id: '323-m' },
      pd: { id: 'camerupt-mega' },
      pmd: { id: '0323/0001' },
    },
  },
  torkoal: {
    name: ['Torkoal'],
    sources: { ps: {}, serebii: { id: '324' }, pd: {}, pmd: { id: '0324' } },
  },
  spoink: {
    name: ['Spoink'],
    sources: { ps: {}, serebii: { id: '325' }, pd: {}, pmd: { id: '0325' } },
  },
  grumpig: {
    name: ['Grumpig'],
    sources: { ps: {}, serebii: { id: '326' }, pd: {}, pmd: { id: '0326' } },
  },
  spinda: {
    name: ['Spinda'],
    sources: { ps: {}, serebii: { id: '327' }, pd: {}, pmd: { id: '0327' } },
  },
  trapinch: {
    name: ['Trapinch'],
    sources: { ps: {}, serebii: { id: '328' }, pd: {}, pmd: { id: '0328' } },
  },
  vibrava: {
    name: ['Vibrava'],
    sources: { ps: {}, serebii: { id: '329' }, pd: {}, pmd: { id: '0329' } },
  },
  flygon: {
    name: ['Flygon'],
    sources: { ps: {}, serebii: { id: '330' }, pd: {}, pmd: { id: '0330' } },
  },
  cacnea: {
    name: ['Cacnea'],
    sources: { ps: {}, serebii: { id: '331' }, pd: {}, pmd: { id: '0331' } },
  },
  cacturne: {
    name: ['Cacturne'],
    sources: { ps: {}, serebii: { id: '332' }, pd: {}, pmd: { id: '0332' } },
  },
  swablu: {
    name: ['Swablu'],
    sources: { ps: {}, serebii: { id: '333' }, pd: {}, pmd: { id: '0333' } },
  },
  altaria: {
    name: ['Altaria'],
    sources: { ps: {}, serebii: { id: '334' }, pd: {}, pmd: { id: '0334' } },
  },
  altariamega: {
    name: ['Mega Altaria', 'Altaria-Mega'],
    sources: {
      ps: { id: 'altaria-mega' },
      serebii: { id: '334-m' },
      pd: { id: 'altaria-mega' },
      pmd: { id: '0334/0001' },
    },
  },
  zangoose: {
    name: ['Zangoose'],
    sources: { ps: {}, serebii: { id: '335' }, pd: {}, pmd: { id: '0335' } },
  },
  seviper: {
    name: ['Seviper'],
    sources: { ps: {}, serebii: { id: '336' }, pd: {}, pmd: { id: '0336' } },
  },
  lunatone: {
    name: ['Lunatone'],
    sources: { ps: {}, serebii: { id: '337' }, pd: {}, pmd: { id: '0337' } },
  },
  solrock: {
    name: ['Solrock'],
    sources: { ps: {}, serebii: { id: '338' }, pd: {}, pmd: { id: '0338' } },
  },
  barboach: {
    name: ['Barboach'],
    sources: { ps: {}, serebii: { id: '339' }, pd: {}, pmd: { id: '0339' } },
  },
  whiscash: {
    name: ['Whiscash'],
    sources: { ps: {}, serebii: { id: '340' }, pd: {}, pmd: { id: '0340' } },
  },
  corphish: {
    name: ['Corphish'],
    sources: { ps: {}, serebii: { id: '341' }, pd: {}, pmd: { id: '0341' } },
  },
  crawdaunt: {
    name: ['Crawdaunt'],
    sources: { ps: {}, serebii: { id: '342' }, pd: {}, pmd: { id: '0342' } },
  },
  baltoy: {
    name: ['Baltoy'],
    sources: { ps: {}, serebii: { id: '343' }, pd: {}, pmd: { id: '0343' } },
  },
  claydol: {
    name: ['Claydol'],
    sources: { ps: {}, serebii: { id: '344' }, pd: {}, pmd: { id: '0344' } },
  },
  lileep: {
    name: ['Lileep'],
    sources: { ps: {}, serebii: { id: '345' }, pd: {}, pmd: { id: '0345' } },
  },
  cradily: {
    name: ['Cradily'],
    sources: { ps: {}, serebii: { id: '346' }, pd: {}, pmd: { id: '0346' } },
  },
  anorith: {
    name: ['Anorith'],
    sources: { ps: {}, serebii: { id: '347' }, pd: {}, pmd: { id: '0347' } },
  },
  armaldo: {
    name: ['Armaldo'],
    sources: { ps: {}, serebii: { id: '348' }, pd: {}, pmd: { id: '0348' } },
  },
  feebas: {
    name: ['Feebas'],
    sources: { ps: {}, serebii: { id: '349' }, pd: {}, pmd: { id: '0349' } },
  },
  milotic: {
    name: ['Milotic'],
    sources: { ps: {}, serebii: { id: '350' }, pd: {}, pmd: { id: '0350' } },
  },
  castform: {
    name: ['Castform'],
    sources: { ps: {}, serebii: { id: '351' }, pd: {}, pmd: { id: '0351' } },
  },
  castformsunny: {
    name: ['Castform-Sunny'],
    sources: {
      ps: { id: 'castform-sunny' },
      serebii: { id: '351-s' },
      pd: { id: 'castform-sunny', flip: true },
      pmd: { id: '0351/0001' },
    },
  },
  castformrainy: {
    name: ['Castform-Rainy'],
    sources: {
      ps: { id: 'castform-rainy' },
      serebii: { id: '351-r' },
      pd: { id: 'castform-rainy' },
      pmd: { id: '0351/0002' },
    },
  },
  castformsnowy: {
    name: ['Castform-Snowy'],
    sources: {
      ps: { id: 'castform-snowy' },
      serebii: { id: '351-i' },
      pd: { id: 'castform-snowy' },
      pmd: { id: '0351/0003' },
    },
  },
  kecleon: {
    name: ['Kecleon'],
    sources: { ps: {}, serebii: { id: '352' }, pd: {}, pmd: { id: '0352' } },
  },
  shuppet: {
    name: ['Shuppet'],
    sources: {
      ps: {},
      serebii: { id: '353' },
      pd: { flip: true },
      pmd: { id: '0353' },
    },
  },
  banette: {
    name: ['Banette'],
    sources: { ps: {}, serebii: { id: '354' }, pd: {}, pmd: { id: '0354' } },
  },
  banettemega: {
    name: ['Mega Banette', 'Banette-Mega'],
    sources: {
      ps: { id: 'banette-mega' },
      serebii: { id: '354-m' },
      pd: { id: 'banette-mega' },
      pmd: { id: '0354/0001' },
    },
  },
  duskull: {
    name: ['Duskull'],
    sources: { ps: {}, serebii: { id: '355' }, pd: {}, pmd: { id: '0355' } },
  },
  dusclops: {
    name: ['Dusclops'],
    sources: { ps: {}, serebii: { id: '356' }, pd: {}, pmd: { id: '0356' } },
  },
  tropius: {
    name: ['Tropius'],
    sources: { ps: {}, serebii: { id: '357' }, pd: {}, pmd: { id: '0357' } },
  },
  chimecho: {
    name: ['Chimecho'],
    sources: { ps: {}, serebii: { id: '358' }, pd: {}, pmd: { id: '0358' } },
  },
  absol: {
    name: ['Absol'],
    sources: { ps: {}, serebii: { id: '359' }, pd: {}, pmd: { id: '0359' } },
  },
  absolmega: {
    name: ['Mega Absol', 'Absol-Mega'],
    sources: {
      ps: { id: 'absol-mega' },
      serebii: { id: '359-m' },
      pd: { id: 'absol-mega' },
      pmd: { id: '0359/0001' },
    },
  },
  wynaut: {
    name: ['Wynaut'],
    sources: { ps: {}, serebii: { id: '360' }, pd: {}, pmd: { id: '0360' } },
  },
  snorunt: {
    name: ['Snorunt'],
    sources: { ps: {}, serebii: { id: '361' }, pd: {}, pmd: { id: '0361' } },
  },
  glalie: {
    name: ['Glalie'],
    sources: { ps: {}, serebii: { id: '362' }, pd: {}, pmd: { id: '0362' } },
  },
  glaliemega: {
    name: ['Mega Glalie', 'Glalie-Mega'],
    sources: {
      ps: { id: 'glalie-mega' },
      serebii: { id: '362-m' },
      pd: { id: 'glalie-mega', flip: true },
      pmd: { id: '0362/0001' },
    },
  },
  spheal: {
    name: ['Spheal'],
    sources: { ps: {}, serebii: { id: '363' }, pd: {}, pmd: { id: '0363' } },
  },
  sealeo: {
    name: ['Sealeo'],
    sources: {
      ps: {},
      serebii: { id: '364' },
      pd: { flip: true },
      pmd: { id: '0364' },
    },
  },
  walrein: {
    name: ['Walrein'],
    sources: { ps: {}, serebii: { id: '365' }, pd: {}, pmd: { id: '0365' } },
  },
  clamperl: {
    name: ['Clamperl'],
    sources: { ps: {}, serebii: { id: '366' }, pd: {}, pmd: { id: '0366' } },
  },
  huntail: {
    name: ['Huntail'],
    sources: { ps: {}, serebii: { id: '367' }, pd: {}, pmd: { id: '0367' } },
  },
  gorebyss: {
    name: ['Gorebyss'],
    sources: { ps: {}, serebii: { id: '368' }, pd: {}, pmd: { id: '0368' } },
  },
  relicanth: {
    name: ['Relicanth'],
    sources: { ps: {}, serebii: { id: '369' }, pd: {}, pmd: { id: '0369' } },
  },
  luvdisc: {
    name: ['Luvdisc'],
    sources: { ps: {}, serebii: { id: '370' }, pd: {}, pmd: { id: '0370' } },
  },
  bagon: {
    name: ['Bagon'],
    sources: { ps: {}, serebii: { id: '371' }, pd: {}, pmd: { id: '0371' } },
  },
  shelgon: {
    name: ['Shelgon'],
    sources: { ps: {}, serebii: { id: '372' }, pd: {}, pmd: { id: '0372' } },
  },
  salamence: {
    name: ['Salamence'],
    sources: { ps: {}, serebii: { id: '373' }, pd: {}, pmd: { id: '0373' } },
  },
  salamencemega: {
    name: ['Mega Salamence', 'Salamence-Mega'],
    sources: {
      ps: { id: 'salamence-mega' },
      serebii: { id: '373-m' },
      pd: { id: 'salamence-mega' },
      pmd: { id: '0373/0001' },
    },
  },
  beldum: {
    name: ['Beldum'],
    sources: { ps: {}, serebii: { id: '374' }, pd: {}, pmd: { id: '0374' } },
  },
  metang: {
    name: ['Metang'],
    sources: { ps: {}, serebii: { id: '375' }, pd: {}, pmd: { id: '0375' } },
  },
  metagross: {
    name: ['Metagross'],
    sources: { ps: {}, serebii: { id: '376' }, pd: {}, pmd: { id: '0376' } },
  },
  metagrossmega: {
    name: ['Mega Metagross', 'Metagross-Mega'],
    sources: {
      ps: { id: 'metagross-mega' },
      serebii: { id: '376-m' },
      pd: { id: 'metagross-mega' },
      pmd: { id: '0376/0001' },
    },
  },
  regirock: {
    name: ['Regirock'],
    sources: { ps: {}, serebii: { id: '377' }, pd: {}, pmd: { id: '0377' } },
  },
  regice: {
    name: ['Regice'],
    sources: {
      ps: {},
      serebii: { id: '378' },
      pd: { flip: true },
      pmd: { id: '0378' },
    },
  },
  registeel: {
    name: ['Registeel'],
    sources: { ps: {}, serebii: { id: '379' }, pd: {}, pmd: { id: '0379' } },
  },
  latias: {
    name: ['Latias'],
    sources: { ps: {}, serebii: { id: '380' }, pd: {}, pmd: { id: '0380' } },
  },
  latiasmega: {
    name: ['Mega Latias', 'Latias-Mega'],
    sources: {
      ps: { id: 'latias-mega' },
      serebii: { id: '380-m' },
      pd: { id: 'latias-mega', flip: true },
      pmd: { id: '0380/0001' },
    },
  },
  latios: {
    name: ['Latios'],
    sources: { ps: {}, serebii: { id: '381' }, pd: {}, pmd: { id: '0381' } },
  },
  latiosmega: {
    name: ['Mega Latios', 'Latios-Mega'],
    sources: {
      ps: { id: 'latios-mega' },
      serebii: { id: '381-m' },
      pd: { id: 'latios-mega' },
      pmd: { id: '0381/0001' },
    },
  },
  kyogre: {
    name: ['Kyogre'],
    sources: { ps: {}, serebii: { id: '382' }, pd: {}, pmd: { id: '0382' } },
  },
  kyogreprimal: {
    name: ['Primal Kyogre', 'Kyogre-Primal'],
    sources: {
      ps: { id: 'kyogre-primal' },
      serebii: { id: '382-p' },
      pd: { id: 'kyogre-primal' },
      pmd: { id: '0382/0001' },
    },
  },
  groudon: {
    name: ['Groudon'],
    sources: {
      ps: {},
      serebii: { id: '383' },
      pd: { flip: true },
      pmd: { id: '0383' },
    },
  },
  groudonprimal: {
    name: ['Primal Groudon', 'Groudon-Primal'],
    sources: {
      ps: { id: 'groudon-primal' },
      serebii: { id: '383-p' },
      pd: { id: 'groudon-primal', flip: true },
      pmd: { id: '0383/0001' },
    },
  },
  rayquaza: {
    name: ['Rayquaza'],
    sources: { ps: {}, serebii: { id: '384' }, pd: {}, pmd: { id: '0384' } },
  },
  rayquazamega: {
    name: ['Mega Rayquaza', 'Rayquaza-Mega'],
    sources: {
      ps: { id: 'rayquaza-mega' },
      serebii: { id: '384-m' },
      pd: { id: 'rayquaza-mega' },
      pmd: { id: '0384/0001' },
    },
  },
  jirachi: {
    name: ['Jirachi'],
    sources: { ps: {}, serebii: { id: '385' }, pd: {}, pmd: { id: '0385' } },
  },
  deoxys: {
    name: ['Deoxys'],
    sources: { ps: {}, serebii: { id: '386' }, pd: {}, pmd: { id: '0386' } },
  },
  deoxysattack: {
    name: ['Deoxys-Attack'],
    sources: {
      ps: { id: 'deoxys-attack' },
      serebii: { id: '386-a' },
      pd: { id: 'deoxys-attack' },
      pmd: { id: '0386/0001' },
    },
  },
  deoxysdefense: {
    name: ['Deoxys-Defense'],
    sources: {
      ps: { id: 'deoxys-defense' },
      serebii: { id: '386-d' },
      pd: { id: 'deoxys-defense', flip: true },
      pmd: { id: '0386/0002' },
    },
  },
  deoxysspeed: {
    name: ['Deoxys-Speed'],
    sources: {
      ps: { id: 'deoxys-speed' },
      serebii: { id: '386-s' },
      pd: { id: 'deoxys-speed' },
      pmd: { id: '0386/0003' },
    },
  },
  turtwig: {
    name: ['Turtwig'],
    sources: { ps: {}, serebii: { id: '387' }, pd: {}, pmd: { id: '0387' } },
  },
  grotle: {
    name: ['Grotle'],
    sources: { ps: {}, serebii: { id: '388' }, pd: {}, pmd: { id: '0388' } },
  },
  torterra: {
    name: ['Torterra'],
    sources: { ps: {}, serebii: { id: '389' }, pd: {}, pmd: { id: '0389' } },
  },
  chimchar: {
    name: ['Chimchar'],
    sources: { ps: {}, serebii: { id: '390' }, pd: {}, pmd: { id: '0390' } },
  },
  monferno: {
    name: ['Monferno'],
    sources: { ps: {}, serebii: { id: '391' }, pd: {}, pmd: { id: '0391' } },
  },
  infernape: {
    name: ['Infernape'],
    sources: { ps: {}, serebii: { id: '392' }, pd: {}, pmd: { id: '0392' } },
  },
  piplup: {
    name: ['Piplup'],
    sources: {
      ps: {},
      serebii: { id: '393' },
      pd: { flip: true },
      pmd: { id: '0393' },
    },
  },
  prinplup: {
    name: ['Prinplup'],
    sources: { ps: {}, serebii: { id: '394' }, pd: {}, pmd: { id: '0394' } },
  },
  empoleon: {
    name: ['Empoleon'],
    sources: { ps: {}, serebii: { id: '395' }, pd: {}, pmd: { id: '0395' } },
  },
  starly: {
    name: ['Starly'],
    sources: { ps: {}, serebii: { id: '396' }, pd: {}, pmd: { id: '0396' } },
  },
  staravia: {
    name: ['Staravia'],
    sources: { ps: {}, serebii: { id: '397' }, pd: {}, pmd: { id: '0397' } },
  },
  staraptor: {
    name: ['Staraptor'],
    sources: { ps: {}, serebii: { id: '398' }, pd: {}, pmd: { id: '0398' } },
  },
  bidoof: {
    name: ['Bidoof'],
    sources: { ps: {}, serebii: { id: '399' }, pd: {}, pmd: { id: '0399' } },
  },
  bibarel: {
    name: ['Bibarel'],
    sources: { ps: {}, serebii: { id: '400' }, pd: {}, pmd: { id: '0400' } },
  },
  kricketot: {
    name: ['Kricketot'],
    sources: { ps: {}, serebii: { id: '401' }, pd: {}, pmd: { id: '0401' } },
  },
  kricketune: {
    name: ['Kricketune'],
    sources: { ps: {}, serebii: { id: '402' }, pd: {}, pmd: { id: '0402' } },
  },
  shinx: {
    name: ['Shinx'],
    sources: {
      ps: {},
      serebii: { id: '403' },
      pd: { flip: true },
      pmd: { id: '0403' },
    },
  },
  luxio: {
    name: ['Luxio'],
    sources: { ps: {}, serebii: { id: '404' }, pd: {}, pmd: { id: '0404' } },
  },
  luxray: {
    name: ['Luxray'],
    sources: { ps: {}, serebii: { id: '405' }, pd: {}, pmd: { id: '0405' } },
  },
  budew: {
    name: ['Budew'],
    sources: { ps: {}, serebii: { id: '406' }, pd: {}, pmd: { id: '0406' } },
  },
  roserade: {
    name: ['Roserade'],
    sources: { ps: {}, serebii: { id: '407' }, pd: {}, pmd: { id: '0407' } },
  },
  cranidos: {
    name: ['Cranidos'],
    sources: {
      ps: {},
      serebii: { id: '408' },
      pd: { flip: true },
      pmd: { id: '0408' },
    },
  },
  rampardos: {
    name: ['Rampardos'],
    sources: {
      ps: {},
      serebii: { id: '409' },
      pd: { flip: true },
      pmd: { id: '0409' },
    },
  },
  shieldon: {
    name: ['Shieldon'],
    sources: { ps: {}, serebii: { id: '410' }, pd: {}, pmd: { id: '0410' } },
  },
  bastiodon: {
    name: ['Bastiodon'],
    sources: { ps: {}, serebii: { id: '411' }, pd: {}, pmd: { id: '0411' } },
  },
  burmy: {
    name: ['Burmy'],
    sources: { ps: {}, serebii: { id: '412' }, pd: {}, pmd: { id: '0412' } },
  },
  wormadam: {
    name: ['Wormadam'],
    sources: { ps: {}, serebii: { id: '413' }, pd: {}, pmd: { id: '0413' } },
  },
  wormadamsandy: {
    name: ['Wormadam-Sandy'],
    sources: {
      ps: { id: 'wormadam-sandy' },
      serebii: { id: '413-s' },
      pd: { id: 'wormadam-sandy', flip: true },
      pmd: { id: '0413/0001' },
    },
  },
  wormadamtrash: {
    name: ['Wormadam-Trash'],
    sources: {
      ps: { id: 'wormadam-trash' },
      serebii: { id: '413-t' },
      pd: { id: 'wormadam-trash' },
      pmd: { id: '0413/0002' },
    },
  },
  mothim: {
    name: ['Mothim'],
    sources: { ps: {}, serebii: { id: '414' }, pd: {}, pmd: { id: '0414' } },
  },
  combee: {
    name: ['Combee'],
    sources: { ps: {}, serebii: { id: '415' }, pd: {}, pmd: { id: '0415' } },
  },
  vespiquen: {
    name: ['Vespiquen'],
    sources: { ps: {}, serebii: { id: '416' }, pd: {}, pmd: { id: '0416' } },
  },
  pachirisu: {
    name: ['Pachirisu'],
    sources: { ps: {}, serebii: { id: '417' }, pd: {}, pmd: { id: '0417' } },
  },
  buizel: {
    name: ['Buizel'],
    sources: { ps: {}, serebii: { id: '418' }, pd: {}, pmd: { id: '0418' } },
  },
  floatzel: {
    name: ['Floatzel'],
    sources: { ps: {}, serebii: { id: '419' }, pd: {}, pmd: { id: '0419' } },
  },
  cherubi: {
    name: ['Cherubi'],
    sources: { ps: {}, serebii: { id: '420' }, pd: {}, pmd: { id: '0420' } },
  },
  cherrim: {
    name: ['Cherrim'],
    sources: { ps: {}, serebii: { id: '421' }, pd: {}, pmd: { id: '0421' } },
  },
  cherrimsunshine: {
    name: ['Cherrim-Sunshine'],
    sources: {
      ps: { id: 'cherrim-sunshine' },
      serebii: { id: '421-s' },
      pd: { id: 'cherrim-sunshine' },
      pmd: { id: '0421/0001' },
    },
  },
  shellos: {
    name: ['Shellos'],
    sources: { ps: {}, serebii: { id: '422' }, pd: {}, pmd: { id: '0422' } },
  },
  gastrodon: {
    name: ['Gastrodon'],
    sources: { ps: {}, serebii: { id: '423' }, pd: {}, pmd: { id: '0423' } },
  },
  ambipom: {
    name: ['Ambipom'],
    sources: { ps: {}, serebii: { id: '424' }, pd: {}, pmd: { id: '0424' } },
  },
  drifloon: {
    name: ['Drifloon'],
    sources: { ps: {}, serebii: { id: '425' }, pd: {}, pmd: { id: '0425' } },
  },
  drifblim: {
    name: ['Drifblim'],
    sources: { ps: {}, serebii: { id: '426' }, pd: {}, pmd: { id: '0426' } },
  },
  buneary: {
    name: ['Buneary'],
    sources: { ps: {}, serebii: { id: '427' }, pd: {}, pmd: { id: '0427' } },
  },
  lopunny: {
    name: ['Lopunny'],
    sources: { ps: {}, serebii: { id: '428' }, pd: {}, pmd: { id: '0428' } },
  },
  lopunnymega: {
    name: ['Mega Lopunny', 'Lopunny-Mega'],
    sources: {
      ps: { id: 'lopunny-mega' },
      serebii: { id: '428-m' },
      pd: { id: 'lopunny-mega' },
      pmd: { id: '0428/0001' },
    },
  },
  mismagius: {
    name: ['Mismagius'],
    sources: { ps: {}, serebii: { id: '429' }, pd: {}, pmd: { id: '0429' } },
  },
  honchkrow: {
    name: ['Honchkrow'],
    sources: { ps: {}, serebii: { id: '430' }, pd: {}, pmd: { id: '0430' } },
  },
  glameow: {
    name: ['Glameow'],
    sources: { ps: {}, serebii: { id: '431' }, pd: {}, pmd: { id: '0431' } },
  },
  purugly: {
    name: ['Purugly'],
    sources: { ps: {}, serebii: { id: '432' }, pd: {}, pmd: { id: '0432' } },
  },
  chingling: {
    name: ['Chingling'],
    sources: { ps: {}, serebii: { id: '433' }, pd: {}, pmd: { id: '0433' } },
  },
  stunky: {
    name: ['Stunky'],
    sources: { ps: {}, serebii: { id: '434' }, pd: {}, pmd: { id: '0434' } },
  },
  skuntank: {
    name: ['Skuntank'],
    sources: { ps: {}, serebii: { id: '435' }, pd: {}, pmd: { id: '0435' } },
  },
  bronzor: {
    name: ['Bronzor'],
    sources: { ps: {}, serebii: { id: '436' }, pd: {}, pmd: { id: '0436' } },
  },
  bronzong: {
    name: ['Bronzong'],
    sources: { ps: {}, serebii: { id: '437' }, pd: {}, pmd: { id: '0437' } },
  },
  bonsly: {
    name: ['Bonsly'],
    sources: { ps: {}, serebii: { id: '438' }, pd: {}, pmd: { id: '0438' } },
  },
  mimejr: {
    name: ['Mime Jr.'],
    sources: {
      ps: {},
      serebii: { id: '439' },
      pd: { id: 'mime-jr' },
      pmd: { id: '0439' },
    },
  },
  happiny: {
    name: ['Happiny'],
    sources: { ps: {}, serebii: { id: '440' }, pd: {}, pmd: { id: '0440' } },
  },
  chatot: {
    name: ['Chatot'],
    sources: { ps: {}, serebii: { id: '441' }, pd: {}, pmd: { id: '0441' } },
  },
  spiritomb: {
    name: ['Spiritomb'],
    sources: { ps: {}, serebii: { id: '442' }, pd: {}, pmd: { id: '0442' } },
  },
  gible: {
    name: ['Gible'],
    sources: { ps: {}, serebii: { id: '443' }, pd: {}, pmd: { id: '0443' } },
  },
  gabite: {
    name: ['Gabite'],
    sources: { ps: {}, serebii: { id: '444' }, pd: {}, pmd: { id: '0444' } },
  },
  garchomp: {
    name: ['Garchomp'],
    sources: { ps: {}, serebii: { id: '445' }, pd: {}, pmd: { id: '0445' } },
  },
  garchompmega: {
    name: ['Mega Garchomp', 'Garchomp-Mega'],
    sources: {
      ps: { id: 'garchomp-mega' },
      serebii: { id: '445-m' },
      pd: { id: 'garchomp-mega' },
      pmd: { id: '0445/0001' },
    },
  },
  munchlax: {
    name: ['Munchlax'],
    sources: {
      ps: {},
      serebii: { id: '446' },
      pd: { flip: true },
      pmd: { id: '0446' },
    },
  },
  riolu: {
    name: ['Riolu'],
    sources: { ps: {}, serebii: { id: '447' }, pd: {}, pmd: { id: '0447' } },
  },
  lucario: {
    name: ['Lucario'],
    sources: { ps: {}, serebii: { id: '448' }, pd: {}, pmd: { id: '0448' } },
  },
  lucariomega: {
    name: ['Mega Lucario', 'Lucario-Mega'],
    sources: {
      ps: { id: 'lucario-mega' },
      serebii: { id: '448-m' },
      pd: { id: 'lucario-mega', flip: true },
      pmd: { id: '0448/0001' },
    },
  },
  hippopotas: {
    name: ['Hippopotas'],
    sources: { ps: {}, serebii: { id: '449' }, pd: {}, pmd: { id: '0449' } },
  },
  hippowdon: {
    name: ['Hippowdon'],
    sources: { ps: {}, serebii: { id: '450' }, pd: {}, pmd: { id: '0450' } },
  },
  skorupi: {
    name: ['Skorupi'],
    sources: { ps: {}, serebii: { id: '451' }, pd: {}, pmd: { id: '0451' } },
  },
  drapion: {
    name: ['Drapion'],
    sources: { ps: {}, serebii: { id: '452' }, pd: {}, pmd: { id: '0452' } },
  },
  croagunk: {
    name: ['Croagunk'],
    sources: { ps: {}, serebii: { id: '453' }, pd: {}, pmd: { id: '0453' } },
  },
  toxicroak: {
    name: ['Toxicroak'],
    sources: { ps: {}, serebii: { id: '454' }, pd: {}, pmd: { id: '0454' } },
  },
  carnivine: {
    name: ['Carnivine'],
    sources: { ps: {}, serebii: { id: '455' }, pd: {}, pmd: { id: '0455' } },
  },
  finneon: {
    name: ['Finneon'],
    sources: { ps: {}, serebii: { id: '456' }, pd: {}, pmd: { id: '0456' } },
  },
  lumineon: {
    name: ['Lumineon'],
    sources: { ps: {}, serebii: { id: '457' }, pd: {}, pmd: { id: '0457' } },
  },
  mantyke: {
    name: ['Mantyke'],
    sources: { ps: {}, serebii: { id: '458' }, pd: {}, pmd: { id: '0458' } },
  },
  snover: {
    name: ['Snover'],
    sources: { ps: {}, serebii: { id: '459' }, pd: {}, pmd: { id: '0459' } },
  },
  abomasnow: {
    name: ['Abomasnow'],
    sources: { ps: {}, serebii: { id: '460' }, pd: {}, pmd: { id: '0460' } },
  },
  abomasnowmega: {
    name: ['Mega Abomasnow', 'Abomasnow-Mega'],
    sources: {
      ps: { id: 'abomasnow-mega' },
      serebii: { id: '460-m' },
      pd: { id: 'abomasnow-mega' },
      pmd: { id: '0460/0001' },
    },
  },
  weavile: {
    name: ['Weavile'],
    sources: { ps: {}, serebii: { id: '461' }, pd: {}, pmd: { id: '0461' } },
  },
  magnezone: {
    name: ['Magnezone'],
    sources: { ps: {}, serebii: { id: '462' }, pd: {}, pmd: { id: '0462' } },
  },
  lickilicky: {
    name: ['Lickilicky'],
    sources: { ps: {}, serebii: { id: '463' }, pd: {}, pmd: { id: '0463' } },
  },
  rhyperior: {
    name: ['Rhyperior'],
    sources: { ps: {}, serebii: { id: '464' }, pd: {}, pmd: { id: '0464' } },
  },
  tangrowth: {
    name: ['Tangrowth'],
    sources: { ps: {}, serebii: { id: '465' }, pd: {}, pmd: { id: '0465' } },
  },
  electivire: {
    name: ['Electivire'],
    sources: { ps: {}, serebii: { id: '466' }, pd: {}, pmd: { id: '0466' } },
  },
  magmortar: {
    name: ['Magmortar'],
    sources: { ps: {}, serebii: { id: '467' }, pd: {}, pmd: { id: '0467' } },
  },
  togekiss: {
    name: ['Togekiss'],
    sources: { ps: {}, serebii: { id: '468' }, pd: {}, pmd: { id: '0468' } },
  },
  yanmega: {
    name: ['Yanmega'],
    sources: { ps: {}, serebii: { id: '469' }, pd: {}, pmd: { id: '0469' } },
  },
  leafeon: {
    name: ['Leafeon'],
    sources: { ps: {}, serebii: { id: '470' }, pd: {}, pmd: { id: '0470' } },
  },
  glaceon: {
    name: ['Glaceon'],
    sources: {
      ps: {},
      serebii: { id: '471' },
      pd: { flip: true },
      pmd: { id: '0471' },
    },
  },
  gliscor: {
    name: ['Gliscor'],
    sources: { ps: {}, serebii: { id: '472' }, pd: {}, pmd: { id: '0472' } },
  },
  mamoswine: {
    name: ['Mamoswine'],
    sources: { ps: {}, serebii: { id: '473' }, pd: {}, pmd: { id: '0473' } },
  },
  porygonz: {
    name: ['Porygon-Z'],
    sources: {
      ps: {},
      serebii: { id: '474' },
      pd: { id: 'porygon-z' },
      pmd: { id: '0474' },
    },
  },
  gallade: {
    name: ['Gallade'],
    sources: { ps: {}, serebii: { id: '475' }, pd: {}, pmd: { id: '0475' } },
  },
  gallademega: {
    name: ['Mega Gallade', 'Gallade-Mega'],
    sources: {
      ps: { id: 'gallade-mega' },
      serebii: { id: '475-m' },
      pd: { id: 'gallade-mega' },
      pmd: { id: '0475/0001' },
    },
  },
  probopass: {
    name: ['Probopass'],
    sources: { ps: {}, serebii: { id: '476' }, pd: {}, pmd: { id: '0476' } },
  },
  dusknoir: {
    name: ['Dusknoir'],
    sources: {
      ps: {},
      serebii: { id: '477' },
      pd: { flip: true },
      pmd: { id: '0477' },
    },
  },
  froslass: {
    name: ['Froslass'],
    sources: { ps: {}, serebii: { id: '478' }, pd: {}, pmd: { id: '0478' } },
  },
  rotom: {
    name: ['Rotom'],
    sources: {
      ps: {},
      serebii: { id: '479' },
      pd: { flip: true },
      pmd: { id: '0479' },
    },
  },
  rotomheat: {
    name: ['Rotom-Heat'],
    sources: {
      ps: { id: 'rotom-heat' },
      serebii: { id: '479-h' },
      pd: { id: 'rotom-heat' },
      pmd: { id: '0479/0001' },
    },
  },
  rotomwash: {
    name: ['Rotom-Wash'],
    sources: {
      ps: { id: 'rotom-wash' },
      serebii: { id: '479-w' },
      pd: { id: 'rotom-wash', flip: true },
      pmd: { id: '0479/0002' },
    },
  },
  rotomfrost: {
    name: ['Rotom-Frost'],
    sources: {
      ps: { id: 'rotom-frost' },
      serebii: { id: '479-f' },
      pd: { id: 'rotom-frost', flip: true },
      pmd: { id: '0479/0003' },
    },
  },
  rotomfan: {
    name: ['Rotom-Fan'],
    sources: {
      ps: { id: 'rotom-fan' },
      serebii: { id: '479-s' },
      pd: { id: 'rotom-fan' },
      pmd: { id: '0479/0004' },
    },
  },
  rotommow: {
    name: ['Rotom-Mow'],
    sources: {
      ps: { id: 'rotom-mow' },
      serebii: { id: '479-m' },
      pd: { id: 'rotom-mow', flip: true },
      pmd: { id: '0479/0005' },
    },
  },
  uxie: {
    name: ['Uxie'],
    sources: { ps: {}, serebii: { id: '480' }, pd: {}, pmd: { id: '0480' } },
  },
  mesprit: {
    name: ['Mesprit'],
    sources: { ps: {}, serebii: { id: '481' }, pd: {}, pmd: { id: '0481' } },
  },
  azelf: {
    name: ['Azelf'],
    sources: {
      ps: {},
      serebii: { id: '482' },
      pd: { flip: true },
      pmd: { id: '0482' },
    },
  },
  dialga: {
    name: ['Dialga'],
    sources: {
      ps: {},
      serebii: { id: '483' },
      pd: { flip: true },
      pmd: { id: '0483' },
    },
  },
  dialgaorigin: {
    name: ['Dialga-Origin'],
    sources: {
      ps: { id: 'dialga-origin' },
      serebii: { id: '483-o' },
      pd: { id: 'dialga-origin' },
      pmd: { id: '0483/0001' },
    },
  },
  dialgaprimal: {
    name: ['Dialga-Primal'],
    sources: {
      ps: { id: 'dialga' },
      serebii: { id: '483' },
      pd: { id: 'dialga' },
      pmd: { id: '0483/0002' },
    },
  },
  palkia: {
    name: ['Palkia'],
    sources: { ps: {}, serebii: { id: '484' }, pd: {}, pmd: { id: '0484' } },
  },
  palkiaorigin: {
    name: ['Palkia-Origin'],
    sources: {
      ps: { id: 'palkia-origin' },
      serebii: { id: '484-o' },
      pd: { id: 'palkia-origin', flip: true },
      pmd: { id: '0484/0001' },
    },
  },
  heatran: {
    name: ['Heatran'],
    sources: { ps: {}, serebii: { id: '485' }, pd: {}, pmd: { id: '0485' } },
  },
  regigigas: {
    name: ['Regigigas'],
    sources: { ps: {}, serebii: { id: '486' }, pd: {}, pmd: { id: '0486' } },
  },
  giratina: {
    name: ['Giratina'],
    sources: { ps: {}, serebii: { id: '487' }, pd: {}, pmd: { id: '0487' } },
  },
  giratinaorigin: {
    name: ['Giratina-Origin'],
    sources: {
      ps: { id: 'giratina-origin' },
      serebii: { id: '487-o' },
      pd: { id: 'giratina-origin' },
      pmd: { id: '0487/0001' },
    },
  },
  cresselia: {
    name: ['Cresselia'],
    sources: {
      ps: {},
      serebii: { id: '488' },
      pd: { flip: true },
      pmd: { id: '0488' },
    },
  },
  phione: {
    name: ['Phione'],
    sources: { ps: {}, serebii: { id: '489' }, pd: {}, pmd: { id: '0489' } },
  },
  manaphy: {
    name: ['Manaphy'],
    sources: { ps: {}, serebii: { id: '490' }, pd: {}, pmd: { id: '0490' } },
  },
  darkrai: {
    name: ['Darkrai'],
    sources: { ps: {}, serebii: { id: '491' }, pd: {}, pmd: { id: '0491' } },
  },
  shaymin: {
    name: ['Shaymin'],
    sources: { ps: {}, serebii: { id: '492' }, pd: {}, pmd: { id: '0492' } },
  },
  shayminsky: {
    name: ['Shaymin-Sky'],
    sources: {
      ps: { id: 'shaymin-sky' },
      serebii: { id: '492-s' },
      pd: { id: 'shaymin-sky' },
      pmd: { id: '0492/0001' },
    },
  },
  arceus: {
    name: ['Arceus'],
    sources: { ps: {}, serebii: { id: '493' }, pd: {}, pmd: { id: '0493' } },
  },
  arceusbug: {
    name: ['Arceus-Bug'],
    sources: {
      ps: { id: 'arceus-bug' },
      serebii: { id: '493' },
      pd: { id: 'arceus-bug' },
      pmd: { id: '0493/0001' },
    },
  },
  arceusdark: {
    name: ['Arceus-Dark'],
    sources: {
      ps: { id: 'arceus-dark' },
      serebii: { id: '493-dark' },
      pd: { id: 'arceus-dark' },
      pmd: { id: '0493/0002' },
    },
  },
  arceusdragon: {
    name: ['Arceus-Dragon'],
    sources: {
      ps: { id: 'arceus-dragon' },
      serebii: { id: '493-dragon' },
      pd: { id: 'arceus-dragon' },
      pmd: { id: '0493/0003' },
    },
  },
  arceuselectric: {
    name: ['Arceus-Electric'],
    sources: {
      ps: { id: 'arceus-electric' },
      serebii: { id: '493-electric' },
      pd: { id: 'arceus-electric' },
      pmd: { id: '0493/0004' },
    },
  },
  arceusfairy: {
    name: ['Arceus-Fairy'],
    sources: {
      ps: { id: 'arceus-fairy' },
      serebii: { id: '493-fairy' },
      pd: { id: 'arceus-fairy' },
      pmd: { id: '0493/0017' },
    },
  },
  arceusfighting: {
    name: ['Arceus-Fighting'],
    sources: {
      ps: { id: 'arceus-fighting' },
      serebii: { id: '493-fighting' },
      pd: { id: 'arceus-fighting' },
      pmd: { id: '0493/0005' },
    },
  },
  arceusfire: {
    name: ['Arceus-Fire'],
    sources: {
      ps: { id: 'arceus-fire' },
      serebii: { id: '493-fire' },
      pd: { id: 'arceus-fire' },
      pmd: { id: '0493/0006' },
    },
  },
  arceusflying: {
    name: ['Arceus-Flying'],
    sources: {
      ps: { id: 'arceus-flying' },
      serebii: { id: '493-flying' },
      pd: { id: 'arceus-flying' },
      pmd: { id: '0493/0007' },
    },
  },
  arceusghost: {
    name: ['Arceus-Ghost'],
    sources: {
      ps: { id: 'arceus-ghost' },
      serebii: { id: '493-ghost' },
      pd: { id: 'arceus-ghost' },
      pmd: { id: '0493/0008' },
    },
  },
  arceusgrass: {
    name: ['Arceus-Grass'],
    sources: {
      ps: { id: 'arceus-grass' },
      serebii: { id: '493-grass' },
      pd: { id: 'arceus-grass' },
      pmd: { id: '0493/0009' },
    },
  },
  arceusground: {
    name: ['Arceus-Ground'],
    sources: {
      ps: { id: 'arceus-ground' },
      serebii: { id: '493-ground' },
      pd: { id: 'arceus-ground' },
      pmd: { id: '0493/0010' },
    },
  },
  arceusice: {
    name: ['Arceus-Ice'],
    sources: {
      ps: { id: 'arceus-ice' },
      serebii: { id: '493-ice' },
      pd: { id: 'arceus-ice' },
      pmd: { id: '0493/0011' },
    },
  },
  arceuspoison: {
    name: ['Arceus-Poison'],
    sources: {
      ps: { id: 'arceus-poison' },
      serebii: { id: '493-poison' },
      pd: { id: 'arceus-poison' },
      pmd: { id: '0493/0012' },
    },
  },
  arceuspsychic: {
    name: ['Arceus-Psychic'],
    sources: {
      ps: { id: 'arceus-psychic' },
      serebii: { id: '493-psychic' },
      pd: { id: 'arceus-psychic' },
      pmd: { id: '0493/0013' },
    },
  },
  arceusrock: {
    name: ['Arceus-Rock'],
    sources: {
      ps: { id: 'arceus-rock' },
      serebii: { id: '493-rock' },
      pd: { id: 'arceus-rock' },
      pmd: { id: '0493/0014' },
    },
  },
  arceussteel: {
    name: ['Arceus-Steel'],
    sources: {
      ps: { id: 'arceus-steel' },
      serebii: { id: '493-steel' },
      pd: { id: 'arceus-steel' },
      pmd: { id: '0493/0015' },
    },
  },
  arceuswater: {
    name: ['Arceus-Water'],
    sources: {
      ps: { id: 'arceus-water' },
      serebii: { id: '493-water' },
      pd: { id: 'arceus-water' },
      pmd: { id: '0493/0016' },
    },
  },
  victini: {
    name: ['Victini'],
    sources: { ps: {}, serebii: { id: '494' }, pd: {}, pmd: { id: '0494' } },
  },
  snivy: {
    name: ['Snivy'],
    sources: { ps: {}, serebii: { id: '495' }, pd: {}, pmd: { id: '0495' } },
  },
  servine: {
    name: ['Servine'],
    sources: {
      ps: {},
      serebii: { id: '496' },
      pd: { flip: true },
      pmd: { id: '0496' },
    },
  },
  serperior: {
    name: ['Serperior'],
    sources: { ps: {}, serebii: { id: '497' }, pd: {}, pmd: { id: '0497' } },
  },
  tepig: {
    name: ['Tepig'],
    sources: {
      ps: {},
      serebii: { id: '498' },
      pd: { flip: true },
      pmd: { id: '0498' },
    },
  },
  pignite: {
    name: ['Pignite'],
    sources: { ps: {}, serebii: { id: '499' }, pd: {}, pmd: { id: '0499' } },
  },
  emboar: {
    name: ['Emboar'],
    sources: { ps: {}, serebii: { id: '500' }, pd: {}, pmd: { id: '0500' } },
  },
  oshawott: {
    name: ['Oshawott'],
    sources: { ps: {}, serebii: { id: '501' }, pd: {}, pmd: { id: '0501' } },
  },
  dewott: {
    name: ['Dewott'],
    sources: { ps: {}, serebii: { id: '502' }, pd: {}, pmd: { id: '0502' } },
  },
  samurott: {
    name: ['Samurott'],
    sources: { ps: {}, serebii: { id: '503' }, pd: {}, pmd: { id: '0503' } },
  },
  samurotthisui: {
    name: ['Hisuian Samurott', 'Samurott-Hisui', 'Samurott-H'],
    sources: {
      ps: { id: 'samurott-hisui' },
      serebii: { id: '503-h' },
      pd: { id: 'samurott-hisuian' },
      pmd: { id: '0503/0001' },
    },
  },
  patrat: {
    name: ['Patrat'],
    sources: { ps: {}, serebii: { id: '504' }, pd: {}, pmd: { id: '0504' } },
  },
  watchog: {
    name: ['Watchog'],
    sources: { ps: {}, serebii: { id: '505' }, pd: {}, pmd: { id: '0505' } },
  },
  lillipup: {
    name: ['Lillipup'],
    sources: { ps: {}, serebii: { id: '506' }, pd: {}, pmd: { id: '0506' } },
  },
  herdier: {
    name: ['Herdier'],
    sources: { ps: {}, serebii: { id: '507' }, pd: {}, pmd: { id: '0507' } },
  },
  stoutland: {
    name: ['Stoutland'],
    sources: { ps: {}, serebii: { id: '508' }, pd: {}, pmd: { id: '0508' } },
  },
  purrloin: {
    name: ['Purrloin'],
    sources: { ps: {}, serebii: { id: '509' }, pd: {}, pmd: { id: '0509' } },
  },
  liepard: {
    name: ['Liepard'],
    sources: { ps: {}, serebii: { id: '510' }, pd: {}, pmd: { id: '0510' } },
  },
  pansage: {
    name: ['Pansage'],
    sources: { ps: {}, serebii: { id: '511' }, pd: {}, pmd: { id: '0511' } },
  },
  simisage: {
    name: ['Simisage'],
    sources: { ps: {}, serebii: { id: '512' }, pd: {}, pmd: { id: '0512' } },
  },
  pansear: {
    name: ['Pansear'],
    sources: { ps: {}, serebii: { id: '513' }, pd: {}, pmd: { id: '0513' } },
  },
  simisear: {
    name: ['Simisear'],
    sources: { ps: {}, serebii: { id: '514' }, pd: {}, pmd: { id: '0514' } },
  },
  panpour: {
    name: ['Panpour'],
    sources: {
      ps: {},
      serebii: { id: '515' },
      pd: { flip: true },
      pmd: { id: '0515' },
    },
  },
  simipour: {
    name: ['Simipour'],
    sources: {
      ps: {},
      serebii: { id: '516' },
      pd: { flip: true },
      pmd: { id: '0516' },
    },
  },
  munna: {
    name: ['Munna'],
    sources: { ps: {}, serebii: { id: '517' }, pd: {}, pmd: { id: '0517' } },
  },
  musharna: {
    name: ['Musharna'],
    sources: { ps: {}, serebii: { id: '518' }, pd: {}, pmd: { id: '0518' } },
  },
  pidove: {
    name: ['Pidove'],
    sources: { ps: {}, serebii: { id: '519' }, pd: {}, pmd: { id: '0519' } },
  },
  tranquill: {
    name: ['Tranquill'],
    sources: { ps: {}, serebii: { id: '520' }, pd: {}, pmd: { id: '0520' } },
  },
  unfezant: {
    name: ['Unfezant'],
    sources: { ps: {}, serebii: { id: '521' }, pd: {}, pmd: { id: '0521' } },
  },
  blitzle: {
    name: ['Blitzle'],
    sources: {
      ps: {},
      serebii: { id: '522' },
      pd: { flip: true },
      pmd: { id: '0522' },
    },
  },
  zebstrika: {
    name: ['Zebstrika'],
    sources: { ps: {}, serebii: { id: '523' }, pd: {}, pmd: { id: '0523' } },
  },
  roggenrola: {
    name: ['Roggenrola'],
    sources: { ps: {}, serebii: { id: '524' }, pd: {}, pmd: { id: '0524' } },
  },
  boldore: {
    name: ['Boldore'],
    sources: { ps: {}, serebii: { id: '525' }, pd: {}, pmd: { id: '0525' } },
  },
  gigalith: {
    name: ['Gigalith'],
    sources: { ps: {}, serebii: { id: '526' }, pd: {}, pmd: { id: '0526' } },
  },
  woobat: {
    name: ['Woobat'],
    sources: { ps: {}, serebii: { id: '527' }, pd: {}, pmd: { id: '0527' } },
  },
  swoobat: {
    name: ['Swoobat'],
    sources: { ps: {}, serebii: { id: '528' }, pd: {}, pmd: { id: '0528' } },
  },
  drilbur: {
    name: ['Drilbur'],
    sources: { ps: {}, serebii: { id: '529' }, pd: {}, pmd: { id: '0529' } },
  },
  excadrill: {
    name: ['Excadrill'],
    sources: {
      ps: {},
      serebii: { id: '530' },
      pd: { flip: true },
      pmd: { id: '0530' },
    },
  },
  audino: {
    name: ['Audino'],
    sources: {
      ps: {},
      serebii: { id: '531' },
      pd: { flip: true },
      pmd: { id: '0531' },
    },
  },
  audinomega: {
    name: ['Mega Audino', 'Audino-Mega'],
    sources: {
      ps: { id: 'audino-mega' },
      serebii: { id: '531-m' },
      pd: { id: 'audino-mega' },
      pmd: { id: '0531/0001' },
    },
  },
  timburr: {
    name: ['Timburr'],
    sources: { ps: {}, serebii: { id: '532' }, pd: {}, pmd: { id: '0532' } },
  },
  gurdurr: {
    name: ['Gurdurr'],
    sources: { ps: {}, serebii: { id: '533' }, pd: {}, pmd: { id: '0533' } },
  },
  conkeldurr: {
    name: ['Conkeldurr'],
    sources: { ps: {}, serebii: { id: '534' }, pd: {}, pmd: { id: '0534' } },
  },
  tympole: {
    name: ['Tympole'],
    sources: { ps: {}, serebii: { id: '535' }, pd: {}, pmd: { id: '0535' } },
  },
  palpitoad: {
    name: ['Palpitoad'],
    sources: { ps: {}, serebii: { id: '536' }, pd: {}, pmd: { id: '0536' } },
  },
  seismitoad: {
    name: ['Seismitoad'],
    sources: { ps: {}, serebii: { id: '537' }, pd: {}, pmd: { id: '0537' } },
  },
  throh: {
    name: ['Throh'],
    sources: { ps: {}, serebii: { id: '538' }, pd: {}, pmd: { id: '0538' } },
  },
  sawk: {
    name: ['Sawk'],
    sources: { ps: {}, serebii: { id: '539' }, pd: {}, pmd: { id: '0539' } },
  },
  sewaddle: {
    name: ['Sewaddle'],
    sources: { ps: {}, serebii: { id: '540' }, pd: {}, pmd: { id: '0540' } },
  },
  swadloon: {
    name: ['Swadloon'],
    sources: { ps: {}, serebii: { id: '541' }, pd: {}, pmd: { id: '0541' } },
  },
  leavanny: {
    name: ['Leavanny'],
    sources: { ps: {}, serebii: { id: '542' }, pd: {}, pmd: { id: '0542' } },
  },
  venipede: {
    name: ['Venipede'],
    sources: { ps: {}, serebii: { id: '543' }, pd: {}, pmd: { id: '0543' } },
  },
  whirlipede: {
    name: ['Whirlipede'],
    sources: { ps: {}, serebii: { id: '544' }, pd: {}, pmd: { id: '0544' } },
  },
  scolipede: {
    name: ['Scolipede'],
    sources: { ps: {}, serebii: { id: '545' }, pd: {}, pmd: { id: '0545' } },
  },
  cottonee: {
    name: ['Cottonee'],
    sources: { ps: {}, serebii: { id: '546' }, pd: {}, pmd: { id: '0546' } },
  },
  whimsicott: {
    name: ['Whimsicott'],
    sources: { ps: {}, serebii: { id: '547' }, pd: {}, pmd: { id: '0547' } },
  },
  petilil: {
    name: ['Petilil'],
    sources: { ps: {}, serebii: { id: '548' }, pd: {}, pmd: { id: '0548' } },
  },
  lilligant: {
    name: ['Lilligant'],
    sources: { ps: {}, serebii: { id: '549' }, pd: {}, pmd: { id: '0549' } },
  },
  lilliganthisui: {
    name: ['Hisuian Lilligant', 'Lilligant-Hisui', 'Lilligant-H'],
    sources: {
      ps: { id: 'lilligant-hisui' },
      serebii: { id: '549-h' },
      pd: { id: 'lilligant-hisuian' },
      pmd: { id: '0549/0001' },
    },
  },
  basculin: {
    name: ['Basculin'],
    sources: { ps: {}, serebii: { id: '550' }, pd: {}, pmd: { id: '0550' } },
  },
  basculinbluestriped: {
    name: ['Basculin-Blue-Striped'],
    sources: {
      ps: { id: 'basculin-bluestriped' },
      serebii: { id: '550-b' },
      pd: { id: 'basculin-blue-striped' },
      pmd: { id: '0550/0001' },
    },
  },
  basculinwhitestriped: {
    name: ['Basculin-White-Striped'],
    sources: {
      ps: { id: 'basculin-whitestriped' },
      serebii: { id: '550-w' },
      pd: { id: 'basculin-white-striped' },
      pmd: { id: '0550/0002' },
    },
  },
  sandile: {
    name: ['Sandile'],
    sources: { ps: {}, serebii: { id: '551' }, pd: {}, pmd: { id: '0551' } },
  },
  krokorok: {
    name: ['Krokorok'],
    sources: {
      ps: {},
      serebii: { id: '552' },
      pd: { flip: true },
      pmd: { id: '0552' },
    },
  },
  krookodile: {
    name: ['Krookodile'],
    sources: { ps: {}, serebii: { id: '553' }, pd: {}, pmd: { id: '0553' } },
  },
  darumaka: {
    name: ['Darumaka'],
    sources: { ps: {}, serebii: { id: '554' }, pd: {}, pmd: { id: '0554' } },
  },
  darumakagalar: {
    name: ['Galarian Darumaka', 'Darumaka-Galar', 'Darumaka-G'],
    sources: {
      ps: { id: 'darumaka-galar' },
      serebii: { id: '554-g' },
      pd: { id: 'darumaka-galarian' },
      pmd: { id: '0554/0001' },
    },
  },
  darmanitan: {
    name: ['Darmanitan'],
    sources: { ps: {}, serebii: { id: '555' }, pd: {}, pmd: { id: '0555' } },
  },
  darmanitanzen: {
    name: ['Darmanitan-Zen'],
    sources: {
      ps: { id: 'darmanitan-zen' },
      serebii: { id: '555' },
      pd: { id: 'darmanitan-zen' },
      pmd: { id: '0555/0001' },
    },
  },
  darmanitangalar: {
    name: ['Galarian Darmanitan', 'Darmanitan-Galar', 'Darmanitan-G'],
    sources: {
      ps: { id: 'darmanitan-galar' },
      serebii: { id: '555-g' },
      pd: { id: 'darmanitan-galarian-standard', flip: true },
      pmd: { id: '0555/0002' },
    },
  },
  darmanitangalarzen: {
    name: ['Darmanitan-G', 'Darmanitan-Galar-Zen'],
    sources: {
      ps: { id: 'darmanitan-galarzen' },
      serebii: { id: '555-gz' },
      pd: { id: 'darmanitan-galarian-zen' },
      pmd: { id: '0555/0003' },
    },
  },
  maractus: {
    name: ['Maractus'],
    sources: { ps: {}, serebii: { id: '556' }, pd: {}, pmd: { id: '0556' } },
  },
  dwebble: {
    name: ['Dwebble'],
    sources: { ps: {}, serebii: { id: '557' }, pd: {}, pmd: { id: '0557' } },
  },
  crustle: {
    name: ['Crustle'],
    sources: { ps: {}, serebii: { id: '558' }, pd: {}, pmd: { id: '0558' } },
  },
  scraggy: {
    name: ['Scraggy'],
    sources: { ps: {}, serebii: { id: '559' }, pd: {}, pmd: { id: '0559' } },
  },
  scrafty: {
    name: ['Scrafty'],
    sources: { ps: {}, serebii: { id: '560' }, pd: {}, pmd: { id: '0560' } },
  },
  sigilyph: {
    name: ['Sigilyph'],
    sources: { ps: {}, serebii: { id: '561' }, pd: {}, pmd: { id: '0561' } },
  },
  yamask: {
    name: ['Yamask'],
    sources: { ps: {}, serebii: { id: '562' }, pd: {}, pmd: { id: '0562' } },
  },
  yamaskgalar: {
    name: ['Galarian Yamask', 'Yamask-Galar', 'Yamask-G'],
    sources: {
      ps: { id: 'yamask-galar' },
      serebii: { id: '562-g' },
      pd: { id: 'yamask-galarian' },
      pmd: { id: '0562/0001' },
    },
  },
  cofagrigus: {
    name: ['Cofagrigus'],
    sources: { ps: {}, serebii: { id: '563' }, pd: {}, pmd: { id: '0563' } },
  },
  tirtouga: {
    name: ['Tirtouga'],
    sources: { ps: {}, serebii: { id: '564' }, pd: {}, pmd: { id: '0564' } },
  },
  carracosta: {
    name: ['Carracosta'],
    sources: { ps: {}, serebii: { id: '565' }, pd: {}, pmd: { id: '0565' } },
  },
  archen: {
    name: ['Archen'],
    sources: { ps: {}, serebii: { id: '566' }, pd: {}, pmd: { id: '0566' } },
  },
  archeops: {
    name: ['Archeops'],
    sources: { ps: {}, serebii: { id: '567' }, pd: {}, pmd: { id: '0567' } },
  },
  trubbish: {
    name: ['Trubbish'],
    sources: { ps: {}, serebii: { id: '568' }, pd: {}, pmd: { id: '0568' } },
  },
  garbodor: {
    name: ['Garbodor'],
    sources: { ps: {}, serebii: { id: '569' }, pd: {}, pmd: { id: '0569' } },
  },
  garbodorgmax: {
    name: ['Garbodor-Gmax'],
    sources: {
      ps: { id: 'garbodor-gmax' },
      serebii: { id: '569-gi' },
      pd: { id: 'garbodor-gigantamax' },
      pmd: { id: '0569' },
    },
  },
  garbodormega: {
    name: ['Mega Garbodor', 'Garbodor-Mega'],
    sources: {
      ps: { id: 'garbodor-gmax' },
      serebii: { id: '569-gi' },
      pd: { id: 'garbodor-gigantamax' },
      pmd: { id: '0569' },
    },
  },
  zorua: {
    name: ['Zorua'],
    sources: { ps: {}, serebii: { id: '570' }, pd: {}, pmd: { id: '0570' } },
  },
  zoruahisui: {
    name: ['Hisuian Zorua', 'Zorua-Hisui', 'Zorua-H'],
    sources: {
      ps: { id: 'zorua-hisui' },
      serebii: { id: '570-h' },
      pd: { id: 'zorua-hisuian' },
      pmd: { id: '0570/0001' },
    },
  },
  zoroark: {
    name: ['Zoroark'],
    sources: { ps: {}, serebii: { id: '571' }, pd: {}, pmd: { id: '0571' } },
  },
  zoroarkhisui: {
    name: ['Hisuian Zoroark', 'Zoroark-Hisui', 'Zoroark-H'],
    sources: {
      ps: { id: 'zoroark-hisui' },
      serebii: { id: '571-h' },
      pd: { id: 'zoroark-hisuian' },
      pmd: { id: '0571/0001' },
    },
  },
  minccino: {
    name: ['Minccino'],
    sources: { ps: {}, serebii: { id: '572' }, pd: {}, pmd: { id: '0572' } },
  },
  cinccino: {
    name: ['Cinccino'],
    sources: { ps: {}, serebii: { id: '573' }, pd: {}, pmd: { id: '0573' } },
  },
  gothita: {
    name: ['Gothita'],
    sources: { ps: {}, serebii: { id: '574' }, pd: {}, pmd: { id: '0574' } },
  },
  gothorita: {
    name: ['Gothorita'],
    sources: { ps: {}, serebii: { id: '575' }, pd: {}, pmd: { id: '0575' } },
  },
  gothitelle: {
    name: ['Gothitelle'],
    sources: { ps: {}, serebii: { id: '576' }, pd: {}, pmd: { id: '0576' } },
  },
  solosis: {
    name: ['Solosis'],
    sources: { ps: {}, serebii: { id: '577' }, pd: {}, pmd: { id: '0577' } },
  },
  duosion: {
    name: ['Duosion'],
    sources: { ps: {}, serebii: { id: '578' }, pd: {}, pmd: { id: '0578' } },
  },
  reuniclus: {
    name: ['Reuniclus'],
    sources: { ps: {}, serebii: { id: '579' }, pd: {}, pmd: { id: '0579' } },
  },
  ducklett: {
    name: ['Ducklett'],
    sources: { ps: {}, serebii: { id: '580' }, pd: {}, pmd: { id: '0580' } },
  },
  swanna: {
    name: ['Swanna'],
    sources: { ps: {}, serebii: { id: '581' }, pd: {}, pmd: { id: '0581' } },
  },
  vanillite: {
    name: ['Vanillite'],
    sources: { ps: {}, serebii: { id: '582' }, pd: {}, pmd: { id: '0582' } },
  },
  vanillish: {
    name: ['Vanillish'],
    sources: { ps: {}, serebii: { id: '583' }, pd: {}, pmd: { id: '0583' } },
  },
  vanilluxe: {
    name: ['Vanilluxe'],
    sources: { ps: {}, serebii: { id: '584' }, pd: {}, pmd: { id: '0584' } },
  },
  deerling: {
    name: ['Deerling'],
    sources: { ps: {}, serebii: { id: '585' }, pd: {}, pmd: { id: '0585' } },
  },
  sawsbuck: {
    name: ['Sawsbuck'],
    sources: { ps: {}, serebii: { id: '586' }, pd: {}, pmd: { id: '0586' } },
  },
  emolga: {
    name: ['Emolga'],
    sources: { ps: {}, serebii: { id: '587' }, pd: {}, pmd: { id: '0587' } },
  },
  karrablast: {
    name: ['Karrablast'],
    sources: { ps: {}, serebii: { id: '588' }, pd: {}, pmd: { id: '0588' } },
  },
  escavalier: {
    name: ['Escavalier'],
    sources: { ps: {}, serebii: { id: '589' }, pd: {}, pmd: { id: '0589' } },
  },
  foongus: {
    name: ['Foongus'],
    sources: { ps: {}, serebii: { id: '590' }, pd: {}, pmd: { id: '0590' } },
  },
  amoonguss: {
    name: ['Amoonguss'],
    sources: { ps: {}, serebii: { id: '591' }, pd: {}, pmd: { id: '0591' } },
  },
  frillish: {
    name: ['Frillish'],
    sources: { ps: {}, serebii: { id: '592' }, pd: {}, pmd: { id: '0592' } },
  },
  jellicent: {
    name: ['Jellicent'],
    sources: {
      ps: {},
      serebii: { id: '593' },
      pd: { flip: true },
      pmd: { id: '0593' },
    },
  },
  alomomola: {
    name: ['Alomomola'],
    sources: { ps: {}, serebii: { id: '594' }, pd: {}, pmd: { id: '0594' } },
  },
  joltik: {
    name: ['Joltik'],
    sources: { ps: {}, serebii: { id: '595' }, pd: {}, pmd: { id: '0595' } },
  },
  galvantula: {
    name: ['Galvantula'],
    sources: { ps: {}, serebii: { id: '596' }, pd: {}, pmd: { id: '0596' } },
  },
  ferroseed: {
    name: ['Ferroseed'],
    sources: { ps: {}, serebii: { id: '597' }, pd: {}, pmd: { id: '0597' } },
  },
  ferrothorn: {
    name: ['Ferrothorn'],
    sources: { ps: {}, serebii: { id: '598' }, pd: {}, pmd: { id: '0598' } },
  },
  klink: {
    name: ['Klink'],
    sources: { ps: {}, serebii: { id: '599' }, pd: {}, pmd: { id: '0599' } },
  },
  klang: {
    name: ['Klang'],
    sources: { ps: {}, serebii: { id: '600' }, pd: {}, pmd: { id: '0600' } },
  },
  klinklang: {
    name: ['Klinklang'],
    sources: { ps: {}, serebii: { id: '601' }, pd: {}, pmd: { id: '0601' } },
  },
  tynamo: {
    name: ['Tynamo'],
    sources: { ps: {}, serebii: { id: '602' }, pd: {}, pmd: { id: '0602' } },
  },
  eelektrik: {
    name: ['Eelektrik'],
    sources: { ps: {}, serebii: { id: '603' }, pd: {}, pmd: { id: '0603' } },
  },
  eelektross: {
    name: ['Eelektross'],
    sources: { ps: {}, serebii: { id: '604' }, pd: {}, pmd: { id: '0604' } },
  },
  elgyem: {
    name: ['Elgyem'],
    sources: {
      ps: {},
      serebii: { id: '605' },
      pd: { flip: true },
      pmd: { id: '0605' },
    },
  },
  beheeyem: {
    name: ['Beheeyem'],
    sources: { ps: {}, serebii: { id: '606' }, pd: {}, pmd: { id: '0606' } },
  },
  litwick: {
    name: ['Litwick'],
    sources: { ps: {}, serebii: { id: '607' }, pd: {}, pmd: { id: '0607' } },
  },
  lampent: {
    name: ['Lampent'],
    sources: { ps: {}, serebii: { id: '608' }, pd: {}, pmd: { id: '0608' } },
  },
  chandelure: {
    name: ['Chandelure'],
    sources: { ps: {}, serebii: { id: '609' }, pd: {}, pmd: { id: '0609' } },
  },
  axew: {
    name: ['Axew'],
    sources: { ps: {}, serebii: { id: '610' }, pd: {}, pmd: { id: '0610' } },
  },
  fraxure: {
    name: ['Fraxure'],
    sources: { ps: {}, serebii: { id: '611' }, pd: {}, pmd: { id: '0611' } },
  },
  haxorus: {
    name: ['Haxorus'],
    sources: { ps: {}, serebii: { id: '612' }, pd: {}, pmd: { id: '0612' } },
  },
  cubchoo: {
    name: ['Cubchoo'],
    sources: { ps: {}, serebii: { id: '613' }, pd: {}, pmd: { id: '0613' } },
  },
  beartic: {
    name: ['Beartic'],
    sources: { ps: {}, serebii: { id: '614' }, pd: {}, pmd: { id: '0614' } },
  },
  cryogonal: {
    name: ['Cryogonal'],
    sources: { ps: {}, serebii: { id: '615' }, pd: {}, pmd: { id: '0615' } },
  },
  shelmet: {
    name: ['Shelmet'],
    sources: { ps: {}, serebii: { id: '616' }, pd: {}, pmd: { id: '0616' } },
  },
  accelgor: {
    name: ['Accelgor'],
    sources: {
      ps: {},
      serebii: { id: '617' },
      pd: { flip: true },
      pmd: { id: '0617' },
    },
  },
  stunfisk: {
    name: ['Stunfisk'],
    sources: { ps: {}, serebii: { id: '618' }, pd: {}, pmd: { id: '0618' } },
  },
  stunfiskgalar: {
    name: ['Galarian Stunfisk', 'Stunfisk-Galar', 'Stunfisk-G'],
    sources: {
      ps: { id: 'stunfisk-galar' },
      serebii: { id: '618-g' },
      pd: { id: 'stunfisk-galarian' },
      pmd: { id: '0618/0001' },
    },
  },
  mienfoo: {
    name: ['Mienfoo'],
    sources: { ps: {}, serebii: { id: '619' }, pd: {}, pmd: { id: '0619' } },
  },
  mienshao: {
    name: ['Mienshao'],
    sources: { ps: {}, serebii: { id: '620' }, pd: {}, pmd: { id: '0620' } },
  },
  druddigon: {
    name: ['Druddigon'],
    sources: { ps: {}, serebii: { id: '621' }, pd: {}, pmd: { id: '0621' } },
  },
  golett: {
    name: ['Golett'],
    sources: { ps: {}, serebii: { id: '622' }, pd: {}, pmd: { id: '0622' } },
  },
  golurk: {
    name: ['Golurk'],
    sources: { ps: {}, serebii: { id: '623' }, pd: {}, pmd: { id: '0623' } },
  },
  pawniard: {
    name: ['Pawniard'],
    sources: {
      ps: {},
      serebii: { id: '624' },
      pd: { flip: true },
      pmd: { id: '0624' },
    },
  },
  bisharp: {
    name: ['Bisharp'],
    sources: { ps: {}, serebii: { id: '625' }, pd: {}, pmd: { id: '0625' } },
  },
  bouffalant: {
    name: ['Bouffalant'],
    sources: { ps: {}, serebii: { id: '626' }, pd: {}, pmd: { id: '0626' } },
  },
  rufflet: {
    name: ['Rufflet'],
    sources: { ps: {}, serebii: { id: '627' }, pd: {}, pmd: { id: '0627' } },
  },
  braviary: {
    name: ['Braviary'],
    sources: { ps: {}, serebii: { id: '628' }, pd: {}, pmd: { id: '0628' } },
  },
  braviaryhisui: {
    name: ['Hisuian Braviary', 'Braviary-Hisui', 'Braviary-H'],
    sources: {
      ps: { id: 'braviary-hisui' },
      serebii: { id: '628-h' },
      pd: { id: 'braviary-hisuian' },
      pmd: { id: '0628/0001' },
    },
  },
  vullaby: {
    name: ['Vullaby'],
    sources: { ps: {}, serebii: { id: '629' }, pd: {}, pmd: { id: '0629' } },
  },
  mandibuzz: {
    name: ['Mandibuzz'],
    sources: {
      ps: {},
      serebii: { id: '630' },
      pd: { flip: true },
      pmd: { id: '0630' },
    },
  },
  heatmor: {
    name: ['Heatmor'],
    sources: { ps: {}, serebii: { id: '631' }, pd: {}, pmd: { id: '0631' } },
  },
  durant: {
    name: ['Durant'],
    sources: { ps: {}, serebii: { id: '632' }, pd: {}, pmd: { id: '0632' } },
  },
  deino: {
    name: ['Deino'],
    sources: { ps: {}, serebii: { id: '633' }, pd: {}, pmd: { id: '0633' } },
  },
  zweilous: {
    name: ['Zweilous'],
    sources: { ps: {}, serebii: { id: '634' }, pd: {}, pmd: { id: '0634' } },
  },
  hydreigon: {
    name: ['Hydreigon'],
    sources: { ps: {}, serebii: { id: '635' }, pd: {}, pmd: { id: '0635' } },
  },
  larvesta: {
    name: ['Larvesta'],
    sources: { ps: {}, serebii: { id: '636' }, pd: {}, pmd: { id: '0636' } },
  },
  volcarona: {
    name: ['Volcarona'],
    sources: { ps: {}, serebii: { id: '637' }, pd: {}, pmd: { id: '0637' } },
  },
  cobalion: {
    name: ['Cobalion'],
    sources: { ps: {}, serebii: { id: '638' }, pd: {}, pmd: { id: '0638' } },
  },
  terrakion: {
    name: ['Terrakion'],
    sources: { ps: {}, serebii: { id: '639' }, pd: {}, pmd: { id: '0639' } },
  },
  virizion: {
    name: ['Virizion'],
    sources: {
      ps: {},
      serebii: { id: '640' },
      pd: { flip: true },
      pmd: { id: '0640' },
    },
  },
  tornadus: {
    name: ['Tornadus-Incarnate', 'Tornadus', 'Tornadus-I'],
    sources: { ps: {}, serebii: { id: '641' }, pd: {}, pmd: { id: '0641' } },
  },
  tornadustherian: {
    name: ['Tornadus-T', 'Tornadus-Therian'],
    sources: {
      ps: { id: 'tornadus-therian' },
      serebii: { id: '641-t' },
      pd: { id: 'tornadus-therian' },
      pmd: { id: '0641/0001' },
    },
  },
  thundurus: {
    name: ['Thundurus-Incarnate', 'Thundurus', 'Thundurus-I'],
    sources: {
      ps: {},
      serebii: { id: '642' },
      pd: { flip: true },
      pmd: { id: '0642' },
    },
  },
  thundurustherian: {
    name: ['Thundurus-T', 'Thundurus-Therian'],
    sources: {
      ps: { id: 'thundurus-therian' },
      serebii: { id: '642-t' },
      pd: { id: 'thundurus-therian', flip: true },
      pmd: { id: '0642/0001' },
    },
  },
  reshiram: {
    name: ['Reshiram'],
    sources: {
      ps: {},
      serebii: { id: '643' },
      pd: { flip: true },
      pmd: { id: '0643' },
    },
  },
  zekrom: {
    name: ['Zekrom'],
    sources: { ps: {}, serebii: { id: '644' }, pd: {}, pmd: { id: '0644' } },
  },
  landorus: {
    name: ['Landorus-Incarnate', 'Landorus', 'Landorus-I'],
    sources: { ps: {}, serebii: { id: '645' }, pd: {}, pmd: { id: '0645' } },
  },
  landorustherian: {
    name: ['Landorus-T', 'Landorus-Therian'],
    sources: {
      ps: { id: 'landorus-therian' },
      serebii: { id: '645-t' },
      pd: { id: 'landorus-therian' },
      pmd: { id: '0645/0001' },
    },
  },
  kyurem: {
    name: ['Kyurem'],
    sources: { ps: {}, serebii: { id: '646' }, pd: {}, pmd: { id: '0646' } },
  },
  kyuremblack: {
    name: ['Kyurem-Black'],
    sources: {
      ps: { id: 'kyurem-black' },
      serebii: { id: '646-b' },
      pd: { id: 'kyurem-black', flip: true },
      pmd: { id: '0646/0001' },
    },
  },
  kyuremwhite: {
    name: ['Kyurem-White'],
    sources: {
      ps: { id: 'kyurem-white' },
      serebii: { id: '646-w' },
      pd: { id: 'kyurem-white' },
      pmd: { id: '0646/0002' },
    },
  },
  keldeo: {
    name: ['Keldeo'],
    sources: { ps: {}, serebii: { id: '647' }, pd: {}, pmd: { id: '0647' } },
  },
  keldeoresolute: {
    name: ['Keldeo-Resolute'],
    sources: {
      ps: { id: 'keldeo-resolute' },
      serebii: { id: '647-r' },
      pd: { id: 'keldeo-resolute', flip: true },
      pmd: { id: '0647/0001' },
    },
  },
  meloetta: {
    name: ['Meloetta'],
    sources: { ps: {}, serebii: { id: '648' }, pd: {}, pmd: { id: '0648' } },
  },
  meloettapirouette: {
    name: ['Meloetta-Pirouette'],
    sources: {
      ps: { id: 'meloetta-pirouette' },
      serebii: { id: '648-p' },
      pd: { id: 'meloetta-pirouette', flip: true },
      pmd: { id: '0648/0001' },
    },
  },
  genesect: {
    name: ['Genesect'],
    sources: { ps: {}, serebii: { id: '649' }, pd: {}, pmd: { id: '0649' } },
  },
  genesectdouse: {
    name: ['Genesect-Douse'],
    sources: {
      ps: { id: 'genesect-douse' },
      serebii: { id: '649-w' },
      pd: { id: 'genesect-douse' },
      pmd: { id: '0649/0001' },
    },
  },
  genesectshock: {
    name: ['Genesect-Shock'],
    sources: {
      ps: { id: 'genesect-shock' },
      serebii: { id: '649-e' },
      pd: { id: 'genesect-shock' },
      pmd: { id: '0649/0002' },
    },
  },
  genesectburn: {
    name: ['Genesect-Burn'],
    sources: {
      ps: { id: 'genesect-burn' },
      serebii: { id: '649-f' },
      pd: { id: 'genesect-burn' },
      pmd: { id: '0649/0003' },
    },
  },
  genesectchill: {
    name: ['Genesect-Chill'],
    sources: {
      ps: { id: 'genesect-chill' },
      serebii: { id: '649-i' },
      pd: { id: 'genesect-chill' },
      pmd: { id: '0649/0004' },
    },
  },
  chespin: {
    name: ['Chespin'],
    sources: { ps: {}, serebii: { id: '650' }, pd: {}, pmd: { id: '0650' } },
  },
  quilladin: {
    name: ['Quilladin'],
    sources: { ps: {}, serebii: { id: '651' }, pd: {}, pmd: { id: '0651' } },
  },
  chesnaught: {
    name: ['Chesnaught'],
    sources: { ps: {}, serebii: { id: '652' }, pd: {}, pmd: { id: '0652' } },
  },
  fennekin: {
    name: ['Fennekin'],
    sources: { ps: {}, serebii: { id: '653' }, pd: {}, pmd: { id: '0653' } },
  },
  braixen: {
    name: ['Braixen'],
    sources: { ps: {}, serebii: { id: '654' }, pd: {}, pmd: { id: '0654' } },
  },
  delphox: {
    name: ['Delphox'],
    sources: { ps: {}, serebii: { id: '655' }, pd: {}, pmd: { id: '0655' } },
  },
  froakie: {
    name: ['Froakie'],
    sources: {
      ps: {},
      serebii: { id: '656' },
      pd: { flip: true },
      pmd: { id: '0656' },
    },
  },
  frogadier: {
    name: ['Frogadier'],
    sources: { ps: {}, serebii: { id: '657' }, pd: {}, pmd: { id: '0657' } },
  },
  greninja: {
    name: ['Greninja'],
    sources: {
      ps: {},
      serebii: { id: '658' },
      pd: { flip: true },
      pmd: { id: '0658' },
    },
  },
  greninjabond: {
    name: ['Greninja-Bond'],
    sources: {
      ps: { id: 'greninja' },
      serebii: { id: '658' },
      pd: { id: 'greninja' },
      pmd: { id: '0658' },
    },
  },
  greninjaash: {
    name: ['Greninja-Ash'],
    sources: {
      ps: { id: 'greninja-ash' },
      serebii: { id: '658-a' },
      pd: { id: 'greninja-ash' },
      pmd: { id: '0658/0001' },
    },
  },
  bunnelby: {
    name: ['Bunnelby'],
    sources: { ps: {}, serebii: { id: '659' }, pd: {}, pmd: { id: '0659' } },
  },
  diggersby: {
    name: ['Diggersby'],
    sources: { ps: {}, serebii: { id: '660' }, pd: {}, pmd: { id: '0660' } },
  },
  fletchling: {
    name: ['Fletchling'],
    sources: { ps: {}, serebii: { id: '661' }, pd: {}, pmd: { id: '0661' } },
  },
  fletchinder: {
    name: ['Fletchinder'],
    sources: { ps: {}, serebii: { id: '662' }, pd: {}, pmd: { id: '0662' } },
  },
  talonflame: {
    name: ['Talonflame'],
    sources: { ps: {}, serebii: { id: '663' }, pd: {}, pmd: { id: '0663' } },
  },
  scatterbug: {
    name: ['Scatterbug'],
    sources: {
      ps: {},
      serebii: { id: '664' },
      pd: { flip: true },
      pmd: { id: '0664' },
    },
  },
  spewpa: {
    name: ['Spewpa'],
    sources: { ps: {}, serebii: { id: '665' }, pd: {}, pmd: { id: '0665' } },
  },
  vivillon: {
    name: ['Vivillon'],
    sources: { ps: {}, serebii: { id: '666' }, pd: {}, pmd: { id: '0666' } },
  },
  vivillonfancy: {
    name: ['Vivillon-Fancy'],
    sources: {
      ps: { id: 'vivillon-fancy' },
      serebii: { id: '666-f' },
      pd: { id: 'vivillon-fancy' },
      pmd: { id: '0666/0018' },
    },
  },
  vivillonpokeball: {
    name: ['Vivillon-Pokeball'],
    sources: {
      ps: { id: 'vivillon-pokeball' },
      serebii: { id: '666-pb' },
      pd: { id: 'vivillon-poke-ball' },
      pmd: { id: '0666/0019' },
    },
  },
  litleo: {
    name: ['Litleo'],
    sources: { ps: {}, serebii: { id: '667' }, pd: {}, pmd: { id: '0667' } },
  },
  pyroar: {
    name: ['Pyroar'],
    sources: {
      ps: {},
      serebii: { id: '668' },
      pd: { flip: true },
      pmd: { id: '0668' },
    },
  },
  flabebe: {
    name: ['Flabébé'],
    sources: { ps: {}, serebii: { id: '669' }, pd: {}, pmd: { id: '0669' } },
  },
  floette: {
    name: ['Floette'],
    sources: {
      ps: {},
      serebii: { id: '670' },
      pd: { flip: true },
      pmd: { id: '0670' },
    },
  },
  floetteeternal: {
    name: ['Floette-Eternal'],
    sources: {
      ps: { id: 'floette-eternal' },
      serebii: { id: '670' },
      pd: { id: 'floette', flip: true },
      pmd: { id: '0670/0005' },
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
    sources: { ps: {}, serebii: { id: '671' }, pd: {}, pmd: { id: '0671' } },
  },
  skiddo: {
    name: ['Skiddo'],
    sources: { ps: {}, serebii: { id: '672' }, pd: {}, pmd: { id: '0672' } },
  },
  gogoat: {
    name: ['Gogoat'],
    sources: { ps: {}, serebii: { id: '673' }, pd: {}, pmd: { id: '0673' } },
  },
  pancham: {
    name: ['Pancham'],
    sources: { ps: {}, serebii: { id: '674' }, pd: {}, pmd: { id: '0674' } },
  },
  pangoro: {
    name: ['Pangoro'],
    sources: { ps: {}, serebii: { id: '675' }, pd: {}, pmd: { id: '0675' } },
  },
  furfrou: {
    name: ['Furfrou'],
    sources: { ps: {}, serebii: { id: '676' }, pd: {}, pmd: { id: '0676' } },
  },
  espurr: {
    name: ['Espurr'],
    sources: { ps: {}, serebii: { id: '677' }, pd: {}, pmd: { id: '0677' } },
  },
  meowstic: {
    name: ['Meowstic'],
    sources: { ps: {}, serebii: { id: '678' }, pd: {}, pmd: { id: '0678' } },
  },
  meowsticf: {
    name: ['Meowstic-Female', 'Meowstic-F'],
    sources: {
      ps: { id: 'meowstic-f' },
      serebii: { id: '678-f' },
      pd: { id: 'meowstic-female' },
      pmd: { id: '0678/0000/0000/0002' },
    },
  },
  honedge: {
    name: ['Honedge'],
    sources: { ps: {}, serebii: { id: '679' }, pd: {}, pmd: { id: '0679' } },
  },
  doublade: {
    name: ['Doublade'],
    sources: { ps: {}, serebii: { id: '680' }, pd: {}, pmd: { id: '0680' } },
  },
  aegislash: {
    name: ['Aegislash'],
    sources: { ps: {}, serebii: { id: '681' }, pd: {}, pmd: { id: '0681' } },
  },
  aegislashblade: {
    name: ['Aegislash-Blade'],
    sources: {
      ps: { id: 'aegislash-blade' },
      serebii: { id: '681-b' },
      pd: { id: 'aegislash-blade' },
      pmd: { id: '0681/0001' },
    },
  },
  spritzee: {
    name: ['Spritzee'],
    sources: { ps: {}, serebii: { id: '682' }, pd: {}, pmd: { id: '0682' } },
  },
  aromatisse: {
    name: ['Aromatisse'],
    sources: {
      ps: {},
      serebii: { id: '683' },
      pd: { flip: true },
      pmd: { id: '0683' },
    },
  },
  swirlix: {
    name: ['Swirlix'],
    sources: { ps: {}, serebii: { id: '684' }, pd: {}, pmd: { id: '0684' } },
  },
  slurpuff: {
    name: ['Slurpuff'],
    sources: { ps: {}, serebii: { id: '685' }, pd: {}, pmd: { id: '0685' } },
  },
  inkay: {
    name: ['Inkay'],
    sources: {
      ps: {},
      serebii: { id: '686' },
      pd: { flip: true },
      pmd: { id: '0686' },
    },
  },
  malamar: {
    name: ['Malamar'],
    sources: { ps: {}, serebii: { id: '687' }, pd: {}, pmd: { id: '0687' } },
  },
  binacle: {
    name: ['Binacle'],
    sources: { ps: {}, serebii: { id: '688' }, pd: {}, pmd: { id: '0688' } },
  },
  barbaracle: {
    name: ['Barbaracle'],
    sources: { ps: {}, serebii: { id: '689' }, pd: {}, pmd: { id: '0689' } },
  },
  skrelp: {
    name: ['Skrelp'],
    sources: { ps: {}, serebii: { id: '690' }, pd: {}, pmd: { id: '0690' } },
  },
  dragalge: {
    name: ['Dragalge'],
    sources: { ps: {}, serebii: { id: '691' }, pd: {}, pmd: { id: '0691' } },
  },
  clauncher: {
    name: ['Clauncher'],
    sources: { ps: {}, serebii: { id: '692' }, pd: {}, pmd: { id: '0692' } },
  },
  clawitzer: {
    name: ['Clawitzer'],
    sources: { ps: {}, serebii: { id: '693' }, pd: {}, pmd: { id: '0693' } },
  },
  helioptile: {
    name: ['Helioptile'],
    sources: { ps: {}, serebii: { id: '694' }, pd: {}, pmd: { id: '0694' } },
  },
  heliolisk: {
    name: ['Heliolisk'],
    sources: { ps: {}, serebii: { id: '695' }, pd: {}, pmd: { id: '0695' } },
  },
  tyrunt: {
    name: ['Tyrunt'],
    sources: {
      ps: {},
      serebii: { id: '696' },
      pd: { flip: true },
      pmd: { id: '0696' },
    },
  },
  tyrantrum: {
    name: ['Tyrantrum'],
    sources: { ps: {}, serebii: { id: '697' }, pd: {}, pmd: { id: '0697' } },
  },
  amaura: {
    name: ['Amaura'],
    sources: { ps: {}, serebii: { id: '698' }, pd: {}, pmd: { id: '0698' } },
  },
  aurorus: {
    name: ['Aurorus'],
    sources: { ps: {}, serebii: { id: '699' }, pd: {}, pmd: { id: '0699' } },
  },
  sylveon: {
    name: ['Sylveon'],
    sources: { ps: {}, serebii: { id: '700' }, pd: {}, pmd: { id: '0700' } },
  },
  hawlucha: {
    name: ['Hawlucha'],
    sources: { ps: {}, serebii: { id: '701' }, pd: {}, pmd: { id: '0701' } },
  },
  dedenne: {
    name: ['Dedenne'],
    sources: { ps: {}, serebii: { id: '702' }, pd: {}, pmd: { id: '0702' } },
  },
  carbink: {
    name: ['Carbink'],
    sources: { ps: {}, serebii: { id: '703' }, pd: {}, pmd: { id: '0703' } },
  },
  goomy: {
    name: ['Goomy'],
    sources: { ps: {}, serebii: { id: '704' }, pd: {}, pmd: { id: '0704' } },
  },
  sliggoo: {
    name: ['Sliggoo'],
    sources: {
      ps: {},
      serebii: { id: '705' },
      pd: { flip: true },
      pmd: { id: '0705' },
    },
  },
  sliggoohisui: {
    name: ['Hisuian Sliggoo', 'Sliggoo-Hisui', 'Sliggoo-H'],
    sources: {
      ps: { id: 'sliggoo-hisui' },
      serebii: { id: '705-h' },
      pd: { id: 'sliggoo-hisuian' },
      pmd: { id: '0705/0001' },
    },
  },
  goodra: {
    name: ['Goodra'],
    sources: { ps: {}, serebii: { id: '706' }, pd: {}, pmd: { id: '0706' } },
  },
  goodrahisui: {
    name: ['Hisuian Goodra', 'Goodra-Hisui', 'Goodra-H'],
    sources: {
      ps: { id: 'goodra-hisui' },
      serebii: { id: '706-h' },
      pd: { id: 'goodra-hisuian' },
      pmd: { id: '0706/0001' },
    },
  },
  klefki: {
    name: ['Klefki'],
    sources: { ps: {}, serebii: { id: '707' }, pd: {}, pmd: { id: '0707' } },
  },
  phantump: {
    name: ['Phantump'],
    sources: {
      ps: {},
      serebii: { id: '708' },
      pd: { flip: true },
      pmd: { id: '0708' },
    },
  },
  trevenant: {
    name: ['Trevenant'],
    sources: { ps: {}, serebii: { id: '709' }, pd: {}, pmd: { id: '0709' } },
  },
  pumpkaboo: {
    name: ['Pumpkaboo'],
    sources: { ps: {}, serebii: { id: '710' }, pd: {}, pmd: { id: '0710' } },
  },
  pumpkaboosmall: {
    name: ['Pumpkaboo-Small'],
    sources: {
      ps: { id: 'pumpkaboo-small' },
      serebii: { id: '710-s' },
      pd: { id: 'pumpkaboo-small' },
      pmd: { id: '0710' },
    },
  },
  pumpkaboolarge: {
    name: ['Pumpkaboo-Large'],
    sources: {
      ps: { id: 'pumpkaboo-large' },
      serebii: { id: '710-l' },
      pd: { id: 'pumpkaboo-large' },
      pmd: { id: '0710' },
    },
  },
  pumpkaboosuper: {
    name: ['Pumpkaboo-Super'],
    sources: {
      ps: { id: 'pumpkaboo-super' },
      serebii: { id: '710-h' },
      pd: { id: 'pumpkaboo-super' },
      pmd: { id: '0710' },
    },
  },
  gourgeist: {
    name: ['Gourgeist'],
    sources: { ps: {}, serebii: { id: '711' }, pd: {}, pmd: { id: '0711' } },
  },
  gourgeistsmall: {
    name: ['Gourgeist-Small'],
    sources: {
      ps: { id: 'gourgeist-small' },
      serebii: { id: '711' },
      pd: { id: 'gourgeist-small' },
      pmd: { id: '0711' },
    },
  },
  gourgeistlarge: {
    name: ['Gourgeist-Large'],
    sources: {
      ps: { id: 'gourgeist-large' },
      serebii: { id: '711-l' },
      pd: { id: 'gourgeist-large' },
      pmd: { id: '0711' },
    },
  },
  gourgeistsuper: {
    name: ['Gourgeist-Super'],
    sources: {
      ps: { id: 'gourgeist-super' },
      serebii: { id: '711-h' },
      pd: { id: 'gourgeist-super' },
      pmd: { id: '0711' },
    },
  },
  bergmite: {
    name: ['Bergmite'],
    sources: { ps: {}, serebii: { id: '712' }, pd: {}, pmd: { id: '0712' } },
  },
  avalugg: {
    name: ['Avalugg'],
    sources: { ps: {}, serebii: { id: '713' }, pd: {}, pmd: { id: '0713' } },
  },
  avalugghisui: {
    name: ['Hisuian Avalugg', 'Avalugg-Hisui', 'Avalugg-H'],
    sources: {
      ps: { id: 'avalugg-hisui' },
      serebii: { id: '713-h' },
      pd: { id: 'avalugg-hisuian' },
      pmd: { id: '0713/0001' },
    },
  },
  noibat: {
    name: ['Noibat'],
    sources: { ps: {}, serebii: { id: '714' }, pd: {}, pmd: { id: '0714' } },
  },
  noivern: {
    name: ['Noivern'],
    sources: { ps: {}, serebii: { id: '715' }, pd: {}, pmd: { id: '0715' } },
  },
  xerneas: {
    name: ['Xerneas'],
    sources: {
      ps: {},
      serebii: { id: '716-a' },
      pd: { id: 'xerneas-active', flip: true },
      pmd: { id: '0716' },
    },
  },
  xerneasneutral: {
    name: ['Xerneas-Neutral'],
    sources: {
      ps: { id: 'xerneas-neutral' },
      serebii: { id: '716' },
      pd: { id: 'xerneas', flip: true },
      pmd: { id: '0716' },
    },
  },
  yveltal: {
    name: ['Yveltal'],
    sources: { ps: {}, serebii: { id: '717' }, pd: {}, pmd: { id: '0717' } },
  },
  zygarde: {
    name: ['Zygarde'],
    sources: { ps: {}, serebii: { id: '718' }, pd: {}, pmd: { id: '0718' } },
  },
  zygarde10: {
    name: ['Zygarde-10%'],
    sources: {
      ps: { id: 'zygarde-10' },
      serebii: { id: '718-10' },
      pd: { id: 'zygarde-10' },
      pmd: { id: '0718/0001' },
    },
  },
  zygardecomplete: {
    name: ['Zygarde-Complete'],
    sources: {
      ps: { id: 'zygarde-complete' },
      serebii: { id: '718-c' },
      pd: { id: 'zygarde-complete' },
      pmd: { id: '0718/0002' },
    },
  },
  diancie: {
    name: ['Diancie'],
    sources: { ps: {}, serebii: { id: '719' }, pd: {}, pmd: { id: '0719' } },
  },
  dianciemega: {
    name: ['Mega Diancie', 'Diancie-Mega'],
    sources: {
      ps: { id: 'diancie-mega' },
      serebii: { id: '719-m' },
      pd: { id: 'diancie-mega' },
      pmd: { id: '0719/0001' },
    },
  },
  hoopa: {
    name: ['Hoopa'],
    sources: { ps: {}, serebii: { id: '720' }, pd: {}, pmd: { id: '0720' } },
  },
  hoopaunbound: {
    name: ['Hoopa-Unbound'],
    sources: {
      ps: { id: 'hoopa-unbound' },
      serebii: { id: '720-u' },
      pd: { id: 'hoopa-unbound' },
      pmd: { id: '0720/0001' },
    },
  },
  volcanion: {
    name: ['Volcanion'],
    sources: { ps: {}, serebii: { id: '721' }, pd: {}, pmd: { id: '0721' } },
  },
  rowlet: {
    name: ['Rowlet'],
    sources: { ps: {}, serebii: { id: '722' }, pd: {}, pmd: { id: '0722' } },
  },
  dartrix: {
    name: ['Dartrix'],
    sources: {
      ps: {},
      serebii: { id: '723' },
      pd: { flip: true },
      pmd: { id: '0723' },
    },
  },
  decidueye: {
    name: ['Decidueye'],
    sources: {
      ps: {},
      serebii: { id: '724' },
      pd: { flip: true },
      pmd: { id: '0724' },
    },
  },
  decidueyehisui: {
    name: ['Hisuian Decidueye', 'Decidueye-Hisui', 'Decidueye-H'],
    sources: {
      ps: { id: 'decidueye-hisui' },
      serebii: { id: '724-h' },
      pd: { id: 'decidueye-hisuian' },
      pmd: { id: '0724/0001' },
    },
  },
  litten: {
    name: ['Litten'],
    sources: { ps: {}, serebii: { id: '725' }, pd: {}, pmd: { id: '0725' } },
  },
  torracat: {
    name: ['Torracat'],
    sources: { ps: {}, serebii: { id: '726' }, pd: {}, pmd: { id: '0726' } },
  },
  incineroar: {
    name: ['Incineroar'],
    sources: { ps: {}, serebii: { id: '727' }, pd: {}, pmd: { id: '0727' } },
  },
  popplio: {
    name: ['Popplio'],
    sources: {
      ps: {},
      serebii: { id: '728' },
      pd: { flip: true },
      pmd: { id: '0728' },
    },
  },
  brionne: {
    name: ['Brionne'],
    sources: {
      ps: {},
      serebii: { id: '729' },
      pd: { flip: true },
      pmd: { id: '0729' },
    },
  },
  primarina: {
    name: ['Primarina'],
    sources: { ps: {}, serebii: { id: '730' }, pd: {}, pmd: { id: '0730' } },
  },
  pikipek: {
    name: ['Pikipek'],
    sources: { ps: {}, serebii: { id: '731' }, pd: {}, pmd: { id: '0731' } },
  },
  trumbeak: {
    name: ['Trumbeak'],
    sources: { ps: {}, serebii: { id: '732' }, pd: {}, pmd: { id: '0732' } },
  },
  toucannon: {
    name: ['Toucannon'],
    sources: { ps: {}, serebii: { id: '733' }, pd: {}, pmd: { id: '0733' } },
  },
  yungoos: {
    name: ['Yungoos'],
    sources: { ps: {}, serebii: { id: '734' }, pd: {}, pmd: { id: '0734' } },
  },
  gumshoos: {
    name: ['Gumshoos'],
    sources: {
      ps: {},
      serebii: { id: '735' },
      pd: { flip: true },
      pmd: { id: '0735' },
    },
  },
  grubbin: {
    name: ['Grubbin'],
    sources: { ps: {}, serebii: { id: '736' }, pd: {}, pmd: { id: '0736' } },
  },
  charjabug: {
    name: ['Charjabug'],
    sources: { ps: {}, serebii: { id: '737' }, pd: {}, pmd: { id: '0737' } },
  },
  vikavolt: {
    name: ['Vikavolt'],
    sources: { ps: {}, serebii: { id: '738' }, pd: {}, pmd: { id: '0738' } },
  },
  crabrawler: {
    name: ['Crabrawler'],
    sources: { ps: {}, serebii: { id: '739' }, pd: {}, pmd: { id: '0739' } },
  },
  crabominable: {
    name: ['Crabominable'],
    sources: { ps: {}, serebii: { id: '740' }, pd: {}, pmd: { id: '0740' } },
  },
  oricorio: {
    name: ['Oricorio'],
    sources: { ps: {}, serebii: { id: '741' }, pd: {}, pmd: { id: '0741' } },
  },
  oricoriopompom: {
    name: ['Oricorio-Pom-Pom'],
    sources: {
      ps: { id: 'oricorio-pompom' },
      serebii: { id: '741-p' },
      pd: { id: 'oricorio-pom-pom' },
      pmd: { id: '0741/0001' },
    },
  },
  oricoriopau: {
    name: ["Oricorio-Pa'u"],
    sources: {
      ps: { id: 'oricorio-pau' },
      serebii: { id: '741-pau' },
      pd: { id: 'oricorio-pau' },
      pmd: { id: '0741/0002' },
    },
  },
  oricoriosensu: {
    name: ['Oricorio-Sensu'],
    sources: {
      ps: { id: 'oricorio-sensu' },
      serebii: { id: '741-s' },
      pd: { id: 'oricorio-sensu', flip: true },
      pmd: { id: '0741/0003' },
    },
  },
  cutiefly: {
    name: ['Cutiefly'],
    sources: { ps: {}, serebii: { id: '742' }, pd: {}, pmd: { id: '0742' } },
  },
  ribombee: {
    name: ['Ribombee'],
    sources: { ps: {}, serebii: { id: '743' }, pd: {}, pmd: { id: '0743' } },
  },
  rockruff: {
    name: ['Rockruff'],
    sources: {
      ps: {},
      serebii: { id: '744' },
      pd: { flip: true },
      pmd: { id: '0744' },
    },
  },
  lycanroc: {
    name: ['Lycanroc'],
    sources: { ps: {}, serebii: { id: '745' }, pd: {}, pmd: { id: '0745' } },
  },
  lycanrocmidnight: {
    name: ['Lycanroc-Midnight'],
    sources: {
      ps: { id: 'lycanroc-midnight' },
      serebii: { id: '745-m' },
      pd: { id: 'lycanroc-midnight', flip: true },
      pmd: { id: '0745/0001' },
    },
  },
  lycanrocdusk: {
    name: ['Lycanroc-Dusk'],
    sources: {
      ps: { id: 'lycanroc-dusk' },
      serebii: { id: '745-d' },
      pd: { id: 'lycanroc-dusk' },
      pmd: { id: '0745/0002' },
    },
  },
  wishiwashi: {
    name: ['Wishiwashi'],
    sources: { ps: {}, serebii: { id: '746' }, pd: {}, pmd: { id: '0746' } },
  },
  wishiwashischool: {
    name: ['Wishiwashi-School'],
    sources: {
      ps: { id: 'wishiwashi-school' },
      serebii: { id: '746-s' },
      pd: { id: 'wishiwashi-school' },
      pmd: { id: '0746/0001' },
    },
  },
  mareanie: {
    name: ['Mareanie'],
    sources: { ps: {}, serebii: { id: '747' }, pd: {}, pmd: { id: '0747' } },
  },
  toxapex: {
    name: ['Toxapex'],
    sources: { ps: {}, serebii: { id: '748' }, pd: {}, pmd: { id: '0748' } },
  },
  mudbray: {
    name: ['Mudbray'],
    sources: { ps: {}, serebii: { id: '749' }, pd: {}, pmd: { id: '0749' } },
  },
  mudsdale: {
    name: ['Mudsdale'],
    sources: {
      ps: {},
      serebii: { id: '750' },
      pd: { flip: true },
      pmd: { id: '0750' },
    },
  },
  dewpider: {
    name: ['Dewpider'],
    sources: { ps: {}, serebii: { id: '751' }, pd: {}, pmd: { id: '0751' } },
  },
  araquanid: {
    name: ['Araquanid'],
    sources: {
      ps: {},
      serebii: { id: '752' },
      pd: { flip: true },
      pmd: { id: '0752' },
    },
  },
  fomantis: {
    name: ['Fomantis'],
    sources: { ps: {}, serebii: { id: '753' }, pd: {}, pmd: { id: '0753' } },
  },
  lurantis: {
    name: ['Lurantis'],
    sources: { ps: {}, serebii: { id: '754' }, pd: {}, pmd: { id: '0754' } },
  },
  morelull: {
    name: ['Morelull'],
    sources: { ps: {}, serebii: { id: '755' }, pd: {}, pmd: { id: '0755' } },
  },
  shiinotic: {
    name: ['Shiinotic'],
    sources: { ps: {}, serebii: { id: '756' }, pd: {}, pmd: { id: '0756' } },
  },
  salandit: {
    name: ['Salandit'],
    sources: { ps: {}, serebii: { id: '757' }, pd: {}, pmd: { id: '0757' } },
  },
  salazzle: {
    name: ['Salazzle'],
    sources: {
      ps: {},
      serebii: { id: '758' },
      pd: { flip: true },
      pmd: { id: '0758' },
    },
  },
  stufful: {
    name: ['Stufful'],
    sources: { ps: {}, serebii: { id: '759' }, pd: {}, pmd: { id: '0759' } },
  },
  bewear: {
    name: ['Bewear'],
    sources: {
      ps: {},
      serebii: { id: '760' },
      pd: { flip: true },
      pmd: { id: '0760' },
    },
  },
  bounsweet: {
    name: ['Bounsweet'],
    sources: { ps: {}, serebii: { id: '761' }, pd: {}, pmd: { id: '0761' } },
  },
  steenee: {
    name: ['Steenee'],
    sources: { ps: {}, serebii: { id: '762' }, pd: {}, pmd: { id: '0762' } },
  },
  tsareena: {
    name: ['Tsareena'],
    sources: { ps: {}, serebii: { id: '763' }, pd: {}, pmd: { id: '0763' } },
  },
  comfey: {
    name: ['Comfey'],
    sources: { ps: {}, serebii: { id: '764' }, pd: {}, pmd: { id: '0764' } },
  },
  oranguru: {
    name: ['Oranguru'],
    sources: { ps: {}, serebii: { id: '765' }, pd: {}, pmd: { id: '0765' } },
  },
  passimian: {
    name: ['Passimian'],
    sources: { ps: {}, serebii: { id: '766' }, pd: {}, pmd: { id: '0766' } },
  },
  wimpod: {
    name: ['Wimpod'],
    sources: {
      ps: {},
      serebii: { id: '767' },
      pd: { flip: true },
      pmd: { id: '0767' },
    },
  },
  golisopod: {
    name: ['Golisopod'],
    sources: { ps: {}, serebii: { id: '768' }, pd: {}, pmd: { id: '0768' } },
  },
  sandygast: {
    name: ['Sandygast'],
    sources: { ps: {}, serebii: { id: '769' }, pd: {}, pmd: { id: '0769' } },
  },
  palossand: {
    name: ['Palossand'],
    sources: { ps: {}, serebii: { id: '770' }, pd: {}, pmd: { id: '0770' } },
  },
  pyukumuku: {
    name: ['Pyukumuku'],
    sources: { ps: {}, serebii: { id: '771' }, pd: {}, pmd: { id: '0771' } },
  },
  typenull: {
    name: ['Type: Null'],
    sources: {
      ps: {},
      serebii: { id: '772' },
      pd: { id: 'type-null', flip: true },
      pmd: { id: '0772' },
    },
  },
  silvally: {
    name: ['Silvally'],
    sources: { ps: {}, serebii: { id: '773' }, pd: {}, pmd: { id: '0773' } },
  },
  silvallybug: {
    name: ['Silvally-Bug'],
    sources: {
      ps: { id: 'silvally-bug' },
      serebii: { id: '773-bug' },
      pd: { id: 'silvally-bug' },
      pmd: { id: '0773/0006' },
    },
  },
  silvallydark: {
    name: ['Silvally-Dark'],
    sources: {
      ps: { id: 'silvally-dark' },
      serebii: { id: '773-dark' },
      pd: { id: 'silvally-dark' },
      pmd: { id: '0773/0016' },
    },
  },
  silvallydragon: {
    name: ['Silvally-Dragon'],
    sources: {
      ps: { id: 'silvally-dragon' },
      serebii: { id: '773-dragon' },
      pd: { id: 'silvally-dragon' },
      pmd: { id: '0773/0015' },
    },
  },
  silvallyelectric: {
    name: ['Silvally-Electric'],
    sources: {
      ps: { id: 'silvally-electric' },
      serebii: { id: '773-electric' },
      pd: { id: 'silvally-electric' },
      pmd: { id: '0773/0012' },
    },
  },
  silvallyfairy: {
    name: ['Silvally-Fairy'],
    sources: {
      ps: { id: 'silvally-fairy' },
      serebii: { id: '773-fairy' },
      pd: { id: 'silvally-fairy' },
      pmd: { id: '0773/0017' },
    },
  },
  silvallyfighting: {
    name: ['Silvally-Fighting'],
    sources: {
      ps: { id: 'silvally-fighting' },
      serebii: { id: '773-fighting' },
      pd: { id: 'silvally-fighting' },
      pmd: { id: '0773/0001' },
    },
  },
  silvallyfire: {
    name: ['Silvally-Fire'],
    sources: {
      ps: { id: 'silvally-fire' },
      serebii: { id: '773-fire' },
      pd: { id: 'silvally-fire' },
      pmd: { id: '0773/0009' },
    },
  },
  silvallyflying: {
    name: ['Silvally-Flying'],
    sources: {
      ps: { id: 'silvally-flying' },
      serebii: { id: '773-flying' },
      pd: { id: 'silvally-flying' },
      pmd: { id: '0773/0002' },
    },
  },
  silvallyghost: {
    name: ['Silvally-Ghost'],
    sources: {
      ps: { id: 'silvally-ghost' },
      serebii: { id: '773-ghost' },
      pd: { id: 'silvally-ghost' },
      pmd: { id: '0773/0007' },
    },
  },
  silvallygrass: {
    name: ['Silvally-Grass'],
    sources: {
      ps: { id: 'silvally-grass' },
      serebii: { id: '773-grass' },
      pd: { id: 'silvally-grass' },
      pmd: { id: '0773/0011' },
    },
  },
  silvallyground: {
    name: ['Silvally-Ground'],
    sources: {
      ps: { id: 'silvally-ground' },
      serebii: { id: '773-ground' },
      pd: { id: 'silvally-ground' },
      pmd: { id: '0773/0004' },
    },
  },
  silvallyice: {
    name: ['Silvally-Ice'],
    sources: {
      ps: { id: 'silvally-ice' },
      serebii: { id: '773-ice' },
      pd: { id: 'silvally-ice' },
      pmd: { id: '0773/0014' },
    },
  },
  silvallypoison: {
    name: ['Silvally-Poison'],
    sources: {
      ps: { id: 'silvally-poison' },
      serebii: { id: '773-poison' },
      pd: { id: 'silvally-poison' },
      pmd: { id: '0773/0003' },
    },
  },
  silvallypsychic: {
    name: ['Silvally-Psychic'],
    sources: {
      ps: { id: 'silvally-psychic' },
      serebii: { id: '773-psychic' },
      pd: { id: 'silvally-psychic' },
      pmd: { id: '0773/0013' },
    },
  },
  silvallyrock: {
    name: ['Silvally-Rock'],
    sources: {
      ps: { id: 'silvally-rock' },
      serebii: { id: '773-rock' },
      pd: { id: 'silvally-rock' },
      pmd: { id: '0773/0005' },
    },
  },
  silvallysteel: {
    name: ['Silvally-Steel'],
    sources: {
      ps: { id: 'silvally-steel' },
      serebii: { id: '773-steel' },
      pd: { id: 'silvally-steel' },
      pmd: { id: '0773/0008' },
    },
  },
  silvallywater: {
    name: ['Silvally-Water'],
    sources: {
      ps: { id: 'silvally-water' },
      serebii: { id: '773-water' },
      pd: { id: 'silvally-water' },
      pmd: { id: '0773/0010' },
    },
  },
  minior: {
    name: ['Minior'],
    sources: {
      ps: {},
      serebii: { id: '774-b' },
      pd: { id: 'minior-blue-core' },
      pmd: { id: '0774' },
    },
  },
  miniormeteor: {
    name: ['Minior-Meteor'],
    sources: {
      ps: { id: 'minior-meteor' },
      serebii: { id: '774' },
      pd: { id: 'minior-meteor' },
      pmd: { id: '0774' },
    },
  },
  komala: {
    name: ['Komala'],
    sources: { ps: {}, serebii: { id: '775' }, pd: {}, pmd: { id: '0775' } },
  },
  turtonator: {
    name: ['Turtonator'],
    sources: { ps: {}, serebii: { id: '776' }, pd: {}, pmd: { id: '0776' } },
  },
  togedemaru: {
    name: ['Togedemaru'],
    sources: { ps: {}, serebii: { id: '777' }, pd: {}, pmd: { id: '0777' } },
  },
  mimikyu: {
    name: ['Mimikyu'],
    sources: { ps: {}, serebii: { id: '778' }, pd: {}, pmd: { id: '0778' } },
  },
  mimikyubusted: {
    name: ['Mimikyu-Busted'],
    sources: {
      ps: { id: 'mimikyu-busted' },
      serebii: { id: '778-b' },
      pd: { id: 'mimikyu-busted' },
      pmd: { id: '0778/0001' },
    },
  },
  bruxish: {
    name: ['Bruxish'],
    sources: { ps: {}, serebii: { id: '779' }, pd: {}, pmd: { id: '0779' } },
  },
  drampa: {
    name: ['Drampa'],
    sources: { ps: {}, serebii: { id: '780' }, pd: {}, pmd: { id: '0780' } },
  },
  dhelmise: {
    name: ['Dhelmise'],
    sources: { ps: {}, serebii: { id: '781' }, pd: {}, pmd: { id: '0781' } },
  },
  jangmoo: {
    name: ['Jangmo-o'],
    sources: {
      ps: {},
      serebii: { id: '782' },
      pd: { id: 'jangmo-o' },
      pmd: { id: '0782' },
    },
  },
  hakamoo: {
    name: ['Hakamo-o'],
    sources: {
      ps: {},
      serebii: { id: '783' },
      pd: { id: 'hakamo-o' },
      pmd: { id: '0783' },
    },
  },
  kommoo: {
    name: ['Kommo-o'],
    sources: {
      ps: {},
      serebii: { id: '784' },
      pd: { id: 'kommo-o' },
      pmd: { id: '0784' },
    },
  },
  tapukoko: {
    name: ['Tapu Koko'],
    sources: {
      ps: {},
      serebii: { id: '785' },
      pd: { id: 'tapu-koko', flip: true },
      pmd: { id: '0785' },
    },
  },
  tapulele: {
    name: ['Tapu Lele'],
    sources: {
      ps: {},
      serebii: { id: '786' },
      pd: { id: 'tapu-lele' },
      pmd: { id: '0786' },
    },
  },
  tapubulu: {
    name: ['Tapu Bulu'],
    sources: {
      ps: {},
      serebii: { id: '787' },
      pd: { id: 'tapu-bulu' },
      pmd: { id: '0787' },
    },
  },
  tapufini: {
    name: ['Tapu Fini'],
    sources: {
      ps: {},
      serebii: { id: '788' },
      pd: { id: 'tapu-fini', flip: true },
      pmd: { id: '0788' },
    },
  },
  cosmog: {
    name: ['Cosmog'],
    sources: {
      ps: {},
      serebii: { id: '789' },
      pd: { flip: true },
      pmd: { id: '0789' },
    },
  },
  cosmoem: {
    name: ['Cosmoem'],
    sources: { ps: {}, serebii: { id: '790' }, pd: {}, pmd: { id: '0790' } },
  },
  solgaleo: {
    name: ['Solgaleo'],
    sources: {
      ps: {},
      serebii: { id: '791' },
      pd: { flip: true },
      pmd: { id: '0791' },
    },
  },
  lunala: {
    name: ['Lunala'],
    sources: { ps: {}, serebii: { id: '792' }, pd: {}, pmd: { id: '0792' } },
  },
  nihilego: {
    name: ['Nihilego'],
    sources: { ps: {}, serebii: { id: '793' }, pd: {}, pmd: { id: '0793' } },
  },
  buzzwole: {
    name: ['Buzzwole'],
    sources: { ps: {}, serebii: { id: '794' }, pd: {}, pmd: { id: '0794' } },
  },
  pheromosa: {
    name: ['Pheromosa'],
    sources: { ps: {}, serebii: { id: '795' }, pd: {}, pmd: { id: '0795' } },
  },
  xurkitree: {
    name: ['Xurkitree'],
    sources: { ps: {}, serebii: { id: '796' }, pd: {}, pmd: { id: '0796' } },
  },
  celesteela: {
    name: ['Celesteela'],
    sources: {
      ps: {},
      serebii: { id: '797' },
      pd: { flip: true },
      pmd: { id: '0797' },
    },
  },
  kartana: {
    name: ['Kartana'],
    sources: {
      ps: {},
      serebii: { id: '798' },
      pd: { flip: true },
      pmd: { id: '0798' },
    },
  },
  guzzlord: {
    name: ['Guzzlord'],
    sources: { ps: {}, serebii: { id: '799' }, pd: {}, pmd: { id: '0799' } },
  },
  necrozma: {
    name: ['Necrozma'],
    sources: { ps: {}, serebii: { id: '800' }, pd: {}, pmd: { id: '0800' } },
  },
  necrozmaduskmane: {
    name: ['Necrozma-Dusk-Mane'],
    sources: {
      ps: { id: 'necrozma-duskmane' },
      serebii: { id: '800-dm' },
      pd: { id: 'necrozma-dusk-mane' },
      pmd: { id: '0800/0001' },
    },
  },
  necrozmadawnwings: {
    name: ['Necrozma-Dawn-Wings'],
    sources: {
      ps: { id: 'necrozma-dawnwings' },
      serebii: { id: '800-dw' },
      pd: { id: 'necrozma-dawn-wings', flip: true },
      pmd: { id: '0800/0002' },
    },
  },
  necrozmaultra: {
    name: ['Necrozma-Ultra'],
    sources: {
      ps: { id: 'necrozma-ultra' },
      serebii: { id: '800-u' },
      pd: { id: 'necrozma-ultra', flip: true },
      pmd: { id: '0800/0003' },
    },
  },
  magearna: {
    name: ['Magearna'],
    sources: { ps: {}, serebii: { id: '801' }, pd: {}, pmd: { id: '0801' } },
  },
  magearnaoriginal: {
    name: ['Magearna-Original'],
    sources: {
      ps: { id: 'magearna-original' },
      serebii: { id: '801-o' },
      pd: { id: 'magearna-original' },
      pmd: { id: '0801/0001' },
    },
  },
  marshadow: {
    name: ['Marshadow'],
    sources: { ps: {}, serebii: { id: '802' }, pd: {}, pmd: { id: '0802' } },
  },
  poipole: {
    name: ['Poipole'],
    sources: { ps: {}, serebii: { id: '803' }, pd: {}, pmd: { id: '0803' } },
  },
  naganadel: {
    name: ['Naganadel'],
    sources: { ps: {}, serebii: { id: '804' }, pd: {}, pmd: { id: '0804' } },
  },
  stakataka: {
    name: ['Stakataka'],
    sources: { ps: {}, serebii: { id: '805' }, pd: {}, pmd: { id: '0805' } },
  },
  blacephalon: {
    name: ['Blacephalon'],
    sources: { ps: {}, serebii: { id: '806' }, pd: {}, pmd: { id: '0806' } },
  },
  zeraora: {
    name: ['Zeraora'],
    sources: { ps: {}, serebii: { id: '807' }, pd: {}, pmd: { id: '0807' } },
  },
  meltan: {
    name: ['Meltan'],
    sources: {
      ps: {},
      serebii: { id: '808' },
      pd: { flip: true },
      pmd: { id: '0808' },
    },
  },
  melmetal: {
    name: ['Melmetal'],
    sources: { ps: {}, serebii: { id: '809' }, pd: {}, pmd: { id: '0809' } },
  },
  melmetalgmax: {
    name: ['Melmetal-Gmax'],
    sources: {
      ps: { id: 'melmetal-gmax' },
      serebii: { id: '809-gi' },
      pd: { id: 'melmetal-gigantamax' },
      pmd: { id: '0809' },
    },
  },
  grookey: {
    name: ['Grookey'],
    sources: {
      ps: {},
      serebii: { id: '810' },
      pd: { flip: true },
      pmd: { id: '0810' },
    },
  },
  thwackey: {
    name: ['Thwackey'],
    sources: { ps: {}, serebii: { id: '811' }, pd: {}, pmd: { id: '0811' } },
  },
  rillaboom: {
    name: ['Rillaboom'],
    sources: { ps: {}, serebii: { id: '812' }, pd: {}, pmd: { id: '0812' } },
  },
  rillaboomgmax: {
    name: ['Rillaboom-Gmax'],
    sources: {
      ps: { id: 'rillaboom-gmax' },
      serebii: { id: '812-gi' },
      pd: { id: 'rillaboom-gigantamax' },
      pmd: { id: '0812' },
    },
  },
  scorbunny: {
    name: ['Scorbunny'],
    sources: { ps: {}, serebii: { id: '813' }, pd: {}, pmd: { id: '0813' } },
  },
  raboot: {
    name: ['Raboot'],
    sources: {
      ps: {},
      serebii: { id: '814' },
      pd: { flip: true },
      pmd: { id: '0814' },
    },
  },
  cinderace: {
    name: ['Cinderace'],
    sources: {
      ps: {},
      serebii: { id: '815' },
      pd: { flip: true },
      pmd: { id: '0815' },
    },
  },
  cinderacegmax: {
    name: ['Cinderace-Gmax'],
    sources: {
      ps: { id: 'cinderace-gmax' },
      serebii: { id: '815-gi' },
      pd: { id: 'cinderace-gigantamax' },
      pmd: { id: '0815' },
    },
  },
  sobble: {
    name: ['Sobble'],
    sources: { ps: {}, serebii: { id: '816' }, pd: {}, pmd: { id: '0816' } },
  },
  drizzile: {
    name: ['Drizzile'],
    sources: { ps: {}, serebii: { id: '817' }, pd: {}, pmd: { id: '0817' } },
  },
  inteleon: {
    name: ['Inteleon'],
    sources: { ps: {}, serebii: { id: '818' }, pd: {}, pmd: { id: '0818' } },
  },
  inteleongmax: {
    name: ['Inteleon-Gmax'],
    sources: {
      ps: { id: 'inteleon-gmax' },
      serebii: { id: '818-gi' },
      pd: { id: 'inteleon-gigantamax' },
      pmd: { id: '0818' },
    },
  },
  skwovet: {
    name: ['Skwovet'],
    sources: {
      ps: {},
      serebii: { id: '819' },
      pd: { flip: true },
      pmd: { id: '0819' },
    },
  },
  greedent: {
    name: ['Greedent'],
    sources: {
      ps: {},
      serebii: { id: '820' },
      pd: { flip: true },
      pmd: { id: '0820' },
    },
  },
  rookidee: {
    name: ['Rookidee'],
    sources: {
      ps: {},
      serebii: { id: '821' },
      pd: { flip: true },
      pmd: { id: '0821' },
    },
  },
  corvisquire: {
    name: ['Corvisquire'],
    sources: { ps: {}, serebii: { id: '822' }, pd: {}, pmd: { id: '0822' } },
  },
  corviknight: {
    name: ['Corviknight'],
    sources: {
      ps: {},
      serebii: { id: '823' },
      pd: { flip: true },
      pmd: { id: '0823' },
    },
  },
  corviknightgmax: {
    name: ['Corviknight-Gmax'],
    sources: {
      ps: { id: 'corviknight-gmax' },
      serebii: { id: '823-gi' },
      pd: { id: 'corviknight-gigantamax' },
      pmd: { id: '0823' },
    },
  },
  blipbug: {
    name: ['Blipbug'],
    sources: { ps: {}, serebii: { id: '824' }, pd: {}, pmd: { id: '0824' } },
  },
  dottler: {
    name: ['Dottler'],
    sources: {
      ps: {},
      serebii: { id: '825' },
      pd: { flip: true },
      pmd: { id: '0825' },
    },
  },
  orbeetle: {
    name: ['Orbeetle'],
    sources: { ps: {}, serebii: { id: '826' }, pd: {}, pmd: { id: '0826' } },
  },
  orbeetlegmax: {
    name: ['Orbeetle-Gmax'],
    sources: {
      ps: { id: 'orbeetle-gmax' },
      serebii: { id: '826-gi' },
      pd: { id: 'orbeetle-gigantamax' },
      pmd: { id: '0826' },
    },
  },
  orbeetlemega: {
    name: ['Orbeetle-Gmax'],
    sources: {
      ps: { id: 'orbeetle-gmax' },
      serebii: { id: '826-gi' },
      pd: { id: 'orbeetle-gigantamax' },
      pmd: { id: '0826' },
    },
  },
  nickit: {
    name: ['Nickit'],
    sources: { ps: {}, serebii: { id: '827' }, pd: {}, pmd: { id: '0827' } },
  },
  thievul: {
    name: ['Thievul'],
    sources: { ps: {}, serebii: { id: '828' }, pd: {}, pmd: { id: '0828' } },
  },
  gossifleur: {
    name: ['Gossifleur'],
    sources: { ps: {}, serebii: { id: '829' }, pd: {}, pmd: { id: '0829' } },
  },
  eldegoss: {
    name: ['Eldegoss'],
    sources: { ps: {}, serebii: { id: '830' }, pd: {}, pmd: { id: '0830' } },
  },
  wooloo: {
    name: ['Wooloo'],
    sources: {
      ps: {},
      serebii: { id: '831' },
      pd: { flip: true },
      pmd: { id: '0831' },
    },
  },
  dubwool: {
    name: ['Dubwool'],
    sources: {
      ps: {},
      serebii: { id: '832' },
      pd: { flip: true },
      pmd: { id: '0832' },
    },
  },
  chewtle: {
    name: ['Chewtle'],
    sources: { ps: {}, serebii: { id: '833' }, pd: {}, pmd: { id: '0833' } },
  },
  drednaw: {
    name: ['Drednaw'],
    sources: { ps: {}, serebii: { id: '834' }, pd: {}, pmd: { id: '0834' } },
  },
  drednawgmax: {
    name: ['Drednaw-Gmax'],
    sources: {
      ps: { id: 'drednaw-gmax' },
      serebii: { id: '834-gi' },
      pd: { id: 'drednaw-gigantamax' },
      pmd: { id: '0834' },
    },
  },
  drednawmega: {
    name: ['Mega Drednaw', 'Drednaw-Mega'],
    sources: {
      ps: { id: 'drednaw-gmax' },
      serebii: { id: '834-gi' },
      pd: { id: 'drednaw-gigantamax' },
      pmd: { id: '0834' },
    },
  },
  yamper: {
    name: ['Yamper'],
    sources: {
      ps: {},
      serebii: { id: '835' },
      pd: { flip: true },
      pmd: { id: '0835' },
    },
  },
  boltund: {
    name: ['Boltund'],
    sources: { ps: {}, serebii: { id: '836' }, pd: {}, pmd: { id: '0836' } },
  },
  rolycoly: {
    name: ['Rolycoly'],
    sources: { ps: {}, serebii: { id: '837' }, pd: {}, pmd: { id: '0837' } },
  },
  carkol: {
    name: ['Carkol'],
    sources: {
      ps: {},
      serebii: { id: '838' },
      pd: { flip: true },
      pmd: { id: '0838' },
    },
  },
  coalossal: {
    name: ['Coalossal'],
    sources: { ps: {}, serebii: { id: '839' }, pd: {}, pmd: { id: '0839' } },
  },
  coalossalgmax: {
    name: ['Coalossal-Gmax'],
    sources: {
      ps: { id: 'coalossal-gmax' },
      serebii: { id: '839-gi' },
      pd: { id: 'coalossal-gigantamax' },
      pmd: { id: '0839' },
    },
  },
  coalossalmega: {
    name: ['Mega Coalossal', 'Coalossal-Mega'],
    sources: {
      ps: { id: 'coalossal-gmax' },
      serebii: { id: '839-gi' },
      pd: { id: 'coalossal-gigantamax' },
      pmd: { id: '0839' },
    },
  },
  applin: {
    name: ['Applin'],
    sources: { ps: {}, serebii: { id: '840' }, pd: {}, pmd: { id: '0840' } },
  },
  flapple: {
    name: ['Flapple'],
    sources: { ps: {}, serebii: { id: '841' }, pd: {}, pmd: { id: '0841' } },
  },
  flapplegmax: {
    name: ['Flapple-Gmax'],
    sources: {
      ps: { id: 'flapple-gmax' },
      serebii: { id: '841-gi' },
      pd: { id: 'flapple-gigantamax' },
      pmd: { id: '0841' },
    },
  },
  flapplemega: {
    name: ['Mega Flapple', 'Flapple-Mega'],
    sources: {
      ps: { id: 'flapple-gmax' },
      serebii: { id: '841-gi' },
      pd: { id: 'flapple-gigantamax' },
      pmd: { id: '0841' },
    },
  },
  appletun: {
    name: ['Appletun'],
    sources: { ps: {}, serebii: { id: '842' }, pd: {}, pmd: { id: '0842' } },
  },
  appletungmax: {
    name: ['Appletun-Gmax'],
    sources: {
      ps: { id: 'appletun-gmax' },
      serebii: { id: '842-gi' },
      pd: { id: 'appletun-gigantamax' },
      pmd: { id: '0842' },
    },
  },
  appletunmega: {
    name: ['Mega Appletun', 'Appletun-Mega'],
    sources: {
      ps: { id: 'appletun-gmax' },
      serebii: { id: '842-gi' },
      pd: { id: 'appletun-gigantamax' },
      pmd: { id: '0842' },
    },
  },
  silicobra: {
    name: ['Silicobra'],
    sources: { ps: {}, serebii: { id: '843' }, pd: {}, pmd: { id: '0843' } },
  },
  sandaconda: {
    name: ['Sandaconda'],
    sources: {
      ps: {},
      serebii: { id: '844' },
      pd: { flip: true },
      pmd: { id: '0844' },
    },
  },
  sandacondagmax: {
    name: ['Sandaconda-Gmax'],
    sources: {
      ps: { id: 'sandaconda-gmax' },
      serebii: { id: '844-gi' },
      pd: { id: 'sandaconda-gigantamax', flip: true },
      pmd: { id: '0844' },
    },
  },
  sandacondamega: {
    name: ['Mega Sandaconda', 'Sandaconda-Mega'],
    sources: {
      ps: { id: 'sandaconda-gmax' },
      serebii: { id: '844-gi' },
      pd: { id: 'sandaconda-gigantamax', flip: true },
      pmd: { id: '0844' },
    },
  },
  cramorant: {
    name: ['Cramorant'],
    sources: {
      ps: {},
      serebii: { id: '845' },
      pd: { id: 'cramorant-gulping' },
      pmd: { id: '0845' },
    },
  },
  arrokuda: {
    name: ['Arrokuda'],
    sources: { ps: {}, serebii: { id: '846' }, pd: {}, pmd: { id: '0846' } },
  },
  barraskewda: {
    name: ['Barraskewda'],
    sources: { ps: {}, serebii: { id: '847' }, pd: {}, pmd: { id: '0847' } },
  },
  toxel: {
    name: ['Toxel'],
    sources: { ps: {}, serebii: { id: '848' }, pd: {}, pmd: { id: '0848' } },
  },
  toxtricity: {
    name: ['Toxtricity'],
    sources: { ps: {}, serebii: { id: '849' }, pd: {}, pmd: { id: '0849' } },
  },
  toxtricitylowkey: {
    name: ['Toxtricity-Low-Key'],
    sources: {
      ps: { id: 'toxtricity-lowkey' },
      serebii: { id: '849-l' },
      pd: { id: 'toxtricity-low-key', flip: true },
      pmd: { id: '0849/0001' },
    },
  },
  toxtricitygmax: {
    name: ['Toxtricity-Gmax'],
    sources: {
      ps: { id: 'toxtricity-gmax' },
      serebii: { id: '849-gi' },
      pd: { id: 'toxtricity-gigantamax' },
      pmd: { id: '0849' },
    },
  },
  toxtricitymega: {
    name: ['Mega Toxtricity', 'Toxtricity-Mega'],
    sources: {
      ps: { id: 'toxtricity-gmax' },
      serebii: { id: '849-gi' },
      pd: { id: 'toxtricity-gigantamax' },
      pmd: { id: '0849' },
    },
  },
  toxtricitylowkeygmax: {
    name: ['Toxtricity-Low-Key-Gmax'],
    sources: {
      ps: { id: 'toxtricity-gmax' },
      serebii: { id: '849-gi' },
      pd: { id: 'toxtricity-gigantamax' },
      pmd: { id: '0849' },
    },
  },
  toxtricitylowkeymega: {
    name: ['Mega Toxtricity-Low-Key', 'Toxtricity-Low-Key-Mega'],
    sources: {
      ps: { id: 'toxtricity-gmax' },
      serebii: { id: '849-gi' },
      pd: { id: 'toxtricity-gigantamax' },
      pmd: { id: '0849' },
    },
  },
  sizzlipede: {
    name: ['Sizzlipede'],
    sources: {
      ps: {},
      serebii: { id: '850' },
      pd: { flip: true },
      pmd: { id: '0850' },
    },
  },
  centiskorch: {
    name: ['Centiskorch'],
    sources: { ps: {}, serebii: { id: '851' }, pd: {}, pmd: { id: '0851' } },
  },
  centiskorchgmax: {
    name: ['Centiskorch-Gmax'],
    sources: {
      ps: { id: 'centiskorch-gmax' },
      serebii: { id: '851-gi' },
      pd: { id: 'centiskorch-gigantamax' },
      pmd: { id: '0851' },
    },
  },
  centiskorchmega: {
    name: ['Mega Centiskorch', 'Centiskorch-Mega'],
    sources: {
      ps: { id: 'centiskorch-gmax' },
      serebii: { id: '851-gi' },
      pd: { id: 'centiskorch-gigantamax' },
      pmd: { id: '0851' },
    },
  },
  clobbopus: {
    name: ['Clobbopus'],
    sources: { ps: {}, serebii: { id: '852' }, pd: {}, pmd: { id: '0852' } },
  },
  grapploct: {
    name: ['Grapploct'],
    sources: { ps: {}, serebii: { id: '853' }, pd: {}, pmd: { id: '0853' } },
  },
  sinistea: {
    name: ['Sinistea'],
    sources: {
      ps: {},
      serebii: { id: '854' },
      pd: { flip: true },
      pmd: { id: '0854' },
    },
  },
  polteageist: {
    name: ['Polteageist'],
    sources: { ps: {}, serebii: { id: '855' }, pd: {}, pmd: { id: '0855' } },
  },
  hatenna: {
    name: ['Hatenna'],
    sources: { ps: {}, serebii: { id: '856' }, pd: {}, pmd: { id: '0856' } },
  },
  hattrem: {
    name: ['Hattrem'],
    sources: { ps: {}, serebii: { id: '857' }, pd: {}, pmd: { id: '0857' } },
  },
  hatterene: {
    name: ['Hatterene'],
    sources: { ps: {}, serebii: { id: '858' }, pd: {}, pmd: { id: '0858' } },
  },
  hatterenegmax: {
    name: ['Hatterene-Gmax'],
    sources: {
      ps: { id: 'hatterene-gmax' },
      serebii: { id: '858-gi' },
      pd: { id: 'hatterene-gigantamax', flip: true },
      pmd: { id: '0858' },
    },
  },
  impidimp: {
    name: ['Impidimp'],
    sources: { ps: {}, serebii: { id: '859' }, pd: {}, pmd: { id: '0859' } },
  },
  morgrem: {
    name: ['Morgrem'],
    sources: { ps: {}, serebii: { id: '860' }, pd: {}, pmd: { id: '0860' } },
  },
  grimmsnarl: {
    name: ['Grimmsnarl'],
    sources: { ps: {}, serebii: { id: '861' }, pd: {}, pmd: { id: '0861' } },
  },
  grimmsnarlgmax: {
    name: ['Grimmsnarl-Gmax'],
    sources: {
      ps: { id: 'grimmsnarl-gmax' },
      serebii: { id: '861-gi' },
      pd: { id: 'grimmsnarl-gigantamax' },
      pmd: { id: '0861' },
    },
  },
  obstagoon: {
    name: ['Obstagoon'],
    sources: {
      ps: {},
      serebii: { id: '862' },
      pd: { flip: true },
      pmd: { id: '0862' },
    },
  },
  perrserker: {
    name: ['Perrserker'],
    sources: {
      ps: {},
      serebii: { id: '863' },
      pd: { flip: true },
      pmd: { id: '0863' },
    },
  },
  cursola: {
    name: ['Cursola'],
    sources: {
      ps: {},
      serebii: { id: '864' },
      pd: { flip: true },
      pmd: { id: '0864' },
    },
  },
  sirfetchd: {
    name: ['Sirfetch’d'],
    sources: { ps: {}, serebii: { id: '865' }, pd: {}, pmd: { id: '0865' } },
  },
  mrrime: {
    name: ['Mr. Rime'],
    sources: {
      ps: {},
      serebii: { id: '866' },
      pd: { id: 'mr-rime', flip: true },
      pmd: { id: '0866' },
    },
  },
  runerigus: {
    name: ['Runerigus'],
    sources: { ps: {}, serebii: { id: '867' }, pd: {}, pmd: { id: '0867' } },
  },
  milcery: {
    name: ['Milcery'],
    sources: { ps: {}, serebii: { id: '868' }, pd: {}, pmd: { id: '0868' } },
  },
  alcremie: {
    name: ['Alcremie'],
    sources: {
      ps: {},
      serebii: { id: '869' },
      pd: { flip: true },
      pmd: { id: '0869' },
    },
  },
  alcremiegmax: {
    name: ['Alcremie-Gmax'],
    sources: {
      ps: { id: 'alcremie-gmax' },
      serebii: { id: '869-gi' },
      pd: { id: 'alcremie-gigantamax' },
      pmd: { id: '0869' },
    },
  },
  alcremiemega: {
    name: ['Mega Alcremie', 'Alcremie-Mega'],
    sources: {
      ps: { id: 'alcremie-gmax' },
      serebii: { id: '869-gi' },
      pd: { id: 'alcremie-gigantamax' },
      pmd: { id: '0869' },
    },
  },
  falinks: {
    name: ['Falinks'],
    sources: { ps: {}, serebii: { id: '870' }, pd: {}, pmd: { id: '0870' } },
  },
  pincurchin: {
    name: ['Pincurchin'],
    sources: { ps: {}, serebii: { id: '871' }, pd: {}, pmd: { id: '0871' } },
  },
  snom: {
    name: ['Snom'],
    sources: {
      ps: {},
      serebii: { id: '872' },
      pd: { flip: true },
      pmd: { id: '0872' },
    },
  },
  frosmoth: {
    name: ['Frosmoth'],
    sources: {
      ps: {},
      serebii: { id: '873' },
      pd: { flip: true },
      pmd: { id: '0873' },
    },
  },
  stonjourner: {
    name: ['Stonjourner'],
    sources: { ps: {}, serebii: { id: '874' }, pd: {}, pmd: { id: '0874' } },
  },
  eiscue: {
    name: ['Eiscue'],
    sources: { ps: {}, serebii: { id: '875' }, pd: {}, pmd: { id: '0875' } },
  },
  eiscuenoice: {
    name: ['Eiscue-Noice'],
    sources: {
      ps: { id: 'eiscue-noice' },
      serebii: { id: '875-n' },
      pd: { id: 'eiscue-noice' },
      pmd: { id: '0875/0001' },
    },
  },
  indeedee: {
    name: ['Indeedee'],
    sources: {
      ps: {},
      serebii: { id: '876' },
      pd: { flip: true },
      pmd: { id: '0876' },
    },
  },
  indeedeef: {
    name: ['Indeedee-Female', 'Indeedee-F'],
    sources: {
      ps: { id: 'indeedee-f' },
      serebii: { id: '876-f' },
      pd: { id: 'indeedee-female' },
      pmd: { id: '0876/0000/0000/0002' },
    },
  },
  morpeko: {
    name: ['Morpeko'],
    sources: { ps: {}, serebii: { id: '877' }, pd: {}, pmd: { id: '0877' } },
  },
  morpekohangry: {
    name: ['Morpeko-Hangry'],
    sources: {
      ps: { id: 'morpeko-hangry' },
      serebii: { id: '877-h' },
      pd: { id: 'morpeko-hangry' },
      pmd: { id: '0877/0001' },
    },
  },
  cufant: {
    name: ['Cufant'],
    sources: {
      ps: {},
      serebii: { id: '878' },
      pd: { flip: true },
      pmd: { id: '0878' },
    },
  },
  copperajah: {
    name: ['Copperajah'],
    sources: { ps: {}, serebii: { id: '879' }, pd: {}, pmd: { id: '0879' } },
  },
  copperajahgmax: {
    name: ['Copperajah-Gmax'],
    sources: {
      ps: { id: 'copperajah-gmax' },
      serebii: { id: '879-gi' },
      pd: { id: 'copperajah-gigantamax' },
      pmd: { id: '0879' },
    },
  },
  copperajahmega: {
    name: ['Mega Copperajah', 'Copperajah-Mega'],
    sources: {
      ps: { id: 'copperajah-gmax' },
      serebii: { id: '879-gi' },
      pd: { id: 'copperajah-gigantamax' },
      pmd: { id: '0879' },
    },
  },
  dracozolt: {
    name: ['Dracozolt'],
    sources: { ps: {}, serebii: { id: '880' }, pd: {}, pmd: { id: '0880' } },
  },
  arctozolt: {
    name: ['Arctozolt'],
    sources: { ps: {}, serebii: { id: '881' }, pd: {}, pmd: { id: '0881' } },
  },
  dracovish: {
    name: ['Dracovish'],
    sources: { ps: {}, serebii: { id: '882' }, pd: {}, pmd: { id: '0882' } },
  },
  arctovish: {
    name: ['Arctovish'],
    sources: { ps: {}, serebii: { id: '883' }, pd: {}, pmd: { id: '0883' } },
  },
  duraludon: {
    name: ['Duraludon'],
    sources: { ps: {}, serebii: { id: '884' }, pd: {}, pmd: { id: '0884' } },
  },
  duraludongmax: {
    name: ['Duraludon-Gmax'],
    sources: {
      ps: { id: 'duraludon-gmax' },
      serebii: { id: '884-gi' },
      pd: { id: 'duraludon-gigantamax', flip: true },
      pmd: { id: '0884' },
    },
  },
  duraludonmega: {
    name: ['Mega Duraludon', 'Duraludon-Mega'],
    sources: {
      ps: { id: 'duraludon-gmax' },
      serebii: { id: '884-gi' },
      pd: { id: 'duraludon-gigantamax', flip: true },
      pmd: { id: '0884' },
    },
  },
  dreepy: {
    name: ['Dreepy'],
    sources: { ps: {}, serebii: { id: '885' }, pd: {}, pmd: { id: '0885' } },
  },
  drakloak: {
    name: ['Drakloak'],
    sources: { ps: {}, serebii: { id: '886' }, pd: {}, pmd: { id: '0886' } },
  },
  dragapult: {
    name: ['Dragapult'],
    sources: { ps: {}, serebii: { id: '887' }, pd: {}, pmd: { id: '0887' } },
  },
  zacian: {
    name: ['Zacian'],
    sources: {
      ps: {},
      serebii: { id: '888' },
      pd: { flip: true },
      pmd: { id: '0888' },
    },
  },
  zaciancrowned: {
    name: ['Zacian-Crowned'],
    sources: {
      ps: { id: 'zacian-crowned' },
      serebii: { id: '888-c' },
      pd: { id: 'zacian-crowned', flip: true },
      pmd: { id: '0888/0001' },
    },
  },
  zamazenta: {
    name: ['Zamazenta'],
    sources: { ps: {}, serebii: { id: '889' }, pd: {}, pmd: { id: '0889' } },
  },
  zamazentacrowned: {
    name: ['Zamazenta-Crowned'],
    sources: {
      ps: { id: 'zamazenta-crowned' },
      serebii: { id: '889-c' },
      pd: { id: 'zamazenta-crowned' },
      pmd: { id: '0889/0001' },
    },
  },
  eternatus: {
    name: ['Eternatus'],
    sources: { ps: {}, serebii: { id: '890' }, pd: {}, pmd: { id: '0890' } },
  },
  eternatuseternamax: {
    name: ['Eternatus-Eternamax'],
    sources: {
      ps: { id: 'eternatus-eternamax' },
      serebii: { id: '890-e' },
      pd: { id: 'eternatus-eternamax' },
      pmd: { id: '0890/0001' },
    },
  },
  kubfu: {
    name: ['Kubfu'],
    sources: { ps: {}, serebii: { id: '891' }, pd: {}, pmd: { id: '0891' } },
  },
  urshifu: {
    name: ['Urshifu'],
    sources: { ps: {}, serebii: { id: '892' }, pd: {}, pmd: { id: '0892' } },
  },
  urshifurapidstrike: {
    name: ['Urshifu-Rapid-Strike'],
    sources: {
      ps: { id: 'urshifu-rapidstrike' },
      serebii: { id: '892-r' },
      pd: { id: 'urshifu-rapid-strike', flip: true },
      pmd: { id: '0892/0001' },
    },
  },
  urshifugmax: {
    name: ['Urshifu-Gmax'],
    sources: {
      ps: { id: 'urshifu-gmax' },
      serebii: { id: '892-gi' },
      pd: { id: 'urshifu-single-strike-gigantamax' },
      pmd: { id: '0892' },
    },
  },
  urshifurapidstrikegmax: {
    name: ['Urshifu-Rapid-Strike-Gmax'],
    sources: {
      ps: { id: 'urshifu-rapidstrikegmax' },
      serebii: { id: '892-rgi' },
      pd: { id: 'urshifu-rapid-strike-gigantamax', flip: true },
      pmd: { id: '0892' },
    },
  },
  zarude: {
    name: ['Zarude'],
    sources: {
      ps: {},
      serebii: { id: '893' },
      pd: { flip: true },
      pmd: { id: '0893' },
    },
  },
  zarudedada: {
    name: ['Zarude-Dada'],
    sources: {
      ps: { id: 'zarude-dada' },
      serebii: { id: '893-d' },
      pd: { id: 'zarude-dada', flip: true },
      pmd: { id: '0893/0001' },
    },
  },
  regieleki: {
    name: ['Regieleki'],
    sources: { ps: {}, serebii: { id: '894' }, pd: {}, pmd: { id: '0894' } },
  },
  regidrago: {
    name: ['Regidrago'],
    sources: {
      ps: {},
      serebii: { id: '895' },
      pd: { flip: true },
      pmd: { id: '0895' },
    },
  },
  glastrier: {
    name: ['Glastrier'],
    sources: { ps: {}, serebii: { id: '896' }, pd: {}, pmd: { id: '0896' } },
  },
  spectrier: {
    name: ['Spectrier'],
    sources: { ps: {}, serebii: { id: '897' }, pd: {}, pmd: { id: '0897' } },
  },
  calyrex: {
    name: ['Calyrex'],
    sources: { ps: {}, serebii: { id: '898' }, pd: {}, pmd: { id: '0898' } },
  },
  calyrexice: {
    name: ['Calyrex-Ice'],
    sources: {
      ps: { id: 'calyrex-ice' },
      serebii: { id: '898-i' },
      pd: { id: 'calyrex-ice-rider' },
      pmd: { id: '0898' },
    },
  },
  calyrexshadow: {
    name: ['Calyrex-Shadow'],
    sources: {
      ps: { id: 'calyrex-shadow' },
      serebii: { id: '898-s' },
      pd: { id: 'calyrex-shadow-rider' },
      pmd: { id: '0898' },
    },
  },
  wyrdeer: {
    name: ['Wyrdeer'],
    sources: { ps: {}, serebii: { id: '899' }, pd: {}, pmd: { id: '0899' } },
  },
  kleavor: {
    name: ['Kleavor'],
    sources: { ps: {}, serebii: { id: '900' }, pd: {}, pmd: { id: '0900' } },
  },
  ursaluna: {
    name: ['Ursaluna'],
    sources: {
      ps: {},
      serebii: { id: '901' },
      pd: { flip: true },
      pmd: { id: '0901' },
    },
  },
  ursalunabloodmoon: {
    name: ['Ursaluna-Bloodmoon'],
    sources: {
      ps: { id: 'ursaluna-bloodmoon' },
      serebii: { id: '901-b' },
      pd: { id: 'ursaluna-bloodmoon' },
      pmd: { id: '0901/0001' },
    },
  },
  basculegion: {
    name: ['Basculegion'],
    sources: { ps: {}, serebii: { id: '902' }, pd: {}, pmd: { id: '0902' } },
  },
  basculegionf: {
    name: ['Basculegion-Female', 'Basculegion-F'],
    sources: {
      ps: { id: 'basculegion-f' },
      serebii: { id: '902-f' },
      pd: { id: 'basculegion-female' },
      pmd: { id: '0902/0000/0000/0002' },
    },
  },
  sneasler: {
    name: ['Sneasler'],
    sources: { ps: {}, serebii: { id: '903' }, pd: {}, pmd: { id: '0903' } },
  },
  overqwil: {
    name: ['Overqwil'],
    sources: { ps: {}, serebii: { id: '904' }, pd: {}, pmd: { id: '0904' } },
  },
  enamorus: {
    name: ['Enamorus-Incarnate', 'Enamorus', 'Enamorus-I'],
    sources: {
      ps: {},
      serebii: { id: '905' },
      pd: { flip: true },
      pmd: { id: '0905' },
    },
  },
  enamorustherian: {
    name: ['Enamorus-T', 'Enamorus-Therian'],
    sources: {
      ps: { id: 'enamorus-therian' },
      serebii: { id: '905-t' },
      pd: { id: 'enamorus-therian' },
      pmd: { id: '0905/0001' },
    },
  },
  sprigatito: {
    name: ['Sprigatito'],
    sources: { ps: {}, serebii: { id: '906' }, pd: {}, pmd: { id: '0906' } },
  },
  floragato: {
    name: ['Floragato'],
    sources: { ps: {}, serebii: { id: '907' }, pd: {}, pmd: { id: '0907' } },
  },
  meowscarada: {
    name: ['Meowscarada'],
    sources: { ps: {}, serebii: { id: '908' }, pd: {}, pmd: { id: '0908' } },
  },
  fuecoco: {
    name: ['Fuecoco'],
    sources: { ps: {}, serebii: { id: '909' }, pd: {}, pmd: { id: '0909' } },
  },
  crocalor: {
    name: ['Crocalor'],
    sources: { ps: {}, serebii: { id: '910' }, pd: {}, pmd: { id: '0910' } },
  },
  skeledirge: {
    name: ['Skeledirge'],
    sources: { ps: {}, serebii: { id: '911' }, pd: {}, pmd: { id: '0911' } },
  },
  quaxly: {
    name: ['Quaxly'],
    sources: {
      ps: {},
      serebii: { id: '912' },
      pd: { flip: true },
      pmd: { id: '0912' },
    },
  },
  quaxwell: {
    name: ['Quaxwell'],
    sources: {
      ps: {},
      serebii: { id: '913' },
      pd: { flip: true },
      pmd: { id: '0913' },
    },
  },
  quaquaval: {
    name: ['Quaquaval'],
    sources: {
      ps: {},
      serebii: { id: '914' },
      pd: { flip: true },
      pmd: { id: '0914' },
    },
  },
  lechonk: {
    name: ['Lechonk'],
    sources: { ps: {}, serebii: { id: '915' }, pd: {}, pmd: { id: '0915' } },
  },
  oinkologne: {
    name: ['Oinkologne'],
    sources: {
      ps: {},
      serebii: { id: '916' },
      pd: { flip: true },
      pmd: { id: '0916' },
    },
  },
  oinkolognef: {
    name: ['Oinkologne-Female', 'Oinkologne-F'],
    sources: {
      ps: { id: 'oinkologne-f' },
      serebii: { id: '916-f' },
      pd: { id: 'oinkologne-female' },
      pmd: { id: '0916/0000/0000/0002' },
    },
  },
  tarountula: {
    name: ['Tarountula'],
    sources: { ps: {}, serebii: { id: '917' }, pd: {}, pmd: { id: '0917' } },
  },
  spidops: {
    name: ['Spidops'],
    sources: { ps: {}, serebii: { id: '918' }, pd: {}, pmd: { id: '0918' } },
  },
  nymble: {
    name: ['Nymble'],
    sources: { ps: {}, serebii: { id: '919' }, pd: {}, pmd: { id: '0919' } },
  },
  lokix: {
    name: ['Lokix'],
    sources: { ps: {}, serebii: { id: '920' }, pd: {}, pmd: { id: '0920' } },
  },
  pawmi: {
    name: ['Pawmi'],
    sources: {
      ps: {},
      serebii: { id: '921' },
      pd: { flip: true },
      pmd: { id: '0921' },
    },
  },
  pawmo: {
    name: ['Pawmo'],
    sources: { ps: {}, serebii: { id: '922' }, pd: {}, pmd: { id: '0922' } },
  },
  pawmot: {
    name: ['Pawmot'],
    sources: { ps: {}, serebii: { id: '923' }, pd: {}, pmd: { id: '0923' } },
  },
  tandemaus: {
    name: ['Tandemaus'],
    sources: { ps: {}, serebii: { id: '924' }, pd: {}, pmd: { id: '0924' } },
  },
  maushold: {
    name: ['Maushold'],
    sources: {
      ps: {},
      serebii: { id: '925' },
      pd: { id: 'maushold-family3' },
      pmd: { id: '0925' },
    },
  },
  fidough: {
    name: ['Fidough'],
    sources: { ps: {}, serebii: { id: '926' }, pd: {}, pmd: { id: '0926' } },
  },
  dachsbun: {
    name: ['Dachsbun'],
    sources: { ps: {}, serebii: { id: '927' }, pd: {}, pmd: { id: '0927' } },
  },
  smoliv: {
    name: ['Smoliv'],
    sources: {
      ps: {},
      serebii: { id: '928' },
      pd: { flip: true },
      pmd: { id: '0928' },
    },
  },
  dolliv: {
    name: ['Dolliv'],
    sources: {
      ps: {},
      serebii: { id: '929' },
      pd: { flip: true },
      pmd: { id: '0929' },
    },
  },
  arboliva: {
    name: ['Arboliva'],
    sources: { ps: {}, serebii: { id: '930' }, pd: {}, pmd: { id: '0930' } },
  },
  squawkabilly: {
    name: ['Squawkabilly'],
    sources: { ps: {}, serebii: { id: '931' }, pd: {}, pmd: { id: '0931' } },
  },
  squawkabillyblue: {
    name: ['Squawkabilly-Blue'],
    sources: {
      ps: { id: 'squawkabilly-blue' },
      serebii: { id: '931-b' },
      pd: { id: 'squawkabilly-blue' },
      pmd: { id: '0931/0001' },
    },
  },
  squawkabillyyellow: {
    name: ['Squawkabilly-Yellow'],
    sources: {
      ps: { id: 'squawkabilly-yellow' },
      serebii: { id: '931-y' },
      pd: { id: 'squawkabilly-yellow' },
      pmd: { id: '0931/0002' },
    },
  },
  squawkabillywhite: {
    name: ['Squawkabilly-White'],
    sources: {
      ps: { id: 'squawkabilly-white' },
      serebii: { id: '931-w' },
      pd: { id: 'squawkabilly-white' },
      pmd: { id: '0931/0003' },
    },
  },
  nacli: {
    name: ['Nacli'],
    sources: { ps: {}, serebii: { id: '932' }, pd: {}, pmd: { id: '0932' } },
  },
  naclstack: {
    name: ['Naclstack'],
    sources: { ps: {}, serebii: { id: '933' }, pd: {}, pmd: { id: '0933' } },
  },
  garganacl: {
    name: ['Garganacl'],
    sources: { ps: {}, serebii: { id: '934' }, pd: {}, pmd: { id: '0934' } },
  },
  charcadet: {
    name: ['Charcadet'],
    sources: { ps: {}, serebii: { id: '935' }, pd: {}, pmd: { id: '0935' } },
  },
  armarouge: {
    name: ['Armarouge'],
    sources: {
      ps: {},
      serebii: { id: '936' },
      pd: { flip: true },
      pmd: { id: '0936' },
    },
  },
  ceruledge: {
    name: ['Ceruledge'],
    sources: { ps: {}, serebii: { id: '937' }, pd: {}, pmd: { id: '0937' } },
  },
  tadbulb: {
    name: ['Tadbulb'],
    sources: { ps: {}, serebii: { id: '938' }, pd: {}, pmd: { id: '0938' } },
  },
  bellibolt: {
    name: ['Bellibolt'],
    sources: { ps: {}, serebii: { id: '939' }, pd: {}, pmd: { id: '0939' } },
  },
  wattrel: {
    name: ['Wattrel'],
    sources: { ps: {}, serebii: { id: '940' }, pd: {}, pmd: { id: '0940' } },
  },
  kilowattrel: {
    name: ['Kilowattrel'],
    sources: { ps: {}, serebii: { id: '941' }, pd: {}, pmd: { id: '0941' } },
  },
  maschiff: {
    name: ['Maschiff'],
    sources: { ps: {}, serebii: { id: '942' }, pd: {}, pmd: { id: '0942' } },
  },
  mabosstiff: {
    name: ['Mabosstiff'],
    sources: { ps: {}, serebii: { id: '943' }, pd: {}, pmd: { id: '0943' } },
  },
  shroodle: {
    name: ['Shroodle'],
    sources: { ps: {}, serebii: { id: '944' }, pd: {}, pmd: { id: '0944' } },
  },
  grafaiai: {
    name: ['Grafaiai'],
    sources: { ps: {}, serebii: { id: '945' }, pd: {}, pmd: { id: '0945' } },
  },
  bramblin: {
    name: ['Bramblin'],
    sources: {
      ps: {},
      serebii: { id: '946' },
      pd: { flip: true },
      pmd: { id: '0946' },
    },
  },
  brambleghast: {
    name: ['Brambleghast'],
    sources: { ps: {}, serebii: { id: '947' }, pd: {}, pmd: { id: '0947' } },
  },
  toedscool: {
    name: ['Toedscool'],
    sources: { ps: {}, serebii: { id: '948' }, pd: {}, pmd: { id: '0948' } },
  },
  toedscruel: {
    name: ['Toedscruel'],
    sources: { ps: {}, serebii: { id: '949' }, pd: {}, pmd: { id: '0949' } },
  },
  klawf: {
    name: ['Klawf'],
    sources: {
      ps: {},
      serebii: { id: '950' },
      pd: { flip: true },
      pmd: { id: '0950' },
    },
  },
  capsakid: {
    name: ['Capsakid'],
    sources: { ps: {}, serebii: { id: '951' }, pd: {}, pmd: { id: '0951' } },
  },
  scovillain: {
    name: ['Scovillain'],
    sources: {
      ps: {},
      serebii: { id: '952' },
      pd: { flip: true },
      pmd: { id: '0952' },
    },
  },
  rellor: {
    name: ['Rellor'],
    sources: { ps: {}, serebii: { id: '953' }, pd: {}, pmd: { id: '0953' } },
  },
  rabsca: {
    name: ['Rabsca'],
    sources: { ps: {}, serebii: { id: '954' }, pd: {}, pmd: { id: '0954' } },
  },
  flittle: {
    name: ['Flittle'],
    sources: {
      ps: {},
      serebii: { id: '955' },
      pd: { flip: true },
      pmd: { id: '0955' },
    },
  },
  espathra: {
    name: ['Espathra'],
    sources: { ps: {}, serebii: { id: '956' }, pd: {}, pmd: { id: '0956' } },
  },
  tinkatink: {
    name: ['Tinkatink'],
    sources: { ps: {}, serebii: { id: '957' }, pd: {}, pmd: { id: '0957' } },
  },
  tinkatuff: {
    name: ['Tinkatuff'],
    sources: { ps: {}, serebii: { id: '958' }, pd: {}, pmd: { id: '0958' } },
  },
  tinkaton: {
    name: ['Tinkaton'],
    sources: { ps: {}, serebii: { id: '959' }, pd: {}, pmd: { id: '0959' } },
  },
  wiglett: {
    name: ['Wiglett'],
    sources: { ps: {}, serebii: { id: '960' }, pd: {}, pmd: { id: '0960' } },
  },
  wugtrio: {
    name: ['Wugtrio'],
    sources: {
      ps: {},
      serebii: { id: '961' },
      pd: { flip: true },
      pmd: { id: '0961' },
    },
  },
  bombirdier: {
    name: ['Bombirdier'],
    sources: { ps: {}, serebii: { id: '962' }, pd: {}, pmd: { id: '0962' } },
  },
  finizen: {
    name: ['Finizen'],
    sources: { ps: {}, serebii: { id: '963' }, pd: {}, pmd: { id: '0963' } },
  },
  palafin: {
    name: ['Palafin'],
    sources: { ps: {}, serebii: { id: '964' }, pd: {}, pmd: { id: '0964' } },
  },
  palafinhero: {
    name: ['Palafin-Hero'],
    sources: {
      ps: { id: 'palafin-hero' },
      serebii: { id: '964-h' },
      pd: { id: 'palafin-hero' },
      pmd: { id: '0964/0001' },
    },
  },
  varoom: {
    name: ['Varoom'],
    sources: { ps: {}, serebii: { id: '965' }, pd: {}, pmd: { id: '0965' } },
  },
  revavroom: {
    name: ['Revavroom'],
    sources: { ps: {}, serebii: { id: '966' }, pd: {}, pmd: { id: '0966' } },
  },
  cyclizar: {
    name: ['Cyclizar'],
    sources: {
      ps: {},
      serebii: { id: '967' },
      pd: { flip: true },
      pmd: { id: '0967' },
    },
  },
  orthworm: {
    name: ['Orthworm'],
    sources: { ps: {}, serebii: { id: '968' }, pd: {}, pmd: { id: '0968' } },
  },
  glimmet: {
    name: ['Glimmet'],
    sources: {
      ps: {},
      serebii: { id: '969' },
      pd: { flip: true },
      pmd: { id: '0969' },
    },
  },
  glimmora: {
    name: ['Glimmora'],
    sources: {
      ps: {},
      serebii: { id: '970' },
      pd: { flip: true },
      pmd: { id: '0970' },
    },
  },
  greavard: {
    name: ['Greavard'],
    sources: { ps: {}, serebii: { id: '971' }, pd: {}, pmd: { id: '0971' } },
  },
  houndstone: {
    name: ['Houndstone'],
    sources: { ps: {}, serebii: { id: '972' }, pd: {}, pmd: { id: '0972' } },
  },
  flamigo: {
    name: ['Flamigo'],
    sources: { ps: {}, serebii: { id: '973' }, pd: {}, pmd: { id: '0973' } },
  },
  cetoddle: {
    name: ['Cetoddle'],
    sources: { ps: {}, serebii: { id: '974' }, pd: {}, pmd: { id: '0974' } },
  },
  cetitan: {
    name: ['Cetitan'],
    sources: { ps: {}, serebii: { id: '975' }, pd: {}, pmd: { id: '0975' } },
  },
  veluza: {
    name: ['Veluza'],
    sources: { ps: {}, serebii: { id: '976' }, pd: {}, pmd: { id: '0976' } },
  },
  dondozo: {
    name: ['Dondozo'],
    sources: { ps: {}, serebii: { id: '977' }, pd: {}, pmd: { id: '0977' } },
  },
  tatsugiri: {
    name: ['Tatsugiri'],
    sources: {
      ps: {},
      serebii: { id: '978' },
      pd: { flip: true },
      pmd: { id: '0978' },
    },
  },
  annihilape: {
    name: ['Annihilape'],
    sources: { ps: {}, serebii: { id: '979' }, pd: {}, pmd: { id: '0979' } },
  },
  clodsire: {
    name: ['Clodsire'],
    sources: { ps: {}, serebii: { id: '980' }, pd: {}, pmd: { id: '0980' } },
  },
  farigiraf: {
    name: ['Farigiraf'],
    sources: {
      ps: {},
      serebii: { id: '981' },
      pd: { flip: true },
      pmd: { id: '0981' },
    },
  },
  dudunsparce: {
    name: ['Dudunsparce'],
    sources: { ps: {}, serebii: { id: '982' }, pd: {}, pmd: { id: '0982' } },
  },
  dudunsparcethreesegment: {
    name: ['Dudunsparce-Three-Segment'],
    sources: {
      ps: { id: 'dudunsparce-threesegment' },
      serebii: { id: '982-t' },
      pd: { id: 'dudunsparce-three-segment' },
      pmd: { id: '0982/0001' },
    },
  },
  kingambit: {
    name: ['Kingambit'],
    sources: { ps: {}, serebii: { id: '983' }, pd: {}, pmd: { id: '0983' } },
  },
  greattusk: {
    name: ['Great Tusk'],
    sources: {
      ps: {},
      serebii: { id: '984' },
      pd: { id: 'great-tusk' },
      pmd: { id: '0984' },
    },
  },
  screamtail: {
    name: ['Scream Tail'],
    sources: {
      ps: {},
      serebii: { id: '985' },
      pd: { id: 'scream-tail', flip: true },
      pmd: { id: '0985' },
    },
  },
  brutebonnet: {
    name: ['Brute Bonnet'],
    sources: {
      ps: {},
      serebii: { id: '986' },
      pd: { id: 'brute-bonnet' },
      pmd: { id: '0986' },
    },
  },
  fluttermane: {
    name: ['Flutter Mane'],
    sources: {
      ps: {},
      serebii: { id: '987' },
      pd: { id: 'flutter-mane' },
      pmd: { id: '0987' },
    },
  },
  slitherwing: {
    name: ['Slither Wing'],
    sources: {
      ps: {},
      serebii: { id: '988' },
      pd: { id: 'slither-wing' },
      pmd: { id: '0988' },
    },
  },
  sandyshocks: {
    name: ['Sandy Shocks'],
    sources: {
      ps: {},
      serebii: { id: '989' },
      pd: { id: 'sandy-shocks' },
      pmd: { id: '0989' },
    },
  },
  irontreads: {
    name: ['Iron Treads'],
    sources: {
      ps: {},
      serebii: { id: '990' },
      pd: { id: 'iron-treads' },
      pmd: { id: '0990' },
    },
  },
  ironbundle: {
    name: ['Iron Bundle'],
    sources: {
      ps: {},
      serebii: { id: '991' },
      pd: { id: 'iron-bundle' },
      pmd: { id: '0991' },
    },
  },
  ironhands: {
    name: ['Iron Hands'],
    sources: {
      ps: {},
      serebii: { id: '992' },
      pd: { id: 'iron-hands' },
      pmd: { id: '0992' },
    },
  },
  ironjugulis: {
    name: ['Iron Jugulis'],
    sources: {
      ps: {},
      serebii: { id: '993' },
      pd: { id: 'iron-jugulis' },
      pmd: { id: '0993' },
    },
  },
  ironmoth: {
    name: ['Iron Moth'],
    sources: {
      ps: {},
      serebii: { id: '994' },
      pd: { id: 'iron-moth' },
      pmd: { id: '0994' },
    },
  },
  ironthorns: {
    name: ['Iron Thorns'],
    sources: {
      ps: {},
      serebii: { id: '995' },
      pd: { id: 'iron-thorns' },
      pmd: { id: '0995' },
    },
  },
  frigibax: {
    name: ['Frigibax'],
    sources: { ps: {}, serebii: { id: '996' }, pd: {}, pmd: { id: '0996' } },
  },
  arctibax: {
    name: ['Arctibax'],
    sources: { ps: {}, serebii: { id: '997' }, pd: {}, pmd: { id: '0997' } },
  },
  baxcalibur: {
    name: ['Baxcalibur'],
    sources: { ps: {}, serebii: { id: '998' }, pd: {}, pmd: { id: '0998' } },
  },
  gimmighoul: {
    name: ['Gimmighoul'],
    sources: { ps: {}, serebii: { id: '999' }, pd: {}, pmd: { id: '0999' } },
  },
  gimmighoulroaming: {
    name: ['Gimmighoul-Roaming'],
    sources: {
      ps: { id: 'gimmighoul-roaming' },
      serebii: { id: '999-r' },
      pd: { id: 'gimmighoul-roaming' },
      pmd: { id: '0999/0001' },
    },
  },
  gholdengo: {
    name: ['Gholdengo'],
    sources: { ps: {}, serebii: { id: '1000' }, pd: {}, pmd: { id: '1000' } },
  },
  wochien: {
    name: ['Wo-Chien'],
    sources: {
      ps: {},
      serebii: { id: '1001' },
      pd: { id: 'wo-chien' },
      pmd: { id: '1001' },
    },
  },
  chienpao: {
    name: ['Chien-Pao'],
    sources: {
      ps: {},
      serebii: { id: '1002' },
      pd: { id: 'chien-pao' },
      pmd: { id: '1002' },
    },
  },
  tinglu: {
    name: ['Ting-Lu'],
    sources: {
      ps: {},
      serebii: { id: '1003' },
      pd: { id: 'ting-lu', flip: true },
      pmd: { id: '1003' },
    },
  },
  chiyu: {
    name: ['Chi-Yu'],
    sources: {
      ps: {},
      serebii: { id: '1004' },
      pd: { id: 'chi-yu' },
      pmd: { id: '1004' },
    },
  },
  roaringmoon: {
    name: ['Roaring Moon'],
    sources: {
      ps: {},
      serebii: { id: '1005' },
      pd: { id: 'roaring-moon' },
      pmd: { id: '1005' },
    },
  },
  ironvaliant: {
    name: ['Iron Valiant'],
    sources: {
      ps: {},
      serebii: { id: '1006' },
      pd: { id: 'iron-valiant', flip: true },
      pmd: { id: '1006' },
    },
  },
  koraidon: {
    name: ['Koraidon'],
    sources: {
      ps: {},
      serebii: { id: '1007' },
      pd: { flip: true },
      pmd: { id: '1007' },
    },
  },
  miraidon: {
    name: ['Miraidon'],
    sources: { ps: {}, serebii: { id: '1008' }, pd: {}, pmd: { id: '1008' } },
  },
  walkingwake: {
    name: ['Walking Wake'],
    sources: {
      ps: {},
      serebii: { id: '1009' },
      pd: { id: 'walking-wake' },
      pmd: { id: '1009' },
    },
  },
  ironleaves: {
    name: ['Iron Leaves'],
    sources: {
      ps: {},
      serebii: { id: '1010' },
      pd: { id: 'iron-leaves' },
      pmd: { id: '1010' },
    },
  },
  dipplin: {
    name: ['Dipplin'],
    sources: {
      ps: {},
      serebii: { id: '1011' },
      pd: { flip: true },
      pmd: { id: '1011' },
    },
  },
  poltchageist: {
    name: ['Poltchageist'],
    sources: { ps: {}, serebii: { id: '1012' }, pd: {}, pmd: { id: '1012' } },
  },
  sinistcha: {
    name: ['Sinistcha'],
    sources: { ps: {}, serebii: { id: '1013' }, pd: {}, pmd: { id: '1013' } },
  },
  okidogi: {
    name: ['Okidogi'],
    sources: { ps: {}, serebii: { id: '1014' }, pd: {}, pmd: { id: '1014' } },
  },
  munkidori: {
    name: ['Munkidori'],
    sources: { ps: {}, serebii: { id: '1015' }, pd: {}, pmd: { id: '1015' } },
  },
  fezandipiti: {
    name: ['Fezandipiti'],
    sources: {
      ps: {},
      serebii: { id: '1016' },
      pd: { flip: true },
      pmd: { id: '1016' },
    },
  },
  ogerpon: {
    name: ['Ogerpon'],
    sources: {
      ps: {},
      serebii: { id: '1017' },
      pd: {},
      pmd: { id: '1017/0004' },
    },
  },
  ogerponwellspring: {
    name: ['Ogerpon-Wellspring'],
    sources: {
      ps: { id: 'ogerpon-wellspring' },
      serebii: { id: '1017-w' },
      pd: { id: 'ogerpon-wellspring' },
      pmd: { id: '1017/0005' },
    },
  },
  ogerponhearthflame: {
    name: ['Ogerpon-Hearthflame'],
    sources: {
      ps: { id: 'ogerpon-hearthflame' },
      serebii: { id: '1017-h' },
      pd: { id: 'ogerpon-hearthflame' },
      pmd: { id: '1017/0006' },
    },
  },
  ogerponcornerstone: {
    name: ['Ogerpon-Cornerstone'],
    sources: {
      ps: { id: 'ogerpon-cornerstone' },
      serebii: { id: '1017-c' },
      pd: { id: 'ogerpon-cornerstone' },
      pmd: { id: '1017/0007' },
    },
  },
  archaludon: {
    name: ['Archaludon'],
    sources: { ps: {}, serebii: { id: '1018' }, pd: {}, pmd: { id: '1018' } },
  },
  hydrapple: {
    name: ['Hydrapple'],
    sources: { ps: {}, serebii: { id: '1019' }, pd: {}, pmd: { id: '1019' } },
  },
  gougingfire: {
    name: ['Gouging Fire'],
    sources: {
      ps: {},
      serebii: { id: '1020' },
      pd: { id: 'gouging-fire' },
      pmd: { id: '1020' },
    },
  },
  ragingbolt: {
    name: ['Raging Bolt'],
    sources: {
      ps: {},
      serebii: { id: '1021' },
      pd: { id: 'raging-bolt' },
      pmd: { id: '1021' },
    },
  },
  ironboulder: {
    name: ['Iron Boulder'],
    sources: {
      ps: {},
      serebii: { id: '1022' },
      pd: { id: 'iron-boulder', flip: true },
      pmd: { id: '1022' },
    },
  },
  ironcrown: {
    name: ['Iron Crown'],
    sources: {
      ps: {},
      serebii: { id: '1023' },
      pd: { id: 'iron-crown', flip: true },
      pmd: { id: '1023' },
    },
  },
  terapagos: {
    name: ['Terapagos'],
    sources: {
      ps: {},
      serebii: { id: '1024' },
      pd: { flip: true },
      pmd: { id: '1024' },
    },
  },
  terapagosterastal: {
    name: ['Terapagos-Terastal'],
    sources: {
      ps: { id: 'terapagos-terastal' },
      serebii: { id: '1024-t' },
      pd: { id: 'terapagos-terastal', flip: true },
      pmd: { id: '1024/0001' },
    },
  },
  pecharunt: {
    name: ['Pecharunt'],
    sources: { ps: {}, serebii: { id: '1025' }, pd: {}, pmd: { id: '1025' } },
  },
  chillet: { name: ['Chillet'], sources: { rr: {} }, default: 'rr' },
  syclar: { name: ['Syclar'], sources: { ps: {} }, default: 'bw' },
  syclant: { name: ['Syclant'], sources: { ps: {} }, default: 'bw' },
  revenankh: { name: ['Revenankh'], sources: { ps: {} }, default: 'bw' },
  embirch: { name: ['Embirch'], sources: { ps: {} }, default: 'bw' },
  flarelm: { name: ['Flarelm'], sources: { ps: {} }, default: 'bw' },
  pyroak: { name: ['Pyroak'], sources: { ps: {} }, default: 'bw' },
  breezi: { name: ['Breezi'], sources: { ps: {} }, default: 'bw' },
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
