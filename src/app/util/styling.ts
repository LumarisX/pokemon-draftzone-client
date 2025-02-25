export function typeColor(type: string) {
  switch (type) {
    case 'Bug':
      return '#91A119';
    case 'Dark':
      return '#50413F';
    case 'Dragon':
      return '#5060E1';
    case 'Electric':
      return '#FAC000';
    case 'Fairy':
      return '#EF70EF';
    case 'Fighting':
      return '#FF8000';
    case 'Fire':
      return '#E62829';
    case 'Flying':
      return '#81B9EF';
    case 'Ghost':
      return '#704170';
    case 'Grass':
      return '#3FA129';
    case 'Ground':
      return '#915121';
    case 'Ice':
      return '#3FD8FF';
    case 'Normal':
      return '#9FA19F';
    case 'Poison':
      return '#9141CB';
    case 'Psychic':
      return '#EF4179';
    case 'Rock':
      return '#AFA981';
    case 'Steel':
      return '#60A1B8';
    case 'Stellar':
      return '#FFF';
    case 'Water':
      return '#2980EF';
  }
  return null;
}
