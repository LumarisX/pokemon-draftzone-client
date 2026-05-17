import { Component, OnInit, inject } from '@angular/core';
import { NEWS } from './news.data';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { UnreadService } from '../../services/unread.service';
import { MarkdownModule } from 'ngx-markdown';

@Component({
  selector: 'pdz-news-core',
  imports: [CommonModule, RouterLink, MatButtonModule, MarkdownModule],
  templateUrl: './news-core.component.html',
  styleUrl: './news-core.component.scss',
})
export class NewsCoreComponent implements OnInit {
  private unreadService = inject(UnreadService);

  readonly news = NEWS;

  ngOnInit(): void {
    this.unreadService.newsCount.next('');
    localStorage.setItem('newsTime', Date.now().toString());
  }

  toDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }
}
