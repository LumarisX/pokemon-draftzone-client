import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'pdz-league-landing',
  imports: [RouterModule],
  templateUrl: './league-landing.component.html',
  styleUrl: './league-landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueLandingComponent {}
