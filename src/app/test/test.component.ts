import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '@auth0/auth0-angular';
import { Observable, concatMap, map, tap } from 'rxjs';
import { CoreModule } from '../sprite/sprite.module';
import { Auth0Service } from '../auth/auth0.service';

@Component({
  selector: 'test',
  standalone: true,
  imports: [CommonModule, RouterModule, CoreModule],
  template: `
    <div class="p-2 m-2 border-2 bg-cyan-100 rounded-xl border-cyan-200">
      <ul *ngIf="auth.user$ | async as user">
        <li>{{ user.name }}</li>
        <li>{{ user.email }}</li>
        <li>{{ user.nickname }}</li>
        <li>{{ user.sub }}</li>
      </ul>
      <div *ngIf="metadata">
        <pre>{{ metadata | json }}</pre>
      </div>
      <div *ngIf="accessToken">
        <pre>{{ accessToken }}</pre>
      </div>
      <div *ngIf="drafts">
        <button (click)="getDrafts()">Get Drafts</button>
        <pre>{{ drafts | json }}</pre>
      </div>
    </div>
  `,
})
export class TestComponent implements OnInit {
  metadata = {};
  accessToken = 'No token';
  drafts = {};

  // Inject both AuthService and HttpClient
  constructor(
    public auth: AuthService,
    private http: HttpClient,
    private auth0: Auth0Service
  ) {}

  ngOnInit(): void {
    this.auth.user$
      .pipe(
        concatMap((user) =>
          // Use HttpClient to make the call
          this.http.get(
            encodeURI(
              `https://dev-wspjxi5f6mjqsjea.us.auth0.com/api/v2/users/${user?.sub}`
            )
          )
        ),
        map((user: any) => user.user_metadata),
        tap((meta) => (this.metadata = meta))
      )
      .subscribe();

    this.auth
      .getAccessTokenSilently()
      .subscribe((data) => (this.accessToken = data));
  }

  getDrafts() {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        authorization: `Bearer ${this.accessToken}`,
      }),
    };

    console.log('here');
    this.http
      .get(`http://localhost:9960/draft/lumaris/teams`, httpOptions)
      .subscribe((data) => {
        this.drafts = data;
      });
  }
}
