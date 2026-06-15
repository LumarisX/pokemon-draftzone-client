import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { NEWS } from '@pdz/features/homepage/news-core/news.data';

export const newsPath = 'news';

export type Section =
  | {
      type: 'para';
      description: string;
    }
  | {
      type: 'markdown';
      description: string;
    }
  | { type: 'list'; listTitle?: string; items: string[]; ordered?: boolean }
  | { type: 'heading'; headingText: string }
  | {
      type: 'buttons';
      buttons: {
        text: string;
        disabled?: boolean;
        link?: string;
        href?: string;
        newWindow?: boolean;
      }[];
    }
  | {
      type: 'images';
      images: {
        title?: string;
        imageUrl: string;
        size?: 'small' | 'medium' | 'large';
      }[];
    }
  | {
      type: 'columns';
      columns: Section[][];
    };
export type News = {
  title: string;
  sections: Section[];
  date: string;
};
@Injectable({
  providedIn: 'root',
})
export class NewsService {
  getNews() {
    return of(NEWS);
  }
}
