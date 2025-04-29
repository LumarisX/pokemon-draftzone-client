import { Component } from '@angular/core';

@Component({
  selector: 'pdz-league-manage',
  imports: [],
  templateUrl: './league-manage.component.html',
  styleUrls: ['./league-manage.component.scss', '../league.scss'],
})
export class LeagueManageComponent {
  groups = [{ name: 'Attack Division' }, { name: 'Defense Division' }];
}
