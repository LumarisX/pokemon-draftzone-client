import { Injectable, inject } from '@angular/core';
import { ApiService } from './api.service';

export const newsPath = 'news';

export type Section =
  | {
      type: 'para';
      description: string;
    }
  | { type: 'list'; listTitle?: string; items: string[]; ordered?: boolean }
  | { type: 'heading'; headingText: string }
  | {
      type: 'buttons';
      buttons: {
        text: string;
        disabled?: boolean;
        link: string;
        newWindow?: boolean;
      }[];
    }
  | {
      type: 'images';
      images: { title?: string; imageUrl: string; size?: 'small' | 'medium' }[];
    };
export type News = {
  title: string;
  sections: Section[];
  createdAt: string;
};
@Injectable({
  providedIn: 'root',
})
export class NewsService {
  private api = inject(ApiService);


  getNews() {
    return this.api.get<News[]>([newsPath], false);
  }
}
