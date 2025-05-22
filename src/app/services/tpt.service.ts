import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThirdPartyToolService {
  constructor(private http: HttpClient) {}

  newPokepaste(
    paste: string,
    options: {
      title?: string;
      user?: string;
      notes?: string;
      teamPrivacy?: boolean;
    } = {},
  ) {
    return this.http.post('https://pokepast.es/create', {
      title: options.title,
      paste: paste,
      author: options.user || 'Pokemon DraftZone User',
      notes: options.notes + '\nCreated using Pokemon DraftZone',
      teamprivacy: options.teamPrivacy ? 'on' : 'off',
    });
  }
}
