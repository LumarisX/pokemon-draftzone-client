import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'pdz-league-manage-hub',
  standalone: true,
  templateUrl: './league-manage-hub.component.html',
  styleUrls: ['./league-manage-hub.component.scss'],
})
export class LeagueManageHubComponent {
  constructor(private router: Router) {}

  navigateTo(path: string) {
    this.router.navigate(['/league/manage', path]);
  }

  navigateToDivision(divisionKey: string, subPath?: string) {
    const path = subPath
      ? ['/league/manage', divisionKey, subPath]
      : ['/league/manage', divisionKey];
    this.router.navigate(path);
  }
}
