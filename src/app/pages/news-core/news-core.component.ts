import { Component, OnInit } from '@angular/core';
import { News, NewsService } from '../../services/news.service';
import { LoadingComponent } from '../../images/loading/loading.component';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'pdz-news-core',
  imports: [CommonModule, LoadingComponent, RouterLink, MatButtonModule],
  templateUrl: './news-core.component.html',
  styleUrl: './news-core.component.scss',
})
export class NewsCoreComponent implements OnInit {
  constructor(private newsService: NewsService) {}

  news?: News[];
  ngOnInit(): void {
    this.newsService.getNews().subscribe((news) => {
      this.news = news;
    });
  }

  toDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }
}
