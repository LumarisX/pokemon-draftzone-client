import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnChanges,
  OnInit,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { LeagueZoneService } from '@pdz/features/league-zone/league-zone.service';
import { ButtonComponent } from '@pdz/shared/buttons/button/button.component';
import { IconComponent } from '@pdz/shared/images/icon/icon.component';
import { InputDirective } from '@pdz/shared/inputs/field/input.directive';
import { ChatChannel, ChatMessage } from './league-chat.model';

const POLL_INTERVAL_MS = 10000;

@Component({
  selector: 'pdz-league-chat',
  imports: [FormsModule, IconComponent, ButtonComponent, InputDirective],
  templateUrl: './league-chat.component.html',
  styleUrl: './league-chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeagueChatComponent implements OnInit, OnChanges {
  readonly channel = input.required<ChatChannel>();
  readonly target = input<string>();
  readonly heading = input('Chat');
  readonly placeholder = input('Write a message…');
  readonly ownTeamIds = input<string[]>([]);

  private readonly log = viewChild<ElementRef<HTMLDivElement>>('log');

  private leagueService = inject(LeagueZoneService);
  private destroyRef = inject(DestroyRef);
  private atBottom = true;
  private roomKey = '';

  readonly messages = signal<ChatMessage[]>([]);
  readonly canPost = signal(false);
  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly error = signal<string | null>(null);
  readonly draft = signal('');

  ngOnInit(): void {
    this.roomKey = this.currentRoomKey();
    this.refresh(true);
    const poller = setInterval(() => {
      if (document.visibilityState === 'visible') this.refresh(false);
    }, POLL_INTERVAL_MS);
    this.destroyRef.onDestroy(() => clearInterval(poller));
  }

  ngOnChanges(): void {
    const key = this.currentRoomKey();
    if (!this.roomKey || key === this.roomKey) return;
    this.roomKey = key;
    this.messages.set([]);
    this.loading.set(true);
    this.refresh(true);
  }

  onScroll(): void {
    const element = this.log()?.nativeElement;
    if (!element) return;
    this.atBottom =
      element.scrollHeight - element.scrollTop - element.clientHeight < 40;
  }

  isOwnSide(message: ChatMessage): boolean {
    if (message.isViewer) return true;
    return !!message.teamId && this.ownTeamIds().includes(message.teamId);
  }

  showsRole(message: ChatMessage): boolean {
    if (message.role === 'organizer') return message.author !== 'Organizer';
    return message.role === 'coach' && this.channel() === 'spectator';
  }

  roleLabel(message: ChatMessage): string {
    return message.role === 'organizer' ? 'Organizer' : 'Participant';
  }

  roleIcon(message: ChatMessage): string {
    return message.role === 'organizer' ? 'shield_person' : 'sports_esports';
  }

  timeOf(message: ChatMessage): string {
    const date = new Date(message.createdAt);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  send(): void {
    const text = this.draft().trim();
    if (!text || this.sending() || !this.canPost()) return;

    this.sending.set(true);
    this.error.set(null);

    this.leagueService
      .sendChatMessage(this.channel(), text, this.target())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ message }) => {
          this.messages.update((messages) => [...messages, message]);
          this.draft.set('');
          this.sending.set(false);
          this.atBottom = true;
          this.scrollToBottom();
        },
        error: (error) => {
          this.sending.set(false);
          this.error.set(error?.message || 'Message failed to send.');
        },
      });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  remove(message: ChatMessage): void {
    if (!message.canDelete) return;
    this.leagueService
      .deleteChatMessage(message.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () =>
          this.messages.update((messages) =>
            messages.filter((entry) => entry.id !== message.id),
          ),
        error: (error) =>
          this.error.set(error?.message || 'Could not remove that message.'),
      });
  }

  private currentRoomKey(): string {
    return `${this.channel()}:${this.target() ?? ''}`;
  }

  private refresh(initial: boolean): void {
    this.leagueService
      .getChatMessages(this.channel(), this.target())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (room) => {
          const grew = room.messages.length !== this.messages().length;
          this.messages.set(room.messages);
          this.canPost.set(room.canPost);
          this.loading.set(false);
          if (initial || (grew && this.atBottom)) this.scrollToBottom();
        },
        error: () => {
          this.loading.set(false);
          if (initial) this.error.set('Could not load the conversation.');
        },
      });
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const element = this.log()?.nativeElement;
      if (element) element.scrollTop = element.scrollHeight;
    });
  }
}
