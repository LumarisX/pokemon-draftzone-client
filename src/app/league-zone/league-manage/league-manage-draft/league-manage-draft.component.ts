import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { LeagueManageService } from '../../../services/league-manage.service';

@Component({
  selector: 'pdz-league-manage-draft',
  imports: [],
  templateUrl: './league-manage-draft.component.html',
  styleUrl: './league-manage-draft.component.scss',
})
export class LeagueManageDraftComponent {
  leagueManageService = inject(LeagueManageService);
  private route = inject(ActivatedRoute);
  setPick() {
    // this.route.params
    // this.leagueManageService.setPick();
  }
}
