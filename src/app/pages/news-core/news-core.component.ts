import { Component, OnInit, inject } from '@angular/core';
import { News, NewsService } from '../../services/news.service';
import { LoadingComponent } from '../../images/loading/loading.component';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { UnreadService } from '../../services/unread.service';

@Component({
  selector: 'pdz-news-core',
  imports: [CommonModule, LoadingComponent, RouterLink, MatButtonModule],
  templateUrl: './news-core.component.html',
  styleUrl: './news-core.component.scss',
})
export class NewsCoreComponent implements OnInit {
  private newsService = inject(NewsService);
  private unreadService = inject(UnreadService);


  news?: News[];
  ngOnInit(): void {
    this.newsService.getNews().subscribe((news) => {
      this.news = news;
      this.unreadService.newsCount.next('');
      localStorage.setItem('newsTime', Date.now().toString());
    });
  }

  toDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }
}
