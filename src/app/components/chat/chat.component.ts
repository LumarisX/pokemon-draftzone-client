import { Component, OnInit, OnDestroy, Input } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth0.service';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'pdz-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss'],
  imports: [FormsModule, CommonModule, MarkdownModule],
})
export class ChatComponent implements OnInit, OnDestroy {
  messages: any[] = [];
  newMessage: string = '';
  private messageSubscription!: Subscription;

  @Input({ required: true }) leagueId!: string;

  constructor(
    private chatService: ChatService,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.chatService.joinRoom(this.leagueId);
    this.messageSubscription = this.chatService.messages$.subscribe(
      (message) => {
        this.messages.push(message);
      },
    );
  }

  ngOnDestroy(): void {
    if (this.messageSubscription) {
      this.messageSubscription.unsubscribe();
    }
  }

  handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  sendMessage(): void {
    if (this.newMessage.trim()) {
      this.auth.user().subscribe((user) => {
        this.chatService.sendMessage(
          this.leagueId,
          this.newMessage,
          user?.username,
        );
        this.newMessage = '';
      });
    }
  }
}
