import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { LEAGUE_ZONE_PATH, profileLink } from '@pdz/core/route-paths';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { ChatChannel, ChatReport } from '../league-chat/league-chat.model';

const CHANNEL_LABELS: Record<ChatChannel, string> = {
  tournament: 'Tournament chat',
  matchup: 'Match chat',
  draft: 'Draft chat',
  spectator: 'Spectator chat',
};

@Component({
  selector: 'pdz-chat-report-row',
  imports: [DatePipe, RouterLink, ButtonComponent],
  templateUrl: './chat-report-row.component.html',
  styleUrl: './chat-report-row.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'pdz-chat-report-row' },
})
export class ChatReportRowComponent {
  protected readonly profileLink = profileLink;
  readonly report = input.required<ChatReport>();
  readonly busy = input(false);
  readonly dismissed = output<void>();
  readonly removed = output<void>();

  protected readonly channel = computed(
    () => CHANNEL_LABELS[this.report().channel] ?? 'Chat',
  );

  protected readonly tournamentLink = computed(() => {
    const { league, tournament } = this.report();
    if (!league || !tournament) return null;
    return [
      '/',
      LEAGUE_ZONE_PATH,
      league.slug,
      'tournaments',
      tournament.slug,
    ];
  });
}
