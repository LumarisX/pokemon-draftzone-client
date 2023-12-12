// import { Pokemon } from "./pokemon";
// import { Team } from "./team";

// export const draftTeamList: Team[] = [
//   {
//     leagueName: "TBPL S8", leagueId: "tbpl", format: "vgc", ruleset: "nd", team: [
//       new Pokemon("charizardmegay", [], true),
//       new Pokemon("roaringmoon", [], true),
//       new Pokemon("tangrowth", [], true),
//       new Pokemon("espeon", [], true),
//       new Pokemon("heliolisk", [], true),
//       new Pokemon("klefki", [], true),
//       new Pokemon("ceruledge", [], true),
//       new Pokemon("quagsire", [], true),
//       new Pokemon("passimian", [], true),
//       new Pokemon("castform", [], true),
//       new Pokemon("maractus", [], true)
//     ]
//   },
//   {
//     leagueName: "SCDA Beast", leagueId: "scdabeast", format: "singles", ruleset: "nd", team: [
//       new Pokemon("xerneas", [], false),
//       new Pokemon("kartana", [], false),
//       new Pokemon("walkingwake", [], false),
//       new Pokemon("gliscor", [], false),
//       new Pokemon("slitherwing", [], false),
//       new Pokemon("torkoal", [], false),
//       new Pokemon("umbreon", [], false),
//       new Pokemon("manectricmega", [], false),
//       new Pokemon("slowbrogalar", [], false),
//       new Pokemon("komala", [], false),
//       new Pokemon("swirlix", [], false)
//     ]
//   },
//   {
//     leagueName: "SCDA Ultra", leagueId: "scdaultra", format: "vgc", ruleset: "gen9", team: [
//       new Pokemon("volcarona", [], false),
//       new Pokemon("kommoo", [], false),
//       new Pokemon("regieleki", [], false),
//       new Pokemon("tinkaton", [], false),
//       new Pokemon("azelf", [], false),
//       new Pokemon("greninja", [], false),
//       new Pokemon("donphan", [], false),
//       new Pokemon("seviper", [], false),
//       new Pokemon("braviary", [], false),
//       new Pokemon("sentret", [], false)
//     ]
//   },
//   {
//     leagueName: "SCDA Safari", leagueId: "scdasafari", format: "vgc", ruleset: "nd", team: [
//       new Pokemon("thwackey", [], false),
//       new Pokemon("swoobat", [], false),
//       new Pokemon("togedemaru", [], false),
//       new Pokemon("fraxure", [], false),
//       new Pokemon("bibarel", [], false),
//       new Pokemon("morgrem", [], false),
//       new Pokemon("combusken", [], false),
//       new Pokemon("cranidos", [], false),
//       new Pokemon("gastly", [], false),
//       new Pokemon("wormadamsandy", [], false)
//     ]
//   },
//   {
//     leagueName: "Evo League", leagueId: "evoleague", format: "vgc", ruleset: "nd", team: [
//       new Pokemon("archen", [], false),
//       new Pokemon("brionne", [], false),
//       new Pokemon("foongus", [], false),
//       new Pokemon("growlithe", [], false),
//       new Pokemon("diglett", [], false),
//       new Pokemon("impidimp", [], false),
//       new Pokemon("spinda", [], false),
//       new Pokemon("bronzor", [], false),
//       new Pokemon("fletchling", [], false),
//       new Pokemon("meowthalola", [], false),
//       new Pokemon("sentret", [], false)
//     ]
//   },
// ]

// /*
// [{"leagueName":"TBPL S8","format":"vgc","ruleset":"nd","team":{"charizardmegay":{},"roaringmoon":{"tera":[]},"tangrowth":{"z":true},"espeon":{"shiny":true},"heliolisk":{"shiny":true},"klefki":{},"ceruledge":{"tera":[],"z":true},"quagsire":{},"passimian":{},"castform":{"tera":["Water","Fire","Normal","Ice"]},"maractus":{}},"opponents":[{"teamName":"Knights of Cydonia","score":[2,0],"stage":"Week 1","team":{"deoxysattack":{"tera":[],"z":true},"registeel":{"tera":[],"z":true},"sceptile":{"tera":[],"z":true},"steelix":{"tera":[],"z":true},"thwackey":{"tera":[],"z":true},"hippopotas":{"tera":[],"z":true},"dracozolt":{"tera":[],"z":true},"machamp":{"tera":[],"z":true},"bronzor":{"tera":[],"z":true},"qwilfishhisui":{"tera":[],"z":true},"riolu":{"tera":[],"z":true}}},{"teamName":"Wyndon Saints","score":[2,0],"stage":"Week 2","team":{"ogerponcornerstone":{"tera":[],"z":true},"tyranitar":{"tera":[],"z":true},"ninetalesalola":{"tera":[],"z":true},"articuno":{"tera":[],"z":true},"lycanroc":{"tera":[],"z":true},"infernape":{"tera":[],"z":true},"sandslashalola":{"tera":[],"z":true},"lumineon":{"tera":[],"z":true},"butterfree":{"tera":[],"z":true},"piplup":{"tera":[],"z":true},"quaxly":{"tera":[],"z":true}}},{"teamName":"Inglorious Surfers","score":[2,0],"stage":"Week 3","team":{"wochien":{"tera":[],"z":true},"illumise":{"tera":[],"z":true},"heatran":{"tera":[],"z":true},"kabutops":{"tera":[],"z":true},"obstagoon":{"tera":[],"z":true},"aromatisse":{"tera":[],"z":true},"delibird":{"tera":[],"z":true},"haunter":{"tera":[],"z":true},"sandyshocks":{"tera":[],"z":true},"altaria":{"tera":[],"z":true},"venonat":{"tera":[],"z":true}}},{"teamName":"Bulu Boys","score":[2,0],"stage":"Week 4","team":{"tapukoko":{"tera":[],"z":true},"garchomp":{"tera":[],"z":true},"lucariomega":{"tera":[],"z":true},"rotomwash":{"tera":[],"z":true},"perrserker":{"tera":[],"z":true},"ironleaves":{"tera":[],"z":true},"mrmime":{"tera":[],"z":true},"sharpedo":{"tera":[],"z":true},"fletchinder":{"tera":[],"z":true},"swalot":{"tera":[],"z":true},"duskull":{"tera":[],"z":true}}},{"teamName":"Chillin Chespins","score":[],"stage":"Week 5","team":{"whimsicott":{"tera":[],"z":true},"chiyu":{"tera":[],"z":true},"lopunnymega":{"tera":[],"z":true},"melmetal":{"tera":[],"z":true},"corsolagalar":{"tera":[],"z":true},"clamperl":{"tera":[],"z":true},"avalugg":{"tera":[],"z":true},"glimmet":{"tera":[],"z":true},"gothorita":{"tera":[],"z":true},"squirtle":{"tera":[],"z":true},"dracovish":{"tera":[],"z":true}}}]},{"leagueName":"Evo League","format":"vgc","ruleset":"nd","team":{"archen":{},"brionne":{},"foongus":{"shiny":true},"growlithe":{},"diglett":{},"impidimp":{},"spinda":{"shiny":true},"bronzor":{},"fletchling":{},"meowth":{},"sentret":{}}},{"leagueName":"SCDA Ultra","format":"vgc","ruleset":"9","team":{"volcarona":{},"kommoo":{},"regieleki":{},"tinkaton":{},"azelf":{},"greninja":{"shiny":true},"donphan":{},"seviper":{},"braviary":{},"sentret":{}},"opponents":[{"teamName":"Chillin Chespins","score":[1,2],"stage":"Week 1","team":{"garchomp":{"tera":[]},"talonflame":{"tera":[]},"urshifurapidstrike":{"tera":[]},"brambleghast":{"tera":[]},"rotomheat":{"tera":[]},"clefable":{"tera":[]},"misdreavus":{"tera":[]},"avalugghisui":{"tera":[]},"magcargo":{"tera":[]},"flamigo":{"tera":[]}}},{"teamName":"Athens Alcremie","score":[2,1],"stage":"Week 2","team":{"kingambit":{"tera":[]},"thundurustherian":{"tera":[]},"ninetalesalola":{"tera":[]},"vaporeon":{"tera":[]},"decidueyehisui":{"tera":[]},"dusknoir":{"tera":[]},"furret":{"tera":[]},"dragalge":{"tera":[]},"masquerain":{"tera":[]},"camerupt":{"tera":[]}}},{"teamName":"Smoliv Garden","score":[],"stage":"Week 3","team":{"heatran":{"tera":[]},"chienpao":{"tera":[]},"staraptor":{"tera":[]},"eelektross":{"tera":[]},"hatterene":{"tera":[]},"quaquaval":{"tera":[]},"dugtrio":{"tera":[]},"lumineon":{"tera":[]},"haunter":{"tera":[]},"tsareena":{"tera":[]}}},{"teamName":"Carolina Panchams","score":[],"stage":"Week 4","team":{"dondozo":{"tera":[]},"tatsugiri":{"tera":[]},"irontreads":{"tera":[]},"sneasler":{"tera":[]},"gliscor":{"tera":[]},"delphox":{"tera":[]},"abomasnow":{"tera":[]},"gumshoos":{"tera":[]},"bronzor":{"tera":[]},"honchkrow":{"tera":[]}}}]},{"leagueName":"SCDA Safari","format":"vgc","ruleset":"nd","team":{"thwackey":{"shiny":true},"swoobat":{},"togedemaru":{},"fraxure":{},"bibarel":{},"morgrem":{},"combusken":{},"cranidos":{"shiny":true},"gastly":{"shiny":true},"wormadamsandy":{}}},{"leagueName":"SCDA Beast","format":"singles","ruleset":"nd","team":{"xerneas":{},"kartana":{"tera":[]},"walkingwake":{},"gliscor":{},"slitherwing":{},"torkoal":{},"umbreon":{"shiny":true},"manectricmega":{},"slowbrogalar":{"tera":[],"shiny":true},"komala":{"shiny":true},"swirlix":{}}}]
// */