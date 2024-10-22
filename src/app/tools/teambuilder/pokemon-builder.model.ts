export class PokemonBuilder {
  ivs: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  } = {
    hp: 31,
    atk: 31,
    def: 31,
    spa: 31,
    spd: 31,
    spe: 31,
  };
  evs: {
    hp: number;
    atk: number;
    def: number;
    spa: number;
    spd: number;
    spe: number;
  } = {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };
  stats = {
    hp: 0,
    atk: 0,
    def: 0,
    spa: 0,
    spd: 0,
    spe: 0,
  };
  gender: '' = '';
  level: number = 100;
  happiness = 255;
  hiddenpower: string = 'Dark';
  gmax: boolean = false;
  shiny: boolean = false;
  name: string = '';
  nature: string = '';
  moves: [string | null, string | null, string | null, string | null] = [
    null,
    null,
    null,
    null,
  ];
  ability: string = '';
  abilities: { name: string; id: string }[] = [];
  learnset: { name: string; id: string; type: string }[] = [];
  item: string = '';
  teraType: string = '';
  nickname: string = '';
  id: string = '';
  constructor(options: Partial<PokemonBuilder> = {}) {
    Object.assign(this, options);
  }

  getLearnset() {
    return this.learnset.map((move) => ({
      name: move.name,
      value: move.id,
      icon: `../../../../assets/icons/types/${move.type}.png`,
    }));
  }

  toPacked() {
    return [
      this.nickname,
      this.id,
      this.item,
      this.ability,
      this.moves.join(','),
      this.nature,
      Object.values(this.evs).join(','),
      this.gender,
      Object.values(this.ivs).join(','),
      this.shiny ? 'S' : '',
      this.level,
      [
        this.happiness,
        '',
        this.hiddenpower,
        this.gmax ? 'G' : '',
        '',
        this.teraType,
      ].join(','),
    ].join('|');
  }

  toExport() {
    let string: string;
    if (this.nickname) {
      string = `${this.nickname} (${this.id})`;
    } else {
      string = `${this.id}`;
    }
    if (this.gender != '') string += ` (${this.gender})`;
    if (this.item != '') string += ` @ ${this.item}`;
    string += '\n';
    if (this.ability) string += `Ability: ${this.ability}\n`;
    if (this.level < 100 && this.level > 0) string += `Level: ${this.level}\n`;
    if (this.teraType != '') string += `Tera Type: ${this.teraType}\n`;
    let evs = Object.entries(this.evs)
      .filter((stat) => stat[1] <= 252 && stat[1] > 0)
      .map((stat) => `${stat[1]} ${stat[0]}`);
    if (evs.length > 0) string += `EVs: ${evs.join(' / ')}\n`;
    if (this.nature != '') string += `${this.nature} Nature\n`;
    let ivs = Object.entries(this.ivs)
      .filter((stat) => stat[1] < 31 && stat[1] >= 0)
      .map((stat) => `${stat[1]} ${stat[0]}`);
    if (ivs.length > 0) string += `IVs: ${ivs.join(' / ')}\n`;
    let moves = this.moves.filter((move) => move != '');
    moves.forEach((move) => {
      string += `- ${move}\n`;
    });
    return string;
  }
}
