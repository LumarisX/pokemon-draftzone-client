import {
  MoveChart,
  Summary,
  TypeChart,
} from '../matchup-overview/matchup-interface';

export type Planner = {
  summary: Summary;
  typechart: TypeChart;
  movechart: MoveChart;
};
